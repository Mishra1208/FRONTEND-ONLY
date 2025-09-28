"use server";
import fs from "fs/promises";
import path from "path";
import Papa from "papaparse";

export const slug = (code) => (code ?? "").toString().trim().replace(/\s+/g, "-").toLowerCase();

export async function loadCourseDescriptions() {
  // Re-use the same source as everything else
  const csvPath = path.join(process.cwd(), "public", "courses_merged.csv");
  const text = await fs.readFile(csvPath, "utf8");
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  const rows = parsed.data || [];

  // Normalize a compact shape the descriptions page needs
  return rows.map((r) => {
    const subj = (r.subject ?? "").toString().trim().toUpperCase();
    const cat = (r.catalogue ?? "").toString().trim().toUpperCase();
    const code = `${subj} ${cat}`;

    return {
      id: slug(code),
      code,
      title: (r.title ?? "").toString().trim(),
      credits: (r.course_credit ?? r.credits ?? "").toString().trim(),
      description: (r.description ?? "").toString().trim(),
      prereq: (r.prereqdescription ?? "").toString().trim(),
      equivalent: (r.equivalent_course_description ?? "").toString().trim(),
      term: (r.term ?? "").toString().trim(),
      session: (r.session ?? "").toString().trim(),
    };
  });
}
