import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { toast } from "sonner";

const COVER_MAP: Record<string, string> = {
  belong: "/manus-storage/BELONG_KDP_Cover_8e45f300.jpg",
  grow:   "/manus-storage/GROW_KDP_Cover_ea301040.jpg",
  go:     "/manus-storage/GO_KDP_Cover_3681b44e.jpg",
  bundle: "/manus-storage/hero_banner_kdp_v2_1159854e.jpg",
};

export default function GiftRedemption() {
  const [, params] = useRoute("/gift/:token");
  const token = params?.token ?? "";
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [redeemed, setRedeemed] = useState(false);

  const giftQuery = trpc.stripe.getGift.useQuery({ token }, { enabled: !!token });
  const redeemMutation = trpc.stripe.redeemGift.useMutation();

  const gift = giftQuery.data;

  const handleRedeem = async () => {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    try {
      await redeemMutation.mutateAsync({ token });
      setRedeemed(true);
      toast.success("Gift redeemed! Your book is now in My Books.");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to redeem gift. Please try again.");
    }
  };

  if (giftQuery.isLoading || authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0d1f3c", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Inter', sans-serif" }}>Loading gift…</div>
      </div>
    );
  }

  if (!gift) {
    return (
      <div style={{ minHeight: "100vh", background: "#0d1f3c", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontSize: "1.8rem", marginBottom: "0.75rem" }}>Gift Not Found</h1>
          <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.6)", marginBottom: "1.5rem" }}>
            This gift link is invalid or has expired. Please check the link and try again.
          </p>
          <a href="/" style={{ background: "#f59e0b", color: "#0d1f3c", borderRadius: "9999px", padding: "0.75rem 2rem", fontFamily: "'Inter', sans-serif", fontWeight: 700, textDecoration: "none" }}>
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  const cover = COVER_MAP[gift.productKey] ?? COVER_MAP.bundle;
  const alreadyRedeemed = gift.status === "redeemed";

  return (
    <div style={{ minHeight: "100vh", background: "#0d1f3c", display: "flex", flexDirection: "column" }}>
      {/* Minimal nav */}
      <nav style={{ padding: "1.25rem 2rem", display: "flex", alignItems: "center", gap: "0.75rem", borderBottom: "1px solid rgba(245,158,11,0.15)" }}>
        <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="8" fill="#f59e0b" fillOpacity="0.12"/>
          <path d="M8 28V14c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v14" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M20 28V14c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v14" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 28h24" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M20 4v8M17 7h6" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        <span style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontWeight: 700 }}>The Discipleship Journey</span>
      </nav>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem 1.5rem" }}>
        <div style={{ maxWidth: 560, width: "100%", textAlign: "center" }}>

          {redeemed ? (
            /* ── Success state ── */
            <div>
              <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🎉</div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", color: "#f59e0b", fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 900, marginBottom: "0.75rem" }}>
                Gift Redeemed!
              </h1>
              <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.8)", fontSize: "1rem", marginBottom: "2rem", lineHeight: 1.7 }}>
                <strong style={{ color: "#fff" }}>{gift.productTitle}</strong> is now in your library. Start reading your discipleship journey today.
              </p>
              <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                <a
                  href="/profile"
                  style={{ background: "#f59e0b", color: "#0d1f3c", borderRadius: "9999px", padding: "0.8rem 2rem", fontFamily: "'Inter', sans-serif", fontWeight: 700, textDecoration: "none", fontSize: "0.95rem" }}
                >
                  Go to My Books →
                </a>
                <a
                  href="/"
                  style={{ background: "transparent", color: "rgba(255,255,255,0.7)", borderRadius: "9999px", padding: "0.8rem 2rem", fontFamily: "'Inter', sans-serif", fontWeight: 600, textDecoration: "none", fontSize: "0.95rem", border: "1px solid rgba(255,255,255,0.2)" }}
                >
                  Browse More Books
                </a>
              </div>
            </div>
          ) : (
            /* ── Gift claim state ── */
            <div>
              {/* Gift badge */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "9999px", padding: "0.35rem 1rem", fontFamily: "'Inter', sans-serif", fontSize: "0.78rem", fontWeight: 700, color: "#f59e0b", letterSpacing: "0.06em", marginBottom: "1.5rem" }}>
                🎁 YOU HAVE A GIFT
              </div>

              {/* Book cover */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.75rem" }}>
                <div style={{ position: "relative", width: 160 }}>
                  <div style={{ position: "absolute", inset: 0, borderRadius: "0.75rem", background: "radial-gradient(circle at center, rgba(245,158,11,0.3) 0%, transparent 70%)", transform: "scale(1.3)" }} />
                  <img
                    src={cover}
                    alt={gift.productTitle}
                    style={{ position: "relative", width: "100%", borderRadius: "0.75rem", boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(245,158,11,0.15)", display: "block" }}
                  />
                </div>
              </div>

              {/* Title */}
              <h1 style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontSize: "clamp(1.6rem, 4vw, 2.2rem)", fontWeight: 900, marginBottom: "0.25rem" }}>
                {gift.productTitle}
              </h1>
              <p style={{ fontFamily: "'Inter', sans-serif", color: "#f59e0b", fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "1.25rem" }}>
                {gift.productSubtitle}
              </p>

              {/* Sender message */}
              {gift.message && (
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "1rem", padding: "1.25rem 1.5rem", marginBottom: "1.5rem", textAlign: "left" }}>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", color: "rgba(255,255,255,0.85)", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: "0.5rem" }}>
                    "{gift.message}"
                  </p>
                  {gift.recipientName && (
                    <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.45)", fontSize: "0.78rem" }}>
                      — For {gift.recipientName}
                    </p>
                  )}
                </div>
              )}

              {alreadyRedeemed ? (
                <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "1rem", padding: "1.25rem", marginBottom: "1.5rem" }}>
                  <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>
                    This gift has already been redeemed.
                  </p>
                  {isAuthenticated && (
                    <a href="/profile" style={{ color: "#f59e0b", fontFamily: "'Inter', sans-serif", fontSize: "0.88rem", textDecoration: "underline" }}>
                      Check My Books →
                    </a>
                  )}
                </div>
              ) : (
                <div>
                  {!isAuthenticated && (
                    <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.55)", fontSize: "0.88rem", marginBottom: "1.25rem" }}>
                      Sign in to claim your free book — it will be added to your library instantly.
                    </p>
                  )}
                  <button
                    onClick={handleRedeem}
                    disabled={redeemMutation.isPending}
                    style={{
                      background: redeemMutation.isPending ? "rgba(245,158,11,0.6)" : "#f59e0b",
                      color: "#0d1f3c",
                      border: "none",
                      borderRadius: "9999px",
                      padding: "1rem 2.5rem",
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 700,
                      fontSize: "1rem",
                      cursor: redeemMutation.isPending ? "not-allowed" : "pointer",
                      transition: "background 0.18s ease, transform 0.1s ease",
                      boxShadow: "0 4px 20px rgba(245,158,11,0.35)",
                    }}
                    onMouseEnter={e => { if (!redeemMutation.isPending) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.02)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
                    onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.97)"; }}
                    onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.02)"; }}
                  >
                    {redeemMutation.isPending
                      ? "Claiming…"
                      : isAuthenticated
                        ? "Claim Your Gift ✦"
                        : "Sign In to Claim ✦"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
