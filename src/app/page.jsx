import Link from "next/link";
import styles from "./home.module.css";
import SplitText from "@/components/SplitText";
import RotatingText from "@/components/RotatingText";

/* NEW: elegant display font for the line */
import { Playfair_Display } from "next/font/google";
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["700","800","900"] });

export default async function HomePage() {
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
            </div>

            <div className={styles.heroArtWrap}>
              <div className={styles.heroArtCard} />
              <div className={styles.heroArtBase} />
            </div>
          </div>
        </div>
      </section>

      {/* VALUE PROPS, ABOUT … (unchanged) */}
    </main>
  );
}
