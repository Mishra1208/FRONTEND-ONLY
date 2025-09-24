"use client";

import { useEffect, useState } from "react";
import styles from "./descriptions.module.css";

/* helpers */
const anchorIdFor = (r) =>
  `${(r?.subject || "").toUpperCase()}-${(r?.catalogue || "").toUpperCase()}`;

// tiny CSV parser that handles quoted commas
function parseCSV(text) {
  const rows = [];
  let i = 0, cell = "", inQ = false, row = [];
  while (i < text.length) {
    const ch = text[i], nx = text[i + 1];
    if (inQ) {
      if (ch === '"' && nx === '"') { cell += '"'; i += 2; continue; }
      if (ch === '"') { inQ = false; i++; continue; }
      cell += ch; i++; continue;
    }
    if (ch === '"') { inQ = true; i++; continue; }
    if (ch === ",") { row.push(cell); cell = ""; i++; continue; }
    if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; i++; continue; }
    if (ch === "\r") { i++; continue; }
    cell += ch; i++;
  }
  row.push(cell); rows.push(row);
  const header = rows.shift();
  return rows
    .filter((r) => r.length && r.some(Boolean))
    .map((r) => Object.fromEntries(header.map((h, idx) => [h.trim(), r[idx] ?? ""])));
}

export default function DescriptionsPage() {
  const [items, setItems] = useState([]);
  const [openId, setOpenId] = useState(null);

  // load + de-duplicate by subject+catalogue
  useEffect(() => {
    let alive = true;
    (async () => {
      const text = await fetch("/courses_merged.csv", { cache: "force-cache" }).then((r) => r.text());
      if (!alive) return;
      const all = parseCSV(text);

      const map = new Map();
      for (const r of all) {
        const key = `${(r.subject || "").toUpperCase()}-${(r.catalogue || "").toUpperCase()}`;
        if (!map.has(key)) map.set(key, r);
      }
      const arr = Array.from(map.values()).sort((a, b) =>
        `${a.subject} ${a.catalogue}`.localeCompare(`${b.subject} ${b.catalogue}`, "en", { numeric: true })
      );

      setItems(arr);

      const hash = decodeURIComponent((window.location.hash || "").slice(1));
      if (hash) setOpenId(hash);
    })();
    return () => { alive = false; };
  }, []);

  // open/scroll when hash changes (e.g., user clicks another deep link)
  useEffect(() => {
    const onHash = () => {
      const id = decodeURIComponent((window.location.hash || "").slice(1));
      if (id) setOpenId(id);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // after render, scroll to open item
  useEffect(() => {
    if (!items.length || !openId) return;
    const raf = requestAnimationFrame(() => {
      const el = document.getElementById(openId);
      if (el) {
        el.scrollIntoView({ block: "start", behavior: "smooth" });
        el.classList.add(styles.justFocused);
        setTimeout(() => el.classList.remove(styles.justFocused), 900);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [items.length, openId]);

  // click handler that *controls* the toggle (single-click open)
  const handleSummaryClick = (id, isOpen) => (e) => {
    // prevent native <details> toggle; we control via state
    e.preventDefault();
    const next = isOpen ? null : id;
    setOpenId(next);
    if (next) {
      history.replaceState(null, "", `#${encodeURIComponent(next)}`);
    } else {
      history.replaceState(null, "", location.pathname + location.search);
    }
  };

  return (
    <main className={styles.wrap}>
      <h1 className={styles.title}>Course Descriptions</h1>

      <div className={styles.accordion}>
        {items.map((r) => {
          const id = anchorIdFor(r);
          const isOpen = openId === id;
          const credits = Number(r.course_credit || r.credits || 0).toFixed(1) + " credits";

          return (
            <details id={id} key={id} className={styles.item} open={isOpen}>
              <summary className={styles.summary} onClick={handleSummaryClick(id, isOpen)}>
                <span className={styles.code}>
                  {(r.subject || "").toUpperCase()} {(r.catalogue || "").toUpperCase()}
                </span>
                <span className={styles.name}>{r.title || r.course_name || ""}</span>
                <span className={styles.credits}>{credits}</span>
              </summary>

              <div className={styles.body}>
                {r.description && <p className="body">{r.description}</p>}
                {(r.prereqdescription || r.equivalent_course_description) && (
                  <ul>
                    {r.prereqdescription && (
                      <li>
                        <strong className={styles.label}>Prerequisite/Corequisite:</strong>{" "}
                        {r.prereqdescription}
                      </li>
                    )}
                    {r.equivalent_course_description && (
                      <li>
                        <strong className={styles.label}>Equivalent:</strong>{" "}
                        {r.equivalent_course_description}
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </main>
  );
}
