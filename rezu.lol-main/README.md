# bio.link — a guns.lol-style link-in-bio site

A full, deployable Next.js + Supabase app. Real auth, **globally unique usernames
enforced by the database**, public `/username` pages, and a private dashboard.

```
app/
  page.tsx            landing — "claim your name"
  signup/             create account + claim a unique username
  login/              email + password login
  dashboard/          private editor (live preview + save)
  [username]/         PUBLIC profile page everyone can visit
lib/supabase/         server + browser Supabase clients
components/            ProfileCard (shared render) + platform icons
supabase/schema.sql   ← run this in Supabase to create the database
middleware.ts         keeps the login session fresh
```

---

## Setup (about 10 minutes)

### 1. Create a Supabase project
Go to https://supabase.com → **New project**. Pick a name and a database password
(save it). Wait ~2 min for it to provision. *(You do this part — I can't create
accounts for you.)*

### 2. Create the database
In Supabase: **SQL Editor → New query**, paste the entire contents of
`supabase/schema.sql`, and click **Run**. This creates the `profiles` table with
the case-insensitive `UNIQUE` username constraint — the thing that makes each name
ownable by exactly one person.

### 3. Turn off email confirmation (for now)
**Authentication → Sign In / Providers → Email** → turn **Confirm email** OFF, save.
This lets signups log in instantly. (Turn it back on before you take it seriously —
see "Going to production" below.)

### 4. Get your two keys
**Project Settings → API**. Copy:
- **Project URL**
- **anon public** key

Then locally:
```bash
cp .env.local.example .env.local
```
and paste both values into `.env.local`.

### 5. Run it
```bash
npm install
npm run dev
```
Open http://localhost:3000 → claim a name → you land on the dashboard → edit →
**Save** → visit `localhost:3000/yourname` to see your public page.

---

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. https://vercel.com → **Add New → Project** → import the repo.
3. In **Environment Variables**, add the same two from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Deploy.** Done — anyone can now claim a name on your live site.

---

## How "only one person per name" actually works

Three layers, but **only the last one is the real guarantee**:
1. The signup form checks availability as you type (nice UX, not security).
2. The form blocks submitting a taken name (still just UX).
3. **The database has `username citext unique`.** If two people submit the exact
   same name at the exact same millisecond, Postgres lets the first `INSERT`
   through and rejects the second with error `23505`. The form catches that and
   says "someone just grabbed that name." This race-proof check is the one that
   matters.

Usernames are also **permanent** — the dashboard can't change `username`, and the
save action never updates that column.

---

## Going to production (when you're ready)

- **Re-enable email confirmation** (step 3) so people can't sign up with fake
  emails. You'll then need an email-confirm callback route.
- **Add real avatar uploads** with Supabase Storage (right now avatars are an
  emoji or an image URL — which already works fine).
- **Rate-limit** signups and add a profanity/blocklist for usernames.
- Add a custom domain in Vercel.

Want any of these next? They're each a small, contained add-on.
