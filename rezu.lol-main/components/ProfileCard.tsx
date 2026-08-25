"use client";

import { useState } from "react";

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

function ModuleCards({
  profile,
  cardStyle,
  onRearrange,
}: {
  profile: Profile;
  cardStyle?: React.CSSProperties;
  onRearrange?: (modules: string[]) => void;
}) {
  const modules = profile.modules || [];
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!onRearrange) return;
    e.dataTransfer.effectAllowed = "move";
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (!onRearrange || draggedIndex === null || draggedIndex === index) return;

    const items = [...modules];
    const draggedItem = items[draggedIndex];
    items.splice(draggedIndex, 1);
    items.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    onRearrange(items);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <>
      {modules.map((m, idx) => {
        const isDraggingThis = draggedIndex === idx;
        const dragProps = onRearrange
          ? {
              draggable: true,
              onDragStart: (e: React.DragEvent) => handleDragStart(e, idx),
              onDragOver: (e: React.DragEvent) => handleDragOver(e, idx),
              onDragEnd: handleDragEnd,
              style: {
                ...cardStyle,
                cursor: "grab",
                opacity: isDraggingThis ? 0.5 : 1,
                border: isDraggingThis ? "1px dashed var(--accent, #a855f7)" : cardStyle?.border,
                transition: "transform 0.15s, opacity 0.15s",
              },
            }
          : {
              style: cardStyle,
            };

        if (m === "discord" && (!!profile.discord_enabled || !!profile.discord_id)) {
          return (
            <article key="discord" className="profile-card no-banner" {...dragProps}>
              <DiscordCard profile={profile} />
            </article>
          );
        }
        if (m === "github" && !!profile.github_user) {
          return (
            <article key="github" className="profile-card no-banner" {...dragProps}>
              <GithubCard profile={profile} />
            </article>
          );
        }
        if (m === "spotify" && !!profile.spotify_url) {
          return (
            <article key="spotify" className="profile-card no-banner" {...dragProps}>
              <SpotifyCard profile={profile} />
            </article>
          );
        }
        if (m === "clock") {
          return (
            <article key="clock" className="profile-card no-banner" {...dragProps}>
              <Clock profile={profile} />
            </article>
          );
        }
        return null;
      })}
    </>
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

export default function ProfileCard({ profile, onRearrange }: { profile: Profile; onRearrange?: (modules: string[]) => void }) {
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
  } : {
    background: "linear-gradient(135deg, rgba(20, 20, 23, 0.6) 0%, rgba(9, 9, 11, 0.75) 100%)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  };

  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const tiltX = -(y / (rect.height / 2)) * 5;
    const tiltY = (x / (rect.width / 2)) * 5;
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const tiltStyle = {
    transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
    transition: tilt.x === 0 && tilt.y === 0 ? "transform 0.5s ease" : "transform 0.08s ease-out",
  };

  return (
    <div className="profile-page" style={{ fontFamily: fontFamily(profile.font) }}>
      {hasBg ? (
        <div className="profile-bg-media">
          {isVideo ? (
            <video src={bgUrl} autoPlay muted loop playsInline preload="auto" style={{ filter: blur ? "blur(6px)" : "none", transform: blur ? "scale(1.08)" : "none" }} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bgUrl} alt="" style={{ filter: blur ? "blur(6px)" : "none", transform: blur ? "scale(1.08)" : "none" }} />
          )}
          {darken && <div className="profile-bg-darken" />}
        </div>
      ) : (
        <div className="default-profile-bg" />
      )}
      <div
        className="profile-stack"
        style={{
          maxWidth: wide ? 760 : isCompact ? 360 : isMinimal ? 480 : 420,
          ...tiltStyle,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <article
          className={[
            "profile-card",
            "no-banner",
            isCompact ? "is-compact" : "",
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
        </article>

        <ModuleCards profile={profile} cardStyle={cardStyle} onRearrange={onRearrange} />

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
