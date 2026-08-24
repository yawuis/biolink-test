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
  const [status, setStatus] = useState<"idle" | "checking" | "free" | "taken" | "invalid">("idle");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!username) return setStatus("idle");
    if (!USERNAME_RE.test(username)) return setStatus("invalid");
    setStatus("checking");
    const t = setTimeout(async () => {
      const { data } = await supabase.from("profiles").select("id").or(`username.eq.${username},alias.eq.${username}`).maybeSingle();
      setStatus(data ? "taken" : "free");
    }, 350);
    return () => clearTimeout(t);
  }, [username]);

  const claim = async () => {
    setError("");
    if (!USERNAME_RE.test(username)) return setError("1–20 lowercase letters, numbers, or _");
    if (status === "taken") return setError("That name is taken.");
    setLoading(true);
    const { error: insertErr } = await supabase.from("profiles").insert({
      id: userId,
      username,
      display_name: username,
      accent: DEFAULT_ACCENT,
      // Important: older SQL upgrades created discord_id with default ''.
      // v20 added a check that only allows NULL or real Discord digits.
      // New profiles must start as NULL until they link Discord through OAuth.
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
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
                   background: "radial-gradient(circle at 50% 0%, rgba(225,29,47,.18), #050507 60%)" }}>
      <div style={{ width: "min(400px,100%)", background: "#0a0a10", border: "1px solid #18181f", borderRadius: 18, padding: 28 }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, margin: "0 0 6px" }}>
          Pick your name
        </h1>
        <p style={{ color: "#9a9aaa", fontSize: 14, margin: "0 0 20px" }}>One last step — this is permanent.</p>

        <label className="lbl">Username</label>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#6b6b7b", fontSize: 13, pointerEvents: "none" }}>
            {SITE_NAME}/
          </span>
          <input className="field" style={{ paddingLeft: 76 }} value={username} autoFocus
                 onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} placeholder="yourname" />
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", display: "flex" }}>
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

        {error && <p style={{ color: "#f87171", fontSize: 13, marginTop: 6 }}>{error}</p>}

        <button className="btn" onClick={claim} disabled={loading || status === "taken" || status === "checking"}
                style={{ background: "#e11d2e", color: "#fff", width: "100%", marginTop: 16 }}>
          {loading ? "Claiming…" : "Claim it"}
        </button>
        <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </main>
  );
}
