"use client";

import styles from "./calendar-event.module.css";

const DEFAULT_EVENTS = [
  {
    title: "Enrollment Start",
    time: "View on Your Student Hub",
    colors: { bg: "#E9D5FF", bar: "#7C3AED", text: "#3B0764", meta: "#7E22CE" }, // purple
  },
  {
    title: "Last Date to Register",
    time: "View on Your Student Hub",
    colors: { bg: "#BAE6FD", bar: "#0EA5E9", text: "#083344", meta: "#0891B2" }, // cyan
  },
  {
    title: "Last Date to Disc",
    time: "View on Your Student Hub",
    colors: { bg: "#BBF7D0", bar: "#16A34A", text: "#052E16", meta: "#15803D" }, // green
  },
  {
    title: "Development",
    time: "16:00 - 17:00",
    colors: { bg: "#FEF08A", bar: "#EAB308", text: "#422006", meta: "#A16207" }, // yellow
  },
  {
    title: "QA Testing",
    time: "18:00 - 19:00",
    colors: { bg: "#FECACA", bar: "#EF4444", text: "#450A0A", meta: "#B91C1C" }, // red
  },
];

function EventCard({ evt }) {
  const styleVars = {
    "--evt-bg": evt.colors.bg,
    "--evt-bar": evt.colors.bar,
    "--evt-text": evt.colors.text,
    "--evt-meta": evt.colors.meta,
  };
  return (
    <div className={styles.event} style={styleVars}>
      <div className={styles.bar} />
      <div className={styles.info}>
        <div className={styles.title}>{evt.title}</div>
        <div className={styles.time}>{evt.time}</div>
      </div>
    </div>
  );
}

export default function CalendarEvent({ events = DEFAULT_EVENTS, max = 3 }) {
  const extra = Math.max(0, events.length - max);
  const now = new Date();
  const weekday = now.toLocaleString("default", { weekday: "short" });
  const day = now.getDate();

  return (
    <div className={styles.widget} aria-label="Calendar event widget">
      <div className={styles.header}>
        <span className={styles.weekday}>{weekday}</span>
        <span className={styles.day}>{day}</span>
      </div>

      <div className={styles.list}>
        {events.slice(0, max).map((e, i) => (
          <EventCard key={i} evt={e} />
        ))}
      </div>

      {extra > 0 ? (
        <>
          <div className={styles.moreRow}>
            <span className={styles.moreLabel}>
              +{extra} event{extra > 1 ? "s" : ""}
            </span>
            <span className={styles.moreTime}>16:15 - 20:00</span>
          </div>

          <div className={styles.trails}>
            <div />
            <div />
            <div />
          </div>
        </>
      ) : (
        <div className={styles.noMore}>No more events</div>
      )}
    </div>
  );
}
