/**
 * REVIEWS & FEEDBACK SECTION
 * Design: Parchment background (#f5f0e8) — light editorial section
 * Displays seed testimonial cards + live feedback submission form
 */
import React, { useState } from "react";

// ─── Star Rating Display ──────────────────────────────────────────────────────
function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} width={size} height={size} viewBox="0 0 16 16" fill="none">
          <path
            d="M8 1.5l1.8 3.6 4 .58-2.9 2.83.68 3.99L8 10.27l-3.58 1.88.68-3.99L2.2 5.68l4-.58L8 1.5z"
            fill={star <= rating ? "#f59e0b" : "rgba(245,158,11,0.2)"}
            stroke={star <= rating ? "#f59e0b" : "rgba(245,158,11,0.3)"}
            strokeWidth="0.5"
          />
        </svg>
      ))}
    </div>
  );
}

// ─── Gold Rule (local copy to avoid cross-file import) ───────────────────────
function GoldRule({ label }: { label?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        color: "#f59e0b",
        fontSize: "0.7rem",
        fontWeight: 600,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <span style={{ flex: 1, height: 1, background: "rgba(245,158,11,0.4)" }} />
      {label || "✦"}
      <span style={{ flex: 1, height: 1, background: "rgba(245,158,11,0.4)" }} />
    </div>
  );
}

// ─── Seed Reviews ─────────────────────────────────────────────────────────────
const SEED_REVIEWS = [
  {
    id: 1,
    name: "Sarah M.",
    role: "New Believer, 6 months",
    book: "BELONG",
    rating: 5,
    text: "I became a Christian six months ago and had so many questions I was afraid to ask anyone. BELONG answered every single one of them. The chapter on identity in Christ changed how I see myself every morning.",
    avatar: "SM",
  },
  {
    id: 2,
    name: "Pastor David K.",
    role: "Senior Pastor, Grace Community Church",
    book: "BELONG",
    rating: 5,
    text: "I've been in ministry for 22 years and this is the clearest, most accessible discipleship resource I've seen for new believers. We're recommending it to every person who comes through our doors.",
    avatar: "DK",
  },
  {
    id: 3,
    name: "Marcus T.",
    role: "Small Group Leader",
    book: "GROW",
    rating: 5,
    text: "GROW gave our small group a common language for talking about spiritual growth. The Scripture-first approach is exactly what we needed. We went through it together over 8 weeks and it transformed our conversations.",
    avatar: "MT",
  },
  {
    id: 4,
    name: "Jennifer L.",
    role: "Church Member, 2 years",
    book: "BELONG",
    rating: 4,
    text: "I wish I had this book when I first started my faith journey. The section on overcoming guilt was especially powerful for me. Clear, biblical, and written with so much grace.",
    avatar: "JL",
  },
  {
    id: 5,
    name: "Rev. Angela P.",
    role: "Discipleship Director",
    book: "GROW",
    rating: 5,
    text: "We've been looking for a curriculum that bridges the gap between Sunday service and daily discipleship. GROW does exactly that. The practical Bible reading framework alone is worth the price.",
    avatar: "AP",
  },
  {
    id: 6,
    name: "James R.",
    role: "New Believer, 3 months",
    book: "BELONG",
    rating: 5,
    text: "I was baptized three months ago and felt completely lost about what to do next. A friend gave me BELONG and I read it in two days. For the first time, I feel like I actually belong in the church family.",
    avatar: "JR",
  },
];

const BOOK_OPTIONS = ["BELONG — Book 1", "GROW — Book 2", "GO — Book 3", "The Complete Series"];
const FILTERS = ["All", "BELONG", "GROW", "GO"];

interface Review {
  id: number;
  name: string;
  role: string;
  book: string;
  rating: number;
  text: string;
  avatar: string;
}

