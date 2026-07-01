# Bandhan E-commerce

Production-oriented Next.js App Router e-commerce starter for women&apos;s fashion and fabric sales in Bangladesh.

## Implemented Features

- Mobile-first fashion storefront with home, shop, product details, cart, checkout, tracking, auth, policy, and account pages.
- Admin dashboard surfaces for products, orders, and customizable site settings.
- Typed catalog, filtering, sorting, coupons, delivery-zone calculation, order-number generation, stock validation, and server-side checkout totals.
- Payment-provider abstraction for Cash on Delivery, bKash, and SSLCommerz/card payments. bKash and SSLCommerz use clearly marked mock adapters until live credentials and verification calls are enabled.
- Prisma PostgreSQL schema covering users, auth sessions, products, variants, inventory, carts, wishlists, orders, payments, delivery zones, coupons, reviews, returns, notifications, menus, pages, homepage sections, settings, contact messages, newsletter subscribers, and audit logs.
- Seed script with categories, collections, brands, 20 products, variants, delivery zones, coupons, one admin, and one customer.
- Vitest coverage for order numbers, delivery charges, coupons, stock validation, and COD order totals.
- SEO basics through metadata, sitemap, robots, clean product URLs, image optimization, and structured data-ready product fields.

## Folder Structure

```text
app/                 Next.js App Router pages and API routes
components/          Shared UI, header, footer, product cards
data/                Development catalog and CSV import template
docs/                Setup, deployment, payment, image, and admin guides
lib/                 Auth, env validation, services, payment adapters, utilities
prisma/              Prisma schema and seed script
tests/               Vitest workflow tests
public/              Static assets
```

## Local Installation

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

On Windows PowerShell with script execution disabled, use `npm.cmd` instead of `npm`.

## Environment Variables

Copy `.env.example` to `.env` and fill all required values. Never commit real credentials.

Required for local database/auth:

- `DATABASE_URL`
- `DIRECT_URL` (direct Supabase connection for Prisma migrations; `DATABASE_URL` should use the runtime pooler)
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `APP_URL`
- `SEED_ADMIN_PASSWORD`
- `SEED_CUSTOMER_PASSWORD`

Provider credentials are optional until those integrations go live:

- Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Email: `EMAIL_FROM`, `EMAIL_PROVIDER_API_KEY` or SMTP values
- bKash: `BKASH_BASE_URL`, `BKASH_USERNAME`, `BKASH_PASSWORD`, `BKASH_APP_KEY`, `BKASH_APP_SECRET`
- SSLCommerz: `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, `SSLCOMMERZ_IS_LIVE`

## Database Setup

Use PostgreSQL from Supabase, Neon, Railway, Render, Docker, or a local install. Put the connection string in `DATABASE_URL`.

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

The seed script refuses to run unless `SEED_ADMIN_PASSWORD` and `SEED_CUSTOMER_PASSWORD` are set in the environment.

## Admin Account

Create or promote an administrator without hard-coded credentials:

```bash
ADMIN_BOOTSTRAP_EMAIL="admin@example.com"
ADMIN_BOOTSTRAP_NAME="Bandhan Administrator"
ADMIN_BOOTSTRAP_PASSWORD="set-this-in-your-environment"
npm run admin:create
```

The command is idempotent, never prints the password, and preserves an existing account password when promoting that account. Remove the bootstrap variables after use.

For administrator password recovery, set `ADMIN_RESET_EMAIL` and `ADMIN_NEW_PASSWORD`, run `npm run admin:reset-password`, then remove both variables.

## Payment Configuration

Cash on Delivery is available without provider credentials and creates `Cash on Delivery Pending` payments.

bKash:

1. Add merchant sandbox or production credentials to `.env`.
2. Replace the guarded `throw` in `lib/payments/bkash.ts` with tokenized checkout create/execute/query calls.
3. Verify payment on the server before setting an order to `Paid`.

SSLCommerz/card:

1. Add `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, and live flag.
2. Implement session creation and validation in `lib/payments/sslcommerz.ts`.
3. Use success/failure/cancel callbacks plus IPN validation before updating payment status.

## Image Storage

The UI currently uses safe placeholder URLs. For production:

1. Add Cloudinary credentials to `.env`.
2. Validate file type, extension, dimensions, and size server-side.
3. Store uploaded asset URLs in `ProductImage`, `Banner`, `SiteSetting`, and profile image fields.
4. Keep upload signing on the server.

## Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

## Vercel Deployment

1. Push the repository to GitHub/GitLab/Bitbucket.
2. Create a Vercel project and select this repository.
3. Add all environment variables in Vercel Project Settings.
4. Use a hosted PostgreSQL provider such as Supabase or Neon.
5. Run migrations during deployment or through a protected CI step: `npx prisma migrate deploy`.
6. Seed only non-sensitive demo data in production. Create the real admin separately.
7. Configure payment callback URLs to the deployed domain.

## Current Limitations

- bKash, SSLCommerz, Cloudinary, email, SMS, and WhatsApp need real provider credentials and final API calls before they can be considered live.
- The UI and services are implemented as a buildable foundation; persistent cart sync, full dashboard CRUD forms, webhook endpoints, and production rate limiting are the next hardening steps.
- Password login is wired for credentials architecture; production should connect `authorize` to Prisma user lookup and enforce rate limiting.
