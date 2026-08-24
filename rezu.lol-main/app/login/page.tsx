"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SITE_NAME } from "@/lib/constants";
import DiscordButton from "@/components/DiscordButton";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setError(params.get("error") || "");

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/dashboard");
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace("/dashboard");
    });

    return () => listener.subscription.unsubscribe();
  }, [router, supabase]);

  const submit = async () => {
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return setError(error.message);
    }
    router.replace("/dashboard");
    router.refresh();
  };

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#050507", fontFamily: "inherit" }}>
      <div style={{ width: "min(380px,100%)", background: "#09090b", border: "1px solid #18181b", borderRadius: 8, padding: "36px 30px" }}>
        
        {/* Logo and Header */}
        <div style={{ fontSize: "14px", fontWeight: "600", color: "#f4f4f5", letterSpacing: "-0.01em", textAlign: "center", marginBottom: "28px" }}>
          rezu<span style={{ color: "#e11d2e" }}>.lol</span>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#f4f4f5", textAlign: "center", margin: "0 0 20px", letterSpacing: "-0.02em" }}>
          Welcome back
        </h1>

        <DiscordButton />

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0", color: "#3f3f46", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          <div style={{ flex: 1, height: 1, background: "#18181b" }} /> 
          or email 
          <div style={{ flex: 1, height: 1, background: "#18181b" }} />
        </div>

        {/* Inputs */}
        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "#71717a", fontWeight: "500", marginBottom: "6px" }}>Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            style={{
              width: "100%",
              background: "#040405",
              border: "1px solid #27272a",
              borderRadius: "6px",
              padding: "10px 12px",
              color: "#f4f4f5",
              fontSize: "14px",
              outline: "none",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "#71717a", fontWeight: "500", marginBottom: "6px" }}>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()} 
            style={{
              width: "100%",
              background: "#040405",
              border: "1px solid #27272a",
              borderRadius: "6px",
              padding: "10px 12px",
              color: "#f4f4f5",
              fontSize: "14px",
              outline: "none",
              boxSizing: "border-box"
            }}
          />
        </div>

        {error && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 12, marginBottom: 12, textAlign: "center" }}>{error}</p>}

        <button 
          onClick={submit} 
          disabled={loading}
          style={{ 
            background: "#ffffff", 
            color: "#09090b", 
            width: "100%", 
            border: "none", 
            borderRadius: "6px", 
            padding: "10px 16px",
            fontSize: "13px",
            fontWeight: "500",
            cursor: "pointer",
            transition: "background-color 0.15s ease"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e4e4e7")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
        >
          {loading ? "Logging in…" : "Log in"}
        </button>

        <p style={{ marginTop: 24, fontSize: 13, color: "#52525b", textAlign: "center" }}>
          No account? <Link href="/signup" style={{ fontWeight: "500", color: "#a1a1aa", textDecoration: "none" }}>Claim your name</Link>
        </p>
      </div>
    </main>
  );
}
