"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { USERNAME_RE, DEFAULT_ACCENT, SITE_NAME } from "@/lib/constants";
import BrandMark from "@/components/BrandMark";

export default function ClaimForm({ userId, suggested }: { userId: string; suggested: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [username, setUsername] = useState(suggested || "");
  const [status, setStatus] = useState<"idle" | "checking" | "free" | "taken" | "invalid" | "premium_locked">("idle");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!username) return setStatus("idle");
    if (!USERNAME_RE.test(username)) return setStatus("invalid");
    setStatus("checking");
    const t = setTimeout(async () => {
      const { data } = await supabase.from("profiles").select("id").or(`username.eq.${username},alias.eq.${username}`).maybeSingle();
      if (data) {
        setStatus("taken");
      } else {
        const { isPremiumUsername } = await import("@/lib/constants");
        if (isPremiumUsername(username)) {
          const { data: purchase } = await supabase.from("purchased_usernames").select("id").eq("username", username).eq("user_id", userId).maybeSingle();
          setStatus(purchase ? "free" : "premium_locked");
        } else {
          setStatus("free");
        }
      }
    }, 350);
    return () => clearTimeout(t);
  }, [username, supabase, userId]);

  const claim = async () => {
    setError("");
    if (!USERNAME_RE.test(username)) return setError("1–20 lowercase letters, numbers, or _");
    if (status === "taken") return setError("That name is taken.");
    if (status === "premium_locked") return setError("This is a premium handle. Buy it in the Marketplace first.");
    setLoading(true);
    const { error: insertErr } = await supabase.from("profiles").insert({
      id: userId,
      username,
      display_name: username,
      accent: DEFAULT_ACCENT,
      discord_id: null,
      discord_enabled: false,
    });
    if (insertErr) {
      setLoading(false);
      return setError(insertErr.code === "23505" ? "Someone just grabbed that name." : insertErr.message);
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <main className="auth-shell">
      <div className="auth-body">
        <div className="auth-card">
          <Link href="/" className="auth-brand">
            <BrandMark />
          </Link>
          <h1>Pick your name</h1>
          <p className="auth-lead">This decision is permanent. Make it count.</p>

          <div className="auth-field">
            <label className="auth-label">Username</label>
            <div className="auth-handle">
              <span className="auth-handle-prefix">{SITE_NAME}/</span>
              <input
                value={username}
                autoFocus
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="yourname"
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
              {status === "premium_locked" && (
                <>
                  Premium handle — acquire it in the{" "}
                  <Link href="/marketplace" style={{ textDecoration: "underline", color: "inherit", fontWeight: 500 }}>
                    Marketplace
                  </Link>{" "}
                  first
                </>
              )}
              {status === "invalid" && "1–20 lowercase letters, numbers, or _"}
            </div>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            className="btn-primary"
            onClick={claim}
            disabled={loading || status === "taken" || status === "checking" || status === "premium_locked"}
            style={{ width: "100%", height: 42 }}
          >
            {loading ? "Claiming…" : "Claim it"}
          </button>
        </div>
      </div>
    </main>
  );
}
