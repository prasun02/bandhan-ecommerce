import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="container py-10">
      <form className="mx-auto grid max-w-md gap-4 rounded-md bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black">Login</h1>
        <input type="email" name="email" placeholder="Email" className="h-11 rounded-md border border-ink/15 px-3" />
        <input type="password" name="password" placeholder="Password" className="h-11 rounded-md border border-ink/15 px-3" />
        <button className="h-11 rounded-md bg-rosewood font-bold text-white">Login</button>
        <Link href="/forgot-password" className="text-sm font-semibold text-rosewood">Forgot password?</Link>
      </form>
    </main>
  );
}
