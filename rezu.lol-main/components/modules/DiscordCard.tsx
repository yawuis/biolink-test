"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Gamepad2, Headphones, MessageCircle, Music, Radio, WifiOff } from "lucide-react";
import { DISCORD_INVITE_URL, DEFAULT_ACCENT, type Profile } from "@/lib/constants";
import { card } from "./style";

type BotPresence = {
  ok: boolean;
  joined?: boolean;
  status?: "online" | "idle" | "dnd" | "offline" | string;
  activities?: { name: string; type: number; details?: string; state?: string }[];
  user?: {
    id: string;
    username: string;
    global_name?: string;
    avatar_url?: string;
    avatar_decoration_url?: string;
  };
  error?: string;
};

const STATUS_COLOR: Record<string, string> = {
  online: "#43b581",
  idle: "#faa61a",
  dnd: "#f04747",
  offline: "#747f8d",
  invisible: "#747f8d",
};


function activityIcon(type?: number) {
  if (type === 2) return <Music size={15} />;
  if (type === 0) return <Gamepad2 size={15} />;
  if (type === 3) return <Radio size={15} />;
  if (type === 4) return <Headphones size={15} />;
  return <MessageCircle size={15} />;
}

function activityText(data?: BotPresence) {
  const first = data?.activities?.find((item) => item.name && item.name !== "Custom Status") || data?.activities?.[0];
  if (!first) return data?.status === "offline" ? "Offline" : "Doing nothing";
  const bottom = [first.details, first.state].filter(Boolean).join(" • ");
  return bottom ? `${first.name} — ${bottom}` : first.name;
}

export default function DiscordCard({ profile }: { profile: Profile }) {
  const accent = profile.accent || DEFAULT_ACCENT;
  const invite = DISCORD_INVITE_URL;
  const [data, setData] = useState<BotPresence | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profile.discord_id) return;
    let alive = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/discord/presence/${profile.discord_id}`, { cache: "no-store" });
        const json = await res.json();
        if (alive) setData(json);
      } catch (error) {
        if (alive) setData({ ok: false, error: "Presence API offline" });
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const timer = window.setInterval(load, 15000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [profile.discord_id]);

  const status = data?.status || "offline";
  const avatar = data?.user?.avatar_url || "https://cdn.discordapp.com/embed/avatars/0.png";
  const name = data?.user?.global_name || data?.user?.username || "Discord user";
  const firstActivity = data?.activities?.[0];

  if (!profile.discord_id) {
    if (!profile.discord_enabled) return null;
    return (
      <a href={invite} target="_blank" rel="noreferrer" style={{ ...card(accent), display: "flex", alignItems: "center", gap: 14, color: "#e8e8ef", textDecoration: "none" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: `${accent}22`, border: `1px solid ${accent}55`, display: "grid", placeItems: "center" }}>
          <MessageCircle size={25} style={{ color: accent }} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>Join for Discord presence</div>
          <div style={{ fontSize: 13, color: "#c5c5d2" }}>Join the official server, then link your Discord.</div>
        </div>
        <ExternalLink size={15} style={{ color: "#a9a9b5" }} />
      </a>
    );
  }

  if (!data?.ok || !data.joined) {
    return (
      <a href={invite} target="_blank" rel="noreferrer" style={{ ...card(accent), display: "flex", alignItems: "center", gap: 14, textDecoration: "none", color: "#e8e8ef" }}>
        <WifiOff size={27} style={{ color: accent }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 900 }}>{loading ? "Checking Discord..." : "Join the Discord to show presence"}</div>
          <div style={{ fontSize: 13, color: "#c5c5d2" }}>{data?.error || "Join the official Discord and your status will appear here."}</div>
        </div>
      </a>
    );
  }

  return (
    <div style={{ ...card(accent), display: "flex", alignItems: "center", justifyContent: "center", gap: 14, color: "#e8e8ef", width: "100%" }}>
      <div style={{ position: "relative", width: 62, height: 62, flex: "0 0 auto", display: "grid", placeItems: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar} alt="" style={{ width: 54, height: 54, borderRadius: "50%", objectFit: "cover", display: "block", position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }} />
        {data.user?.avatar_decoration_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.user.avatar_decoration_url} alt="" style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 76, height: 76, objectFit: "contain", pointerEvents: "none", zIndex: 2 }} />
        )}
        <span style={{ position: "absolute", right: 3, bottom: 4, width: 16, height: 16, borderRadius: "50%", background: STATUS_COLOR[status] || STATUS_COLOR.offline, border: "3px solid #141416", zIndex: 3 }} />
      </div>
      <div style={{ textAlign: "left", minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <strong style={{ fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</strong>
          <span style={{ fontSize: 11, textTransform: "uppercase", color: STATUS_COLOR[status] || STATUS_COLOR.offline, fontWeight: 900 }}>{status}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "#c5c5d2", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 4 }}>
          {activityIcon(firstActivity?.type)}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{activityText(data)}</span>
        </div>
      </div>
    </div>
  );
}
