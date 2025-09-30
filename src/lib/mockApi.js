// src/lib/mockApi.js
import Papa from "papaparse";

let DATA = [];
let LOAD_PROMISE = null;

/* ---------------------- helpers ---------------------- */
const norm = (v) => (typeof v === "string" ? v.trim() : v);
const pick = (row, keys) => {
  for (const k of keys) {
    const val = row[k];
    if (val != null && String(val).trim() !== "") return norm(val);
  }
  return undefined;
};

// Map "Fall 2024", "WINTER 2025", "Fa", etc. → "Fall" | "Winter" | "Summer" | ""
function normalizeTerm(v) {
  const s = String(v || "").toLowerCase();
  if (/(fall|fa)/.test(s)) return "Fall";
  if (/winter/.test(s)) return "Winter";
  if (/summer|su/.test(s)) return "Summer";
  return "";
}

function parseCredits(v) {
  const m = String(v ?? "").replace(",", ".").match(/[0-9]+(\.[0-9]+)?/);
  return m ? Number.parseFloat(m[0]) : 0;
}

/* -------------------- load once ---------------------- */
async function ensureLoaded() {
  if (DATA.length) return DATA;
  if (!LOAD_PROMISE) {
    LOAD_PROMISE = (async () => {
      const res = await fetch("/courses_merged.csv", { cache: "no-store" });
      const text = await res.text();
      const { data: rows } = Papa.parse(text, { header: true, skipEmptyLines: true });

      const ALLOW = new Set(["COMP", "COEN", "SOEN", "MECH", "ENGR", "ENCS", "AERO"]);

      DATA = rows
        .map((r) => {
          const subject = (pick(r, ["subject", "Subject", "SUBJECT"]) || "").toUpperCase();
          if (!ALLOW.has(subject)) return null;

          const catalogue = String(
            pick(r, ["catalogue", "Catalogue", "catalog", "catalogue_number", "number"]) ?? ""
          ).trim();

          const title =
            pick(r, ["title", "Title", "course_title", "course_name"]) || "";

          // Normalize term to season
          const termRaw = pick(r, ["term", "Term", "semester", "Semester"]) || "";
          const term = normalizeTerm(termRaw);

          const session = pick(r, ["session", "Session", "format"]) || "13W";
          const credits = parseCredits(
            pick(r, ["credits", "Credits", "course_credit", "course_credits", "course_cre", "course_cr"])
          );

          if (!subject || !catalogue || !title) return null;

          return {
            course_id: `${subject}-${catalogue}`,
            subject,
            catalogue,
            title: String(title).trim(),
            credits: Number.isFinite(credits) ? credits : 0,
            term,                 // "Fall" | "Winter" | "Summer" | ""
            session: String(session).trim(),
          };
        })
        .filter(Boolean);

      return DATA;
    })();
  }
  return LOAD_PROMISE;
}

/* ---------------- public API ----------------- */
export async function fetchSubjects() {
  const data = await ensureLoaded();
  const have = new Set(data.map((d) => d.subject));
  const ORDER = ["COMP", "COEN", "SOEN", "MECH", "ENGR", "ENCS", "AERO"];
  return ORDER.filter((s) => have.has(s));
}

export async function fetchCourses(opts = {}) {
  const {
    search = "",
    subject = "ALL",
    term = "ALL",           // expects "Fall" | "Winter" | "Summer" | "ALL"
    minCredits = 0,
    maxCredits = 6,
  } = opts;

  const q = search.trim().toLowerCase();
  const data = await ensureLoaded();

  // 1) filter
  const filtered = data.filter((c) => {
    const hay = `${c.subject} ${c.catalogue} ${c.title}`.toLowerCase();
    const matchSearch = q ? hay.includes(q) : true;
    const matchSubject = subject === "ALL" ? true : c.subject === subject;
    const matchTerm = term === "ALL" ? true : c.term === term; // already normalized
    const cr = Number(c.credits ?? 0);
    const matchCredits = cr >= Number(minCredits) && cr <= Number(maxCredits);
    return matchSearch && matchSubject && matchTerm && matchCredits;
  });

  // 2) de-dupe: only one row per (subject, catalogue, season)
  const byOffering = new Map();
  for (const c of filtered) {
    const key = `${c.subject}-${c.catalogue}-${c.term || "TERMLESS"}`; // EXACTLY the same shape used in the list key
    // If we see duplicates keep the first (or prefer the one with a non-empty session)
    if (!byOffering.has(key)) byOffering.set(key, c);
    else if (!byOffering.get(key).session && c.session) byOffering.set(key, c);
  }

  // 3) stable sort for nice UI ordering
  return Array.from(byOffering.values()).sort((a, b) =>
    (`${a.subject} ${a.catalogue} ${a.term}`).localeCompare(
      `${b.subject} ${b.catalogue} ${b.term}`,
      "en",
      { numeric: true }
    )
  );
}

export { DATA as MOCK };
