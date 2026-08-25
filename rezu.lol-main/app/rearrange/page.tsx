"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { type Profile, SITE_NAME } from "@/lib/constants";
import ProfileCard from "@/components/ProfileCard";
import { Save, X, Move } from "lucide-react";
import { saveModules } from "@/app/dashboard/actions";

export default function RearrangePage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState<Record<string, { x: number; y: number }>>({});
  const [dragging, setDragging] = useState<string | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const coordStart = useRef({ x: 0, y: 0 });

  const mainCardRef = useRef<HTMLDivElement | null>(null);
  const moduleRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [lines, setLines] = useState<{ id: string; x1: number; y1: number; x2: number; y2: number }[]>([]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (!data) {
        router.push("/dashboard");
        return;
      }

      setProfile(data);

      const parsedCoords: Record<string, { x: number; y: number }> = {};
      const modulesList = data.modules || [];
      modulesList.forEach((m: string) => {
        if (m.includes(":")) {
          const [key, val] = m.split(":");
          const [xStr, yStr] = val.split(",");
          parsedCoords[key] = { x: parseInt(xStr) || 0, y: parseInt(yStr) || 0 };
        } else {
          parsedCoords[m] = { x: 0, y: 0 };
        }
      });
      setCoords(parsedCoords);
      setLoading(false);
    }
    load();
  }, [supabase, router]);

  const updateLines = () => {
    if (!mainCardRef.current) return;
    const mainRect = mainCardRef.current.getBoundingClientRect();
    const mainCenter = {
      x: mainRect.left + mainRect.width / 2 + window.scrollX,
      y: mainRect.top + mainRect.height / 2 + window.scrollY,
    };

    const newLines = Object.keys(coords).map((key) => {
      const el = moduleRefs.current[key];
      if (!el) return null;
      const elRect = el.getBoundingClientRect();
      const elCenter = {
        x: elRect.left + elRect.width / 2 + window.scrollX,
        y: elRect.top + elRect.height / 2 + window.scrollY,
      };

      return {
        id: key,
        x1: mainCenter.x,
        y1: mainCenter.y,
        x2: elCenter.x,
        y2: elCenter.y,
      };
    }).filter(Boolean) as typeof lines;

    setLines(newLines);
  };

  useEffect(() => {
    if (!loading) {
      updateLines();
      window.addEventListener("resize", updateLines);
      return () => window.removeEventListener("resize", updateLines);
    }
  }, [loading, coords]);

  const startDrag = (key: string, e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(key);
    dragStart.current = { x: e.clientX, y: e.clientY };
    coordStart.current = { x: coords[key]?.x || 0, y: coords[key]?.y || 0 };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setCoords((prev) => ({
        ...prev,
        [dragging]: {
          x: coordStart.current.x + dx,
          y: coordStart.current.y + dy,
        },
      }));
    };

    const handleMouseUp = () => {
      setDragging(null);
    };

    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging]);

  const handleSave = async () => {
    if (!profile) return;
    setLoading(true);

    const rawModules = profile.modules || [];
    const updatedModules = rawModules.map((m) => {
      const key = m.includes(":") ? m.split(":")[0] : m;
      const pos = coords[key];
      if (pos && (pos.x !== 0 || pos.y !== 0)) {
        return `${key}:${pos.x},${pos.y}`;
      }
      return key;
    });

    const res = await saveModules(updatedModules);

    if (res.error) {
      alert("Error saving: " + res.error);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  const isModuleVisible = (m: string, p: Profile) => {
    if (m === "discord") return !!p.discord_enabled || !!p.discord_id;
    if (m === "github") return !!p.github_user;
    if (m === "spotify") return !!p.spotify_url;
    if (m === "clock") return true;
    return false;
  };

  if (loading || !profile) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#09090b", color: "#a1a1aa" }}>
        <span>Loading arranger...</span>
      </div>
    );
  }

  const activeModules = (profile.modules || [])
    .map((m) => (m.includes(":") ? m.split(":")[0] : m))
    .filter((m) => isModuleVisible(m, profile));

  return (
    <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden", background: "#09090b" }}>
      <header style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        background: "rgba(9,9,11,0.8)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #1f1f23",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <strong style={{ fontSize: 15, fontWeight: 600, color: "#f4f4f5" }}>Rearrange Profile</strong>
          <span style={{ fontSize: 11, background: "rgba(85,172,238,0.15)", color: "#55acee", padding: "2px 8px", borderRadius: 9999, fontWeight: 600 }}>PREMIUM</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.push("/dashboard")} style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            height: 36,
            padding: "0 14px",
            borderRadius: 8,
            border: "1px solid #1f1f23",
            background: "#0c0c0e",
            color: "#a1a1aa",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "color 0.2s"
          }}>
            <X size={15} /> Cancel
          </button>
          <button onClick={handleSave} style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            height: 36,
            padding: "0 14px",
            borderRadius: 8,
            border: "none",
            background: "#55acee",
            color: "#ffffff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 0.2s"
          }}>
            <Save size={15} /> Save Layout
          </button>
        </div>
      </header>

      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 10 }}>
        {lines.map((line) => (
          <line
            key={line.id}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="#55acee"
            strokeWidth="1.5"
            strokeDasharray="5 5"
            opacity="0.35"
          />
        ))}
      </svg>

      {profile.background_url ? (
        <div style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", zIndex: 1, pointerEvents: "none", overflow: "hidden" }}>
          {profile.background_url.endsWith(".mp4") ? (
            <video src={profile.background_url} autoPlay muted loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover", filter: profile.background_effect === "blurred" ? "blur(6px)" : "none", transform: profile.background_effect === "blurred" ? "scale(1.08)" : "none" }} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.background_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: profile.background_effect === "blurred" ? "blur(6px)" : "none", transform: profile.background_effect === "blurred" ? "scale(1.08)" : "none" }} />
          )}
          {profile.background_effect === "darken" && <div className="profile-bg-darken" />}
        </div>
      ) : (
        <div className="default-profile-bg" style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", zIndex: 1 }} />
      )}

      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "100px 20px 40px",
        boxSizing: "border-box",
        position: "relative",
        zIndex: 2,
      }}>
        {/* Main Details Card (Centered Base) */}
        <div ref={mainCardRef} style={{ zIndex: 20, width: "100%", maxWidth: profile.layout === "portfolio" || profile.layout === "banner" ? 760 : profile.layout === "compact" ? 360 : profile.layout === "minimal" ? 480 : 420 }}>
          <ProfileCard profile={profile} onlyCard={true} />
        </div>

        {/* Floating Modules */}
        {activeModules.map((m) => {
          const pos = coords[m] || { x: 0, y: 0 };
          return (
            <div
              key={m}
              ref={(el) => { moduleRefs.current[m] = el; }}
              style={{
                position: "absolute",
                transform: `translate(${pos.x}px, ${pos.y}px)`,
                zIndex: dragging === m ? 30 : 25,
                transition: dragging === m ? "none" : "transform 0.1s ease-out",
                width: "100%",
                maxWidth: profile.layout === "compact" ? 360 : profile.layout === "minimal" ? 480 : 420,
              }}
            >
              {/* Drag Handle Indicator */}
              <div
                onMouseDown={(e) => startDrag(m, e)}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "rgba(0, 0, 0, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  display: "grid",
                  placeItems: "center",
                  color: "#55acee",
                  zIndex: 40,
                  cursor: "grab",
                }}
              >
                <Move size={14} />
              </div>
              <ProfileCard profile={profile} onlyModule={m} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
