"use client";

import { useEffect, useState } from "react";
import { Music, ExternalLink } from "lucide-react";
import { type Profile } from "@/lib/constants";

type SpotifyEmbed = { title?: string; thumbnail_url?: string; provider_name?: string };

function cleanUrl(url?: string) {
  const value = (url || "").trim();
  if (!value) return "";
  return value.startsWith("http") ? value : `https://${value.replace(/^https?:\/\//, "")}`;
}

function trackId(url: string) {
  const match = url.match(/track\/([A-Za-z0-9]+)/);
  return match?.[1] || "";
}

export default function SpotifyCard({ profile }: { profile: Profile }) {
  const url = cleanUrl(profile.spotify_url);
  const [embed, setEmbed] = useState<SpotifyEmbed | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!url || !url.includes("open.spotify.com")) return;
    let active = true;
    fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (active) setEmbed(data);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [url]);

  if (!url) return null;

  const cover = profile.spotify_cover_url?.trim() || embed?.thumbnail_url || "";
  const rawEmbedTitle = embed?.title || "";
  const splitEmbed = rawEmbedTitle.match(/^(.*?)\s*-\s*song by\s*(.*)$/i);
  const autoTitle = splitEmbed?.[1]?.trim() || rawEmbedTitle.trim();
  const autoDescription = splitEmbed?.[2]?.trim() || (failed ? "Tap to listen on Spotify" : "Spotify track");
  const title = profile.spotify_title?.trim() || autoTitle || `Spotify track${trackId(url) ? ` · ${trackId(url).slice(0, 6)}` : ""}`;
  const subtitle = profile.spotify_artist?.trim() || autoDescription;

  return (
    <a href={url} target="_blank" rel="noreferrer" className="module-card">
      <div style={{ width: 48, height: 48, borderRadius: 8, overflow: "hidden", background: "#09090b", display: "grid", placeItems: "center", border: "1px solid #27272a", flex: "none" }}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Music size={20} style={{ color: "#a1a1aa" }} />
        )}
      </div>
      <div style={{ textAlign: "left", minWidth: 0, flex: 1 }}>
        <div className="module-kicker">Spotify</div>
        <div className="module-name">{title}</div>
        <div className="module-sub">{subtitle}</div>
      </div>
      <ExternalLink size={14} style={{ color: "#71717a", flex: "none" }} />
    </a>
  );
}
