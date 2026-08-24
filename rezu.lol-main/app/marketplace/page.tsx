import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MARKETPLACE_BADGES } from "@/lib/constants";
import MarketplaceClient from "./MarketplaceClient";

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/marketplace");
  }

  // Get user's purchased usernames
  const { data: purchased } = await supabase
    .from("purchased_usernames")
    .select("username")
    .eq("user_id", user.id);

  const myUsernames = (purchased || []).map((p: any) => String(p.username));

  // Get user's owned badges and discord_id from profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("owned_badges, discord_id")
    .eq("id", user.id)
    .maybeSingle();

  const myBadges = Array.isArray(profile?.owned_badges)
    ? profile.owned_badges.map(String)
    : [];

  return (
    <MarketplaceClient
      userId={user.id}
      discordId={profile?.discord_id || null}
      myUsernames={myUsernames}
      myBadges={myBadges}
      availableBadges={MARKETPLACE_BADGES.map((b) => ({ id: b.id, name: b.name, icon: b.icon }))}
    />
  );
}
