// conu-community/server.js
require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const Snoowrap = require("snoowrap");

const app = express();
app.use(cors());
app.use(morgan("tiny"));

/* ---------- Reddit client ---------- */
const reddit = new Snoowrap({
  userAgent: process.env.REDDIT_USER_AGENT || "conu-planner/0.1 (dev)",
  clientId: process.env.REDDIT_CLIENT_ID,
  clientSecret: process.env.REDDIT_CLIENT_SECRET,
  username: process.env.REDDIT_USERNAME,
  password: process.env.REDDIT_PASSWORD,
});
// be gentle; also continue after ratelimit errors
reddit.config({
  requestDelay: 1100,
  continueAfterRatelimitError: true,
});

/* ---------- helpers ---------- */
function inferTopicFromQuestion(q) {
  const s = (q || "").toLowerCase();
  if (/(best|who to take|avoid|teacher|prof|instructor)/.test(s)) return "instructor";
  if (/(final|midterm|exam|test|quiz|format|curve|grading)/.test(s)) return "exam";
  if (/(tip|advice|study|assignment|lab|labs|resource|textbook|notes)/.test(s)) return "tips";
  return "difficulty";
}
const topicQuery = {
  difficulty:
    '(hard OR difficulty OR workload OR easy OR tough OR "drop rate" OR curve)',
  instructor:
    '(prof OR professor OR teacher OR instructor OR "who to take" OR "best prof" OR avoid)',
  exam:
    '(final OR midterm OR exam OR test OR quiz OR format OR grading OR proctor)',
  tips:
    '(tips OR advice OR study OR assignment OR lab OR labs OR resource OR textbook OR notes)',
};

function courseVariants(course) {
  const compact = course.replace(/\s+/g, "");
  const dashed = course.replace(/\s+/, "-");
  return `("${course}" OR ${compact} OR "${dashed}")`;
}
function sinceDaysToTimestamp(days) {
  const ms = days * 24 * 60 * 60 * 1000;
  return Math.floor((Date.now() - ms) / 1000);
}
function relTime(iso) {
  const d = new Date(iso), now = Date.now();
  const diff = Math.max(1, Math.round((now - d.getTime())/(1000*60*60*24)));
  if (diff < 7) return `${diff}d ago`;
  const w = Math.round(diff/7); if (w < 8) return `${w}w ago`;
  const m = Math.round(diff/30); if (m < 18) return `${m}mo ago`;
  const y = Math.round(diff/365); return `${y}y ago`;
}
function summarizePosts(posts, course, topic) {
  const head = {
    difficulty: `Here’s what students recently said about **${course}** (difficulty/workload):`,
    instructor: `Instructor chatter for **${course}** (who to take/avoid):`,
    exam: `Exam-related posts for **${course}**:`,
    tips: `Tips & resources mentioned for **${course}**:`,
  }[topic] || `Community posts for **${course}**:`;
  const bullets = posts.slice(0, 5).map(
    p => `• ${p.title} — ${relTime(p.created_iso)} (${p.subreddit}) — ${p.url}`
  );
  return {
    answer: [head, ...bullets, "", "Note: Community feedback from Reddit (opinions/experiences, not official)."].join("\n"),
    sources: posts.slice(0, 5).map(p => ({
      title: p.title, url: p.url, when: relTime(p.created_iso), subreddit: p.subreddit, score: p.score
    })),
  };
}

/* ---------- core fetch with timeout ---------- */
function withTimeout(promise, ms, label = "reddit") {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error(`${label}:timeout`)), ms)),
  ]);
}

async function searchReddit({ subreddits, searchQ, afterTs, limit, perCallTimeoutMs = 4000 }) {
  const results = [];
  for (const sub of subreddits) {
    const subreddit = await reddit.getSubreddit(sub);
    // listing fetch wrapped in timeout
    const listing = await withTimeout(
      subreddit.search({ query: searchQ, sort: "new", time: "year", limit }),
      perCallTimeoutMs,
      `search:${sub}`
    );
    listing.forEach((p) => {
      results.push({
        id: p.id,
        subreddit: `r/${sub}`,
        title: p.title,
        url: `https://www.reddit.com${p.permalink}`,
        score: p.score,
        num_comments: p.num_comments,
        created_utc: p.created_utc,
        created_iso: new Date(p.created_utc * 1000).toISOString(),
      });
    });
  }
  return results
    .filter((r) => r.created_utc >= afterTs)
    .sort((a, b) => b.created_utc - a.created_utc)
    .slice(0, limit);
}

/* ---------- routes ---------- */
app.get("/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

/** /api/reddit/search?course=COMP%20248&topic=difficulty&windowDays=540&limit=20 */
app.get("/api/reddit/search", async (req, res) => {
  const course = (req.query.course || "").trim();
  const topic = (req.query.topic || "difficulty").trim();
  const windowDays = Number(req.query.windowDays || 540);
  const limit = Math.min(50, Number(req.query.limit || 20));
  if (!course) return res.status(400).json({ error: "Missing course" });

  const subs = (process.env.SUBREDDITS || "r/Concordia")
    .split(",")
    .map((s) => s.trim().replace(/^r\//, ""));

  const afterTs = sinceDaysToTimestamp(windowDays);
  const searchQ = `${courseVariants(course)} AND ${topicQuery[topic] || ""}`;

  // overall cap 6s
  try {
    const posts = await withTimeout(
      searchReddit({ subreddits: subs, searchQ, afterTs, limit }),
      6000,
      "overall"
    );
    res.json({
      query: { course, topic, windowDays, limit, subreddits: subs.map((s) => `r/${s}`) },
      count: posts.length,
      posts,
      note: "Community results from Reddit. These reflect opinions/experiences, not official university guidance.",
    });
  } catch (e) {
    console.error("search error:", e.message || e);
    res.status(504).json({ error: "Timeout talking to Reddit", detail: String(e) });
  }
});

/** /api/reddit/answer?question=...&course=COMP%20248&windowDays=540&limit=8 */
app.get("/api/reddit/answer", async (req, res) => {
  const course = (req.query.course || "").trim();
  const question = (req.query.question || "").trim();
  const windowDays = Number(req.query.windowDays || 540);
  const limit = Math.min(20, Number(req.query.limit || 8));
  if (!course) return res.status(400).json({ error: "Missing course" });

  const topic = inferTopicFromQuestion(question);
  const subs = (process.env.SUBREDDITS || "r/Concordia")
    .split(",")
    .map((s) => s.trim().replace(/^r\//, ""));
  const afterTs = sinceDaysToTimestamp(windowDays);
  const searchQ = `${courseVariants(course)} AND ${topicQuery[topic] || ""}`;

  try {
    const posts = await withTimeout(
      searchReddit({ subreddits: subs, searchQ, afterTs, limit }),
      6000,
      "overall"
    );
    const { answer, sources } = summarizePosts(posts, course, topic);
    res.json({
      course, topic, question,
      count: posts.length,
      answer, sources,
      note: "Community results from Reddit. These reflect opinions/experiences, not official university guidance.",
    });
  } catch (e) {
    console.error("answer error:", e.message || e);
    res.status(504).json({ error: "Timeout talking to Reddit", detail: String(e) });
  }
});

/* ---------- start ---------- */
const port = process.env.PORT || 4000;
const host = process.env.HOST || "127.0.0.1";
app.listen(port, host, () => {
  console.log(`Community service listening on http://${host}:${port}`);
});
