# v25 profile likes + custom badge role

Run this SQL after the previous upgrade files:

```sql
supabase/v25-profile-likes-custom-badge-role.sql
```

What changed:

- Public profiles now have an Instagram-style like button.
- Logged-in users can like or unlike a profile.
- A profile owner can like their own profile.
- Likes are stored in `public.profile_likes` and counted in `profiles.like_count`.
- One user can only like the same profile once.
- Custom badges do not get recolored by the Badge color setting.
- Custom badge creation is allowed for users with Discord role `1521448328905232394`; owner role still has access too.

If a logged-out visitor clicks like, they are sent to `/login`.
