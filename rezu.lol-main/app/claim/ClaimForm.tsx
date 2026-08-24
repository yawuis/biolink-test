"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { USERNAME_RE, DEFAULT_ACCENT, SITE_NAME } from "@/lib/constants";

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
      // Check if taken in profiles
      const { data } = await supabase.from("profiles").select("id").or(`username.eq.${username},alias.eq.${username}`).maybeSingle();
      if (data) {
        setStatus("taken");
      } else {
        // Check if premium handle
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
  }, [username]);

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
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#050507", fontFamily: "inherit" }}>
      <div style={{ width: "min(380px,100%)", background: "#09090b", border: "1px solid #18181b", borderRadius: 8, padding: "36px 30px" }}>
        
        {/* Brand Logo */}
        <div style={{ fontSize: "14px", fontWeight: "600", color: "#f4f4f5", letterSpacing: "-0.01em", textAlign: "center", marginBottom: "28px" }}>
          sob<span style={{ color: "#55acee" }}>.lol</span>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#f4f4f5", textAlign: "center", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
          Pick your name
        </h1>
        <p style={{ color: "#71717a", fontSize: 13, textAlign: "center", margin: "0 0 24px" }}>This decision is permanent.</p>

        {/* Username input box */}
        <div style={{ marginBottom: "18px" }}>
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
              autoFocus
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} 
              placeholder="yourname" 
            />
            <span style={{ position: "absolute", right: "12px", display: "flex", alignItems: "center" }}>
              {status === "checking" && <Loader2 size={15} className="spin" style={{ color: "#71717a" }} />}
              {status === "free" && <Check size={15} style={{ color: "#10b981" }} />}
              {(status === "taken" || status === "invalid" || status === "premium_locked") && <X size={15} style={{ color: "#ef4444" }} />}
            </span>
          </div>
          <div style={{ minHeight: 18, fontSize: 12, marginTop: 6, color: status === "free" ? "#10b981" : "#ef4444" }}>
            {status === "free" && "Available ✓"}
            {status === "taken" && "Already claimed"}
            {status === "premium_locked" && "Premium Handle (Acquire it in the Marketplace first)"}
            {status === "invalid" && "1–20 lowercase letters, numbers, or _"}
          </div>
        </div>

        {error && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 12, marginBottom: 12, textAlign: "center" }}>{error}</p>}

        <button 
          onClick={claim} 
          disabled={loading || status === "taken" || status === "checking" || status === "premium_locked"}
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
          {loading ? "Claiming…" : "Claim it"}
        </button>
      </div>
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  );
}
