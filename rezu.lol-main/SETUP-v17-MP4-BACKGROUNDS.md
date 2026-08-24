# v17 MP4 Backgrounds

This update lets profile backgrounds use images or videos.

## What changed

- The dashboard Background uploader now accepts:
  - images
  - `.mp4`
  - `.webm`
  - `.mov`
- Background videos render on classic/portfolio and scroll layouts.
- Videos autoplay muted, loop, and use `playsInline` so mobile browsers allow playback.
- Uploads now pass `contentType` to Supabase Storage, which also helps audio/video files serve correctly.

## Supabase note

No new SQL is required unless your Supabase Storage bucket has a manual MIME-type restriction.

If uploads fail, check:

Supabase → Storage → media bucket → settings

Make sure the bucket allows video MIME types like:

- `video/mp4`
- `video/webm`
- `video/quicktime`

Also make sure your file is under your bucket file size limit.
