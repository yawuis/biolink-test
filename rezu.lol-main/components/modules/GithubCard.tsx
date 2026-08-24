"use client";

import { useEffect, useState } from "react";
import { Github } from "lucide-react";
import { type Profile } from "@/lib/constants";

type GH = { login: string; name?: string; avatar_url: string; public_repos: number; followers: number; html_url: string };

export default function GithubCard({ profile }: { profile: Profile }) {
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
      <div className="module-card">
        <span className="module-sub">Add a GitHub username in the dashboard.</span>
      </div>
    );
  }
  if (!gh) {
    return (
      <div className="module-card">
        <span className="module-sub">{error ? "GitHub user not found." : "Loading GitHub…"}</span>
      </div>
    );
  }

  return (
    <a href={gh.html_url} target="_blank" rel="noreferrer" className="module-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={gh.avatar_url} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", border: "1px solid #27272a", flex: "none" }} />
      <div style={{ textAlign: "left", flex: 1, minWidth: 0 }}>
        <div className="module-name" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {gh.name || gh.login} <Github size={14} style={{ color: "#a1a1aa" }} />
        </div>
        <div className="module-sub">
          {gh.public_repos} repos · {gh.followers} followers
        </div>
      </div>
    </a>
  );
}
