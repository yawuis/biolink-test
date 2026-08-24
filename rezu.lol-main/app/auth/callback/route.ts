import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

function safeNext(value: string | null) {
  if (!value) return "/dashboard";
  if (!value.startsWith("/")) return "/dashboard";
  if (value.startsWith("//")) return "/dashboard";
  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestOrigin = url.origin;
  const canonicalOrigin = getSiteUrl();
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  const canonicalIsLocal = canonicalOrigin.startsWith("http://localhost") || canonicalOrigin.startsWith("http://127.0.0.1");

  // If Supabase ever sends the callback to a Vercel preview/domain, bounce the
  // untouched auth code to the real domain BEFORE exchanging it. That way the
  // session cookie is created for rezu.lol, not for *.vercel.app.
  if (!isLocal && !canonicalIsLocal && canonicalOrigin && requestOrigin !== canonicalOrigin) {
    const target = new URL("/auth/callback", canonicalOrigin);
    url.searchParams.forEach((value, key) => target.searchParams.set(key, value));
    return NextResponse.redirect(target);
  }

  const origin = isLocal || canonicalIsLocal ? requestOrigin : canonicalOrigin;
  const next = safeNext(url.searchParams.get("next"));
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const errorDescription = url.searchParams.get("error_description");

  if (errorDescription) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription)}`);
  }

  const supabase = createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
  }

  return NextResponse.redirect(`${origin}/login?error=Missing auth code`);
}
