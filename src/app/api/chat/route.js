// src/app/api/chat/route.js
import fs from "fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 0;

/* ---------- Community (Reddit) ---------- */
const COMMUNITY_API = process.env.COMMUNITY_API_URL || "http://localhost:4000";
const DEV = process.env.NODE_ENV !== "production";
const COMMUNITY_CACHE = new Map(); // key -> { ts, data }
const COMMUNITY_TTL_MS = 30_000;

function log(...a){ if (DEV) console.log("[community]", ...a); }

function looksCommunityQuestion(q = "") {
  const s = q.toLowerCase();

  // Factual → never Reddit
  if (/\b(credit|credits|cr|prereq|pre[-\s]?req|prerequisite|requirements?|equiv|equivalent|term|terms|semester|offered|session|sessions|location|campus|title)\b/.test(s)) {
    return false;
  }

  // Opinion/experience → Reddit (now tolerant to "proffesor" etc.)
  return (
    /\b(hard|harder|hardest|difficult|difficulty|tough|easy|easier|easiest|workload|time\s*commitment|drop\s*rate|withdraw(?:al)?\s*rate|fail\s*rate|pass\s*rate|curve|curved|final|midterm|exam|test|quiz|format|grading|grade(?:\s*distribution)?|tips?|advice|study|labs?|assignments?|resources?|textbook|notes)\b/.test(s)
    ||
    // instructor/professor intent (fuzzy)
    /\b(best|good|great|avoid)\b.*\b(prof\w*|teacher|instructor)\b/.test(s)
    || /\b(prof\w*|teacher|instructor)\b.*\b(best|good|great|avoid)\b/.test(s)
    || /\bwho\s*(to|should)\s*take\b/.test(s)
    || /\b(prof\w*|teacher|instructor)s?\b/.test(s) // bare mention
  );
}

const COURSE_RE = /\b([A-Z]{3,4})\s*-?\s*(\d{3})\b/i;
function extractCourseFromText(text) {
  const m = (text || "").match(COURSE_RE);
  if (!m) return null;
  return `${(m[1] || "COMP").toUpperCase().trim()} ${m[2].trim()}`;
}

