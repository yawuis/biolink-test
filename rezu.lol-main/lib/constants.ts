export const BACKGROUNDS: Record<string, string> = {
  midnight: "radial-gradient(circle at 20% 20%, rgba(225,29,47,.18), #05050a 60%)",
  ember: "radial-gradient(circle at 80% 10%, #2e0b1a, #0a0505 60%)",
  abyss: "radial-gradient(circle at 50% 0%, #0b1f2e, #05080a 60%)",
  void: "radial-gradient(circle at 50% 50%, #14141c, #050507 70%)",
};

export const EFFECTS = ["none", "particles", "glow", "snow", "rain"] as const;
export const CURSORS = ["none", "trail", "dot", "particles"] as const;
export const LAYOUTS = ["classic", "portfolio", "scroll", "compact", "minimal", "banner"] as const;
export const AVATAR_SHAPES = ["circle", "rounded", "square", "hexagon", "star"] as const;
export const FONTS = ["Inter", "Space Grotesk", "Outfit", "Poppins", "JetBrains Mono"] as const;

export const MODULE_META: Record<string, string> = {
  about: "About Me",
  discord: "Discord presence",
  github: "GitHub presence",
  spotify: "Spotify track",
  clock: "Local time",
};
export const ALL_MODULES = ["about", "discord", "github", "spotify", "clock"];

export const DEFAULT_ACCENT = "#e11d2f";
export const SITE_NAME = "rezu.lol";
export const DISCORD_INVITE_URL = "https://discord.gg/rezu";

export const USERNAME_RE = /^[a-z0-9_]{1,20}$/;

export type LinkItem = { id: number; platform: string; url: string; label?: string; hidden?: boolean; image_url?: string };
export type AudioTrack = { id: number; url: string; name?: string };
export type BadgeItem = { id: string; name: string; icon: string; enabled?: boolean; image_url?: string; custom?: boolean; monoIcon?: string };
export type AliasItem = { id: number; value: string };
export type HostedImage = {
  id: string;
  user_id: string;
  url: string;
  path: string;
  name: string;
  size?: number;
  created_at?: string;
};

export type Profile = {
  id?: string;
  username: string;
  display_name: string;
  bio: string;
  accent: string;
  bg: string;
  avatar_url: string;
  background_url: string;
  audio_url: string;
  audio_tracks?: AudioTrack[];
  audio_shuffle?: boolean;
  effect: string;
  cursor_effect: string;
  custom_cursor_url?: string;
  enter_text: string;
  links: LinkItem[];
  views: number;
  like_count?: number;
  created_at?: string;
  public_uid?: number;

  layout: string;
  discord_id: string;
  discord_enabled?: boolean;
  discord_invite_url?: string;
  github_user: string;
  timezone: string;
  skills: string[];
  modules: string[];

  alias?: string;
  hide_alias?: boolean;
  aliases?: AliasItem[];
  badges?: BadgeItem[];
  owned_badges?: string[];
  text_color?: string;
  icon_color?: string;
  link_color?: string;
  background_color?: string;
  primary_color?: string;
  secondary_color?: string;
  background_effect_color?: string;
  profile_opacity?: number;
  profile_blur?: number;
  avatar_shape?: string;
  location?: string;
  pronouns?: string;
  font?: string;
  profile_animation?: string;
  background_effect?: string;
  username_effect?: string;
  profile_gradient?: boolean;
  monochrome_icons?: boolean;
  animated_title?: boolean;
  use_discord_avatar?: boolean;
  swap_box_colors?: boolean;
  discord_avatar_decoration?: boolean;
  badges_glow?: boolean;
  hide_views?: boolean;
  hide_likes?: boolean;
  hide_join_date?: boolean;
  search_indexing?: boolean;
  website_title?: string;
  website_description?: string;
  website_image_url?: string;
  favicon_url?: string;
  add_user_info_overlay?: boolean;
  spotify_title?: string;
  spotify_artist?: string;
  spotify_url?: string;
  spotify_cover_url?: string;
};

export const DEFAULT_PROFILE_EXTRAS: Partial<Profile> = {
  display_name: "",
  bio: "",
  accent: DEFAULT_ACCENT,
  bg: "midnight",
  avatar_url: "",
  background_url: "",
  audio_url: "",
  audio_tracks: [],
  audio_shuffle: false,
  effect: "none",
  cursor_effect: "none",
  custom_cursor_url: "",
  enter_text: "click to enter",
  links: [],
  views: 0,
  like_count: 0,
  layout: "classic",
  discord_id: "",
  discord_enabled: false,
  discord_invite_url: DISCORD_INVITE_URL,
  github_user: "",
  timezone: "",
  skills: [],
  modules: ["about", "discord", "github", "spotify", "clock"],
  alias: "",
  hide_alias: false,
  aliases: [],
  badges: [],
  text_color: "#ffffff",
  icon_color: "#ffffff",
  link_color: "#ffffff",
  background_color: "#000000",
  primary_color: "#000000",
  secondary_color: "#ffffff",
  background_effect_color: "#ffffff",
  profile_opacity: 70,
  profile_blur: 22,
  avatar_shape: "circle",
  location: "",
  pronouns: "",
  font: "Inter",
  profile_animation: "unfold",
  background_effect: "blurred",
  username_effect: "none",
  profile_gradient: false,
  monochrome_icons: true,
  animated_title: true,
  use_discord_avatar: false,
  swap_box_colors: true,
  discord_avatar_decoration: false,
  badges_glow: true,
  hide_views: false,
  hide_likes: false,
  hide_join_date: false,
  search_indexing: true,
  website_title: "",
  website_description: "",
  website_image_url: "",
  favicon_url: "",
  add_user_info_overlay: true,
  spotify_title: "",
  spotify_artist: "",
  spotify_url: "",
  spotify_cover_url: "",
};

