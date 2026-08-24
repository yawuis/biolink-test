import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 24,
        background: "radial-gradient(circle at 50% 0%, rgba(225,29,47,.18), #050507 60%)",
      }}
    >
      <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 48, fontWeight: 700, margin: 0 }}>
        Unclaimed
      </h1>
      <p style={{ color: "#9a9aaa", fontSize: 16, margin: "12px 0 26px" }}>
        Nobody owns this name yet. Want it?
      </p>
      <Link href="/signup" className="btn" style={{ background: "#e11d2f", color: "#fff" }}>
        Claim it
      </Link>
    </main>
  );
}
