"use client";

import { useEffect, useState } from "react";
import styles from "./descriptions.module.css";

/* helpers */
const anchorIdFor = (r) =>
  `${(r?.subject || "").toUpperCase()}-${(r?.catalogue || "").toUpperCase()}`;

/** tiny CSV parser that handles quoted commas and newlines */
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
  const header = rows.shift().map((h) => h.trim());
  return rows
    .filter((r) => r.length && r.some(Boolean))
    .map((r) => Object.fromEntries(header.map((h, idx) => [h, r[idx] ?? ""])));
}

const norm = (v) => (typeof v === "string" ? v.trim() : v);
const pick = (row, keys) => {
  for (const k of keys) {
    if (row[k] != null && String(row[k]).trim() !== "") return norm(row[k]);
  }
  return undefined;
};
const parseCredits = (v) => {
  if (v == null) return 0;
  const m = String(v).replace(",", ".").match(/[0-9]+(\.[0-9]+)?/);
  return m ? Number.parseFloat(m[0]) : 0;
};
const longer = (a = "", b = "") =>
  (String(a).trim().length >= String(b).trim().length ? a : b);

/** if description is missing, pick the longest paragraph-like cell */
function sniffDescriptionFromAnyCell(row, { avoid = [] } = {}) {
  let best = "";
  for (const [_, v] of Object.entries(row)) {
    const s = String(v || "").trim();
    if (!s) continue;
    if (avoid.includes(s)) continue;
    const looks = (s.length >= 60) && /[\.!?]\s/.test(s) && /\s/.test(s);
    if (!looks) continue;
    if (s.length > best.length) best = s;
  }
  return best;
}

export default function DescriptionsPage() {
  const [items, setItems] = useState([]);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const text = await fetch("/courses_merged.csv", { cache: "no-store" }).then((r) => r.text());
      if (!alive) return;
      const raw = parseCSV(text);

      const normalized = raw
        .map((r) => {
          const subject = (pick(r, ["subject", "Subject", "SUBJECT"]) || "")
            .toString()
            .toUpperCase();

          const catalogue = (
            pick(r, ["catalogue", "Catalogue", "catalog", "number", "catalogue_number"]) || ""
          ).toString().trim();

          // Title: prefer explicit title fields
          let title =
            pick(r, ["title", "Title", "course_title", "course_name_short"]) || "";

          const rawCourseName = pick(r, ["course_name"]) || "";

          // If we still don't have a title, only use course_name as title if it's SHORT
          // (many COMP rows have the full paragraph in course_name).
          if (!title && rawCourseName && rawCourseName.trim().length <= 80) {
            title = rawCourseName.trim();
          }

          const credits = parseCredits(
            pick(r, ["credits", "Credits", "course_credit", "course_credits", "course_cre", "course_cr"])
          );

          // Description: try all the usual fields first
          let description =
            pick(r, [
              "description",
              "Description",
              "course_description",
              "calendar_description",
              "calendarDescription",
              "long_description",
              "longDescription",
              "desc",
              "Desc",
              "course_desc",
              "Course Description",
              "Course description",
            ]) || "";

          // If still empty and course_name is LONG, treat that as description
          if (!description && rawCourseName && rawCourseName.trim().length > 80) {
            description = rawCourseName.trim();
          }

          const prereq =
            pick(r, [
              "prereqdescription",
              "PrereqDescription",
              "prerequisite",
              "Prerequisite",
              "Course Prerequisite",
              "corequisite",
              "Corequisite",
              "Course Co-requisite",
              "prereq",
              "Prereq",
            ]) || "";

          const equivalent =
            pick(r, [
              "equivalent_course_description",
              "equivalent",
              "Equivalent",
              "course_equivalent",
              "Equivalent Courses",
            ]) || "";

          // Final fallback: sniff any paragraph-like cell (but don't skip a long course_name here)
          if (!String(description).trim()) {
            description = sniffDescriptionFromAnyCell(r, {
              avoid: [title, prereq, equivalent].filter(Boolean),
            });
          }

          const ALLOW = new Set(["COMP", "COEN", "SOEN", "MECH", "ENGR", "ENCS", "AERO"]);
          if (!ALLOW.has(subject)) return null;
          if (!subject || !catalogue || !title) return null;

          return {
            subject,
            catalogue,
            title: String(title).trim(),
            credits: Number.isFinite(credits) ? credits : 0,
            description: String(description || "").trim(),
            prereqdescription: String(prereq || "").trim(),
            equivalent_course_description: String(equivalent || "").trim(),
          };
        })
        .filter(Boolean);

      // de-dupe by subject+catalogue — keep the richest content
      const map = new Map();
      for (const r of normalized) {
        const key = `${r.subject}-${r.catalogue}`.toUpperCase();
        const prev = map.get(key);
        if (!prev) map.set(key, r);
        else {
          map.set(key, {
            subject: r.subject,
            catalogue: r.catalogue,
            title: longer(prev.title, r.title),
            credits: prev.credits || r.credits || 0,
            description: longer(prev.description, r.description),
            prereqdescription: longer(prev.prereqdescription, r.prereqdescription),
            equivalent_course_description: longer(
              prev.equivalent_course_description,
              r.equivalent_course_description
            ),
          });
        }
      }

      const arr = Array.from(map.values()).sort((a, b) =>
        `${a.subject} ${a.catalogue}`.localeCompare(`${b.subject} ${b.catalogue}`, "en", {
          numeric: true,
        })
      );

      setItems(arr);

      const hash = decodeURIComponent((window.location.hash || "").slice(1));
      if (hash) setOpenId(hash);
    })();
    return () => { alive = false; };
  }, []);

  // open/scroll when hash changes
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

  // click handler for single-open behavior
  const handleSummaryClick = (id, isOpen) => (e) => {
    e.preventDefault();
    const next = isOpen ? null : id;
    setOpenId(next);
    if (next) history.replaceState(null, "", `#${encodeURIComponent(next)}`);
    else history.replaceState(null, "", location.pathname + location.search);
  };

  return (
    <main className={styles.wrap}>
      <h1 className={styles.title}>Course Descriptions</h1>

      <div className={styles.accordion}>
        {items.map((r) => {
          const id = anchorIdFor(r);
          const isOpen = openId === id;
          const cr = Number(r.credits ?? 0);
          const creditsLabel =
            Number.isFinite(cr) ? `${cr.toFixed(cr % 1 === 0 ? 0 : 1)} credits` : "";

          return (
            <details id={id} key={id} className={styles.item} open={isOpen}>
              <summary className={styles.summary} onClick={handleSummaryClick(id, isOpen)}>
                <span className={styles.code}>
                  {r.subject} {r.catalogue}
                </span>
                <span className={styles.name}>{r.title}</span>
                {creditsLabel && <span className={styles.credits}>{creditsLabel}</span>}
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
