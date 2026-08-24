"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X, Loader2, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { makeAuthCallbackUrl } from "@/lib/site-url";
import { USERNAME_RE, DEFAULT_ACCENT, SITE_NAME } from "@/lib/constants";
import DiscordButton from "@/components/DiscordButton";

export default function SignupForm({ initialUsername }: { initialUsername: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "free" | "taken" | "invalid">("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!username) return setStatus("idle");
    if (!USERNAME_RE.test(username)) return setStatus("invalid");
    setStatus("checking");
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .or(`username.eq.${username},alias.eq.${username}`)
        .maybeSingle();
      setStatus(data ? "taken" : "free");
    }, 350);
    return () => clearTimeout(t);
  }, [username, supabase]);

  const submit = async () => {
    setError("");
    setNotice("");

    if (!USERNAME_RE.test(username)) return setError("Username: 1–20 lowercase letters, numbers, or _");
    if (status === "taken") return setError("That name is taken.");
    if (!email.trim()) return setError("Enter an email.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");

    setLoading(true);

    const { data: signUp, error: signUpErr } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: makeAuthCallbackUrl("/dashboard"),
        data: {
          claim_username: username,
          display_name: username,
        },
      },
    });

    if (signUpErr) {
      setLoading(false);
      if (signUpErr.message.toLowerCase().includes("rate limit")) {
        return setError("Supabase is rate-limiting confirmation emails. Wait a few minutes, then try again once. You can also use Discord login while it cools down.");
      }
      const msg = signUpErr.message || "Signup failed. Run the latest Supabase SQL patch, then try again.";
      if (msg.toLowerCase().includes("database") || msg.toLowerCase().includes("constraint") || msg.toLowerCase().includes("profiles_discord_id")) {
        return setError("Signup database rule blocked this profile. Run supabase/v26-signup-discord-id-trigger-fix.sql, then try again.");
      }
      return setError(msg);
    }

    // If email confirmation is ON in Supabase, there is no logged-in session yet.
    // The SQL trigger in supabase/v6-auth-fix.sql reserves the username as soon as
    // the auth user is created, then /auth/callback logs them in after verification.
    if (!signUp.session) {
      setLoading(false);
      setNotice("Check your email and click the verification link. After it opens, you will be sent to your dashboard.");
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  };

  return (
    <main style={shell}>
      <div style={card}>
        <h1 style={title}>Claim your name</h1>

        <DiscordButton mode="signup" />
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0", color: "#555", fontSize: 12 }}>
          <div style={{ flex: 1, height: 1, background: "#20202c" }} /> or email <div style={{ flex: 1, height: 1, background: "#20202c" }} />
        </div>

        <label className="lbl">Username</label>
        <div style={{ position: "relative" }}>
          <span style={prefix}>{SITE_NAME}/</span>
          <input
            className="field"
            style={{ paddingLeft: 76 }}
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            placeholder="yourname"
            autoFocus
          />
          <span style={hint}>
            {status === "checking" && <Loader2 size={16} className="spin" style={{ color: "#6b6b7b" }} />}
            {status === "free" && <Check size={16} style={{ color: "#4ade80" }} />}
            {(status === "taken" || status === "invalid") && <X size={16} style={{ color: "#f87171" }} />}
          </span>
        </div>
        <div style={{ minHeight: 18, fontSize: 12, marginTop: 5, color: status === "free" ? "#4ade80" : "#f87171" }}>
          {status === "free" && "Available ✓"}
          {status === "taken" && "Already claimed"}
          {status === "invalid" && "1–20 lowercase letters, numbers, or _"}
        </div>

        <label className="lbl" style={{ marginTop: 8 }}>Email</label>
        <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

        <label className="lbl" style={{ marginTop: 14 }}>Password</label>
        <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />

        {notice && (
          <p style={{ color: "#4ade80", fontSize: 13, marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
            <MailCheck size={16} /> {notice}
          </p>
        )}
        {error && <p style={{ color: "#f87171", fontSize: 13, marginTop: 12 }}>{error}</p>}

        <button
          className="btn"
          onClick={submit}
          disabled={loading || status === "taken" || status === "checking"}
          style={{ background: "#e11d2e", color: "#fff", width: "100%", marginTop: 18 }}
        >
          {loading ? "Creating…" : "Create my page"}
        </button>

        <p style={{ marginTop: 18, fontSize: 14, color: "#6b6b7b", textAlign: "center" }}>
          Already have one? <Link href="/login" style={{ fontWeight: 600 }}>Log in</Link>
        </p>
      </div>
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  );
}

const shell: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  background: "radial-gradient(circle at 15% 0%, rgba(225,29,47,.18), #050505 58%)",
};
const card: React.CSSProperties = {
  width: "min(400px, 100%)",
  background: "#0a0a0f",
  border: "1px solid #1c1c22",
  borderRadius: 18,
  padding: 28,
};
const title: React.CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 24,
  fontWeight: 700,
  margin: "0 0 20px",
};
const prefix: React.CSSProperties = {
  position: "absolute",
  left: 12,
  top: "50%",
  transform: "translateY(-50%)",
  color: "#6b6b7b",
  fontSize: 13,
  pointerEvents: "none",
};
const hint: React.CSSProperties = {
  position: "absolute",
  right: 12,
  top: "50%",
  transform: "translateY(-50%)",
  display: "flex",
};
