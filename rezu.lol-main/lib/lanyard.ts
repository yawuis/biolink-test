"use client";

import { useEffect, useState } from "react";

export type LanyardData = {
  discord_user: { id: string; username: string; global_name?: string; avatar?: string };
  discord_status: "online" | "idle" | "dnd" | "offline";
  activities: { type: number; name?: string; state?: string; details?: string }[];
} | null;

// Reads a user's live Discord presence from the public Lanyard API.
// Requires the user to have joined the Lanyard Discord (discord.gg/rezu).
export function useLanyard(id?: string): { data: LanyardData; error: boolean } {
  const [data, setData] = useState<LanyardData>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;

    const load = async () => {
      try {
        const r = await fetch(`https://api.lanyard.rest/v1/users/${id}`);
        const j = await r.json();
        if (!active) return;
        if (j?.success) {
          setData(j.data);
          setError(false);
        } else {
          setError(true);
        }
      } catch {
        if (active) setError(true);
      }
    };

    load();
    const t = setInterval(load, 20000); // refresh every 20s
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [id]);

  return { data, error };
}

export const STATUS_COLOR: Record<string, string> = {
  online: "#43b581",
  idle: "#faa61a",
  dnd: "#f04747",
  offline: "#747f8d",
};

export function presenceText(d: NonNullable<LanyardData>): string {
  const custom = d.activities?.find((a) => a.type === 4);
  if (custom?.state) return custom.state;
  const playing = d.activities?.find((a) => a.type === 0 && a.name);
  if (playing?.name) return `Playing ${playing.name}`;
  return "currently doing nothing";
}
