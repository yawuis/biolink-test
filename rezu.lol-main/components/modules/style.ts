import type { CSSProperties } from "react";

export function card(accent: string): CSSProperties {
  return {
    width: "100%",
    maxWidth: 520,
    margin: "0 auto",
    boxSizing: "border-box",
    padding: "16px 18px",
    borderRadius: 14,
    background: "rgba(15,15,22,0.55)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: `1px solid ${accent}44`,
    boxShadow: `0 18px 50px -24px ${accent}55`,
  };
}
