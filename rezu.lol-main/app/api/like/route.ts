import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function cleanUsername(req: NextRequest) {
  return (req.nextUrl.searchParams.get("username") || "").toLowerCase().trim();
}

export async function GET(req: NextRequest) {
  const username = cleanUsername(req);
  if (!/^[a-z0-9_]{1,20}$/.test(username)) {
    return NextResponse.json({ ok: false, error: "Bad username" }, { status: 400 });
  }

  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_profile_like_state", {
    target_username: username,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const row = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({
    ok: true,
    liked: !!row?.liked,
    likes: Number(row?.likes || 0),
  });
}

export async function POST(req: NextRequest) {
  const username = cleanUsername(req);
  if (!/^[a-z0-9_]{1,20}$/.test(username)) {
    return NextResponse.json({ ok: false, error: "Bad username" }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Sign in to like profiles" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("toggle_profile_like", {
    target_username: username,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const row = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({
    ok: true,
    liked: !!row?.liked,
    likes: Number(row?.likes || 0),
  });
}