export const OWNER_ROLE_ID = "1541313064161517598";
export const CUSTOM_BADGE_CREATOR_ROLE_ID = "1541313074303205448";

export const DISCORD_ROLE_BADGES = [
  { id: "owner", name: "Owner", icon: "👑", monoIcon: "♛", roleId: "1541313064161517598" },
  { id: "staff", name: "Staff", icon: "🛠️", monoIcon: "⚒", roleId: "1541313064446464051" },
  { id: "helper", name: "Helper", icon: "💡", monoIcon: "●", roleId: "1541313065553891349" },
  { id: "verified", name: "Verified", icon: "☑️", monoIcon: "✓", roleId: "1541313066463928431" },
  { id: "premium", name: "Premium", icon: "💎", monoIcon: "◆", roleId: "1541313066858319876" },
  { id: "donor", name: "Donor", icon: "💰", monoIcon: "$", roleId: "1541313068020142161" },
  { id: "og", name: "OG", icon: "🧍", monoIcon: "♟", roleId: "1541313069052067840" },
  { id: "rich", name: "Rich", icon: "🚀", monoIcon: "✦", roleId: "1541313070188724224" },
  { id: "bug", name: "Bug Hunter", icon: "🐛", monoIcon: "✱", roleId: "1541313072155856926" },
  { id: "winner", name: "Winner", icon: "🏆", monoIcon: "★", roleId: "1541313072805842964" },
  { id: "early", name: "Early Supporter", icon: "💸", monoIcon: "◈", roleId: "1541313073166422117" },
] as const;

export const FOUNDING_100_BADGE: BadgeItem = {
  id: "founding100",
  name: "Founding 100",
  icon: "🎉",
  monoIcon: "✦",
  enabled: true,
};

export const STOCK_BADGES: BadgeItem[] = [
  ...DISCORD_ROLE_BADGES.map(({ id, name, icon, monoIcon }) => ({ id, name, icon, monoIcon })),
  FOUNDING_100_BADGE,
];

export function milestoneBadgesForProfile(profile: Pick<Profile, "public_uid">): BadgeItem[] {
  const uid = Number(profile.public_uid || 0);
  return uid > 0 && uid < 200 ? [{ ...FOUNDING_100_BADGE }] : [];
}

export function badgesFromDiscordRoleIds(roleIds: string[]): BadgeItem[] {
  const roles = new Set((roleIds || []).map(String));
  if (roles.has(OWNER_ROLE_ID)) {
    return DISCORD_ROLE_BADGES.map(({ id, name, icon, monoIcon }) => ({ id, name, icon, monoIcon, enabled: true }));
  }
  return DISCORD_ROLE_BADGES
    .filter((badge) => roles.has(badge.roleId))
    .map(({ id, name, icon, monoIcon }) => ({ id, name, icon, monoIcon, enabled: true }));
}

export const PREMIUM_3_LETTER_USERNAMES = new Set([
  "dev", "vip", "ceo", "lol", "app", "bot", "btc", "eth", "sol", "nft", 
  "pro", "fun", "wtf", "wow", "god", "sad", "bad", "run", "fly", "win", 
  "out", "new", "old", "use", "get", "set", "key", "api", "web", "dns", 
  "git", "hub", "sql", "pay", "usd", "ltd", "gem", "one", "yes", "top"
]);

export function isPremiumUsername(username: string): boolean {
  const len = (username || "").trim().length;
  if (len === 1 || len === 2) return true;
  if (len === 3) return PREMIUM_3_LETTER_USERNAMES.has(username.toLowerCase().trim());
  return false;
}

export const MARKETPLACE_BADGES: BadgeItem[] = [
  { id: "gold_crown", name: "Gold Crown", icon: "👑", custom: true },
  { id: "star_player", name: "Star Player", icon: "⭐", custom: true },
  { id: "flame_active", name: "On Fire", icon: "🔥", custom: true },
  { id: "shield_protect", name: "Shield", icon: "🛡️", custom: true },
  { id: "gem_collector", name: "Gem Collector", icon: "💎", custom: true },
  { id: "heart_supporter", name: "Supporter", icon: "❤️", custom: true },
];

export const MARKETPLACE_PRICES: Record<string, number> = {
  username_1_letter: 199.00,
  username_2_letter: 99.00,
  username_3_letter: 49.00,
  gold_crown: 15.00,
  star_player: 10.00,
  flame_active: 8.00,
  shield_protect: 5.00,
  gem_collector: 12.00,
  heart_supporter: 3.00,
};

