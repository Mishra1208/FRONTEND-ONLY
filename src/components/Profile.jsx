import { Github, Instagram, Linkedin } from "lucide-react";
import styles from "./profile.module.css";

export default function Profile({ name, role, avatar, links = {} }) {
  return (
    <div className={styles.card}>
      <img src={avatar} alt={`${name} avatar`} className={styles.img} />
      <div className={styles.meta}>
        <div className={styles.name}>{name}</div>
        <div className={styles.role}>{role}</div>
      </div>

      <div className={styles.socialBar}>
        {links.github && (
          <a href={links.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <Github size={18} />
          </a>
        )}
        {links.instagram && (
          <a href={links.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <Instagram size={18} />
          </a>
        )}
        {links.linkedin && (
          <a href={links.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <Linkedin size={18} />
          </a>
        )}
      </div>
    </div>
  );
}
