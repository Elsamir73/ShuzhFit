# ShuzhFit

ShuzhFit is a Vite + React + TypeScript fitness app that is being migrated from a legacy PHP/MySQL implementation to a modern Vercel-friendly stack with API routes and secure session auth.

## Stack

- Frontend: React, TypeScript, Vite
- API: Vercel Serverless Routes under /api
- Database: PostgreSQL via Neon + Drizzle ORM
- Auth: JWT session cookies with bcrypt hashing

## Local development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```
3. Fill in the required values in `.env.local`.
4. Run the dev server:
   ```bash
   npm run dev
   ```

## Required environment variables

Create a `.env.local` or set these in Vercel:

```bash
DATABASE_URL=postgres://user:password@host:5432/db_name
JWT_SECRET=replace_with_long_random_secret
YOUTUBE_API_KEY=replace_with_youtube_data_api_key
YOUTUBE_CHANNEL_ID=replace_with_channel_id
ADMIN_EMAIL=admin@example.com
NODE_ENV=production
```

### Notes

- `DATABASE_URL` enables the real Postgres-backed content, auth, and tracker flows.
- `JWT_SECRET` is required to sign session JWTs. The app fails loudly if it is missing.
- `YOUTUBE_API_KEY` and `YOUTUBE_CHANNEL_ID` power the YouTube feed integration.
- If `DATABASE_URL` is not configured, the app keeps working through demo/fallback data paths.

## Vercel deployment

1. Push the project to GitHub.
2. Import the repository in Vercel.
3. Add the environment variables above in the Vercel project settings.
4. Use the default build command:
   ```bash
   npm run build
   ```
5. Deploy.

The project includes a Vercel rewrites file in `vercel.json` so API routes and SPA routing behave correctly in production.

## Migration status

The app is in a staged migration state:

- public content routes are API-backed with fallback data
- member auth is JWT-based with fallback demo users
- member tracker pages are API-ready with fallback storage
- admin content management routes are in place with admin-only protection

This pattern keeps the app functional during the transition while allowing real database-backed persistence once the environment is configured.
