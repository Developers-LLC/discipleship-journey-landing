/**
 * USER PROFILE PAGE
 * Design: Royal Blue (#0d1f3c) + Golden Orange (#f59e0b) — matches the landing page theme
 * Shows user info and allows editing display name
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin, startGoogleLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";

// ─── 2FA Section ─────────────────────────────────────────────────────────────
function TwoFactorSection() {
  const utils = trpc.useUtils();
  const statusQuery = trpc.twoFactor.status.useQuery();
  const setupTotpMutation = trpc.twoFactor.setupTotp.useMutation();
  const confirmTotpMutation = trpc.twoFactor.confirmTotp.useMutation({
    onSuccess: () => {
      utils.twoFactor.status.invalidate();
      setStep("backup");
    },
  });
  const sendSmsMutation = trpc.twoFactor.sendSmsCode.useMutation({
    onSuccess: () => setStep("sms-confirm"),
  });
  const confirmSmsMutation = trpc.twoFactor.confirmSms.useMutation({
    onSuccess: () => {
      utils.twoFactor.status.invalidate();
      setStep("backup");
    },
  });
  const disableMutation = trpc.twoFactor.disable.useMutation({
    onSuccess: () => {
      utils.twoFactor.status.invalidate();
      setStep("idle");
    },
  });

  type Step = "idle" | "choose" | "totp-setup" | "totp-confirm" | "sms-setup" | "sms-confirm" | "backup" | "disable-confirm";
  const [step, setStep] = useState<Step>("idle");
  const [totpData, setTotpData] = useState<{ secret: string; qrDataUrl: string } | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "totp-confirm" || step === "sms-confirm") {
      setCodeInput("");
      setError(null);
      setTimeout(() => codeRef.current?.focus(), 100);
    }
  }, [step]);

  const cardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(245,158,11,0.15)",
    borderRadius: "1.5rem",
    padding: "2rem 2.5rem",
    marginBottom: "2rem",
  };

  const btnGold: React.CSSProperties = {
    background: "#f59e0b",
    color: "#0d1f3c",
    border: "none",
    borderRadius: "9999px",
    padding: "0.65rem 1.5rem",
    fontFamily: "'Inter', sans-serif",
    fontWeight: 700,
    fontSize: "0.9rem",
    cursor: "pointer",
  };

  const btnGhost: React.CSSProperties = {
    background: "transparent",
    color: "rgba(255,255,255,0.6)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "9999px",
    padding: "0.65rem 1.5rem",
    fontFamily: "'Inter', sans-serif",
    fontWeight: 600,
    fontSize: "0.9rem",
    cursor: "pointer",
  };

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "0.75rem",
    padding: "0.75rem 1rem",
    color: "#fff",
    fontFamily: "'Inter', sans-serif",
    fontSize: "0.95rem",
    width: "100%",
    outline: "none",
  };

  const status = statusQuery.data;

  if (statusQuery.isLoading) {
    return (
      <div style={cardStyle}>
        <GoldRule label="Two-Factor Authentication" />
        <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.45)", marginTop: "1rem" }}>Loading…</p>
      </div>
    );
  }

  // ── Backup codes display ──
  if (step === "backup") {
    return (
      <div style={cardStyle}>
        <GoldRule label="Two-Factor Authentication" />
        <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#f59e0b", fontSize: "1.2rem", fontWeight: 700, margin: "1rem 0 0.5rem" }}>
          ✦ 2FA Enabled Successfully
        </h3>
        <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.7)", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
          Save these backup codes in a safe place. Each code can only be used once if you lose access to your authenticator.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {backupCodes.map((code) => (
            <code
              key={code}
              style={{
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.25)",
                borderRadius: "0.5rem",
                padding: "0.5rem 0.75rem",
                fontFamily: "monospace",
                color: "#f59e0b",
                fontSize: "0.95rem",
                letterSpacing: "0.1em",
              }}
            >
              {code}
            </code>
          ))}
        </div>
        <button style={btnGold} onClick={() => setStep("idle")}>
          I've Saved My Codes ✦
        </button>
      </div>
    );
  }

  // ── Already enabled ──
  if (status?.isEnabled) {
    return (
      <div style={cardStyle}>
        <GoldRule label="Two-Factor Authentication" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginTop: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
              <span style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontWeight: 600, fontSize: "1rem" }}>
                2FA is Active
              </span>
            </div>
            <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.5)", fontSize: "0.82rem" }}>
              Method: {status.method === "totp" ? "Authenticator App (TOTP)" : "SMS"}
              {status.phoneNumber ? ` · ${status.phoneNumber}` : ""}
            </p>
          </div>
          {step === "disable-confirm" ? (
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <p style={{ fontFamily: "'Inter', sans-serif", color: "#f87171", fontSize: "0.85rem", width: "100%" }}>
                Are you sure? This will remove 2FA protection from your account.
              </p>
              <button
                style={{ ...btnGhost, borderColor: "#f87171", color: "#f87171" }}
                disabled={disableMutation.isPending}
                onClick={() => disableMutation.mutate()}
              >
                {disableMutation.isPending ? "Disabling…" : "Yes, Disable 2FA"}
              </button>
              <button style={btnGhost} onClick={() => setStep("idle")}>Cancel</button>
            </div>
          ) : (
            <button
              style={{ ...btnGhost, borderColor: "#f87171", color: "#f87171" }}
              onClick={() => setStep("disable-confirm")}
            >
              Disable 2FA
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Choose method ──
  if (step === "choose") {
    return (
      <div style={cardStyle}>
        <GoldRule label="Two-Factor Authentication" />
        <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontSize: "1.15rem", fontWeight: 700, margin: "1rem 0 1.25rem" }}>
          Choose Your 2FA Method
        </h3>
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: "1.5rem" }}>
          {/* TOTP option */}
          <button
            onClick={async () => {
              setError(null);
              const data = await setupTotpMutation.mutateAsync();
              setTotpData(data);
              setStep("totp-setup");
            }}
            disabled={setupTotpMutation.isPending}
            style={{
              background: "rgba(245,158,11,0.06)",
              border: "1px solid rgba(245,158,11,0.25)",
              borderRadius: "1rem",
              padding: "1.5rem",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>📱</div>
            <p style={{ fontFamily: "'Playfair Display', serif", color: "#f59e0b", fontWeight: 700, marginBottom: "0.25rem" }}>
              Authenticator App
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.55)", fontSize: "0.82rem" }}>
              Google Authenticator, Authy, or any TOTP app
            </p>
          </button>
          {/* SMS option */}
          <button
            onClick={() => { setError(null); setStep("sms-setup"); }}
            style={{
              background: "rgba(245,158,11,0.06)",
              border: "1px solid rgba(245,158,11,0.25)",
              borderRadius: "1rem",
              padding: "1.5rem",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>💬</div>
            <p style={{ fontFamily: "'Playfair Display', serif", color: "#f59e0b", fontWeight: 700, marginBottom: "0.25rem" }}>
              SMS Text Message
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.55)", fontSize: "0.82rem" }}>
              Receive a code by text message (requires Twilio)
            </p>
          </button>
        </div>
        <button style={btnGhost} onClick={() => setStep("idle")}>Cancel</button>
      </div>
    );
  }

  // ── TOTP: QR code display ──
  if (step === "totp-setup" && totpData) {
    return (
      <div style={cardStyle}>
        <GoldRule label="Authenticator App Setup" />
        <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontSize: "1.15rem", fontWeight: 700, margin: "1rem 0 0.75rem" }}>
          Scan this QR Code
        </h3>
        <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.65)", fontSize: "0.88rem", marginBottom: "1.25rem" }}>
          Open Google Authenticator, Authy, or any TOTP app and scan the code below.
        </p>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
          <img src={totpData.qrDataUrl} alt="QR Code" style={{ width: 200, height: 200, borderRadius: "0.75rem", background: "#fff", padding: "0.5rem" }} />
        </div>
        <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.45)", fontSize: "0.78rem", textAlign: "center", marginBottom: "1.5rem" }}>
          Can't scan? Enter this key manually: <code style={{ color: "#f59e0b", letterSpacing: "0.1em" }}>{totpData.secret}</code>
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button style={btnGold} onClick={() => setStep("totp-confirm")}>
            I've Scanned It →
          </button>
          <button style={btnGhost} onClick={() => setStep("choose")}>Back</button>
        </div>
      </div>
    );
  }

  // ── TOTP: Confirm code ──
  if (step === "totp-confirm") {
    return (
      <div style={cardStyle}>
        <GoldRule label="Verify Your Authenticator" />
        <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontSize: "1.15rem", fontWeight: 700, margin: "1rem 0 0.75rem" }}>
          Enter the 6-Digit Code
        </h3>
        <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.65)", fontSize: "0.88rem", marginBottom: "1.25rem" }}>
          Enter the code shown in your authenticator app to confirm setup.
        </p>
        {error && <p style={{ color: "#f87171", fontFamily: "'Inter', sans-serif", fontSize: "0.85rem", marginBottom: "0.75rem" }}>{error}</p>}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            try {
              const result = await confirmTotpMutation.mutateAsync({ code: codeInput });
              setBackupCodes(result.backupCodes);
            } catch (err: any) {
              setError(err.message ?? "Invalid code.");
            }
          }}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <input
            ref={codeRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="000000"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
            style={{ ...inputStyle, fontSize: "1.5rem", letterSpacing: "0.3em", textAlign: "center", maxWidth: 200 }}
          />
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button type="submit" style={btnGold} disabled={confirmTotpMutation.isPending || codeInput.length !== 6}>
              {confirmTotpMutation.isPending ? "Verifying…" : "Confirm & Enable 2FA ✦"}
            </button>
            <button type="button" style={btnGhost} onClick={() => setStep("totp-setup")}>Back</button>
          </div>
        </form>
      </div>
    );
  }

  // ── SMS: Enter phone number ──
  if (step === "sms-setup") {
    return (
      <div style={cardStyle}>
        <GoldRule label="SMS Setup" />
        <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontSize: "1.15rem", fontWeight: 700, margin: "1rem 0 0.75rem" }}>
          Enter Your Phone Number
        </h3>
        <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.65)", fontSize: "0.88rem", marginBottom: "1.25rem" }}>
          Include your country code (e.g. +1 for US). We'll send a verification code.
        </p>
        {error && <p style={{ color: "#f87171", fontFamily: "'Inter', sans-serif", fontSize: "0.85rem", marginBottom: "0.75rem" }}>{error}</p>}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            try {
              await sendSmsMutation.mutateAsync({ phoneNumber: phoneInput });
            } catch (err: any) {
              setError(err.message ?? "Failed to send SMS.");
            }
          }}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <input
            type="tel"
            placeholder="+1 555 000 0000"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            style={{ ...inputStyle, maxWidth: 280 }}
          />
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button type="submit" style={btnGold} disabled={sendSmsMutation.isPending || phoneInput.length < 7}>
              {sendSmsMutation.isPending ? "Sending…" : "Send Verification Code →"}
            </button>
            <button type="button" style={btnGhost} onClick={() => setStep("choose")}>Back</button>
          </div>
        </form>
      </div>
    );
  }

  // ── SMS: Confirm code ──
  if (step === "sms-confirm") {
    return (
      <div style={cardStyle}>
        <GoldRule label="Verify SMS Code" />
        <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontSize: "1.15rem", fontWeight: 700, margin: "1rem 0 0.75rem" }}>
          Enter the Code We Sent
        </h3>
        <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.65)", fontSize: "0.88rem", marginBottom: "1.25rem" }}>
          Check your phone for a 6-digit verification code.
        </p>
        {error && <p style={{ color: "#f87171", fontFamily: "'Inter', sans-serif", fontSize: "0.85rem", marginBottom: "0.75rem" }}>{error}</p>}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            try {
              const result = await confirmSmsMutation.mutateAsync({ code: codeInput });
              setBackupCodes(result.backupCodes);
            } catch (err: any) {
              setError(err.message ?? "Invalid code.");
            }
          }}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <input
            ref={codeRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="000000"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
            style={{ ...inputStyle, fontSize: "1.5rem", letterSpacing: "0.3em", textAlign: "center", maxWidth: 200 }}
          />
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button type="submit" style={btnGold} disabled={confirmSmsMutation.isPending || codeInput.length !== 6}>
              {confirmSmsMutation.isPending ? "Verifying…" : "Confirm & Enable 2FA ✦"}
            </button>
            <button type="button" style={btnGhost} onClick={() => setStep("sms-setup")}>Back</button>
          </div>
        </form>
      </div>
    );
  }

  // ── Default: Not enabled ──
  return (
    <div style={cardStyle}>
      <GoldRule label="Two-Factor Authentication" />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginTop: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "inline-block" }} />
            <span style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontWeight: 600, fontSize: "1rem" }}>
              2FA is Not Enabled
            </span>
          </div>
          <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.45)", fontSize: "0.82rem" }}>
            Add an extra layer of security with an authenticator app or SMS.
          </p>
        </div>
        <button style={btnGold} onClick={() => setStep("choose")}>
          Enable 2FA →
        </button>
      </div>
    </div>
  );
}

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
        {/* Google sign-in option */}
        <button
          onClick={() => startGoogleLogin()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "#fff",
            border: "none",
            borderRadius: "9999px",
            padding: "0.75rem 1.75rem",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            fontSize: "0.92rem",
            color: "#3c4043",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
            transition: "box-shadow 0.18s ease",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.35)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.25)"; }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          Sign in with Google
        </button>
        <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(255,255,255,0.35)", fontSize: "0.75rem" }}>
          or use the button above for other sign-in options
        </p>
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
                  updateNameMutation.mutate({ name: nameInput });
                }
              }}
              style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
            >
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={100}
                autoFocus
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(245,158,11,0.4)",
                  borderRadius: "0.75rem",
                  padding: "0.75rem 1rem",
                  color: "#fff",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "1rem",
                  outline: "none",
                }}
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
                    padding: "0.6rem 1.5rem",
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    opacity: updateNameMutation.isPending ? 0.7 : 1,
                  }}
                >
                  {updateNameMutation.isPending ? "Saving…" : "Save Name"}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditMode(false); setNameInput(profileQuery.data?.name ?? ""); }}
                  style={{
                    background: "transparent",
                    color: "rgba(255,255,255,0.5)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "9999px",
                    padding: "0.6rem 1.5rem",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <p style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontSize: "1.1rem", fontWeight: 600 }}>
                {displayName}
              </p>
              <button
                onClick={() => setEditMode(true)}
                style={{
                  background: "rgba(245,158,11,0.12)",
                  border: "1px solid rgba(245,158,11,0.3)",
                  color: "#f59e0b",
                  borderRadius: "9999px",
                  padding: "0.4rem 1rem",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {/* 2FA card */}
        <TwoFactorSection />

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
