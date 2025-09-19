"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./courses.module.css";
import { useSearchParams } from "next/navigation";
import { fetchCourses } from "@/lib/mockApi";
import AddButton from "@/components/AddButton";

const KEY = "conu-planner:selected";

export default function CoursesPage() {
  const params = useSearchParams();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Track courses already in planner + little toast
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [toast, setToast] = useState(null); // { text, kind: "ok" | "warn" }

  // Load planner ids on mount
  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    setSelectedIds(new Set(list.map((i) => i.course_id)));
  }, []);

  // Auto-hide toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1500);
    return () => clearTimeout(t);
  }, [toast]);

  // Build filters from URL
  const f = useMemo(
    () => ({
      search: params.get("search") || "",
      subject: params.get("subject") || "ALL",
      term: params.get("term") || "ALL",
      minCredits: Number(params.get("minCredits") ?? 0),
      maxCredits: Number(params.get("maxCredits") ?? 6),
    }),
    [params]
  );

  // Fetch data
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const res = await fetchCourses(f);
      if (!alive) return;
      setData(res);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [f]);

  // Return true when added, false when duplicate
  async function addToPlanner(course) {
    const id = course.course_id;
    if (selectedIds.has(id)) {
      setToast({ text: "Course already added to the planner", kind: "warn" });
      return false;
    }
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    localStorage.setItem(KEY, JSON.stringify([...list, course]));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setToast({ text: "Added to planner", kind: "ok" });
    return true;
  }

  return (
    <main className={styles.wrap}>
      <div className={styles.head}>
        <h1 className="h2">Courses</h1>
      </div>

      <FiltersInline />

      {loading ? (
        <p className="body">Loading…</p>
      ) : data.length === 0 ? (
        <p className="body">No results. Try adjusting filters.</p>
      ) : (
        <div className="cards grid">
          <div className={styles.grid}>
            {data.map((c) => {
              const isSelected = selectedIds.has(c.course_id);
              return (
                <div
                  key={c.course_id}
                  className={`card ${isSelected ? styles.cardSelected : ""}`}
                >
                  <div className="courseCode">
                    <strong>
                      {c.subject} {c.catalogue}
                    </strong>
                  </div>

                  {/* Title tinted when already in planner */}
                  <div
                    className={`cardTitle ${
                      isSelected ? styles.cardTitleAdded : ""
                    }`}
                  >
                    {c.title}
                  </div>

                  <div className="cardMeta">
                    {(c.credits ?? "-")} cr {c.session ? `• ${c.session}` : ""}{" "}
                    {c.term ? `• ${c.term}` : ""}
                  </div>

                  <div className={styles.actions}>
                    <AddButton onAdd={() => addToPlanner(c)} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Toast bubble */}
      {toast && (
        <div
          className={styles.toast}
          data-kind={toast.kind}
          aria-live="polite"
          role="status"
        >
          {toast.text}
        </div>
      )}
    </main>
  );
}

function FiltersInline() {
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [subject, setSubject] = useState(params.get("subject") ?? "ALL");
  const [term, setTerm] = useState(params.get("term") ?? "ALL");
  const [minCredits, setMinCredits] = useState(params.get("minCredits") ?? "0");
  const [maxCredits, setMaxCredits] = useState(params.get("maxCredits") ?? "6");

  function apply(e) {
    e.preventDefault();
    const q = new URLSearchParams();
    if (search) q.set("search", search);
    if (subject !== "ALL") q.set("subject", subject);
    if (term !== "ALL") q.set("term", term);
    q.set("minCredits", minCredits);
    q.set("maxCredits", maxCredits);
    window.location.assign(`/pages/courses?${q.toString()}`);
  }

  return (
    <form className={styles.filters} onSubmit={apply}>
      <input
        className={styles.input}
        placeholder="Search title/code…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select
        className={styles.select}
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      >
        <option value="ALL">All Subjects</option>
        <option value="COMP">COMP</option>
        <option value="SOEN">SOEN</option>
      </select>
      <select
        className={styles.select}
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      >
        <option value="ALL">All Terms</option>
        <option value="Fall">Fall</option>
        <option value="Winter">Winter</option>
        <option value="Summer">Summer</option>
      </select>
      <input
        className={styles.number}
        type="number"
        min="0"
        max="6"
        value={minCredits}
        onChange={(e) => setMinCredits(e.target.value)}
      />
      <span className={styles.to}>to</span>
      <input
        className={styles.number}
        type="number"
        min="0"
        max="6"
        value={maxCredits}
        onChange={(e) => setMaxCredits(e.target.value)}
      />
      <button className={styles.applyBtn}>Apply</button>
    </form>
  );
}
