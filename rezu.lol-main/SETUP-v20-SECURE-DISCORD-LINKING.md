# v20 secure Discord linking

Run:

```sql
supabase/v20-secure-discord-linking.sql
```

What changed:

- Manual Discord ID linking is disabled.
- Users must link Discord through Discord OAuth from `/dashboard/discord-presence`.
- The setup page uses `linkIdentity`, so Discord is linked to the currently logged-in rezu.lol account instead of creating a new profile.
- `saveProfile` no longer accepts client-submitted `discord_id` values.
- Database unique index enforces one Discord account per one profile.

Required Supabase redirect URLs:

```txt
https://rezu.lol/auth/callback
https://www.rezu.lol/auth/callback
http://localhost:3000/auth/callback
```

Required Discord OAuth redirect in the Discord Developer Portal:

```txt
https://YOUR-SUPABASE-PROJECT.supabase.co/auth/v1/callback
```
