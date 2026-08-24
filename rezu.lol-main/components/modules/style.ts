import type { CSSProperties } from "react";

export function card(accent: string): CSSProperties {
  return {
    width: "100%",
    maxWidth: "100%",
    margin: "0 auto",
    boxSizing: "border-box",
    padding: "16px 18px",
    borderRadius: 8,
    background: "#141416",
    border: "1px solid #27272a",
  };
}
