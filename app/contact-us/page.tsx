export default function ContactPage() {
  return (
    <main className="container py-10">
      <form className="mx-auto grid max-w-2xl gap-4 rounded-md bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black">Contact Us</h1>
        <input name="name" placeholder="Name" className="h-11 rounded-md border border-ink/15 px-3" />
        <input name="phone" placeholder="Phone" className="h-11 rounded-md border border-ink/15 px-3" />
        <textarea name="message" placeholder="Message" className="min-h-32 rounded-md border border-ink/15 p-3" />
        <button className="h-11 rounded-md bg-rosewood font-bold text-white">Send message</button>
      </form>
    </main>
  );
}
