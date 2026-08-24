"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DISCORD_INVITE_URL, OWNER_ROLE_ID, USERNAME_RE, type Profile } from "@/lib/constants";


async function userHasOwnerDiscordRole(discordId?: string) {
  const id = String(discordId || "").replace(/[^0-9]/g, "");
  const base = process.env.DISCORD_PRESENCE_API_URL;
  const key = process.env.DISCORD_PRESENCE_API_KEY;
  if (!id || !base) return false;

  try {
    const url = new URL(`/presence/${id}`, base.endsWith("/") ? base : `${base}/`);
    const res = await fetch(url, { headers: key ? { "x-api-key": key } : {}, cache: "no-store" });
    if (!res.ok) return false;
    const data = await res.json();
    const roles = Array.isArray(data?.member?.roles)
      ? data.member.roles.map(String)
      : Array.isArray(data?.roles)
        ? data.roles.map(String)
        : [];
    return roles.includes(OWNER_ROLE_ID);
  } catch {
    return false;
  }
}

function sanitizeBadges(input: any[], canUseCustomBadges: boolean) {
  if (!Array.isArray(input)) return [];
  return input
    .filter((badge) => badge && typeof badge.id === "string")
    .filter((badge) => canUseCustomBadges || !badge.id.startsWith("custom-"))
    .map((badge) => ({
      id: String(badge.id).slice(0, 80),
      name: String(badge.name || "Badge").slice(0, 40),
      icon: String(badge.icon || "⭐").slice(0, 16),
      image_url: typeof badge.image_url === "string" ? badge.image_url.slice(0, 500) : "",
      custom: badge.id.startsWith("custom-") || !!badge.custom,
      enabled: badge.enabled !== false,
      monoIcon: typeof badge.monoIcon === "string" ? badge.monoIcon.slice(0, 8) : undefined,
    }))
    .slice(0, 40);
}

function cleanUsername(value?: string) {
  return (value || "").toLowerCase().trim();
}

function cleanAlias(value?: string) {
  const alias = (value || "").toLowerCase().trim();
  return alias || null;
}

export async function saveProfile(data: Partial<Profile>) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };
  const isOwner = user.email?.toLowerCase() === "brallowjillow@gmail.com";

  const username = cleanUsername(data.username);
  const alias = cleanAlias(data.alias);

  if (!USERNAME_RE.test(username)) {
    return { error: "Username must be 1-20 characters and only use lowercase letters, numbers, or underscore." };
  }
  if (alias && !USERNAME_RE.test(alias)) {
    return { error: "Alias must be 1-20 characters and only use lowercase letters, numbers, or underscore." };
  }

  const { data: current } = await supabase
    .from("profiles")
    .select("id, username, alias, discord_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!current) return { error: "Profile not found" };

  if (alias && alias === username) {
    return { error: "Your alias cannot be the same as your username." };
  }

  if (username !== String(current.username).toLowerCase()) {
    const { data: taken } = await supabase
      .from("profiles")
      .select("id")
      .or(`username.eq.${username},alias.eq.${username}`)
      .neq("id", user.id)
      .maybeSingle();
    if (taken) return { error: "That username is already taken as a username or alias." };
  }

  if (alias) {
    const { data: takenAlias } = await supabase
      .from("profiles")
      .select("id")
      .or(`username.eq.${alias},alias.eq.${alias}`)
      .neq("id", user.id)
      .maybeSingle();
    if (takenAlias) return { error: "That alias is already taken as a username or alias." };
  }

  const hasOwnerDiscordRole = await userHasOwnerDiscordRole((current as any).discord_id);
  const canUseCustomBadges = isOwner || hasOwnerDiscordRole;
  const safeBadges = sanitizeBadges(Array.isArray(data.badges) ? data.badges : [], canUseCustomBadges);

  const payload = {
    username,
    alias,
    hide_alias: data.hide_alias,
    display_name: data.display_name,
    bio: data.bio,
    accent: data.accent,
    bg: data.bg,
    avatar_url: data.avatar_url,
    background_url: data.background_url,
    audio_url: data.audio_url,
    audio_tracks: data.audio_tracks,
    audio_shuffle: data.audio_shuffle,
    effect: data.effect,
    cursor_effect: data.cursor_effect,
    custom_cursor_url: data.custom_cursor_url,
    enter_text: data.enter_text,
    links: data.links,
    layout: data.layout,
    // Security: never trust client-submitted Discord IDs from the dashboard.
    // Discord can only be linked through the Discord OAuth setup page.
    discord_enabled: data.discord_enabled,
    discord_invite_url: DISCORD_INVITE_URL,
    github_user: data.github_user,
    skills: data.skills,
    modules: data.modules,
    badges: safeBadges,
    text_color: data.text_color,
    icon_color: data.icon_color,
    link_color: data.link_color,
    background_color: data.background_color,
    primary_color: data.primary_color,
    secondary_color: data.secondary_color,
    background_effect_color: data.background_effect_color,
    profile_opacity: data.profile_opacity,
    profile_blur: data.profile_blur,
    avatar_shape: data.avatar_shape,
    location: data.location,
    pronouns: data.pronouns,
    font: data.font,
    profile_animation: data.profile_animation,
    background_effect: data.background_effect,
    username_effect: data.username_effect,
    profile_gradient: data.profile_gradient,
    monochrome_icons: data.monochrome_icons,
    animated_title: data.animated_title,
    use_discord_avatar: data.use_discord_avatar,
    swap_box_colors: data.swap_box_colors,
    discord_avatar_decoration: data.discord_avatar_decoration,
    badges_glow: data.badges_glow,
    hide_views: data.hide_views,
    hide_likes: data.hide_likes,
    hide_join_date: data.hide_join_date,
    search_indexing: data.search_indexing,
    website_title: data.website_title,
    website_description: data.website_description,
    website_image_url: data.website_image_url,
    favicon_url: data.favicon_url,
    add_user_info_overlay: data.add_user_info_overlay,
    spotify_title: data.spotify_title,
    spotify_artist: data.spotify_artist,
    spotify_url: data.spotify_url,
    spotify_cover_url: data.spotify_cover_url,
  };

  const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath(`/${username}`);
  return { ok: true };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
