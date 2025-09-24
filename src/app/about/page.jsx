"use client";

import React from "react";
import styles from "./about.module.css";
import Profile from "@/components/Profile";
import AnimatedBeamDemo from "@/components/widgets/AnimatedBeamDemo";

// Fancy display/body fonts (zero CLS, no <link> tags needed)
import { Space_Grotesk, Inter } from "next/font/google";
const display = Space_Grotesk({ subsets: ["latin"], weight: ["700"] });
const body    = Inter({ subsets: ["latin"], weight: ["400", "600"] });

const TEAM = [
  {
    name: "Narendra Mishra",
    role: "Founder & Dev",
    avatar: "/team/profile1.jpg",
    links: {
      github: "https://github.com/your-handle",
      instagram: "https://instagram.com/your-handle",
      linkedin: "https://linkedin.com/in/your-handle",
    },
  },
  {
    name: "Aryan Kotecha",
    role: "Backend",
    avatar: "/team/profile1.jpg",
    links: {
      github: "https://github.com/your-handle",
      instagram: "https://instagram.com/your-handle",
      linkedin: "https://linkedin.com/in/your-handle",
    },
  },
  {
    name: "Neelendra Mishra",
    role: "Design",
    avatar: "/team/profile1.jpg",
    links: {
      github: "https://github.com/your-handle",
      instagram: "https://instagram.com/your-handle",
      linkedin: "https://linkedin.com/in/your-handle",
    },
  },
];

export default function AboutPage() {
  return (
    <main className={`container ${styles.page} ${body.className}`}>
      {/* Title */}
     {/* Kicker + Title */}
<p className={`${styles.kicker} ${display.className}`}>ConU Planner</p>
<h1 className={`${styles.title} ${display.className}`}>Plan smarter. In one tab.</h1>

{/* Lead */}
<p className={styles.lead}>
  All the places you check — Concordia docs, Reddit, RateMyProfessors, and credit math —
  stitched into one fast planner.
</p>

{/* Sources shown as subtle chips (not shouty pills) */}
<ul className={styles.chips} aria-label="Sources we unify">
  <li className={styles.chip}>Concordia docs</li>
  <li className={styles.chip}>Reddit</li>
  <li className={styles.chip}>RateMyProfessors</li>
  <li className={styles.chip}>Credit calculator</li>
</ul>

{/* Short narrative */}
      <br/>
<p className={styles.bodyWide}>
  No more hopping between ten tabs or missing details. <strong>ConU Planner</strong> brings
  official course info, community insight, and live credit totals together so you decide
  faster and enroll with confidence. Instead of juggling Concordia docs, Reddit threads,
  RateMyProfessors, and a credit calculator, everything you need is streamlined into one
  clear, student-first view. That means less time searching, fewer mistakes, and more time
  focusing on what really matters — planning the semester that works best for you.
  <br/>
  <br/>
  <span className={styles.note}> The beam below shows how everything connects.</span>
</p>


      {/* Animated integration beam */}
      <section className={styles.section}>
        <AnimatedBeamDemo />
      </section>

      {/* Why it’s better */}
      <section className={styles.section}>
        <h2 className={styles.h2}>Why it’s better</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3>User experience first</h3>
            <p className={styles.muted}>Clean UI, instant results, filters that make sense.</p>
          </div>
          <div className={styles.card}>
            <h3>Advanced search &amp; filters</h3>
            <p className={styles.muted}>
              Filter by subject, term, credits, session, location—dedupe repeated offerings.
            </p>
          </div>
          <div className={styles.card}>
            <h3>Transparent prerequisites</h3>
            <p className={styles.muted}>
              Clear structures like “MATH 204 + COMP 249 → COMP 352” and “COMP 352 = COEN 352”.
            </p>
          </div>
          <div className={styles.card}>
            <h3>Rich metadata</h3>
            <p className={styles.muted}>
              Ready-made lists of terms, subjects, sessions, locations, and credit loads.
            </p>
          </div>
          <div className={styles.card}>
            <h3>Fast, extensible API</h3>
            <p className={styles.muted}>Built as an API from day one—web, mobile, and integrations.</p>
          </div>
          <div className={styles.card}>
            <h3>Future-ready</h3>
            <p className={styles.muted}>Saved plans, timetable generation, and more on the roadmap.</p>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className={styles.section}>
        <h2 className={styles.h2}>Team</h2>
        <div className={styles.teamGrid}>
          {TEAM.map((m) => (
            <Profile key={m.name} name={m.name} role={m.role} avatar={m.avatar} links={m.links} />
          ))}
        </div>

        <p className="body" style={{ marginTop: 10 }}>
          Want to contribute? <a className="link" href="mailto:hello@conuplanner.app">Email us</a>.
        </p>
      </section>
    </main>
  );
}
