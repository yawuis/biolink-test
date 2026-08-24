"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X, Loader2, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { makeAuthCallbackUrl } from "@/lib/site-url";
import { USERNAME_RE, SITE_NAME } from "@/lib/constants";
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

    if (!signUp.session) {
      setLoading(false);
      setNotice("Check your email and click the verification link. After it opens, you will be sent to your dashboard.");
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  };

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#050507", fontFamily: "inherit" }}>
      <div style={{ width: "min(380px, 100%)", background: "#09090b", border: "1px solid #18181b", borderRadius: 8, padding: "36px 30px" }}>
        
        {/* Brand Logo */}
        <div style={{ fontSize: "14px", fontWeight: "600", color: "#f4f4f5", letterSpacing: "-0.01em", textAlign: "center", marginBottom: "28px" }}>
          sob<span style={{ color: "#55acee" }}>.lol</span>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#f4f4f5", textAlign: "center", margin: "0 0 20px", letterSpacing: "-0.02em" }}>
          Claim your name
        </h1>

        <DiscordButton mode="signup" />

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0", color: "#3f3f46", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          <div style={{ flex: 1, height: 1, background: "#18181b" }} /> 
          or email 
          <div style={{ flex: 1, height: 1, background: "#18181b" }} />
        </div>

        {/* Username Field */}
        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "#71717a", fontWeight: "500", marginBottom: "6px" }}>Username</label>
          <div style={{ position: "relative", display: "flex", alignItems: "center", background: "#040405", border: "1px solid #27272a", borderRadius: "6px", width: "100%" }}>
            <span style={{ paddingLeft: "12px", color: "#52525b", fontSize: "14px", userSelect: "none", fontFamily: "monospace" }}>
              {SITE_NAME}/
            </span>
            <input
              style={{
                background: "transparent",
                border: "none",
                color: "#f4f4f5",
                fontSize: "14px",
                fontFamily: "monospace",
                padding: "10px 40px 10px 4px",
                width: "100%",
                outline: "none"
              }}
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              placeholder="yourname"
              autoFocus
            />
            <span style={{ position: "absolute", right: "12px", display: "flex", alignItems: "center" }}>
              {status === "checking" && <Loader2 size={15} className="spin" style={{ color: "#71717a" }} />}
              {status === "free" && <Check size={15} style={{ color: "#10b981" }} />}
              {(status === "taken" || status === "invalid") && <X size={15} style={{ color: "#ef4444" }} />}
            </span>
          </div>
          <div style={{ minHeight: 18, fontSize: 12, marginTop: 6, color: status === "free" ? "#10b981" : "#ef4444" }}>
            {status === "free" && "Available ✓"}
            {status === "taken" && "Already claimed"}
            {status === "invalid" && "1–20 lowercase letters, numbers, or _"}
          </div>
        </div>

        {/* Email Field */}
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

        {/* Password Field */}
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

        {notice && (
          <p style={{ color: "#10b981", fontSize: 13, marginTop: 12, marginBottom: 12, display: "flex", gap: 8, alignItems: "center", lineHeight: 1.4 }}>
            <MailCheck size={16} style={{ flexShrink: 0 }} /> {notice}
          </p>
        )}
        {error && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 12, marginBottom: 12, textAlign: "center", lineHeight: 1.4 }}>{error}</p>}

        <button
          onClick={submit}
          disabled={loading || status === "taken" || status === "checking"}
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
          {loading ? "Creating…" : "Create my page"}
        </button>

        <p style={{ marginTop: 24, fontSize: 13, color: "#52525b", textAlign: "center" }}>
          Already have one? <Link href="/login" style={{ fontWeight: "500", color: "#a1a1aa", textDecoration: "none" }}>Log in</Link>
        </p>
      </div>
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  );
}
