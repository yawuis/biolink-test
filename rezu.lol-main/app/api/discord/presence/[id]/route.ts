import { NextResponse } from "next/server";

// Trigger Vercel rebuild for corrected environment variables
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

  console.log("DEBUG: DISCORD_PRESENCE_API_URL =", base);
  console.log("DEBUG: DISCORD_PRESENCE_API_KEY =", key ? "present" : "missing");

  if (!base) {
    return NextResponse.json({ ok: false, error: "Discord presence bot API is not configured" }, { status: 503 });
  }

  let url: URL;
  try {
    const formattedBase = base.startsWith("http://") || base.startsWith("https://") ? base : `https://${base}`;
    url = new URL(`/presence/${id}`, formattedBase.endsWith("/") ? formattedBase : `${formattedBase}/`);
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Invalid presence bot URL configuration" }, { status: 500 });
  }

  let res;
  try {
    res = await fetch(url, {
      headers: key ? { "x-api-key": key } : {},
      next: { revalidate: 8 },
    });
  } catch (err: any) {
    console.error("DEBUG: Fetch failed:", err?.message || err);
    return NextResponse.json({ ok: false, error: `Bot request failed: ${err?.message || err}` }, { status: 502 });
  }

  const data = await res.json().catch(() => ({ ok: false, error: "Bad bot response" }));

  // If the bot returned successfully, let's fetch extended user details (avatar decoration, badges) from Discord
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (data.ok && data.user && botToken) {
    try {
      const discordUserRes = await fetch(`https://discord.com/api/v10/users/${id}`, {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
        next: { revalidate: 15 },
      });
      if (discordUserRes.ok) {
        const discordUserData = await discordUserRes.json();
        // Merge avatar decoration and public flags into the presence data user object
        data.user.avatar_decoration_data = discordUserData.avatar_decoration_data;
        data.user.public_flags = discordUserData.public_flags;
      }
    } catch (err) {
      console.error("DEBUG: Failed to fetch extended Discord user details:", err);
    }
  }

  return NextResponse.json(data, { status: res.status });
}
