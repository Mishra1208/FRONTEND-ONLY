// rmptest/rmp_scrape.mjs
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
puppeteer.use(StealthPlugin());

const SCHOOL_NAME = "Concordia University";
const DEFAULT_SCHOOL_ID = "18443";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseIntSafe(v) {
  const n = parseInt(String(v ?? "").replace(/\D+/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}
function fmtPct(v) {
  const n = parseIntSafe(v);
  return n == null ? "—" : `${n}%`;
}
function formatLine(r) {
  const bits = [
    r.name,
    r.dept ? `• ${r.dept}` : null,
    r.school ? `• ${r.school}` : null,
    r.quality ? `• Avg Rating: ${r.quality}` : null,
    r.difficulty ? `• Avg Difficulty: ${r.difficulty}` : null,
    r.numRatings ? `• Num Ratings: ${r.numRatings}` : null,
    r.wouldTakeAgain ? `• Would Take Again: ${fmtPct(r.wouldTakeAgain)}` : null,
  ].filter(Boolean);
  return bits.join(" ");
}

async function main() {
  // Usage: node rmp_scrape.mjs "Name" [schoolId] [--all]
  const [, , rawName, rawSchoolId, maybeAll] = process.argv;
  if (!rawName) {
    console.error('Usage: node rmp_scrape.mjs "Professor Name" [schoolId] [--all]');
    process.exit(1);
  }
  const profName = rawName.trim();
  const schoolId = rawSchoolId || DEFAULT_SCHOOL_ID;
  const showAllUniversities = String(maybeAll || "").toLowerCase() === "--all";

  const url = `https://www.ratemyprofessors.com/search/professors/${schoolId}?q=${encodeURIComponent(
    profName
  )}`;

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(1500);
    try {
      await page.waitForSelector('a[href^="/professor/"], [data-testid*="noResults"]', {
        timeout: 7000,
      });
    } catch {}

    const results = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href^="/professor/"]'));
      if (!anchors.length) return [];

      const uniq = new Map();
      for (const a of anchors) {
        const name = (a.textContent || "").trim();
        const href = a.getAttribute("href");
        const card =
          a.closest("article") ||
          a.closest('[class*="Card"]') ||
          a.closest("div")?.parentElement ||
          a.closest("div");
        const txt = (card?.innerText || document.body.innerText || "")
          .replace(/\s+/g, " ")
          .trim();

        const quality =
          (txt.match(/QUALITY\s*([\d.]+)/i) || [])[1] ||
          (txt.match(/\b([0-9.]+)\s*(?:quality|overall)/i) || [])[1] ||
          null;
        const difficulty =
          (txt.match(/level of difficulty\s*([\d.]+)/i) || [])[1] ||
          (txt.match(/\bdifficulty[:\s]+([\d.]+)/i) || [])[1] ||
          null;
        const would =
          (txt.match(/(\d{1,3})%\s*would take again/i) || [])[1] ||
          (txt.match(/would take again\s*[:\s]+(\d{1,3})%/i) || [])[1] ||
          null;
        const numRatings = (txt.match(/(\d+)\s*ratings?/i) || [])[1] || null;

        const schoolMatch =
          txt.match(/\bConcordia University\b/i) ||
          txt.match(/\b[A-Za-z .'-]*University\b/i);
        const school = schoolMatch ? schoolMatch[0].trim() : null;

        const deptMatch = txt.match(
          /\b(Computer Science|Mathematics|Engineering|Biology|Chemistry|Physics|Statistics|Business|Finance|Accounting|Marketing|Psychology|Sociology|Philosophy|History|Political Science|Fine Arts|Anthropology)\b/i
        );
        const dept = deptMatch ? deptMatch[0] : null;

        if (href && name && !uniq.has(href)) {
          uniq.set(href, {
            name,
            school,
            dept,
            quality,
            difficulty,
            wouldTakeAgain: would,
            numRatings,
            url: `https://www.ratemyprofessors.com${href}`,
            blockText: txt,
          });
        }
      }
      return Array.from(uniq.values());
    });

    // 🔒 Concordia-only by default (unless --all is passed)
    const pool = showAllUniversities
      ? results
      : results.filter(
          (r) =>
            (r.school && /concordia university/i.test(r.school)) ||
            /concordia university/i.test(r.blockText || "")
        );

    if (pool.length === 0) {
      console.log("No matches found.");
      return;
    }

    // score: name similarity + ratings volume (+ small bump if has ratings)
    const nameLc = profName.toLowerCase();
    const scored = pool
      .map((r) => {
        const n = (r.name || "").toLowerCase();
        let score = 0;
        if (n === nameLc) score += 3;
        if (n.startsWith(nameLc)) score += 2;
        if (n.includes(nameLc)) score += 1;
        const ratingsNum = parseInt(String(r.numRatings || "").replace(/\D+/g, ""), 10) || 0;
        score += Math.min(2, Math.floor(ratingsNum / 10));
        if (ratingsNum > 0) score += 1;
        return { score, r };
      })
      .sort((a, b) => b.score - a.score)
      .map((x) => x.r);

    const top = scored[0];

    console.log(`Found ${scored.length} match(es):\n`);
    console.log(`Top match: ${formatLine(top)}`);
    if (top?.url) console.log(`Profile: ${top.url}`);

    if (scored.length > 1) {
      console.log(`\nOther matches:`);
      scored.slice(1).forEach((r, i) => {
        console.log(`${i + 1}) ${formatLine(r)}`);
        if (r?.url) console.log(`   Profile: ${r.url}`);
      });
    }
  } catch (err) {
    console.error("Scrape error:", err?.message || String(err));
  } finally {
    await browser.close();
  }
}

main();
