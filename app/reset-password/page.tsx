export default function ResetPasswordPage() {
  return (
    <main className="container py-10">
      <form className="mx-auto grid max-w-md gap-4 rounded-md bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black">Reset password</h1>
        <input type="password" name="password" placeholder="New password" className="h-11 rounded-md border border-ink/15 px-3" />
        <input type="password" name="confirmPassword" placeholder="Confirm password" className="h-11 rounded-md border border-ink/15 px-3" />
        <button className="h-11 rounded-md bg-rosewood font-bold text-white">Update password</button>
      </form>
    </main>
  );
}
