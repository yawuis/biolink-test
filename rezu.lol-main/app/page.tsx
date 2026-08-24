import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username = "";
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle();
    username = profile?.username || "";
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "40px 24px",
        background: "#09090b",
        color: "#a1a1aa",
        fontFamily: "inherit",
      }}
    >
      {/* Brand Logo */}
      <div style={{ fontSize: "14px", fontWeight: "600", color: "#f4f4f5", letterSpacing: "-0.01em", marginBottom: "40px" }}>
        sob<span style={{ color: "#55acee" }}>.lol</span>
      </div>

      {/* Hero Title */}
      <h1
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "clamp(38px, 6vw, 56px)",
          fontWeight: "600",
          lineHeight: 1.1,
          color: "#f4f4f5",
          margin: "0 0 16px",
          letterSpacing: "-0.03em",
          maxWidth: 640,
        }}
      >
        One link.
        <br />
        <span style={{ color: "#71717a" }}>Everything you are.</span>
      </h1>

      {/* Description */}
      <p style={{ color: "#71717a", fontSize: "15px", maxWidth: 440, lineHeight: 1.6, margin: "0 0 40px" }}>
        {user ? (
          "You are already signed in. Jump straight back into your dashboard."
        ) : (
          <>
            Claim your name before someone else does. Each name can only belong to one person. Check out the{" "}
            <Link href="/marketplace" style={{ color: "#55acee", fontWeight: "500", textDecoration: "none" }}>
              Marketplace
            </Link>{" "}
            for premium handles.
          </>
        )}
      </p>

      {user ? (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link 
            href={username ? "/dashboard" : "/claim"} 
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
            Open dashboard
          </Link>
          <Link 
            href="/marketplace" 
            style={{ 
              background: "transparent", 
              color: "#f4f4f5", 
              border: "1px solid #27272a", 
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "500",
              padding: "10px 20px",
              borderRadius: "6px",
              transition: "border-color 0.15s ease"
            }}
          >
            Marketplace
          </Link>
          {username && (
            <Link 
              href={`/${username}`} 
              style={{ 
                background: "transparent", 
                color: "#f4f4f5", 
                border: "1px solid #27272a", 
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "500",
                padding: "10px 20px",
                borderRadius: "6px",
                transition: "border-color 0.15s ease"
              }}
            >
              View my page
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          <form
            action="/signup"
            method="get"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#09090b",
              border: "1px solid #27272a",
              borderRadius: 6,
              padding: 6,
              width: "min(400px, 100%)",
            }}
          >
            <span style={{ color: "#52525b", paddingLeft: 10, fontSize: 14, fontFamily: "monospace" }}>sob.lol/</span>
            <input
              name="username"
              placeholder="yourname"
              autoComplete="off"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#f4f4f5",
                fontSize: 14,
                fontFamily: "monospace",
              }}
            />
            <button 
              type="submit" 
              style={{ 
                background: "#ffffff", 
                color: "#09090b",
                border: "none",
                borderRadius: 4,
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "background-color 0.15s ease"
              }}
            >
              Claim
            </button>
          </form>

          <p style={{ marginTop: 24, fontSize: 13, color: "#52525b" }}>
            Already have one?{" "}
            <Link href="/login" style={{ fontWeight: "500", color: "#a1a1aa", textDecoration: "none" }}>
              Log in
            </Link>
          </p>
        </div>
      )}
    </main>
  );
}
