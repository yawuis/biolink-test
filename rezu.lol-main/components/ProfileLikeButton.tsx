"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

import { DEFAULT_ACCENT } from "@/lib/constants";

export default function ProfileLikeButton({
  username,
  initialLikes = 0,
  accent = DEFAULT_ACCENT,
}: {
  username: string;
  initialLikes?: number;
  accent?: string;
}) {
  const [likes, setLikes] = useState(initialLikes || 0);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch(`/api/like?username=${encodeURIComponent(username)}`, { cache: "no-store" });
        const data = await res.json();
        if (!alive || !data?.ok) return;
        setLikes(Number(data.likes || 0));
        setLiked(!!data.liked);
      } catch {
        // Keep initial count if state check fails.
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [username]);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/like?username=${encodeURIComponent(username)}`, { method: "POST" });
      const data = await res.json();
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (data?.ok) {
        setLiked(!!data.liked);
        setLikes(Number(data.likes || 0));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-label={liked ? "Unlike profile" : "Like profile"}
      title={liked ? "Unlike profile" : "Like profile"}
      style={{
        border: "none",
        background: "transparent",
        padding: 0,
        color: liked ? accent : "#b7b7c6",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        font: "inherit",
        fontSize: 12,
        cursor: busy ? "wait" : "pointer",
        opacity: busy ? 0.72 : 1,
      }}
    >
      <Heart size={14} fill={liked ? accent : "none"} />
      {likes.toLocaleString()}
    </button>
  );
}
