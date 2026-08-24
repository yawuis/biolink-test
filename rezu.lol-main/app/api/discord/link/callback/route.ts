import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DISCORD_INVITE_URL } from "@/lib/constants";
import { getSiteUrl } from "@/lib/site-url";

function authOrigin(request: NextRequest) {
  const host = request.nextUrl.hostname;
  if (host === "localhost" || host === "127.0.0.1") return request.nextUrl.origin;
  return getSiteUrl();
}

function back(request: NextRequest, params: Record<string, string>) {
  const url = new URL("/dashboard/discord-presence", authOrigin(request));
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const res = NextResponse.redirect(url);
  res.cookies.set("rezu_discord_link_state", "", { path: "/", maxAge: 0 });
  return res;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = request.cookies.get("rezu_discord_link_state")?.value;

  if (!code) return back(request, { error: "Discord did not return a code. Try again." });
  if (!state || !storedState || state !== storedState) {
    return back(request, { error: "Discord link session expired. Try again." });
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return back(request, { error: "Discord linking is not configured yet." });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return back(request, { error: "Log in to your rezu.lol account first, then link Discord." });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, discord_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return NextResponse.redirect(new URL("/claim", authOrigin(request)));

  const redirectUri = `${authOrigin(request)}/api/discord/link/callback`;

  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) return back(request, { error: "Discord rejected the link request. Check the redirect URL and try again." });
  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;
  if (!accessToken) return back(request, { error: "Discord did not return an access token." });

  const meRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!meRes.ok) return back(request, { error: "Could not read your Discord account." });
  const me = await meRes.json();
  const discordId = String(me.id || "").replace(/[^0-9]/g, "");
  if (!discordId) return back(request, { error: "Could not read your Discord ID." });

  const { data: existing } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("discord_id", discordId)
    .neq("id", user.id)
    .maybeSingle();

  if (existing) {
    return back(request, { error: `That Discord is already linked to @${existing.username}.` });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ discord_id: discordId, discord_enabled: true, discord_invite_url: DISCORD_INVITE_URL })
    .eq("id", user.id);

  if (error) return back(request, { error: error.message });
  return back(request, { linked: "1" });
}
