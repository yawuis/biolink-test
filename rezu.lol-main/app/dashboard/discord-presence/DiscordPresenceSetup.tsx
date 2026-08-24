"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ExternalLink, Loader2, MessageCircle, ShieldCheck, XCircle } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";

export default function DiscordPresenceSetup({ initialDiscordId, initialInvite, status, error }: { initialDiscordId: string; initialInvite: string; status?: string; error?: string }) {
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState("");
  const connectDiscord = () => {
    setPending(true);
    setLocalError("");
    window.location.href = "/api/discord/link/start";
  };

  return (
    <main className="discordSetupShell">
      <style>{css}</style>
      <section className="discordSetupCard">
        <Link href="/dashboard" className="backLink">← Back to dashboard</Link>

        <div className="heroRow">
          <div className="iconBubble"><MessageCircle size={28} /></div>
          <div>
            <h1>Link Discord</h1>
            <p className="lead">
              Link your Discord to this {SITE_NAME} account. This unlocks presence cards and role-based badges.
            </p>
          </div>
        </div>

        <div className="lockedInvite">
          <ShieldCheck size={18} />
          <div>
            <b>Official Discord required</b>
            <small>Join {initialInvite}. Badges and presence only work from this server.</small>
          </div>
          <a href={initialInvite} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Join</a>
        </div>

        <div className="linkPanel">
          {initialDiscordId ? (
            <div className="connectedBox">
              <CheckCircle2 size={22} />
              <div>
                <b>Discord linked</b>
                <small>ID: {initialDiscordId}</small>
              </div>
            </div>
          ) : (
            <div className="connectedBox mutedBox">
              <MessageCircle size={22} />
              <div>
                <b>No Discord linked yet</b>
                <small>You must sign in with Discord from this page. Manual Discord IDs are disabled for security.</small>
              </div>
            </div>
          )}

          <button className="connectBtn" onClick={connectDiscord} disabled={pending}>
            {pending ? <Loader2 size={17} className="spin" /> : <MessageCircle size={17} />}
            {initialDiscordId ? "Relink Discord" : "Sign in with Discord to link"}
          </button>
        </div>

        {(status || error || localError) && (
          <div className={error || localError ? "statusBox error" : "statusBox"}>
            {error || localError ? <XCircle size={17} /> : <CheckCircle2 size={17} />}
            <span>{error || localError || status}</span>
          </div>
        )}

        <p className="note">
          One Discord account can only be linked to one {SITE_NAME} account. No pasted IDs, no sharing, no spoofing.
        </p>
      </section>
    </main>
  );
}

const css = `
.discordSetupShell{min-height:100vh;background:radial-gradient(circle at 20% 0%,rgba(85,172,238,.18),#050505 55%);color:#fff;display:grid;place-items:center;padding:24px;font-family:Inter,system-ui,sans-serif}.discordSetupCard{width:min(720px,100%);background:#0d0d0f;border:1px solid #202024;border-radius:26px;padding:28px;box-shadow:0 30px 80px rgba(0,0,0,.38)}.backLink{color:#aaa;text-decoration:none;font-weight:800}.heroRow{display:grid;grid-template-columns:70px 1fr;gap:18px;align-items:start;margin-top:22px}.iconBubble{width:60px;height:60px;border-radius:20px;background:rgba(85,172,238,.14);border:1px solid rgba(85,172,238,.35);display:grid;place-items:center;color:#fff}.discordSetupCard h1{font-size:36px;margin:0 0 8px;letter-spacing:-.05em}.lead,.note{color:#aaa;line-height:1.5}.lockedInvite{display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:12px;align-items:center;background:linear-gradient(180deg,#111114,#09090b);border:1px solid #26262b;border-radius:18px;padding:15px;margin:24px 0}.lockedInvite b,.lockedInvite small{display:block}.lockedInvite svg{color:#55acee}.lockedInvite small{margin-top:3px;color:#aaa;word-break:break-word}.lockedInvite a{height:38px;padding:0 13px;border-radius:12px;background:#55acee;color:#fff;text-decoration:none;font-weight:900;display:inline-flex;align-items:center;gap:8px}.linkPanel{background:#09090b;border:1px solid #202024;border-radius:20px;padding:18px;display:grid;gap:14px}.connectedBox{display:grid;grid-template-columns:30px minmax(0,1fr);gap:12px;align-items:center;border:1px solid rgba(68,203,119,.25);background:rgba(68,203,119,.08);border-radius:16px;padding:14px}.connectedBox svg{color:#72e59a}.mutedBox{border-color:#26262b;background:#111114}.mutedBox svg{color:#aaa}.connectedBox b,.connectedBox small{display:block}.connectedBox small{color:#aaa;margin-top:3px;word-break:break-all}.connectBtn{height:48px;border:0;border-radius:15px;background:#55acee;color:white;font-weight:950;display:flex;align-items:center;justify-content:center;gap:9px;cursor:pointer}.connectBtn:disabled{opacity:.7;cursor:not-allowed}.statusBox{margin-top:14px;border:1px solid rgba(68,203,119,.28);background:rgba(68,203,119,.08);border-radius:16px;padding:13px;display:flex;align-items:center;gap:9px;color:#c7f7d4}.statusBox.error{border-color:rgba(255,89,103,.3);background:rgba(255,89,103,.1);color:#ffd4d8}.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:650px){.heroRow,.lockedInvite{grid-template-columns:1fr}.discordSetupCard h1{font-size:30px}.lockedInvite a{width:max-content}}
`;
