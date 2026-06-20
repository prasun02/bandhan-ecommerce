# Setup Guide

1. Install Node.js 22 LTS or newer.
2. Install PostgreSQL or create a Supabase/Neon database.
3. Run `npm install`.
4. Copy `.env.example` to `.env`.
5. Fill `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `APP_URL`, `SEED_ADMIN_PASSWORD`, and `SEED_CUSTOMER_PASSWORD`.
6. Run `npm run prisma:migrate`.
7. Run `npm run prisma:seed`.
8. Start with `npm run dev`.

Use `npm.cmd` on Windows if PowerShell blocks `npm.ps1`.
