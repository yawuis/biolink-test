"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  BadgeCheck,
  BarChart3,
  Brush,
  Check,
  Crown,
  Eye,
  ExternalLink,
  Github,
  Globe,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  LogOut,
  MessageCircle,
  Music,
  Plus,
  Save,
  Search,
  Settings,
  Share2,
  Sparkles,
  Trash2,
  Upload,
  User,
  Wand2,
  X,
} from "lucide-react";
import ProfileCard from "@/components/ProfileCard";
import BrandIcon from "@/components/BrandIcon";
import BadgeIcon from "@/components/BadgeIcon";
import { PLATFORMS } from "@/components/platforms";
import {
  ALL_MODULES,
  AVATAR_SHAPES,
  DEFAULT_PROFILE_EXTRAS,
  DISCORD_INVITE_URL,
  DISCORD_ROLE_BADGES,
  FOUNDING_100_BADGE,
  OWNER_ROLE_ID,
  CUSTOM_BADGE_CREATOR_ROLE_ID,
  badgesFromDiscordRoleIds,
  FONTS,
  MODULE_META,
  SITE_NAME,
  type AudioTrack,
  type BadgeItem,
  type LinkItem,
  type Profile,
  MARKETPLACE_BADGES,
} from "@/lib/constants";
import { resizeCursorPng, uploadFile } from "@/lib/upload";
import { createClient } from "@/lib/supabase/client";
import { getBrowserPublicBaseUrl } from "@/lib/site-url";
import { saveProfile, signOut } from "./actions";

type Tab =
  | "overview"
  | "customize"
  | "links"
  | "layout"
  | "metadata"
  | "settings"
  | "analytics"
  | "badges"
  | "templates";

type TemplateRow = {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  cover_image_url?: string;
  is_public?: boolean;
  tags?: string[];
  data: Partial<Profile>;
  created_at?: string;
};

const NAV: { tab: Tab; label: string; icon: any; desc: string }[] = [
  { tab: "overview", label: "Overview", icon: User, desc: "Quick stats, profile completion, and a live preview." },
  { tab: "customize", label: "Customize", icon: Brush, desc: "Profile details, assets, colors, and integrations." },
  { tab: "links", label: "Links", icon: LinkIcon, desc: "Manage socials and custom URL cards." },
  { tab: "layout", label: "Layout", icon: Wand2, desc: "Choose modules, layout, and profile behavior." },
  { tab: "metadata", label: "Metadata", icon: Eye, desc: "SEO title, description, favicon, and website image." },
  { tab: "settings", label: "Settings", icon: Settings, desc: "Username, alias, and privacy settings." },
  { tab: "analytics", label: "Analytics", icon: BarChart3, desc: "Simple profile performance stats." },
  { tab: "badges", label: "Badges", icon: BadgeCheck, desc: "View Discord role badges and choose glow." },
  { tab: "templates", label: "Templates", icon: Crown, desc: "Save and apply user-created templates." },
];

function normalizeProfile(initial: Profile): Profile {
  const firstAlias = (initial as any).alias || (Array.isArray(initial.aliases) && initial.aliases[0]?.value) || "";
  return {
    ...(DEFAULT_PROFILE_EXTRAS as Profile),
    ...initial,
    alias: firstAlias,
    links: Array.isArray(initial.links) ? initial.links : [],
    audio_tracks: Array.isArray((initial as any).audio_tracks) ? (initial as any).audio_tracks.filter((track: any) => /^https?:\/\//.test(track?.url || "")).slice(0, 3) : (initial.audio_url ? [{ id: 1, url: initial.audio_url, name: "Audio 1" }] : []),
    skills: Array.isArray(initial.skills) ? initial.skills : [],
    modules: Array.isArray(initial.modules) ? initial.modules : ["about", "discord", "github", "spotify", "clock"],
    badges: Array.isArray(initial.badges) ? initial.badges : [],
  };
}

export default function DashboardEditor({ initial, isOwner = false }: { initial: Profile; isOwner?: boolean }) {
  const [p, setP] = useState<Profile>(() => normalizeProfile(initial));
  const [tab, setTab] = useState<Tab>("overview");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const update = (patch: Partial<Profile>) => setP((prev) => ({ ...prev, ...patch }));
  const profileAccent = p.accent || "#e11d2f";
  const publicUrl = typeof window === "undefined" ? `/${p.username}` : `${getBrowserPublicBaseUrl()}/${p.username}`;
  const active = NAV.find((item) => item.tab === tab) || NAV[0];
  const filteredNav = NAV.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));

  const setBadgeColor = (value: string) => {
    if (!p.monochrome_icons) {
      const shouldEnable = window.confirm("Badge color only changes badges when Monochrome icons is on. Turn Monochrome icons on?");
      if (!shouldEnable) return;
      update({ icon_color: value, monochrome_icons: true });
      return;
    }
    update({ icon_color: value });
  };

  const save = async () => {
    setStatus("Saving...");
    const res = await saveProfile(p);
    setStatus(res?.error ? `Error: ${res.error}` : "Saved successfully");
    setTimeout(() => setStatus(""), 2800);
  };

  const onUpload = async (kind: "avatar" | "bg" | "audio" | "spotify" | "meta" | "favicon" | "template" | "cursor" | `link-${number}`, file?: File) => {
    if (!file || !p.id) return "";
    setBusy(kind);
    try {
      const upload = kind === "cursor" ? await resizeCursorPng(file, 32) : file;
      const url = await uploadFile(p.id, kind, upload);
      if (kind === "avatar") update({ avatar_url: url });
      if (kind === "bg") update({ background_url: url });
      if (kind === "audio") update({ audio_url: url });
      if (kind === "spotify") update({ spotify_cover_url: url });
      if (kind === "cursor") update({ custom_cursor_url: url });
      if (kind === "meta") update({ website_image_url: url });
      if (kind === "favicon") update({ favicon_url: url });
      setStatus("Upload complete — save when ready");
      return url;
    } catch (e: any) {
      setStatus(`Upload failed: ${e?.message || "error"}`);
      return "";
    } finally {
      setBusy(null);
      setTimeout(() => setStatus(""), 3000);
    }
  };

  return (
    <div className="dash2">
      <style>{dashCss}</style>

      <aside className="side2">
        <div className="brand2">
          <Sparkles size={20} />
          <span>{SITE_NAME}</span>
        </div>

        <div className="search2">
          <Search size={15} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search pages" />
        </div>

        <nav className="nav2">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.tab} className={`navItem2 ${tab === item.tab ? "active" : ""}`} onClick={() => setTab(item.tab)}>
                <Icon size={17} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebarCard2">
          <div className="sidebarMiniRow">
            <Avatar url={p.avatar_url} shape={p.avatar_shape} />
            <div>
              <strong>{p.display_name || p.username}</strong>
              <small>@{p.username}</small>
            </div>
          </div>
          <a className="ghostBtn" href={`/${p.username}`} target="_blank" rel="noreferrer">
            <ExternalLink size={15} /> Open page
          </a>
          <button className="ghostBtn" onClick={() => navigator.clipboard?.writeText(publicUrl)}>
            <Share2 size={15} /> Copy link
          </button>
          <button className="ghostBtn" onClick={() => signOut()}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      <main className="main2">
        <header className="topbar2">
          <div>
            <h1>{active.label}</h1>
            <p>{active.desc}</p>
          </div>
          <div className="topbarActions2">
            <span className="status2">{status || "Changes stay local until you save."}</span>
            <a className="ghostBtn" href={`/${p.username}`} target="_blank" rel="noreferrer">
              <Eye size={15} /> Preview
            </a>
            <button className="primaryBtn" onClick={save}>
              <Save size={15} /> Save changes
            </button>
          </div>
        </header>

        <div className="mobileTabs2">
          <select value={tab} onChange={(e) => setTab(e.target.value as Tab)}>
            {NAV.map((item) => (
              <option key={item.tab} value={item.tab}>{item.label}</option>
            ))}
          </select>
        </div>

        {tab === "overview" && <Overview p={p} update={update} setTab={setTab} />}
        {tab === "customize" && <Customize p={p} update={update} onUpload={onUpload} busy={busy} />}
        {tab === "links" && <LinksTab p={p} update={update} />}
        {tab === "layout" && <LayoutTab p={p} update={update} />}
        {tab === "metadata" && <MetadataTab p={p} update={update} onUpload={onUpload} busy={busy} />}
        {tab === "settings" && <SettingsTab p={p} update={update} />}
        {tab === "analytics" && <Analytics p={p} />}
        {tab === "badges" && <Badges p={p} update={update} isOwner={isOwner} />}
        {tab === "templates" && <Templates p={p} update={update} onUpload={onUpload} busy={busy} />}
      </main>
    </div>
  );
}

function Overview({ p, update, setTab }: { p: Profile; update: (patch: Partial<Profile>) => void; setTab: (tab: Tab) => void }) {
  const completion = completionItems(p);
  const complete = completion.filter((item) => item.ok).length;
  const percent = Math.round((complete / completion.length) * 100);
  const missing = completion.filter((item) => !item.ok);

  return (
    <div className="stack2">
      <div className="stats4">
        <Metric title="Profile completion" value={`${percent}%`} sub={`${complete}/${completion.length} important items done.`} icon={<Check size={18} />} />
        <Metric title="Views" value={(p.views || 0).toLocaleString()} sub="Protected by one-count-per-viewer tracking." icon={<Eye size={18} />} />
        <Metric title="Links" value={`${(p.links || []).filter((l) => !l.hidden).length}`} sub="Visible social links on your page." icon={<LinkIcon size={18} />} />
        <Metric title="Modules" value={`${(p.modules || []).length}`} sub="Cards shown under your profile." icon={<Sparkles size={18} />} />
      </div>

      <div className="split2 previewSplit2">
        <section className="card2">
          <div className="cardHead2">
            <h2>Profile checklist</h2>
            <p>Cleaner view of what is finished and what is missing.</p>
          </div>
          <div className="completionBar2"><span style={{ width: `${percent}%` }} /></div>
          <div className="checkGrid2">
            {completion.map((item) => (
              <button key={item.key} className={`checkItem2 ${item.ok ? "done" : ""}`} onClick={() => setTab(item.tab)}>
                <span>{item.ok ? <Check size={15} /> : <Plus size={15} />}</span>
                <div>
                  <strong>{item.label}</strong>
                  <small>{item.ok ? "Done" : item.help}</small>
                </div>
              </button>
            ))}
          </div>
          {missing.length > 0 && (
            <div className="missing2">
              <strong>Missing right now</strong>
              <p>{missing.map((item) => item.label).join(", ")}</p>
            </div>
          )}
        </section>

        <section className="card2 previewCard2">
          <div className="cardHead2"><h2>Live preview</h2><p>This updates as you edit.</p></div>
          <div className="previewBox2">
            <ProfileCard profile={p} />
          </div>
        </section>
      </div>

      <section className="card2">
        <div className="cardHead2"><h2>Quick edit</h2><p>Username is locked to Settings so you do not accidentally take or lose a unique name.</p></div>
        <div className="formGrid2">
          <Field label="Display name" value={p.display_name || ""} onChange={(v) => update({ display_name: v })} />
          <Field label="Location" value={p.location || ""} onChange={(v) => update({ location: v })} />
          <Field label="Pronouns" value={p.pronouns || ""} onChange={(v) => update({ pronouns: v })} />
          <ColorField label="Profile accent" help="Only changes profile cards and glow." value={p.accent || "#e11d2f"} onChange={(v) => update({ accent: v })} />
          <Textarea label="Bio" value={p.bio || ""} onChange={(v) => update({ bio: v })} className="span2" />
        </div>
      </section>
    </div>
  );
}


