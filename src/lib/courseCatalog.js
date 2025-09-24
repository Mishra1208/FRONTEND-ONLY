// src/lib/courseCatalog.js
"use server";
import fs from "fs/promises";
import path from "path";
import { parse } from "csv-parse/sync";

const slug = (code) => code.replace(/\s+/g, "-").toLowerCase(); // "COMP 108" -> "comp-108"

export async function loadCourseDescriptions() {
  const csvPath = path.join(process.cwd(), "src", "data", "course_descriptions.csv");
  const text = await fs.readFile(csvPath, "utf8");
  const rows = parse(text, { columns: true, skip_empty_lines: true });

  // Normalize + derive ids
  return rows.map((r) => ({
    id: slug(String(r.code || "").trim()),
    code: String(r.code || "").trim(),
    title: String(r.title || "").trim(),
    credits: String(r.credits || "").trim(),
    description: String(r.description || "").trim(),
    prereq: String(r.prereq || "").trim(),
    equivalent: String(r.equivalent || "").trim(),
  }));
}

export { slug };
