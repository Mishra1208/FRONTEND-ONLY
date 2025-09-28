
/* eslint-disable no-console */

const fs = require("fs/promises");
const path = require("path");
const Papa = require("papaparse");

// Where the CSV might live
const CSV_CANDIDATES = [
  path.join(process.cwd(), "public", "courses_merged.csv"),
  path.join(process.cwd(), "src", "data", "courses_merged.csv"),
  path.join(process.cwd(), "courses_merged.csv"),
];

const OUT_PATH = path.join(process.cwd(), "public", "course_index.json");

const safe  = (v) => (v ?? "").toString().trim();
const upper = (v) => safe(v).toUpperCase();
const slug  = (code) => safe(code).replace(/\s+/g, "-").toLowerCase(); // "COMP 248" → "comp-248"

async function findCsvPath() {
  for (const p of CSV_CANDIDATES) {
    try { await fs.access(p); return p; } catch {}
  }
  throw new Error("Could not find courses_merged.csv in public/ or src/data/");
}

async function loadCsvRows(filePath) {
  const text = await fs.readFile(filePath, "utf8");
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  if (parsed.errors?.length) {
    console.warn("CSV parse warnings (showing first 3):", parsed.errors.slice(0,3));
  }
  return parsed.data || [];
}

function buildIndex(rows) {
  const byCode = new Map();

  for (const r of rows) {
    const subject = upper(r.subject);
    const catalogue = upper(r.catalogue);
    if (!subject || !catalogue) continue;

    const code = `${subject} ${catalogue}`;
    const key  = slug(code);

    const entry = byCode.get(key) || {
      key, code, subject, catalogue,
      title: safe(r.title),
      credits: safe(r.course_credit || r.credits || r.credit || ""),
      terms: new Set(),
      sessions: new Set(),
      description: "",
      prereq: "",
      equivalent: "",
      career: safe(r.career || ""),
      location: safe(r.location_description || ""),
      course_name: safe(r.course_name || ""),
    };

    const term = safe(r.term);
    const session = safe(r.session);
    if (term) entry.terms.add(term);
    if (session) entry.sessions.add(session);

    if (!entry.description && safe(r.description)) entry.description = safe(r.description);
    if (!entry.prereq && safe(r.prereqdescription)) entry.prereq = safe(r.prereqdescription);
    if (!entry.equivalent && safe(r.equivalent_course_description)) entry.equivalent = safe(r.equivalent_course_description);
    if (safe(r.title) && safe(r.title).length > safe(entry.title).length) entry.title = safe(r.title);

    byCode.set(key, entry);
  }

  const termOrder = ["Fall", "Winter", "Summer"];
  const sortTerms = (a, b) => termOrder.indexOf(a) - termOrder.indexOf(b);

  return Array.from(byCode.values()).map((e) => ({
    ...e,
    terms: Array.from(e.terms).sort(sortTerms),
    sessions: Array.from(e.sessions),
  }));
}

async function main() {
  const csvPath = await findCsvPath();
  console.log("Reading:", csvPath);

  const rows = await loadCsvRows(csvPath);
  const index = buildIndex(rows);

  const map = {};
  for (const it of index) map[it.key] = it;

  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });
  await fs.writeFile(OUT_PATH, JSON.stringify({ list: index, map }, null, 2), "utf8");

  console.log(`Wrote ${index.length} unique course entries → ${OUT_PATH}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
