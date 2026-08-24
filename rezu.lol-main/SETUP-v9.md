# v9 official Discord setup polish

Run this after all previous SQL files:

```sql
supabase/v9-official-discord-polish.sql
```

What changed:
- The official Discord invite is locked to `https://discord.gg/rezu`.
- Users cannot edit the Discord invite from the dashboard or setup page.
- The Discord setup page now uses consumer-friendly copy instead of backend terms.
- The public Discord card uses the official invite only.
- The dashboard Customize page now includes an editable Enter Screen Text field.
- Badges follow monochrome icon mode and glow settings.

Vercel still needs your Railway bot URL and API key:

```env
DISCORD_PRESENCE_API_URL=https://your-railway-domain.up.railway.app
DISCORD_PRESENCE_API_KEY=same_secret_as_railway
```

The Discord invite is hardcoded in `lib/constants.ts`, so you do not need to expose it as an editable app setting.
