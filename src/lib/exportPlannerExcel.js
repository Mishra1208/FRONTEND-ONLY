// src/lib/exportPlannerExcel.js
import XlsxPopulate from "xlsx-populate/browser/xlsx-populate";

/** Normalize strings safely */
const S = (v) => (v ?? "").toString().trim();
const titleCase = (t) => (S(t).toLowerCase() === "fall"   ? "Fall"   :
                          S(t).toLowerCase() === "winter" ? "Winter" :
                          S(t).toLowerCase() === "summer" ? "Summer" : S(t));

const num = (v) => {
  const n = typeof v === "number" ? v : parseFloat(S(v));
  return Number.isFinite(n) ? n : null;
};

const COORDS = {
  Fall:   { startRow: 9,  rows: 6,  colSerial: "B", colCourse: "C", colCredits: "D", totalRow: 15, totalCol: "D" },
  Winter: { startRow: 9,  rows: 6,  colSerial: "I", colCourse: "J", colCredits: "K", totalRow: 15, totalCol: "K" },
  Summer: { startRow: 9,  rows: 6,  colSerial: "M", colCourse: "N", colCredits: "O", totalRow: 15, totalCol: "O" },
};

function colRow(col, row) { return `${col}${row}`; }

/**
 * Fill a single semester table on the sheet.
 */
function fillSemester(ws, term, items) {
  const cfg = COORDS[term];
  if (!cfg) return;

  // Clear the table first
  for (let i = 0; i < cfg.rows; i++) {
    const r = cfg.startRow + i;
    ws.cell(colRow(cfg.colSerial,  r)).value("");
    ws.cell(colRow(cfg.colCourse,  r)).value("");
    ws.cell(colRow(cfg.colCredits, r)).value("");
  }

  // Write rows
  let rowIdx = 0;
  let total = 0;
  for (const [i, c] of items.entries()) {
    if (rowIdx >= cfg.rows) break; // avoid overflow, keep template neat

    const r = cfg.startRow + rowIdx;
    const courseId = `${S(c.subject).toUpperCase()} ${S(c.catalogue).toUpperCase()}`.trim();
    const label    = c.title ? `${courseId} — ${c.title}` : courseId;
    const credits  = num(c.credits);

    ws.cell(colRow(cfg.colSerial,  r)).value(i + 1);
    ws.cell(colRow(cfg.colCourse,  r)).value(label);
    if (credits != null) {
      ws.cell(colRow(cfg.colCredits, r)).value(credits);
      total += credits;
    } else {
      ws.cell(colRow(cfg.colCredits, r)).value("");
    }

    rowIdx++;
  }

  // Total (write the value; if you want a formula, use e.g. `=SUM(D9:D14)`)
  ws.cell(colRow(cfg.totalCol, cfg.totalRow)).value(total || "");
}

/**
 * Export the planner list to Excel using the public template.
 * @param {Array} planner - array of courses from localStorage (subject, catalogue, title, term, credits)
 */
export async function exportPlannerToExcel(planner) {
  // Group by normalized term
  const byTerm = { Fall: [], Winter: [], Summer: [] };
  for (const c of planner || []) {
    const t = titleCase(c?.term);
    if (byTerm[t]) byTerm[t].push(c);
  }

  // Load template
  const resp = await fetch("/MyPlannedCourses.xlsx");
  if (!resp.ok) throw new Error("Template not found at /MyPlannedCourses.xlsx");
  const ab = await resp.arrayBuffer();

  const wb = await XlsxPopulate.fromDataAsync(ab);
  const ws = wb.sheet(0); // first sheet

  fillSemester(ws, "Fall",   byTerm.Fall);
  fillSemester(ws, "Winter", byTerm.Winter);
  fillSemester(ws, "Summer", byTerm.Summer);

  const out = await wb.outputAsync(); // Blob in browser
  const url = URL.createObjectURL(out);
  const a = document.createElement("a");
  a.href = url;
  a.download = "MyPlannedCourses.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
