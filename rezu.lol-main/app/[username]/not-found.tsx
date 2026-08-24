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
        background: "#050507",
      }}
    >
      <div style={{ fontSize: "14px", fontWeight: "600", color: "#f4f4f5", letterSpacing: "-0.01em", marginBottom: "32px" }}>
        sob<span style={{ color: "#55acee" }}>.lol</span>
      </div>

      <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(34px, 6vw, 48px)", fontWeight: 600, color: "#f4f4f5", margin: 0, letterSpacing: "-0.02em" }}>
        Unclaimed
      </h1>
      <p style={{ color: "#71717a", fontSize: 15, margin: "12px 0 32px" }}>
        Nobody owns this name yet.
      </p>
      
      <Link 
        href="/signup" 
        style={{ 
          background: "#ffffff", 
          color: "#09090b", 
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: "500",
          padding: "10px 20px",
          borderRadius: "6px",
          transition: "background-color 0.15s ease"
        }}
      >
        Claim it
      </Link>
    </main>
  );
}
