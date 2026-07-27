/**
 * 2FA CHALLENGE PAGE
 * Shown after OAuth login when the user has 2FA enabled.
 * Receives ?token=<pendingToken> in the URL, verifies the code, then redirects to /.
 */
import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";

export default function TwoFactorChallenge() {
  const [, navigate] = useLocation();
  const pendingToken = new URLSearchParams(window.location.search).get("token") ?? "";

  const verifyMutation = trpc.twoFactor.verifyChallenge.useMutation({
    onSuccess: () => {
      // Reload so the session cookie is picked up by useAuth
      window.location.replace("/");
    },
  });

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!pendingToken) navigate("/");
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await verifyMutation.mutateAsync({ pendingToken, code });
    } catch (err: any) {
      setError(err.message ?? "Invalid code. Please try again.");
      setCode("");
      inputRef.current?.focus();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d1f3c",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Logo */}
      <svg width="48" height="48" viewBox="0 0 40 40" fill="none" style={{ marginBottom: "1.5rem" }}>
        <rect width="40" height="40" rx="8" fill="#f59e0b" fillOpacity="0.12" />
        <path d="M8 28V14c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v14" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 28V14c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v14" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 28h24" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M20 4v8M17 7h6" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" />
      </svg>

      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: "1.5rem",
          padding: "2.5rem",
          width: "100%",
          maxWidth: 420,
        }}
      >
        {/* Shield icon */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(245,158,11,0.12)",
              border: "1px solid rgba(245,158,11,0.3)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "0.75rem",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              color: "#fff",
              fontSize: "1.5rem",
              fontWeight: 700,
              marginBottom: "0.4rem",
            }}
          >
            Two-Factor Verification
          </h1>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.88rem" }}>
            Enter the 6-digit code from your authenticator app or the SMS we sent you.
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(248,113,113,0.1)",
              border: "1px solid rgba(248,113,113,0.3)",
              borderRadius: "0.75rem",
              padding: "0.75rem 1rem",
              marginBottom: "1rem",
              color: "#f87171",
              fontSize: "0.85rem",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9A-Fa-f]{6,8}"
            maxLength={8}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9A-Fa-f]/g, "").slice(0, 8))}
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(245,158,11,0.3)",
              borderRadius: "0.75rem",
              padding: "1rem",
              color: "#fff",
              fontFamily: "monospace",
              fontSize: "1.75rem",
              letterSpacing: "0.35em",
              textAlign: "center",
              outline: "none",
              width: "100%",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#f59e0b")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(245,158,11,0.3)")}
          />

          <button
            type="submit"
            disabled={verifyMutation.isPending || code.length < 6}
            style={{
              background: code.length >= 6 ? "#f59e0b" : "rgba(245,158,11,0.3)",
              color: "#0d1f3c",
              border: "none",
              borderRadius: "9999px",
              padding: "0.9rem",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: code.length >= 6 ? "pointer" : "not-allowed",
              transition: "background 0.2s ease",
            }}
          >
            {verifyMutation.isPending ? "Verifying…" : "Verify & Sign In ✦"}
          </button>
        </form>

        <p
          style={{
            marginTop: "1.5rem",
            textAlign: "center",
            color: "rgba(255,255,255,0.35)",
            fontSize: "0.78rem",
          }}
        >
          Lost access? Enter one of your 8-character backup codes above.
        </p>

        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <a
            href="/"
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "0.82rem",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#f59e0b")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.4)")}
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
