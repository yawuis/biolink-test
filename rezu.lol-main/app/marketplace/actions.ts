"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isPremiumUsername, MARKETPLACE_BADGES, MARKETPLACE_PRICES } from "@/lib/constants";

export async function purchaseUsername(username: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const clean = (username || "").toLowerCase().trim();
  if (!isPremiumUsername(clean)) {
    return { error: "That is not a premium username listing." };
  }

  // Check if claimed in profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id")
    .or(`username.eq.${clean},alias.eq.${clean}`)
    .maybeSingle();
  if (profiles) return { error: "This username is already claimed." };

  // Check if already purchased in marketplace
  const { data: existing } = await supabase
    .from("purchased_usernames")
    .select("id, user_id")
    .eq("username", clean)
    .maybeSingle();
  if (existing) {
    if (existing.user_id === user.id) {
      return { error: "You have already purchased this username!" };
    }
    return { error: "This username has already been purchased by another user." };
  }

  // Calculate Price
  const len = clean.length;
  let priceKey = "username_3_letter";
  if (len === 1) priceKey = "username_1_letter";
  else if (len === 2) priceKey = "username_2_letter";
  const price = MARKETPLACE_PRICES[priceKey] || 0;

  // Insert purchase record
  const { error } = await supabase.from("purchased_usernames").insert({
    user_id: user.id,
    username: clean,
    price_paid: price,
  });

  if (error) return { error: error.message };

  revalidatePath("/marketplace");
  return { ok: true };
}

export async function purchaseBadge(badgeId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const badge = MARKETPLACE_BADGES.find((b) => b.id === badgeId);
  if (!badge) return { error: "Invalid badge selected." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("owned_badges")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return { error: "Profile not found." };

  const owned = Array.isArray(profile.owned_badges) ? profile.owned_badges.map(String) : [];
  if (owned.includes(badgeId)) {
    return { error: "You already own this badge!" };
  }

  const updatedOwned = [...owned, badgeId];

  const { error } = await supabase
    .from("profiles")
    .update({ owned_badges: updatedOwned })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/marketplace");
  revalidatePath("/dashboard");
  return { ok: true };
}