export default function ReviewsAndFeedback() {
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [reviews, setReviews] = useState<Review[]>(SEED_REVIEWS);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    name: "",
    role: "",
    book: "",
    rating: 5,
    text: "",
    email: "",
  });

  const filtered =
    activeFilter === "All"
      ? reviews
      : reviews.filter((r) => r.book === activeFilter);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.text.trim() || !form.book) {
      setFormError("Please fill in your name, select a book, and write your feedback.");
      return;
    }
    if (form.text.trim().length < 20) {
      setFormError("Please write at least 20 characters in your feedback.");
      return;
    }
    setFormError("");
    const bookShort = form.book.split("—")[0].trim();
    const newReview: Review = {
      id: Date.now(),
      name: form.name.trim(),
      role: form.role.trim() || "Reader",
      book: bookShort,
      rating: form.rating,
      text: form.text.trim(),
      avatar: form.name
        .trim()
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    };
    setReviews((prev) => [newReview, ...prev]);
    setSubmitted(true);
    setActiveFilter(bookShort === "The Complete Series" ? "All" : bookShort);
  };

  const inputStyle: React.CSSProperties = {
    background: "#f8f6f1",
    border: "1px solid rgba(13,31,60,0.12)",
    color: "#0d1f3c",
    fontFamily: "'Inter', sans-serif",
  };

  return (
    <section
      id="reviews"
      style={{
        background: "linear-gradient(180deg, #f5f0e8 0%, #ede8dc 100%)",
        padding: "6rem 0",
      }}
    >
      <div className="container max-w-6xl mx-auto">

        {/* ── Section Header ── */}
        <div className="text-center mb-14">
          <GoldRule label="Reader Voices" />
          <h2
            className="mt-4 mb-4"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 700,
              color: "#0d1f3c",
            }}
          >
            What Readers Are Saying
          </h2>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              color: "#5a6a7e",
              maxWidth: 520,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            From new believers to seasoned pastors — here is what the journey has meant to readers across the church.
          </p>
        </div>

        {/* ── Filter Tabs ── */}
        <div className="flex justify-center gap-3 mb-10 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200"
              style={{
                fontFamily: "'Inter', sans-serif",
                background: activeFilter === f ? "#0d1f3c" : "rgba(13,31,60,0.07)",
                color: activeFilter === f ? "#fff" : "#0d1f3c",
                border: `1px solid ${activeFilter === f ? "#0d1f3c" : "rgba(13,31,60,0.15)"}`,
                transform: activeFilter === f ? "scale(1.03)" : "scale(1)",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* ── Review Cards Grid ── */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {filtered.map((review, i) => (
            <div
              key={review.id}
              className="rounded-2xl p-6 flex flex-col gap-4"
              style={{
                background: "#fff",
                boxShadow: "0 4px 24px rgba(13,31,60,0.08)",
                border: "1px solid rgba(13,31,60,0.06)",
                animationDelay: `${i * 60}ms`,
              }}
            >
              {/* Avatar + Name + Book badge */}
              <div className="flex items-start gap-3">
                <div
                  className="rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    width: 44,
                    height: 44,
                    background: "linear-gradient(135deg, #0d1f3c 0%, #1a3a6b 100%)",
                    color: "#f59e0b",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {review.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontWeight: 700,
                      color: "#0d1f3c",
                      fontSize: "0.95rem",
                    }}
                  >
                    {review.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.75rem",
                      color: "#7a8a9e",
                      marginTop: "0.1rem",
                    }}
                  >
                    {review.role}
                  </div>
                </div>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
                  style={{
                    background: "rgba(245,158,11,0.12)",
                    color: "#b45309",
                    fontFamily: "'Inter', sans-serif",
                    border: "1px solid rgba(245,158,11,0.25)",
                  }}
                >
                  {review.book}
                </span>
              </div>

              <StarRating rating={review.rating} />

              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.88rem",
                  color: "#3d4f63",
                  lineHeight: 1.75,
                  flex: 1,
                }}
              >
                "{review.text}"
              </p>

              <div
                style={{
                  color: "#f59e0b",
                  fontSize: "1.5rem",
                  lineHeight: 1,
                  opacity: 0.3,
                  marginTop: "auto",
                }}
              >
                ✦
              </div>
            </div>
          ))}
        </div>

        {/* ── Divider ── */}
        <div
          style={{
            borderTop: "1px solid rgba(13,31,60,0.1)",
            marginBottom: "4rem",
          }}
        />

        {/* ── Feedback Form + Invitation Copy ── */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">

          {/* Left: Invitation copy */}
          <div>
            <GoldRule label="Share Your Journey" />
            <h3
              className="mt-4 mb-4"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                fontWeight: 700,
                color: "#0d1f3c",
                lineHeight: 1.2,
              }}
            >
              Has This Series<br />
              <span style={{ color: "#b45309" }}>Impacted Your Faith?</span>
            </h3>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                color: "#5a6a7e",
                lineHeight: 1.8,
                marginBottom: "1.5rem",
                fontSize: "0.95rem",
              }}
            >
              Your story matters. Whether you're a new believer who found clarity, a small group leader who used the series with your congregation, or a pastor who wants to share your experience — we'd love to hear from you.
            </p>
            <p
              style={{
                fontFamily: "'Playfair Display', serif",
                fontStyle: "italic",
                color: "#0d1f3c",
                fontSize: "1rem",
                lineHeight: 1.7,
                borderLeft: "3px solid #f59e0b",
                paddingLeft: "1rem",
              }}
            >
              "Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven."
              <br />
              <span
                style={{
                  fontStyle: "normal",
                  fontSize: "0.8rem",
                  color: "#7a8a9e",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                — Matthew 5:16, KJV
              </span>
            </p>

            {/* Stats row */}
            <div className="flex gap-8 mt-8">
              {[
                { num: `${reviews.length}`, label: "Reader Reviews" },
                { num: "4.9", label: "Average Rating" },
                { num: "3", label: "Books in Series" },
              ].map(({ num, label }) => (
                <div key={label}>
                  <div
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: "2rem",
                      fontWeight: 900,
                      color: "#0d1f3c",
                    }}
                  >
                    {num}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.75rem",
                      color: "#7a8a9e",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Form */}
          <div
            className="rounded-2xl p-8"
            style={{
              background: "#fff",
              boxShadow: "0 8px 40px rgba(13,31,60,0.1)",
              border: "1px solid rgba(13,31,60,0.06)",
            }}
          >
            {submitted ? (
              <div className="text-center py-8">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "linear-gradient(135deg, #0d1f3c, #1a3a6b)" }}
                >
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path
                      d="M6 14l6 6 10-12"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h4
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    color: "#0d1f3c",
                    fontSize: "1.4rem",
                    fontWeight: 700,
                    marginBottom: "0.75rem",
                  }}
                >
                  Thank You for Sharing!
                </h4>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    color: "#5a6a7e",
                    lineHeight: 1.7,
                    marginBottom: "1.5rem",
                    fontSize: "0.9rem",
                  }}
                >
                  Your review has been added to the page. Your words will encourage others who are on the same journey.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setForm({ name: "", role: "", book: "", rating: 5, text: "", email: "" });
                  }}
                  className="px-6 py-2.5 rounded-full text-sm font-semibold transition-colors"
                  style={{
                    background: "rgba(13,31,60,0.07)",
                    color: "#0d1f3c",
                    fontFamily: "'Inter', sans-serif",
                    border: "1px solid rgba(13,31,60,0.15)",
                  }}
                >
                  Submit Another Review
                </button>
              </div>
            ) : (
              <>
                <h4
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    color: "#0d1f3c",
                    fontSize: "1.2rem",
                    fontWeight: 700,
                    marginBottom: "0.4rem",
                  }}
                >
                  Leave Your Review
                </h4>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    color: "#7a8a9e",
                    fontSize: "0.8rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  Your review appears on this page immediately.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name + Role */}
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Your Name *"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      required
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = "#f59e0b")}
                      onBlur={(e) => (e.target.style.borderColor = "rgba(13,31,60,0.12)")}
                    />
                    <input
                      type="text"
                      placeholder="Your Role (optional)"
                      value={form.role}
                      onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = "#f59e0b")}
                      onBlur={(e) => (e.target.style.borderColor = "rgba(13,31,60,0.12)")}
                    />
                  </div>

                  {/* Book selector */}
                  <select
                    value={form.book}
                    onChange={(e) => setForm((p) => ({ ...p, book: e.target.value }))}
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{
                      ...inputStyle,
                      color: form.book ? "#0d1f3c" : "#7a8a9e",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#f59e0b")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(13,31,60,0.12)")}
                  >
                    <option value="" disabled>
                      Which book are you reviewing? *
                    </option>
                    {BOOK_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>

                  {/* Star rating picker */}
                  <div className="flex items-center gap-3">
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.8rem",
                        color: "#5a6a7e",
                      }}
                    >
                      Your Rating:
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, rating: star }))}
                          className="transition-transform hover:scale-110 active:scale-95"
                        >
                          <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
                            <path
                              d="M8 1.5l1.8 3.6 4 .58-2.9 2.83.68 3.99L8 10.27l-3.58 1.88.68-3.99L2.2 5.68l4-.58L8 1.5z"
                              fill={star <= form.rating ? "#f59e0b" : "rgba(245,158,11,0.15)"}
                              stroke={star <= form.rating ? "#f59e0b" : "rgba(245,158,11,0.3)"}
                              strokeWidth="0.5"
                            />
                          </svg>
                        </button>
                      ))}
                    </div>
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.8rem",
                        color: "#f59e0b",
                        fontWeight: 600,
                      }}
                    >
                      {form.rating}/5
                    </span>
                  </div>

                  {/* Review text */}
                  <textarea
                    placeholder="Share what this book meant to you... *"
                    value={form.text}
                    onChange={(e) => setForm((p) => ({ ...p, text: e.target.value }))}
                    required
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none"
                    style={{ ...inputStyle, lineHeight: 1.7 }}
                    onFocus={(e) => (e.target.style.borderColor = "#f59e0b")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(13,31,60,0.12)")}
                  />

                  {/* Optional email */}
                  <input
                    type="email"
                    placeholder="Email (optional — we may feature your review)"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = "#f59e0b")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(13,31,60,0.12)")}
                  />

                  {/* Error */}
                  {formError && (
                    <p
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.8rem",
                        color: "#c0392b",
                      }}
                    >
                      {formError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                    style={{
                      background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      color: "#0d1f3c",
                      fontFamily: "'Inter', sans-serif",
                      boxShadow: "0 4px 16px rgba(245,158,11,0.3)",
                    }}
                  >
                    Submit My Review ✦
                  </button>
                  <p
                    style={{
                      color: "#9aabb8",
                      fontSize: "0.72rem",
                      textAlign: "center",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Reviews appear immediately. We reserve the right to remove inappropriate content.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
