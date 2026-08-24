# rezu.lol Discord Presence Bot

This bot powers the public Discord presence card without Lanyard.

## Railway variables

Set these in Railway → your bot service → Variables:

```env
DISCORD_BOT_TOKEN=your_new_rotated_token
DISCORD_GUILD_ID=your_server_id
PRESENCE_ROLE_ID=1520325148668989450
PRESENCE_API_KEY=make_a_long_random_secret
PORT=3000
```

Then set these in Vercel for the Next.js site:

```env
DISCORD_PRESENCE_API_URL=https://your-railway-service.up.railway.app
DISCORD_PRESENCE_API_KEY=same_value_as_PRESENCE_API_KEY
NEXT_PUBLIC_DISCORD_INVITE=https://discord.gg/rezu
```

## Discord Developer Portal

Enable these Bot privileged intents:

- Server Members Intent
- Presence Intent

The bot needs `Manage Roles` if you want it to auto-give the presence role on join.
