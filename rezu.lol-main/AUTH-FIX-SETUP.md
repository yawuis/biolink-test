# Auth Fix Setup

Run these SQL files in Supabase SQL Editor in this order:

1. `supabase/schema.sql`
2. `supabase/v4-pro-dashboard-upgrade.sql`
3. `supabase/v6-auth-fix.sql`

The v6 file fixes the RLS error on signup by creating the profile row from a safe Supabase database trigger when the auth user is created.

## Supabase URL settings

In Supabase Dashboard → Authentication → URL Configuration:

- Site URL: your deployed site, for example `https://rezu-lol.vercel.app`
- Redirect URLs: add both your deployed callback and localhost callback:
  - `https://YOUR-DOMAIN/auth/callback`
  - `http://localhost:3000/auth/callback`

If your email verification link says failed to load, the redirect URL is usually missing or pointing to an old deployment.

## Email rate limit

`email rate limit exceeded` is Supabase blocking too many confirmation emails. The code now stops trying to insert the profile before verification, but the Supabase email cooldown itself cannot be bypassed in code. Wait a few minutes, then try once, or use Discord login while testing.
