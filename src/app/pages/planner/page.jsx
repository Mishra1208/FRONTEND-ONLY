"use client";

import { useEffect, useState } from "react";
import { exportPlannerToExcel } from "@/lib/exportPlannerExcel";
import styles from "./planner.module.css";

const KEY = "conu-planner:selected";

/* ------------------------------- helpers -------------------------------- */
const safeUpper = (v) => (v ?? "").toString().trim().toUpperCase();

const loadList = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
};

const saveList = (arr) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(arr));
  } catch {}
};

function courseKey(c) {
  const subj = safeUpper(c?.subject);
  const cat  = safeUpper(c?.catalogue);
  const term = safeUpper(c?.term) || "TERMLESS";
  return `${subj}-${cat}-${term}`;
}

function dedupeByOffering(list) {
  const seen = new Set();
  const out = [];
  for (const it of list) {
    const k = courseKey(it);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(it);
    }
  }
  return out;
}

function broadcastPlannerChange() {
  try {
    window.dispatchEvent(new Event("planner:update"));
  } catch {}
}

/* -------------------------------- page ----------------------------------- */
export default function PlannerPage() {
  const [items, setItems] = useState([]);
  const [exporting, setExporting] = useState(false);

  const refresh = () => {
    const raw   = loadList();
    const clean = dedupeByOffering(raw);
    if (clean.length !== raw.length) saveList(clean);
    setItems(clean);
  };

  useEffect(() => {
    refresh();

    const onStorage = (e) => { if (!e || e.key === KEY) refresh(); };
    const onPlannerUpdate = () => refresh();
    const onVisible = () => { if (!document.hidden) refresh(); };

    window.addEventListener("storage", onStorage);
    window.addEventListener("planner:update", onPlannerUpdate);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("planner:update", onPlannerUpdate);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  function removeOffering(offering) {
    const k = courseKey(offering);
    const next = loadList().filter((it) => courseKey(it) !== k);
    saveList(next);
    setItems(next);
    broadcastPlannerChange();
  }

  async function handleExport() {
    try {
      setExporting(true);
      await exportPlannerToExcel(items);
    } finally {
      setExporting(false);
    }
  }

  return (
    <main className="container" style={{ paddingTop: 16 }}>
      <h1 className="h2">Planner</h1>

      <div className="card" style={{ borderRadius: "var(--radius)", overflow: "hidden" }}>
        <div className={styles.toolbar}>
          <div style={{ fontWeight: 800 }}>Your Planner</div>

          <button
            className={styles.exportBtn}
            onClick={handleExport}
            disabled={!items.length || exporting}
            aria-busy={exporting ? "true" : "false"}
          >
            {exporting ? "Preparing…" : "Download Excel"}
          </button>
        </div>

        {items.length === 0 ? (
          <div className="body">No courses yet. Add from the Courses page.</div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
            {items.map((c) => (
              <li
                key={courseKey(c)}
                className="card"
                style={{
                  padding: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {c?.subject} {c?.catalogue} — {c?.title}
                  </div>
                  <div className="cardMeta">
                    {(c?.credits ?? "-")} cr {c?.session ? `• ${c.session}` : ""} {c?.term ? `• ${c.term}` : ""}
                  </div>
                </div>

                <button
                  onClick={() => removeOffering(c)}
                  className="addBtn"
                  style={{
                    background: "linear-gradient(90deg,#ef4444,#f97316)",
                    padding: "6px 12px",
                    borderRadius: 9999,
                    fontWeight: 700,
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}