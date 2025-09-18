import Link from "next/link";
import NavLink from "@/components/NavLink";
import Footer from "@/components/Footer";
import ThemeToggle from "@/components/ThemeToggle";
import Script from "next/script";
import { cookies } from "next/headers";          // ← add
import "@/styles/globals.css";

export const metadata = {
  title: "ConU Planner",
  description: "Plan your Concordia courses with clarity.",
};

export default function RootLayout({ children }) {
  // Read persisted theme (if any) from cookie on the server
  const themeCookie = cookies().get("theme")?.value;
  const initialTheme = themeCookie === "dark" ? "dark" : "light";

  return (
    <html lang="en" data-theme={initialTheme} suppressHydrationWarning>   {/* ← add data-theme + suppress */}
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Set theme ASAP on the client (before hydration) */}
        <Script id="theme-init" strategy="beforeInteractive">{`
          (function(){
            try {
              // 1) Use cookie if present (matches SSR)
              var m = document.cookie.match(/(?:^|; )theme=(dark|light)/);
              var cookieTheme = m && m[1];

              // 2) Else fall back to system preference
              var systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
              var next = cookieTheme || (systemDark ? 'dark' : 'light');

              document.documentElement.dataset.theme = next;
            } catch(e){}
          })();
        `}</Script>
      </head>
      <body>
        <header className="site-nav">
          <nav className="site-nav__inner">
            <div className="brand"><Link href="/">ConU Planner</Link></div>
            <ul>
              <li><NavLink href="/">Home</NavLink></li>
              <li><NavLink href="/pages/courses">Courses</NavLink></li>
              <li><NavLink href="/pages/planner">Planner</NavLink></li>
              <li><NavLink href="/about">About</NavLink></li>
              <li><ThemeToggle /></li>
            </ul>
          </nav>
        </header>

        <main className="site-main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
