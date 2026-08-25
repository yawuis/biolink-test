"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  BadgeCheck,
  BarChart3,
  Brush,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Crown,
  Eye,
  ExternalLink,
  Gem,
  Github,
  Globe,
  HelpCircle,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  LogOut,
  MessageCircle,
  MoreHorizontal,
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
  ShoppingBag,
} from "lucide-react";
import ProfileCard from "@/components/ProfileCard";
import ScrollProfile from "@/components/ScrollProfile";
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
import { resizeCursorPng, uploadFile, uploadHostedImage, deleteHostedImage } from "@/lib/upload";
import { createClient } from "@/lib/supabase/client";
import { getBrowserPublicBaseUrl } from "@/lib/site-url";
import { saveProfile, signOut } from "./actions";
import BrandMark from "@/components/BrandMark";

type Tab =
  | "overview"
  | "customize"
  | "links"
  | "settings"
  | "analytics"
  | "badges"
  | "templates"
  | "premium"
  | "imagehost";

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
  { tab: "overview", label: "Overview", icon: User, desc: "Finish your page, then check the live preview." },
  { tab: "customize", label: "Customize", icon: Brush, desc: "Profile details, layouts, assets, colors, and SEO metadata." },
  { tab: "links", label: "Links", icon: LinkIcon, desc: "Manage socials and custom URL cards." },
  { tab: "premium", label: "Premium", icon: Gem, desc: "Upgrade to premium perks and badges." },
  { tab: "imagehost", label: "Image Host", icon: ImageIcon, desc: "Upload and host custom assets." },
  { tab: "templates", label: "Templates", icon: Copy, desc: "Save and apply user-created templates." },
  { tab: "settings", label: "Settings", icon: Settings, desc: "Username, alias, and privacy settings." },
  { tab: "analytics", label: "Analytics", icon: BarChart3, desc: "Simple profile performance stats." },
  { tab: "badges", label: "Badges", icon: BadgeCheck, desc: "View Discord role badges and choose glow." },
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
  const [accountOpen, setAccountOpen] = useState(true);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);

  const { roles, joined, loading: discordLoading } = useDashboardDiscordRoles(p);
  const roleSet = useMemo(() => new Set(roles.map(String)), [roles]);
  const roleOwner = roleSet.has(OWNER_ROLE_ID);
  const rolePremium = roleSet.has("1541313066858319876");
  const canUseAll = isOwner || roleOwner;
  const isPremiumUser = canUseAll || rolePremium || p.owned_badges?.includes("premium");

  const update = (patch: Partial<Profile>) => setP((prev) => ({ ...prev, ...patch }));
  const profileAccent = p.accent || "#55acee";
  const publicUrl = typeof window === "undefined" ? `/${p.username}` : `${getBrowserPublicBaseUrl()}/${p.username}`;
  const active = NAV.find((item) => item.tab === tab) || NAV[0];
type SearchResult = { label: string; sub: string; tab: Tab; anchor: string };

