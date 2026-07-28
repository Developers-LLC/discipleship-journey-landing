import React, { useState } from "react";
import { LoginModal } from "./LoginModal";

interface RegularSignInButtonProps {
  className?: string;
  style?: React.CSSProperties;
  label?: string;
  variant?: "primary" | "secondary" | "gold" | "outline";
}

export const RegularSignInButton: React.FC<RegularSignInButtonProps> = ({
  className = "",
  style = {},
  label = "Sign In",
  variant = "gold",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case "primary":
        return {
          background: "#0d1f3c",
          color: "#ffffff",
          border: "none",
        };
      case "secondary":
        return {
          background: "rgba(255,255,255,0.15)",
          color: "#ffffff",
          border: "1px solid rgba(255,255,255,0.3)",
        };
      case "outline":
        return {
          background: "transparent",
          color: "#0d1f3c",
          border: "1.5px solid #0d1f3c",
        };
      case "gold":
      default:
        return {
          background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          color: "#0d1f3c",
          border: "none",
        };
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all duration-200 hover:shadow-md active:scale-95 ${className}`}
        style={{
          ...getVariantStyles(),
          cursor: "pointer",
          ...style,
        }}
      >
        <span>{label}</span>
      </button>

      <LoginModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
