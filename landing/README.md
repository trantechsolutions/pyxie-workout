# Pyxie marketing landing

Standalone static site deployed as its own Vercel project (separate from the
main app). Point the marketing domain (e.g. `pyxie.app`) here; keep
`app.pyxie.app` on the app project.

## Vercel project settings

- **Root Directory:** `landing`
- **Framework Preset:** Other
- **Build Command:** (leave empty)
- **Output Directory:** `.` (or leave empty)
- **Install Command:** default (`npm install` — needed for the waitlist function's deps)

## Environment variables

- `DATABASE_URL` — Neon connection string. Reuse the same one the main app
  uses (Vercel → main app project → Settings → Environment Variables → copy
  the value, paste into this project under Production + Preview).

## Database

Before the first deploy, run `migrations/001_waitlist_emails.sql` against
the Neon database. Easiest: open the Neon SQL editor and paste it in.

Captured emails land in `waitlist_emails`. To export:

```sql
SELECT email, source, created_at FROM waitlist_emails ORDER BY created_at;
```

## Source of truth

`index.html` is a copy of `../public/landing.html`. The app project still
serves the same HTML at `/landing` for dev convenience, so when you edit one,
re-copy to the other:

```
cp public/landing.html landing/index.html
```

Then re-apply the standalone-only tweak: brand link `href="/"` (the app copy
uses `href="/landing"`). The `/wiki/` link in the footer also only resolves
on the app domain — update it to an absolute URL once the app domain is
final.
