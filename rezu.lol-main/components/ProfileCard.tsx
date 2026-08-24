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
  const isPortfolio = profile.layout === "portfolio";
  const isCompact = profile.layout === "compact";
  const isMinimal = profile.layout === "minimal";
  const isBanner = profile.layout === "banner";
  const wide = isPortfolio || isBanner;
  const showBanner = hasBg && !isMinimal;
  const modulesOn = hasModules(profile);

  return (
    <div className="profile-page" style={{ fontFamily: fontFamily(profile.font) }}>
      <div
        className="profile-stack"
        style={{ maxWidth: wide ? 760 : isCompact ? 360 : isMinimal ? 480 : 420 }}
      >
        <article
          className={[
            "profile-card",
            showBanner ? "has-banner" : "no-banner",
            isCompact ? "is-compact" : "",
            modulesOn ? "has-modules" : "",
          ].join(" ")}
        >
          {showBanner && <ProfileBanner profile={profile} height={isCompact ? 88 : wide ? 140 : 120} />}

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
