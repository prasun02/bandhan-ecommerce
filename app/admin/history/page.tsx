import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminHistoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const action = typeof params.action === "string" ? params.action : "";
  const admin = typeof params.admin === "string" ? params.admin : "";
  const page = Math.max(1, Number(typeof params.page === "string" ? params.page : 1) || 1);
  const from = typeof params.from === "string" && params.from ? new Date(`${params.from}T00:00:00`) : undefined;
  const to = typeof params.to === "string" && params.to ? new Date(`${params.to}T23:59:59.999`) : undefined;
  const where = {
    ...(query ? { OR: [{ description: { contains: query, mode: "insensitive" as const } }, { entityType: { contains: query, mode: "insensitive" as const } }] } : {}),
    ...(action ? { action } : {}),
    ...(admin ? { adminUserId: admin } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {})
  };
  const [logs, total, admins, actions] = await Promise.all([
    prisma.adminAuditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * 25, take: 25, include: { adminUser: { select: { name: true, email: true } } } }),
    prisma.adminAuditLog.count({ where }),
    prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
    prisma.adminAuditLog.findMany({ distinct: ["action"], select: { action: true }, orderBy: { action: "asc" } })
  ]);
  return <main className="container py-8"><h1 className="text-3xl font-black">Administrative history</h1><form className="mt-6 grid gap-3 rounded-md bg-white p-4 shadow-sm md:grid-cols-5"><input name="q" defaultValue={query} placeholder="Search" className="h-10 rounded border px-3" /><input name="from" type="date" className="h-10 rounded border px-3" /><input name="to" type="date" className="h-10 rounded border px-3" /><select name="action" defaultValue={action} className="h-10 rounded border px-3"><option value="">All actions</option>{actions.map((item) => <option key={item.action}>{item.action}</option>)}</select><select name="admin" defaultValue={admin} className="h-10 rounded border px-3"><option value="">All admins</option>{admins.map((item) => <option key={item.id} value={item.id}>{item.name ?? item.email}</option>)}</select><button className="h-10 rounded bg-rosewood font-bold text-white">Filter</button></form><div className="mt-6 grid gap-3">{logs.length ? logs.map((log) => <article key={log.id} className="rounded-md bg-white p-4 shadow-sm"><div className="flex flex-wrap justify-between gap-2"><strong>{log.action}</strong><time className="text-xs text-ink/60">{log.createdAt.toLocaleString("en-BD")}</time></div><p className="mt-2 text-sm">{log.description}</p><p className="mt-1 text-xs text-ink/60">{log.adminUser?.name ?? log.adminUser?.email ?? "Former administrator"} · {log.entityType}{log.entityId ? ` · ${log.entityId}` : ""}</p></article>) : <p className="rounded-md bg-white p-6">No matching history.</p>}</div><p className="mt-4 text-sm">Page {page} · {total} record(s)</p></main>;
}
