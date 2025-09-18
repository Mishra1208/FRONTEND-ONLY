"use client";
import { useEffect, useState } from "react";
import styles from "@/app/pages/planner/planner.module.css";

const KEY = "conu-planner:selected";

export default function PlannerList() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    setItems(raw ? JSON.parse(raw) : []);
  }, []);

  function remove(id) {
    const next = items.filter(i => i.course_id !== id);
    setItems(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }

  return (
    <div className={styles.panel}>
      <h2 className="h2">Your Planner</h2>
      {items.length === 0 ? (
        <p className="body">No courses yet. Add from the Courses page.</p>
      ) : (
        <ul className={styles.list}>
          {items.map(i => (
            <li key={i.course_id} className={styles.item}>
              <div className={styles.itemHead}>
                <strong>{i.subject} {i.catalogue}</strong> — {i.title}
              </div>
              <div className={styles.itemMeta}>{i.credits ?? "-"} cr {i.term ? `• ${i.term}` : ""}</div>
              <button className={styles.remove} onClick={()=>remove(i.course_id)}>Remove</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
