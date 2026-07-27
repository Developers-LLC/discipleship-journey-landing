import React, { useState } from "react";
import { startGoogleLogin } from "@/const";

interface GoogleSignInButtonProps {
  className?: string;
  style?: React.CSSProperties;
  label?: string;
  variant?: "light" | "dark" | "gold";
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  className = "",
  style = {},
  label = "Sign in with Google",
  variant = "light",
}) => {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    startGoogleLogin();
  };

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case "dark":
        return {
          background: "#1a2e4c",
          color: "#ffffff",
          border: "1px solid rgba(255,255,255,0.15)",
        };
      case "gold":
        return {
          background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          color: "#0d1f3c",
          border: "none",
        };
      case "light":
      default:
        return {
          background: "#ffffff",
          color: "#3c4043",
          border: "1px solid #dadce0",
          boxShadow: "0 1px 3px rgba(60,64,67,0.12)",
        };
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-3 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 hover:shadow-md active:scale-95 disabled:opacity-75 ${className}`}
      style={{
        ...getVariantStyles(),
        cursor: loading ? "wait" : "pointer",
        ...style,
      }}
    >
      {loading ? (
        <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          <path fill="none" d="M0 0h48v48H0z"/>
        </svg>
      )}
      <span>{loading ? "Connecting to Google…" : label}</span>
    </button>
  );
};
