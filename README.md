# AI-Powered Resume Builder

Production-oriented React + Supabase resume builder that can be reused by any student, job seeker, or professional.

## Stack

- React, TypeScript, Vite
- Tailwind CSS, Framer Motion, lucide-react
- Supabase Auth, Database, Storage, Edge Functions
- Google Gemini REST streaming from Edge Functions
- Vercel or Antigravity deployment config

## Run Locally

```bash
npm install
npm run dev
```

The UI works in demo mode without Supabase env vars. Add `.env.local` for live auth, Edge Functions, storage, and database persistence:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Edge Function secrets:

```env
GEMINI_API_KEY=AIzaSy...
SUPABASE_SECRET_KEY=sb_secret_...
PDF_RENDERER_URL=https://optional-render-service.example/render
```

## Vercel Deploy

This repo is ready for Vercel.

Use these Vercel settings:

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

Add these Vercel environment variables for production Supabase mode:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Do not add `GEMINI_API_KEY` or `SUPABASE_SECRET_KEY` to Vercel. Those belong in Supabase Edge Function secrets.

## Supabase

Apply the schema:

```bash
supabase db push
```

Deploy functions:

```bash
supabase functions deploy resume
supabase functions deploy user
supabase functions deploy auth
```

Set Edge Function secrets:

```bash
supabase secrets set GEMINI_API_KEY=your_gemini_key
supabase secrets set SUPABASE_SECRET_KEY=your_supabase_secret_key
supabase secrets set SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

The `auth` function has JWT verification disabled in `supabase/config.toml` so signup can happen before a user has a session. The `resume` and `user` functions still require an authenticated Supabase session.

Routes:

- `POST /functions/v1/resume/generate`
- `POST /functions/v1/resume/ats-score`
- `POST /functions/v1/resume/export-pdf`
- `POST /functions/v1/auth/signup`
- `GET /functions/v1/user/data`
- `DELETE /functions/v1/user/data`

Authenticated Edge Functions verify the Supabase JWT, every JSON endpoint uses the response envelope, and Gemini plus service-role keys stay server-side.

## Quality Gates

- `npm run typecheck`
- `npm run build`
- Supabase RLS smoke test with two users
- Gemini quota test: 21st hourly AI request returns `AI_QUOTA_EXCEEDED`
- GDPR delete test: user rows and storage prefix are removed, `deletion_audit` remains
