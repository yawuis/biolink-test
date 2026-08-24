"use client";

import { ChevronDown } from "lucide-react";
import About from "./modules/About";
import DiscordCard from "./modules/DiscordCard";
import GithubCard from "./modules/GithubCard";
import SpotifyCard from "./modules/SpotifyCard";
import Clock from "./modules/Clock";
import BrandMark from "./BrandMark";
import {
  collectBadges,
  fontFamily,
  ProfileBanner,
  ProfileIdentity,
  useDiscordRoleBadges,
} from "./profile-parts";
import { MODULE_META, SITE_NAME, type Profile } from "@/lib/constants";

const MODULE_COMPONENTS: Record<string, (p: { profile: Profile }) => JSX.Element> = {
  about: About,
  discord: DiscordCard,
  github: GithubCard,
  spotify: SpotifyCard,
  clock: Clock,
};

export default function ScrollProfile({ profile }: { profile: Profile }) {
  const roleBadges = useDiscordRoleBadges(profile);
  const badges = collectBadges(profile, roleBadges);
  const hasBg = /^https?:\/\//.test(profile.background_url || "");
  const modules = (profile.modules || []).filter((k) => {
    if (!MODULE_COMPONENTS[k]) return false;
    if (k === "discord") return !!profile.discord_enabled || !!profile.discord_id;
    if (k === "github") return !!profile.github_user;
    if (k === "spotify") return !!profile.spotify_url;
    return true;
  });

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        color: profile.text_color || "#f4f4f5",
        fontFamily: fontFamily(profile.font),
        background: "#09090b",
      }}
    >
      <section style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 32, position: "relative" }}>
        <div className="profile-stack" style={{ width: "min(420px,100%)" }}>
          <article className={`profile-card ${hasBg ? "has-banner" : "no-banner"}`}>
            {hasBg && <ProfileBanner profile={profile} />}
            <div className="profile-body">
              <ProfileIdentity profile={profile} badges={badges} />
            </div>
          </article>
        </div>

        {modules.length > 0 && (
          <div style={{ position: "absolute", bottom: 28, display: "flex", flexDirection: "column", alignItems: "center", color: "#71717a", fontSize: 12, gap: 4 }}>
            more below
            <ChevronDown size={16} />
          </div>
        )}
      </section>

      {modules.map((key) => {
        const Comp = MODULE_COMPONENTS[key];
        return (
          <section key={key} style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: "48px 24px" }}>
            <div style={{ width: "min(420px,100%)" }}>
              <h2 style={{ fontSize: 13, fontWeight: 600, margin: "0 0 10px", color: "#a1a1aa", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                {MODULE_META[key]}
              </h2>
              <Comp profile={profile} />
            </div>
          </section>
        );
      })}

      <div style={{ padding: "8px 24px 32px", display: "flex", justifyContent: "center" }}>
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
