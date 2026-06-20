# Deployment Guide

Recommended deployment:

1. Vercel for the Next.js application.
2. Supabase or Neon for PostgreSQL.
3. Cloudinary for product, banner, and profile images.
4. Resend, SMTP, or another provider for email.
5. bKash and SSLCommerz merchant dashboards for live payment credentials.

Set environment variables in the hosting dashboard. Run `npx prisma migrate deploy` against production before serving traffic.
