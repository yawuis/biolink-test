import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSiteUrl } from "./lib/site-url";

export async function middleware(request: NextRequest) {
  const canonical = getSiteUrl();
  const currentOrigin = request.nextUrl.origin;
  const isLocal = request.nextUrl.hostname === "localhost" || request.nextUrl.hostname === "127.0.0.1";
  const canonicalIsLocal = canonical.startsWith("http://localhost") || canonical.startsWith("http://127.0.0.1");

  // Keep production auth on one cookie domain. This prevents users from being
  // logged into the Vercel app but logged out on rezu.lol.
  /*
  if (!isLocal && !canonicalIsLocal && canonical && currentOrigin !== canonical && request.nextUrl.hostname.endsWith("vercel.app")) {
    const target = new URL(request.nextUrl.pathname + request.nextUrl.search, canonical);
    return NextResponse.redirect(target);
  }
  */

  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // Refreshes the session cookie so server components see a valid user without
  // making people sign in again every time. Wrap in a Promise.race to prevent
  // Vercel middleware execution timeout on database cold starts.
  try {
    await Promise.race([
      supabase.auth.getUser(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Supabase auth timeout")), 950))
    ]);
  } catch (err) {
    console.error("Middleware session refresh timed out or failed:", err);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
