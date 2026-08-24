"use client";

import { DEFAULT_ACCENT, type Profile } from "@/lib/constants";

export default function About({ profile }: { profile: Profile }) {
  const accent = profile.accent || DEFAULT_ACCENT;
  return (
    <div style={{ width: "100%", maxWidth: 520, textAlign: "left" }}>
      {profile.bio && (
        <p style={{ fontSize: 15, lineHeight: 1.6, color: "#e2e2ec", margin: "0 0 14px" }}>{profile.bio}</p>
      )}
      {profile.skills?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {profile.skills.map((s, i) => (
            <span
              key={i}
              style={{
                fontSize: 13,
                fontWeight: 500,
                padding: "6px 12px",
                borderRadius: 20,
                background: `${accent}1a`,
                border: `1px solid ${accent}55`,
                color: "#e8e8ef",
              }}
            >
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
