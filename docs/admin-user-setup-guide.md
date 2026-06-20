# Admin User Setup Guide

For local development:

```bash
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="local-secure-password"
npm run prisma:seed
```

For production, create the first admin through a protected script or database console, then disable public staff/admin registration.
