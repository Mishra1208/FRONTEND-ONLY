import Link from "next/link";
import NavLink from "@/components/NavLink";
import Footer from "@/components/Footer";
import ThemeToggle from "@/components/ThemeToggle";
import Script from "next/script";
import { cookies } from "next/headers";
import "@/styles/globals.css";

export const metadata = {
  title: "ConU Planner",
  description: "Plan your Concordia courses with clarity.",
};

export default function RootLayout({ children }) {
  const themeCookie = cookies().get("theme")?.value;
  const initialTheme = themeCookie === "dark" ? "dark" : "light";

  return (
    <html lang="en" data-theme={initialTheme} suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
        <Script id="theme-init" strategy="beforeInteractive">{`
          (function(){
            try {
              var m = document.cookie.match(/(?:^|; )theme=(dark|light)/);
              var cookieTheme = m && m[1];
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
          <Link href="/" className="brand" aria-label="ConU Planner">
            <img src="/logo2.png" alt="ConU Planner" className="brandLogo"/>
          </Link>

          <ul>
            <li><NavLink href="/">Home</NavLink></li>
            <li><NavLink href="/pages/courses">Courses</NavLink></li>
            <li><NavLink href="/pages/planner">Planner</NavLink></li>
            <li><NavLink href="/about">About</NavLink></li>
            <li><ThemeToggle/></li>
          </ul>
        </nav>
      </header>


      <main className="site-main">{children}</main>
      <Footer/>
      </body>
    </html>
  );
}
