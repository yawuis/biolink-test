"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ExternalLink, Loader2, MessageCircle, ShieldCheck, XCircle } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import BrandMark from "@/components/BrandMark";

export default function DiscordPresenceSetup({ initialDiscordId, initialInvite, status, error }: { initialDiscordId: string; initialInvite: string; status?: string; error?: string }) {
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState("");
  const connectDiscord = () => {
    setPending(true);
    setLocalError("");
    window.location.href = "/api/discord/link/start";
  };

  return (
    <main className="ds-shell">
      <section className="ds-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <Link href="/dashboard" className="ds-back">← Dashboard</Link>
          <BrandMark />
        </div>

        <h1>Link Discord</h1>
        <p className="lead" style={{ marginBottom: 24 }}>
          Connect Discord to this {SITE_NAME} account. That unlocks presence and role badges.
        </p>

        <div style={{ display: "flex", gap: 12, alignItems: "center", background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <ShieldCheck size={18} style={{ color: "#55acee", flex: "none" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <b style={{ display: "block", fontSize: 13, fontWeight: 600 }}>Official Discord required</b>
            <small style={{ display: "block", color: "#71717a", marginTop: 3, fontSize: 12 }}>Join {initialInvite}. Badges and presence only work from this server.</small>
          </div>
          <a href={initialInvite} target="_blank" rel="noreferrer" className="btn-primary" style={{ height: 36, padding: "0 12px" }}>
            <ExternalLink size={14} /> Join
          </a>
        </div>

        <div style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16, display: "grid", gap: 14 }}>
          {initialDiscordId ? (
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <CheckCircle2 size={20} style={{ color: "#10b981", flex: "none" }} />
              <div>
                <b style={{ display: "block", fontSize: 14, fontWeight: 600 }}>Discord linked</b>
                <small style={{ display: "block", color: "#71717a", marginTop: 3, fontSize: 12, wordBreak: "break-all" }}>ID: {initialDiscordId}</small>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <MessageCircle size={20} style={{ color: "#a1a1aa", flex: "none" }} />
              <div>
                <b style={{ display: "block", fontSize: 14, fontWeight: 600 }}>No Discord linked yet</b>
                <small style={{ display: "block", color: "#71717a", marginTop: 3, fontSize: 12 }}>Sign in with Discord from this page. Manual IDs are disabled.</small>
              </div>
            </div>
          )}

          <button className="btn-primary" onClick={connectDiscord} disabled={pending} style={{ width: "100%", height: 42 }}>
            {pending ? <Loader2 size={16} className="spin" /> : <MessageCircle size={16} />}
            {initialDiscordId ? "Relink Discord" : "Sign in with Discord"}
          </button>
        </div>

        {(status || error || localError) && (
          <div style={{
            marginTop: 14,
            border: `1px solid ${error || localError ? "#27272a" : "#27272a"}`,
            background: "#09090b",
            borderRadius: 10,
            padding: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: error || localError ? "#ef4444" : "#10b981",
            fontSize: 13,
          }}>
            {error || localError ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{error || localError || status}</span>
          </div>
        )}

        <p style={{ color: "#71717a", fontSize: 12, lineHeight: 1.5, margin: "16px 0 0" }}>
          One Discord account can only be linked to one {SITE_NAME} account.
        </p>
      </section>
    </main>
  );
}