async function fetchCommunityAnswer(question, course) {
  // 30s small cache to avoid hammering Reddit during tests
  const key = `${course}::${question.toLowerCase()}`;
  const now = Date.now();
  const cached = COMMUNITY_CACHE.get(key);
  if (cached && now - cached.ts < COMMUNITY_TTL_MS) {
    log("cache hit");
    return cached.data;
  }

  // 6s timeout
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);

  try {
    const url = new URL("/api/reddit/answer", COMMUNITY_API);
    url.searchParams.set("question", question);
    url.searchParams.set("course", course);
    url.searchParams.set("limit", "6");
    url.searchParams.set("windowDays", "720");

    const r = await fetch(url.toString(), { signal: controller.signal });
    if (!r.ok) {
      log("answer status", r.status);
      return null;
    }
    const data = await r.json().catch(() => null);
    if (!data?.answer || data?.count === 0) return null;

    const out = { answer: data.answer, sources: data.sources || [], topic: data.topic, count: data.count };
    COMMUNITY_CACHE.set(key, { ts: now, data: out });
    return out;
  } catch (e) {
    log("answer error", String(e?.name || e));
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/* ---------- CSV bot (your existing index) ---------- */
let COURSE_INDEX = null, CODE_MAP = null, TITLE_LIST = null, TITLE_TOKENS_MAP = null;

function normalizeCode(subj, num) {
  return `${(subj || "COMP").toString().trim().toUpperCase()} ${(num || "").toString().trim()}`;
}
const INTENT_WORDS = new Set([
  "credit","credits","cr","prereq","prereqs","prerequisite","prerequisites",
  "requirement","requirements","equivalent","equivalents","term","terms",
  "semester","semesters","offered","when","session","sessions","week",
  "duration","title","what","is","are","for","of","the","in"
]);

function tokenize(str) {
  return (str || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
}

async function ensureIndex() {
  if (COURSE_INDEX) return;
  const p = path.join(process.cwd(), "public", "course_index.json");
  const raw = await fs.readFile(p, "utf8");
  COURSE_INDEX = JSON.parse(raw)?.list ?? [];
  CODE_MAP = new Map(); TITLE_LIST = []; TITLE_TOKENS_MAP = new Map();
  for (const item of COURSE_INDEX) {
    const code = normalizeCode(item.subject, item.catalogue);
    CODE_MAP.set(code, item);
    const lowerTitle = (item.title || "").toLowerCase();
    TITLE_LIST.push([code, lowerTitle, item]);
    TITLE_TOKENS_MAP.set(item, new Set(tokenize(lowerTitle)));
  }
}

function detectIntent(text) {
  const t = (text ?? "").toLowerCase();
  if (/\bcredit(s)?\b|\bcr\b/.test(t)) return "credits";
  if (/\bpre[-\s]?req(s|uisite|uisites)?\b|\brequirement(s)?\b/.test(t)) return "prereq";
  if (/\bequiv(alent|alents)?\b/.test(t)) return "equivalent";
  if (/\b(term|terms|semester|semesters|offered|when)\b/.test(t)) return "terms";
  if (/\b(session|sessions|week|duration|13w|6h1)\b/.test(t)) return "session";
  if (/\b(location|campus|where)\b/.test(t)) return "location";
  if (/\btitle\b|\bwhat is\b/.test(t)) return "title";
  return "summary";
}

function prettyPrereq(str=""){ return str.replace(/^course\s+pre[-\s]?requisite[s]?:\s*/i,"").trim(); }

function answerForIntent(course, intent) {
  const code = `${course.subject} ${course.catalogue}`;
  const name = `${code} — ${course.title || ""}`.trim();
  switch (intent) {
    case "credits": return `${code} is ${course.credits || "-"} credits.`;
    case "prereq": {
      const p = prettyPrereq(course.prereq || "");
      return p ? `Prerequisites for ${code}: ${p}` : `There are no listed prerequisites for ${code}.`;
    }
    case "equivalent": {
      const e = (course.equivalent || "").trim();
      return e ? `Course(s) equivalent to ${code}: ${e}` : `No equivalents are listed for ${code}.`;
    }
    case "terms": return `${code} is offered in: ${course.terms?.length ? course.terms.join(", ") : "—"}.`;
    case "session": return `${code} session/format: ${course.sessions?.length ? course.sessions.join(", ") : "—"}.`;
    case "location": return `${code} location: ${course.location || "—"}.`;
    case "title": return name;
    default: {
      const lines = [name];
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

function findByTitleFragment(text) {
  const tokens = tokenize(text).filter(t => !INTENT_WORDS.has(t));
  if (!tokens.length) return null;
  let best = null, bestScore = 0;
  for (const [, , item] of TITLE_LIST) {
    const titleTokens = TITLE_TOKENS_MAP.get(item);
    let hits = 0; for (const t of tokens) if (titleTokens.has(t)) hits++;
    const score = hits / tokens.length;
    if (score > bestScore) { bestScore = score; best = item; }
  }
  return bestScore >= 0.4 ? best : null;
}

/* ---------- POST /api/chat ---------- */
export async function POST(req) {
  try {
    await ensureIndex();
    const body = await req.json().catch(() => ({}));
    const message = (body?.message ?? body?.q ?? body?.text ?? "").toString().trim();

    if (!message) {
      return NextResponse.json({ reply: "Ask about a course, e.g. “How many credits is COMP 248?”" });
    }

    // Try community (Reddit) if applicable
    if (looksCommunityQuestion(message)) {
      const course = extractCourseFromText(message) || "COMP 248";
      log("community route →", course);
      const community = await fetchCommunityAnswer(message, course);
      if (community && community.count >= 2) {
        // UI expects ok=true branch for community
        return NextResponse.json({
          ok: true,
          answer: community.answer,
          topic: community.topic,
          course,
          sources: community.sources
        });
      }
      log("community fallback → CSV");
    }

    // CSV bot (existing)
    const code = extractCourseFromText(message);
    const intent = detectIntent(message);

    let course = null;
    if (code && CODE_MAP.has(code)) course = CODE_MAP.get(code);
    else course = findByTitleFragment(message);

    if (!course) {
      return NextResponse.json({
        reply: "I couldn't find that course in our index. Try a full code like `COMP 248` or a course title (e.g., `fundamentals of programming`).",
      });
    }

    const reply = answerForIntent(course, intent);
    // Your widget reads .message when ok is undefined
    return NextResponse.json({ reply, message: reply, text: reply, answer: reply });
  } catch (e) {
    console.error("Chat route error:", e);
    return NextResponse.json({ reply: "Server error: " + String(e?.message || e) }, { status: 500 });
  }
}
