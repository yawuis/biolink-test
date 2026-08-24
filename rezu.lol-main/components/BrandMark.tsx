import { SITE_NAME } from "@/lib/constants";

export default function BrandMark({ size = 14 }: { size?: number }) {
  const dot = SITE_NAME.lastIndexOf(".");
  const name = dot > 0 ? SITE_NAME.slice(0, dot) : SITE_NAME;
  const tld = dot > 0 ? SITE_NAME.slice(dot) : "";
  return (
    <span
      style={{
        fontSize: size,
        fontWeight: 600,
        color: "#f4f4f5",
        letterSpacing: "-0.02em",
        lineHeight: 1,
      }}
    >
      {name}
      <span style={{ color: "#55acee" }}>{tld}</span>
    </span>
  );
}
