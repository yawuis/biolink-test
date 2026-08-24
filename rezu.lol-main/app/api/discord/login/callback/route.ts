import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

function fail(message: string) {
  return NextResponse.redirect(`${getSiteUrl()}/login?error=${encodeURIComponent(message)}`);
}

async function findLegacyDiscordUser(admin: ReturnType<typeof createAdminClient>, discordId: string) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return null;
    const match = data.users.find((user: any) => {
      const identities = Array.isArray(user?.identities) ? user.identities : [];
      return identities.some((identity: any) =>
        identity?.provider === "discord" &&
        String(identity?.identity_data?.sub || identity?.identity_data?.id || identity?.id || "") === discordId
      );
    });
    if (match) return match;
    if (data.users.length < 1000) break;
  }
  return null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const savedState = cookies().get("rezu_discord_login_state")?.value;
  cookies().delete("rezu_discord_login_state");

  if (!code || !state || !savedState || state !== savedState) return fail("Discord login expired. Please try again.");

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail("Discord login is not configured.");

  const redirectUri = `${getSiteUrl()}/api/discord/login/callback`;
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
    cache: "no-store",
  });
  if (!tokenRes.ok) return fail("Discord could not verify your login. Try again.");

  const token = await tokenRes.json();
  const meRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${token.access_token}` },
    cache: "no-store",
  });
  if (!meRes.ok) return fail("Discord account lookup failed.");
  const discordUser = await meRes.json();
  const discordId = String(discordUser?.id || "");
  if (!/^\d{16,22}$/.test(discordId)) return fail("Discord returned an invalid account ID.");

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return fail("Discord recovery is not configured on the server.");
  }

  let { data: profile } = await admin
    .from("profiles")
    .select("id, username, discord_id")
    .eq("discord_id", discordId)
    .maybeSingle();

  // Legacy recovery: older accounts may have been created with Discord auth
  // before rezu stored discord_id on the profile. Find the Supabase Discord
  // identity and repair that link automatically.
  if (!profile) {
    const legacyUser = await findLegacyDiscordUser(admin, discordId);
    if (legacyUser) {
      const { data: legacyProfile } = await admin.from("profiles").select("id, username, discord_id").eq("id", legacyUser.id).maybeSingle();
      if (legacyProfile) {
        if (!legacyProfile.discord_id) {
          const repaired = await admin.from("profiles").update({ discord_id: discordId, discord_enabled: true }).eq("id", legacyProfile.id).select("id, username, discord_id").maybeSingle();
          if (!repaired.error) profile = repaired.data;
        } else if (legacyProfile.discord_id === discordId) {
          profile = legacyProfile;
        }
      }
    }
  }

  if (!profile?.id) {
    return fail("That Discord account is not linked to a sob.lol profile yet. Sign in with email once, then link Discord in Settings.");
  }

  const { data: userResult, error: userError } = await admin.auth.admin.getUserById(profile.id);
  const email = userResult?.user?.email;
  if (userError || !email) return fail("We found the profile, but could not restore its login.");

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const tokenHash = (linkData as any)?.properties?.hashed_token;
  if (linkError || !tokenHash) return fail("Could not create a secure login session.");

  const supabase = createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
  if (verifyError) return fail("Could not finish Discord login. Please try again.");

  return NextResponse.redirect(`${getSiteUrl()}/dashboard`);
}
