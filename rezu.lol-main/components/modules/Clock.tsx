"use client";

import { useEffect, useState } from "react";
import { Clock as ClockIcon } from "lucide-react";
import { type Profile } from "@/lib/constants";

export default function Clock({ profile: _profile }: { profile: Profile }) {
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
    <div className="module-card">
      <div style={{ width: 44, height: 44, borderRadius: 10, background: "#09090b", border: "1px solid #27272a", display: "grid", placeItems: "center", flex: "none" }}>
        <ClockIcon size={20} style={{ color: "#a1a1aa" }} />
      </div>
      <div style={{ textAlign: "left" }}>
        <div className="module-name" style={{ fontVariantNumeric: "tabular-nums", fontSize: 18 }}>{time}</div>
        <div className="module-sub">{date} · {tz.replace(/_/g, " ")}</div>
      </div>
    </div>
  );
}
