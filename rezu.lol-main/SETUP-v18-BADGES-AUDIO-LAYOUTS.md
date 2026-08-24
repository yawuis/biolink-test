# v18 badges, invite, audio, and layouts

Run this SQL once after the previous SQL files:

```sql
supabase/v18-badges-audio-discord-layouts.sql
```

## What changed

- The official Discord invite is now locked to `https://discord.gg/rezu`.
- Role badge checks no longer depend on the owner email. The Discord Owner role unlocks every role badge.
- Users can still hide badges they earned.
- Owner-role users can create custom badges with an emoji or an uploaded image.
- Public badges display as clean standalone icons without the old circle background.
- Audio uploads accept MP4/MOV/WebM files too.
- If a background video has audio, the dashboard asks whether to add it as an audio track too.
- Added extra profile layouts: compact, minimal, and banner.

## Storage note

If MP4/MOV uploads fail, open Supabase Storage → `media` bucket and make sure these MIME types are allowed:

- `video/mp4`
- `video/quicktime`
- `video/webm`
- `audio/mpeg`
- `audio/wav`
- `audio/mp4`
