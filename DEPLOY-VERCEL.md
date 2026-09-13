# Hosting this app on Vercel

The project builds for Vercel without code changes — the included `vercel.json`
switches the server build to Vercel's output format.

## Steps

1. Push this folder to a Git repository (GitHub, GitLab or Bitbucket).
2. In Vercel, click **Add New → Project** and import that repository.
3. Leave the framework preset as **Other** — `vercel.json` already sets the
   build command (`NITRO_PRESET=vercel npm run build`) and output directory
   (`.vercel/output`).
4. Add these Environment Variables (Production + Preview), copying the values
   from the project's `.env` file:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
5. Deploy.

The database and stored complaint records stay exactly where they are, so the
Vercel deployment shows the same records as this app.

## Local check

```bash
npm install
NITRO_PRESET=vercel npm run build
```
