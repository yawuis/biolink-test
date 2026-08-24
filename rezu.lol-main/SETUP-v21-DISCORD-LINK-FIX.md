# v21 Discord linking fix

This version stops Discord linking from creating/switching to a new rezu.lol account.

## What changed

Discord linking now uses a custom Discord OAuth flow:

- user must already be logged into their existing rezu.lol account
- user clicks Link Discord
- Discord returns to `/api/discord/link/callback`
- the app updates `profiles.discord_id` on the already logged-in profile
- Supabase Auth is not used for Discord linking, so it cannot create a new profile or send the user to `/claim`

## Vercel env vars needed

Add these using the same Discord app you already made:

```env
DISCORD_CLIENT_ID=your_discord_app_client_id
DISCORD_CLIENT_SECRET=your_discord_app_client_secret
NEXT_PUBLIC_SITE_URL=https://rezu.lol
```

Keep your Railway presence env vars too.

## Discord Developer Portal redirect URL

Go to Discord Developer Portal → your app → OAuth2 → Redirects and add:

```txt
https://rezu.lol/api/discord/link/callback
```

For local testing also add:

```txt
http://localhost:3000/api/discord/link/callback
```

## If you are stuck on `/claim`

That means the browser session is on a Discord-created empty Supabase account.
Do not claim a new name. Sign out, log back into the original account that owns `/hi`, then link Discord again with this v21 patch.
