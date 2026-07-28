import React, { useState, useEffect } from "react";
import { GoogleSignInButton } from "./GoogleSignInButton";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultMode?: "signin" | "register";
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultMode = "signin",
}) => {
  const [mode, setMode] = useState<"signin" | "register">(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMode(defaultMode);
    setError(null);
  }, [defaultMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = mode === "signin" ? "/api/auth/login" : "/api/auth/register";
    const payload = mode === "signin" ? { email, password } : { email, password, name };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Authentication failed");
        setLoading(false);
        return;
      }

      if (data.requires2FA) {
        window.location.href = `/2fa-challenge?token=${data.pendingToken}`;
        return;
      }

      if (data.success) {
        if (onSuccess) onSuccess();
        onClose();
        window.location.reload();
      }
    } catch (err) {
      console.error("[LoginModal] Request failed:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-amber-900/10 overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
          <div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#0d1f3c" }} className="text-2xl font-bold">
              {mode === "signin" ? "Welcome Back ✦" : "Create Your Account ✦"}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {mode === "signin"
                ? "Sign in to access your discipleship books and downloads."
                : "Join The Discipleship Journey to unlock your books."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-100 p-1 mx-6 mt-5 rounded-xl text-sm font-semibold">
          <button
            onClick={() => { setMode("signin"); setError(null); }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === "signin" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode("register"); setError(null); }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Register
          </button>
        </div>

        {/* Body form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              ⚠️ {error}
            </div>
          )}

          {mode === "register" && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Thomas Perdana"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "#0d1f3c" }}
          >
            {loading
              ? "Processing…"
              : mode === "signin"
              ? "Sign In ✦"
              : "Create Account ✦"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative px-6 mb-4">
          <div className="absolute inset-0 flex items-center px-6">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-slate-400 font-semibold">Or continue with</span>
          </div>
        </div>

        {/* Google option */}
        <div className="px-6 pb-6 text-center">
          <GoogleSignInButton className="w-full" />
        </div>
      </div>
    </div>
  );
};
