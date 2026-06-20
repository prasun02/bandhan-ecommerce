import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container py-16 text-center">
      <h1 className="text-4xl font-black">Page not found</h1>
      <Link href="/shop" className="mt-5 inline-block font-bold text-rosewood">Return to shop</Link>
    </main>
  );
}
