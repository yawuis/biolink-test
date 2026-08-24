"use client";

import DiscordCard from "./modules/DiscordCard";
import GithubCard from "./modules/GithubCard";
import SpotifyCard from "./modules/SpotifyCard";
import Clock from "./modules/Clock";
import BrandMark from "./BrandMark";
import {
  AvatarBlock,
  BioBlock,
  collectBadges,
  fontFamily,
  isVideoBackground,
  LinkIcons,
  NameBlock,
  ProfileBanner,
  ProfileIdentity,
  SkillTags,
  StatsRow,
  useDiscordRoleBadges,
} from "./profile-parts";
import { SITE_NAME, type Profile } from "@/lib/constants";

function ModuleCards({ profile }: { profile: Profile }) {
  const modules = profile.modules || [];
  const showDiscord = modules.includes("discord") && (!!profile.discord_enabled || !!profile.discord_id);
  const showGithub = modules.includes("github") && !!profile.github_user;
  const showSpotify = modules.includes("spotify") && !!profile.spotify_url;
  const showClock = modules.includes("clock");
  if (!showDiscord && !showGithub && !showSpotify && !showClock) return null;

  return (
    <div className="profile-modules">
      {showDiscord && <DiscordCard profile={profile} />}
      {showGithub && <GithubCard profile={profile} />}
      {showSpotify && <SpotifyCard profile={profile} />}
      {showClock && <Clock profile={profile} />}
    </div>
  );
}

function hasModules(profile: Profile) {
  const modules = profile.modules || [];
  return (
    (modules.includes("discord") && (!!profile.discord_enabled || !!profile.discord_id)) ||
    (modules.includes("github") && !!profile.github_user) ||
    (modules.includes("spotify") && !!profile.spotify_url) ||
    modules.includes("clock")
  );
}

export default function ProfileCard({ profile }: { profile: Profile }) {
  const roleBadges = useDiscordRoleBadges(profile);
  const badges = collectBadges(profile, roleBadges);
  const hasBg = /^https?:\/\//.test(profile.background_url || "");
  const bgUrl = profile.background_url || "";
  const isVideo = isVideoBackground(bgUrl);
  const blur = profile.background_effect === "blurred";
  const darken = profile.background_effect === "darken";

  const isPortfolio = profile.layout === "portfolio";
  const isCompact = profile.layout === "compact";
  const isMinimal = profile.layout === "minimal";
  const isBanner = profile.layout === "banner";
  const wide = isPortfolio || isBanner;
  const modulesOn = hasModules(profile);

  const opacity = Math.max(0, Math.min(100, profile.profile_opacity ?? 100)) / 100;
  const cardBlur = Math.max(0, Math.min(100, profile.profile_blur ?? 0));
  const cardStyle = hasBg ? {
    background: opacity <= 0 ? "transparent" : `rgba(20, 20, 22, ${opacity})`,
    backdropFilter: cardBlur > 0 ? `blur(${cardBlur}px)` : "none",
    WebkitBackdropFilter: cardBlur > 0 ? `blur(${cardBlur}px)` : "none",
  } : undefined;

  return (
    <div className="profile-page" style={{ fontFamily: fontFamily(profile.font) }}>
      {hasBg && (
        <div className="profile-bg-media">
          {isVideo ? (
            <video src={bgUrl} autoPlay muted loop playsInline preload="auto" style={{ filter: blur ? "blur(6px)" : "none", transform: blur ? "scale(1.08)" : "none" }} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bgUrl} alt="" style={{ filter: blur ? "blur(6px)" : "none", transform: blur ? "scale(1.08)" : "none" }} />
          )}
          {darken && <div className="profile-bg-darken" />}
        </div>
      )}
      <div
        className="profile-stack"
        style={{ maxWidth: wide ? 760 : isCompact ? 360 : isMinimal ? 480 : 420 }}
      >
        <article
          className={[
            "profile-card",
            "no-banner",
            isCompact ? "is-compact" : "",
            modulesOn ? "has-modules" : "",
          ].join(" ")}
          style={cardStyle}
        >

          {wide ? (
            <div className={`profile-split ${isBanner ? "is-banner" : ""}`}>
              {!isBanner && <AvatarBlock profile={profile} size={104} />}
              <div className="profile-body" style={{ textAlign: "left", padding: 0 }}>
                <NameBlock profile={profile} badges={badges} align="left" />
                <BioBlock profile={profile} />
                <SkillTags profile={profile} align="left" />
                <LinkIcons profile={profile} align="left" />
                <StatsRow profile={profile} align="left" />
              </div>
              {isBanner && <AvatarBlock profile={profile} size={104} />}
            </div>
          ) : (
            <div className="profile-body">
              <ProfileIdentity
                profile={profile}
                badges={badges}
                compact={isCompact}
                hideAvatar={isMinimal}
              />
            </div>
          )}

          <ModuleCards profile={profile} />
        </article>

        <a href="/" className="profile-mark">
          {SITE_NAME.includes(".") ? (
            <>
              {SITE_NAME.split(".")[0]}
              <span>.{SITE_NAME.split(".").slice(1).join(".")}</span>
            </>
          ) : (
            <BrandMark />
          )}
        </a>
      </div>
    </div>
  );
}
