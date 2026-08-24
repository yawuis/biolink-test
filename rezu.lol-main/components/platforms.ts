import {
  Github,
  Twitter,
  Instagram,
  Youtube,
  Twitch,
  Globe,
  Send,
  MessageCircle,
  Music,
  Gamepad2,
  DollarSign,
  Mail,
  Linkedin,
  Link as LinkIcon,
  type LucideIcon,
} from "lucide-react";

export type PlatformMeta = {
  icon: LucideIcon;
  label: string;
  placeholder?: string;
  brandSlug?: string;
  brandColor?: string;
};

export const PLATFORMS: Record<string, PlatformMeta> = {
  discord: { icon: MessageCircle, label: "Discord", placeholder: "discord.gg/YGz8v9pvyy", brandSlug: "discord", brandColor: "#5865F2" },
  youtube: { icon: Youtube, label: "YouTube", placeholder: "youtube.com/@you", brandSlug: "youtube", brandColor: "#FF0000" },
  github: { icon: Github, label: "GitHub", placeholder: "github.com/you", brandSlug: "github", brandColor: "#ffffff" },
  spotify: { icon: Music, label: "Spotify", placeholder: "open.spotify.com/...", brandSlug: "spotify", brandColor: "#1DB954" },
  instagram: { icon: Instagram, label: "Instagram", placeholder: "instagram.com/you", brandSlug: "instagram", brandColor: "#E4405F" },
  twitter: { icon: Twitter, label: "X / Twitter", placeholder: "x.com/you", brandSlug: "x", brandColor: "#ffffff" },
  tiktok: { icon: Music, label: "TikTok", placeholder: "tiktok.com/@you", brandSlug: "tiktok", brandColor: "#ffffff" },
  telegram: { icon: Send, label: "Telegram", placeholder: "t.me/you", brandSlug: "telegram", brandColor: "#26A5E4" },
  soundcloud: { icon: Music, label: "SoundCloud", placeholder: "soundcloud.com/you", brandSlug: "soundcloud", brandColor: "#FF5500" },
  paypal: { icon: DollarSign, label: "PayPal", placeholder: "paypal.me/you", brandSlug: "paypal", brandColor: "#003087" },
  twitch: { icon: Twitch, label: "Twitch", placeholder: "twitch.tv/you", brandSlug: "twitch", brandColor: "#9146FF" },
  roblox: { icon: Gamepad2, label: "Roblox", placeholder: "roblox.com/users/...", brandSlug: "roblox", brandColor: "#ffffff" },
  cashapp: { icon: DollarSign, label: "Cash App", placeholder: "cash.app/$you", brandSlug: "cashapp", brandColor: "#00D632" },
  venmo: { icon: DollarSign, label: "Venmo", placeholder: "venmo.com/u/you", brandSlug: "venmo", brandColor: "#008CFF" },
  playstation: { icon: Gamepad2, label: "PlayStation", placeholder: "profile.playstation.com/...", brandSlug: "playstation", brandColor: "#0070D1" },
  xbox: { icon: Gamepad2, label: "Xbox", placeholder: "xbox.com/...", brandSlug: "xbox", brandColor: "#107C10" },
  gitlab: { icon: Github, label: "GitLab", placeholder: "gitlab.com/you", brandSlug: "gitlab", brandColor: "#FC6D26" },
  reddit: { icon: MessageCircle, label: "Reddit", placeholder: "reddit.com/u/you", brandSlug: "reddit", brandColor: "#FF4500" },
  vk: { icon: Globe, label: "VK", placeholder: "vk.com/you", brandSlug: "vk", brandColor: "#0077FF" },
  bluesky: { icon: Globe, label: "Bluesky", placeholder: "bsky.app/profile/you", brandSlug: "bluesky", brandColor: "#0285FF" },
  linkedin: { icon: Linkedin, label: "LinkedIn", placeholder: "linkedin.com/in/you", brandSlug: "linkedin", brandColor: "#0A66C2" },
  steam: { icon: Gamepad2, label: "Steam", placeholder: "steamcommunity.com/id/you", brandSlug: "steam", brandColor: "#ffffff" },
  pinterest: { icon: LinkIcon, label: "Pinterest", placeholder: "pinterest.com/you", brandSlug: "pinterest", brandColor: "#BD081C" },
  email: { icon: Mail, label: "Email", placeholder: "mailto:you@example.com", brandSlug: "gmail", brandColor: "#EA4335" },
  website: { icon: Globe, label: "Custom URL", placeholder: "example.com" },
};
