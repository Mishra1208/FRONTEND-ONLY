// src/app/api/chat/route.js
import fs from "fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const revalidate = 0; // avoid any caching while debugging

/* ---------- load index (once) ---------- */
let COURSE_INDEX = null;
let CODE_MAP = null;       // "COMP 248" -> course object
let TITLE_LIST = null;     // for fuzzy title contains()

function normalizeCode(subj, num) {
  const s = (subj || "COMP").toString().trim().toUpperCase();
  const n = (num || "").toString().trim();
  return `${s} ${n}`;
}

async function ensureIndex() {
  if (COURSE_INDEX) return;
  const p = path.join(process.cwd(), "public", "course_index.json");
  const raw = await fs.readFile(p, "utf8");
  COURSE_INDEX = JSON.parse(raw)?.list ?? [];
  CODE_MAP = new Map();
  TITLE_LIST = [];
  for (const item of COURSE_INDEX) {
    const code = normalizeCode(item.subject, item.catalogue);
    CODE_MAP.set(code, item);
    TITLE_LIST.push([code, (item.title || "").toLowerCase(), item]);
  }
}

/* ---------- parse user question ---------- */
function extractCourseFromText(text) {
  const q = (text ?? "").toString();             // <-- guard
  const m = q.match(/([A-Za-z]{3,4})?\s*-?\s*(\d{3,4})\b/);
  if (!m) return null;
  const subj = m[1] ? m[1] : "COMP";
  const num = m[2];
  return normalizeCode(subj, num);
}

function detectIntent(text) {
  const t = (text ?? "").toString().toLowerCase();  // <-- guard

  if (/\bcredit|cr\b/.test(t)) return "credits";
  if (/\bprereq|pre-?requisite|pre requisite|requirement/.test(t)) return "prereq";
  if (/\bequiv|equivalent/.test(t)) return "equivalent";
  if (/\bterm|offered|semester|when/.test(t)) return "terms";
  if (/\bsession|week|duration|13w|6h1/.test(t)) return "session";
  if (/\blocation|campus|where\b/.test(t)) return "location";
  if (/\btitle|what is\b/.test(t)) return "title";
  return "summary";
}


/* ---------- craft answers ---------- */
function answerForIntent(course, intent) {
  const code = `${course.subject} ${course.catalogue}`;
  const name = `${code} — ${course.title || ""}`.trim();

  switch (intent) {
    case "credits": {
      const cr = course.credits || "-";
      return `${code} is ${cr} credits.`;
    }
    case "prereq": {
      const p = course.prereq?.trim();
      return p ? `Prerequisites for ${code}: ${p}` : `There are no listed prerequisites for ${code}.`;
    }
    case "equivalent": {
      const e = course.equivalent?.trim();
      return e ? `Course(s) equivalent to ${code}: ${e}` : `No equivalents are listed for ${code}.`;
    }
    case "terms": {
      const terms = course.terms?.length ? course.terms.join(", ") : "—";
      return `${code} is offered in: ${terms}.`;
    }
    case "session": {
      const sess = course.sessions?.length ? course.sessions.join(", ") : "—";
      return `${code} session/format: ${sess}.`;
    }
    case "location": {
      const loc = course.location || "—";
      return `${code} location: ${loc}.`;
    }
    case "title": {
      return name;
    }
    default: {
      const lines = [];
      lines.push(name);
      if (course.credits) lines.push(`${course.credits} credits`);
      if (course.terms?.length) lines.push(`Offered: ${course.terms.join(", ")}`);
      if (course.sessions?.length) lines.push(`Session: ${course.sessions.join(", ")}`);
      if (course.prereq) lines.push(`Prerequisite(s): ${course.prereq}`);
      if (course.equivalent) lines.push(`Equivalent: ${course.equivalent}`);
      if (course.location) lines.push(`Location: ${course.location}`);
      if (course.description) lines.push(`\n${course.description}`);
      return lines.join(" • ");
    }
  }
}

/* ---------- fuzzy title fallback ---------- */
function findByTitleFragment(text) {
  const t = text.toLowerCase();
  // very light contains search
  const hit = TITLE_LIST.find(([code, title]) => title.includes(t));
  return hit?.[2] || null;
}

/* ---------- POST /api/chat ---------- */
export async function POST(req) {
  try {
    await ensureIndex();

    // Defensive parsing + logging
    const payload = await req.json().catch(() => ({}));
    const message = (payload?.message ?? payload?.q ?? payload?.text ?? "").toString();
    console.log("Index size:", COURSE_INDEX?.length);
    console.log("Incoming payload:", payload);
    console.log("Message:", message);
    console.log("Has COMP 249?", CODE_MAP?.has("COMP 249"));


    if (!message.trim()) {
      return NextResponse.json({
        reply: "Ask about a course, e.g. “How many credits is COMP 248?”",
      });
    }

    const code = extractCourseFromText(message);
    const intent = detectIntent(message);
    console.log("Parsed -> code:", code, "| intent:", intent);

    let course = null;
    if (code && CODE_MAP.has(code)) {
      course = CODE_MAP.get(code);
    } else if (!code) {
      course = findByTitleFragment(message);
    }

    if (!course) {
      // Helpful hint reply
      return NextResponse.json({
        reply:
          "I couldn't find that course in our index. Try typing a full code like `COMP 248` or the course title (e.g., `fundamentals of programming`).",
      });
    }

    // Optional: sanity check key existence
    console.log("Found course:", `${course.subject} ${course.catalogue}`);

    const reply = answerForIntent(course, intent);

// instead of redeclaring payload, just reuse another name or inline it:
const out = {
  reply,
  message: reply,
  text: reply,
  answer: reply,
};

return NextResponse.json(out);


  } catch (e) {
    console.error("Chat route error:", e);
    return NextResponse.json(
      { reply: "Server error: " + String(e?.message || e) },
      { status: 500 }
    );
  }
}
