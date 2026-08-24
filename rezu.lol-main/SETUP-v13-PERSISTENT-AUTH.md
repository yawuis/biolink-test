# v13 Persistent Auth Setup

This update fixes the slow dashboard flow where users have to sign in again too often.

## Vercel env vars

Set this in Vercel -> Project -> Settings -> Environment Variables:

```env
NEXT_PUBLIC_SITE_URL=https://rezu.lol
```

Keep your existing Supabase and Discord presence env vars too.

After editing env vars, redeploy Vercel.

## Supabase URL Configuration

Go to Supabase -> Authentication -> URL Configuration.

Set Site URL:

```txt
https://rezu.lol
```

Add Redirect URLs:

```txt
https://rezu.lol/auth/callback
https://www.rezu.lol/auth/callback
http://localhost:3000/auth/callback
```

Remove old Vercel preview redirect URLs if you do not want users landing there.

## Discord OAuth provider

Supabase -> Authentication -> Providers -> Discord should still use the callback URL Supabase shows you:

```txt
https://YOUR-SUPABASE-PROJECT.supabase.co/auth/v1/callback
```

That exact URL must also be in Discord Developer Portal -> OAuth2 -> Redirects.

## What changed

- Auth redirects now use the canonical production domain.
- If a user hits a Vercel domain by accident, middleware redirects them back to rezu.lol.
- The callback exchanges the auth code on the canonical domain so the cookie is created for rezu.lol.
- The homepage now shows Dashboard/View Page automatically when the user already has a session.
- Login page auto-sends already signed-in users to the dashboard.
