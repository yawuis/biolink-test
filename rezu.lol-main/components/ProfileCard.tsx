"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Eye, MapPin } from "lucide-react";
import { PLATFORMS } from "./platforms";
import BrandIcon from "./BrandIcon";
import BadgeIcon from "./BadgeIcon";
import { badgesFromDiscordRoleIds, milestoneBadgesForProfile, type BadgeItem, type Profile, MARKETPLACE_BADGES, resolveProfileAccent } from "@/lib/constants";
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


function hrefFor(raw?: string) {
  const value = raw || "";
  if (!value) return "#";
  if (value.startsWith("mailto:")) return value;
  return value.startsWith("http") ? value : `https://${value.replace(/^https?:\/\//, "")}`;
}

function LinkIcons({ profile }: { profile: Profile }) {
  const accent = resolveProfileAccent(profile.accent);
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
  const tags = profile.skills || [];
  if (tags.length === 0) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 16 }}>
      {tags.map((tag) => (
        <span
          key={tag}
          style={{
            fontSize: 12,
            fontWeight: 500,
            padding: "5px 10px",
            borderRadius: 6,
            color: "#a1a1aa",
            background: "#18181b",
            border: "1px solid #27272a",
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

function BadgeStrip({ profile, align = "center" }: { profile: Profile; align?: "center" | "left" }) {
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

  return (
    <div
      style={{
        display: "inline-flex",
        gap: 10,
        alignItems: "center",
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : "flex-start",
        width: "100%",
        marginTop: 14,
        marginBottom: 2,
      }}
    >
      {badges.map((badge) => {
        const isCustom = !!badge.custom || badge.id?.startsWith("custom-");
        return (
          <span
            key={badge.id}
            aria-label={badge.name}
            className="badgeTipWrap"
            style={{
              display: "inline-grid",
              placeItems: "center",
              width: 40,
              height: 40,
              borderRadius: 8,
              background: "#18181b",
              border: "1px solid #27272a",
              color: isCustom ? "inherit" : badgeColor,
              cursor: "help",
              flex: "none",
            }}
          >
            <BadgeIcon
              badge={badge}
              monochrome={profile.monochrome_icons !== false}
              color={badgeColor}
              glow={false}
              size={22}
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
  const hideAll = profile.hide_views && profile.hide_likes && (profile.hide_join_date || !joined);
  if (hideAll) return null;
  return (
    <div style={{ marginTop: 28, borderTop: "1px solid #27272a", paddingTop: 18, display: "flex", justifyContent: "center", gap: 22, color: "#a1a1aa", fontSize: 13, flexWrap: "wrap", width: "100%", fontWeight: 500 }}>
      {!profile.hide_views && <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><Eye size={15} /> {(profile.views || 0).toLocaleString()}</span>}
      {!profile.hide_likes && <ProfileLikeButton username={profile.username} initialLikes={profile.like_count || 0} accent={resolveProfileAccent(profile.accent)} />}
      {!profile.hide_join_date && joined && <span>Joined {joined}</span>}
    </div>
  );
}

function isVideoBackground(url?: string) {
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(url || "");
}

function pageBackground(profile: Profile) {
  const custom = (profile.background_color || "").trim().toLowerCase();
  const accent = resolveProfileAccent(profile.accent).toLowerCase();
  if (custom && /^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(custom)) {
    if (custom !== "#000" && custom !== "#000000" && custom !== "#09090b" && custom !== accent && custom !== "#55acee") {
      return profile.background_color as string;
    }
  }
  return "#09090b";
}

function Background({ profile }: { profile: Profile }) {
  const hasBgMedia = /^https?:\/\//.test(profile.background_url || "");
  const hasBgVideo = hasBgMedia && isVideoBackground(profile.background_url);
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

  if (!hasBgMedia) return null;

  return (
    <>
      {hasBgVideo ? (
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
      )}
      {profile.background_effect !== "none" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: profile.background_effect === "darken"
              ? "rgba(0,0,0,.62)"
              : "rgba(9,9,11,.45)",
          }}
        />
      )}
    </>
  );
}

function AvatarBlock({ profile, size = 112 }: { profile: Profile; size?: number }) {
  const isImg = /^https?:\/\//.test(profile.avatar_url || "");
  return (
    <div
      style={{
        width: size,
        height: size,
        margin: "0 auto 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.round(size * 0.42),
        background: "#09090b",
        border: "1px solid #27272a",
        overflow: "hidden",
        flex: "none",
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
  const text = profile.text_color || "#f4f4f5";
  const accent = resolveProfileAccent(profile.accent);
  const animated = profile.animated_title && profile.username_effect !== "none";
  return (
    <div style={{ textAlign: align, display: "flex", flexDirection: "column", alignItems: align === "center" ? "center" : "flex-start", gap: 0, width: "100%" }}>
      <HandleTooltip profile={profile}>
        <h1
          className={animated ? `nameEffect ${profile.username_effect}` : ""}
          style={{
            fontSize: 30,
            fontWeight: 600,
            margin: 0,
            color: text,
            letterSpacing: "-.03em",
            lineHeight: 1.15,
            textShadow: "none",
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
      <BadgeStrip profile={profile} align={align} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: align === "center" ? "center" : "flex-start", marginTop: 12 }}>
        <span style={{ fontSize: 14, color: "#71717a", fontFamily: "monospace" }}>@{profile.username}</span>
        {profile.pronouns && (
          <span style={{ fontSize: 11, color: "#71717a", border: "1px solid #27272a", background: "#09090b", padding: "2px 7px", borderRadius: 4 }}>
            {profile.pronouns}
          </span>
        )}
        {profile.alias && !profile.hide_alias && (
          <span style={{ fontSize: 11, color: "#71717a", border: "1px solid #27272a", background: "#09090b", padding: "2px 7px", borderRadius: 4 }}>
            alias: @{profile.alias}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ProfileCard({ profile }: { profile: Profile }) {
  const text = profile.text_color || "#f4f4f5";
  const hasBgMedia = /^https?:\/\//.test(profile.background_url || "");
  const opacity = Math.max(0, Math.min(100, profile.profile_opacity ?? 100)) / 100;
  const blur = Math.max(0, Math.min(100, profile.profile_blur ?? 0));
  const useGlass = hasBgMedia && opacity < 1;
  const panel = {
    background: opacity <= 0 ? "transparent" : useGlass ? `rgba(20,20,22,${Math.max(0.82, opacity)})` : "#141416",
    backdropFilter: useGlass && blur > 0 ? `blur(${blur}px)` : "none",
    WebkitBackdropFilter: useGlass && blur > 0 ? `blur(${blur}px)` : "none",
    border: opacity <= 0 ? "1px solid transparent" : "1px solid #27272a",
    boxShadow: "none",
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
        minHeight: "100%",
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isCompact ? 20 : 32,
        borderRadius: "inherit",
        overflow: "auto",
        background: pageBackground(profile),
        fontFamily: fontFamily(profile.font),
      }}
    >
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <Background profile={profile} />
      </div>

      <div style={{ position: "relative", zIndex: 3, width: "100%", maxWidth: isPortfolio || isBanner ? 760 : isCompact ? 380 : isMinimal ? 540 : 460, display: "grid", gap: 14 }}>
        <section
          style={{
            width: "100%",
            padding: isPortfolio || isBanner ? "32px" : isCompact ? "26px 22px 22px" : isMinimal ? "32px 28px" : "40px 36px 28px",
            borderRadius: 8,
            textAlign: isPortfolio || isBanner ? "left" : "center",
            animation: profile.profile_animation === "float" ? "float 7s ease-in-out infinite" : "none",
            ...panel,
          }}
        >
          {isPortfolio || isBanner ? (
            <div style={{ display: "grid", gridTemplateColumns: isBanner ? "minmax(0,1fr) 128px" : "128px minmax(0,1fr)", gap: 24, alignItems: "center" }}>
              {!isBanner && <div><AvatarBlock profile={profile} size={112} /></div>}
              <div>
                <NameBlock profile={profile} align="left" />
                {profile.bio && <p style={{ margin: "16px 0 0", fontSize: 15, lineHeight: 1.55, color: text }}>{profile.bio}</p>}
                {profile.location && (
                  <p style={{ margin: "12px 0 0", fontSize: 13, color: "#71717a", display: "inline-flex", gap: 5, alignItems: "center" }}>
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
              {!isMinimal && (
                <div style={{ marginBottom: 22 }}>
                  <AvatarBlock profile={profile} size={isCompact ? 88 : 112} />
                </div>
              )}
              <NameBlock profile={profile} />
              {profile.bio && <p style={{ margin: "16px 0 0", fontSize: isCompact ? 14 : 15, lineHeight: 1.55, color: text }}>{profile.bio}</p>}
              {profile.location && (
                <p style={{ margin: "12px 0 0", fontSize: 13, color: "#71717a", display: "inline-flex", gap: 5, alignItems: "center" }}>
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
        .handleTipBox { position: absolute; left: 50%; bottom: calc(100% + 8px); transform: translateX(-50%) translateY(4px); opacity: 0; pointer-events: none; white-space: nowrap; padding: 6px 10px; border-radius: 6px; background: #141416; border: 1px solid #27272a; color: #f4f4f5; font-size: 12px; transition: .16s ease; }
        .handleTipWrap:hover .handleTipBox { opacity: 1; transform: translateX(-50%) translateY(0); }
        .badgeTipWrap { position: relative; }
        .badgeTipBox { position: absolute; left: 50%; bottom: calc(100% + 8px); transform: translateX(-50%) translateY(4px); opacity: 0; pointer-events: none; white-space: nowrap; padding: 6px 10px; border-radius: 6px; background: #141416; border: 1px solid #27272a; color: #f4f4f5; font-size: 12px; z-index: 4; transition: .16s ease; }
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
