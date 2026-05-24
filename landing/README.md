# Pyxie marketing landing

Standalone static site deployed as its own Vercel project (separate from the
main app). Point the marketing domain (e.g. `pyxie.app`) here; keep
`app.pyxie.app` on the app project.

## Vercel project settings

- **Root Directory:** `landing`
- **Framework Preset:** Other
- **Build Command:** (leave empty)
- **Output Directory:** `.` (or leave empty)
- **Install Command:** (leave empty)

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
