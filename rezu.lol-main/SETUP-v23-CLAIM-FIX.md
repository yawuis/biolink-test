# v23 Claim / Discord ID Fix

If claiming a name shows:

`new row for relation "profiles" violates check constraint "profiles_discord_id_digits_chk"`

run:

```sql
supabase/v23-claim-discord-id-fix.sql
```

This fixes old database defaults that stored unlinked Discord IDs as an empty string. New profiles now start with `discord_id = null` until the user links Discord through OAuth.
