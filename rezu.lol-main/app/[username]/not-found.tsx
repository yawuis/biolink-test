import Link from "next/link";
import BrandMark from "@/components/BrandMark";

export default function NotFound() {
  return (
    <main className="auth-shell">
      <div className="auth-body">
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <div style={{ marginBottom: 28, display: "flex", justifyContent: "center" }}>
            <BrandMark />
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(34px, 6vw, 48px)", fontWeight: 600, color: "#f4f4f5", margin: 0, letterSpacing: "-0.03em" }}>
            Unclaimed
          </h1>
          <p style={{ color: "#71717a", fontSize: 15, margin: "12px 0 28px", lineHeight: 1.5 }}>
            Nobody owns this name yet. It could be yours.
          </p>
          <Link href="/signup" className="btn-primary">
            Claim it
          </Link>
        </div>
      </div>
    </main>
  );
}
