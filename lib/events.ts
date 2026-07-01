import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function recordSiteEvent(
  eventType: string,
  options: { userId?: string; entityType?: string; entityId?: string; metadata?: Prisma.InputJsonValue } = {}
) {
  await prisma.siteEvent.create({
    data: { eventType, ...options }
  }).catch(() => undefined);
}

export async function recordAdminAudit(
  adminUserId: string,
  action: string,
  entityType: string,
  description: string,
  options: { entityId?: string; metadata?: Prisma.InputJsonValue } = {}
) {
  await prisma.adminAuditLog.create({
    data: { adminUserId, action, entityType, description, ...options }
  });
}
