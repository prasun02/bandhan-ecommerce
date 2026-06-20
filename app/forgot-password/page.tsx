export default function ForgotPasswordPage() {
  return (
    <main className="container py-10">
      <form className="mx-auto grid max-w-md gap-4 rounded-md bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black">Forgot password</h1>
        <input type="email" name="email" placeholder="Email address" className="h-11 rounded-md border border-ink/15 px-3" />
        <button className="h-11 rounded-md bg-rosewood font-bold text-white">Send reset link</button>
      </form>
    </main>
  );
}
