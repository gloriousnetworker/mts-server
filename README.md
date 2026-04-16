# mts-server

MegaTech Solutions Backend API — Node.js, Express, TypeScript, Prisma, PostgreSQL (Supabase).

## Setup

```bash
npm install
cp .env.example .env   # then fill in your values
npx prisma generate
npx prisma db push      # push schema to database
npm run dev             # start dev server
```

## Environment Variables

See `.env.example` for all required variables.

## API

- `GET /health` — health check
- More endpoints coming in Phase 2+
