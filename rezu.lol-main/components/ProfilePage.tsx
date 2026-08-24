"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import ProfileCard from "./ProfileCard";
import ScrollProfile from "./ScrollProfile";
import Effects from "./Effects";
import type { Profile } from "@/lib/constants";

export default function ProfilePage({ profile }: { profile: Profile }) {
  const accent = profile.accent || "#e11d2f";
  const tracks = useMemo(() => {
    const list = Array.isArray(profile.audio_tracks) ? profile.audio_tracks.filter((t) => /^https?:\/\//.test(t.url || "")) : [];
    if (list.length) return list.slice(0, 3);
    return /^https?:\/\//.test(profile.audio_url || "") ? [{ id: 0, url: profile.audio_url, name: "Audio" }] : [];
  }, [profile.audio_tracks, profile.audio_url]);
  const hasAudio = tracks.length > 0;
  const enterText = profile.enter_text ?? "click to enter";
  const [trackIndex, setTrackIndex] = useState(0);
  const [playedTrackIndexes, setPlayedTrackIndexes] = useState<number[]>([]);
  const [entered, setEntered] = useState(!hasAudio && enterText === "");
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(50);
  const [showVolume, setShowVolume] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playbackToken = useRef(0);
  const customCursorUrl = /^https?:\/\//.test(profile.custom_cursor_url || "")
    ? String(profile.custom_cursor_url).replace(/["'\\\n\r]/g, "")
    : "";

  useEffect(() => {
    fetch(`/api/view?username=${encodeURIComponent(profile.username)}`, { method: "POST" }).catch(() => {});
  }, [profile.username]);

  const playTrack = (index: number, restart = false) => {
    const audio = audioRef.current;
    const track = tracks[index];
    if (!audio || !track?.url) return;

    playbackToken.current += 1;
    const token = playbackToken.current;

    audio.volume = volume / 100;
    audio.muted = muted;

    if (audio.src !== track.url) {
      audio.src = track.url;
      audio.load();
    } else if (restart) {
      audio.currentTime = 0;
    }

    const tryPlay = () => {
      if (playbackToken.current !== token) return;
      audio.play().catch(() => {
        // Some browsers need the file to buffer after the first click.
        // Keep the same user-requested track queued and start as soon as it can play.
        const onReady = () => {
          if (playbackToken.current === token) audio.play().catch(() => {});
        };
        audio.addEventListener("canplay", onReady, { once: true });
        audio.addEventListener("loadeddata", onReady, { once: true });
      });
    };

    tryPlay();
  };

  const enter = () => {
    const startIndex = profile.audio_shuffle && tracks.length > 1 ? Math.floor(Math.random() * tracks.length) : 0;
    setTrackIndex(startIndex);
    setPlayedTrackIndexes([startIndex]);
    setEntered(true);
    playTrack(startIndex, true);
  };


  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume / 100;
    audioRef.current.muted = muted;
  }, [volume, muted]);

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !audioRef.current.muted;
    setMuted(audioRef.current.muted);
  };

  const changeVolume = (next: number) => {
    setVolume(next);
    if (audioRef.current) {
      audioRef.current.volume = next / 100;
      audioRef.current.muted = next === 0;
      setMuted(audioRef.current.muted);
    }
  };

  const nextTrack = () => {
    if (!audioRef.current || tracks.length === 0) return;
    let next = (trackIndex + 1) % tracks.length;
    if (profile.audio_shuffle && tracks.length > 1) {
      const remaining = tracks.map((_, i) => i).filter((i) => i !== trackIndex && !playedTrackIndexes.includes(i));
      const pool = remaining.length ? remaining : tracks.map((_, i) => i).filter((i) => i !== trackIndex);
      next = pool[Math.floor(Math.random() * pool.length)] ?? next;
    }
    setTrackIndex(next);
    setPlayedTrackIndexes((prev) => {
      const merged = [...prev, next];
      return merged.length >= tracks.length ? [next] : merged;
    });
    playTrack(next, true);
  };

  return (
    <main style={{ minHeight: "100vh", position: "relative" }}>
      {customCursorUrl && (
        <style>{`html, body, body * { cursor: url("${customCursorUrl}") 0 0, auto !important; }`}</style>
      )}
      {entered && <Effects accent={accent} effect={profile.effect} cursor={profile.cursor_effect} />}

      <div style={{ position: "relative", zIndex: 0, minHeight: "100vh" }}>
        {profile.layout === "scroll" ? (
          <ScrollProfile profile={profile} />
        ) : (
          <ProfileCard profile={profile} />
        )}
      </div>

      {hasAudio && <audio ref={audioRef} src={tracks[trackIndex]?.url} loop={tracks.length === 1} preload="auto" playsInline onCanPlay={() => entered && audioRef.current?.paused && playTrack(trackIndex)} onEnded={nextTrack} />}

      {entered && hasAudio && (
        <div
          onMouseEnter={() => setShowVolume(true)}
          onMouseLeave={() => setShowVolume(false)}
          style={{
            position: "fixed",
            bottom: 18,
            right: 18,
            zIndex: 6,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: showVolume ? "8px 12px" : 0,
            borderRadius: 999,
            border: showVolume ? `1px solid ${accent}66` : "none",
            background: showVolume ? "rgba(15,15,22,0.78)" : "transparent",
            backdropFilter: "blur(8px)",
          }}
        >
          {showVolume && (
            <input
              aria-label="Audio volume"
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => changeVolume(Number(e.target.value))}
              style={{ width: 110, accentColor: accent }}
            />
          )}
          <button
            onClick={toggleMute}
            aria-label={muted ? "Unmute" : "Mute"}
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              border: `1px solid ${accent}66`,
              background: "rgba(15,15,22,0.7)",
              color: "#e8e8ef",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(8px)",
            }}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      )}

      {!entered && (
        <button
          onClick={enter}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10,
            border: "none",
            cursor: "pointer",
            background: "rgba(5,5,7,0.55)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            color: "#e8e8ef",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          <span
            style={{
              fontSize: 22,
              letterSpacing: "0.18em",
              textTransform: "lowercase",
              padding: "14px 26px",
              borderRadius: 14,
              border: `1px solid ${accent}55`,
              boxShadow: `0 0 30px -8px ${accent}`,
              animation: "glow 2.6s ease-in-out infinite",
            }}
          >
            {enterText}
          </span>
        </button>
      )}
    </main>
  );
}
