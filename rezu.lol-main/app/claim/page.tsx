import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ClaimForm from "./ClaimForm";

export const dynamic = "force-dynamic";

export default async function ClaimPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) redirect("/dashboard");

  // Suggest a username from their Discord handle if we have one.
  const suggested =
    (user.user_metadata?.preferred_username || user.user_metadata?.name || "")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 20);

  return <ClaimForm userId={user.id} suggested={suggested} />;
}
