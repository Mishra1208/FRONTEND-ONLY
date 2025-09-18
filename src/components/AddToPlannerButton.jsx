"use client";
import { useState } from "react";

export default function AddToPlannerButton({ onAdd, disabled = false }) {
  const [added, setAdded] = useState(false);

  async function handleClick() {
    if (disabled || added) return;
    // call your existing add-to-planner logic (no alerts!)
    await onAdd?.();
    setAdded(true);
    // keep checkmark for 2s then revert (remove if you want it to stay)
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || added}
      className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 text-white font-semibold disabled:opacity-80 disabled:cursor-default"
    >
      {added ? (
        <span className="checkmark-container" aria-label="added">
          <svg className="checkmark" viewBox="0 0 52 52" aria-hidden="true">
            <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
            <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </span>
      ) : (
        <>Add to Planner</>
      )}
    </button>
  );
}
