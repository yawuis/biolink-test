# rezu.lol v4 setup

This upgrade adds the darker dashboard, public profile cards, Discord/GitHub presence, Spotify card fields, templates UI, metadata controls, badges, and a working Image Host.

## 1. Run the SQL

In Supabase Dashboard → SQL Editor, run:

```sql
supabase/v4-pro-dashboard-upgrade.sql
```

This creates/updates:

- extra profile customization columns
- `media` storage bucket
- `image-host` storage bucket
- `hosted_images` table
- RLS policies for safe uploads/deletes

## 2. Discord presence

Discord presence uses the public Lanyard API. The user must:

1. Enable Discord Developer Mode.
2. Copy their Discord User ID.
3. Join the Lanyard Discord server so their presence can be read.
4. Paste the Discord ID in Dashboard → Customize.

## 3. GitHub presence

Paste a GitHub username in Dashboard → Customize. The public profile fetches GitHub profile data client-side from GitHub's public API.

## 4. Spotify card

Dashboard → Customize → Spotify Card lets users enter:

- Track title
- Artist
- Spotify URL
- Cover image

The Spotify card shows directly under the main profile card.

## 5. Image Host

Dashboard → Image Host uploads images to the public `image-host` bucket and stores each hosted URL in `hosted_images`.
