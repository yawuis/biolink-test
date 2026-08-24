"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import ProfileCard from "./ProfileCard";
import ScrollProfile from "./ScrollProfile";
import Effects from "./Effects";
import { DEFAULT_ACCENT, type Profile } from "@/lib/constants";

export default function ProfilePage({ profile }: { profile: Profile }) {
  const accent = profile.accent || DEFAULT_ACCENT;
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
    <main style={{ minHeight: "100vh", position: "relative", background: "#09090b" }}>
      {customCursorUrl && (
        <style>{`html, body, body * { cursor: url("${customCursorUrl}") 0 0, auto !important; }`}</style>
      )}
      {entered && <Effects accent={accent} effect={profile.effect} cursor={profile.cursor_effect} />}

      <div style={{ position: "relative", zIndex: 0, minHeight: "100vh", background: "#09090b" }}>
        {profile.layout === "scroll" ? (
          <ScrollProfile profile={profile} />
        ) : (
          <ProfileCard profile={profile} />
        )}
      </div>

      {hasAudio && <audio ref={audioRef} src={tracks[trackIndex]?.url} loop={tracks.length === 1} preload="auto" playsInline onCanPlay={() => entered && audioRef.current?.paused && playTrack(trackIndex)} onEnded={nextTrack} />}

      {entered && hasAudio && (
        <div
          className="profile-audio"
          onMouseEnter={() => setShowVolume(true)}
          onMouseLeave={() => setShowVolume(false)}
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
          <button onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}>
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      )}

      {!entered && (
        <button className="profile-enter" onClick={enter}>
          <span>{enterText || "click to enter"}</span>
        </button>
      )}
    </main>
  );
}
