# v14 Badges + Universal Templates setup

Run this SQL after the previous migrations:

```sql
supabase/v14-badges-templates-polish.sql
```

## What changed

- Badges now come from Discord roles through your Railway presence bot.
- Owner role `1520640957119463524` unlocks every badge automatically.
- Badges render as standalone icons without the circle background.
- Templates are universal/public instead of only showing your own.
- Templates can have a 16:9 cover image.
- Templates include a copy-link button.
- Applying a template only changes visual/style/audio/layout/effects fields. It does not change username, alias, badges, links, or display name.
- Added a separate `link_color` profile field so link icons are not forced to use the badge/icon color.

## Required bot behavior

The Railway bot endpoint must keep returning roles like this:

```json
{
  "member": {
    "roles": ["1520640957119463524"]
  }
}
```

The existing v8 bot already does this.
