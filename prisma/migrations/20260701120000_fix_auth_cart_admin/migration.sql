-- Additive-only migration. It preserves all existing customers, products, carts, and orders.
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "sessionVersion" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "AdminAuditLog" (
  "id" TEXT NOT NULL,
  "adminUserId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "description" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SiteEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "eventType" TEXT NOT NULL,
  "entityType" TEXT,
  "entityId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SiteEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Cart_updatedAt_idx" ON "Cart"("updatedAt");
CREATE INDEX IF NOT EXISTS "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AdminAuditLog_action_createdAt_idx" ON "AdminAuditLog"("action", "createdAt");
CREATE INDEX IF NOT EXISTS "AdminAuditLog_adminUserId_createdAt_idx" ON "AdminAuditLog"("adminUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "SiteEvent_createdAt_idx" ON "SiteEvent"("createdAt");
CREATE INDEX IF NOT EXISTS "SiteEvent_eventType_createdAt_idx" ON "SiteEvent"("eventType", "createdAt");
CREATE INDEX IF NOT EXISTS "SiteEvent_userId_createdAt_idx" ON "SiteEvent"("userId", "createdAt");

-- PostgreSQL treats NULL values as distinct in a normal compound unique index.
-- This closes that gap for products without variants without changing existing rows.
CREATE UNIQUE INDEX IF NOT EXISTS "CartItem_cart_product_no_variant_key"
  ON "CartItem"("cartId", "productId")
  WHERE "variantId" IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AdminAuditLog_adminUserId_fkey') THEN
    ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminUserId_fkey"
      FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SiteEvent_userId_fkey') THEN
    ALTER TABLE "SiteEvent" ADD CONSTRAINT "SiteEvent_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
