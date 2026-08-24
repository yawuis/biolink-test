# v26 Signup Fix

If signup/claim shows a tiny red error or mentions `profiles_discord_id_digits_chk`, run:

```sql
supabase/v26-signup-discord-id-trigger-fix.sql
```

This fixes old databases where `profiles.discord_id` defaulted to an empty string. Unlinked Discord now stays `NULL`, and Discord is only added after the secure Discord link flow.
