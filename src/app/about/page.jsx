import styles from "./about.module.css";

export const metadata = {
  title: "About • ConU Planner",
  description: "What ConU Planner is and why it’s better for students.",
};

const TEAM = [
  // Add/adjust members. Avatar can be a public image path or leave empty to show initials.
  { name: "Your Name", role: "Founder & Dev", avatar: "/team/you.jpg" },
  { name: "Teammate One", role: "Backend", avatar: "" },
  { name: "Teammate Two", role: "Design", avatar: "" },
];

export default function AboutPage() {
  return (
    <main className={`container ${styles.page}`}>
      <h1 className={styles.title}>About ConU Planner</h1>
      <p className={styles.lead}>
        ConU Planner gives Concordia students a faster, smarter, student-first way to plan courses.
      </p>
      <p className="body" style={{ maxWidth: "70ch" }}>
        The official system is built for administration; we focus on speed, clarity, and helpful search—
        so you spend less time clicking and more time planning.
      </p>

      <section className={styles.section}>
        <h2 className={styles.h2}>Why it’s better</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3>User experience first</h3>
            <p className={styles.muted}>Clean UI, instant results, filters that make sense.</p>
          </div>
          <div className={styles.card}>
            <h3>Advanced search & filters</h3>
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

      <section className={styles.section}>
        <h2 className={styles.h2}>Our goal</h2>
        <p className="body" style={{ maxWidth: "70ch" }}>
          Turn raw course data into a flexible, student-focused planner.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}>Team</h2>
        <div className={styles.teamGrid}>
          {TEAM.map((m) => (
            <div className={styles.member} key={m.name}>
              <div
                className={styles.avatar}
                style={
                  m.avatar
                    ? { backgroundImage: `url(${m.avatar})` }
                    : undefined
                }
              >
                {!m.avatar ? initials(m.name) : null}
              </div>
              <div>
                <div className={styles.name}>{m.name}</div>
                <div className={styles.role}>{m.role}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="body" style={{ marginTop: 10 }}>
          Want to contribute? <a className="link" href="mailto:hello@conuplanner.app">Email us</a>.
        </p>
      </section>
    </main>
  );
}

function initials(name){
  return name
    .split(" ")
    .map((n) => n[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
