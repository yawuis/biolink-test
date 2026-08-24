import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardEditor from "./DashboardEditor";
import type { Profile } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    // Logged in but no profile yet (e.g. a fresh Discord login). Pick a name.
    redirect("/claim");
  }

  return <DashboardEditor initial={profile as Profile} isOwner={user.email?.toLowerCase() === "brallowjillow@gmail.com"} />;
}
