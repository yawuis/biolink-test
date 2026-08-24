"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Eye, MapPin } from "lucide-react";
import { PLATFORMS } from "./platforms";
import BrandIcon from "./BrandIcon";
import BadgeIcon from "./BadgeIcon";
import ProfileLikeButton from "./ProfileLikeButton";
import {
  MARKETPLACE_BADGES,
  badgesFromDiscordRoleIds,
  milestoneBadgesForProfile,
  resolveProfileAccent,
  type BadgeItem,
  type Profile,
} from "@/lib/constants";

export function avatarShape(shape?: string) {
  if (shape === "square") return { borderRadius: 8 };
  if (shape === "rounded") return { borderRadius: 10 };
  if (shape === "hexagon") return { borderRadius: 0, clipPath: "polygon(25% 5%,75% 5%,100% 50%,75% 95%,25% 95%,0 50%)" };
  if (shape === "star") return { borderRadius: 0, clipPath: "polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)" };
  return { borderRadius: "50%" };
}

export function fontFamily(font?: string) {
  if (font === "JetBrains Mono") return "ui-monospace, SFMono-Regular, Menlo, monospace";
  if (font) return `${font}, Inter, system-ui, sans-serif`;
  return "Inter, system-ui, sans-serif";
}

export function hrefFor(raw?: string) {
  const value = raw || "";
  if (!value) return "#";
  if (value.startsWith("mailto:")) return value;
  return value.startsWith("http") ? value : `https://${value.replace(/^https?:\/\//, "")}`;
}

export function isVideoBackground(url?: string) {
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(url || "");
}

export function useDiscordRoleBadges(profile: Profile) {
  const [badges, setBadges] = useState<BadgeItem[]>([]);

  useEffect(() => {
    if (!profile.discord_id) {
      setBadges([]);
      return;
    }
    let alive = true;
    async function loadBadges() {
      try {
        const res = await fetch(`/api/discord/presence/${profile.discord_id}`, { cache: "no-store" });
        const data = await res.json();
        if (!alive) return;
        const roleIds = Array.isArray(data?.member?.roles) ? data.member.roles : Array.isArray(data?.roles) ? data.roles : [];
        setBadges(badgesFromDiscordRoleIds(roleIds.map(String)));
      } catch {
        if (alive) setBadges([]);
      }
    }
    loadBadges();
    return () => {
      alive = false;
    };
  }, [profile.discord_id]);

  return badges;
}

export function collectBadges(profile: Profile, roleBadges: BadgeItem[]) {
  const hiddenBadgeIds = new Set((profile.badges || []).filter((b) => b.enabled === false).map((b) => b.id));
  const customBadges = (profile.badges || []).filter((b) => b.id?.startsWith("custom-") && b.enabled !== false);
  const milestoneBadges = milestoneBadgesForProfile(profile).filter((badge) => !hiddenBadgeIds.has(badge.id));
  const ownedBadgeIds = Array.isArray(profile.owned_badges) ? profile.owned_badges.map(String) : [];
  const purchasedBadges = MARKETPLACE_BADGES.filter((mb) => ownedBadgeIds.includes(mb.id));
  const allBadgesList = [...roleBadges, ...milestoneBadges, ...purchasedBadges, ...customBadges];
  const seenIds = new Set<string>();
  const badges: BadgeItem[] = [];
  for (const b of allBadgesList) {
    if (!b.id || seenIds.has(b.id)) continue;
    if (hiddenBadgeIds.has(b.id)) continue;
    seenIds.add(b.id);
    badges.push(b);
  }
  return badges;
}

export function ProfileBanner({ profile, height }: { profile: Profile; height?: number }) {
  const url = profile.background_url || "";
  const video = isVideoBackground(url);
  const blur = profile.background_effect === "blurred";
  const darken = profile.background_effect === "darken";
  return (
    <div className="profile-banner" style={height ? { height } : undefined}>
      {video ? (
        <video src={url} autoPlay muted loop playsInline preload="auto" style={{ filter: blur ? "blur(6px)" : "none", transform: blur ? "scale(1.08)" : "none" }} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" style={{ filter: blur ? "blur(6px)" : "none", transform: blur ? "scale(1.08)" : "none" }} />
      )}
      {darken && <div style={{ position: "absolute", inset: 0, background: "rgba(9,9,11,0.45)" }} />}
    </div>
  );
}

export function AvatarBlock({ profile, size = 92 }: { profile: Profile; size?: number }) {
  const isImg = /^https?:\/\//.test(profile.avatar_url || "");
  return (
    <div className="profile-avatar-wrap">
      <div className="profile-avatar" style={{ width: size, height: size, fontSize: Math.round(size * 0.42), ...avatarShape(profile.avatar_shape) }}>
        {isImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt="" />
        ) : (
          profile.avatar_url || "👤"
        )}
      </div>
    </div>
  );
}

export function HandleTooltip({ profile, children }: { profile: Profile; children: ReactNode }) {
  const idLabel = profile.public_uid ? `UUID #${profile.public_uid}` : profile.id ? `Account ${profile.id}` : "Account";
  return (
    <span className="handleTipWrap">
      <span className="handleTipText">{children}</span>
      <span className="handleTipBox">{idLabel}</span>
    </span>
  );
}

export function BadgeStrip({ profile, badges, align = "center" }: { profile: Profile; badges: BadgeItem[]; align?: "center" | "left" }) {
  if (badges.length === 0) return null;
  const badgeColor = profile.icon_color || "#f4f4f5";
  return (
    <div className="profile-badges" style={{ justifyContent: align === "center" ? "center" : "flex-start" }}>
      {badges.map((badge) => (
        <span key={badge.id} aria-label={badge.name} className="profile-badge badgeTipWrap">
          <BadgeIcon
            badge={badge}
            monochrome={!!profile.monochrome_icons}
            color={badgeColor}
            glow={false}
            size={18}
          />
          <span className="badgeTipBox">{badge.name}</span>
        </span>
      ))}
    </div>
  );
}

