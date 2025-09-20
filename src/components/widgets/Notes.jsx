import styles from "./Notes.module.css";

export default function Notes() {
  return (
    // add the plain global class "noteKeep" next to the module class
    <aside className={`${styles.noteCard} noteKeep`} role="note" aria-label="Important note">
      <div className={styles.noteTitle}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <path fill="currentColor" d="M12 2L2 6v6c0 5 3.8 9.7 10 10c6.2-.3 10-5 10-10V6zM11 10h2v6h-2zm0-4h2v2h-2z"/>
        </svg>
        Important note
      </div>

      <p className={styles.noteBody}>
        This site is <strong>not</strong> an official Concordia tool. It was created by students for the Students, to
        help students plan schedules.
      </p>
      <p className={styles.noteSmall}>
        You’re responsible for your selections and registration. Always verify official course
        details and deadlines on Concordia’s systems before enrolling.
      </p>
    </aside>
  );
}
