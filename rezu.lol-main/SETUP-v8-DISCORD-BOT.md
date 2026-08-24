# v8 Discord Presence Bot Setup

## Critical first step

The bot token that was pasted in chat is compromised. Go to Discord Developer Portal → your application → Bot → Reset Token. Use the new token only in Railway Variables.

## 1. Discord app settings

Open Discord Developer Portal → your app → Bot.

Turn on:

- Server Members Intent
- Presence Intent

Invite the bot to your server with:

- Read Members / View Server
- Manage Roles, only if you want the bot to auto-give the presence role

Make sure the bot's highest role is above the role it has to give.

## 2. Railway bot service

Deploy the folder:

```txt
bots/discord-presence-bot
```

Set these Railway Variables:

```env
DISCORD_BOT_TOKEN=your_new_rotated_token
DISCORD_GUILD_ID=your_server_id
PRESENCE_ROLE_ID=1520325148668989450
PRESENCE_API_KEY=make_a_long_random_secret
PORT=3000
```

After deploy, open:

```txt
https://your-railway-service.up.railway.app/health
```

You should see `{ "ok": true, "ready": true }`.

## 3. Vercel site variables

In Vercel → Project → Settings → Environment Variables, add:

```env
DISCORD_PRESENCE_API_URL=https://your-railway-service.up.railway.app
DISCORD_PRESENCE_API_KEY=same_value_as_PRESENCE_API_KEY
NEXT_PUBLIC_DISCORD_INVITE=https://discord.gg/rezu
```

Redeploy Vercel.

## 4. Supabase Discord login fix

Supabase → Authentication → Providers → Discord.

Enable Discord and paste your Discord Application Client ID and Client Secret.

In Supabase Redirect URLs, include:

```txt
https://YOUR-DOMAIN/auth/callback
http://localhost:3000/auth/callback
```

In Discord Developer Portal → OAuth2, include the Supabase callback URL shown in the Supabase Discord provider page.

## 5. User flow

Dashboard → Customize → Discord presence → Open Discord setup.

Users join the Discord, then either connect Discord login or paste their Discord User ID. Public profiles then show status/activity/avatar/decorations through your Railway bot.
