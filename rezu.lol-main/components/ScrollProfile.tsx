"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Eye, MapPin } from "lucide-react";
import { PLATFORMS } from "./platforms";
import BrandIcon from "./BrandIcon";
import BadgeIcon from "./BadgeIcon";
import { BACKGROUNDS, MODULE_META, badgesFromDiscordRoleIds, milestoneBadgesForProfile, type BadgeItem, type Profile, DEFAULT_ACCENT } from "@/lib/constants";
import About from "./modules/About";
import DiscordCard from "./modules/DiscordCard";
import GithubCard from "./modules/GithubCard";
import SpotifyCard from "./modules/SpotifyCard";
import Clock from "./modules/Clock";
import ProfileLikeButton from "./ProfileLikeButton";



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

const MODULE_COMPONENTS: Record<string, (p: { profile: Profile }) => JSX.Element> = {
  about: About,
  discord: DiscordCard,
  github: GithubCard,
  spotify: SpotifyCard,
  clock: Clock,
};

function avatarShape(shape?: string) {
  if (shape === "square") return { borderRadius: 8 };
  if (shape === "rounded") return { borderRadius: 22 };
  if (shape === "hexagon") return { borderRadius: 0, clipPath: "polygon(25% 5%,75% 5%,100% 50%,75% 95%,25% 95%,0 50%)" };
  if (shape === "star") return { borderRadius: 0, clipPath: "polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)" };
  return { borderRadius: "50%" };
}

function hrefFor(raw?: string) {
  const value = raw || "";
  if (!value) return "#";
  if (value.startsWith("mailto:")) return value;
  return value.startsWith("http") ? value : `https://${value.replace(/^https?:\/\//, "")}`;
}

function isVideoBackground(url?: string) {
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(url || "");
}

