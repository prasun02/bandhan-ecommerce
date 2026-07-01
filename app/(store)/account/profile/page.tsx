import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/profile-form";

export default async function ProfilePage() {
  const current = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: current.id }, select: { name: true, email: true, phone: true } });
  return <main className="container py-8"><h1 className="text-3xl font-black">Edit profile</h1><ProfileForm name={user.name ?? ""} email={user.email ?? ""} phone={user.phone ?? ""} /></main>;
}