export function NameBlock({
  profile,
  badges,
  align = "center",
}: {
  profile: Profile;
  badges: BadgeItem[];
  align?: "center" | "left";
}) {
  const text = profile.text_color || "#f4f4f5";
  const accent = resolveProfileAccent(profile.accent);
  const animated = profile.animated_title && profile.username_effect !== "none";
  return (
    <div style={{ textAlign: align, display: "flex", flexDirection: "column", alignItems: align === "center" ? "center" : "flex-start" }}>
      <HandleTooltip profile={profile}>
        <h1
          className={animated ? `profile-name nameEffect ${profile.username_effect}` : "profile-name"}
          style={{
            color: text,
            whiteSpace: profile.username_effect === "typewriter" ? "nowrap" : "normal",
            overflow: profile.username_effect === "typewriter" ? "hidden" : "visible",
            display: profile.username_effect === "typewriter" ? "inline-block" : "block",
            borderRight: profile.username_effect === "typewriter" ? `2px solid ${accent}` : "none",
            animation:
              profile.animated_title && profile.username_effect === "sparkle"
                ? "titlePulse 2.4s ease-in-out infinite"
                : profile.animated_title && profile.username_effect === "typewriter"
                  ? "typewriterName 4.8s steps(24,end) infinite, caretBlink .8s step-end infinite"
                  : "none",
          }}
        >
          {profile.display_name || profile.username}
        </h1>
      </HandleTooltip>
      <BadgeStrip profile={profile} badges={badges} align={align} />
      <div className="profile-meta" style={{ justifyContent: align === "center" ? "center" : "flex-start" }}>
        <span className="profile-handle">@{profile.username}</span>
        {profile.pronouns && <span className="profile-chip">{profile.pronouns}</span>}
        {profile.alias && !profile.hide_alias && <span className="profile-chip">alias @{profile.alias}</span>}
      </div>
    </div>
  );
}

export function SkillTags({ profile, align = "center" }: { profile: Profile; align?: "center" | "left" }) {
  const tags = profile.skills || [];
  if (tags.length === 0) return null;
  return (
    <div className="profile-tags" style={{ justifyContent: align === "center" ? "center" : "flex-start" }}>
      {tags.map((tag) => (
        <span key={tag} className="profile-tag">
          {tag}
        </span>
      ))}
    </div>
  );
}

export function LinkIcons({ profile, align = "center" }: { profile: Profile; align?: "center" | "left" }) {
  const accent = resolveProfileAccent(profile.accent);
  const iconColor = profile.monochrome_icons ? profile.link_color || "#f4f4f5" : profile.link_color || accent;
  const links = (profile.links || []).filter((l) => !l.hidden && l.url);
  if (links.length === 0) return null;

  return (
    <div className="profile-links" style={{ justifyContent: align === "center" ? "center" : "flex-start" }}>
      {links.map((l) => {
        const P = PLATFORMS[l.platform] || PLATFORMS.website;
        const customImg = l.platform === "website" && /^https?:\/\//.test(l.image_url || "");
        return (
          <a key={l.id} href={hrefFor(l.url)} target="_blank" rel="noreferrer" aria-label={P.label} title={P.label} className="profile-link">
            {customImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <BrandIcon platform={l.platform} size={20} monochrome={!!profile.monochrome_icons} color={iconColor} />
            )}
          </a>
        );
      })}
    </div>
  );
}

export function StatsRow({ profile, align = "center" }: { profile: Profile; align?: "center" | "left" }) {
  const joined = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "";
  if (profile.hide_views && profile.hide_likes && (profile.hide_join_date || !joined)) return null;
  return (
    <div className="profile-stats" style={{ justifyContent: align === "center" ? "center" : "flex-start" }}>
      {!profile.hide_views && (
        <span className="profile-stat">
          <Eye size={14} /> {(profile.views || 0).toLocaleString()}
        </span>
      )}
      {!profile.hide_likes && (
        <ProfileLikeButton username={profile.username} initialLikes={profile.like_count || 0} accent={resolveProfileAccent(profile.accent)} />
      )}
      {!profile.hide_join_date && joined && <span className="profile-stat">Joined {joined}</span>}
    </div>
  );
}

export function BioBlock({ profile, compact }: { profile: Profile; compact?: boolean }) {
  const text = profile.text_color || "#f4f4f5";
  return (
    <>
      {profile.bio && (
        <p className="profile-bio" style={{ color: text, fontSize: compact ? 14 : 15 }}>
          {profile.bio}
        </p>
      )}
      {profile.location && (
        <p className="profile-location">
          <MapPin size={14} /> {profile.location}
        </p>
      )}
    </>
  );
}

export function ProfileIdentity({
  profile,
  badges,
  align = "center",
  compact,
  hideAvatar,
  avatarSize,
}: {
  profile: Profile;
  badges: BadgeItem[];
  align?: "center" | "left";
  compact?: boolean;
  hideAvatar?: boolean;
  avatarSize?: number;
}) {
  return (
    <>
      {!hideAvatar && <AvatarBlock profile={profile} size={avatarSize || (compact ? 76 : 92)} />}
      <NameBlock profile={profile} badges={badges} align={align} />
      <BioBlock profile={profile} compact={compact} />
      <SkillTags profile={profile} align={align} />
      <LinkIcons profile={profile} align={align} />
      <StatsRow profile={profile} align={align} />
    </>
  );
}
