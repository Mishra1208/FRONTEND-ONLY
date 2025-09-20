import Link from "next/link";
import styles from "./home.module.css";
import SplitText from "@/components/SplitText";
import RotatingText from "@/components/RotatingText";
import CalendarEvent from "@/components/widgets/CalendarEvent";

import { Playfair_Display } from "next/font/google";
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["700","800","900"] });

export default async function HomePage() {
  return (
    <main className={styles.page}>
      <section className={`${styles.section} ${styles.hero}`}>
        <div className={styles.container}>
          {/* 2-col hero */}
          <div className={styles.heroGrid}>
            {/* LEFT */}
            <div>
              <p className={styles.kicker}>ConU Planner</p>

              <SplitText
                tag="h1"
                text="Plan your Concordia courses with clarity"
                className={styles.title}
                textAlign="left"
                splitType="words, chars"
                delay={60}
                duration={0.5}
                ease="power3.out"
                from={{ opacity: 0, y: 28 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.15}
                rootMargin="-120px"
              />

              <p className={styles.subtitle}>
                Search COMP &amp; SOEN courses, filter by term, credits, session and more then
                build your perfect schedule.
              </p>

              {/* CTAs */}
              <div className={styles.ctaRow}>
                <Link href="/pages/courses" className={`${styles.btnPrimary} ${styles.btnLg}`}>Browse courses</Link>
                <Link href="/pages/planner" className={styles.btnGhost}>Open planner</Link>
              </div>

              {/* Rotating line */}
              <div className={styles.rotatorRow}>
                <span className={`${styles.ctaPrefix} ${styles.ctaPrefixLarge} ${playfair.className}`}>
                  All you have to
                </span>
                <RotatingText
                  texts={["Search", "Select", "Add/Remove", "Download"]}
                  mainClassName={styles.rotatorChip}
                  staggerFrom="last"
                  initial={{ y: "120%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "-120%", opacity: 0 }}
                  staggerDuration={0.03}
                  transition={{ type: "spring", damping: 30, stiffness: 400 }}
                  rotationInterval={1800}
                />
              </div>

              {/* mini steps */}
              <ul className={styles.steps}>
                <li><span>1</span> Search COMP/SOEN courses</li>
                <li><span>2</span> Select term & credits</li>
                <li><span>3</span> Add to Planner or Download</li>
              </ul>
            </div>

            {/* RIGHT art */}
            <div className={styles.heroArtWrap}>
              <div className={styles.heroArtCard} />
              <div className={styles.heroArtBase} />
            </div>
          </div>

          {/* NEW: full-width row in normal flow */}
          <div className={styles.calRow}>
            <p className={styles.calCopy}>
                <strong>Plan once</strong>, tweak in seconds, and skip the headaches. Save hours each term and cut
              the stress with a clear, glanceable schedule.
            </p>
            <div className={styles.calDock}>
              <CalendarEvent show={3} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
