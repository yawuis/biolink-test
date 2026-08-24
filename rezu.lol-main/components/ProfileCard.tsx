"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Eye, MapPin } from "lucide-react";
import { PLATFORMS } from "./platforms";
import BrandIcon from "./BrandIcon";
import BadgeIcon from "./BadgeIcon";
import { BACKGROUNDS, badgesFromDiscordRoleIds, milestoneBadgesForProfile, type BadgeItem, type Profile, MARKETPLACE_BADGES, DEFAULT_ACCENT } from "@/lib/constants";
import DiscordCard from "./modules/DiscordCard";
import GithubCard from "./modules/GithubCard";
import SpotifyCard from "./modules/SpotifyCard";
import Clock from "./modules/Clock";
import ProfileLikeButton from "./ProfileLikeButton";

function avatarShape(shape?: string) {
  if (shape === "square") return { borderRadius: 8 };
  if (shape === "rounded") return { borderRadius: 22 };
  if (shape === "hexagon") return { borderRadius: 0, clipPath: "polygon(25% 5%,75% 5%,100% 50%,75% 95%,25% 95%,0 50%)" };
  if (shape === "star") return { borderRadius: 0, clipPath: "polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)" };
  return { borderRadius: "50%" };
}

function fontFamily(font?: string) {
  if (font === "JetBrains Mono") return "monospace";
  if (font) return `${font}, Inter, system-ui, sans-serif`;
  return "Inter, system-ui, sans-serif";
}


