"use client";

import { type Profile } from "@/lib/constants";

export default function About({ profile }: { profile: Profile }) {
  return (
    <div className="module-card" style={{ flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
      {profile.bio && (
        <p style={{ fontSize: 15, lineHeight: 1.55, color: profile.text_color || "#f4f4f5", margin: 0 }}>{profile.bio}</p>
      )}
      {profile.skills?.length > 0 && (
        <div className="profile-tags" style={{ justifyContent: "flex-start", marginTop: 0 }}>
          {profile.skills.map((s, i) => (
            <span key={i} className="profile-tag">{s}</span>
          ))}
        </div>
      )}
      {!profile.bio && !profile.skills?.length && (
        <span className="module-sub">No about text yet.</span>
      )}
    </div>
  );
}
