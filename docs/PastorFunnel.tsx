/**
 * PASTOR FUNNEL PAGE — Free Review Set for Pastors & Church Leaders
 * Design: Same brand theme — Royal Blue + Golden Orange
 */
import { useState, useEffect } from "react";
import { Link } from "wouter";

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(13,31,60,0.97)" : "rgba(13,31,60,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(245,158,11,0.2)",
      }}
    >
      <div className="container flex items-center justify-between py-4">
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="6" fill="#f59e0b" fillOpacity="0.15"/>
            <path d="M18 6v24M10 14h16" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M10 22c0 0 2-2 8-2s8 2 8 2" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontWeight: 700, fontSize: "1rem" }}>
            The Discipleship Journey
          </span>
        </Link>
        <Link
          href="/"
          className="px-5 py-2 rounded-full text-sm font-medium transition-colors"
          style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'Inter', sans-serif", textDecoration: "none", border: "1px solid rgba(255,255,255,0.2)" }}
        >
          ← Back to Main Site
        </Link>
      </div>
    </nav>
  );
}

export default function PastorFunnel() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", church: "", role: "", size: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name && form.email && form.church) setSubmitted(true);
  };

  return (
    <div className="min-h-screen" style={{ background: "#0d1f3c" }}>
      <Nav />

      {/* Hero */}
      <section className="pt-32 pb-16" style={{ background: "linear-gradient(180deg, #060f1e 0%, #0d1f3c 100%)" }}>
        <div className="container max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}>
            <span style={{ color: "#f59e0b", fontFamily: "'Inter', sans-serif", fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.1em" }}>⛪ FOR PASTORS & CHURCH LEADERS</span>
          </div>
          <h1
            style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.2rem, 5vw, 3.8rem)", fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: "1.5rem" }}
          >
            Request Your Free<br />
            <span style={{ color: "#f59e0b" }}>Pastor Review Set</span>
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.75)", fontSize: "1.1rem", lineHeight: 1.7, maxWidth: 600, margin: "0 auto 2rem" }}>
            We believe in the local church. That's why we're offering senior pastors and discipleship directors a <strong style={{ color: "#fff" }}>completely free digital review set</strong> of all three books in <em>The Discipleship Journey</em> series.
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="pb-24">
        <div className="container max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">

            {/* Left: What's included */}
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: 700, color: "#fff", marginBottom: "1.5rem" }}>
                What You'll Receive — Free
              </h2>
              <div className="space-y-4 mb-8">
                {[
                  { icon: "📖", title: "BELONG — Book 1", desc: "Digital ebook: Identity, community, and your first steps of faith." },
                  { icon: "🌱", title: "GROW — Book 2", desc: "Digital ebook: Prayer, Scripture, and spiritual transformation." },
                  { icon: "🚀", title: "GO — Book 3", desc: "Digital ebook: Mission, witness, and making disciples." },
                  { icon: "📋", title: "Small Group Discussion Guides", desc: "PDF guides for CLASS 101/201/301/401 tracks — ready to print and use." },
                  { icon: "🎙️", title: "Curriculum Preview Call", desc: "Optional 15-minute call to explore church licensing and bulk orders." },
                ].map(({ icon, title, desc }) => (
                  <div
                    key={title}
                    className="flex gap-4 p-4 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>{icon}</span>
                    <div>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, color: "#fff", marginBottom: "0.2rem" }}>{title}</div>
                      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Licensing info */}
              <div
                className="rounded-2xl p-6"
                style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.05) 100%)", border: "1px solid rgba(245,158,11,0.25)" }}
              >
                <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#f59e0b", fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.75rem" }}>
                  Church Licensing Available
                </h3>
                <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.75)", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "0.75rem" }}>
                  After your review, you can license the complete series for your entire congregation at a flat rate of <strong style={{ color: "#f59e0b" }}>$99/year</strong> — unlimited member distribution, no per-seat fees.
                </p>
                <div className="flex flex-wrap gap-3">
                  {["Unlimited Members", "All 3 Books", "Discussion Guides", "Annual License"].map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", fontFamily: "'Inter', sans-serif" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Form */}
            <div
              className="rounded-2xl p-8"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", position: "sticky", top: "6rem" }}
            >
              {submitted ? (
                <div className="text-center py-8">
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✦</div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#f59e0b", fontSize: "1.6rem", marginBottom: "0.75rem" }}>
                    Thank You, Pastor!
                  </h3>
                  <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.75)", lineHeight: 1.7, marginBottom: "1.5rem" }}>
                    Your free review set is on its way. Check your inbox within 24 hours. We'll also reach out to schedule your optional curriculum preview call.
                  </p>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", color: "#f59e0b", fontSize: "1rem" }}>
                    "The harvest truly is plenteous, but the labourers are few." — Matthew 9:37
                  </p>
                </div>
              ) : (
                <>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                    Request Your Free Review Set
                  </h3>
                  <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.55)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                    Available to senior pastors and discipleship directors only.
                  </p>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {[
                      { key: "name", placeholder: "Your Full Name *", type: "text", required: true },
                      { key: "email", placeholder: "Your Email Address *", type: "email", required: true },
                      { key: "church", placeholder: "Church / Ministry Name *", type: "text", required: true },
                      { key: "role", placeholder: "Your Role (e.g. Senior Pastor)", type: "text", required: false },
                      { key: "size", placeholder: "Approximate Congregation Size", type: "text", required: false },
                    ].map(({ key, placeholder, type, required }) => (
                      <input
                        key={key}
                        type={type}
                        placeholder={placeholder}
                        value={form[key as keyof typeof form]}
                        onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                        required={required}
                        className="w-full px-5 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                        style={{
                          background: "rgba(255,255,255,0.07)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          color: "#fff",
                          fontFamily: "'Inter', sans-serif",
                        }}
                        onFocus={e => (e.target.style.borderColor = "#f59e0b")}
                        onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
                      />
                    ))}
                    <button
                      type="submit"
                      className="btn-gold w-full py-4 rounded-xl font-bold text-base"
                      style={{ color: "#0d1f3c", fontFamily: "'Inter', sans-serif" }}
                    >
                      Send Me the Free Review Set ✦
                    </button>
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem", textAlign: "center", fontFamily: "'Inter', sans-serif" }}>
                      For church leaders only. No spam. Your information is kept confidential.
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: "#060f1e", borderTop: "1px solid rgba(245,158,11,0.1)", padding: "2rem 0" }}>
        <div className="container text-center">
          <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.3)", fontSize: "0.78rem" }}>
            © 2024 The Discipleship Journey. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
