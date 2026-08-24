import { createBrowserClient } from "@supabase/ssr";

// Used in client components ("use client"). Talks to Supabase from the browser,
// reading/writing the logged-in user's session via cookies.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
