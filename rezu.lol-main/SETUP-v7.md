# rezu.lol v7 clean polish

Run SQL in this order in Supabase SQL Editor:

```sql
-- 1
supabase/schema.sql

-- 2
supabase/v4-pro-dashboard-upgrade.sql

-- 3
supabase/v6-auth-fix.sql

-- 4
supabase/v7-clean-polish.sql
```

V7 adds:

- red/black/gray/white site styling
- sequential public UUIDs (`public_uid`) shown as `UUID #1`, `UUID #2`, etc.
- username and alias share one global namespace
- 3 uploaded audio tracks + shuffle
- owner-only locked badges for `brallowjillow@gmail.com`
- custom URL image upload/drop/paste support
- custom favicon default and metadata upload
- removed Image Host from the dashboard UI and stock badges

After SQL:

```bash
npm install
npm run build
npm run dev
```