const SEARCH_INDEX: SearchResult[] = [
  // Overview
  { label: "Profile checklist", sub: "Completion overview", tab: "overview", anchor: "s-checklist" },
  { label: "Live preview", sub: "See your profile instantly", tab: "overview", anchor: "s-preview-ov" },
  { label: "Quick edit", sub: "Display name, bio, accent", tab: "overview", anchor: "s-quickedit" },
  { label: "Bio / description", sub: "Profile bio text", tab: "overview", anchor: "s-quickedit" },
  { label: "Display name", sub: "Name shown on your profile", tab: "overview", anchor: "s-quickedit" },
  { label: "Location", sub: "Shown on your profile", tab: "overview", anchor: "s-quickedit" },
  { label: "Pronouns", sub: "Shown under your name", tab: "overview", anchor: "s-quickedit" },
  { label: "Profile accent", sub: "Color used for accents and glow", tab: "overview", anchor: "s-quickedit" },
  // Customize — Assets
  { label: "Profile avatar", sub: "Upload your profile picture", tab: "customize", anchor: "s-assets" },
  { label: "Avatar upload", sub: "Upload your profile picture", tab: "customize", anchor: "s-assets" },
  { label: "Background image", sub: "Upload a background media", tab: "customize", anchor: "s-assets" },
  { label: "Background video", sub: "Upload a background media", tab: "customize", anchor: "s-assets" },
  { label: "Background upload", sub: "Upload a background media", tab: "customize", anchor: "s-assets" },
  { label: "Audio / music", sub: "Upload profile audio tracks", tab: "customize", anchor: "s-assets" },
  { label: "Spotify cover", sub: "Spotify card cover art", tab: "customize", anchor: "s-assets" },
  { label: "Custom cursor", sub: "PNG cursor file upload", tab: "customize", anchor: "s-assets" },
  // Customize — General
  { label: "Profile opacity", sub: "How transparent the card is", tab: "customize", anchor: "s-general" },
  { label: "Profile blur", sub: "Blur amount on profile card", tab: "customize", anchor: "s-general" },
  { label: "Background effect", sub: "Blurred / darken / none", tab: "customize", anchor: "s-general" },
  { label: "Screen effect", sub: "None / particles / crt", tab: "customize", anchor: "s-general" },
  { label: "Username effect", sub: "Glow, sparkle, typewriter", tab: "customize", anchor: "s-general" },
  { label: "Layout", sub: "Classic, portfolio, scroll etc.", tab: "customize", anchor: "s-general" },
  { label: "Avatar shape", sub: "Circle, rounded, hexagon", tab: "customize", anchor: "s-general" },
  { label: "Discord presence", sub: "Show Discord status card", tab: "customize", anchor: "s-general" },
  // Customize — Music & Cards
  { label: "GitHub username", sub: "GitHub presence card", tab: "customize", anchor: "s-music" },
  { label: "Spotify track link", sub: "Spotify integration", tab: "customize", anchor: "s-music" },
  { label: "Spotify display title", sub: "Spotify card label", tab: "customize", anchor: "s-music" },
  { label: "Page enter text", sub: "Click-to-enter overlay text", tab: "customize", anchor: "s-music" },
  // Customize — Colors
  { label: "Accent color", sub: "Profile accent and glow color", tab: "customize", anchor: "s-colors" },
  { label: "Text color", sub: "Main profile text color", tab: "customize", anchor: "s-colors" },
  { label: "Background color", sub: "Card fallback color", tab: "customize", anchor: "s-colors" },
  { label: "Badge color", sub: "Badge tint when monochrome on", tab: "customize", anchor: "s-colors" },
  { label: "Links color", sub: "Social and link icon color", tab: "customize", anchor: "s-colors" },
  { label: "Background effect color", sub: "Color for background effects", tab: "customize", anchor: "s-colors" },
  { label: "Profile gradient", sub: "Toggle gradient background", tab: "customize", anchor: "s-colors" },
  // Customize — Other
  { label: "Monochrome icons", sub: "Toggle monochrome badge icons", tab: "customize", anchor: "s-other" },
  { label: "Animated title", sub: "Toggle page title animation", tab: "customize", anchor: "s-other" },
  { label: "Badge glow", sub: "Enable badge glow effect", tab: "customize", anchor: "s-other" },
  { label: "Cursor effect", sub: "Trail, dot, or particle cursor", tab: "customize", anchor: "s-other" },
  { label: "Font", sub: "Profile font family", tab: "customize", anchor: "s-other" },
  { label: "Tags", sub: "Profile skill tags", tab: "customize", anchor: "s-tags" },
  // Links
  { label: "Quick add links", sub: "Add Discord, GitHub, etc.", tab: "links", anchor: "s-quickadd" },
  { label: "Link list", sub: "Manage all your links", tab: "links", anchor: "s-linklist" },
  { label: "Custom URL", sub: "Add a custom link", tab: "links", anchor: "s-quickadd" },
  { label: "Social links", sub: "Manage socials", tab: "links", anchor: "s-linklist" },
  // Layout
  { label: "Layout type", sub: "Classic, portfolio, scroll etc.", tab: "customize", anchor: "s-layouttype" },
  { label: "Module visibility", sub: "About, Discord, Spotify etc.", tab: "customize", anchor: "s-modules" },
  { label: "About module", sub: "Show/hide about section", tab: "customize", anchor: "s-modules" },
  { label: "Spotify module", sub: "Show/hide Spotify card", tab: "customize", anchor: "s-modules" },
  { label: "Clock module", sub: "Show/hide local time", tab: "customize", anchor: "s-modules" },
  // Metadata
  { label: "Website title", sub: "SEO page title", tab: "customize", anchor: "s-metadata" },
  { label: "Website description", sub: "SEO meta description", tab: "customize", anchor: "s-metadata" },
  { label: "Website image", sub: "Open Graph / Twitter card image", tab: "customize", anchor: "s-metadata" },
  { label: "Custom favicon", sub: "Browser tab icon", tab: "customize", anchor: "s-metadata" },
  { label: "Search indexing", sub: "Allow/block search engines", tab: "customize", anchor: "s-metadata" },
  // Settings
  { label: "Username", sub: "Change your unique username", tab: "settings", anchor: "s-username" },
  { label: "Alias", sub: "Secondary profile URL", tab: "settings", anchor: "s-alias" },
  { label: "Linked Discord", sub: "Connect Discord account", tab: "settings", anchor: "s-discord-link" },
  { label: "Privacy", sub: "Hide views, likes, join date", tab: "settings", anchor: "s-privacy" },
  { label: "Hide views", sub: "Remove view count from profile", tab: "settings", anchor: "s-privacy" },
  { label: "Hide likes", sub: "Remove like count from profile", tab: "settings", anchor: "s-privacy" },
  { label: "Hide join date", sub: "Remove join date from profile", tab: "settings", anchor: "s-privacy" },
  // Analytics
  { label: "Views trend", sub: "Profile view history", tab: "analytics", anchor: "s-analytics" },
  // Badges
  { label: "Badges", sub: "Discord role badges", tab: "badges", anchor: "s-badges" },
  { label: "Role badges", sub: "Earned via Discord roles", tab: "badges", anchor: "s-badges" },
  // Templates
  { label: "Templates", sub: "Save and apply profile templates", tab: "templates", anchor: "s-templates" },
];

  const [searchFocused, setSearchFocused] = useState(false);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const navMatches = NAV.filter((item) => item.label.toLowerCase().includes(q)).map((item) => ({
      label: item.label,
      sub: item.desc,
      tab: item.tab,
      anchor: "",
    }));
    const indexMatches = SEARCH_INDEX.filter((item) =>
      item.label.toLowerCase().includes(q) || item.sub.toLowerCase().includes(q)
    );
    const seen = new Set<string>();
    return [...navMatches, ...indexMatches].filter((r) => {
      const key = `${r.tab}:${r.anchor}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 8);
  }, [query]);

  const filteredNav = query.trim()
    ? NAV.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
    : NAV;

  const goToResult = (result: SearchResult) => {
    setTab(result.tab);
    setQuery("");
    setSearchFocused(false);
    if (result.anchor) {
      setTimeout(() => {
        const el = document.getElementById(result.anchor);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
  };

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
          <BrandMark size={16} />
        </div>

        <div className="search2" style={{ position: "relative" }}>
          <Search size={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            placeholder="Search settings..."
          />
          {searchFocused && searchResults.length > 0 && (
            <div className="searchDrop2">
              {searchResults.map((r, i) => (
                <button key={i} className="searchDropItem2" onMouseDown={() => goToResult(r)}>
                  <span className="searchDropLabel2">{r.label}</span>
                  <span className="searchDropSub2">{r.sub}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <nav className="nav2">
          {/* Account Dropdown */}
          <div className="navGroup2">
            <button 
              type="button"
              className={`navGroupHeader2 ${accountOpen ? "open" : ""}`} 
              onClick={() => setAccountOpen(!accountOpen)}
            >
              <span className="navGroupHeaderLeft2">
                <User size={17} />
                <span>Account</span>
              </span>
              {accountOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            
            {accountOpen && (
              <div className="navGroupSub2">
                {[
                  { tab: "overview", label: "Overview" },
                  { tab: "analytics", label: "Analytics" },
                  { tab: "badges", label: "Badges" },
                  { tab: "settings", label: "Settings" }
                ].map((item) => (
                  <button 
                    key={item.tab} 
                    type="button"
                    className={`navSubItem2 ${tab === item.tab ? "active" : ""}`} 
                    onClick={() => setTab(item.tab as Tab)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Other links */}
          {[
            { tab: "customize", label: "Customize", icon: Brush },
            { tab: "links", label: "Links", icon: LinkIcon },
            { tab: "premium", label: "Premium", icon: Gem },
            { tab: "imagehost", label: "Image Host", icon: ImageIcon },
            { tab: "templates", label: "Templates", icon: Copy }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button 
                key={item.tab} 
                type="button"
                className={`navItem2 ${tab === item.tab ? "active" : ""}`} 
                onClick={() => setTab(item.tab as Tab)}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Support Card */}
        <div className="supportCard2">
          <small>Have a question or need support?</small>
          <a className="supportBtn2 primary" href={DISCORD_INVITE_URL} target="_blank" rel="noreferrer">
            <HelpCircle size={15} /> Help Center
          </a>
          <small style={{ marginTop: 8 }}>Check out your page</small>
          <a className="supportBtn2 secondary" href={`/${p.username}`} target="_blank" rel="noreferrer">
            <ExternalLink size={15} /> My Page
          </a>
        </div>

        {/* Share profile Button */}
        <button 
          type="button"
          className="shareProfileBtn2" 
          onClick={() => {
            navigator.clipboard?.writeText(publicUrl);
            alert("Profile link copied to clipboard!");
          }}
        >
          <Share2 size={15} /> Share Your Profile
        </button>

        {/* User profile bar & Quick Menu trigger */}
        <div className="userFooter2" style={{ position: "relative" }}>
          <div className="userFooterLeft2">
            <div className="userFooterAvatar2" style={{ borderRadius: p.avatar_shape === "circle" ? "50%" : 8 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.avatar_url ? <img src={p.avatar_url} alt="" /> : <User size={18} />}
            </div>
            <div className="userFooterMeta2">
              <strong>{p.display_name || p.username}</strong>
              <small>UID {p.public_uid ? Number(p.public_uid).toLocaleString() : p.id.slice(0, 6)}</small>
            </div>
          </div>
          <button type="button" className="userFooterMenuTrigger2" onClick={() => setQuickMenuOpen(!quickMenuOpen)}>
            <MoreHorizontal size={18} />
          </button>

          {/* Quick Menu Popover */}
          {quickMenuOpen && (
            <>
              <div className="quickMenuOverlay2" onClick={() => setQuickMenuOpen(false)} />
              <div className="quickMenu2">
                <div className="quickMenuHeader2">
                  <h3>Quick Menu</h3>
                  <p>Navigate quickly through sob.lol</p>
                </div>
                
                <div className="quickMenuBody2">
                  <button type="button" className="quickMenuItem2" onClick={() => { setTab("settings"); setQuickMenuOpen(false); }}>
                    <div className="quickMenuLabel2">
                      <User size={15} />
                      <span>Switch Accounts</span>
                    </div>
                    <span className="quickMenuArrow2">→</span>
                  </button>

                  <div className="quickMenuLang2">
                    <div className="quickMenuLangLeft2">
                      <span className="langFlag2">🇺🇸</span>
                      <span>English (US)</span>
                    </div>
                    <ChevronDown size={14} />
                  </div>

                  <a className="quickMenuBtn2 home" href="/" target="_blank" rel="noreferrer">
                    <BrandMark size={14} /> Home
                  </a>

                  <a className="quickMenuBtn2 leaderboard" href="/marketplace">
                    <ShoppingBag size={14} /> Marketplace
                  </a>

                  <a className="quickMenuBtn2 discord" href={DISCORD_INVITE_URL} target="_blank" rel="noreferrer">
                    <MessageCircle size={14} /> Discord Server
                  </a>

                  <button type="button" className="quickMenuBtn2 logout" onClick={() => signOut()}>
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              </div>
            </>
          )}
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
            <a className="ghostBtn" href="/marketplace">
              <ShoppingBag size={15} /> Marketplace
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

        {tab === "overview" && <Overview p={p} update={update} setTab={setTab} isPremium={isPremiumUser} />}
        {tab === "customize" && (
          <div className="stack2">
            <Customize p={p} update={update} onUpload={onUpload} busy={busy} isPremium={isPremiumUser} />
            <LayoutTab p={p} update={update} isPremium={isPremiumUser} />
            <MetadataTab p={p} update={update} onUpload={onUpload} busy={busy} />
          </div>
        )}
        {tab === "links" && <LinksTab p={p} update={update} />}
        {tab === "premium" && <PremiumTab />}
        {tab === "imagehost" && <ImageHostTab p={p} />}
        {tab === "settings" && <SettingsTab p={p} update={update} />}
        {tab === "analytics" && <Analytics p={p} />}
        {tab === "badges" && <Badges p={p} update={update} isOwner={isOwner} roles={roles} joined={joined} loading={discordLoading} />}
        {tab === "templates" && <Templates p={p} update={update} onUpload={onUpload} busy={busy} />}
      </main>
    </div>
  );
}

function Overview({ p, update, setTab, isPremium }: { p: Profile; update: (patch: Partial<Profile>) => void; setTab: (tab: Tab) => void; isPremium: boolean }) {
  const completion = completionItems(p);
  const complete = completion.filter((item) => item.ok).length;
  const percent = Math.round((complete / completion.length) * 100);
  const [identityOpen, setIdentityOpen] = useState(true);
  const [checklistOpen, setChecklistOpen] = useState(false);

  return (
    <div className="stack2" style={{ gap: 24 }}>
      {/* Sleek Welcoming & Analytics Banner */}
      <div style={{
        background: "linear-gradient(135deg, rgba(85, 172, 238, 0.08) 0%, rgba(9, 9, 11, 0.8) 100%)",
        border: "1px solid rgba(85, 172, 238, 0.15)",
        borderRadius: 16,
        padding: "24px 28px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 20,
        boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
      }}>
        <div>
          <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
            Welcome, {p.display_name || p.username} 👋
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "#a1a1aa" }}>
            Your link:{" "}
            <a
              href={`/${p.username}`}
              target="_blank"
              rel="noreferrer"
              style={{ color: "#55acee", textDecoration: "none", fontWeight: 500 }}
            >
              biolink-test-vert.vercel.app/{p.username}
            </a>
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 10, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Views</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#f4f4f5" }}>{(p.views || 0).toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 10, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Links</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#f4f4f5" }}>{(p.links || []).filter((l) => !l.hidden).length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 10, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Modules</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#f4f4f5" }}>{(p.modules || []).length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 10, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Completion</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#55acee" }}>{percent}%</span>
          </div>
        </div>
      </div>

      {/* Rearranged Split Content View */}
      <div className="split2 previewSplit2" style={{ gridTemplateColumns: "1.1fr 0.9fr", gap: 24 }}>
        {/* Left Column: Live Preview Viewport (Flipped) */}
        <section id="s-preview-ov" className="card2" style={{ display: "flex", flexDirection: "column", gap: 16, margin: 0 }}>
          <div className="cardHead2" style={{ marginBottom: 0 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600 }}>Live Preview</h2>
            <p style={{ margin: 0, fontSize: 12, color: "#71717a" }}>Interactive view of your profile. Changes reflect instantly.</p>
          </div>
          <div className="previewBox2" style={{ borderRadius: 10, background: "#060608", border: "1px solid #1f1f23", padding: "16px 10px", display: "grid", placeItems: "center" }}>
            {p.layout === "scroll" ? (
              <ScrollProfile profile={p} onRearrange={isPremium ? (next) => update({ modules: next }) : undefined} />
            ) : (
              <ProfileCard profile={p} onRearrange={isPremium ? (next) => update({ modules: next }) : undefined} />
            )}
          </div>
        </section>

        {/* Right Column: Editor Controls & Checklist Stack */}
        <div style={{ display: "grid", gap: 24 }}>
          {/* Quick Settings Form */}
          <section id="s-quickedit" className="card2" style={{ padding: 20, margin: 0 }}>
            <div 
              onClick={() => setIdentityOpen(!identityOpen)}
              style={{ 
                cursor: "pointer", 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center" 
              }}
            >
              <div className="cardHead2" style={{ marginBottom: 0 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600 }}>Profile Identity</h2>
                <p style={{ margin: 0, fontSize: 12, color: "#71717a" }}>Instantly customize your primary display details.</p>
              </div>
              <div style={{ color: "#71717a" }}>
                {identityOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </div>
            
            {identityOpen && (
              <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                <Field label="Display name" value={p.display_name || ""} onChange={(v) => update({ display_name: v })} />
                <Field label="Location" value={p.location || ""} onChange={(v) => update({ location: v })} />
                <Field label="Pronouns" value={p.pronouns || ""} onChange={(v) => update({ pronouns: v })} />
                <ColorField label="Profile accent" help="Only changes profile cards and glow." value={p.accent || "#55acee"} onChange={(v) => update({ accent: v })} />
                <Textarea label="Bio" value={p.bio || ""} onChange={(v) => update({ bio: v })} />
              </div>
            )}
          </section>

          {/* Profile checklist */}
          <section id="s-checklist" className="card2" style={{ padding: 20, margin: 0 }}>
            <div 
              onClick={() => setChecklistOpen(!checklistOpen)}
              style={{ 
                cursor: "pointer", 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center" 
              }}
            >
              <div className="cardHead2" style={{ marginBottom: 0, flex: 1 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600 }}>Profile Checklist</h2>
                <p style={{ margin: 0, fontSize: 12, color: "#71717a" }}>
                  {percent === 100 ? "Your profile is fully optimized!" : `${percent}% complete — finish checklist items to unlock tags.`}
                </p>
              </div>
              <div style={{ color: "#71717a", marginLeft: 16 }}>
                {checklistOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </div>
            
            {checklistOpen && (
              <div style={{ marginTop: 16 }}>
                {/* Completion Bar */}
                <div className="completionBar2" style={{ height: 6, background: "#1f1f23", borderRadius: 9999, overflow: "hidden", marginBottom: 16 }}>
                  <div style={{ width: `${percent}%`, height: "100%", background: "#55acee", transition: "width 0.3s ease" }} />
                </div>

                <div style={{ display: "grid", gap: 1, borderRadius: 10, overflow: "hidden", border: "1px solid #1f1f23" }}>
                  {completion.map((item) => (
                    <div
                      key={item.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        background: "rgba(255,255,255,0.015)",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            border: item.ok ? "1px solid #55acee" : "1px solid #3f3f46",
                            background: item.ok ? "#55acee" : "transparent",
                            color: item.ok ? "#000" : "transparent",
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          {item.ok && <Check size={10} strokeWidth={3} />}
                        </div>
                        <div>
                          <strong style={{ fontSize: 12, color: item.ok ? "#f4f4f5" : "#a1a1aa", display: "block", fontWeight: 500 }}>{item.label}</strong>
                          <span style={{ fontSize: 10, color: "#71717a" }}>{item.help}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setTab(item.tab)}
                        style={{
                          fontSize: 10,
                          background: item.ok ? "rgba(85,172,238,0.08)" : "#141416",
                          color: item.ok ? "#55acee" : "#a1a1aa",
                          border: "1px solid #1f1f23",
                          padding: "4px 8px",
                          borderRadius: 6,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {item.ok ? "View" : "Set Up"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
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

function Customize({ p, update, onUpload, busy, isPremium }: { p: Profile; update: (patch: Partial<Profile>) => void; onUpload: any; busy: string | null; isPremium: boolean }) {
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
        <section id="s-assets" className="gunSection2">
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

        <section id="s-general" className="gunSection2">
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

            <div className="discordFlow2 span2 gunDiscord2" style={{ display: "grid", gap: 14 }}>
              <div className="gunInlineTitle2">
                <div>
                  <strong>Discord Presence</strong>
                  <small>Show your Discord status and activity on your profile.</small>
                </div>
                <Toggle label="Enabled" checked={!!p.discord_enabled} onChange={(v) => update({ discord_enabled: v, discord_invite_url: DISCORD_INVITE_URL })} />
              </div>

              {/* Discord Avatar Decoration Toggle (Premium) */}
              <div className="gunInlineTitle2" style={{ borderTop: "1px solid #1f1f23", paddingTop: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <strong>Discord Avatar Decoration</strong>
                    {!isPremium && <span style={{ fontSize: 9, fontWeight: 700, background: "rgba(85,172,238,0.15)", color: "#55acee", padding: "1px 6px", borderRadius: 9999, textTransform: "uppercase" }}>💎 Premium</span>}
                  </div>
                  <small>Equip your Discord avatar decoration on your profile avatar.</small>
                </div>
                <Toggle
                  label="Show Decoration"
                  checked={!!p.discord_avatar_decoration}
                  onChange={(v) => {
                    if (!isPremium) {
                      alert("Discord Avatar Decorations are a premium-only feature!");
                      return;
                    }
                    update({ discord_avatar_decoration: v });
                  }}
                />
              </div>

              {/* Discord Badges Toggle (Premium) */}
              <div className="gunInlineTitle2" style={{ borderTop: "1px solid #1f1f23", paddingTop: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <strong>Discord Profile Badges</strong>
                    {!isPremium && <span style={{ fontSize: 9, fontWeight: 700, background: "rgba(85,172,238,0.15)", color: "#55acee", padding: "1px 6px", borderRadius: 9999, textTransform: "uppercase" }}>💎 Premium</span>}
                  </div>
                  <small>Show your HypeSquad, Active Developer, and other Discord badges.</small>
                </div>
                <Toggle
                  label="Show Badges"
                  checked={!(p.badges || []).some(b => b.id === "discord_badges" && b.enabled === false)}
                  onChange={(v) => {
                    if (!isPremium) {
                      alert("Discord Profile Badges are a premium-only feature!");
                      return;
                    }
                    const cleanBadges = (p.badges || []).filter(b => b.id !== "discord_badges");
                    update({
                      badges: [...cleanBadges, { id: "discord_badges", name: "Discord Badges Toggle", icon: "", enabled: v }]
                    });
                  }}
                />
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
            <SelectField label="Screen Effect" value={p.effect || "none"} options={["none", "particles", "crt"]} onChange={(v) => update({ effect: v })} />
            <SelectField label="Username Effect" value={p.username_effect || "none"} options={["none", "glow", "sparkle", "typewriter"]} onChange={(v) => update({ username_effect: v })} />
            <SelectField label="Layout" value={p.layout || "classic"} options={["classic", "portfolio", "scroll", "compact", "minimal", "banner"]} onChange={(v) => update({ layout: v })} />
            <SelectField label="Avatar Shape" value={p.avatar_shape || "circle"} options={[...AVATAR_SHAPES]} onChange={(v) => update({ avatar_shape: v })} />
          </div>
        </section>

        <section id="s-music" className="gunSection2">
          <div className="gunSectionHead2">
            <div>
              <h2>Music &amp; Cards</h2>
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

        <section id="s-colors" className="gunSection2">
          <div className="gunSectionHead2">
            <div>
              <h2>Color Customization</h2>
              <p>Profile-only colors. The dashboard stays blue, black, gray, and white.</p>
            </div>
          </div>
          <div className="gunColorGrid2">
            <ColorField label="Accent Color" help="Profile accents and glow." value={p.accent || "#55acee"} onChange={(v) => update({ accent: v })} />
            <ColorField label="Text Color" help="Main profile text." value={p.text_color || "#ffffff"} onChange={(v) => update({ text_color: v })} />
            <ColorField label="Background Color" help="Fallback when no background media is set." value={p.background_color || "#09090b"} onChange={(v) => update({ background_color: v })} />
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

        <section id="s-other" className="gunSection2">
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

        <section id="s-tags" className="gunSection2">
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
            {p.layout === "scroll" ? (
              <ScrollProfile profile={p} onRearrange={isPremium ? (next) => update({ modules: next }) : undefined} />
            ) : (
              <ProfileCard profile={p} onRearrange={isPremium ? (next) => update({ modules: next }) : undefined} />
            )}
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
      <section id="s-quickadd" className="card2">
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

      <section id="s-linklist" className="card2">
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

function LayoutTab({ p, update, isPremium }: { p: Profile; update: (patch: Partial<Profile>) => void; isPremium: boolean }) {
  const rawModules = p.modules || [];
  const modules = rawModules.map((m) => (m.includes(":") ? m.split(":")[0] : m));
  const toggleMod = (key: string) => {
    const active = modules.includes(key);
    const next = active
      ? rawModules.filter((m) => (m.includes(":") ? m.split(":")[0] : m) !== key)
      : [...rawModules, key];
    update({ modules: next });
  };

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!isPremium) return;
    e.dataTransfer.effectAllowed = "move";
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (!isPremium || draggedIndex === null || draggedIndex === index) return;
    
    const items = [...rawModules];
    const draggedItem = items[draggedIndex];
    items.splice(draggedIndex, 1);
    items.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    update({ modules: items });
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="stack2">
      <div className="split2">
        <section id="s-layouttype" className="card2">
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

        <section id="s-modules" className="card2" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <div className="cardHead2" style={{ marginBottom: 12 }}>
              <h2>Module visibility</h2>
              <p>Toggle which modules are visible on your profile.</p>
            </div>
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
          </div>

          <div>
            <div className="cardHead2" style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div>
                  <h2 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
                    <span>Module Arrangement</span>
                    {!isPremium && (
                      <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(85,172,238,0.15)", color: "#55acee", padding: "2px 8px", borderRadius: 9999, textTransform: "uppercase" }}>
                        💎 Premium
                      </span>
                    )}
                  </h2>
                  <p style={{ margin: "6px 0 0 0" }}>Drag and drop the active modules below to rearrange them on your page.</p>
                </div>
                {isPremium && (
                  <Link href="/rearrange" style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#14223c",
                    border: "1px solid rgba(85, 172, 238, 0.2)",
                    color: "#55acee",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "6px 14px",
                    borderRadius: 8,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s ease"
                  }}>
                    ✨ Rearrange Fullscreen
                  </Link>
                )}
              </div>
            </div>
            
            <div style={{ display: "grid", gap: 8, position: "relative" }}>
              {modules.map((m, idx) => (
                <div
                  key={m}
                  draggable={isPremium}
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  style={{
                    background: "#09090b",
                    border: draggedIndex === idx ? "1px dashed #55acee" : "1px solid #27272a",
                    borderRadius: 8,
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: isPremium ? "grab" : "not-allowed",
                    opacity: draggedIndex === idx ? 0.6 : 1,
                    transition: "border-color 0.15s, opacity 0.15s",
                    userSelect: "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ color: "#71717a", fontSize: 16 }}>⋮⋮</span>
                    <strong style={{ fontSize: 13, fontWeight: 500, color: "#e4e4e7" }}>{MODULE_META[m] || m}</strong>
                  </div>
                  <small style={{ color: "#71717a", fontSize: 11 }}>
                    {isPremium ? "Drag to reorder" : "Rearrange locked"}
                  </small>
                </div>
              ))}
              
              {modules.length === 0 && (
                <div className="empty2">No active modules to rearrange. Toggle modules on above first!</div>
              )}
              
              {!isPremium && modules.length > 0 && (
                <div style={{
                  position: "absolute",
                  inset: -6,
                  background: "rgba(9, 9, 11, 0.78)",
                  backdropFilter: "blur(2.5px)",
                  borderRadius: 10,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  zIndex: 10,
                  border: "1px solid rgba(85, 172, 238, 0.2)",
                  padding: 16,
                  textAlign: "center"
                }}>
                  <strong style={{ fontSize: 14, color: "#f4f4f5" }}>Unlock Module Rearranging</strong>
                  <p style={{ fontSize: 12, color: "#a1a1aa", margin: "0 0 4px", maxWidth: 260, lineHeight: 1.4 }}>
                    Upgrade to Premium to drag and drop your profile modules in any order.
                  </p>
                  <a href="/marketplace" style={{
                    background: "#55acee",
                    color: "#ffffff",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "6px 16px",
                    borderRadius: 6,
                    textDecoration: "none",
                    transition: "background 0.15s"
                  }}>
                    Go to Marketplace
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function MetadataTab({ p, update, onUpload, busy }: { p: Profile; update: (patch: Partial<Profile>) => void; onUpload: any; busy: string | null }) {
  return (
    <div className="split2 previewSplit2">
      <section id="s-metadata" className="card2">
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
        <section id="s-username" className="card2">
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

        <section id="s-alias" className="card2">
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

        <section id="s-discord-link" className="card2">
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
        <section id="s-privacy" className="card2">
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

      <section id="s-analytics" className="card2">
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

function Badges({ p, update, isOwner, roles, joined, loading }: { p: Profile; update: (patch: Partial<Profile>) => void; isOwner: boolean; roles: string[]; joined: boolean; loading: boolean }) {
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
      <section id="s-badges" className="card2 badgeHero2">
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
            <a href="/marketplace" style={{ color: "#55acee", textDecoration: "none", fontWeight: 600, fontSize: 13 }}>Visit Marketplace →</a>
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
  "effect",
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
      <section id="s-templates" className="card2 templateCreate2">
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
      {title === "Background" && <p className="helpText2" style={{ margin: "8px 0 0" }}>Shown as a banner on your profile. Images, MP4, WebM, and MOV. If a video has audio, choose Yes to add it to your audio tracks.</p>}
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
:root{--site-accent:#55acee;--site-accent-soft:rgba(85,172,238,0.12)}
.dash2{min-height:100vh;background:radial-gradient(circle at 80% 20%, rgba(85,172,238,0.06), transparent 50%), #09090b;color:#f4f4f5;display:grid;grid-template-columns:250px minmax(0,1fr);font-family:Inter,system-ui,sans-serif}
.side2{position:sticky;top:0;height:100vh;padding:24px 18px;border-right:1px solid #1f1f23;background:#0c0c0e;display:flex;flex-direction:column;gap:18px;overflow-y:auto}
.brand2{display:flex;align-items:center;gap:10px;padding:0 4px;min-height:28px}
.search2{display:flex;align-items:center;gap:10px;height:38px;border:1px solid #1f1f23;border-radius:8px;background:#141416;padding:0 10px;color:#71717a;position:relative;transition:border-color 0.15s ease}.search2 input{background:transparent;border:0;outline:0;color:#f4f4f5;width:100%;font-size:13px}.search2:focus-within{border-color:#55acee}
.searchDrop2{position:absolute;top:calc(100% + 8px);left:0;right:0;z-index:100;background:#141416;border:1px solid #1f1f23;border-radius:10px;overflow:hidden;display:grid;gap:0;box-shadow:0 10px 30px rgba(0,0,0,0.5)}
.searchDropItem2{display:grid;text-align:left;padding:10px 12px;border:0;border-bottom:1px solid #1f1f23;background:transparent;cursor:pointer;transition:background 0.1s ease;gap:2px}
.searchDropItem2:last-child{border-bottom:0}
.searchDropItem2:hover{background:#09090b}
.searchDropLabel2{font-size:13px;font-weight:500;color:#f4f4f5}
.searchDropSub2{font-size:11px;color:#71717a}
.nav2{display:grid;gap:6px;overflow:auto;padding-right:4px;margin-top:4px}
.navItem2{height:38px;background:transparent;color:#a1a1aa;border:0;border-radius:8px;display:flex;align-items:center;gap:12px;padding:0 14px;cursor:pointer;text-align:left;font-weight:500;font-size:14px;transition:color 0.15s ease, background 0.15s ease}
.navItem2:hover{color:#f4f4f5;background:#141416}
.navItem2.active{color:#f4f4f5;background:#14223c;border:1px solid rgba(85,172,238,0.15)}
.navGroup2{display:flex;flex-direction:column;gap:4px}
.navGroupHeader2{height:38px;background:transparent;color:#a1a1aa;border:0;border-radius:8px;display:flex;align-items:center;justify-content:space-between;padding:0 14px;cursor:pointer;font-weight:600;font-size:14px;transition:color 0.15s ease, background 0.15s ease}
.navGroupHeader2:hover{color:#f4f4f5;background:#141416}
.navGroupHeader2.open{color:#dbeafe;background:#14223c;border:1px solid rgba(85,172,238,0.15)}
.navGroupHeaderLeft2{display:flex;align-items:center;gap:12px}
.navGroupSub2{display:grid;gap:2px;padding-left:14px;margin-top:2px}
.navSubItem2{height:32px;background:transparent;color:#71717a;border:0;border-left:2px solid #1f1f23;padding:0 16px;cursor:pointer;text-align:left;font-weight:500;font-size:13px;transition:color 0.15s ease, border-color 0.15s ease}
.navSubItem2:hover{color:#a1a1aa;border-left-color:#3f3f46}
.navSubItem2.active{color:#55acee;border-left-color:#55acee;font-weight:600}
.supportCard2{margin-top:auto;background:#0c0c0e;border:1px solid #1f1f23;border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:10px}
.supportCard2 small{color:#71717a;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;text-align:left}
.supportBtn2{display:flex;align-items:center;justify-content:center;gap:8px;height:34px;font-size:13px;font-weight:600;text-decoration:none;border-radius:8px;border:1px solid transparent;transition:all 0.2s ease}
.supportBtn2:hover{transform:translateY(-1px);filter:brightness(1.1)}
.supportBtn2.primary{background:#111224;border-color:rgba(99,102,241,0.2);color:#c7d2fe}
.supportBtn2.secondary{background:#14223c;border-color:rgba(85,172,238,0.2);color:#dbeafe}
.shareProfileBtn2{width:100%;border:0;background:#55acee;color:#ffffff;font-size:13px;font-weight:600;border-radius:9999px;height:38px;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;transition:all 0.2s ease}
.shareProfileBtn2:hover{background:#3b8ec2;transform:translateY(-1px);box-shadow:0 4px 12px rgba(85,172,238,0.25)}
.userFooter2{display:flex;align-items:center;justify-content:space-between;background:#141416;border:1px solid #1f1f23;border-radius:9999px;padding:6px 12px;min-height:44px;transition:border-color 0.2s ease}.userFooter2:hover{border-color:#2e2e36}
.userFooterLeft2{display:flex;align-items:center;gap:10px;min-width:0}
.userFooterAvatar2{width:30px;height:30px;border-radius:50%;background:#27272a;display:grid;place-items:center;overflow:hidden;flex:none}
.userFooterAvatar2 img{width:100%;height:100%;object-fit:cover}
.userFooterMeta2{display:flex;flex-direction:column;min-width:0;text-align:left}
.userFooterMeta2 strong{color:#f4f4f5;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.userFooterMeta2 small{color:#71717a;font-size:10px}
.userFooterMenuTrigger2{background:transparent;border:0;padding:4px;color:#71717a;cursor:pointer;transition:color 0.15s;display:flex;align-items:center;justify-content:center}
.userFooterMenuTrigger2:hover{color:#f4f4f5}
.quickMenuOverlay2{position:fixed;inset:0;z-index:999;cursor:default}
.quickMenu2{position:absolute;bottom:calc(100% + 12px);right:0;width:220px;background:#0c0c0e;border:1px solid #1f1f23;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.6);padding:12px;z-index:1000;display:flex;flex-direction:column;gap:10px;text-align:left}
.quickMenuHeader2{display:flex;flex-direction:column;gap:2px;border-bottom:1px solid #1f1f23;padding-bottom:8px}
.quickMenuHeader2 h3{font-size:13px;font-weight:600;color:#f4f4f5;margin:0}
.quickMenuHeader2 p{font-size:10px;color:#71717a;margin:0}
.quickMenuBody2{display:flex;flex-direction:column;gap:6px}
.quickMenuItem2{display:flex;align-items:center;justify-content:space-between;background:#141416;border:0;border-radius:8px;padding:8px 10px;color:#a1a1aa;cursor:pointer;transition:color 0.15s, background 0.15s;width:100%;text-align:left}
.quickMenuItem2:hover{background:#1f1f23;color:#f4f4f5}
.quickMenuLabel2{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:500}
.quickMenuArrow2{font-size:12px;color:#71717a}
.quickMenuLang2{display:flex;align-items:center;justify-content:space-between;background:#141416;border-radius:8px;padding:8px 10px;font-size:12px;font-weight:500;color:#a1a1aa}
.quickMenuLangLeft2{display:flex;align-items:center;gap:6px}
.langFlag2{font-size:14px}
.quickMenuBtn2{display:flex;align-items:center;justify-content:center;gap:8px;font-size:12px;font-weight:600;text-decoration:none;padding:8px;border-radius:8px;text-align:center;border:1px solid transparent;cursor:pointer;width:100%;transition:opacity 0.15s}
.quickMenuBtn2:hover{opacity:0.9}
.quickMenuBtn2.home{background:#14223c;border-color:rgba(85,172,238,0.15);color:#dbeafe}
.quickMenuBtn2.leaderboard{background:#22150a;border-color:rgba(245,158,11,0.15);color:#fef3c7}
.quickMenuBtn2.discord{background:#0c1220;border-color:rgba(59,130,246,0.15);color:#dbeafe}
.quickMenuBtn2.logout{background:#200b0d;border-color:rgba(239,68,68,0.15);color:#fee2e2;border:0}
.main2{padding:32px 40px 48px;min-width:0}
.topbar2{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:28px;position:sticky;top:0;background:rgba(9,9,11,0.8);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);padding:14px 0 16px;border-bottom:1px solid #1f1f23;z-index:5}
.topbar2 h1{font-size:22px;line-height:1.15;margin:0 0 6px;font-weight:600;letter-spacing:-0.02em;color:#f4f4f5}
.topbar2 p{margin:0;color:#71717a;font-size:13px}
.topbarActions2{display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:flex-end}
.status2{color:#71717a;font-size:13px}
.stack2{display:grid;gap:18px}
.split2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.previewSplit2{align-items:start}
.card2, .gunSection2 {
  background: #0f0f11;
  border: 1px solid #1f1f23;
  border-radius: 12px;
  padding: 24px;
  min-width: 0;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  transition: border-color 0.2s ease;
}
.card2:hover, .gunSection2:hover {
  border-color: #27272e;
}
.gunAssetGrid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.gunGeneralGrid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.gunGeneralGrid2 .span2,.gunAssetGrid2 .span2{grid-column:span 2}
.gunColorGrid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.gunToggleGrid2{display:grid;grid-template-columns:1fr;gap:2px}
.gunInlineTitle2{display:flex;justify-content:space-between;align-items:center;gap:16px}
.cardHead2, .gunSectionHead2 {
  margin-bottom: 20px;
}
.cardHead2 h2, .gunSectionHead2 h2 {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
  color: #f4f4f5;
  letter-spacing: -0.01em;
}
.cardHead2 p, .gunSectionHead2 p {
  margin: 0;
  color: #a1a1aa;
  font-size: 13px;
  line-height: 1.5;
}
.stats4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.metric2{position:relative;background:#0c0c0e;border:1px solid #1f1f23;border-radius:12px;padding:20px;min-height:116px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 2px 10px rgba(0,0,0,0.1);transition:border-color 0.2s ease, transform 0.2s ease}
.metric2:hover {
  border-color: rgba(85, 172, 238, 0.3);
  transform: translateY(-2px);
}
.metricIcon2{position:absolute;right:18px;top:18px;color:#55acee;background:rgba(85,172,238,0.1);width:32px;height:32px;display:grid;place-items:center;border-radius:8px}
.metric2 strong{display:block;font-size:24px;font-weight:600;color:#f4f4f5;margin:8px 0 4px;letter-spacing:-0.02em}
.metric2 b{display:block;font-size:13px;font-weight:500;color:#a1a1aa}
.metric2 span{display:block;color:#71717a;font-size:12px;margin-top:6px;line-height:1.4}
.previewBox2{height:auto;border-radius:12px;overflow:visible;border:1px solid #1f1f23;background:#09090b;display:flex;flex-direction:column}
.previewBox2>*{flex:1;min-height:unset;width:100%;height:auto;overflow:visible}
.previewBox2 .profile-page{min-height:unset;height:auto;padding:32px 16px;overflow:visible}
.formGrid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.formGrid2 .span2{grid-column:span 2}
label{display:block;font-size:12px;font-weight:500;margin:0 0 6px;color:#a1a1aa}
input,textarea,select{width:100%;min-height:42px;border-radius:8px;border:1px solid #1f1f23;background:#0c0c0e;color:#f4f4f5;padding:0 14px;outline:0;font:inherit;font-size:14px;transition:border-color 0.15s ease, box-shadow 0.15s ease}
textarea{min-height:92px;padding:12px;resize:vertical}
input:focus,textarea:focus,select:focus{border-color:#55acee;box-shadow:0 0 0 3px rgba(85, 172, 238, 0.15)}
input[type=range] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 28px;
  background: transparent;
  cursor: pointer;
}
input[type=range]:focus {
  outline: none;
}
input[type=range]::-webkit-slider-runnable-track {
  width: 100%;
  height: 4px;
  background: #27272a;
  border-radius: 999px;
  border: none;
}
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ffffff;
  border: 1px solid #27272a;
  margin-top: -4px;
  transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
}
input[type=range]::-webkit-slider-thumb:hover {
  background: #55acee;
  border-color: #55acee;
  transform: scale(1.1);
}
input[type=range]::-moz-range-track {
  width: 100%;
  height: 4px;
  background: #27272a;
  border-radius: 999px;
  border: none;
}
input[type=range]::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ffffff;
  border: 1px solid #27272a;
  transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
}
input[type=range]::-moz-range-thumb:hover {
  background: #55acee;
  border-color: #55acee;
  transform: scale(1.1);
}
select{appearance:none}
.helpText2{color:#71717a;margin:0;font-size:12px;line-height:1.5}

.colorRow2{display:flex;gap:10px;align-items:center}
.colorInput2{width:44px;min-width:44px;height:40px;padding:0;border-radius:8px;border:1px solid #27272a;overflow:hidden}
.colorField2{padding:12px;border:1px solid #27272a;border-radius:8px;background:#09090b}
.colorField2 small{display:block;color:#71717a;margin-top:6px;line-height:1.4;font-size:12px}

.assetGrid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.cursorHelp2{min-height:120px;border:1px solid #27272a;border-radius:8px;background:#09090b;padding:16px;display:flex;flex-direction:column;justify-content:center;gap:7px}
.cursorHelp2 strong{font-size:13px;font-weight:500;color:#f4f4f5}
.cursorHelp2 small{color:#71717a;font-size:12px;line-height:1.5}
.assetCard2{background:#09090b;border:1px solid #27272a;border-radius:8px;padding:12px}
.assetTitle2{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px;font-size:13px}
.assetBox2{width:100%;height:120px;border:1px dashed #27272a;border-radius:8px;background:#09090b;color:#71717a;display:grid;place-items:center;gap:8px;overflow:hidden;cursor:pointer;font-size:12px;transition:border-color 0.15s ease}
.assetBox2:hover{border-color:#27272a}
.assetBox2 img,.assetBox2 video{width:100%;height:100%;object-fit:cover}

.pillBtn2,.ghostBtn,.primaryBtn,.tinyBtn2,.tinyIconBtn2{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:8px;font:inherit;font-weight:500;cursor:pointer;text-decoration:none;font-size:13px;transition:all 0.15s ease}
.pillBtn2{height:36px;padding:0 14px;border:1px solid #27272a;background:#09090b;color:#f4f4f5}
.pillBtn2:hover{border-color:#3f3f46}
.ghostBtn{height:36px;padding:0 14px;border:1px solid transparent;background:transparent;color:#71717a}
.ghostBtn:hover{color:#f4f4f5}
.primaryBtn{height:38px;padding:0 16px;border:1px solid transparent;background:#55acee;color:#09090b;font-weight:600}
.primaryBtn:hover{background:#6bb6f0}
.primaryBtn.soft{background:transparent;color:#55acee;border:1px solid #27272a;font-weight:500}
.primaryBtn.soft:hover{border-color:#55acee;background:#09090b}
.tinyBtn2{height:32px;padding:0 12px;border:1px solid #27272a;background:#09090b;color:#f4f4f5;font-size:12px}
.tinyBtn2.off{opacity:.6}
.tinyIconBtn2{width:32px;height:32px;border:1px solid #27272a;background:#09090b;color:#71717a;flex:none}
.tinyIconBtn2:hover{color:#ef4444;border-color:#27272a}

.completionBar2{height:6px;border-radius:999px;background:#27272a;overflow:hidden;margin-bottom:16px}
.completionBar2 span{display:block;height:100%;background:var(--site-accent)}
.checkGrid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.checkItem2{text-align:left;display:flex;gap:10px;align-items:center;padding:12px;border-radius:8px;border:1px solid #27272a;background:#09090b;color:#f4f4f5;cursor:pointer;transition:border-color 0.15s ease}
.checkItem2:hover{border-color:#3f3f46}
.checkItem2.done{border-color:#27272a}
.checkItem2 span{width:22px;height:22px;display:grid;place-items:center;border-radius:50%;background:#141416;border:1px solid #27272a;color:#71717a;flex:none}
.checkItem2.done span{background:#55acee;border-color:#55acee;color:#09090b}
.checkItem2 strong,.checkItem2 small{display:block}
.checkItem2 strong{font-size:13px;font-weight:500}
.checkItem2 small{color:#71717a;font-size:12px;margin-top:2px}
.missing2{margin-top:14px;padding:12px;border:1px solid #27272a;background:#09090b;border-radius:8px;font-size:13px}
.missing2 strong{color:#55acee;font-weight:500}
.missing2 p{margin:4px 0 0;color:#a1a1aa}

.quickAdd2,.tagList2{display:flex;flex-wrap:wrap;gap:8px}
.rows2{display:grid;gap:10px}
.linkRow2,.hostRow2,.templateRow2,.aliasRow2{display:flex;align-items:center;gap:10px}
.linkRow2{justify-content:space-between;padding:12px;border-radius:8px;background:#09090b;border:1px solid #27272a}
.linkMain2{display:grid;grid-template-columns:40px 150px minmax(0,1fr);gap:10px;align-items:center;flex:1;min-width:0}
.linkMain2 .spanLink2{grid-column:2 / span 2}
.linkIcon2{width:36px;height:36px;border-radius:6px;background:#050507;border:1px solid #18181b;display:grid;place-items:center;color:#71717a;overflow:hidden;flex:none}
.linkIcon2 img{width:100%;height:100%;object-fit:cover;aspect-ratio:1/1}
.linkActions2{display:flex;gap:8px;align-items:center}

.empty2{min-height:100px;border-radius:8px;border:1px dashed #27272a;background:#09090b;display:grid;place-items:center;color:#71717a;text-align:center;padding:16px;font-size:13px}
.moduleList2{display:grid;gap:8px}
.moduleBtn2{display:flex;justify-content:space-between;align-items:center;text-align:left;padding:12px;border-radius:8px;border:1px solid #27272a;background:#09090b;color:#f4f4f5;cursor:pointer;font-size:14px;transition:border-color 0.15s ease}
.moduleBtn2:hover{border-color:#3f3f46}
.moduleBtn2.active{border-color:#55acee}
.moduleBtn2 small{display:block;color:#71717a;margin-top:2px;font-size:12px}

.layoutCards2{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.layoutCards2 button{min-height:80px;border-radius:8px;border:1px solid #27272a;background:#09090b;color:#f4f4f5;text-align:left;padding:12px;cursor:pointer;font-size:14px;transition:border-color 0.15s ease}
.layoutCards2 button:hover{border-color:#3f3f46}
.layoutCards2 button.selected{border-color:#55acee}
.layoutCards2 small{display:block;color:#71717a;margin-top:4px;font-size:12px}

.metaPreview2{display:grid;gap:10px;padding:14px;border-radius:8px;background:#09090b;border:1px solid #27272a}
.metaPreview2 strong{font-size:18px;font-weight:500}
.metaPreview2 span,.metaPreview2 p{color:#71717a;font-size:13px}
.metaImage2{height:200px;border-radius:6px;background:#050507;border:1px solid #18181b;display:grid;place-items:center;overflow:hidden}
.metaImage2 img{width:100%;height:100%;object-fit:cover}

.toggleStack2{display:grid;gap:6px}
.toggle2{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 0}
.toggle2 span{font-weight:500;font-size:13px;color:#a1a1aa}
.toggle2 input{display:none}
.toggle2 i{width:40px;height:22px;background:#18181b;border:1px solid #27272a;border-radius:999px;position:relative;flex:none;transition:background-color 0.15s ease}
.toggle2 i:before{content:"";position:absolute;left:3px;top:3px;width:14px;height:14px;border-radius:50%;background:#52525b;transition:.15s}
.toggle2 input:checked+i{background:var(--site-accent);border-color:var(--site-accent)}
.toggle2 input:checked+i:before{left:21px;background:#fff}

.miniChart2{height:200px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px;align-items:end}
.miniBar2Wrap{height:100%;display:flex;align-items:flex-end}
.miniBar2{width:100%;border-radius:4px 4px 2px 2px;background:var(--site-accent);min-height:12px}

.badgeGrid2{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}
.badge2{display:flex;align-items:center;gap:12px;padding:12px;border-radius:6px;border:1px solid #27272a;background:#09090b;color:#f4f4f5;cursor:pointer;text-align:left;font-size:14px;transition:border-color 0.15s ease}
.badge2:hover{border-color:#27272a}
.badge2.on{border-color:#55acee}
.badge2.locked{opacity:.5;cursor:not-allowed}
.badge2 small{display:block;color:#71717a;font-size:12px;margin-top:2px}

.templateList2{display:grid;gap:10px}
.templateRow2{justify-content:space-between;padding:12px;border-radius:6px;border:1px solid #27272a;background:#09090b}
.templateThumb2{width:48px;height:48px;border-radius:8px;background:#09090b;border:1px solid #27272a;display:grid;place-items:center;color:#71717a;flex:none}
.templateRow2 p{margin:2px 0 0;color:#71717a;font-size:12px}
.hostTop2{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.hostList2{display:grid;gap:10px}
.hostRow2{padding:12px;border-radius:6px;border:1px solid #27272a;background:#09090b}
.hostRow2 img{width:72px;height:52px;border-radius:6px;object-fit:cover;flex:none}
.hostRow2 strong,.hostRow2 small{display:block}
.hostRow2 strong{font-size:14px;font-weight:500}
.hostRow2 small{color:#71717a;font-size:12px}

.tagsEditor2{display:grid;gap:10px}
.tagInputRow2{display:flex;gap:10px}
.tagChip2{height:30px;border-radius:8px;border:1px solid #27272a;background:#09090b;color:#a1a1aa;display:inline-flex;align-items:center;gap:6px;padding:0 10px;cursor:pointer;font-size:12px;font-weight:500}
.lockedBox2{padding:14px;border-radius:6px;border:1px solid #27272a;background:#09090b;font-size:13px}
.lockedBox2 p{color:#71717a;margin:0}

select{background:#09090b;padding-right:36px;border-color:#27272a}
select option{background:#09090b;color:#f4f4f5}
.linkedDiscordBox2{display:grid;grid-template-columns:36px minmax(0,1fr) auto;align-items:center;gap:12px;border:1px solid #27272a;background:#09090b;border-radius:6px;padding:12px}
.linkedDiscordBox2 strong,.linkedDiscordBox2 small{display:block}
.linkedDiscordBox2 strong{font-size:14px;font-weight:500}
.linkedDiscordBox2 small{color:#71717a;margin-top:2px;font-size:12px;word-break:break-all}
.linkedDiscordIcon2{width:36px;height:36px;border-radius:8px;background:#09090b;border:1px solid #27272a;display:grid;place-items:center;color:var(--site-accent)}
.audioCard2{grid-column:auto}
.audioCard2 .assetBox2 small{display:block;color:#71717a;font-size:11px}
.audioList2{display:grid;gap:8px;margin-top:10px}
.audioTrack2{display:grid;grid-template-columns:20px minmax(0,1fr) 32px;align-items:center;gap:8px;background:#09090b;border:1px solid #27272a;border-radius:6px;padding:6px}
.audioTrack2 span{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:#141416;border:1px solid #27272a;color:#55acee;font-size:11px;font-weight:600}
.audioTrack2 p{margin:0;color:#e4e4e7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px}

.discordFlow2{border:1px solid #27272a;background:#09090b;border-radius:6px;padding:16px;display:grid;gap:12px}
.discordFlow2 strong,.discordFlow2 small{display:block}
.discordFlow2 strong{font-size:14px;font-weight:500}
.discordFlow2 small{color:#71717a;margin-top:2px;font-size:12px;line-height:1.4}
.lockedInviteMini2{display:flex;align-items:center;gap:10px;border:1px solid #27272a;background:#09090b;border-radius:6px;padding:10px;color:#f4f4f5}
.lockedInviteMini2 svg{color:var(--site-accent);flex:none}
.lockedInviteMini2 b,.lockedInviteMini2 small{display:block;font-size:12px}
.lockedInviteMini2 b{font-weight:500}
.lockedInviteMini2 small{color:#71717a;word-break:break-all}
.discordFlowActions2{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center}
.linkImageDrop2{display:grid;grid-template-columns:36px minmax(0,1fr) 32px 32px;gap:10px;align-items:center;border:1px dashed #27272a;background:#09090b;border-radius:6px;padding:6px}
.linkImagePreview2{width:36px;height:36px;border-radius:6px;background:#09090b;border:1px solid #27272a;display:grid;place-items:center;overflow:hidden;color:#71717a;cursor:pointer}
.linkImagePreview2 img{width:100%;height:100%;object-fit:cover;aspect-ratio:1/1}

.selectWrap2{position:relative}
.selectButton2{width:100%;min-height:40px;border-radius:6px;border:1px solid #27272a;background:#09090b;color:#f4f4f5;padding:0 12px;display:flex;align-items:center;justify-content:space-between;gap:10px;font:inherit;font-weight:500;cursor:pointer;transition:border-color 0.15s ease}
.selectButton2:hover,.selectButton2.open{border-color:#55acee}
.selectButton2 span{text-transform:capitalize;font-size:14px}
.selectButton2 i{width:16px;height:16px;border-radius:50%;background:#09090b;position:relative;flex:none}
.selectButton2 i:after{content:"";position:absolute;left:5px;top:4px;width:5px;height:5px;border-right:1px solid #a1a1aa;border-bottom:1px solid #a1a1aa;transform:rotate(45deg);transition:.15s}
.selectButton2.open i:after{top:6px;transform:rotate(225deg)}
.selectMenu2{position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:80;padding:6px;border-radius:10px;border:1px solid #27272a;background:#141416;display:grid;gap:4px;overflow:hidden}
.selectMenu2 button{min-height:36px;border:0;border-radius:6px;background:transparent;color:#a1a1aa;text-align:left;padding:0 10px;font:inherit;font-weight:500;cursor:pointer;text-transform:capitalize;font-size:13px}
.selectMenu2 button:hover{background:#18181b;color:#f4f4f5}
.selectMenu2 button.selected{background:#09090b;color:#55acee}

.badgeHero2{background:#09090b;border:1px solid #27272a;border-radius:6px;padding:18px}
.badgeStatusBar2{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:12px;align-items:center}
.badgeStatusBar2>span{border-radius:999px;padding:6px 12px;font-weight:500;font-size:12px;border:1px solid #27272a}
.badgeStatusBar2 .ok{background:rgba(16,185,129,.06);border-color:rgba(16,185,129,.2);color:#10b981}
.badgeStatusBar2 .warn{background:rgba(85,172,238,.06);border-color:rgba(85,172,238,.2);color:#55acee}
.ownerPill2{background:rgba(245,158,11,.06)!important;border-color:rgba(245,158,11,.2)!important;color:#f59e0b!important}
.roleBadgeGrid2{margin-top:0}
.roleBadge2{cursor:default;display:grid!important;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;border-radius:6px;border:1px solid #27272a;background:#09090b;padding:12px}
.roleBadge2.locked{opacity:.5}
.roleBadge2.off{border-color:#27272a;background:#09090b;opacity:.8}
.roleBadge2 .badgeEmoji2{font-size:20px;line-height:1;filter:none;background:transparent!important;border:0!important}
.roleBadge2 strong{font-size:14px;font-weight:500;color:#f4f4f5}
.roleBadge2 small{line-height:1.4;color:#71717a;font-size:12px}
.badgeToggle2,.badgeLock2{height:30px;border-radius:6px;padding:0 10px;font-size:12px;font-weight:500;border:1px solid #27272a;background:#09090b;color:#a1a1aa;display:inline-flex;align-items:center;justify-content:center}
.badgeToggle2{cursor:pointer}
.badgeToggle2.enabled{border-color:rgba(16,185,129,.2);background:rgba(16,185,129,.06);color:#10b981}
.badgeToggle2.disabled{border-color:rgba(239,68,68,.2);background:rgba(239,68,68,.06);color:#ef4444}
.badgeLock2{opacity:.7}

.templateCreateGrid2{display:grid;grid-template-columns:300px minmax(0,1fr);gap:18px;align-items:start}
.templateGrid2{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
.templateCard2{background:#141416;border:1px solid #27272a;border-radius:6px;overflow:hidden;min-width:0}
.templateCover2{aspect-ratio:16/9;background:#09090b;display:grid;place-items:center;color:#71717a;overflow:hidden;border-bottom:1px solid #27272a}
.templateCover2 img{width:100%;height:100%;object-fit:cover}
.templateBody2{padding:14px;display:grid;gap:10px}
.templateBody2 strong{display:block;font-size:15px;font-weight:500;color:#f4f4f5}
.templateBody2 p{color:#71717a;margin:2px 0 0;font-size:12px;line-height:1.4}
.templateActions2{display:flex;gap:8px;align-items:center}
.templateActions2 .primaryBtn{flex:1}
.templateCreate2 .assetBox2{aspect-ratio:16/9;height:auto;min-height:150px}

.customBadgeCreator2{display:grid;grid-template-columns:64px minmax(0,1fr) 100px minmax(0,1fr) 36px auto;gap:12px;align-items:end;margin-bottom:16px}
.customBadgePreview2{width:64px;height:64px;border-radius:6px;border:1px dashed #18181b;background:#09090b;display:grid;place-items:center;cursor:pointer;overflow:hidden;font-size:24px}
.customBadgePreview2 img,.badgeEmoji2 img{width:100%;height:100%;object-fit:cover}
.roleBadge2 .badgeEmoji2{width:24px;height:24px;display:grid;place-items:center;overflow:hidden;border-radius:4px}
.customBadgeGrid2{margin-top:14px}
.customBadgeGrid2 .roleBadge2{grid-template-columns:24px minmax(0,1fr) auto auto}

.customizeShell2{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:32px;align-items:start}
.customizeControls2{display:grid;gap:16px;min-width:0}

.customizePreview2{min-width:0}
.customizePreviewSticky2{position:sticky;top:32px;background:#141416;border:1px solid #27272a;border-radius:10px;padding:16px;box-shadow:none}
.customizePreviewHead2{display:flex;justify-content:space-between;align-items:center;padding:4px 3px 12px}
.customizePreviewHead2 strong,.customizePreviewHead2 small{display:block}
.customizePreviewHead2 strong{font-size:15px;font-weight:500;color:#f4f4f5}
.customizePreviewHead2 small{color:#71717a;margin-top:2px;font-size:12px}
.customizePreviewHead2 a{width:32px;height:32px;border-radius:6px;background:#09090b;border:1px solid #27272a;display:grid;place-items:center;color:#71717a;transition:color 0.15s ease}
.customizePreviewHead2 a:hover{color:#f4f4f5}
.customizePreviewViewport2{height:auto;border-radius:6px;overflow:visible;border:1px solid #27272a;background:#09090b;display:flex;flex-direction:column}
.customizePreviewViewport2>*{flex:1;min-height:unset;width:100%;height:auto;overflow:visible}
.customizePreviewViewport2 .profile-page{min-height:unset;height:auto;padding:32px 16px;overflow:visible}
.customizePreviewViewport2 iframe{border:0}
.customizePreviewFooter2{display:flex;justify-content:space-between;color:#71717a;font-size:12px;padding:10px 4px 1px}
.customizePreviewFooter2 span:last-child{text-transform:capitalize;color:#a1a1aa}

.customizeShell2 .selectButton2{background:#09090b;border-radius:6px;min-height:40px;box-shadow:none}
.customizeShell2 .selectMenu2{border-radius:8px}
.customizeShell2 input,.customizeShell2 textarea{background:#09090b;border-color:#18181b}
.customizeShell2 .toggle2 i{background:#18181b}
.customizeShell2 .toggle2 input:checked+i{background:#55acee;border-color:#55acee}
.customizeShell2 input[type=range]{accent-color:#55acee}
.customizeShell2 .primaryBtn.soft{background:transparent;border-color:#27272a;color:#55acee}

.mobileTabs2{display:none}
.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
.avatar2{width:40px;height:40px;background:#09090b;border:1px solid #27272a;color:#a1a1aa;display:grid;place-items:center;overflow:hidden;flex:none}
.avatar2 img{width:100%;height:100%;object-fit:cover}
.avatar2.circle{border-radius:50%}.avatar2.rounded{border-radius:6px}.avatar2.square{border-radius:4px}
.avatar2.hexagon{clip-path:polygon(25% 5%,75% 5%,100% 50%,75% 95%,25% 95%,0 50%)}
.avatar2.star{clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)}

@media (max-width:1320px){.customizeShell2{grid-template-columns:minmax(0,1fr) 320px}.customizePreviewViewport2{height:auto}}
@media (max-width:1080px){
  .customizeShell2{grid-template-columns:1fr}
  .customizePreviewSticky2{position:relative;top:auto}
  .customizePreviewViewport2{height:auto}
  .gunSection2 {
    display: block;
  }
}
@media (max-width:1180px){
  .card2 {
    display: block;
  }
  .customBadgeCreator2{grid-template-columns:1fr}
  .customBadgePreview2{width:100%;height:90px}
  .customBadgeGrid2 .roleBadge2{grid-template-columns:24px minmax(0,1fr)}
  .stats4{grid-template-columns:repeat(2,minmax(0,1fr))}
  .split2{grid-template-columns:1fr}
}
@media (max-width:900px){
  .dash2{grid-template-columns:1fr}
  .side2{display:none}
  .main2{padding:24px}
  .mobileTabs2{display:block;margin-bottom:16px}
  .stats4{grid-template-columns:1fr}
   .previewBox2{height:auto}
  .gunAssetGrid2,.gunGeneralGrid2,.gunColorGrid2{grid-template-columns:1fr}
}
`;

function PremiumTab() {
  return (
    <div className="stack2">
      <section className="card2">
        <div className="cardHead2">
          <h2>Premium Perks</h2>
          <p>Unlock features, badges, and OGs with Premium upgrades.</p>
        </div>
        <div style={{ display: "grid", gap: 20 }}>
          <div style={{ padding: 18, background: "#09090b", border: "1px solid #27272a", borderRadius: 8, display: "flex", flexDirection: "column", gap: 14 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#f4f4f5", margin: 0 }}>Unlocks &amp; Handles</h3>
            <p style={{ color: "#71717a", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
              By default, all 1-character and 2-character usernames are locked under our Premium plans. Some common gaming/tech OGs are also reserved. You can purchase them on the Marketplace or get access badges here.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
              <a className="primaryBtn" href="/marketplace" style={{ textDecoration: "none", height: 36, minHeight: "unset", fontSize: 13, padding: "0 16px" }}>
                Visit Marketplace
              </a>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#a855f7", marginBottom: 8 }}>
                <Gem size={16} />
                <strong style={{ fontSize: 14 }}>Premium Badges</strong>
              </div>
              <p style={{ color: "#71717a", fontSize: 12, lineHeight: 1.4, margin: 0 }}>
                Get custom roles on our Discord server to display Donor, Supporter, and OG badges on your public bio link.
              </p>
            </div>
            <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#55acee", marginBottom: 8 }}>
                <Brush size={16} />
                <strong style={{ fontSize: 14 }}>Visual Styles</strong>
              </div>
              <p style={{ color: "#71717a", fontSize: 12, lineHeight: 1.4, margin: 0 }}>
                Access interactive screen effects (like matrix glow, snow, rain, and CRT TV filters) along with custom cursor tracking.
              </p>
            </div>
            <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#fb7185", marginBottom: 8 }}>
                <Music size={16} />
                <strong style={{ fontSize: 14 }}>Media Integrations</strong>
              </div>
              <p style={{ color: "#71717a", fontSize: 12, lineHeight: 1.4, margin: 0 }}>
                Upload multiple background audio tracks, configure Spotify cover cards, and link your live Github profile status.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ImageHostTab({ p }: { p: Profile }) {
  const [images, setImages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  const loadImages = async () => {
    try {
      const { data, error } = await supabase
        .from("hosted_images")
        .select("*")
        .eq("user_id", p.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setImages(data || []);
    } catch (e: any) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      await uploadHostedImage(p.id, file);
      await loadImages();
    } catch (err: any) {
      setError(err.message || "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (img: any) => {
    if (!window.confirm("Are you sure you want to delete this hosted image?")) return;
    try {
      await deleteHostedImage(img.path, img.id);
      await loadImages();
    } catch (err: any) {
      alert(err.message || "Failed to delete image.");
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="stack2">
      <section className="card2">
        <div className="cardHead2">
          <h2>Image Host</h2>
          <p>Upload and host custom assets to use on your bio card or links.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {error && <div style={{ color: "#ef4444", fontSize: 13 }}>{error}</div>}
          <label className="uploadArea2" style={{ cursor: uploading ? "not-allowed" : "pointer" }}>
            <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} style={{ display: "none" }} />
            {uploading ? (
              <Loader2 className="spinner spin" size={24} />
            ) : (
              <Upload size={24} style={{ color: "#a1a1aa", marginBottom: 8 }} />
            )}
            <strong style={{ display: "block", marginTop: 4 }}>{uploading ? "Uploading image..." : "Upload hosted image"}</strong>
            <small style={{ color: "#71717a", fontSize: 12 }}>Supports PNG, JPG, WEBP, GIF. Max 5MB.</small>
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginTop: 12 }}>
            {images.map((img) => (
              <div key={img.id} className="hostedCard" style={{ background: "#141416", border: "1px solid #27272a", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ width: "100%", height: 120, background: "#09090b", borderRadius: 6, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#f4f4f5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{img.name}</div>
                  <div style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>{formatSize(img.size)}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" className="primaryBtn soft" style={{ flex: 1, padding: "6px 0", fontSize: 12, height: "auto", minHeight: "unset" }} onClick={() => {
                    navigator.clipboard.writeText(img.url);
                    alert("Public URL copied to clipboard!");
                  }}>Copy URL</button>
                  <button type="button" className="dangerBtn" style={{ padding: "6px 10px", fontSize: 12, height: "auto", minHeight: "unset", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444", cursor: "pointer", borderRadius: 6 }} onClick={() => handleDelete(img)}>Delete</button>
                </div>
              </div>
            ))}
          </div>

          {images.length === 0 && !uploading && (
            <div className="empty2">No hosted images yet. Upload one above to get started!</div>
          )}
        </div>
      </section>
    </div>
  );
}
