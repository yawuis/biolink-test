import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function viewerHash(req: NextRequest, username: string) {
  const forwarded = req.headers.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const ua = req.headers.get("user-agent") || "unknown";
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256").update(`${username}:${day}:${ip}:${ua}`).digest("hex");
}

export async function POST(req: NextRequest) {
  const username = (req.nextUrl.searchParams.get("username") || "").toLowerCase().trim();
  if (!/^[a-z0-9_]{1,20}$/.test(username)) {
    return NextResponse.json({ ok: false, error: "Bad username" }, { status: 400 });
  }

  const cookieName = `viewed_${username}`;
  if (req.cookies.get(cookieName)?.value) {
    return NextResponse.json({ ok: true, counted: false });
  }

  const supabase = createClient();
  const { error } = await supabase.rpc("increment_view_once", {
    profile_username: username,
    viewer_hash: viewerHash(req, username),
  });

  const res = NextResponse.json({ ok: !error, counted: !error });
  res.cookies.set(cookieName, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return res;
}
