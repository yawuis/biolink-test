# rezu.lol — v3 (scroll layout + modules + live Discord presence)

## 0. Get the code in
From your repo root:
```bash
unzip rezu-lol-v3.zip
cp -r biolink/. .
rm -rf biolink rezu-lol-v3.zip
npm install
```

## 1. Run the v3 database upgrade
Supabase → SQL Editor → New query → paste all of `supabase/v3-upgrade.sql` → Run.
(Adds layout/modules/discord/github/timezone/skills columns. Safe — adds only.)

## 2. Deploy
```bash
git add . && git commit -m "v3: scroll layout + modules + discord presence" && git push
```

## 3. Turn on the scroll layout + modules
Dashboard → Page layout → **scroll (modules)**. A Modules panel appears: toggle
About Me / Discord presence / GitHub / Local time on or off, and use the ↑ ↓
arrows to set the order visitors scroll through. Save, then open your page —
splash → hero (avatar + icon row) → scroll down through your modules.

## 4. Live Discord presence (the headline feature)
1. **Join the Lanyard server:** https://discord.gg/rezu  — this is what makes
   your status readable. Without it the card says "join discord.gg/rezu".
2. **Get your Discord ID:** Discord → Settings → Advanced → turn on Developer
   Mode. Then right-click your own name → **Copy User ID** (a long number).
3. Dashboard → paste it into **Discord ID** → Save.
Your live status (online/idle/dnd), custom status, and what you're playing now
show on the Discord module, refreshing every 20s.

## 5. GitHub card + skills + clock
- **GitHub:** dashboard → GitHub username → shows repos + followers (public API).
- **Skill tags:** type a skill, Enter to add; click a chip to remove. Shown in
  the About module.
- **Local time:** set a Timezone like `America/Chicago` (blank = the visitor's
  own timezone). Live ticking clock module.

## 6. Discord LOGIN (optional, separate from presence)
Still works from v2 — if you haven't wired it: create a Discord app at
discord.com/developers, add redirect `https://YOUR-PROJECT.supabase.co/auth/v1/callback`,
then Supabase → Authentication → Providers → Discord → enable + paste Client
ID/Secret, and set your Site URL + `…/auth/callback` redirect. Full steps in
`SETUP-v2.md`.

## What's mine vs theirs (so you stay safe)
This is the guns.lol *genre*, built fresh — your own particle/effects engine,
your own module system, your own storage. The badges, premium tiers, paid image
host, and template marketplace are their product and aren't included. Branding
is "rezu.lol" (change `SITE_NAME` in `lib/constants.ts`).
