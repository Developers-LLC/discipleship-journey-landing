/**
 * THE DISCIPLESHIP JOURNEY — Main Landing Page
 * Design: Modern Ministry Platform — Royal Blue (#0d1f3c) + Golden Orange (#f59e0b)
 * Typography: Playfair Display (headings) + Inter (body)
 * Layout: Asymmetric editorial with alternating navy/parchment sections
 */
import { useState, useEffect, useRef } from "react";
import React from "react";
import { Link } from "wouter";
import ReviewsAndFeedback from "@/components/ReviewsAndFeedback";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin, startGoogleLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";

// ─── Scroll-triggered fade-up hook ───────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ─── Gold Rule Divider ────────────────────────────────────────────────────────
function GoldRule({ label }: { label?: string }) {
  return (
    <div className="gold-rule text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: "#f59e0b" }}>
      {label || "✦"}
    </div>
  );
}

// ─── Reverent Line-Art Icons ──────────────────────────────────────────────────
function TimelineIcon({ type }: { type: string }) {
  const s = { stroke: "#f59e0b", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  const icons: Record<string, React.ReactElement> = {
    foundation: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <rect x="4" y="24" width="28" height="4" rx="1" {...s}/>
        <path d="M8 24V16l10-8 10 8v8" {...s}/>
        <rect x="14" y="16" width="8" height="8" {...s}/>
      </svg>
    ),
    book: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <path d="M6 28V10c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v18" {...s}/>
        <path d="M18 28V10c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v18" {...s}/>
        <path d="M6 28h24" {...s}/>
        <path d="M10 14h6M10 18h6" {...s}/>
        <path d="M20 14h6M20 18h6" {...s}/>
      </svg>
    ),
    tree: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <path d="M18 30V18" {...s}/>
        <path d="M18 18c0-6 8-10 8-10s-2 6-8 10z" {...s}/>
        <path d="M18 18c0-6-8-10-8-10s2 6 8 10z" {...s}/>
        <path d="M18 22c0-4 6-8 6-8s-1 5-6 8z" {...s}/>
        <path d="M18 22c0-4-6-8-6-8s1 5 6 8z" {...s}/>
        <path d="M12 30h12" {...s}/>
      </svg>
    ),
    path: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <path d="M18 30V6" {...s}/>
        <path d="M18 6l-5 5M18 6l5 5" {...s}/>
        <path d="M10 30c0 0 2-4 8-4s8 4 8 4" {...s}/>
        <circle cx="18" cy="6" r="2" stroke="#f59e0b" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
  };
  return (
    <div style={{ marginBottom: "0.5rem", opacity: 0.9 }}>
      {icons[type] || icons.book}
    </div>
  );
}

function SocialIcon({ type }: { type: string }) {
  const s = { stroke: "#f59e0b", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  const icons: Record<string, React.ReactElement> = {
    quill: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M26 4C18 4 8 12 8 24l4-4c0 0 2-8 14-16z" {...s}/>
        <path d="M8 24l-2 4 4-2" {...s}/>
        <path d="M12 20c2-2 4-3 6-3" {...s}/>
      </svg>
    ),
    scroll: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="6" y="8" width="20" height="18" rx="2" {...s}/>
        <path d="M6 12c-2 0-2-4 0-4h20c2 0 2 4 0 4" {...s}/>
        <path d="M10 16h12M10 20h8" {...s}/>
      </svg>
    ),
    door: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="8" y="4" width="16" height="24" rx="2" {...s}/>
        <path d="M4 28h24" {...s}/>
        <circle cx="21" cy="16" r="1.5" stroke="#f59e0b" strokeWidth="1.5" fill="none"/>
        <path d="M8 4c0 0 0 12 8 12" {...s}/>
      </svg>
    ),
    cross: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M16 4v24M6 12h20" {...s}/>
        <circle cx="16" cy="16" r="12" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" fill="none" opacity="0.4"/>
      </svg>
    ),
  };
  return (
    <div style={{ marginBottom: "0.75rem", opacity: 0.9 }}>
      {icons[type] || icons.cross}
    </div>
  );
}

