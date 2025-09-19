"use client";
import { useEffect, useState } from "react";

export default function AddButton({ onAdd }) {
  const [state, setState] = useState("idle"); // "idle" | "added" | "exists"

  useEffect(() => {
    if (state === "added" || state === "exists") {
      const t = setTimeout(() => setState("idle"), 1200);
      return () => clearTimeout(t);
    }
  }, [state]);

  async function handleClick() {
    // onAdd must return true (added) or false (already exists)
    const ok = await onAdd?.();
    setState(ok ? "added" : "exists");
  }

  return (
    <button
      type="button"
      className="addBtn"
      data-state={state}
      onClick={handleClick}
      aria-live="polite"
    >
      <span className="addBtn__label">Add to Planner</span>

      {/* Success check (stroke-drawn) */}
      <span className="addBtn__check" aria-hidden>
        <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
          <path
            d="M2 7.5l5 4.5L18 2"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="addBtn__tickPath"
          />
        </svg>
      </span>

      {/* Warning icon */}
      <span className="addBtn__warn" aria-hidden>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 7v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="12" cy="18" r="1.5" fill="currentColor"/>
        </svg>
      </span>

      {/* Shine sweep (for success) */}
      <span className="addBtn__shine" aria-hidden />
    </button>
  );
}
