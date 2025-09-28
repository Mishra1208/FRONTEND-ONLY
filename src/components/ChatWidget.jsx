// components/ChatWidget.jsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import styles from "./ChatWidget.module.css";

const API = "/api/chat";
const KEY = "conu-planner:selected"; // your existing planner key

function appendPlanner(course, term) {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    // convert to the same offering shape your app expects
    const offering = {
      subject: course.subject,
      catalogue: course.catalogue,
      title: course.title,
      credits: course.credits,
      term: term || (course.terms && course.terms[0]),
      session: course.sessions && course.sessions[0]
    };
    // dedupe by subject+catalogue+term
    const key = (o) => `${(o.subject||"").toUpperCase()}-${(o.catalogue||"").toUpperCase()}-${(o.term||"").toUpperCase()}`;
    const next = raw.filter(r => key(r) !== key(offering));
    next.push(offering);
    localStorage.setItem(KEY, JSON.stringify(next));
    // notify other pages
    try { window.dispatchEvent(new Event("planner:update")); } catch {}
    return true;
  } catch (e) {
    console.error("Planner save failed", e);
    return false;
  }
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open]);

  function pushMessage(msg) {
    setMessages((m) => [...m, msg]);
  }

  async function send() {
    if (!text.trim()) return;
    const user = { role: "user", text: text.trim() };
    pushMessage(user);
    setLoading(true);
    setText("");
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: user.text })
      });
      const data = await res.json();
      if (!data.ok) {
        pushMessage({ role: "assistant", text: data.message || "Sorry, I couldn't answer that." });
      } else if (data.action === "planner:add" || data?.payload?.course) {
        // planner flow
        pushMessage({ role: "assistant", text: data.message || "Adding to planner..." });
        // actually add
        const ok = appendPlanner(data.payload.course, data.payload.term);
        pushMessage({ role: "assistant", text: ok ? "Course added to your planner ✅" : "Failed to add course." });
      } else {
        pushMessage({ role: "assistant", text: data.answer || "Sorry I don't know." });
        // include a "View" button by also pushing a quick action message
        if (data.courseId) {
          pushMessage({ role: "assistant", text: `View details: /pages/courses/descriptions#${encodeURIComponent(data.courseId)}`, isLink: true });
        }
      }
    } catch (e) {
      pushMessage({ role: "assistant", text: "Network error — try again." });
    } finally {
      setLoading(false);
    }
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className={styles.container} data-open={open ? "1" : "0"}>
      <button className={styles.fab} aria-label="Chat" onClick={() => setOpen(v => !v)}>
        💬
      </button>

      {open && (
        <div className={styles.panel} role="dialog" aria-modal="true">
          <div className={styles.header}>
            <div className={styles.title}>Assistant — site data only</div>
            <button className={styles.close} onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className={styles.messages}>
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? styles.msgUser : styles.msgAi}>
                <div className={styles.msgText}>
                  {m.isLink ? <a href={m.text.replace(/^View details: /,'' )}>{m.text.replace(/^View details: /,'Open details')}</a> : m.text}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.inputRow}>
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ask about a course e.g. 'How many credits is COMP 248?'"
              className={styles.input}
              rows={2}
            />
            <button className={styles.send} onClick={send} disabled={loading || !text.trim()}>
              {loading ? "…" : "Send"}
            </button>
          </div>

          <div className={styles.hint}>Tip: ask for credits, terms, or prerequisites. Example: <em>What are the prerequisites for COMP 248?</em></div>
        </div>
      )}
    </div>
  );
}
