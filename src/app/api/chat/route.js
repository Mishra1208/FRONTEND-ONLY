// src/app/api/chat/route.js
import fs from "fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 0;

/* ---------- globals ---------- */
let COURSE_INDEX = null;
let CODE_MAP = null;          // "COMP 248" -> course object
let TITLE_LIST = null;        // [code, lowerTitle, item]
let TITLE_TOKENS_MAP = null;  // item -> Set(tokens)

/* ---------- helpers ---------- */
function normalizeCode(subj, num) {
  const s = (subj || "COMP").toString().trim().toUpperCase();
  const n = (num || "").toString().trim();
  return `${s} ${n}`;
}

const INTENT_WORDS = new Set([
  "credit","credits","cr",
  "prereq","prereqs","prerequisite","prerequisites",
  "requirement","requirements",
  "equivalent","equivalents",
  "term","terms","semester","semesters","offered","when",
  "session","sessions","week","duration",
  "title","what","is","are","for","of","the","in"
]);

function tokenize(str) {
  return (str || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/* ---------- load index once ---------- */
async function ensureIndex() {
  if (COURSE_INDEX) return;

  const p = path.join(process.cwd(), "public", "course_index.json");
  const raw = await fs.readFile(p, "utf8");
  COURSE_INDEX = JSON.parse(raw)?.list ?? [];

  CODE_MAP = new Map();
  TITLE_LIST = [];
  TITLE_TOKENS_MAP = new Map();

  for (const item of COURSE_INDEX) {
    const code = normalizeCode(item.subject, item.catalogue);
    CODE_MAP.set(code, item);

    const lowerTitle = (item.title || "").toLowerCase();
    TITLE_LIST.push([code, lowerTitle, item]);
    TITLE_TOKENS_MAP.set(item, new Set(tokenize(lowerTitle)));
  }
}

/* ---------- parsing ---------- */
function extractCourseFromText(text) {
  const q = (text ?? "").toString();
  // "COMP 249", "comp-249", "249"
  const m = q.match(/([A-Za-z]{3,4})?\s*-?\s*(\d{3,4})\b/);
  if (!m) return null;
  const subj = m[1] ? m[1] : "COMP";
  const num = m[2];
  return normalizeCode(subj, num);
}

function detectIntent(text) {
  const t = (text ?? "").toString().toLowerCase();

  if (/\bcredit(s)?\b|\bcr\b/.test(t)) return "credits";
  if (/\bpre[-\s]?req(s|uisite|uisites)?\b|\brequirement(s)?\b/.test(t)) return "prereq";
  if (/\bequiv(alent|alents)?\b/.test(t)) return "equivalent";
  if (/\b(term|terms|semester|semesters|offered|when)\b/.test(t)) return "terms";
  if (/\b(session|sessions|week|duration|13w|6h1)\b/.test(t)) return "session";
  if (/\b(location|campus|where)\b/.test(t)) return "location";
  if (/\btitle\b|\bwhat is\b/.test(t)) return "title";
  return "summary";
}

/* ---------- answering ---------- */
function prettyPrereq(str = "") {
  return str.replace(/^course\s+pre[-\s]?requisite[s]?:\s*/i, "").trim();
}

function answerForIntent(course, intent) {
  const code = `${course.subject} ${course.catalogue}`;
  const name = `${code} — ${course.title || ""}`.trim();

  switch (intent) {
    case "credits": {
      const cr = course.credits || "-";
      return `${code} is ${cr} credits.`;
    }
    case "prereq": {
      const p = prettyPrereq(course.prereq || "");
      return p ? `Prerequisites for ${code}: ${p}` : `There are no listed prerequisites for ${code}.`;
    }
    case "equivalent": {
      const e = (course.equivalent || "").trim();
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
      if (course.prereq) lines.push(`Prerequisite(s): ${prettyPrereq(course.prereq)}`);
      if (course.equivalent) lines.push(`Equivalent: ${course.equivalent}`);
      if (course.location) lines.push(`Location: ${course.location}`);
      if (course.description) lines.push(`\n${course.description}`);
      return lines.join(" • ");
    }
  }
}

/* ---------- fuzzy title lookup ---------- */
function findByTitleFragment(text) {
  const tokens = tokenize(text).filter(t => !INTENT_WORDS.has(t));
  if (!tokens.length) return null;

  let best = null;
  let bestScore = 0;

  for (const [, , item] of TITLE_LIST) {
    const titleTokens = TITLE_TOKENS_MAP.get(item);
    let hits = 0;
    for (const t of tokens) if (titleTokens.has(t)) hits++;
    const score = hits / tokens.length;
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return bestScore >= 0.4 ? best : null; // small threshold to avoid wild guesses
}

/* ---------- POST /api/chat ---------- */
export async function POST(req) {
  try {
    await ensureIndex();

    const payload = await req.json().catch(() => ({}));
    const message = (payload?.message ?? payload?.q ?? payload?.text ?? "").toString();

    if (!message.trim()) {
      return NextResponse.json({
        reply: "Ask about a course, e.g. “How many credits is COMP 248?”",
      });
    }

    const code = extractCourseFromText(message);
    const intent = detectIntent(message);

    let course = null;
    if (code && CODE_MAP.has(code)) {
      course = CODE_MAP.get(code);
    } else {
      course = findByTitleFragment(message);
    }

    if (!course) {
      return NextResponse.json({
        reply:
          "I couldn't find that course in our index. Try a full code like `COMP 248` or a course title (e.g., `fundamentals of programming`).",
      });
    }

    const reply = answerForIntent(course, intent);
    const out = { reply, message: reply, text: reply, answer: reply };
    return NextResponse.json(out);
  } catch (e) {
    console.error("Chat route error:", e);
    return NextResponse.json(
      { reply: "Server error: " + String(e?.message || e) },
      { status: 500 }
    );
  }
}
