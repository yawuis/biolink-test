"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Gamepad2, Headphones, MessageCircle, Music, Radio, WifiOff } from "lucide-react";
import { DISCORD_INVITE_URL, type Profile } from "@/lib/constants";

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
  online: "#22c55e",
  idle: "#eab308",
  dnd: "#ef4444",
  offline: "#71717a",
  invisible: "#71717a",
};

function activityIcon(type?: number) {
  if (type === 2) return <Music size={14} />;
  if (type === 0) return <Gamepad2 size={14} />;
  if (type === 3) return <Radio size={14} />;
  if (type === 4) return <Headphones size={14} />;
  return <MessageCircle size={14} />;
}

function activityText(data?: BotPresence) {
  const first = data?.activities?.find((item) => item.name && item.name !== "Custom Status") || data?.activities?.[0];
  if (!first) return data?.status === "offline" ? "Offline" : "Online";
  const bottom = [first.details, first.state].filter(Boolean).join(" · ");
  return bottom ? `${first.name} — ${bottom}` : first.name;
}

export default function DiscordCard({ profile }: { profile: Profile }) {
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
      } catch {
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
      <a href={invite} target="_blank" rel="noreferrer" className="module-card">
        <div style={{ width: 44, height: 44, borderRadius: 10, background: "#09090b", border: "1px solid #27272a", display: "grid", placeItems: "center", flex: "none" }}>
          <MessageCircle size={20} style={{ color: "#55acee" }} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="module-name">Join for Discord presence</div>
          <div className="module-sub">Link Discord, then your status shows here.</div>
        </div>
        <ExternalLink size={14} style={{ color: "#71717a" }} />
      </a>
    );
  }

  if (!data?.ok || !data.joined) {
    return (
      <a href={invite} target="_blank" rel="noreferrer" className="module-card">
        <WifiOff size={22} style={{ color: "#a1a1aa", flex: "none" }} />
        <div style={{ minWidth: 0 }}>
          <div className="module-name">{loading ? "Checking Discord…" : "Join the Discord to show presence"}</div>
          <div className="module-sub">{data?.error || "Join the official server and your status appears here."}</div>
        </div>
      </a>
    );
  }

  return (
    <div className="module-card">
      <div style={{ position: "relative", width: 48, height: 48, flex: "none" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar} alt="" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", display: "block", border: "1px solid #27272a" }} />
        {data.user?.avatar_decoration_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.user.avatar_decoration_url} alt="" style={{ position: "absolute", inset: -8, width: 64, height: 64, objectFit: "contain", pointerEvents: "none" }} />
        )}
        <span
          style={{
            position: "absolute",
            right: -1,
            bottom: -1,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: STATUS_COLOR[status] || STATUS_COLOR.offline,
            border: "2px solid #141416",
          }}
        />
      </div>
      <div style={{ textAlign: "left", minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <strong className="module-name">{name}</strong>
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: "capitalize", color: STATUS_COLOR[status] || STATUS_COLOR.offline }}>
            {status}
          </span>
        </div>
        <div className="module-sub" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {activityIcon(firstActivity?.type)}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{activityText(data)}</span>
        </div>
      </div>
    </div>
  );
}
