import Link from "next/link";
import styles from "./home.module.css";
import { fetchPopularCourses } from "@/lib/mockApi";
import SplitText from "@/components/SplitText";

export default async function HomePage() {
  const popular = await fetchPopularCourses(); // mock data for now

  return (
    <main className={styles.page}>
      {/* HERO */}
      <section className={`${styles.section} ${styles.hero}`}>
        <div className={styles.container}>
          <div className={styles.heroGrid}>
            <div>
              <p className={styles.kicker}>ConU Planner</p>

              <SplitText
                  tag="h1"
                  text="Plan your Concordia courses with clarity."
                  className={styles.title}
                  textAlign="left"
                  splitType="words, chars"    // nice stagger by word then char
                  delay={60}                  // ms between letters
                  duration={0.5}
                  ease="power3.out"
                  from={{opacity: 0, y: 28}}
                  to={{opacity: 1, y: 0}}
                  threshold={0.15}
                  rootMargin="-120px"
              />

              <p className={styles.subtitle}>
                Search COMP &amp; SOEN courses, filter by term, credits, session and more—then
                build your perfect schedule.
              </p>

              {/* …the rest unchanged … */}
            </div>

            <div className={styles.heroArtWrap}>
              <div className={styles.heroArtCard}/>
              <div className={styles.heroArtBase}/>
            </div>

          </div>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.cardsGrid3}>
            <ValueCard title="Smart search"
                       desc="Fast, fuzzy search across title, subject, code, prerequisites and more."/>
            <ValueCard title="Powerful filters"
                       desc="Subject, term, session, location and credits—plus dedupe by course."/>
            <ValueCard title="Planner-friendly" desc="Add to planner and refine later."/>
          </div>
        </div>
      </section>

      {/* POPULAR COURSES */}
      <section className={styles.section}>
      <div className={styles.container}>
          <div className={styles.rowBetween}>
            <h2 className={styles.h2}>Popular Courses</h2>
            <Link href="/pages/courses" className="link">Explore all →</Link>
          </div>

          <div className={styles.cards}>
            {popular.length > 0 ? (
              popular.map((c) => {
                const cat = c.catalogue ?? c.catalog_nbr ?? "";
                const cr  = c.credits ?? c.course_credit ?? "-";
                const term = c.term ?? "";
                return (
                  <Link key={c.course_id} href={`/pages/courses?prefocus=${encodeURIComponent(c.course_id)}`} className="card">
                    <div className="courseCode"><strong>{c.subject} {cat}</strong></div>
                    <div className="cardTitle">{c.title}</div>
                    <div className="cardMeta">
                      {cr ? `${cr} cr` : "-"} {c.session ? `• ${c.session}` : ""} {term ? `• ${term}` : ""}
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="card">No courses found.</div>
            )}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.aboutGrid}>
            <div>
              <h3 className={styles.h2}>About ConU Planner</h3>
              <p className="body">
                A lightweight course planning UI for Concordia students. We’ll hook a backend later.
              </p>
            </div>
            <div className={styles.aboutArt}/>
          </div>
        </div>
      </section>
    </main>
  );
}

function ValueCard({ title, desc }) {
  return (
    <div className="card">
      <div className="valueIconDot" />
      <div className="cardTitle">{title}</div>
      <div className="cardMeta">{desc}</div>
    </div>
  );
}
