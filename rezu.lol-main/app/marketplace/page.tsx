import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MARKETPLACE_BADGES } from "@/lib/constants";
import MarketplaceClient from "./MarketplaceClient";

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const myUsernames: string[] = [];
  const myBadges: string[] = [];
  let discordId: string | null = null;

  if (user) {
    const { data: purchased } = await supabase
      .from("purchased_usernames")
      .select("username")
      .eq("user_id", user.id);
    if (purchased) {
      myUsernames.push(...purchased.map((p: any) => String(p.username)));
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("owned_badges, discord_id")
      .eq("id", user.id)
      .maybeSingle();
    if (profile) {
      discordId = profile.discord_id || null;
      if (Array.isArray(profile.owned_badges)) {
        myBadges.push(...profile.owned_badges.map(String));
      }
    }
  }

  return (
    <MarketplaceClient
      userId={user?.id || null}
      discordId={discordId}
      myUsernames={myUsernames}
      myBadges={myBadges}
      availableBadges={MARKETPLACE_BADGES.map((b) => ({ id: b.id, name: b.name, icon: b.icon }))}
    />
  );
}
