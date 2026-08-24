"use client";

import { useEffect, useState } from "react";
import { Clock as ClockIcon } from "lucide-react";
import type { Profile } from "@/lib/constants";
import { card } from "./style";

export default function Clock({ profile }: { profile: Profile }) {
  const accent = profile.accent || "#e11d2f";
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date>(new Date());
  const [tz, setTz] = useState("Local time");

  useEffect(() => {
    setMounted(true);
    setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "Local time");
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const time = mounted
    ? new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(now)
    : "--:--:--";
  const date = mounted
    ? new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(now)
    : "--- --";

  return (
    <div style={{ ...card(accent), display: "flex", alignItems: "center", gap: 14 }}>
      <ClockIcon size={30} style={{ color: accent }} />
      <div style={{ textAlign: "left" }}>
        <div style={{ fontSize: 22, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{time}</div>
        <div style={{ fontSize: 12, color: "#9a9aaa" }}>{date} · {tz.replace(/_/g, " ")}</div>
      </div>
    </div>
  );
}
