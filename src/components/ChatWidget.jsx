// components/ChatWidget.jsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import styles from "./ChatWidget.module.css";

const API = "/api/chat";
const KEY = "conu-planner:selected";
const WELCOME_FLAG = "clara:welcomeShown"; // session-scoped so it shows once per tab/session
const AUTO_OPEN_DELAY_MS = 6000;

/* -------------------------- planner helper (unchanged) -------------------------- */
function appendPlanner(course, term) {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    const offering = {
      subject: course.subject,
      catalogue: course.catalogue,
      title: course.title,
      credits: course.credits,
      term: term || (course.terms && course.terms[0]),
      session: course.sessions && course.sessions[0],
    };
    const key = (o) =>
      `${(o.subject || "").toUpperCase()}-${(o.catalogue || "")
        .toUpperCase()}-${(o.term || "").toUpperCase()}`;
    const next = raw.filter((r) => key(r) !== key(offering));
    next.push(offering);
    localStorage.setItem(KEY, JSON.stringify(next));
    try {
      window.dispatchEvent(new Event("planner:update"));
    } catch {}
    return true;
  } catch {
    return false;
  }
}

/* --------------------------------- component --------------------------------- */
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const endRef = useRef();

  useEffect(() => {
   endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);


  function TypingBubble() {
   return (
      <div className={`${styles.msgAi}`}>
        <div className={`${styles.msgText} ${styles.typing}`} aria-live="polite" aria-label="Assistant is typing">
          <span className={styles.dots}>
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </span>
          <span className={styles.typingText}>Clara is typing…</span>
        </div>
      </div>
    );
  }

  // focus when opening
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  // auto-open + welcome once per session
  useEffect(() => {
    const alreadyShown = typeof window !== "undefined" && sessionStorage.getItem(WELCOME_FLAG);
    if (alreadyShown) return;

    const t = setTimeout(() => {
      // mark as shown even if user closes it later
      try { sessionStorage.setItem(WELCOME_FLAG, "1"); } catch {}
      setOpen(true);
      // push welcome message if nothing yet
      setMessages((m) => {
  if (m.length) return m;

  const introHtml = `
    <div class="welcome">
      <p>👋 <strong>Hey, I’m Clara — your student guide!</strong></p>
      <p>You can ask me things like:</p>
      <ul>
        <li><em>How many credits is COMP 248?</em></li>
        <li><em>What are the prerequisites for SOEN 287?</em></li>
        <li><em>Is COEN 231 hard?</em></li>
        <li><em>Or type in Professor's name to get his details from ratemyprofessors.com</em></li>
      </ul>
      <p>Type your question below, I’ll pull official details and community feedback where helpful.</p>
    </div>
  `;

  return [...m, { role: "assistant", html: introHtml }];
});
    }, 6000);

    return () => clearTimeout(t);
  }, []);

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
        body: JSON.stringify({ text: user.text }),
      });
      const data = await res.json();
      if (data?.html) {
  pushMessage({ role: "assistant", html: data.html });
  return;
}
      // Community (Reddit) answer → render as compact HTML
      if (data?.ok && data?.answer) {
        const list =
          (data.sources || [])
            .map(
              (s) =>
                `<li>
                   <a href="${s.url}" target="_blank" rel="noreferrer">${s.title}</a>
                   <span class="meta">— ${s.when} (${s.subreddit})</span>
                 </li>`
            )
            .join("") || "";

        const html = `
          <div class="community minimalist">
            <div class="topline">
              <span class="label">Top posts from Reddit</span>
              <span class="pill">
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" fill="currentColor"></circle>
                  <circle cx="9"  cy="12" r="1.6" fill="#fff"></circle>
                  <circle cx="15" cy="12" r="1.6" fill="#fff"></circle>
                  <path d="M7 14c1.6 1 3.3 1.5 5 1.5s3.4-.5 5-1.5" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none"></path>
                  <circle cx="18" cy="6" r="1.3" fill="currentColor"></circle>
                  <path d="M14 7l3.2-1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"></path>
                </svg>
                Reddit
              </span>
            </div>
            <ul class="rlinks">${list}</ul>
            <div class="rfoot">Community feedback from Reddit (opinions/experiences, not official).</div>
          </div>
        `;

        pushMessage({ role: "assistant", isCommunity: true, html });
        return;
      }

      // Planner flow
      if (data?.action === "planner:add" || data?.payload?.course) {
        pushMessage({ role: "assistant", text: data.message || "Adding to planner..." });
        const ok = appendPlanner(data.payload.course, data.payload.term);
        pushMessage({
          role: "assistant",
          text: ok ? "Course added to your planner ✅" : "Failed to add course.",
        });
        return;
      }

      // CSV answers (plain text)
      const textOut = data?.answer || data?.message || data?.reply || "Sorry, I couldn't answer that.";
      pushMessage({ role: "assistant", text: textOut });

      if (data?.courseId) {
        pushMessage({
          role: "assistant",
          isLink: true,
          text: `View details: /pages/courses/descriptions#${encodeURIComponent(data.courseId)}`,
        });
      }
    } catch {
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
          <img src="/clara.svg" alt="Clara Chatbot" className={styles.fabIcon}/>
        </button>


        {open && (
            <div className={styles.panel} role="dialog" aria-modal="true">
              <div className={styles.header}>
                <div className={styles.title}>Clara — Student Guide</div>
                <button className={styles.close} onClick={() => setOpen(false)}>
                  ✕
                </button>
              </div>

              <div className={styles.messages}>
                {messages.map((m, i) => (
                    <div
                        key={i}
                        className={
                          m.role === "user"
                              ? styles.msgUser
                              : `${styles.msgAi} ${m.isCommunity ? styles.msgCommunity : ""}`
                        }
                    >
                      {m.html ? (
                          // HTML branch (no children alongside dangerouslySetInnerHTML)
                          <div
                              className={`${styles.msgText} ${styles.msgTextHtml || ""}`}
                              dangerouslySetInnerHTML={{__html: m.html}}
                          />
                      ) : (
                          <div className={styles.msgText}>
                            {m.isLink ? (
                                <a href={m.text.replace(/^View details: /, "")}>
                                  {m.text.replace(/^View details: /, "Open details")}
                                </a>
                            ) : (
                                m.text
                            )}
                          </div>
                      )}
                    </div>
                ))}
                {loading && <TypingBubble />}

                <div ref={endRef} /> {/* scroll anchor */}
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

              <div className={styles.hint}>
                Tip: ask for credits, terms, prerequisites — or try “Is COMP 248 hard?” to see community posts.
              </div>
            </div>
        )}
      </div>
  );
}
