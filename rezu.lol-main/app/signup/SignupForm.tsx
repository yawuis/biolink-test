"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X, Loader2, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { makeAuthCallbackUrl } from "@/lib/site-url";
import { USERNAME_RE, SITE_NAME, isPremiumUsername } from "@/lib/constants";
import DiscordButton from "@/components/DiscordButton";
import BrandMark from "@/components/BrandMark";

export default function SignupForm({ initialUsername }: { initialUsername: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "free" | "taken" | "invalid" | "premium_locked">("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!username) return setStatus("idle");
    if (!USERNAME_RE.test(username)) return setStatus("invalid");
    if (isPremiumUsername(username)) {
      setStatus("premium_locked");
      return;
    }
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
    if (status === "premium_locked" || isPremiumUsername(username)) {
      return setError("Premium handle. Sign up with a standard name first, then acquire this name from the Marketplace.");
    }
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
    <main className="auth-shell">
      <div className="auth-body">
        <div className="auth-card">
          <Link href="/" className="auth-brand">
            <BrandMark />
          </Link>
          <h1>Claim your name</h1>
          <p className="auth-lead">One name. Yours forever.</p>

          <DiscordButton mode="signup" />
          <div className="auth-divider">or email</div>

          <div className="auth-field">
            <label className="auth-label">Username</label>
            <div className="auth-handle">
              <span className="auth-handle-prefix">{SITE_NAME}/</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="yourname"
                autoFocus
              />
              <span className="auth-handle-status">
                {status === "checking" && <Loader2 size={15} className="spin" style={{ color: "#71717a" }} />}
                {status === "free" && <Check size={15} style={{ color: "#10b981" }} />}
                {(status === "taken" || status === "invalid" || status === "premium_locked") && <X size={15} style={{ color: "#ef4444" }} />}
              </span>
            </div>
            <div className="auth-hint" style={{ color: status === "free" ? "#10b981" : "#ef4444" }}>
              {status === "free" && "Available"}
              {status === "taken" && "Already claimed"}
              {status === "premium_locked" && "Premium handle — acquire it in the Marketplace first"}
              {status === "invalid" && "1–20 lowercase letters, numbers, or _"}
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input className="auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              autoComplete="new-password"
            />
          </div>

          {notice && (
            <p className="auth-ok">
              <MailCheck size={16} style={{ flexShrink: 0 }} /> {notice}
            </p>
          )}
          {error && <p className="auth-error">{error}</p>}

          <button
            className="btn-primary"
            onClick={submit}
            disabled={loading || status !== "free"}
            style={{ width: "100%", height: 42 }}
          >
            {loading ? "Creating…" : "Create my page"}
          </button>

          <p className="auth-foot">
            Already have one? <Link href="/login">Log in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
