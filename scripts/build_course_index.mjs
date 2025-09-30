// node scripts/build_course_index.mjs
import fs from "fs/promises";
import path from "node:path";

const root = process.cwd();

// ⚠️ Point SRC to the SAME catalog your grid uses.
// If your grid reads from `public/courses_catalog.json`, keep this.
// If you have a different file (e.g. `public/merged_courses.json`), change it here.
const SRC = path.join(root, "public", "courses_catalog.json");
const DST = path.join(root, "public", "course_index.json");

const raw = JSON.parse(await fs.readFile(SRC, "utf8"));

// Normalize to exactly what `route.js` expects
const list = raw
  .map(r => ({
    subject: String(r.subject || "").toUpperCase(),
    // ensure just the 3-digit number lives in `catalogue`
    catalogue: String(r.catalogue ?? r.code ?? "")
      .match(/\d{3}/)?.[0] ?? "",
    title: r.title || "",
    credits: r.credits ?? r.cr ?? "",
    terms: Array.isArray(r.terms) ? r.terms : (r.term ? [r.term] : []),
    sessions: Array.isArray(r.sessions) ? r.sessions : (r.session ? [r.session] : []),
    prereq: r.prereq || r.prerequisite || r["pre-requisite"] || "",
    equivalent: r.equivalent || "",
    location: r.location || "",
    description: r.description || r.desc || ""
  }))
  .filter(x => x.subject && /^\d{3}$/.test(x.catalogue));

await fs.writeFile(DST, JSON.stringify({ list }, null, 2), "utf8");
console.log(`Wrote ${list.length} records → ${path.relative(root, DST)}`);
