# v24 Badge Color + Hide Alias

Run this SQL after previous migrations:

```sql
supabase/v24-badge-color-hide-alias.sql
```

Then redeploy.

## Changes

- Badge color now actually controls earned Discord-role badges when Monochrome icons is enabled.
- Stock Discord role badges use monochrome glyphs in monochrome mode so the selected badge color can apply cleanly.
- Custom image badges still support tinting as best as browser CSS allows.
- Added **Hide alias on profile** in Customize.
- Hidden aliases still route correctly, e.g. `/kill` can still open the real profile, but the public profile will not show `alias: @kill`.
