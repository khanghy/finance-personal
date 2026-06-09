# Deployment

## Vercel

Project name: `finance-personal`

Required environment variables for Production and Preview:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `AI_PROVIDER`
- `AI_API_KEY`
- `AI_MODEL`

Build command:

```bash
npm run build
```

Install command:

```bash
npm install
```

## Supabase

Project:

- Name: `Finance Personal`
- Ref: `zwrxvdrvymacrlkhonwd`
- URL: `https://zwrxvdrvymacrlkhonwd.supabase.co`

Applied migrations:

- `initial_schema`
- `backend_functions`
- `linter_fixes`

## Auth Redirects

For local development:

- `http://localhost:3000/auth/callback`

For Vercel production, set `NEXT_PUBLIC_SITE_URL` to the production deployment URL and add:

- `https://<production-domain>/auth/callback`
- `https://<production-domain>/auth/confirm`

Current production values:

- `https://finance-personal-red.vercel.app/auth/callback`
- `https://finance-personal-red.vercel.app/auth/confirm`

If magic links redirect to `localhost:3000`, Supabase Auth is falling back to its Site URL. Add the exact production callback URL above in Supabase Dashboard > Authentication > URL Configuration > Redirect URLs.

## CI/CD Flow

Preferred:

1. Push `main` to GitHub.
2. Connect GitHub repo to Vercel project.
3. Vercel builds previews for pull requests.
4. Vercel deploys production from `main`.

CLI fallback:

```bash
vercel deploy
vercel deploy --prod
```
