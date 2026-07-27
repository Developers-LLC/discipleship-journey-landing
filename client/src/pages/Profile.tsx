/**
 * USER PROFILE PAGE
 * Design: Royal Blue (#0d1f3c) + Golden Orange (#f59e0b) — matches the landing page theme
 * Shows user info and allows editing display name
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Link } from "wouter";

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

function AvatarCircle({ name, size = 72 }: { name?: string | null; size?: number }) {
  const initials = (name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #0d1f3c 0%, #1a3a6b 100%)",
        border: "3px solid #f59e0b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Playfair Display', serif",
        fontWeight: 700,
        fontSize: size * 0.3,
        color: "#f59e0b",
        flexShrink: 0,
        boxShadow: "0 4px 20px rgba(245,158,11,0.25)",
      }}
    >
      {initials}
    </div>
  );
}

export default function Profile() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const profileQuery = trpc.profile.get.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });
  const utils = trpc.useUtils();
  const updateNameMutation = trpc.profile.updateName.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      utils.profile.get.invalidate();
      setEditMode(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const [editMode, setEditMode] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (profileQuery.data?.name) {
      setNameInput(profileQuery.data.name);
    }
  }, [profileQuery.data?.name]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0d1f3c",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid rgba(245,158,11,0.3)",
            borderTopColor: "#f59e0b",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0d1f3c",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          padding: "2rem",
        }}
      >
        <svg width="56" height="56" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="8" fill="#f59e0b" fillOpacity="0.12" />
          <path d="M8 28V14c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v14" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 28V14c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v14" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 28h24" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M20 4v8M17 7h6" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            color: "#fff",
            fontSize: "1.8rem",
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          Sign In to View Your Profile
        </h2>
        <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.65)", textAlign: "center" }}>
          You need to be signed in to access your profile.
        </p>
        <button
          onClick={() => startLogin()}
          style={{
            background: "#f59e0b",
            color: "#0d1f3c",
            border: "none",
            borderRadius: "9999px",
            padding: "0.85rem 2rem",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: "0.95rem",
            cursor: "pointer",
          }}
        >
          Sign In ✦
        </button>
        <Link
          href="/"
          style={{
            fontFamily: "'Inter', sans-serif",
            color: "rgba(255,255,255,0.5)",
            fontSize: "0.85rem",
            textDecoration: "none",
          }}
        >
          ← Back to Home
        </Link>
      </div>
    );
  }

  const profile = profileQuery.data;
  const displayName = profile?.name ?? user?.name ?? "Pilgrim";
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : "—";
  const lastSeen = profile?.lastSignedIn
    ? new Date(profile.lastSignedIn).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : "—";

  return (
    <div style={{ minHeight: "100vh", background: "#0d1f3c" }}>
      {/* ── Top bar ── */}
      <nav
        style={{
          background: "rgba(13,31,60,0.97)",
          borderBottom: "1px solid rgba(245,158,11,0.2)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          className="container"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 0" }}
        >
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}>
            <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="8" fill="#f59e0b" fillOpacity="0.12" />
              <path d="M8 28V14c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v14" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20 28V14c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v14" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 28h24" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M20 4v8M17 7h6" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontWeight: 700, fontSize: "1rem" }}>
              The Discipleship Journey
            </span>
          </Link>
          <button
            onClick={() => logout()}
            style={{
              background: "rgba(245,158,11,0.12)",
              border: "1px solid rgba(245,158,11,0.3)",
              color: "#f59e0b",
              borderRadius: "9999px",
              padding: "0.5rem 1.25rem",
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* ── Profile content ── */}
      <div className="container" style={{ paddingTop: "4rem", paddingBottom: "6rem", maxWidth: 720 }}>
        {/* Header card */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: "1.5rem",
            padding: "2.5rem",
            display: "flex",
            alignItems: "center",
            gap: "2rem",
            marginBottom: "2rem",
            flexWrap: "wrap",
          }}
        >
          <AvatarCircle name={displayName} size={80} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.7rem", color: "#f59e0b", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.25rem" }}>
              Your Profile
            </p>
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                color: "#fff",
                fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                fontWeight: 700,
                marginBottom: "0.5rem",
              }}
            >
              {displayName}
            </h1>
            {profile?.email && (
              <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.55)", fontSize: "0.9rem" }}>
                {profile.email}
              </p>
            )}
            {profile?.role === "admin" && (
              <span
                style={{
                  display: "inline-block",
                  marginTop: "0.5rem",
                  background: "rgba(245,158,11,0.15)",
                  border: "1px solid rgba(245,158,11,0.4)",
                  color: "#f59e0b",
                  borderRadius: "9999px",
                  padding: "0.2rem 0.75rem",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Admin
              </span>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          {[
            { label: "Member Since", value: memberSince },
            { label: "Last Sign In", value: lastSeen },
            { label: "Role", value: profile?.role === "admin" ? "Administrator" : "Member" },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "1rem",
                padding: "1.25rem 1.5rem",
              }}
            >
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.7rem", color: "#f59e0b", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                {label}
              </p>
              <p style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontSize: "0.95rem", fontWeight: 600 }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Edit name card */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(245,158,11,0.15)",
            borderRadius: "1.5rem",
            padding: "2rem 2.5rem",
            marginBottom: "2rem",
          }}
        >
          <GoldRule label="Edit Profile" />
          <h3
            style={{
              fontFamily: "'Playfair Display', serif",
              color: "#fff",
              fontSize: "1.2rem",
              fontWeight: 700,
              margin: "1rem 0 1.5rem",
            }}
          >
            Display Name
          </h3>

          {saveSuccess && (
            <div
              style={{
                background: "rgba(245,158,11,0.12)",
                border: "1px solid rgba(245,158,11,0.35)",
                borderRadius: "0.75rem",
                padding: "0.75rem 1rem",
                marginBottom: "1rem",
                fontFamily: "'Inter', sans-serif",
                color: "#f59e0b",
                fontSize: "0.88rem",
              }}
            >
              ✦ Your display name has been updated.
            </div>
          )}

          {editMode ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (nameInput.trim()) {
                  updateNameMutation.mutate({ name: nameInput.trim() });
                }
              }}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={100}
                placeholder="Your display name"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "0.75rem",
                  padding: "0.85rem 1rem",
                  color: "#fff",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.95rem",
                  outline: "none",
                  width: "100%",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#f59e0b")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.2)")}
              />
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="submit"
                  disabled={updateNameMutation.isPending || !nameInput.trim()}
                  style={{
                    background: "#f59e0b",
                    color: "#0d1f3c",
                    border: "none",
                    borderRadius: "9999px",
                    padding: "0.65rem 1.5rem",
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    cursor: updateNameMutation.isPending ? "not-allowed" : "pointer",
                    opacity: updateNameMutation.isPending ? 0.7 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  {updateNameMutation.isPending ? "Saving…" : "Save Name"}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditMode(false); setNameInput(profile?.name ?? ""); }}
                  style={{
                    background: "transparent",
                    color: "rgba(255,255,255,0.55)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "9999px",
                    padding: "0.65rem 1.25rem",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.88rem",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
              {updateNameMutation.isError && (
                <p style={{ fontFamily: "'Inter', sans-serif", color: "#f87171", fontSize: "0.82rem" }}>
                  Failed to update name. Please try again.
                </p>
              )}
            </form>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontSize: "1.1rem", fontWeight: 600 }}>
                {displayName}
              </span>
              <button
                onClick={() => setEditMode(true)}
                style={{
                  background: "rgba(245,158,11,0.12)",
                  border: "1px solid rgba(245,158,11,0.3)",
                  color: "#f59e0b",
                  borderRadius: "9999px",
                  padding: "0.4rem 1rem",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Sign out card */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "1.5rem",
            padding: "1.5rem 2.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <p style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontWeight: 600, marginBottom: "0.25rem" }}>
              Sign Out
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.45)", fontSize: "0.82rem" }}>
              End your current session on this device.
            </p>
          </div>
          <button
            onClick={() => logout()}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "rgba(255,255,255,0.65)",
              borderRadius: "9999px",
              padding: "0.6rem 1.5rem",
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#f87171";
              (e.currentTarget as HTMLButtonElement).style.color = "#f87171";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.2)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.65)";
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
