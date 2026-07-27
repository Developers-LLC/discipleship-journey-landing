import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatCents(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

const BOOK_DOWNLOAD_URLS: Record<string, string> = {
  belong: "/manus-storage/BELONG_KDP_Cover_8e45f300.jpg", // placeholder — replace with real PDF S3 URL
  grow: "/manus-storage/GROW_KDP_Cover_ea301040.jpg",
  go: "/manus-storage/GO_KDP_Cover_3681b44e.jpg",
};

const PRODUCT_INFO: Record<string, { title: string; subtitle: string; cover: string }> = {
  belong: {
    title: "BELONG",
    subtitle: "Book 1 — You Are Welcomed",
    cover: "/manus-storage/BELONG_KDP_Cover_8e45f300.jpg",
  },
  grow: {
    title: "GROW",
    subtitle: "Book 2 — You Are Transformed",
    cover: "/manus-storage/GROW_KDP_Cover_ea301040.jpg",
  },
  go: {
    title: "GO",
    subtitle: "Book 3 — You Are Sent",
    cover: "/manus-storage/GO_KDP_Cover_3681b44e.jpg",
  },
  bundle: {
    title: "Complete Bundle",
    subtitle: "BELONG + GROW + GO",
    cover: "/manus-storage/hero_banner_kdp_v2_1159854e.jpg",
  },
};

// ─── Success Banner ───────────────────────────────────────────────────────────
function SuccessBanner({ sessionId }: { sessionId: string }) {
  return (
    <div
      className="rounded-2xl p-8 mb-10 text-center"
      style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.35)" }}
    >
      <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>✦</div>
      <h2
        style={{
          fontFamily: "'Playfair Display', serif",
          color: "#f59e0b",
          fontSize: "1.6rem",
          fontWeight: 700,
          marginBottom: "0.5rem",
        }}
      >
        Purchase Complete — Welcome to the Journey!
      </h2>
      <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.75)", fontSize: "0.95rem" }}>
        Your book is ready to download below. A receipt has been sent to your email.
      </p>
    </div>
  );
}

// ─── Purchase Card ────────────────────────────────────────────────────────────
function PurchaseCard({
  productKey,
  amountCents,
  currency,
  createdAt,
}: {
  productKey: string;
  amountCents: number;
  currency: string;
  createdAt: Date | string;
}) {
  const info = PRODUCT_INFO[productKey] ?? {
    title: productKey.toUpperCase(),
    subtitle: "",
    cover: "/manus-storage/hero_banner_kdp_v2_1159854e.jpg",
  };

  // For bundle, show all three books
  const downloadKeys = productKey === "bundle" ? ["belong", "grow", "go"] : [productKey];

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col sm:flex-row gap-0"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(245,158,11,0.15)" }}
    >
      {/* Cover */}
      <div
        className="flex-shrink-0 flex items-center justify-center p-6"
        style={{ background: "#0d1f3c", minWidth: 140 }}
      >
        <img
          src={info.cover}
          alt={info.title}
          style={{ width: 100, borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
        />
      </div>

      {/* Details */}
      <div className="flex flex-col justify-between p-6 flex-1 gap-4">
        <div>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.7rem",
              color: "#f59e0b",
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: "0.25rem",
            }}
          >
            {formatDate(createdAt)}
          </div>
          <h3
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "#fff",
              marginBottom: "0.25rem",
            }}
          >
            {info.title}
          </h3>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.55)" }}>
            {info.subtitle}
          </p>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "#f59e0b",
            }}
          >
            {formatCents(amountCents, currency)}
          </span>

          <div className="flex gap-2 flex-wrap">
            {downloadKeys.map(key => (
              <a
                key={key}
                href={BOOK_DOWNLOAD_URLS[key] ?? "#"}
                download
                className="px-5 py-2 rounded-full text-sm font-bold transition-all duration-200"
                style={{
                  background: "#f59e0b",
                  color: "#0d1f3c",
                  fontFamily: "'Inter', sans-serif",
                  textDecoration: "none",
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#d97706")}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "#f59e0b")}
              >
                ↓ Download {PRODUCT_INFO[key]?.title ?? key.toUpperCase()}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Orders() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [location] = useLocation();
  const sessionId = new URLSearchParams(window.location.search).get("session_id");

  const { data: purchases, isLoading } = trpc.stripe.myPurchases.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d1f3c" }}>
        <div style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Inter', sans-serif" }}>Loading…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d1f3c" }}>
        <div className="text-center max-w-md px-6">
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📚</div>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              color: "#fff",
              fontSize: "1.8rem",
              fontWeight: 700,
              marginBottom: "0.75rem",
            }}
          >
            Sign In to View Your Books
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.6)", marginBottom: "2rem" }}>
            Sign in to access your purchased books and download them anytime.
          </p>
          <button
            onClick={() => startLogin()}
            className="px-8 py-3 rounded-full font-bold text-sm"
            style={{ background: "#f59e0b", color: "#0d1f3c", fontFamily: "'Inter', sans-serif", border: "none", cursor: "pointer" }}
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#0d1f3c" }}>
      {/* Nav */}
      <nav
        className="sticky top-0 z-50"
        style={{
          background: "rgba(13,31,60,0.97)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(245,158,11,0.2)",
        }}
      >
        <div className="container flex items-center justify-between py-4">
          <Link href="/" style={{ textDecoration: "none" }}>
            <div className="flex items-center gap-3">
              <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="8" fill="#f59e0b" fillOpacity="0.12" />
                <path d="M8 28V14c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v14" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20 28V14c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v14" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 28h24" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M20 4v8M17 7h6" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <span style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontWeight: 700 }}>
                The Discipleship Journey
              </span>
            </div>
          </Link>
          <Link href="/profile" style={{ textDecoration: "none" }}>
            <span
              className="text-sm font-medium"
              style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'Inter', sans-serif" }}
            >
              ← My Profile
            </span>
          </Link>
        </div>
      </nav>

      <div className="container py-16 max-w-3xl mx-auto">
        {/* Success banner */}
        {sessionId && <SuccessBanner sessionId={sessionId} />}

        {/* Header */}
        <div className="mb-10">
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.75rem",
              color: "#f59e0b",
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: "0.5rem",
            }}
          >
            ✦ My Library
          </div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              fontWeight: 700,
              color: "#fff",
            }}
          >
            Your Purchased Books
          </h1>
        </div>

        {/* Purchase list */}
        {isLoading ? (
          <div style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Inter', sans-serif", textAlign: "center", padding: "3rem 0" }}>
            Loading your library…
          </div>
        ) : !purchases || purchases.length === 0 ? (
          <div
            className="rounded-2xl p-12 text-center"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📖</div>
            <h3
              style={{
                fontFamily: "'Playfair Display', serif",
                color: "#fff",
                fontSize: "1.4rem",
                fontWeight: 600,
                marginBottom: "0.75rem",
              }}
            >
              No purchases yet
            </h3>
            <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.5)", marginBottom: "2rem" }}>
              Start your discipleship journey today.
            </p>
            <Link href="/#books" style={{ textDecoration: "none" }}>
              <span
                className="inline-block px-8 py-3 rounded-full font-bold text-sm"
                style={{ background: "#f59e0b", color: "#0d1f3c", fontFamily: "'Inter', sans-serif" }}
              >
                Browse the Series →
              </span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {purchases
              .filter(p => p.status === "fulfilled")
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map(p => (
                <PurchaseCard
                  key={p.id}
                  productKey={p.productKey}
                  amountCents={p.amountCents}
                  currency={p.currency}
                  createdAt={p.createdAt}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
