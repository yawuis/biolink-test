"use client";

import {
  BadgeCheck,
  Bug,
  Crown,
  Gem,
  HandCoins,
  Lightbulb,
  PartyPopper,
  Rocket,
  Trophy,
  UserRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { BadgeItem } from "@/lib/constants";

const ICONS: Record<string, LucideIcon> = {
  owner: Crown,
  staff: Wrench,
  helper: Lightbulb,
  verified: BadgeCheck,
  premium: Gem,
  donor: HandCoins,
  og: UserRound,
  rich: Rocket,
  bug: Bug,
  winner: Trophy,
  early: HandCoins,
  founding100: PartyPopper,
};

const COLORS: Record<string, string> = {
  owner: "#facc15",
  staff: "#94a3b8",
  helper: "#fbbf24",
  verified: "#22c55e",
  premium: "#60a5fa",
  donor: "#34d399",
  og: "#c084fc",
  rich: "#fb7185",
  bug: "#4ade80",
  winner: "#f59e0b",
  early: "#f472b6",
  founding100: "#f43f5e",
};

export default function BadgeIcon({
  badge,
  monochrome = true,
  color = "#ffffff",
  glow = false,
  size = 18,
}: {
  badge: BadgeItem;
  monochrome?: boolean;
  color?: string;
  glow?: boolean;
  size?: number;
}) {
  const isCustom = !!badge.custom || badge.id?.startsWith("custom-");

  if (isCustom) {
    if (badge.image_url) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={badge.image_url}
          alt=""
          style={{ width: size, height: size, objectFit: "cover", borderRadius: Math.max(4, Math.round(size * 0.25)) }}
        />
      );
    }
    const BuiltinIcon = ICONS[badge.id];
    if (!BuiltinIcon) {
      return <span style={{ fontSize: size, lineHeight: 1 }}>{badge.icon || "⭐"}</span>;
    }
  }

  const Icon = ICONS[badge.id] || BadgeCheck;
  const iconColor = monochrome ? color : (COLORS[badge.id] || color);

  return (
    <Icon
      size={size}
      strokeWidth={2.25}
      color={iconColor}
      style={{
        filter: glow ? `drop-shadow(0 0 7px ${iconColor})` : "none",
        flex: "none",
      }}
    />
  );
}