// ─── Sticky Nav ───────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isAuthenticated, loading, logout } = useAuth();

  // Close menu on route/hash navigation
  const handleNavClick = () => setMenuOpen(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // Close user dropdown on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-user-menu]")) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userMenuOpen]);

  const avatarInitials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <>
    {/* ── Mobile backdrop ── */}
    {menuOpen && (
      <div
        className="fixed inset-0 z-40 md:hidden"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        onClick={() => setMenuOpen(false)}
      />
    )}

    {/* ── Mobile slide-in drawer ── */}
    <div
      className="fixed top-0 right-0 h-full z-50 md:hidden flex flex-col"
      style={{
        width: "min(320px, 85vw)",
        background: "#0d1f3c",
        borderLeft: "1px solid rgba(245,158,11,0.25)",
        transform: menuOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.32s cubic-bezier(0.23,1,0.32,1)",
        boxShadow: menuOpen ? "-8px 0 40px rgba(0,0,0,0.5)" : "none",
      }}
    >
      {/* Drawer header */}
      <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(245,158,11,0.15)" }}>
        <div className="flex items-center gap-2">
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="8" fill="#f59e0b" fillOpacity="0.12"/>
            <path d="M8 28V14c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v14" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20 28V14c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v14" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 28h24" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M20 4v8M17 7h6" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <span style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>
            The Discipleship Journey
          </span>
        </div>
        {/* Close button */}
        <button
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
          style={{ color: "rgba(255,255,255,0.7)", background: "none", border: "none", padding: "4px", cursor: "pointer" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Drawer nav links */}
      <nav className="flex flex-col px-6 py-8 gap-1" style={{ flex: 1 }}>
        {[
          { label: "Books", href: "#books" },
          { label: "Free Guide", href: "#free-guide" },
          { label: "For Pastors", href: "/pastor" },
          { label: "About", href: "#about" },
          { label: "Reviews", href: "#reviews" },
        ].map(({ label, href }) => (
          <a
            key={label}
            href={href}
            onClick={handleNavClick}
            className="flex items-center gap-3 py-4 text-base font-medium transition-colors duration-200"
            style={{
              color: "rgba(255,255,255,0.85)",
              fontFamily: "'Inter', sans-serif",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              textDecoration: "none",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#f59e0b")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
          >
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} />
            {label}
          </a>
        ))}
      </nav>

      {/* Drawer CTA */}
      <div className="px-6 pb-10">
        <a
          href="#free-guide"
          onClick={handleNavClick}
          className="btn-gold block text-center px-6 py-4 rounded-full text-sm font-bold w-full"
          style={{ color: "#0d1f3c", fontFamily: "'Inter', sans-serif", textDecoration: "none" }}
        >
          Yes — Download the Free Guide ✦
        </a>
        {!loading && !isAuthenticated && (
          <>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", textAlign: "center", marginTop: "0.75rem", fontFamily: "'Inter', sans-serif" }}>
              Free. No spam. Unsubscribe anytime.
            </p>
            <button
              onClick={() => { handleNavClick(); startLogin(); }}
              style={{
                display: "block",
                width: "100%",
                marginTop: "0.75rem",
                background: "transparent",
                border: "1.5px solid rgba(255,255,255,0.25)",
                borderRadius: "9999px",
                padding: "0.85rem",
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.88rem",
                fontWeight: 600,
                color: "rgba(255,255,255,0.75)",
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              Sign In
            </button>
          </>
        )}
        {/* Google sign-in button — mobile drawer */}
        {!loading && !isAuthenticated && (
          <button
            onClick={() => { handleNavClick(); startGoogleLogin(); }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              width: "100%",
              marginTop: "0.6rem",
              background: "#fff",
              border: "none",
              borderRadius: "9999px",
              padding: "0.85rem",
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.88rem",
              fontWeight: 600,
              color: "#3c4043",
              cursor: "pointer",
              boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Sign in with Google
          </button>
        )}
        {!loading && isAuthenticated && (
          <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <a
              href="/profile"
              onClick={handleNavClick}
              style={{
                display: "block",
                background: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.25)",
                borderRadius: "9999px",
                padding: "0.75rem",
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.88rem",
                fontWeight: 600,
                color: "#f59e0b",
                textDecoration: "none",
                textAlign: "center",
              }}
            >
              My Profile
            </a>
            <a
              href="/orders"
              onClick={handleNavClick}
              style={{
                display: "block",
                background: "rgba(245,158,11,0.07)",
                border: "1px solid rgba(245,158,11,0.2)",
                borderRadius: "9999px",
                padding: "0.75rem",
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.88rem",
                fontWeight: 600,
                color: "#f59e0b",
                textDecoration: "none",
                textAlign: "center",
              }}
            >
              My Books
            </a>
            <button
              onClick={() => { handleNavClick(); logout(); }}
              style={{
                display: "block",
                width: "100%",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "9999px",
                padding: "0.75rem",
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.88rem",
                fontWeight: 600,
                color: "rgba(255,255,255,0.55)",
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>

    {/* ── Top navbar ── */}
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(13,31,60,0.97)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.3)" : "none",
        borderBottom: scrolled ? "1px solid rgba(245,158,11,0.2)" : "none",
      }}
    >
      <div className="container flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          {/* Logo mark: cross + book */}
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="8" fill="#f59e0b" fillOpacity="0.12"/>
            {/* Open book base */}
            <path d="M8 28V14c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v14" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20 28V14c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v14" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 28h24" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
            {/* Cross above */}
            <path d="M20 4v8M17 7h6" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <span style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontWeight: 700, fontSize: "1.1rem" }}>
            The Discipleship Journey
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8">
        {["Books", "Free Guide", "For Pastors", "About"].map((item) => (
           <a
             key={item}
             href={item === "For Pastors" ? "/pastor" : `#${item.toLowerCase().replace(" ", "-")}`}
             className="text-sm font-medium transition-colors duration-200"
             style={{ color: "rgba(255,255,255,0.8)", fontFamily: "'Inter', sans-serif" }}
             onMouseEnter={e => (e.currentTarget.style.color = "#f59e0b")}
             onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
           >
             {item}
           </a>
         ))}
          <a
            href="#reviews"
            className="text-sm font-medium transition-colors duration-200"
            style={{ color: "rgba(255,255,255,0.8)", fontFamily: "'Inter', sans-serif" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#f59e0b")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
          >
            Reviews
          </a>
          {!loading && !isAuthenticated && (
            <>
              <a
                href="#free-guide"
                className="btn-gold px-5 py-2 rounded-full text-sm font-bold"
                style={{ color: "#0d1f3c", fontFamily: "'Inter', sans-serif", textDecoration: "none" }}
              >
                Download Free Guide
              </a>
              <button
                onClick={() => startLogin()}
                className="text-sm font-medium transition-colors duration-200"
                style={{
                  color: "rgba(255,255,255,0.8)",
                  fontFamily: "'Inter', sans-serif",
                  background: "none",
                  border: "1.5px solid rgba(255,255,255,0.3)",
                  borderRadius: "9999px",
                  padding: "0.4rem 1.1rem",
                  cursor: "pointer",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#f59e0b"; (e.currentTarget as HTMLButtonElement).style.color = "#f59e0b"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.3)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.8)"; }}
              >
                Sign In
              </button>
            </>
          )}
          {/* Google sign-in button — desktop, always visible when logged out */}
          {!loading && !isAuthenticated && (
            <button
              onClick={() => startGoogleLogin()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                background: "#fff",
                border: "none",
                borderRadius: "9999px",
                padding: "0.4rem 1rem 0.4rem 0.55rem",
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: "0.82rem",
                color: "#3c4043",
                boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
                transition: "box-shadow 0.18s ease",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 10px rgba(0,0,0,0.35)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.25)"; }}
            >
              {/* Google "G" logo SVG */}
              <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              Sign in with Google
            </button>
          )}
          {!loading && isAuthenticated && (
            <div data-user-menu style={{ position: "relative" }}>
              <button
                onClick={() => setUserMenuOpen(v => !v)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "rgba(245,158,11,0.12)",
                  border: "1.5px solid rgba(245,158,11,0.35)",
                  borderRadius: "9999px",
                  padding: "0.35rem 0.75rem 0.35rem 0.4rem",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #0d1f3c 0%, #1a3a6b 100%)",
                    border: "1.5px solid #f59e0b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.65rem",
                    color: "#f59e0b",
                    flexShrink: 0,
                  }}
                >
                  {avatarInitials}
                </div>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.82rem", color: "#f59e0b", fontWeight: 600, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.name ?? "Account"}
                </span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: "#f59e0b", transform: userMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {userMenuOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    background: "#0d1f3c",
                    border: "1px solid rgba(245,158,11,0.25)",
                    borderRadius: "0.75rem",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                    minWidth: 180,
                    overflow: "hidden",
                    zIndex: 100,
                    animation: "dropIn 0.18s cubic-bezier(0.23,1,0.32,1)",
                  }}
                >
                  <style>{`@keyframes dropIn { from { opacity:0; transform:scale(0.95) translateY(-4px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
                  <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    <p style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontWeight: 600, fontSize: "0.9rem", margin: 0 }}>{user?.name ?? "Account"}</p>
                    {user?.email && <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.45)", fontSize: "0.75rem", margin: "0.15rem 0 0" }}>{user.email}</p>}
                  </div>
                  <a
                    href="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.7rem 1rem",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.85rem",
                      color: "rgba(255,255,255,0.8)",
                      textDecoration: "none",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(245,158,11,0.08)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                    My Profile
                  </a>
                  <a
                    href="/orders"
                    onClick={() => setUserMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.7rem 1rem",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.85rem",
                      color: "rgba(255,255,255,0.8)",
                      textDecoration: "none",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(245,158,11,0.08)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                    My Books
                  </a>
                  <button
                    onClick={() => { setUserMenuOpen(false); logout(); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      width: "100%",
                      padding: "0.7rem 1rem",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.85rem",
                      color: "rgba(255,255,255,0.6)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,113,113,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "#f87171"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)"; }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Hamburger button (mobile only) ── */}
        <button
          className="md:hidden flex flex-col justify-center items-center gap-[5px] p-2"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <span
            style={{
              display: "block", width: 24, height: 2, background: "#f59e0b", borderRadius: 2,
              transition: "all 0.2s ease",
            }}
          />
          <span
            style={{
              display: "block", width: 18, height: 2, background: "#f59e0b", borderRadius: 2,
              transition: "all 0.2s ease",
            }}
          />
          <span
            style={{
              display: "block", width: 24, height: 2, background: "#f59e0b", borderRadius: 2,
              transition: "all 0.2s ease",
            }}
          />
        </button>
      </div>
    </nav>
    </>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: "#0d1f3c" }}
    >
      {/* Full-bleed hero background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/manus-storage/hero_banner_kdp_v2_1159854e.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          opacity: 0.55,
        }}
      />
      {/* Dark gradient overlay for text legibility */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(105deg, rgba(13,31,60,0.92) 0%, rgba(13,31,60,0.7) 50%, rgba(13,31,60,0.3) 100%)",
        }}
      />

      <div className="container relative z-10 py-32 lg:py-40">
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <div className="fade-up fade-up-1 flex items-center gap-3 mb-6">
            <span style={{ width: 40, height: 2, background: "#f59e0b", display: "inline-block" }} />
            <span style={{ color: "#f59e0b", fontFamily: "'Inter', sans-serif", fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase" }}>
              3-Book KDP Ebook Series
            </span>
          </div>

          {/* Main headline */}
          <h1
            className="fade-up fade-up-2 mb-6 leading-tight"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(2.8rem, 6vw, 5rem)",
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.1,
            }}
          >
            Your Faith Journey<br />
            <span style={{ color: "#f59e0b" }}>Doesn't Have to Be</span><br />
            Confusing.
          </h1>

          {/* Subheadline */}
          <p
            className="fade-up fade-up-3 mb-8 text-lg leading-relaxed"
            style={{ color: "rgba(255,255,255,0.85)", fontFamily: "'Inter', sans-serif", maxWidth: "520px" }}
          >
            A complete 3-book discipleship series for new believers, small group leaders, and church pastors — grounded in the KJV Bible, built for the modern church.
          </p>

          {/* CTA group */}
          <div className="fade-up fade-up-4 flex flex-col sm:flex-row gap-4">
            <a
              href="#free-guide"
              className="btn-gold px-8 py-4 rounded-full font-bold text-center"
              style={{ color: "#0d1f3c", fontFamily: "'Inter', sans-serif", fontSize: "1rem", textDecoration: "none", display: "inline-block" }}
            >
              Yes — Download the Free Guide ✦
            </a>
            <a
              href="#books"
              className="px-8 py-4 rounded-full font-semibold text-center transition-all duration-200"
              style={{
                color: "#fff",
                fontFamily: "'Inter', sans-serif",
                fontSize: "1rem",
                textDecoration: "none",
                border: "1.5px solid rgba(255,255,255,0.35)",
                display: "inline-block",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#f59e0b"; (e.currentTarget as HTMLElement).style.color = "#f59e0b"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.35)"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
            >
              View the Series →
            </a>
          </div>

          {/* Social proof micro-stat */}
          <div className="fade-up fade-up-5 flex items-center gap-6 mt-10">
            {[
              { num: "3", label: "Books in the Series" },
              { num: "75+", label: "ARC Readers" },
              { num: "FREE", label: "Starter Guide" },
            ].map(({ num, label }) => (
              <div key={label} className="text-center">
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", fontWeight: 700, color: "#f59e0b" }}>{num}</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.7rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ color: "rgba(255,255,255,0.4)" }}>
        <span style={{ fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif" }}>Scroll</span>
        <div style={{ width: 1, height: 40, background: "linear-gradient(to bottom, rgba(245,158,11,0.6), transparent)" }} />
      </div>
    </section>
  );
}

// ─── Lead Magnet Opt-in Section ───────────────────────────────────────────────
function LeadMagnet() {
  const { ref, visible } = useInView();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && name) {
      setSubmitted(true);
      // Trigger immediate PDF download
      const link = document.createElement("a");
      link.href = "/manus-storage/lead_magnet_8063a5de.pdf";
      link.download = "5-Questions-Every-New-Believer-Is-Afraid-To-Ask.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <section id="free-guide" style={{ background: "#0d1f3c" }}>
      <div className="container py-24">
        <div ref={ref} className={`grid lg:grid-cols-2 gap-16 items-center transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {/* Left: PDF mockup */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-2xl"
                style={{ background: "radial-gradient(circle at center, rgba(245,158,11,0.25) 0%, transparent 70%)", transform: "scale(1.2)" }}
              />
              <img
                src="/manus-storage/lead_magnet_cover_fe9c8b12.jpg"
                alt="Free Guide: 5 Questions Every New Believer Is Afraid to Ask"
                className="relative rounded-2xl"
                style={{ maxWidth: 320, width: "100%", boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 40px rgba(245,158,11,0.15)" }}
              />
              <div
                className="absolute -top-3 -right-3 rounded-full flex items-center justify-center"
                style={{ width: 72, height: 72, background: "#f59e0b", boxShadow: "0 4px 20px rgba(245,158,11,0.5)" }}
              >
                <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "0.75rem", color: "#0d1f3c", textAlign: "center", lineHeight: 1.2 }}>FREE<br/>PDF</span>
              </div>
            </div>
          </div>

          {/* Right: Opt-in form */}
          <div>
            <GoldRule label="Free Download" />
            <h2
              className="mt-4 mb-4"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 700, color: "#fff", lineHeight: 1.2 }}
            >
              5 Questions Every New Believer Is Afraid to Ask
            </h2>
            <p className="mb-2" style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.7)", fontSize: "1rem" }}>
              <em style={{ color: "#f59e0b" }}>"And Simple Biblical Answers"</em>
            </p>
            <p className="mb-8" style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.7)", fontSize: "0.95rem", lineHeight: 1.7 }}>
              Extracted from Chapter 8 of <strong style={{ color: "#fff" }}>BELONG</strong>, this free PDF guide answers the questions new believers are too afraid to ask — with clear, grounded, KJV-based answers.
            </p>

            {submitted ? (
              <div
                className="rounded-2xl p-8 text-center"
                style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>✦</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#f59e0b", fontSize: "1.4rem", marginBottom: "0.5rem" }}>Welcome to the Journey!</h3>
                <p style={{ color: "rgba(255,255,255,0.8)", fontFamily: "'Inter', sans-serif", fontSize: "0.9rem" }}>
                  Your PDF is downloading now. Enjoy the guide — and watch for our 3-day email series with deeper insights from the series.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Your First Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full px-5 py-4 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#fff",
                    fontFamily: "'Inter', sans-serif",
                  }}
                  onFocus={e => (e.target.style.borderColor = "#f59e0b")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.15)")}
                />
                <input
                  type="email"
                  placeholder="Your Email Address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-5 py-4 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#fff",
                    fontFamily: "'Inter', sans-serif",
                  }}
                  onFocus={e => (e.target.style.borderColor = "#f59e0b")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.15)")}
                />
                <button type="submit" className="btn-gold w-full py-4 rounded-xl font-bold text-base" style={{ color: "#0d1f3c", fontFamily: "'Inter', sans-serif" }}>
                  Yes — Download the Free Guide ✦
                </button>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", textAlign: "center", fontFamily: "'Inter', sans-serif" }}>
                  No spam. Unsubscribe anytime. Your information is safe.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Scripture Banner ─────────────────────────────────────────────────────────
function ScriptureBanner() {
  return (
    <div style={{ background: "linear-gradient(135deg, #1a3a6b 0%, #0d1f3c 100%)", borderTop: "1px solid rgba(245,158,11,0.2)", borderBottom: "1px solid rgba(245,158,11,0.2)" }}>
      <div className="container py-12 text-center">
        <blockquote className="scripture-quote" style={{ border: "none", paddingLeft: 0, maxWidth: 700, margin: "0 auto" }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.2rem, 2.5vw, 1.7rem)", fontStyle: "italic", color: "#f59e0b", lineHeight: 1.6 }}>
            "Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost."
          </p>
          <footer style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'Inter', sans-serif", fontSize: "0.85rem", marginTop: "0.75rem", letterSpacing: "0.1em" }}>
            — MATTHEW 28:19, KJV
          </footer>
        </blockquote>
      </div>
    </div>
  );
}

// ─── Books Section ────────────────────────────────────────────────────────────
const BOOKS = [
  {
    img: "/manus-storage/BELONG_KDP_Cover_8e45f300.jpg",
    title: "BELONG",
    subtitle: "Book 1 — You Are Welcomed",
    price: "$0.99",
    regularPrice: "$3.99",
    tag: "LAUNCH PRICE",
    desc: "Discover your identity in Christ, overcome the guilt of your past, and find your place in the family of God. The perfect starting point for every new believer.",
    verse: '"Come to me, all ye that labour and are heavy laden, and I will give you rest." — Matthew 11:28',
    productKey: "belong" as const,
  },
  {
    img: "/manus-storage/GROW_KDP_Cover_ea301040.jpg",
    title: "GROW",
    subtitle: "Book 2 — You Are Transformed",
    price: "$4.99",
    tag: "AVAILABLE NOW",
    desc: "Deepen your roots in prayer, Scripture, and community. Learn to hear God's voice and bear lasting fruit in every area of your life.",
    verse: '"But grow in grace, and in the knowledge of our Lord and Saviour Jesus Christ." — 2 Peter 3:18',
    productKey: "grow" as const,
  },
  {
    img: "/manus-storage/GO_KDP_Cover_3681b44e.jpg",
    title: "GO",
    subtitle: "Book 3 — You Are Sent",
    price: "$4.99",
    tag: "AVAILABLE NOW",
    desc: "Step into your calling as a witness. Learn to share your faith naturally, make disciples, and become the change your community needs.",
    verse: '"Go ye therefore, and teach all nations..." — Matthew 28:19',
    productKey: "go" as const,
  },
];

// ─── Buy Button ───────────────────────────────────────────────────────────────
function BuyButton({ productKey, label = "Buy Now" }: { productKey: "belong" | "grow" | "go" | "bundle"; label?: string }) {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { data: ownsData } = trpc.stripe.owns.useQuery({ productKey }, { enabled: isAuthenticated });
  const checkout = trpc.stripe.createCheckout.useMutation({
    onSuccess: ({ url }) => {
      toast.info("Redirecting to checkout…");
      window.open(url, "_blank");
    },
    onError: (err) => toast.error(err.message),
  });

  if (isAuthenticated && ownsData?.owned) {
    return (
      <button
        onClick={() => navigate("/orders")}
        className="px-5 py-2 rounded-full text-sm font-bold"
        style={{ background: "#16a34a", color: "#fff", fontFamily: "'Inter', sans-serif", border: "none", cursor: "pointer" }}
      >
        ✓ Download
      </button>
    );
  }

  return (
    <button
      onClick={() => {
        if (!isAuthenticated) {
          toast.info("Please sign in to purchase");
          startLogin();
          return;
        }
        checkout.mutate({ productKey });
      }}
      disabled={checkout.isPending}
      className="btn-gold px-5 py-2 rounded-full text-sm font-bold"
      style={{ color: "#0d1f3c", fontFamily: "'Inter', sans-serif", border: "none", cursor: "pointer", opacity: checkout.isPending ? 0.7 : 1 }}
    >
      {checkout.isPending ? "Loading…" : label}
    </button>
  );
}

function BooksSection() {
  const { ref, visible } = useInView();
  return (
    <section id="books" style={{ background: "#fdf8f0" }}>
      <div className="container py-24">
        <div className="text-center mb-16">
          <GoldRule label="The Series" />
          <h2
            className="mt-4 mb-4"
            style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, color: "#0d1f3c" }}
          >
            Three Books. One Complete Journey.
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", color: "#4a5568", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
            From your first day as a believer to becoming a confident witness — <em>The Discipleship Journey</em> walks with you every step of the way.
          </p>
        </div>

        <div ref={ref} className={`grid md:grid-cols-3 gap-8 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {BOOKS.map((book, i) => (
            <div
              key={book.title}
              className="book-card rounded-2xl overflow-hidden flex flex-col"
              style={{
                background: "#fff",
                border: "1px solid rgba(13,31,60,0.08)",
                boxShadow: "0 4px 24px rgba(13,31,60,0.08)",
                transitionDelay: `${i * 80}ms`,
              }}
            >
              {/* KDP cover — full portrait, no crop */}
              <div className="relative" style={{ background: "#0d1f3c", padding: "1.25rem 1.25rem 0" }}>
                <div
                  className="relative overflow-hidden rounded-xl"
                  style={{
                    aspectRatio: "1 / 1.6",
                    boxShadow: "0 12px 40px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)",
                  }}
                >
                  <img
                    src={book.img}
                    alt={`${book.title} — The Discipleship Journey Book Cover`}
                    className="w-full h-full"
                    style={{ objectFit: "cover", objectPosition: "center top", display: "block" }}
                  />
                </div>
                {/* Tag badge */}
                <div
                  className="absolute top-5 right-5 px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: "#f59e0b", color: "#0d1f3c", fontFamily: "'Inter', sans-serif", letterSpacing: "0.05em" }}
                >
                  {book.tag}
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", fontWeight: 900, color: "#0d1f3c", marginBottom: "0.25rem" }}>
                  {book.title}
                </h3>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8rem", color: "#f59e0b", fontWeight: 600, letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
                  {book.subtitle}
                </p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.9rem", color: "#4a5568", lineHeight: 1.6, marginBottom: "1rem", flex: 1 }}>
                  {book.desc}
                </p>
                <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: "0.8rem", color: "#1a3a6b", marginBottom: "1.25rem", lineHeight: 1.5 }}>
                  "{book.verse.split('"')[1]}"
                  <span style={{ display: "block", fontStyle: "normal", fontSize: "0.72rem", color: "#f59e0b", marginTop: "0.25rem" }}>
                    — {book.verse.split("—")[1]?.trim()}
                  </span>
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, color: "#0d1f3c" }}>{book.price}</span>
                    {book.regularPrice && (
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8rem", color: "#aaa", textDecoration: "line-through", marginLeft: "0.5rem" }}>
                        {book.regularPrice}
                      </span>
                    )}
                  </div>
                  <BuyButton productKey={book.productKey} label="Buy Now" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Boxset CTA */}
        <div
          className="mt-12 rounded-2xl p-8 md:p-12 text-center"
          style={{ background: "linear-gradient(135deg, #0d1f3c 0%, #1a3a6b 100%)", border: "1px solid rgba(245,158,11,0.25)" }}
        >
          <GoldRule label="Best Value" />
          <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 700, margin: "0.75rem 0 0.5rem" }}>
            Get the Complete 3-Book Boxset
          </h3>
          <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.7)", marginBottom: "1.5rem" }}>
            All three books for one complete discipleship journey — available at a special bundle price.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.5rem", fontWeight: 900, color: "#f59e0b" }}>$9.99</span>
            <span style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>vs. $13.97 separately</span>
            <BuyButton productKey="bundle" label="Get the Bundle ✦" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Launch Timeline Section ──────────────────────────────────────────────────
const TIMELINE = [
  { phase: "Weeks 1–4", label: "Foundation", icon: "foundation", color: "#1a3a6b", desc: "Establish your discipleship community, recruit early readers, and build the platform that will carry the series." },
  { phase: "Month 1", label: "BELONG Launches", icon: "book", color: "#0d1f3c", desc: "Book 1 goes live. New believers and small group leaders discover their place in the family of God." },
  { phase: "Month 2", label: "GROW Launches", icon: "tree", color: "#1a3a6b", desc: "Book 2 deepens the journey. Readers who began with BELONG continue into spiritual transformation." },
  { phase: "Month 3", label: "GO + Complete Series", icon: "path", color: "#0d1f3c", desc: "Book 3 and the complete boxset release. The full discipleship journey — from welcome to witness — is available." },
];

function LaunchTimeline() {
  const { ref, visible } = useInView();
  return (
    <section style={{ background: "#0d1f3c" }}>
      <div className="container py-24">
        <div className="text-center mb-16">
          <GoldRule label="The Journey Unfolds" />
          <h2
            className="mt-4 mb-4"
            style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, color: "#fff" }}
          >
            A Series Built for the Long Journey
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.65)", maxWidth: 520, margin: "0 auto" }}>
            Three books released over three months — each one building on the last, walking believers from their first step of faith to confident witness.
          </p>
        </div>

        <div ref={ref} className={`grid md:grid-cols-4 gap-6 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {TIMELINE.map((item, i) => (
            <div
              key={item.phase}
              className="rounded-2xl p-6 flex flex-col gap-3"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(245,158,11,0.15)",
                transitionDelay: `${i * 80}ms`,
              }}
            >
              <TimelineIcon type={item.icon} />
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.7rem", color: "#f59e0b", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                {item.phase}
              </div>
              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>
                {item.label}
              </h4>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── For Pastors Section ──────────────────────────────────────────────────────
function ForPastors() {
  const { ref, visible } = useInView();
  return (
    <section id="for-pastors" style={{ background: "#fdf8f0" }}>
      <div className="container py-24">
        <div ref={ref} className={`grid lg:grid-cols-2 gap-16 items-center transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div>
            <GoldRule label="For Pastors & Church Leaders" />
            <h2
              className="mt-4 mb-6"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 700, color: "#0d1f3c", lineHeight: 1.2 }}
            >
              Equip Your Entire Congregation — Free Review Copies for Pastors
            </h2>
            <p style={{ fontFamily: "'Inter', sans-serif", color: "#4a5568", lineHeight: 1.8, marginBottom: "1.5rem" }}>
              We believe in the local church. That's why we offer senior pastors and discipleship directors a <strong>free complete digital review set</strong> of all three books, plus small group discussion guide PDFs — at no cost.
            </p>
            <div className="space-y-4 mb-8">
              {[
                { icon: "📚", text: "Free digital review copies of Books 1, 2, and 3" },
                { icon: "📋", text: "Small group discussion guide PDFs for CLASS 101/201/301/401" },
                { icon: "⛪", text: "$99/year flat-rate site license for unlimited member distribution" },
                { icon: "📦", text: "Bulk paperback orders available for church classes" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-start gap-3">
                  <span style={{ fontSize: "1.2rem", flexShrink: 0, marginTop: "0.1rem" }}>{icon}</span>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.95rem", color: "#2d3748" }}>{text}</span>
                </div>
              ))}
            </div>
            <Link
              href="/pastor"
              className="btn-gold inline-block px-8 py-4 rounded-full font-bold"
              style={{ color: "#0d1f3c", fontFamily: "'Inter', sans-serif", textDecoration: "none" }}
            >
              Request Your Free Pastor Review Set →
            </Link>
          </div>

          {/* Funnel diagram */}
          <div className="flex justify-center">
            <div className="w-full max-w-sm space-y-3">
              {[
                { step: "1", label: "Pastor Opt-in Page", sub: "Request your free review set" },
                { step: "2", label: "Free Digital Boxset", sub: "All 3 books + discussion guides" },
                { step: "3", label: "Curriculum Preview Call", sub: "15-min discovery conversation" },
                { step: "4", label: "Church Licensing", sub: "$99/yr unlimited distribution" },
              ].map((item, i) => (
                <div key={item.step}>
                  <div
                    className="rounded-xl p-4 flex items-center gap-4"
                    style={{ background: i === 3 ? "#0d1f3c" : "#fff", border: `1px solid ${i === 3 ? "rgba(245,158,11,0.4)" : "rgba(13,31,60,0.1)"}`, boxShadow: "0 2px 12px rgba(13,31,60,0.06)" }}
                  >
                    <div
                      className="rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ width: 40, height: 40, background: i === 3 ? "#f59e0b" : "#0d1f3c", color: i === 3 ? "#0d1f3c" : "#fff", fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1rem" }}
                    >
                      {item.step}
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, color: i === 3 ? "#f59e0b" : "#0d1f3c", fontSize: "0.95rem" }}>{item.label}</div>
                      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.78rem", color: i === 3 ? "rgba(255,255,255,0.7)" : "#718096" }}>{item.sub}</div>
                    </div>
                  </div>
                  {i < 3 && (
                    <div className="flex justify-center py-1">
                      <div style={{ width: 2, height: 16, background: "linear-gradient(to bottom, #f59e0b, rgba(245,158,11,0.3))" }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Social Media Calendar Section ───────────────────────────────────────────
const SOCIAL_CALENDAR = [
  { week: "Week 1", theme: "The Story Behind It", icon: "quill", content: "A glimpse into the heart behind BELONG — why this series was written and who it was written for.", platform: "All Platforms" },
  { week: "Week 2", theme: "Free Guide Available", icon: "scroll", content: "Struggling with hard questions about your faith? Download our free guide — 5 questions every new believer asks.", platform: "Facebook + Instagram" },
  { week: "Week 3", theme: "Invitation to Join", icon: "door", content: "Seven days until BELONG is available. Would you like an advance copy to read and share your thoughts?", platform: "Email + Social" },
  { week: "Week 4", theme: "BELONG Is Here", icon: "cross", content: "BELONG is now available on Amazon. For a limited time, get it at our introductory price and begin the journey.", platform: "All Platforms" },
];

function SocialCalendar() {
  const { ref, visible } = useInView();
  return (
    <section style={{ background: "#0d1f3c" }}>
      <div className="container py-24">
        <div className="text-center mb-16">
          <GoldRule label="Sharing the Journey" />
          <h2
            className="mt-4 mb-4"
            style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, color: "#fff" }}
          >
            A Month of Faithful Outreach
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.65)", maxWidth: 520, margin: "0 auto" }}>
            A week-by-week guide for sharing the series with your congregation, small group, and community — one story at a time.
          </p>
        </div>

        <div ref={ref} className={`grid md:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {SOCIAL_CALENDAR.map((item, i) => (
            <div
              key={item.week}
              className="rounded-2xl p-6"
              style={{
                background: i === 3 ? "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 100%)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${i === 3 ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.08)"}`,
                transitionDelay: `${i * 80}ms`,
              }}
            >
              <SocialIcon type={item.icon} />
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.7rem", color: "#f59e0b", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.25rem" }}>
                {item.week}
              </div>
              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: "0.75rem" }}>
                {item.theme}
              </h4>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.6, marginBottom: "1rem" }}>
                "{item.content}"
              </p>
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", fontFamily: "'Inter', sans-serif" }}
              >
                {item.platform}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── About / Author Section ───────────────────────────────────────────────────
function AboutSection() {
  const { ref, visible } = useInView();
  return (
    <section id="about" style={{ background: "#fdf8f0" }}>
      <div className="container py-24">
        <div ref={ref} className={`max-w-3xl mx-auto text-center transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <GoldRule label="About the Series" />
          <h2
            className="mt-4 mb-6"
            style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 700, color: "#0d1f3c" }}
          >
            Written for the Church. Grounded in Scripture.
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", color: "#4a5568", lineHeight: 1.8, fontSize: "1rem", marginBottom: "1.5rem" }}>
            <em>The Discipleship Journey: From Welcome to Witness</em> was written to fill a gap in the modern church — a practical, biblically-grounded resource that walks new believers through their first steps of faith and equips them to become confident witnesses.
          </p>
          <p style={{ fontFamily: "'Inter', sans-serif", color: "#4a5568", lineHeight: 1.8, fontSize: "1rem", marginBottom: "2rem" }}>
            Each book corresponds to a stage of discipleship: <strong style={{ color: "#0d1f3c" }}>BELONG</strong> (identity and community), <strong style={{ color: "#0d1f3c" }}>GROW</strong> (spiritual disciplines and transformation), and <strong style={{ color: "#0d1f3c" }}>GO</strong> (mission and witness). Together, they form a complete curriculum for CLASS 101–401 tracks.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {["KJV Bible-Based", "Small Group Ready", "New Believer Friendly", "Pastor Approved", "Church Licensed"].map(tag => (
              <span
                key={tag}
                className="px-4 py-2 rounded-full text-sm font-medium"
                style={{ background: "#0d1f3c", color: "#f59e0b", fontFamily: "'Inter', sans-serif" }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: "#060f1e", borderTop: "1px solid rgba(245,158,11,0.15)" }}>
      <div className="container py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
                <rect width="36" height="36" rx="6" fill="#f59e0b" fillOpacity="0.15"/>
                <path d="M18 6v24M10 14h16" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M10 22c0 0 2-2 8-2s8 2 8 2" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontWeight: 700 }}>The Discipleship Journey</span>
            </div>
            <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.45)", fontSize: "0.85rem", lineHeight: 1.7 }}>
              From Welcome to Witness — a 3-book KDP ebook series for new believers, small group leaders, and church pastors.
            </p>
          </div>
          <div>
            <h5 style={{ fontFamily: "'Playfair Display', serif", color: "#f59e0b", fontWeight: 600, marginBottom: "1rem" }}>Quick Links</h5>
            <div className="space-y-2">
              {[["Books", "#books"], ["Free Guide", "#free-guide"], ["For Pastors", "/pastor"], ["About", "#about"]].map(([label, href]) => (
                <a key={label} href={href} style={{ display: "block", fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", textDecoration: "none" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#f59e0b")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h5 style={{ fontFamily: "'Playfair Display', serif", color: "#f59e0b", fontWeight: 600, marginBottom: "1rem" }}>Get the Free Guide</h5>
            <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", marginBottom: "1rem" }}>
              5 Questions Every New Believer Is Afraid to Ask — free PDF download.
            </p>
            <a
              href="#free-guide"
              className="btn-gold inline-block px-6 py-2 rounded-full text-sm font-bold"
              style={{ color: "#0d1f3c", fontFamily: "'Inter', sans-serif", textDecoration: "none" }}
            >
              Download Free →
            </a>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1.5rem", textAlign: "center" }}>
          <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.3)", fontSize: "0.78rem" }}>
            © 2024 The Discipleship Journey. All rights reserved. | <em>"Go ye therefore, and teach all nations." — Matthew 28:19</em>
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Page Export ─────────────────────────────────────────────────────────
// ─── Mobile Sticky CTA ───────────────────────────────────────────────────────
function MobileStickyCTA() {
  const [visible, setVisible] = useState(false);
  const [nearForm, setNearForm] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Show after scrolling past the hero (~80px)
      setVisible(scrollY > 80);

      // Hide when the lead magnet opt-in form (#free-guide) is in viewport
      const formEl = document.getElementById("free-guide");
      if (formEl) {
        const rect = formEl.getBoundingClientRect();
        setNearForm(rect.top < window.innerHeight && rect.bottom > 0);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const show = visible && !nearForm;

  return (
    <div
      className="md:hidden fixed bottom-6 left-1/2 z-40"
      style={{
        transform: `translateX(-50%) translateY(${show ? "0" : "100px"})`,
        opacity: show ? 1 : 0,
        transition: "transform 0.35s cubic-bezier(0.23,1,0.32,1), opacity 0.3s ease",
        pointerEvents: show ? "auto" : "none",
      }}
    >
      <a
        href="#free-guide"
        className="flex items-center gap-2 btn-gold px-6 py-3 rounded-full font-bold text-sm whitespace-nowrap"
        style={{
          color: "#0d1f3c",
          fontFamily: "'Inter', sans-serif",
          textDecoration: "none",
          boxShadow: "0 8px 32px rgba(245,158,11,0.45), 0 2px 8px rgba(0,0,0,0.25)",
        }}
      >
        {/* Book icon */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d1f3c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
        Download Free Guide ✦
      </a>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <Nav />
      <Hero />
      <LeadMagnet />
      <ScriptureBanner />
      <BooksSection />
      <ReviewsAndFeedback />
      <LaunchTimeline />
      <ForPastors />
      <SocialCalendar />
      <AboutSection />
      <Footer />
      <MobileStickyCTA />
    </div>
  );
}
