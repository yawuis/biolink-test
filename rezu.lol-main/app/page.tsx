import Link from "next/link";
import { Sparkles } from "lucide-react";
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
        padding: "24px",
        background: "radial-gradient(circle at 50% 0%, rgba(225,29,47,.18), #050507 60%)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 26 }}>
        <Sparkles size={22} style={{ color: "#e11d2f" }} />
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18 }}>
          rezu<span style={{ color: "#e11d2f" }}>.lol</span>
        </span>
      </div>

      <h1
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "clamp(34px, 7vw, 60px)",
          fontWeight: 700,
          lineHeight: 1.05,
          margin: "0 0 14px",
          letterSpacing: "-0.02em",
          maxWidth: 720,
        }}
      >
        One link.
        <br />
        <span style={{ color: "#e11d2f" }}>Everything you are.</span>
      </h1>

      <p style={{ color: "#9a9aaa", fontSize: 17, maxWidth: 440, margin: "0 0 34px" }}>
        {user ? (
          "You are already signed in. Jump straight back into your dashboard."
        ) : (
          <>
            Claim your name before someone else does. Each name can only belong to one person. Check out the{" "}
            <Link href="/marketplace" style={{ color: "#e11d2e", fontWeight: 600 }}>
              Marketplace
            </Link>{" "}
            for premium handles.
          </>
        )}
      </p>

      {user ? (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link href={username ? "/dashboard" : "/claim"} className="btn" style={{ background: "#e11d2f", color: "#fff", textDecoration: "none" }}>
            Open dashboard
          </Link>
          <Link href="/marketplace" className="btn" style={{ background: "#15151b", color: "#fff", border: "1px solid #24242c", textDecoration: "none" }}>
            Marketplace
          </Link>
          {username && (
            <Link href={`/${username}`} className="btn" style={{ background: "#15151b", color: "#fff", border: "1px solid #24242c", textDecoration: "none" }}>
              View my page
            </Link>
          )}
        </div>
      ) : (
        <>
          <form
            action="/signup"
            method="get"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#0d0d13",
              border: "1px solid #20202c",
              borderRadius: 14,
              padding: 8,
              width: "min(440px, 100%)",
            }}
          >
            <span style={{ color: "#6b6b7b", paddingLeft: 8, fontSize: 15 }}>rezu.lol/</span>
            <input
              name="username"
              placeholder="yourname"
              autoComplete="off"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#e8e8ef",
                fontSize: 15,
              }}
            />
            <button type="submit" className="btn" style={{ background: "#e11d2f", color: "#fff" }}>
              Claim
            </button>
          </form>

          <p style={{ marginTop: 22, fontSize: 14, color: "#6b6b7b" }}>
            Already have one?{" "}
            <Link href="/login" style={{ fontWeight: 600 }}>
              Log in
            </Link>
          </p>
        </>
      )}
    </main>
  );
}
