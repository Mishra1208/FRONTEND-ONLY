// "use client";  // keep this if this file is imported by a Client Component
import Papa from "papaparse";

let MOCK = [];

let loadPromise;
async function ensureLoaded() {
  if (MOCK.length) return MOCK;
  if (!loadPromise) {
    loadPromise = (async () => {
      const res = await fetch("/courses.csv");
      const text = await res.text();
      const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });

      const norm = (v) => (typeof v === "string" ? v.trim() : v);

      // helper to coalesce possible header variants
      const pick = (row, keys) => {
        for (const k of keys) {
          if (row[k] != null && String(row[k]).trim() !== "") return norm(row[k]);
        }
        return undefined;
      };

      MOCK = data.map((r) => {
        const subject = pick(r, ["subject", "Subject"]);
        const catalogue = pick(r, ["catalogue", "Catalogue", "catalog"]);
        const title = pick(r, ["title", "Title", "course_name"]);
        const term = pick(r, ["term", "Term"]);
        const session = pick(r, ["session", "Session"]) || "Lecture";
        const creditsRaw = pick(r, ["credits", "Credits", "course_cre", "course_credits", "course_cr", "course_credit"]);
        const credits = Number(creditsRaw ?? 0);

        return {
          course_id: pick(r, ["course_id", "Course_ID"]) || `${subject}-${catalogue}`,
          subject,
          catalogue,
          title,
          credits: Number.isFinite(credits) ? credits : 0,
          term,
          session,
        };
      });

      return MOCK;
    })();
  }
  return loadPromise;
}

export async function fetchPopularCourses() {
  const data = await ensureLoaded();
  return data.slice(0, 6);
}

export async function fetchCourses(opts = {}) {
  const {
    search = "",
    subject = "ALL",
    term = "ALL",
    minCredits = 0,
    maxCredits = 6,
  } = opts;

  const data = await ensureLoaded();
  const s = search.trim().toLowerCase();

  return data.filter((c) => {
    const text = `${c.subject ?? ""} ${c.catalogue ?? ""} ${c.title ?? ""}`.toLowerCase();
    const matchSearch = s ? text.includes(s) : true;
    const matchSubject = subject === "ALL" ? true : c.subject === subject;
    const matchTerm = term === "ALL" ? true : (c.term?.toLowerCase() === term.toLowerCase());
    const cr = Number(c.credits ?? 0);
    const matchCredits = cr >= minCredits && cr <= maxCredits;
    return matchSearch && matchSubject && matchTerm && matchCredits;
  });
}

export { MOCK };
