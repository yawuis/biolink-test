import type { CSSProperties } from "react";

export function card(_accent?: string): CSSProperties {
  return {
    width: "100%",
    maxWidth: "100%",
    margin: "0 auto",
    boxSizing: "border-box",
    padding: "16px 18px",
    borderRadius: 10,
    background: "#141416",
    border: "1px solid #27272a",
  };
}
