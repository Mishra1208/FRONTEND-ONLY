import Link from "next/link";

export default function Footer(){
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <div className="footer-brand">ConU Planner</div>
          <p className="footer-muted">Fast, simple course planning.</p>
        </div>
        <div>
          <div className="footer-head">Explore</div>
          <ul className="footer-list">
            <li><Link href="/pages/courses" className="footer-link">Courses</Link></li>
            <li><Link href="/pages/planner" className="footer-link">Planner</Link></li>
          </ul>
        </div>
        <div>
          <div className="footer-head">Resources</div>
          <ul className="footer-list">
            <li><Link href="/about" className="footer-link">About</Link></li>
          </ul>
        </div>
        <div>
          <div className="footer-head">Contact</div>
          <ul className="footer-list">
            <li><a href="mailto:hello@conuplanner.app" className="footer-link">Email</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">© {new Date().getFullYear()} ConU Planner</div>
    </footer>
  );
}