function badgeImageTintFilter(hex?: string) {
  const raw = (hex || "#ffffff").replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return "grayscale(1) saturate(0) brightness(2)";
  if (raw.toLowerCase() === "ffffff") return "grayscale(1) saturate(0) brightness(2)";
  if (raw.toLowerCase() === "000000") return "grayscale(1) brightness(0)";

  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  if (max !== min) {
    const d = max - min;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  const brightness = Math.max(0.7, Math.min(1.7, max / 180));
  return `grayscale(1) sepia(1) saturate(6000%) hue-rotate(${Math.round(h)}deg) brightness(${brightness.toFixed(2)})`;
}

function badgeGlyph(badge: BadgeItem, monochrome?: boolean) {
  return monochrome ? (badge.monoIcon || badge.icon || "★") : (badge.icon || "★");
}

function hrefFor(raw?: string) {
  const value = raw || "";
  if (!value) return "#";
  if (value.startsWith("mailto:")) return value;
  return value.startsWith("http") ? value : `https://${value.replace(/^https?:\/\//, "")}`;
}

function LinkIcons({ profile }: { profile: Profile }) {
  const accent = profile.accent || DEFAULT_ACCENT;
  const iconColor = profile.monochrome_icons ? (profile.link_color || "#ffffff") : (profile.link_color || accent);
  const links = (profile.links || []).filter((l) => !l.hidden && l.url);

  if (links.length === 0) return null;

  return (
    <div style={{ display: "flex", gap: 14, marginTop: 18, flexWrap: "wrap", justifyContent: "center" }}>
      {links.map((l) => {
        const P = PLATFORMS[l.platform] || PLATFORMS.website;
        const customImg = l.platform === "website" && /^https?:\/\//.test(l.image_url || "");
        return (
          <a
            key={l.id}
            href={hrefFor(l.url)}
            target="_blank"
            rel="noreferrer"
            aria-label={P.label}
            title={P.label}
            style={{
              width: 28,
              height: 28,
              display: "grid",
              placeItems: "center",
              color: iconColor,
              opacity: 0.95,
              transition: "all .15s",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {customImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", aspectRatio: "1 / 1" }} />
            ) : (
              <BrandIcon platform={l.platform} size={24} monochrome={!!profile.monochrome_icons} color={iconColor} />
            )}
          </a>
        );
      })}
    </div>
  );
}

function SkillTags({ profile }: { profile: Profile }) {
  const accent = profile.accent || DEFAULT_ACCENT;
  const tags = profile.skills || [];
  if (tags.length === 0) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 14 }}>
      {tags.map((tag) => (
        <span
          key={tag}
          style={{
            fontSize: 12,
            fontWeight: 700,
            padding: "6px 10px",
            borderRadius: 999,
            color: profile.text_color || "#fff",
            background: `${accent}20`,
            border: `1px solid ${accent}55`,
          }}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function useDiscordRoleBadges(profile: Profile) {
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
    return () => { alive = false; };
  }, [profile.discord_id]);

  return badges;
}

function BadgeStrip({ profile }: { profile: Profile }) {
  const roleBadges = useDiscordRoleBadges(profile);
  const hiddenBadgeIds = new Set((profile.badges || []).filter((b) => b.enabled === false).map((b) => b.id));
  const customBadges = (profile.badges || []).filter((b) => b.id?.startsWith("custom-") && b.enabled !== false);
  const milestoneBadges = milestoneBadgesForProfile(profile).filter((badge) => !hiddenBadgeIds.has(badge.id));

  // Load purchased marketplace badges
  const ownedBadgeIds = Array.isArray(profile.owned_badges) ? profile.owned_badges.map(String) : [];
  const purchasedBadges = MARKETPLACE_BADGES.filter((mb) => ownedBadgeIds.includes(mb.id));

  // Merge and deduplicate by badge ID
  const allBadgesList = [...roleBadges, ...milestoneBadges, ...purchasedBadges, ...customBadges];
  const seenIds = new Set<string>();
  const badges: BadgeItem[] = [];
  for (const b of allBadgesList) {
    if (!b.id || seenIds.has(b.id)) continue;
    if (hiddenBadgeIds.has(b.id)) continue;
    seenIds.add(b.id);
    badges.push(b);
  }

  if (badges.length === 0) return null;
  const badgeColor = profile.icon_color || "#ffffff";
  const badgeFilter = profile.monochrome_icons ? badgeImageTintFilter(badgeColor) : "none";

  const manyBadges = badges.length > 4;

  return (
    <div
      style={{
        display: "inline-flex",
        gap: 7,
        alignItems: "center",
        flexWrap: "wrap",
        justifyContent: "center",
        flexBasis: manyBadges ? "100%" : "auto",
        width: manyBadges ? "100%" : "auto",
        marginTop: manyBadges ? 6 : 0,
      }}
    >
      {badges.map((badge) => {
        const isCustom = !!badge.custom || badge.id?.startsWith("custom-");
        return (
          <span
            key={badge.id}
            aria-label={badge.name}
            className="badgeTipWrap badgeIconOnly"
            style={{
              display: "inline-grid",
              placeItems: "center",
              width: badge.image_url ? 18 : "auto",
              height: badge.image_url ? 18 : "auto",
              fontSize: 16,
              lineHeight: 1,
              color: isCustom ? "inherit" : badgeColor,
              textShadow: !isCustom && profile.badges_glow !== false ? `0 0 12px ${badgeColor}` : "none",
              cursor: "help",
            }}
          >
            <BadgeIcon
              badge={badge}
              monochrome={profile.monochrome_icons !== false}
              color={badgeColor}
              glow={!isCustom && profile.badges_glow !== false}
              size={18}
            />
            <span className="badgeTipBox">{badge.name}</span>
          </span>
        );
      })}
    </div>
  );
}

function HandleTooltip({ profile, children }: { profile: Profile; children: ReactNode }) {
  const idLabel = profile.public_uid ? `UUID #${profile.public_uid}` : profile.id ? `Account ${profile.id}` : "Account";
  return (
    <span className="handleTipWrap">
      <span className="handleTipText">{children}</span>
      <span className="handleTipBox">{idLabel}</span>
    </span>
  );
}

function ModuleCards({ profile }: { profile: Profile }) {
  const modules = profile.modules || [];
  const showDiscord = modules.includes("discord") && (!!profile.discord_enabled || !!profile.discord_id);
  const showGithub = modules.includes("github") && !!profile.github_user;
  const showSpotify = modules.includes("spotify") && !!profile.spotify_url;
  const showClock = modules.includes("clock");
  if (!showDiscord && !showGithub && !showSpotify && !showClock) return null;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {showDiscord && <DiscordCard profile={profile} />}
      {showGithub && <GithubCard profile={profile} />}
      {showSpotify && <SpotifyCard profile={profile} />}
      {showClock && <Clock profile={profile} />}
    </div>
  );
}

function StatsRow({ profile }: { profile: Profile }) {
  const joined = profile.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";
  return (
    <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 16, color: "#b7b7c6", fontSize: 12, flexWrap: "wrap" }}>
      {!profile.hide_views && <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Eye size={14} /> {(profile.views || 0).toLocaleString()}</span>}
      {!profile.hide_likes && <ProfileLikeButton username={profile.username} initialLikes={profile.like_count || 0} accent={profile.accent || DEFAULT_ACCENT} />}
      {!profile.hide_join_date && joined && <span>Joined {joined}</span>}
    </div>
  );
}

