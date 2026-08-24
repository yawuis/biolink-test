# v29 setup

## 1) Vercel environment variables
Keep your existing variables and add this SERVER-ONLY variable:

SUPABASE_SERVICE_ROLE_KEY=your Supabase service_role key

Do NOT prefix this with NEXT_PUBLIC_. Never expose it in browser code.

Also keep:
DISCORD_CLIENT_ID=your Discord application client ID
DISCORD_CLIENT_SECRET=your Discord application client secret
NEXT_PUBLIC_SITE_URL=https://rezu.lol

## 2) Discord Developer Portal
OAuth2 -> Redirects: add

https://rezu.lol/api/discord/login/callback

Keep your existing Discord link callback too:
https://rezu.lol/api/discord/link/callback

## 3) Supabase SQL
Run:

supabase/v29-discord-recovery-founding100.sql

This ensures public_uid exists and lets the site grant Founding 100 to profile numbers 1-100.

## 4) How Discord login works now
- Login page uses rezu's Discord recovery flow.
- If profiles.discord_id is already linked, Discord opens the correct existing rezu account.
- For older Discord-auth accounts that predate discord_id storage, the callback searches the existing Supabase Discord identity and repairs the profile link.
- If Discord has never been linked to the profile, the user must log in by email once and link Discord from Settings.

## 5) Icons
- UI and badge icons use lucide-react.
- Social links use real brand SVG logos from Simple Icons CDN; custom URLs continue to use the custom uploaded image or Lucide Globe fallback.
