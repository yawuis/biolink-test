import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function safeId(value: string) {
  return /^[0-9]{15,25}$/.test(value);
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const base = process.env.DISCORD_PRESENCE_API_URL;
  const key = process.env.DISCORD_PRESENCE_API_KEY;
  const id = params.id;

  if (!safeId(id)) {
    return NextResponse.json({ ok: false, error: "Invalid Discord user ID" }, { status: 400 });
  }

  if (!base) {
    return NextResponse.json({ ok: false, error: "Discord presence bot API is not configured" }, { status: 503 });
  }

  const url = new URL(`/presence/${id}`, base.endsWith("/") ? base : `${base}/`);
  const res = await fetch(url, {
    headers: key ? { "x-api-key": key } : {},
    next: { revalidate: 8 },
  });

  const data = await res.json().catch(() => ({ ok: false, error: "Bad bot response" }));
  return NextResponse.json(data, { status: res.status });
}
