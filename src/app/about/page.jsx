import styles from "./about.module.css";
import Profile from "@/components/Profile"; // ← use the profile widget

export const metadata = {
  title: "About • ConU Planner",
  description: "What ConU Planner is and why it’s better for students.",
};

const TEAM = [
  {
    name: "Narendra Mishra",
    role: "Founder & Dev",
    avatar: "/team/profile1.jpg",
    links: {
      github: "https://github.com/your-handle",
      instagram: "https://instagram.com/your-handle",
      linkedin: "https://linkedin.com/in/your-handle"
    }
  },
  {
    name: "Aryan Kotecha",
    role: "Backend",
    avatar: "/team/profile1.jpg",
    links: {
      github: "https://github.com/your-handle",
      instagram: "https://instagram.com/your-handle",
      linkedin: "https://linkedin.com/in/your-handle"
    }
  },
  {
    name: "Neelendra Mishra",
    role: "Design",
    avatar: "/team/profile1.jpg",
    links: {
      github: "https://github.com/your-handle",
      instagram: "https://instagram.com/your-handle",
      linkedin: "https://linkedin.com/in/your-handle"
    }
  }
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
            <Profile
              key={m.name}
              name={m.name}
              role={m.role}
              avatar={m.avatar}
              links={m.links}
            />
          ))}
        </div>

        <p className="body" style={{ marginTop: 10 }}>
          Want to contribute? <a className="link" href="mailto:hello@conuplanner.app">Email us</a>.
        </p>
      </section>
    </main>
  );
}
