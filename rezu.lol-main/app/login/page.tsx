"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_ACCENT, SITE_NAME } from "@/lib/constants";
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
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
                   background: "radial-gradient(circle at 50% 0%, rgba(225,29,47,.18), #050507 60%)" }}>
      <div style={{ width: "min(400px,100%)", background: "#0a0a10", border: "1px solid #18181f", borderRadius: 18, padding: 28 }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, margin: "0 0 20px" }}>
          Welcome back to {SITE_NAME}
        </h1>

        <DiscordButton />
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0", color: "#555", fontSize: 12 }}>
          <div style={{ flex: 1, height: 1, background: "#20202c" }} /> or email <div style={{ flex: 1, height: 1, background: "#20202c" }} />
        </div>

        <label className="lbl">Email</label>
        <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

        <label className="lbl" style={{ marginTop: 14 }}>Password</label>
        <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
               onKeyDown={(e) => e.key === "Enter" && submit()} />

        {error && <p style={{ color: "#f87171", fontSize: 13, marginTop: 12 }}>{error}</p>}

        <button className="btn" onClick={submit} disabled={loading}
                style={{ background: "#e11d2e", color: "#fff", width: "100%", marginTop: 18 }}>
          {loading ? "Logging in…" : "Log in"}
        </button>

        <p style={{ marginTop: 18, fontSize: 14, color: "#6b6b7b", textAlign: "center" }}>
          No account? <Link href="/signup" style={{ fontWeight: 600 }}>Claim your name</Link>
        </p>
      </div>
    </main>
  );
}