function isVideoBackground(url?: string) {
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(url || "");
}

function Background({ profile }: { profile: Profile }) {
  const accent = profile.accent || DEFAULT_ACCENT;
  const hasBgMedia = /^https?:\/\//.test(profile.background_url || "");
  const hasBgVideo = hasBgMedia && isVideoBackground(profile.background_url);
  const fallbackBg = profile.background_color || (BACKGROUNDS[profile.bg] || BACKGROUNDS.midnight);
  const mediaStyle = {
    position: "absolute" as const,
    inset: -10,
    width: "calc(100% + 20px)",
    height: "calc(100% + 20px)",
    objectFit: "cover" as const,
    objectPosition: "center",
    filter: profile.background_effect === "blurred" ? "blur(4px)" : "none",
    transform: "scale(1.03)",
  };

  return (
    <>
      {hasBgMedia && (
        hasBgVideo ? (
          <video
            src={profile.background_url}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            style={mediaStyle}
          />
        ) : (
          <div
            style={{
              ...mediaStyle,
              backgroundImage: `url(${profile.background_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: hasBgMedia
            ? profile.background_effect === "none"
              ? "transparent"
              : profile.background_effect === "darken"
                ? "rgba(0,0,0,.62)"
                : "linear-gradient(180deg, rgba(0,0,0,.18), rgba(0,0,0,.58))"
            : profile.profile_gradient
              ? `radial-gradient(circle at 50% 20%, ${accent}55, transparent 48%), linear-gradient(180deg, ${profile.background_color || "#050505"}, #000)`
              : fallbackBg,
          animation: profile.effect === "glow" ? "glow 4s ease-in-out infinite" : "none",
        }}
      />
    </>
  );
}

function AvatarBlock({ profile, size = 92 }: { profile: Profile; size?: number }) {
  const isImg = /^https?:\/\//.test(profile.avatar_url || "");
  const accent = profile.accent || DEFAULT_ACCENT;
  return (
    <div
      style={{
        width: size,
        height: size,
        margin: "0 auto 15px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.round(size * 0.45),
        background: "#0d0d13",
        border: `2px solid ${accent}`,
        boxShadow: `0 0 24px ${accent}88`,
        overflow: "hidden",
        ...avatarShape(profile.avatar_shape),
      }}
    >
      {isImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        profile.avatar_url || "👤"
      )}
    </div>
  );
}

function NameBlock({ profile, align = "center" }: { profile: Profile; align?: "center" | "left" }) {
  const text = profile.text_color || "#ffffff";
  const accent = profile.accent || DEFAULT_ACCENT;
  const animated = profile.animated_title && profile.username_effect !== "none";
  return (
    <div style={{ textAlign: align }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: align === "center" ? "center" : "flex-start", gap: 8, flexWrap: "wrap" }}>
        <HandleTooltip profile={profile}>
          <h1
            className={animated ? `nameEffect ${profile.username_effect}` : ""}
            style={{
              fontSize: 28,
              fontWeight: 900,
              margin: 0,
              color: text,
              letterSpacing: "-.03em",
              textShadow: animated ? `0 0 18px ${accent}` : "none",
              whiteSpace: profile.username_effect === "typewriter" ? "nowrap" : "normal",
              overflow: profile.username_effect === "typewriter" ? "hidden" : "visible",
              display: profile.username_effect === "typewriter" ? "inline-block" : "block",
              borderRight: profile.username_effect === "typewriter" ? `2px solid ${accent}` : "none",
              animation: profile.animated_title && profile.username_effect === "sparkle" ? "titlePulse 2.4s ease-in-out infinite" : profile.animated_title && profile.username_effect === "typewriter" ? "typewriterName 4.8s steps(24,end) infinite, caretBlink .8s step-end infinite" : "none",
            }}
          >
            {profile.display_name || profile.username}
          </h1>
        </HandleTooltip>
        <BadgeStrip profile={profile} />
      </div>
      <p style={{ margin: "4px 0 0", fontSize: 13, color: "#d8d8e5" }}>@{profile.username}</p>
      {profile.alias && !profile.hide_alias && <p style={{ margin: "3px 0 0", fontSize: 12, color: "#a9a9b6" }}>alias: @{profile.alias}</p>}
      {profile.pronouns && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#a9a9b6" }}>{profile.pronouns}</p>}
    </div>
  );
}

export default function ProfileCard({ profile }: { profile: Profile }) {
  const accent = profile.accent || DEFAULT_ACCENT;
  const text = profile.text_color || "#ffffff";
  const opacity = Math.max(0, Math.min(100, profile.profile_opacity ?? 70)) / 100;
  const blur = Math.max(0, Math.min(100, profile.profile_blur ?? 22));
  const panel = {
    background: opacity <= 0 ? "transparent" : `rgba(12,12,16,${opacity})`,
    backdropFilter: blur <= 0 ? "none" : `blur(${blur}px)`,
    WebkitBackdropFilter: blur <= 0 ? "none" : `blur(${blur}px)`,
    border: opacity <= 0 ? "1px solid transparent" : `1px solid ${accent}55`,
    boxShadow: opacity <= 0 ? "none" : `0 0 0 1px #ffffff08, 0 22px 70px -28px ${accent}`,
  } as const;

  const isPortfolio = profile.layout === "portfolio";
  const isCompact = profile.layout === "compact";
  const isMinimal = profile.layout === "minimal";
  const isBanner = profile.layout === "banner";

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 28,
        borderRadius: "inherit",
        overflow: "hidden",
        background: profile.background_color || "#050507",
        fontFamily: fontFamily(profile.font),
      }}
    >
      <Background profile={profile} />

      <div style={{ position: "relative", zIndex: 3, width: "100%", maxWidth: isPortfolio || isBanner ? 760 : isCompact ? 360 : isMinimal ? 520 : 430, display: "grid", gap: 12 }}>
        <section
          style={{
            width: "100%",
            padding: isPortfolio || isBanner ? "26px" : isCompact ? "22px 20px 18px" : isMinimal ? "24px" : "30px 26px 22px",
            borderRadius: 20,
            textAlign: isPortfolio || isBanner ? "left" : "center",
            animation: profile.profile_animation === "float" ? "float 7s ease-in-out infinite" : "none",
            ...panel,
          }}
        >
          {isPortfolio || isBanner ? (
            <div style={{ display: "grid", gridTemplateColumns: isBanner ? "minmax(0,1fr) 120px" : "120px minmax(0,1fr)", gap: 22, alignItems: "center" }}>
              {!isBanner && <div><AvatarBlock profile={profile} size={112} /></div>}
              <div>
                <NameBlock profile={profile} align="left" />
                {profile.bio && <p style={{ margin: "12px 0 0", fontSize: 15, lineHeight: 1.5, color: text }}>{profile.bio}</p>}
                {profile.location && (
                  <p style={{ margin: "10px 0 0", fontSize: 13, color: "#cacada", display: "inline-flex", gap: 5, alignItems: "center" }}>
                    <MapPin size={14} /> {profile.location}
                  </p>
                )}
                <SkillTags profile={profile} />
                <LinkIcons profile={profile} />
                <StatsRow profile={profile} />
              </div>
              {isBanner && <div><AvatarBlock profile={profile} size={112} /></div>}
            </div>
          ) : (
            <>
              {!isMinimal && <AvatarBlock profile={profile} size={isCompact ? 76 : 92} />}
              <NameBlock profile={profile} />
              {profile.bio && <p style={{ margin: "12px 0 0", fontSize: isCompact ? 14 : 15, lineHeight: 1.45, color: text }}>{profile.bio}</p>}
              {profile.location && (
                <p style={{ margin: "10px 0 0", fontSize: 13, color: "#cacada", display: "inline-flex", gap: 5, alignItems: "center" }}>
                  <MapPin size={14} /> {profile.location}
                </p>
              )}
              <SkillTags profile={profile} />
              <LinkIcons profile={profile} />
              <StatsRow profile={profile} />
            </>
          )}
        </section>

        <ModuleCards profile={profile} />
      </div>

      <style>{`
        @keyframes titlePulse {
          0%,100% { filter: brightness(1); transform: translateY(0); }
          50% { filter: brightness(1.25); transform: translateY(-1px); }
        }
        .handleTipWrap { position: relative; display: inline-flex; align-items: center; justify-content: center; cursor: default; }
        .handleTipBox { position: absolute; left: 50%; bottom: calc(100% + 8px); transform: translateX(-50%) translateY(4px); opacity: 0; pointer-events: none; white-space: nowrap; padding: 7px 10px; border-radius: 999px; background: rgba(12,12,16,.86); border: 1px solid rgba(255,255,255,.12); box-shadow: 0 16px 40px rgba(0,0,0,.35); color: #fff; font-size: 12px; transition: .16s ease; backdrop-filter: blur(10px); }
        .handleTipWrap:hover .handleTipBox { opacity: 1; transform: translateX(-50%) translateY(0); }
        .badgeTipWrap { position: relative; }
        .badgeTipBox { position: absolute; left: 50%; bottom: calc(100% + 8px); transform: translateX(-50%) translateY(4px); opacity: 0; pointer-events: none; white-space: nowrap; padding: 6px 9px; border-radius: 999px; background: rgba(12,12,16,.9); border: 1px solid rgba(255,255,255,.12); color: #fff; font-size: 11px; transition: .16s ease; box-shadow: 0 12px 32px rgba(0,0,0,.35); }
        .badgeTipWrap:hover .badgeTipBox { opacity: 1; transform: translateX(-50%) translateY(0); }
        @keyframes typewriterName {
          0%, 10% { width: 0; }
          42%, 68% { width: 100%; }
          95%, 100% { width: 0; }
        }
        @keyframes caretBlink { 0%,100% { border-color: transparent; } 50% { border-color: currentColor; } }
        .nameEffect.typewriter { max-width: 100%; vertical-align: bottom; }
        .nameEffect.glow { filter: drop-shadow(0 0 12px currentColor); }
        .nameEffect.sparkle::after { content: "✦"; margin-left: 6px; font-size: .45em; vertical-align: top; }
        @media (max-width: 620px) {
          section > div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; text-align: center; }
        }
      `}</style>
    </div>
  );
}