export default function ScrollProfile({ profile }: { profile: Profile }) {
  const accent = profile.accent || DEFAULT_ACCENT;
  const text = profile.text_color || "#ffffff";
  const badgeColor = profile.icon_color || "#ffffff";
  const badgeFilter = profile.monochrome_icons ? badgeImageTintFilter(badgeColor) : "none";
  const linkColor = profile.monochrome_icons ? (profile.link_color || "#ffffff") : (profile.link_color || accent);
  const hasBgMedia = /^https?:\/\//.test(profile.background_url || "");
  const hasBgVideo = hasBgMedia && isVideoBackground(profile.background_url);
  const isImg = /^https?:\/\//.test(profile.avatar_url || "");
  const roleBadges = useDiscordRoleBadges(profile);
  const hiddenBadgeIds = new Set((profile.badges || []).filter((b) => b.enabled === false).map((b) => b.id));
  const customBadges = (profile.badges || []).filter((b) => b.id?.startsWith("custom-") && b.enabled !== false);
  const milestoneBadges = milestoneBadgesForProfile(profile).filter((badge) => !hiddenBadgeIds.has(badge.id));
  const badges = [...roleBadges.filter((badge) => !hiddenBadgeIds.has(badge.id)), ...milestoneBadges, ...customBadges];
  const joined = profile.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";
  const opacity = Math.max(0, Math.min(100, profile.profile_opacity ?? 70)) / 100;
  const blur = Math.max(0, Math.min(100, profile.profile_blur ?? 22));
  const modules = (profile.modules || []).filter((k) => {
    if (!MODULE_COMPONENTS[k]) return false;
    if (k === "discord") return !!profile.discord_enabled || !!profile.discord_id;
    if (k === "github") return !!profile.github_user;
    if (k === "spotify") return !!profile.spotify_url;
    return true;
  });

  return (
    <div style={{ position: "relative", minHeight: "100vh", color: text, fontFamily: profile.font === "JetBrains Mono" ? "monospace" : `${profile.font || "Inter"}, system-ui, sans-serif` }}>
      <div style={{ position: "fixed", inset: 0, zIndex: -1, background: hasBgMedia ? "#050507" : profile.background_color || BACKGROUNDS[profile.bg] || BACKGROUNDS.midnight }}>
        {hasBgMedia && (
          hasBgVideo ? (
            <video
              src={profile.background_url}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              style={{
                position: "absolute",
                inset: -10,
                width: "calc(100% + 20px)",
                height: "calc(100% + 20px)",
                objectFit: "cover",
                objectPosition: "center",
                filter: profile.background_effect === "blurred" ? "blur(4px)" : "none",
                transform: "scale(1.03)",
              }}
            />
          ) : (
            <div
              style={{
                position: "absolute",
                inset: -10,
                backgroundImage: `url(${profile.background_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: profile.background_effect === "blurred" ? "blur(4px)" : "none",
                transform: "scale(1.03)",
              }}
            />
          )
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: hasBgMedia
              ? profile.background_effect === "none"
                ? "transparent"
                : profile.background_effect === "darken"
                  ? "rgba(0,0,0,.66)"
                  : "linear-gradient(180deg, rgba(0,0,0,.24), rgba(0,0,0,.74))"
              : profile.profile_gradient
                ? `radial-gradient(circle at 50% 18%, ${accent}55, transparent 45%), linear-gradient(180deg, ${profile.background_color || "#050505"}, #000)`
                : "linear-gradient(180deg, rgba(5,5,7,0.25), rgba(5,5,7,0.75))",
          }}
        />
      </div>

      <section style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
        <div
          style={{
            width: "min(560px,100%)",
            textAlign: "center",
            padding: "34px 28px",
            borderRadius: 24,
            background: opacity <= 0 ? "transparent" : `rgba(12,12,16,${opacity})`,
            border: opacity <= 0 ? "1px solid transparent" : `1px solid ${accent}55`,
            backdropFilter: blur <= 0 ? "none" : `blur(${blur}px)`,
            WebkitBackdropFilter: blur <= 0 ? "none" : `blur(${blur}px)`,
            boxShadow: opacity <= 0 ? "none" : `0 0 0 1px #ffffff08, 0 24px 80px -34px ${accent}`,
          }}
        >
          <div
            style={{
              width: 118,
              height: 118,
              margin: "0 auto 16px",
              overflow: "hidden",
              display: "grid",
              placeItems: "center",
              fontSize: 52,
              background: "#0d0d13",
              border: `2px solid ${accent}`,
              boxShadow: `0 0 28px ${accent}88`,
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

          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <span className="handleTipWrap">
              <h1
                className={profile.animated_title && profile.username_effect !== "none" ? `nameEffect ${profile.username_effect}` : ""}
                style={{
                  fontSize: 42,
                  fontWeight: 900,
                  margin: 0,
                  letterSpacing: "-.04em",
                  color: text,
                  textShadow: profile.animated_title && profile.username_effect !== "none" ? `0 0 20px ${accent}` : "none",
                  whiteSpace: profile.username_effect === "typewriter" ? "nowrap" : "normal",
                  overflow: profile.username_effect === "typewriter" ? "hidden" : "visible",
                  display: profile.username_effect === "typewriter" ? "inline-block" : "block",
                  borderRight: profile.username_effect === "typewriter" ? `2px solid ${accent}` : "none",
                  animation: profile.animated_title && profile.username_effect === "sparkle" ? "titlePulse 2.4s ease-in-out infinite" : profile.animated_title && profile.username_effect === "typewriter" ? "typewriterName 4.8s steps(24,end) infinite, caretBlink .8s step-end infinite" : "none",
                }}
              >
                {profile.display_name || profile.username}
              </h1>
              <span className="handleTipBox">{profile.public_uid ? `UUID #${profile.public_uid}` : profile.id ? `Account ${profile.id}` : "Account"}</span>
            </span>
            {badges.length > 0 && (
              <div
                style={{
                  display: "inline-flex",
                  gap: 7,
                  alignItems: "center",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  flexBasis: badges.length > 4 ? "100%" : "auto",
                  width: badges.length > 4 ? "100%" : "auto",
                  marginTop: badges.length > 4 ? 6 : 0,
                }}
              >
                {badges.map((badge) => {
                  const isCustom = !!badge.custom || badge.id?.startsWith("custom-");
                  return (
                    <span
                      key={badge.id}
                      className="badgeTipWrap"
                      style={{
                        display: "inline-grid",
                        placeItems: "center",
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
            )}
          </div>

          <p style={{ color: "#d7d7e3", fontSize: 14, margin: "5px 0 0" }}>@{profile.username}</p>
          {profile.alias && !profile.hide_alias && <p style={{ color: "#aaa", fontSize: 12, margin: "3px 0 0" }}>alias: @{profile.alias}</p>}
          {profile.bio && <p style={{ color: text, fontSize: 15, lineHeight: 1.55, margin: "14px auto 0", maxWidth: 460 }}>{profile.bio}</p>}
          {profile.location && (
            <p style={{ margin: "10px 0 0", fontSize: 13, color: "#cacada", display: "inline-flex", gap: 5, alignItems: "center" }}>
              <MapPin size={14} /> {profile.location}
            </p>
          )}

          {(profile.skills || []).length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 14 }}>
              {(profile.skills || []).map((tag) => (
                <span key={tag} style={{ fontSize: 12, fontWeight: 700, padding: "6px 10px", borderRadius: 999, background: `${accent}20`, border: `1px solid ${accent}55`, color: text }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {profile.links?.length > 0 && (
            <div style={{ display: "flex", gap: 16, marginTop: 22, flexWrap: "wrap", justifyContent: "center" }}>
              {profile.links.filter((l) => !l.hidden && l.url).map((l) => {
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
                    style={{ width: 28, height: 28, display: "grid", placeItems: "center", color: linkColor, opacity: 0.95, transition: "all .15s", borderRadius: 8, overflow: "hidden" }}
                  >
                    {customImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", aspectRatio: "1 / 1" }} />
                    ) : (
                      <BrandIcon platform={l.platform} size={24} monochrome={!!profile.monochrome_icons} color={linkColor} />
                    )}
                  </a>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 16, color: "#b7b7c6", fontSize: 12, flexWrap: "wrap" }}>
            {!profile.hide_views && <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Eye size={14} /> {(profile.views || 0).toLocaleString()}</span>}
            {!profile.hide_likes && <ProfileLikeButton username={profile.username} initialLikes={profile.like_count || 0} accent={profile.accent || DEFAULT_ACCENT} />}
            {!profile.hide_join_date && joined && <span>Joined {joined}</span>}
          </div>
        </div>

        {modules.length > 0 && (
          <div style={{ position: "absolute", bottom: 30, display: "flex", flexDirection: "column", alignItems: "center", color: "#9a9aaa", fontSize: 12 }}>
            scroll for more
            <ChevronDown size={18} style={{ animation: "float 2s ease-in-out infinite" }} />
          </div>
        )}
      </section>

      {modules.map((key) => {
        const Comp = MODULE_COMPONENTS[key];
        return (
          <section key={key} style={{ minHeight: "66vh", display: "grid", placeItems: "center", padding: "42px 24px" }}>
            <div style={{ width: "min(560px,100%)" }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 14px", color: text }}>
                {MODULE_META[key]}
              </h2>
              <Comp profile={profile} />
            </div>
          </section>
        );
      })}

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
      `}</style>
    </div>
  );
}