async function handleBackgroundUpload(file: File | undefined, p: Profile, update: (patch: Partial<Profile>) => void, onUpload: any) {
  if (!file) return;
  const url = await onUpload("bg", file);
  if (!url) return;

  const isVideo = /\.(mp4|mov|webm)$/i.test(file.name) || file.type.startsWith("video/");
  if (!isVideo) return;

  const hasAudio = window.confirm("Does this video have audio? Click OK for Yes, Cancel for No. If yes, rezu.lol will also add it to your audio tracks.");
  if (!hasAudio) return;

  const tracks = (p.audio_tracks || []).filter((track) => /^https?:\/\//.test(track.url || "")).slice(0, 3);
  if (tracks.length >= 3) {
    window.alert("Audio was detected, but you already have 3 audio tracks. Remove one first if you want to use this video's audio.");
    return;
  }

  const next: AudioTrack[] = [...tracks, { id: Date.now(), url, name: `${file.name} audio` }].slice(0, 3);
  update({ audio_tracks: next, audio_url: next[0]?.url || url });
}

function Customize({ p, update, onUpload, busy }: { p: Profile; update: (patch: Partial<Profile>) => void; onUpload: any; busy: string | null }) {
  const setBadgeColor = (value: string) => {
    if (!p.monochrome_icons) {
      const shouldEnable = window.confirm("Badge color works with Monochrome icons. Turn Monochrome icons on now?");
      if (!shouldEnable) return;
      update({ icon_color: value, monochrome_icons: true });
      return;
    }
    update({ icon_color: value });
  };

  return (
    <div className="customizeShell2">
      <div className="customizeControls2">
        <section className="gunSection2">
          <div className="gunSectionHead2">
            <div>
              <h2>Assets Uploader</h2>
              <p>Upload the media used across your profile.</p>
            </div>
          </div>
          <div className="gunAssetGrid2">
            <AssetUpload title="Background" url={p.background_url} busy={busy === "bg"} accept="image/*,video/mp4,video/webm,video/quicktime" onPick={(f) => handleBackgroundUpload(f, p, update, onUpload)} onClear={() => update({ background_url: "" })} />
            <AudioManager p={p} update={update} onUpload={onUpload} busy={busy === "audio"} />
            <AssetUpload title="Profile Avatar" url={p.avatar_url} busy={busy === "avatar"} accept="image/*" onPick={(f) => onUpload("avatar", f)} onClear={() => update({ avatar_url: "" })} />
            <AssetUpload title="Spotify Cover" url={p.spotify_cover_url} busy={busy === "spotify"} accept="image/*" onPick={(f) => onUpload("spotify", f)} onClear={() => update({ spotify_cover_url: "" })} />
            <AssetUpload title="Custom Cursor" url={p.custom_cursor_url} busy={busy === "cursor"} accept="image/png,.png" onPick={(f) => onUpload("cursor", f)} onClear={() => update({ custom_cursor_url: "" })} />
            <div className="cursorHelp2"><strong>PNG Cursor</strong><small>Upload any transparent PNG. rezu.lol automatically fits it into a crisp 32×32 cursor.</small></div>
          </div>
        </section>

        <section className="gunSection2">
          <div className="gunSectionHead2">
            <div>
              <h2>General Customization</h2>
              <p>Profile content, live integrations, opacity, blur, and effects.</p>
            </div>
          </div>

          <div className="gunGeneralGrid2">
            <Textarea label="Description" value={p.bio || ""} onChange={(v) => update({ bio: v })} className="span2" />
            <Field label="Display name" value={p.display_name || ""} onChange={(v) => update({ display_name: v })} />
            <Field label="Location" value={p.location || ""} onChange={(v) => update({ location: v })} />

            <div className="discordFlow2 span2 gunDiscord2">
              <div className="gunInlineTitle2">
                <div>
                  <strong>Discord Presence</strong>
                  <small>Show your Discord status and activity on your profile.</small>
                </div>
                <Toggle label="Enabled" checked={!!p.discord_enabled} onChange={(v) => update({ discord_enabled: v, discord_invite_url: DISCORD_INVITE_URL })} />
              </div>
              <div className="discordFlowActions2">
                <div className="lockedInviteMini2">
                  <MessageCircle size={16} />
                  <div><b>Official Discord</b><small>{DISCORD_INVITE_URL}</small></div>
                </div>
                <Link className="primaryBtn soft" href="/dashboard/discord-presence"><MessageCircle size={15} /> Manage Discord</Link>
              </div>
            </div>

            <Range label="Profile Opacity" value={p.profile_opacity ?? 70} min={0} max={100} onChange={(v) => update({ profile_opacity: v })} />
            <Range label="Profile Blur" value={p.profile_blur ?? 22} min={0} max={100} onChange={(v) => update({ profile_blur: v })} />
            <SelectField label="Background Effect" value={p.background_effect || "blurred"} options={["none", "blurred", "darken"]} onChange={(v) => update({ background_effect: v })} />
            <SelectField label="Username Effect" value={p.username_effect || "none"} options={["none", "glow", "sparkle", "typewriter"]} onChange={(v) => update({ username_effect: v })} />
            <SelectField label="Layout" value={p.layout || "classic"} options={["classic", "portfolio", "scroll", "compact", "minimal", "banner"]} onChange={(v) => update({ layout: v })} />
            <SelectField label="Avatar Shape" value={p.avatar_shape || "circle"} options={[...AVATAR_SHAPES]} onChange={(v) => update({ avatar_shape: v })} />
          </div>
        </section>

        <section className="gunSection2">
          <div className="gunSectionHead2">
            <div>
              <h2>Music & Cards</h2>
              <p>Spotify, GitHub, and the text visitors see before entering.</p>
            </div>
          </div>
          <div className="gunGeneralGrid2">
            <Field label="GitHub Username" value={p.github_user || ""} onChange={(v) => update({ github_user: v.replace(/[^a-zA-Z0-9-]/g, "") })} />
            <Field label="Spotify Track Link" value={p.spotify_url || ""} onChange={(v) => update({ spotify_url: v })} />
            <Field label="Spotify Display Title" value={p.spotify_title || ""} onChange={(v) => update({ spotify_title: v })} />
            <Field label="Spotify Description" value={p.spotify_artist || ""} onChange={(v) => update({ spotify_artist: v })} />
            <Field label="Page Enter Text" value={p.enter_text ?? "click to enter"} onChange={(v) => update({ enter_text: v })} className="span2" />
            <p className="helpText2 span2">Leave Page Enter Text blank to skip the enter overlay when no audio is configured.</p>
          </div>
        </section>

        <section className="gunSection2">
          <div className="gunSectionHead2">
            <div>
              <h2>Color Customization</h2>
              <p>Profile-only colors. The dashboard stays red, black, gray, and white.</p>
            </div>
          </div>
          <div className="gunColorGrid2">
            <ColorField label="Accent Color" help="Profile accents and glow." value={p.accent || "#e11d2f"} onChange={(v) => update({ accent: v })} />
            <ColorField label="Text Color" help="Main profile text." value={p.text_color || "#ffffff"} onChange={(v) => update({ text_color: v })} />
            <ColorField label="Background Color" help="Fallback when no background media is set." value={p.background_color || "#000000"} onChange={(v) => update({ background_color: v })} />
            <ColorField label="Badge Color" help="Badge tint and glow when monochrome is enabled." value={p.icon_color || "#ffffff"} onChange={setBadgeColor} />
            <ColorField label="Links Color" help="Social and link icons only." value={p.link_color || "#ffffff"} onChange={(v) => update({ link_color: v })} />
            <ColorField label="Background Effect Color" help="Used by compatible background effects." value={p.background_effect_color || "#ffffff"} onChange={(v) => update({ background_effect_color: v })} />
          </div>

          <div className="gradientBlock2">
            <Toggle label="Profile Gradient" checked={!!p.profile_gradient} onChange={(v) => update({ profile_gradient: v })} />
            {p.profile_gradient && (
              <div className="gradientColors2">
                <ColorField label="Primary Color" value={p.primary_color || "#000000"} onChange={(v) => update({ primary_color: v })} />
                <ColorField label="Secondary Color" value={p.secondary_color || "#ffffff"} onChange={(v) => update({ secondary_color: v })} />
              </div>
            )}
          </div>
        </section>

        <section className="gunSection2">
          <div className="gunSectionHead2">
            <div>
              <h2>Other Customization</h2>
              <p>Small profile behavior and presentation controls.</p>
            </div>
          </div>
          <div className="gunToggleGrid2">
            <Toggle label="Monochrome Icons" checked={!!p.monochrome_icons} onChange={(v) => update({ monochrome_icons: v })} />
            <Toggle label="Animated Title" checked={!!p.animated_title} onChange={(v) => update({ animated_title: v })} />
            <Toggle label="Badge Glow" checked={p.badges_glow !== false} onChange={(v) => update({ badges_glow: v })} />
            <Toggle label="Hide Alias" checked={!!p.hide_alias} onChange={(v) => update({ hide_alias: v })} />
            <SelectField label="Cursor Effect" value={p.cursor_effect || "none"} options={["none", "trail", "dot", "particles"]} onChange={(v) => update({ cursor_effect: v })} />
            <SelectField label="Font" value={p.font || "Inter"} options={[...FONTS]} onChange={(v) => update({ font: v })} />
          </div>
        </section>

        <section className="gunSection2">
          <div className="gunSectionHead2">
            <div>
              <h2>Tags</h2>
              <p>Tags appear across your supported profile layouts.</p>
            </div>
          </div>
          <TagsEditor skills={p.skills || []} onChange={(skills) => update({ skills })} />
        </section>
      </div>

      <aside className="customizePreview2">
        <div className="customizePreviewSticky2">
          <div className="customizePreviewHead2">
            <div>
              <strong>Live Preview</strong>
              <small>Updates instantly as you customize.</small>
            </div>
            <a href={`/${p.username}`} target="_blank" rel="noreferrer"><ExternalLink size={15} /></a>
          </div>
          <div className="customizePreviewViewport2">
            <ProfileCard profile={p} />
          </div>
          <div className="customizePreviewFooter2">
            <span>/{p.username}</span>
            <span>{p.layout || "classic"}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

function LinksTab({ p, update }: { p: Profile; update: (patch: Partial<Profile>) => void }) {
  const links = p.links || [];
  const add = (platform = "website") => update({ links: [...links, { id: Date.now(), platform, url: "", image_url: "" }] });
  const edit = (id: number, patch: Partial<LinkItem>) => update({ links: links.map((item) => (item.id === id ? { ...item, ...patch } : item)) });
  const remove = (id: number) => update({ links: links.filter((item) => item.id !== id) });
  const quickPlatforms = ["discord", "github", "spotify", "instagram", "youtube"];

  return (
    <div className="stack2">
      <section className="card2">
        <div className="cardHead2"><h2>Quick add</h2><p>Add common links with one click.</p></div>
        <div className="quickAdd2">
          {quickPlatforms.map((key) => {
            const item = PLATFORMS[key] || PLATFORMS.website;
            return (
              <button key={key} className="pillBtn2" onClick={() => add(key)}>
                <BrandIcon platform={key} size={17} /> {item.label}
              </button>
            );
          })}
          <button className="pillBtn2" onClick={() => add("website")}><Plus size={16} /> Custom URL</button>
        </div>
      </section>

      <section className="card2">
        <div className="cardHead2"><h2>Link list</h2><p>Custom URL images look best as 1:1 square images, at least 256 × 256.</p></div>
        <div className="rows2">
          {links.length === 0 && <div className="empty2">No links yet. Add one above.</div>}
          {links.map((link) => {
            const platform = PLATFORMS[link.platform] || PLATFORMS.website;
            return (
              <div key={link.id} className="linkRow2">
                <div className="linkMain2">
                  <div className="linkIcon2">
                    {link.image_url ? <img src={link.image_url} alt="" /> : <BrandIcon platform={link.platform} size={19} />}
                  </div>
                  <select value={link.platform} onChange={(e) => edit(link.id, { platform: e.target.value })}>
                    {Object.entries(PLATFORMS).map(([key, value]) => (
                      <option key={key} value={key}>{value.label}</option>
                    ))}
                  </select>
                  <input value={link.url} placeholder={platform.placeholder || "url"} onChange={(e) => edit(link.id, { url: e.target.value })} />
                  {link.platform === "website" && <LinkImageDrop userId={p.id} link={link} onChange={(url) => edit(link.id, { image_url: url })} />}
                </div>
                <div className="linkActions2">
                  <button className={`tinyBtn2 ${link.hidden ? "off" : ""}`} onClick={() => edit(link.id, { hidden: !link.hidden })}>{link.hidden ? "Hidden" : "Visible"}</button>
                  <button className="tinyIconBtn2" onClick={() => remove(link.id)}><Trash2 size={15} /></button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function LayoutTab({ p, update }: { p: Profile; update: (patch: Partial<Profile>) => void }) {
  const modules = p.modules || [];
  const toggleMod = (key: string) => update({ modules: modules.includes(key) ? modules.filter((m) => m !== key) : [...modules, key] });

  return (
    <div className="stack2">
      <div className="split2">
        <section className="card2">
          <div className="cardHead2"><h2>Layout type</h2><p>Classic is centered, portfolio is split/horizontal, and scroll is section-based.</p></div>
          <div className="layoutCards2">
            {["classic", "portfolio", "scroll", "compact", "minimal", "banner"].map((layout) => (
              <button key={layout} className={p.layout === layout ? "selected" : ""} onClick={() => update({ layout })}>
                <strong>{layout}</strong>
                <small>{layout === "classic" ? "Centered card" : layout === "portfolio" ? "Wide split card" : layout === "scroll" ? "Clean stacked sections" : layout === "compact" ? "Small focused card" : layout === "minimal" ? "Text-first clean look" : "Wide banner hero"}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="card2">
          <div className="cardHead2"><h2>Module visibility</h2><p>Local time uses the visitor's local clock, so no timezone setting is needed.</p></div>
          <div className="moduleList2">
            {ALL_MODULES.map((moduleKey) => (
              <button key={moduleKey} className={`moduleBtn2 ${modules.includes(moduleKey) ? "active" : ""}`} onClick={() => toggleMod(moduleKey)}>
                <div>
                  <strong>{MODULE_META[moduleKey]}</strong>
                  <small>{modules.includes(moduleKey) ? "Visible" : "Hidden"}</small>
                </div>
                <span>{modules.includes(moduleKey) ? "On" : "Off"}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetadataTab({ p, update, onUpload, busy }: { p: Profile; update: (patch: Partial<Profile>) => void; onUpload: any; busy: string | null }) {
  return (
    <div className="split2 previewSplit2">
      <section className="card2">
        <div className="cardHead2"><h2>Metadata</h2><p>Users can upload their own favicon, but the default favicon is already set.</p></div>
        <div className="formGrid2">
          <Field label="Website title" value={p.website_title || p.display_name || ""} onChange={(v) => update({ website_title: v })} className="span2" />
          <Textarea label="Website description" value={p.website_description || p.bio || ""} onChange={(v) => update({ website_description: v })} className="span2" />
          <AssetUpload title="Website image" url={p.website_image_url} busy={busy === "meta"} accept="image/*" onPick={(f) => onUpload("meta", f)} onClear={() => update({ website_image_url: "" })} />
          <AssetUpload title="Custom favicon" url={p.favicon_url} busy={busy === "favicon"} accept="image/*" onPick={(f) => onUpload("favicon", f)} onClear={() => update({ favicon_url: "" })} />
          <Toggle label="Add user info overlay" checked={p.add_user_info_overlay !== false} onChange={(v) => update({ add_user_info_overlay: v })} />
          <Toggle label="Allow search indexing" checked={p.search_indexing !== false} onChange={(v) => update({ search_indexing: v })} />
        </div>
      </section>

      <section className="card2">
        <div className="cardHead2"><h2>Preview</h2><p>How the card title and image will feel.</p></div>
        <div className="metaPreview2">
          <strong>{p.website_title || p.display_name || p.username} | {SITE_NAME}</strong>
          <span>/{p.username}</span>
          <div className="metaImage2">
            {p.website_image_url || p.avatar_url ? <img src={p.website_image_url || p.avatar_url} alt="" /> : <Sparkles size={42} />}
          </div>
          <p>{p.website_description || p.bio || "No description yet."}</p>
        </div>
      </section>
    </div>
  );
}

function SettingsTab({ p, update }: { p: Profile; update: (patch: Partial<Profile>) => void }) {
  const [unlockName, setUnlockName] = useState(false);

  return (
    <div className="stack2">
      <div className="split2">
        <section className="card2">
          <div className="cardHead2"><h2>Username</h2><p>Usernames are globally unique. Unlock before changing so it is harder to edit by accident.</p></div>
          {!unlockName ? (
            <div className="lockedBox2">
              <strong>Current username: @{p.username}</strong>
              <p>Only one person can own this username. Changing it can break old links.</p>
              <button className="primaryBtn soft" onClick={() => setUnlockName(true)}><Wand2 size={15} /> Unlock username editing</button>
            </div>
          ) : (
            <div className="formGrid2">
              <Field label="Username" value={p.username} onChange={(v) => update({ username: v.toLowerCase().replace(/[^a-z0-9_]/g, "") })} />
              <button className="ghostBtn" onClick={() => setUnlockName(false)}>Lock again</button>
              <p className="helpText2 span2">Allowed: 1-20 lowercase letters, numbers, or underscore. Save will fail if someone already owns it.</p>
            </div>
          )}
        </section>

        <section className="card2">
          <div className="cardHead2"><h2>Alias</h2><p>One alias per account. Aliases are globally unique too.</p></div>
          <Field label="Alias" value={p.alias || ""} onChange={(v) => update({ alias: v.toLowerCase().replace(/[^a-z0-9_]/g, "") })} />
          <p className="helpText2">Leave blank if you do not want an alias. Save will fail if another user has it.</p>
        </section>
      </div>

      <div className="split2">
        <section className="card2">
          <div className="cardHead2"><h2>Account</h2><p>Core profile identity.</p></div>
          <div className="formGrid2">
            <Field label="Display name" value={p.display_name || ""} onChange={(v) => update({ display_name: v })} />
            <Field label="Email" value="••••••••••••••••" onChange={() => {}} disabled />
          </div>
        </section>

        <section className="card2">
          <div className="cardHead2"><h2>Linked Discord</h2><p>Connect Discord once to unlock presence cards and role badges.</p></div>
          <div className="linkedDiscordBox2">
            <div className="linkedDiscordIcon2"><MessageCircle size={20} /></div>
            <div>
              <strong>{p.discord_id ? `Discord ID linked` : "Discord not linked"}</strong>
              <small>{p.discord_id ? p.discord_id : "Join the official server, then link by signing in with Discord."}</small>
            </div>
            <Link className="primaryBtn soft" href="/dashboard/discord-presence">
              <MessageCircle size={15} /> {p.discord_id ? "Manage Discord" : "Link Discord"}
            </Link>
          </div>
        </section>
      </div>

      <div className="split2">
        <section className="card2">
          <div className="cardHead2"><h2>Privacy</h2><p>Small set of practical toggles.</p></div>
          <div className="toggleStack2">
            <Toggle label="Hide views" checked={!!p.hide_views} onChange={(v) => update({ hide_views: v })} />
            <Toggle label="Hide likes" checked={!!p.hide_likes} onChange={(v) => update({ hide_likes: v })} />
            <Toggle label="Hide join date" checked={!!p.hide_join_date} onChange={(v) => update({ hide_join_date: v })} />
            <Toggle label="Search engine indexing" checked={p.search_indexing !== false} onChange={(v) => update({ search_indexing: v })} />
          </div>
        </section>
      </div>
    </div>
  );
}

function Analytics({ p }: { p: Profile }) {
  const views = p.views || 0;
  const links = (p.links || []).filter((item) => !item.hidden).length;
  const clicks = Math.max(links * 3, Math.round(views * 0.2));
  const data = [
    Math.max(1, Math.round(views * 0.2)),
    Math.max(2, Math.round(views * 0.45)),
    Math.max(3, Math.round(views * 0.7)),
    Math.max(4, Math.round(views || 7)),
  ];
  const max = Math.max(...data, 1);

  return (
    <div className="stack2">
      <div className="stats4">
        <Metric title="Views" value={views.toLocaleString()} sub="Total public profile views." icon={<Eye size={18} />} />
        <Metric title="Link clicks" value={clicks.toLocaleString()} sub="Estimated from visible links." icon={<Activity size={18} />} />
        <Metric title="Click rate" value={`${views ? Math.min(99, Math.round((clicks / Math.max(1, views)) * 100)) : 0}%`} sub="Simple conversion estimate." icon={<BarChart3 size={18} />} />
        <Metric title="Daily average" value={`${Math.max(1, Math.round(views / 14))}`} sub="Average views per day." icon={<Sparkles size={18} />} />
      </div>

      <section className="card2">
        <div className="cardHead2"><h2>Views trend</h2><p>Views are now counted by the protected API route instead of incrementing every refresh.</p></div>
        <div className="miniChart2">
          {data.map((value, index) => (
            <div key={index} className="miniBar2Wrap">
              <div className="miniBar2" style={{ height: `${(value / max) * 100}%` }} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function useDashboardDiscordRoles(profile: Profile) {
  const [roles, setRoles] = useState<string[]>([]);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profile.discord_id) {
      setRoles([]);
      setJoined(false);
      return;
    }
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/discord/presence/${profile.discord_id}`, { cache: "no-store" });
        const data = await res.json();
        if (!alive) return;
        const roleIds = Array.isArray(data?.member?.roles) ? data.member.roles : Array.isArray(data?.roles) ? data.roles : [];
        setRoles(roleIds.map(String));
        setJoined(!!data?.joined || !!data?.ok);
      } catch {
        if (alive) {
          setRoles([]);
          setJoined(false);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [profile.discord_id]);

  return { roles, joined, loading };
}

function Badges({ p, update, isOwner }: { p: Profile; update: (patch: Partial<Profile>) => void; isOwner: boolean }) {
  const { roles, joined, loading } = useDashboardDiscordRoles(p);
  const roleSet = new Set(roles.map(String));
  const roleOwner = roleSet.has(OWNER_ROLE_ID);
  const canUseAll = isOwner || roleOwner;
  const canCreateCustom = canUseAll || roleSet.has(CUSTOM_BADGE_CREATOR_ROLE_ID);
  const earned = badgesFromDiscordRoleIds(roles);
  const earnedIds = new Set(earned.map((badge) => badge.id));
  const savedBadges = p.badges || [];
  const savedMap = new Map(savedBadges.map((badge) => [badge.id, badge.enabled !== false]));
  const customBadges = savedBadges.filter((badge) => badge.id?.startsWith("custom-"));
  const foundingEligible = Number(p.public_uid || 0) > 0 && Number(p.public_uid || 0) < 200;
  const foundingVisible = savedMap.get(FOUNDING_100_BADGE.id) ?? true;
  const ownedBadges = Array.isArray(p.owned_badges) ? p.owned_badges.map(String) : [];

  const updateBadgeList = (nextItems: BadgeItem[]) => {
    const base = new Map((p.badges || []).map((badge) => [badge.id, badge]));
    nextItems.forEach((badge) => base.set(badge.id, badge));
    update({ badges: Array.from(base.values()) });
  };

  const setBadgeVisible = (id: string, visible: boolean) => {
    const current = new Map((p.badges || []).map((badge) => [badge.id, badge]));
    const roleBadge = DISCORD_ROLE_BADGES.find((badge) => badge.id === id);
    const existing = current.get(id);
    current.set(id, {
      id,
      name: existing?.name || roleBadge?.name || "Badge",
      icon: existing?.icon || roleBadge?.icon || "⭐",
      image_url: existing?.image_url || "",
      custom: existing?.custom || id.startsWith("custom-"),
      enabled: visible,
    });
    update({ badges: Array.from(current.values()) });
  };

  const removeCustomBadge = (id: string) => {
    update({ badges: (p.badges || []).filter((badge) => badge.id !== id) });
  };

  return (
    <div className="stack2">
      <section className="card2 badgeHero2">
        <div className="cardHead2">
          <h2>Role badges</h2>
          <p>Badges are unlocked by Discord roles. You can hide badges you earned.</p>
        </div>
        <div className="badgeStatusBar2">
          <span className={joined ? "ok" : "warn"}>{loading ? "Checking Discord..." : joined ? "Discord linked and found in server" : "Join the Discord and link your ID"}</span>
          {canUseAll && <span className="ownerPill2">All role badges unlocked</span>}
          <Toggle label="Badge glow on profile" checked={p.badges_glow !== false} onChange={(v) => update({ badges_glow: v })} />
        </div>
      </section>

      <section className="card2">
        <div className="badgeGrid2 roleBadgeGrid2">
          {DISCORD_ROLE_BADGES.map((badge) => {
            const hasRole = canUseAll || earnedIds.has(badge.id);
            const visible = savedMap.get(badge.id) ?? true;
            return (
              <div key={badge.id} className={`badge2 roleBadge2 ${hasRole ? (visible ? "on" : "off") : "locked"}`}>
                <span className="badgeEmoji2"><BadgeIcon badge={badge} monochrome={false} size={22} /></span>
                <div>
                  <strong>{badge.name}</strong>
                  <small>
                    {!hasRole
                      ? `Requires role ${badge.roleId}`
                      : visible
                        ? (canUseAll && !roleSet.has(badge.roleId) ? "Owner unlocked • showing" : "Unlocked • showing")
                        : "Unlocked • hidden from profile"}
                  </small>
                </div>
                {hasRole ? (
                  <button
                    type="button"
                    className={`badgeToggle2 ${visible ? "enabled" : "disabled"}`}
                    onClick={() => setBadgeVisible(badge.id, !visible)}
                  >
                    {visible ? "Shown" : "Hidden"}
                  </button>
                ) : (
                  <span className="badgeLock2">Locked</span>
                )}
              </div>
            );
          })}
          <div className={`badge2 roleBadge2 ${foundingEligible ? (foundingVisible ? "on" : "off") : "locked"}`}>
            <span className="badgeEmoji2"><BadgeIcon badge={FOUNDING_100_BADGE} monochrome={false} size={22} /></span>
            <div>
              <strong>Founding 100</strong>
              <small>{foundingEligible ? (foundingVisible ? "Legacy founding profile • showing" : "Legacy founding profile • hidden") : "Founding window ended • UID must be below 200"}</small>
            </div>
            {foundingEligible ? (
              <button type="button" className={`badgeToggle2 ${foundingVisible ? "enabled" : "disabled"}`} onClick={() => setBadgeVisible(FOUNDING_100_BADGE.id, !foundingVisible)}>
                {foundingVisible ? "Shown" : "Hidden"}
              </button>
            ) : <span className="badgeLock2">Locked</span>}
          </div>
        </div>
      </section>

      {/* Marketplace Badges Section */}
      <section className="card2">
        <div className="cardHead2">
          <h2>Marketplace badges</h2>
          <p>Unlocks purchased from the Marketplace. Toggle them on or off here.</p>
        </div>
        {ownedBadges.length > 0 ? (
          <div className="badgeGrid2 roleBadgeGrid2">
            {MARKETPLACE_BADGES
              .filter((mb) => ownedBadges.includes(mb.id))
              .map((badge) => {
                const visible = savedMap.get(badge.id) ?? true;
                return (
                  <div key={badge.id} className={`badge2 roleBadge2 ${visible ? "on" : "off"}`}>
                    <span className="badgeEmoji2">{badge.icon}</span>
                    <div>
                      <strong>{badge.name}</strong>
                      <small>{visible ? "Showing on profile" : "Hidden from profile"}</small>
                    </div>
                    <button
                      type="button"
                      className={`badgeToggle2 ${visible ? "enabled" : "disabled"}`}
                      onClick={() => setBadgeVisible(badge.id, !visible)}
                    >
                      {visible ? "Shown" : "Hidden"}
                    </button>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="empty2" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>No premium badges purchased yet.</span>
            <a href="/marketplace" style={{ color: "#e11d2f", textDecoration: "none", fontWeight: 600, fontSize: 13 }}>Visit Marketplace →</a>
          </div>
        )}
      </section>

      <section className="card2">
        <div className="cardHead2">
          <h2>Custom badges</h2>
          <p>{canCreateCustom ? "Create a custom badge with an emoji or image." : "Custom badge creation is locked. Join the Discord and earn the custom badge role."}</p>
        </div>
        {canCreateCustom ? (
          <CustomBadgeCreator p={p} updateBadgeList={updateBadgeList} />
        ) : (
          <div className="empty2">Link a Discord account with the custom badge role to create custom badges.</div>
        )}
        {customBadges.length > 0 && (
          <div className="badgeGrid2 customBadgeGrid2">
            {customBadges.map((badge) => (
              <div key={badge.id} className={`badge2 roleBadge2 ${badge.enabled === false ? "off" : "on"}`}>
                <span className="badgeEmoji2">
                  {badge.image_url ? <img src={badge.image_url} alt="" /> : badge.icon || "⭐"}
                </span>
                <div>
                  <strong>{badge.name || "Custom badge"}</strong>
                  <small>{badge.enabled === false ? "Custom • hidden" : "Custom • showing"}</small>
                </div>
                <button className={`badgeToggle2 ${badge.enabled === false ? "disabled" : "enabled"}`} onClick={() => setBadgeVisible(badge.id, badge.enabled === false)}>
                  {badge.enabled === false ? "Hidden" : "Shown"}
                </button>
                <button className="tinyIconBtn2" onClick={() => removeCustomBadge(badge.id)} title="Delete custom badge"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CustomBadgeCreator({ p, updateBadgeList }: { p: Profile; updateBadgeList: (badges: BadgeItem[]) => void }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("⭐");
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const uploadBadgeImage = async (file?: File) => {
    if (!file || !p.id || !file.type.startsWith("image/")) return;
    setBusy(true);
    try {
      const url = await uploadFile(p.id, `custom-badge-${Date.now()}`, file);
      setImageUrl(url);
    } finally {
      setBusy(false);
    }
  };

  const add = () => {
    const cleanName = name.trim().slice(0, 40);
    if (!cleanName) return;
    updateBadgeList([{
      id: `custom-${Date.now()}`,
      name: cleanName,
      icon: (emoji.trim() || "⭐").slice(0, 16),
      image_url: imageUrl.trim(),
      custom: true,
      enabled: true,
    }]);
    setName("");
    setEmoji("⭐");
    setImageUrl("");
  };

  return (
    <div className="customBadgeCreator2">
      <div className="customBadgePreview2" onClick={() => ref.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); uploadBadgeImage(e.dataTransfer.files?.[0]); }}>
        {busy ? <Loader2 className="spin" /> : imageUrl ? <img src={imageUrl} alt="" /> : <span>{emoji || "⭐"}</span>}
      </div>
      <Field label="Badge name" value={name} onChange={setName} />
      <Field label="Emoji" value={emoji} onChange={setEmoji} />
      <Field label="Image URL (optional)" value={imageUrl} onChange={setImageUrl} />
      <button className="tinyIconBtn2" onClick={() => ref.current?.click()} title="Upload badge image"><Upload size={14} /></button>
      <button className="primaryBtn" onClick={add}><Plus size={15} /> Add badge</button>
      <input ref={ref} type="file" hidden accept="image/*" onChange={(e) => uploadBadgeImage(e.target.files?.[0])} />
    </div>
  );
}

const TEMPLATE_STYLE_KEYS: (keyof Profile)[] = [
  "accent",
  "bg",
  "avatar_shape",
  "background_url",
  "audio_url",
  "audio_tracks",
  "audio_shuffle",
  "profile_opacity",
  "profile_blur",
  "layout",
  "modules",
  "text_color",
  "icon_color",
  "link_color",
  "background_color",
  "profile_gradient",
  "monochrome_icons",
  "animated_title",
  "badges_glow",
  "username_effect",
  "background_effect",
  "cursor_effect",
  "custom_cursor_url",
  "font",
  "enter_text",
];

function templateSnapshot(p: Profile): Partial<Profile> {
  const out: Partial<Profile> = {};
  TEMPLATE_STYLE_KEYS.forEach((key) => {
    const value = p[key];
    if (value !== undefined) (out as any)[key] = value;
  });
  return out;
}

function applyTemplateData(data: Partial<Profile>): Partial<Profile> {
  const out: Partial<Profile> = {};
  TEMPLATE_STYLE_KEYS.forEach((key) => {
    const value = data?.[key];
    if (value !== undefined) (out as any)[key] = value;
  });
  return out;
}

function Templates({ p, update, onUpload, busy }: { p: Profile; update: (patch: Partial<Profile>) => void; onUpload: any; busy: string | null }) {
  const supabase = useMemo(() => createClient(), []);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [status, setStatus] = useState("");

  const load = async () => {
    const { data, error } = await supabase
      .from("profile_templates")
      .select("*")
      .or(p.id ? `is_public.eq.true,user_id.eq.${p.id}` : "is_public.eq.true")
      .order("created_at", { ascending: false });
    if (!error) setTemplates((data || []) as TemplateRow[]);
  };

  useEffect(() => {
    load();
  }, [p.id]);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("template");
    if (!id || templates.length === 0) return;
    const found = templates.find((template) => template.id === id);
    if (found) setStatus(`Template link loaded: ${found.name}`);
  }, [templates]);

  const saveTemplate = async () => {
    if (!p.id || !name.trim()) return;
    setStatus("Saving template...");
    const snapshot = templateSnapshot(p);
    const { error } = await supabase.from("profile_templates").insert({
      user_id: p.id,
      name: name.trim(),
      description: description.trim(),
      cover_image_url: coverUrl,
      is_public: true,
      data: snapshot,
    });
    setStatus(error ? error.message : "Template saved");
    if (!error) {
      setName("");
      setDescription("");
      setCoverUrl("");
      await load();
    }
    setTimeout(() => setStatus(""), 2600);
  };

  const del = async (id: string) => {
    await supabase.from("profile_templates").delete().eq("id", id);
    await load();
  };

  const copyTemplateLink = async (id: string) => {
    const url = `${getBrowserPublicBaseUrl()}/dashboard?template=${id}`;
    await navigator.clipboard?.writeText(url);
    setStatus("Template link copied");
    setTimeout(() => setStatus(""), 1800);
  };

  const uploadCover = async (file?: File) => {
    const url = await onUpload("template", file);
    if (url) setCoverUrl(url);
  };

  return (
    <div className="stack2">
      <section className="card2 templateCreate2">
        <div className="cardHead2"><h2>Create a template</h2><p>Save the current look as a public template. It only saves visuals, audio, layout, and effects — never username, alias, links, or badges.</p></div>
        <div className="templateCreateGrid2">
          <AssetUpload title="Template cover image" url={coverUrl} busy={busy === "template"} accept="image/*" onPick={uploadCover} onClear={() => setCoverUrl("")} />
          <div className="formGrid2">
            <Field label="Template name" value={name} onChange={setName} />
            <Field label="Description" value={description} onChange={setDescription} />
            <button className="primaryBtn span2" onClick={saveTemplate}><Plus size={15} /> Save current style</button>
            <span className="status2 span2">{status}</span>
          </div>
        </div>
      </section>

      <section className="card2">
        <div className="cardHead2"><h2>Template library</h2><p>Universal templates from the community. Apply one, then save your profile.</p></div>
        <div className="templateGrid2">
          {templates.length === 0 && <div className="empty2">No templates yet. Create one above.</div>}
          {templates.map((template) => {
            const isMine = template.user_id === p.id;
            return (
              <article key={template.id} className="templateCard2">
                <div className="templateCover2">
                  {template.cover_image_url ? <img src={template.cover_image_url} alt="" /> : <Sparkles size={34} />}
                </div>
                <div className="templateBody2">
                  <div>
                    <strong>{template.name}</strong>
                    <p>{template.description || "Community style template"}</p>
                  </div>
                  <div className="templateActions2">
                    <button className="primaryBtn soft" onClick={() => update(applyTemplateData(template.data || {}))}>Apply</button>
                    <button className="tinyIconBtn2" title="Copy template link" onClick={() => copyTemplateLink(template.id)}><Share2 size={15} /></button>
                    {isMine && <button className="tinyIconBtn2" title="Delete" onClick={() => del(template.id)}><Trash2 size={15} /></button>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function TagsEditor({ skills, onChange }: { skills: string[]; onChange: (skills: string[]) => void }) {
  const [value, setValue] = useState("");
  const add = () => {
    const next = value.trim();
    if (!next || skills.includes(next)) return;
    onChange([...skills, next].slice(0, 12));
    setValue("");
  };

  return (
    <div className="tagsEditor2">
      <div className="tagInputRow2">
        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Add a tag, e.g. Python" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <button className="primaryBtn" onClick={add}><Plus size={15} /> Add</button>
      </div>
      <div className="tagList2">
        {skills.length === 0 && <span className="helpText2">No tags yet.</span>}
        {skills.map((skill) => (
          <button key={skill} className="tagChip2" onClick={() => onChange(skills.filter((item) => item !== skill))}>
            {skill} <X size={13} />
          </button>
        ))}
      </div>
    </div>
  );
}

function AudioManager({ p, update, onUpload, busy }: { p: Profile; update: (patch: Partial<Profile>) => void; onUpload: any; busy: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const tracks = (p.audio_tracks || []).filter((track) => /^https?:\/\//.test(track.url || "")).slice(0, 3);

  const addTrack = async (file?: File) => {
    if (!file || tracks.length >= 3) return;
    const url = await onUpload("audio", file);
    if (!url) return;
    const next: AudioTrack[] = [...tracks, { id: Date.now(), url, name: file.name }].slice(0, 3);
    update({ audio_tracks: next, audio_url: next[0]?.url || "" });
  };

  const removeTrack = (id: number) => {
    const next = tracks.filter((track) => track.id !== id);
    update({ audio_tracks: next, audio_url: next[0]?.url || "" });
  };

  return (
    <div className="assetCard2 audioCard2">
      <div className="assetTitle2">
        <strong>Audio</strong>
        <small>{tracks.length}/3 songs</small>
      </div>
      <button
        className="assetBox2"
        onClick={() => ref.current?.click()}
        disabled={tracks.length >= 3}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addTrack(e.dataTransfer.files?.[0]);
        }}
      >
        {busy ? <Loader2 className="spin" /> : tracks.length ? <><Music size={22} /><span>{tracks.length} song{tracks.length === 1 ? "" : "s"} added</span><small>Drop another audio file</small></> : <><Upload size={18} /><span>Drop/upload audio</span><small>MP3, WAV, M4A, MP4/MOV — max 3</small></>}
      </button>
      <input ref={ref} type="file" hidden accept="audio/*,video/mp4,video/webm,video/quicktime" onChange={(e) => addTrack(e.target.files?.[0])} />
      <div className="audioList2">
        {tracks.map((track, index) => (
          <div key={track.id} className="audioTrack2">
            <span>{index + 1}</span>
            <p>{track.name || `Song ${index + 1}`}</p>
            <button className="tinyIconBtn2" onClick={() => removeTrack(track.id)}><X size={14} /></button>
          </div>
        ))}
      </div>
      <Toggle label="Shuffle songs on profile" checked={!!p.audio_shuffle} onChange={(v) => update({ audio_shuffle: v })} />
    </div>
  );
}

function LinkImageDrop({ userId, link, onChange }: { userId?: string; link: LinkItem; onChange: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const upload = async (file?: File) => {
    if (!file || !userId) return;
    if (!file.type.startsWith("image/")) return;
    setBusy(true);
    try {
      const url = await uploadFile(userId, `link-${link.id}`, file);
      onChange(url);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="linkImageDrop2 spanLink2"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        upload(e.dataTransfer.files?.[0]);
      }}
      onPaste={(e) => {
        const file = (Array.from(e.clipboardData.files || []) as File[]).find((item) => item.type.startsWith("image/"));
        if (file) upload(file);
      }}
    >
      <div className="linkImagePreview2" onClick={() => ref.current?.click()}>
        {busy ? <Loader2 className="spin" /> : link.image_url ? <img src={link.image_url} alt="" /> : <ImageIcon size={16} />}
      </div>
      <input value={link.image_url || ""} placeholder="Custom URL image — paste URL, drop image, or click box" onChange={(e) => onChange(e.target.value)} />
      <button className="tinyIconBtn2" onClick={() => ref.current?.click()}><Upload size={14} /></button>
      {link.image_url && <button className="tinyIconBtn2" onClick={() => onChange("")}><X size={14} /></button>}
      <input ref={ref} type="file" hidden accept="image/*" onChange={(e) => upload(e.target.files?.[0])} />
    </div>
  );
}

function Metric({ title, value, sub, icon }: { title: string; value: string; sub: string; icon: ReactNode }) {
  return (
    <section className="metric2">
      <div className="metricIcon2">{icon}</div>
      <strong>{value}</strong>
      <b>{title}</b>
      <span>{sub}</span>
    </section>
  );
}

function Avatar({ url, shape }: { url?: string; shape?: string }) {
  const is = /^https?:\/\//.test(url || "");
  return <div className={`avatar2 ${shape || "circle"}`}>{is ? <img src={url} alt="" /> : "👤"}</div>;
}

function Field({ label, value, onChange, disabled, className }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean; className?: string }) {
  return (
    <div className={className}>
      <label>{label}</label>
      <input disabled={disabled} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Textarea({ label, value, onChange, className }: { label: string; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <div className={className}>
      <label>{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="selectWrap2">
      <label>{label}</label>
      <button type="button" className={open ? "selectButton2 open" : "selectButton2"} onClick={() => setOpen((next) => !next)}>
        <span>{value || "Default"}</span>
        <i />
      </button>
      {open && (
        <div className="selectMenu2">
          {options.map((option) => (
            <button
              type="button"
              key={option}
              className={option === value ? "selected" : ""}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
            >
              {option || "Default"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ColorField({ label, value, onChange, help }: { label: string; value: string; onChange: (v: string) => void; help?: string }) {
  return (
    <div className="colorField2">
      <label>{label}</label>
      <div className="colorRow2">
        <input className="colorInput2" type="color" value={value} onChange={(e) => onChange(e.target.value)} />
        <input value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
      {help && <small>{help}</small>}
    </div>
  );
}

function Range({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label>{label} <small>{value}</small></label>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle2">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <i />
    </label>
  );
}

function isVideoUrl(url?: string) {
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(url || "");
}

function AssetUpload({ title, url, busy, accept, onPick, onClear }: { title: string; url?: string; busy: boolean; accept: string; onPick: (f?: File) => void; onClear: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const hasUrl = /^https?:\/\//.test(url || "");
  const video = hasUrl && isVideoUrl(url);
  const image = hasUrl && !video && !accept.startsWith("audio");

  return (
    <div className="assetCard2">
      <div className="assetTitle2">
        <strong>{title}</strong>
        {url && <button className="tinyIconBtn2" onClick={onClear}><X size={14} /></button>}
      </div>
      <button className="assetBox2" onClick={() => ref.current?.click()}>
        {video ? (
          <video src={url} muted loop playsInline preload="metadata" />
        ) : image ? (
          <img src={url} alt="" />
        ) : busy ? (
          <Loader2 className="spin" />
        ) : (
          <><Upload size={18} /><span>{url ? "Replace file" : "Upload file"}</span></>
        )}
      </button>
      <input ref={ref} type="file" hidden accept={accept} onChange={(e) => onPick(e.target.files?.[0])} />
      {title === "Background" && <p className="helpText2" style={{ margin: "8px 0 0" }}>Supports images, MP4, WebM, and MOV backgrounds. If a video has audio, choose Yes in the prompt to add it to your audio tracks too.</p>}
    </div>
  );
}

function completionItems(p: Profile) {
  return [
    { key: "avatar", label: "Avatar", help: "Upload a profile picture.", ok: !!p.avatar_url, tab: "customize" as Tab },
    { key: "bio", label: "Bio", help: "Add a short description.", ok: !!p.bio, tab: "overview" as Tab },
    { key: "links", label: "Links", help: "Add at least one visible link.", ok: (p.links || []).some((l) => !l.hidden && l.url), tab: "links" as Tab },
    { key: "discord", label: "Discord flow", help: "Enable Discord join/presence flow.", ok: !!p.discord_enabled || !!p.discord_id, tab: "customize" as Tab },
    { key: "github", label: "GitHub card", help: "Add a GitHub username.", ok: !!p.github_user, tab: "customize" as Tab },
    { key: "spotify", label: "Spotify card", help: "Paste a Spotify track link.", ok: !!p.spotify_url, tab: "customize" as Tab },
    { key: "tags", label: "Tags", help: "Add at least one tag.", ok: (p.skills || []).length > 0, tab: "customize" as Tab },
  ];
}

const dashCss = `
:root{--site-accent:#e11d2f;--site-accent-soft:rgba(225,29,47,.14)}
.dash2{min-height:100vh;background:#050505;color:#fff;display:grid;grid-template-columns:240px minmax(0,1fr);font-family:Inter,system-ui,sans-serif}
.side2{position:sticky;top:0;height:100vh;padding:20px 14px;border-right:1px solid #181818;background:#090909;display:flex;flex-direction:column;gap:16px}
.brand2{display:flex;align-items:center;gap:10px;font-size:28px;font-weight:900}.brand2 svg{color:var(--site-accent)}
.search2{display:flex;align-items:center;gap:10px;height:42px;border-radius:14px;border:1px solid #1d1d1d;background:#111;padding:0 12px;color:#8f8f94}.search2 input{background:transparent;border:0;outline:0;color:#fff;width:100%}
.nav2{display:grid;gap:8px;overflow:auto;padding-right:4px}.navItem2{height:42px;border:1px solid transparent;background:transparent;color:#cfcfd3;border-radius:12px;display:flex;align-items:center;gap:10px;padding:0 12px;cursor:pointer;text-align:left;font-weight:650}.navItem2:hover{background:#121212;border-color:#1f1f1f}.navItem2.active{background:var(--site-accent-soft);border-color:rgba(225,29,47,.42);color:#fff}
.sidebarCard2{margin-top:auto;background:#101010;border:1px solid #1d1d1d;border-radius:16px;padding:12px;display:grid;gap:10px}.sidebarMiniRow{display:flex;align-items:center;gap:10px}.sidebarMiniRow strong,.sidebarMiniRow small{display:block}.sidebarMiniRow small{color:#9b9ba1}
.main2{padding:26px;min-width:0}.topbar2{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:20px;position:sticky;top:0;background:rgba(5,5,5,.94);backdrop-filter:blur(10px);padding-bottom:14px;z-index:5}.topbar2 h1{font-size:28px;line-height:1.1;margin:0 0 6px;font-weight:900}.topbar2 p{margin:0;color:#9d9da3}.topbarActions2{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}.status2{color:#a5a5ac;font-size:14px}
.stack2{display:grid;gap:18px}.split2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.previewSplit2{align-items:start}.card2{background:#101010;border:1px solid #1f1f1f;border-radius:18px;padding:18px;min-width:0}.cardHead2{margin-bottom:16px}.cardHead2 h2{margin:0 0 6px;font-size:19px}.cardHead2 p{margin:0;color:#9e9ea4}
.stats4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.metric2{position:relative;background:#111;border:1px solid #1f1f1f;border-radius:16px;padding:16px;min-height:124px}.metricIcon2{position:absolute;right:14px;top:14px;color:var(--site-accent)}.metric2 strong{display:block;font-size:28px;margin:12px 0 6px}.metric2 b{display:block;font-size:15px}.metric2 span{display:block;color:#9e9ea4;margin-top:8px;line-height:1.4}
.previewBox2{height:620px;border-radius:16px;overflow:hidden;border:1px solid #1f1f1f;background:#070707}.formGrid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.formGrid2 .span2{grid-column:span 2}
label{display:block;font-size:13px;font-weight:700;margin:0 0 8px;color:#d8d8dc}input,textarea,select{width:100%;min-height:44px;border-radius:12px;border:1px solid #242424;background:#080808;color:#fff;padding:0 12px;outline:0;font:inherit}textarea{min-height:100px;padding:12px;resize:vertical}input:focus,textarea:focus,select:focus{border-color:rgba(225,29,47,.55);box-shadow:0 0 0 1px rgba(225,29,47,.2)}input[type=range]{padding:0;accent-color:var(--site-accent);background:transparent;border:0;box-shadow:none;min-height:28px}select{appearance:none}.helpText2{color:#9e9ea4;margin:0;font-size:13px;line-height:1.5}
.colorRow2{display:flex;gap:10px;align-items:center}.colorInput2{width:52px;min-width:52px;padding:0;border-radius:12px;overflow:hidden}.colorField2 small{display:block;color:#8e8e94;margin-top:6px;line-height:1.4}
.assetGrid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.cursorHelp2{min-height:142px;border:1px solid #202020;border-radius:14px;background:#0a0a0a;padding:16px;display:flex;flex-direction:column;justify-content:center;gap:7px}.cursorHelp2 strong{font-size:15px}.cursorHelp2 small{color:#97979e;line-height:1.5}.assetCard2{background:#0b0b0b;border:1px solid #1f1f1f;border-radius:14px;padding:12px}.assetTitle2{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px}.assetBox2{width:100%;height:142px;border:1px dashed #2b2b2b;border-radius:12px;background:#070707;color:#b4b4b9;display:grid;place-items:center;gap:8px;overflow:hidden;cursor:pointer}.assetBox2 img,.assetBox2 video{width:100%;height:100%;object-fit:cover}
.pillBtn2,.ghostBtn,.primaryBtn,.tinyBtn2,.tinyIconBtn2{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:12px;font:inherit;font-weight:700;cursor:pointer;text-decoration:none}.pillBtn2{height:40px;padding:0 14px;border:1px solid #232323;background:#131313;color:#fff}.ghostBtn{height:40px;padding:0 14px;border:1px solid #272727;background:#151515;color:#fff}.primaryBtn{height:42px;padding:0 16px;border:1px solid transparent;background:var(--site-accent);color:#fff}.primaryBtn.soft{background:var(--site-accent-soft);color:#fff;border-color:rgba(225,29,47,.42)}.tinyBtn2{height:36px;padding:0 12px;border:1px solid #2b2b2b;background:#151515;color:#fff}.tinyBtn2.off{opacity:.6}.tinyIconBtn2{width:36px;height:36px;border:1px solid #2b2b2b;background:#151515;color:#fff;flex:none}
.completionBar2{height:12px;border-radius:999px;background:#1a1a1a;border:1px solid #2a2a2a;overflow:hidden;margin-bottom:14px}.completionBar2 span{display:block;height:100%;background:linear-gradient(90deg,#e11d2f,#fff)}.checkGrid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.checkItem2{text-align:left;display:flex;gap:10px;align-items:center;padding:12px;border-radius:14px;border:1px solid #252525;background:#0b0b0b;color:#fff;cursor:pointer}.checkItem2.done{border-color:rgba(41,180,88,.35);background:rgba(41,180,88,.07)}.checkItem2 span{width:26px;height:26px;display:grid;place-items:center;border-radius:50%;background:#1a1a1a}.checkItem2 strong,.checkItem2 small{display:block}.checkItem2 small{color:#9e9ea4}.missing2{margin-top:14px;padding:13px;border:1px solid rgba(225,29,47,.35);background:rgba(225,29,47,.08);border-radius:14px}.missing2 p{margin:6px 0 0;color:#d6d6dc}
.quickAdd2,.tagList2{display:flex;flex-wrap:wrap;gap:10px}.rows2{display:grid;gap:12px}.linkRow2,.hostRow2,.templateRow2,.aliasRow2{display:flex;align-items:center;gap:10px}.linkRow2{justify-content:space-between;padding:12px;border-radius:14px;background:#0b0b0b;border:1px solid #1f1f1f}.linkMain2{display:grid;grid-template-columns:40px 170px minmax(0,1fr);gap:10px;align-items:center;flex:1;min-width:0}.linkMain2 .spanLink2{grid-column:2 / span 2}.linkIcon2{width:40px;height:40px;border-radius:10px;background:#141414;border:1px solid #232323;display:grid;place-items:center;color:#cfcfd3;overflow:hidden}.linkIcon2 img{width:100%;height:100%;object-fit:cover;aspect-ratio:1/1}.linkActions2{display:flex;gap:8px;align-items:center}
.empty2{min-height:120px;border-radius:14px;border:1px dashed #2a2a2a;background:#0a0a0a;display:grid;place-items:center;color:#9e9ea4;text-align:center;padding:16px}.moduleList2{display:grid;gap:10px}.moduleBtn2{display:flex;justify-content:space-between;align-items:center;text-align:left;padding:14px;border-radius:14px;border:1px solid #1f1f1f;background:#0b0b0b;color:#fff;cursor:pointer}.moduleBtn2.active{border-color:rgba(225,29,47,.45);background:rgba(225,29,47,.1)}.moduleBtn2 small{display:block;color:#9b9ba1;margin-top:3px}.layoutCards2{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.layoutCards2 button{min-height:92px;border-radius:14px;border:1px solid #242424;background:#0b0b0b;color:#fff;text-align:left;padding:14px;cursor:pointer}.layoutCards2 button.selected{border-color:rgba(225,29,47,.55);background:rgba(225,29,47,.1)}.layoutCards2 small{display:block;color:#9e9ea4;margin-top:6px}
.metaPreview2{display:grid;gap:10px;padding:14px;border-radius:14px;background:#0b0b0b;border:1px solid #1f1f1f}.metaPreview2 strong{font-size:22px}.metaPreview2 span,.metaPreview2 p{color:#a6a6ad}.metaImage2{height:260px;border-radius:12px;background:#050505;border:1px solid #1a1a1a;display:grid;place-items:center;overflow:hidden}.metaImage2 img{width:100%;height:100%;object-fit:cover}.toggleStack2{display:grid;gap:6px}.toggle2{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0}.toggle2 span{font-weight:700}.toggle2 input{display:none}.toggle2 i{width:48px;height:28px;background:#1e1e1e;border:1px solid #333;border-radius:999px;position:relative;flex:none}.toggle2 i:before{content:"";position:absolute;left:4px;top:3px;width:20px;height:20px;border-radius:50%;background:#8a8a90;transition:.16s}.toggle2 input:checked+i{background:var(--site-accent);border-color:var(--site-accent)}.toggle2 input:checked+i:before{left:23px;background:#fff}
.miniChart2{height:240px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px;align-items:end}.miniBar2Wrap{height:100%;display:flex;align-items:flex-end}.miniBar2{width:100%;border-radius:12px 12px 4px 4px;background:linear-gradient(180deg,var(--site-accent),rgba(225,29,47,.2));min-height:18px}
.badgeGrid2{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:14px}.badge2{display:flex;align-items:center;gap:12px;padding:14px;border-radius:14px;border:1px solid #1f1f1f;background:#0b0b0b;color:#fff;cursor:pointer;text-align:left}.badge2.on{border-color:rgba(225,29,47,.45);background:rgba(225,29,47,.1)}.badge2.locked{opacity:.6;cursor:not-allowed}.badge2 small{display:block;color:#9b9ba1}
.templateList2{display:grid;gap:12px}.templateRow2{justify-content:space-between;padding:12px;border-radius:14px;border:1px solid #1f1f1f;background:#0b0b0b}.templateThumb2{width:58px;height:58px;border-radius:14px;background:radial-gradient(circle,#272727,#070707);display:grid;place-items:center;color:#fff;flex:none}.templateRow2 p{margin:4px 0 0;color:#9c9ca3}.hostTop2{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.hostList2{display:grid;gap:12px}.hostRow2{padding:12px;border-radius:14px;border:1px solid #1f1f1f;background:#0b0b0b}.hostRow2 img{width:84px;height:60px;border-radius:10px;object-fit:cover;flex:none}.hostRow2 strong,.hostRow2 small{display:block}.hostRow2 small{color:#9b9ba1}
.tagsEditor2{display:grid;gap:12px}.tagInputRow2{display:flex;gap:10px}.tagChip2{height:34px;border-radius:999px;border:1px solid rgba(225,29,47,.45);background:rgba(225,29,47,.12);color:#fff;display:inline-flex;align-items:center;gap:7px;padding:0 12px;cursor:pointer}.lockedBox2{padding:14px;border-radius:14px;border:1px solid #252525;background:#0b0b0b}.lockedBox2 p{color:#9e9ea4}

select{background:#0b0b0b linear-gradient(45deg,transparent 50%,#9f9fa8 50%),linear-gradient(135deg,#9f9fa8 50%,transparent 50%);background-position:calc(100% - 18px) 18px,calc(100% - 13px) 18px;background-size:5px 5px,5px 5px;background-repeat:no-repeat;padding-right:42px;border-color:#2a2a2a;box-shadow:inset 0 1px 0 rgba(255,255,255,.03)}select option{background:#0b0b0b;color:#fff}.linkedDiscordBox2{display:grid;grid-template-columns:42px minmax(0,1fr) auto;align-items:center;gap:12px;border:1px solid #242424;background:#0b0b0b;border-radius:16px;padding:14px}.linkedDiscordBox2 strong,.linkedDiscordBox2 small{display:block}.linkedDiscordBox2 small{color:#9e9ea4;margin-top:3px;word-break:break-all}.linkedDiscordIcon2{width:42px;height:42px;border-radius:14px;background:rgba(225,29,47,.12);border:1px solid rgba(225,29,47,.35);display:grid;place-items:center;color:var(--site-accent)}.audioCard2{grid-column:auto}.audioCard2 .assetBox2 small{display:block;color:#85858d;font-size:12px}.audioList2{display:grid;gap:8px;margin-top:10px}.audioTrack2{display:grid;grid-template-columns:24px minmax(0,1fr) 36px;align-items:center;gap:8px;background:#090909;border:1px solid #202020;border-radius:12px;padding:7px}.audioTrack2 span{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:rgba(225,29,47,.14);color:#fff;font-size:12px;font-weight:800}.audioTrack2 p{margin:0;color:#ddd;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:13px}.discordFlow2{border:1px solid #242424;background:#0b0b0b;border-radius:16px;padding:16px;display:grid;gap:12px}.discordFlow2 strong,.discordFlow2 small{display:block}.discordFlow2 small{color:#9e9ea4;margin-top:5px;line-height:1.4}.lockedInviteMini2{display:flex;align-items:center;gap:11px;border:1px solid #26262b;background:linear-gradient(180deg,#121216,#09090b);border-radius:14px;padding:12px;color:#fff}.lockedInviteMini2 svg{color:var(--site-accent);flex:none}.lockedInviteMini2 b,.lockedInviteMini2 small{display:block}.lockedInviteMini2 small{font-size:12px;color:#aaa;word-break:break-all}.discordFlowActions2{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center}.linkImageDrop2{display:grid;grid-template-columns:40px minmax(0,1fr) 36px 36px;gap:10px;align-items:center;border:1px dashed #2a2a2a;background:#090909;border-radius:12px;padding:8px}.linkImagePreview2{width:40px;height:40px;border-radius:10px;background:#141414;border:1px solid #242424;display:grid;place-items:center;overflow:hidden;color:#aaa;cursor:pointer}.linkImagePreview2 img{width:100%;height:100%;object-fit:cover;aspect-ratio:1/1}

.selectWrap2{position:relative}.selectButton2{width:100%;min-height:48px;border-radius:16px;border:1px solid #2a2a2f;background:linear-gradient(180deg,#141416,#080809);color:#fff;padding:0 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;font:inherit;font-weight:850;cursor:pointer;box-shadow:0 1px 0 rgba(255,255,255,.04) inset,0 12px 28px rgba(0,0,0,.18)}.selectButton2:hover,.selectButton2.open{border-color:rgba(225,29,47,.65);box-shadow:0 0 0 3px rgba(225,29,47,.12),0 1px 0 rgba(255,255,255,.05) inset}.selectButton2 span{text-transform:capitalize}.selectButton2 i{width:20px;height:20px;border-radius:999px;background:#1c1c20;position:relative;flex:none}.selectButton2 i:after{content:"";position:absolute;left:7px;top:6px;width:6px;height:6px;border-right:2px solid #bdbdc5;border-bottom:2px solid #bdbdc5;transform:rotate(45deg);transition:.16s}.selectButton2.open i:after{top:8px;transform:rotate(225deg)}.selectMenu2{position:absolute;left:0;right:0;top:calc(100% + 8px);z-index:80;padding:7px;border-radius:18px;border:1px solid #2d2d33;background:rgba(10,10,12,.96);box-shadow:0 22px 70px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.03) inset;backdrop-filter:blur(18px);display:grid;gap:5px;overflow:hidden}.selectMenu2 button{min-height:40px;border:0;border-radius:12px;background:transparent;color:#d8d8de;text-align:left;padding:0 12px;font:inherit;font-weight:750;cursor:pointer;text-transform:capitalize}.selectMenu2 button:hover{background:#17171b;color:#fff}.selectMenu2 button.selected{background:rgba(225,29,47,.18);color:#fff;box-shadow:inset 3px 0 #e11d2f}


.badgeHero2{background:linear-gradient(180deg,#111,#0b0b0b)}.badgeStatusBar2{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:12px;align-items:center}.badgeStatusBar2>span{border-radius:999px;padding:9px 12px;font-weight:800;font-size:13px;border:1px solid #262626}.badgeStatusBar2 .ok{background:rgba(35,180,86,.1);border-color:rgba(35,180,86,.35);color:#8af0a7}.badgeStatusBar2 .warn{background:rgba(225,29,47,.1);border-color:rgba(225,29,47,.35);color:#ff9aa5}.ownerPill2{background:rgba(255,198,64,.1)!important;border-color:rgba(255,198,64,.35)!important;color:#ffd56b!important}.roleBadgeGrid2{margin-top:0}.roleBadge2{cursor:default;display:grid!important;grid-template-columns:auto minmax(0,1fr) auto;align-items:center}.roleBadge2.locked{opacity:.52}.roleBadge2.off{border-color:#242424;background:#0a0a0a;opacity:.82}.roleBadge2 .badgeEmoji2{font-size:24px;line-height:1;filter:none;background:transparent!important;border:0!important}.roleBadge2 strong{font-size:16px}.roleBadge2 small{line-height:1.35}.badgeToggle2,.badgeLock2{height:34px;border-radius:999px;padding:0 12px;font-size:12px;font-weight:900;border:1px solid #303030;background:#151515;color:#d9d9df;display:inline-flex;align-items:center;justify-content:center}.badgeToggle2{cursor:pointer}.badgeToggle2.enabled{border-color:rgba(35,180,86,.4);background:rgba(35,180,86,.1);color:#9bf6b4}.badgeToggle2.disabled{border-color:rgba(225,29,47,.35);background:rgba(225,29,47,.08);color:#ffadb6}.badgeLock2{opacity:.7}.templateCreateGrid2{display:grid;grid-template-columns:320px minmax(0,1fr);gap:18px;align-items:start}.templateGrid2{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}.templateCard2{background:#0b0b0b;border:1px solid #202020;border-radius:18px;overflow:hidden;min-width:0}.templateCover2{aspect-ratio:16/9;background:radial-gradient(circle at 50% 45%,#262626,#070707);display:grid;place-items:center;color:#fff;overflow:hidden}.templateCover2 img{width:100%;height:100%;object-fit:cover}.templateBody2{padding:14px;display:grid;gap:14px}.templateBody2 strong{display:block;font-size:17px}.templateBody2 p{color:#aaa;margin:4px 0 0;font-size:13px;line-height:1.35}.templateActions2{display:flex;gap:8px;align-items:center}.templateActions2 .primaryBtn{flex:1}.templateCreate2 .assetBox2{aspect-ratio:16/9;height:auto;min-height:176px}

.customBadgeCreator2{display:grid;grid-template-columns:72px minmax(0,1fr) 110px minmax(0,1fr) 42px auto;gap:12px;align-items:end;margin-bottom:16px}.customBadgePreview2{width:72px;height:72px;border-radius:18px;border:1px dashed #2e2e34;background:#09090a;display:grid;place-items:center;cursor:pointer;overflow:hidden;font-size:28px}.customBadgePreview2 img,.badgeEmoji2 img{width:100%;height:100%;object-fit:cover}.roleBadge2 .badgeEmoji2{width:28px;height:28px;display:grid;place-items:center;overflow:hidden;border-radius:8px}.customBadgeGrid2{margin-top:14px}.customBadgeGrid2 .roleBadge2{grid-template-columns:28px minmax(0,1fr) auto auto}
.customizeShell2{display:grid;grid-template-columns:minmax(0,1fr) 390px;gap:22px;align-items:start}.customizeControls2{display:grid;gap:22px;min-width:0}.gunSection2{background:#101010;border:1px solid #202020;border-radius:18px;padding:20px;box-shadow:0 18px 50px rgba(0,0,0,.16)}.gunSectionHead2{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:18px}.gunSectionHead2 h2{margin:0 0 5px;font-size:22px;letter-spacing:-.02em}.gunSectionHead2 p{margin:0;color:#93939a;font-size:14px}.gunAssetGrid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.gunAssetGrid2 .assetCard2{padding:0;background:transparent;border:0}.gunAssetGrid2 .assetTitle2{margin-bottom:9px}.gunAssetGrid2 .assetBox2{height:170px;border-style:solid;background:#090909;border-color:#252525}.gunAssetGrid2 .audioCard2{background:transparent!important;border:0!important;padding:0!important}.gunGeneralGrid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.gunGeneralGrid2 .span2{grid-column:span 2}.gunColorGrid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.gunColorGrid2 .colorField2{padding:13px;border:1px solid #1f1f1f;border-radius:14px;background:#0a0a0a}.gunColorGrid2 .colorRow2 input:not(.colorInput2){background:#070707}.gradientBlock2{margin-top:16px;border-top:1px solid #202020;padding-top:12px}.gradientColors2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:10px}.gunToggleGrid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 22px}.gunToggleGrid2>.selectWrap2,.gunToggleGrid2>div{min-width:0}.gunDiscord2{background:#0a0a0a;border-radius:15px}.gunInlineTitle2{display:flex;align-items:center;justify-content:space-between;gap:16px}.gunInlineTitle2>.toggle2{min-width:150px}.customizePreview2{min-width:0}.customizePreviewSticky2{position:sticky;top:92px;background:#101010;border:1px solid #222;border-radius:20px;padding:14px;box-shadow:0 24px 80px rgba(0,0,0,.34)}.customizePreviewHead2{display:flex;justify-content:space-between;align-items:center;padding:4px 3px 12px}.customizePreviewHead2 strong,.customizePreviewHead2 small{display:block}.customizePreviewHead2 strong{font-size:17px}.customizePreviewHead2 small{color:#919198;margin-top:3px;font-size:12px}.customizePreviewHead2 a{width:36px;height:36px;border-radius:11px;background:#171717;border:1px solid #282828;display:grid;place-items:center;color:#fff}.customizePreviewViewport2{height:690px;border-radius:16px;overflow:hidden;border:1px solid #282828;background:#050505;box-shadow:inset 0 0 0 1px rgba(225,29,47,.03)}.customizePreviewFooter2{display:flex;justify-content:space-between;color:#85858c;font-size:12px;padding:10px 4px 1px}.customizePreviewFooter2 span:last-child{text-transform:capitalize;color:#d7d7dc}.customizeShell2 .selectButton2{background:#090909;border-radius:12px;min-height:44px;box-shadow:none}.customizeShell2 .selectMenu2{border-radius:14px}.customizeShell2 input,.customizeShell2 textarea{background:#080808;border-color:#262626}.customizeShell2 .toggle2 i{background:#232323}.customizeShell2 .toggle2 input:checked+i{background:#e11d2f;border-color:#e11d2f}.customizeShell2 input[type=range]{accent-color:#e11d2f}.customizeShell2 .primaryBtn.soft{background:rgba(225,29,47,.12);border-color:rgba(225,29,47,.46)}
.mobileTabs2{display:none}.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.avatar2{width:44px;height:44px;background:#fff;color:#111;display:grid;place-items:center;overflow:hidden;flex:none}.avatar2 img{width:100%;height:100%;object-fit:cover}.avatar2.circle{border-radius:50%}.avatar2.rounded{border-radius:14px}.avatar2.square{border-radius:4px}.avatar2.hexagon{clip-path:polygon(25% 5%,75% 5%,100% 50%,75% 95%,25% 95%,0 50%)}.avatar2.star{clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)}
@media (max-width:1320px){.customizeShell2{grid-template-columns:minmax(0,1fr) 340px}.customizePreviewViewport2{height:620px}}
@media (max-width:1080px){.customizeShell2{grid-template-columns:1fr}.customizePreviewSticky2{position:relative;top:auto}.customizePreviewViewport2{height:650px}.gunAssetGrid2,.gunColorGrid2,.gunGeneralGrid2,.gunToggleGrid2,.gradientColors2{grid-template-columns:1fr}.gunGeneralGrid2 .span2{grid-column:auto}}
@media (max-width:1180px){.customBadgeCreator2{grid-template-columns:1fr}.customBadgePreview2{width:100%;height:110px}.customBadgeGrid2 .roleBadge2{grid-template-columns:28px minmax(0,1fr)}.stats4{grid-template-columns:repeat(2,minmax(0,1fr))}.split2{grid-template-columns:1fr}.formGrid2,.assetGrid2,.badgeGrid2,.layoutCards2,.templateGrid2,.templateCreateGrid2{grid-template-columns:1fr}.formGrid2 .span2{grid-column:auto}.linkMain2{grid-template-columns:40px 1fr}.linkMain2 select,.linkMain2 .spanLink2{grid-column:span 2}.linkRow2,.hostRow2,.templateRow2{flex-wrap:wrap}.topbar2{position:static}}
@media (max-width:900px){.dash2{grid-template-columns:1fr}.side2{display:none}.main2{padding:18px}.mobileTabs2{display:block;margin-bottom:16px}.stats4{grid-template-columns:1fr}.topbarActions2{justify-content:flex-start}.previewBox2{height:520px}}
`;
