import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DiscordPresenceSetup from "./DiscordPresenceSetup";
import { DISCORD_INVITE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function DiscordPresencePage({ searchParams }: { searchParams?: { linked?: string; error?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, discord_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/claim");

  const status = searchParams?.linked === "1" ? "Discord linked to this account." : "";
  const error = searchParams?.error ? decodeURIComponent(searchParams.error) : "";

  return (
    <DiscordPresenceSetup
      initialDiscordId={profile.discord_id || ""}
      initialInvite={DISCORD_INVITE_URL}
      status={status}
      error={error}
    />
  );
}
