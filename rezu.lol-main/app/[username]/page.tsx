import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ProfilePage from "@/components/ProfilePage";
import { SITE_NAME, type Profile } from "@/lib/constants";

export const dynamic = "force-dynamic";

async function getProfile(usernameOrAlias: string) {
  const supabase = createClient();
  const key = usernameOrAlias.toLowerCase();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .or(`username.eq.${key},alias.eq.${key}`)
    .maybeSingle();
  return data as Profile | null;
}

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const profile = await getProfile(params.username);
  if (!profile) return { title: "Not found" };
  const title = profile.website_title || profile.display_name || profile.username;
  const description = profile.website_description || profile.bio || `@${profile.username} on ${SITE_NAME}`;
  const image = profile.website_image_url || profile.avatar_url || undefined;
  const favicon = profile.favicon_url || "/default-favicon.png";
  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    icons: { icon: favicon, shortcut: favicon, apple: favicon },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: image ? [image] : undefined,
    },
    robots: profile.search_indexing === false ? { index: false, follow: false } : undefined,
  };
}

export default async function PublicProfile({ params }: { params: { username: string } }) {
  const profile = await getProfile(params.username);
  if (!profile) notFound();

  return <ProfilePage profile={profile} />;
}
