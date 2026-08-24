# v31 setup

1. Run `supabase/v31-custom-cursor-new-badge-roles.sql` in Supabase SQL Editor.
2. Redeploy Vercel.
3. Make sure the Railway presence bot is pointed at the current rezu Discord server (`DISCORD_GUILD_ID`).
4. The website now expects these current Discord badge roles:
   - Owner `1534693045339951185`
   - Staff `1534693054441586839`
   - Helper `1534693058871038162`
   - Verified `1534781630923935895`
   - Premium `1534693066995400876`
   - Donor `1534693071344636024`
   - OG `1534693074473848862`
   - Rich `1530800513778585673`
   - Bug Hunter `1534693082333708308`
   - Winner `1534693086108586136`
   - Early Supporter `1534693089476739214`

Custom cursor uploads accept PNG only. The browser resizes the uploaded PNG into a transparent 32x32 file before it is uploaded to Supabase Storage.

The Founding 100 badge is frozen: profiles with `public_uid` from 1 through 199 remain eligible and can show/hide it. Newer profiles are not eligible.
