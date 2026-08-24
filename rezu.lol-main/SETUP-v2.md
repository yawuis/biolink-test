# rezu.lol — v2 setup (vibe layer + Discord login)

Do these in order. Test the vibe features FIRST (steps 1–3); only then wire up
Discord (steps 4–5), so if Discord setup snags it doesn't block everything else.

## 0. Get the new code in
From your repo root, replace the files with this version (your `.env.local`
and `.git` are untouched — the zip doesn't contain them):
```bash
unzip rezu-lol-v2.zip
cp -r biolink/. .
rm -rf biolink rezu-lol-v2.zip
npm install      # no new deps, but safe to run
```

## 1. Run the database upgrade
Supabase → SQL Editor → New query → paste all of `supabase/v2-upgrade.sql` → Run.
This adds the new profile columns AND creates the `media` storage bucket with the
right access rules. (Safe to run on your existing data — it only adds.)

## 2. Deploy
```bash
git add . && git commit -m "v2: vibe layer + discord login" && git push
```
Vercel redeploys automatically.

## 3. Test the vibe layer (no Discord needed yet)
Log in → dashboard → upload a Background image and an Audio file → pick an Effect
(particles/glow) and a Cursor → set the enter-screen text → Save. Visit
`rezu.lol/yourname`: you should get the click-to-enter splash, then your bg +
audio + effects. ✅  If uploads fail, re-check that step 1 ran without errors.

## 4. Create a Discord app (for Discord login)
1. https://discord.com/developers/applications → New Application → name it.
2. Left sidebar → OAuth2. Copy the **Client ID** and **Client Secret**.
3. Under OAuth2 → Redirects, add exactly:
   `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
   (your Supabase project URL + `/auth/v1/callback`) → Save.

## 5. Turn on Discord in Supabase
1. Supabase → Authentication → Providers → **Discord** → enable.
2. Paste the Client ID + Client Secret from step 4 → Save.
3. Supabase → Authentication → URL Configuration:
   - **Site URL** = `https://your-app.vercel.app`
   - **Redirect URLs** → add `https://your-app.vercel.app/auth/callback`
   - (also add your Codespaces preview URL there if testing locally)

That's it. "Continue with Discord" on the login/signup pages now works. New Discord
users get sent to `/claim` to pick their permanent username, then land on the
dashboard like everyone else.

## Notes
- Files live in Supabase Storage under `media/<your-user-id>/…`. The bucket is
  public-read (so profiles can show them) but only you can write to your folder.
- Branding is now "rezu.lol" everywhere. To change it again, edit `SITE_NAME` in
  `lib/constants.ts`.
