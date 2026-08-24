"use client";

import { useEffect, useState } from "react";
import { Github } from "lucide-react";
import type { Profile } from "@/lib/constants";
import { card } from "./style";

type GH = { login: string; name?: string; avatar_url: string; public_repos: number; followers: number; html_url: string };

export default function GithubCard({ profile }: { profile: Profile }) {
  const accent = profile.accent || "#e11d2f";
  const [gh, setGh] = useState<GH | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!profile.github_user) return;
    let active = true;
    fetch(`https://api.github.com/users/${profile.github_user}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => active && setGh(j))
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [profile.github_user]);

  if (!profile.github_user) {
    return (
      <div style={card(accent)}>
        <span style={{ color: "#8a8a9a", fontSize: 13 }}>Add a GitHub username in the dashboard.</span>
      </div>
    );
  }
  if (!gh) {
    return (
      <div style={card(accent)}>
        <span style={{ color: "#8a8a9a", fontSize: 13 }}>{error ? "GitHub user not found." : "Loading GitHub…"}</span>
      </div>
    );
  }

  return (
    <a href={gh.html_url} target="_blank" rel="noreferrer"
       style={{ ...card(accent), display: "flex", alignItems: "center", gap: 14, textDecoration: "none", color: "#e8e8ef" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={gh.avatar_url} alt="" style={{ width: 52, height: 52, borderRadius: "50%" }} />
      <div style={{ textAlign: "left", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 700, fontSize: 16 }}>
          {gh.name || gh.login} <Github size={15} style={{ color: accent }} />
        </div>
        <div style={{ fontSize: 13, color: "#c5c5d2" }}>
          {gh.public_repos} repos · {gh.followers} followers
        </div>
      </div>
    </a>
  );
}
