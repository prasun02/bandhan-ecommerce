import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AddressesPage() {
  const user = await requireUser();
  const addresses = await prisma.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] });
  return <main className="container py-8"><h1 className="text-3xl font-black">Saved addresses</h1><div className="mt-6 grid gap-4 md:grid-cols-2">{addresses.length ? addresses.map((address) => <article key={address.id} className="rounded-md bg-white p-5 shadow-sm"><strong>{address.label ?? (address.isDefault ? "Default" : "Address")}</strong><p className="mt-2 text-sm">{address.house} {address.street}, {address.area}, {address.upazila}, {address.district}</p></article>) : <p className="rounded-md bg-white p-6">No saved addresses.</p>}</div></main>;
}
