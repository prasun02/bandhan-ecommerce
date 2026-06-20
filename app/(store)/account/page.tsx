const tabs = ["Overview", "Profile", "Addresses", "Orders", "Wishlist", "Reviews", "Returns", "Coupons", "Password"];

export default function AccountPage() {
  return (
    <main className="container py-8">
      <h1 className="text-3xl font-black">Customer account</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-md bg-white p-3 shadow-sm">
          {tabs.map((tab) => <a key={tab} href={`#${tab.toLowerCase()}`} className="block rounded-md px-3 py-2 font-semibold hover:bg-mist">{tab}</a>)}
        </aside>
        <section className="rounded-md bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Dashboard overview</h2>
          <p className="mt-3 text-ink/65">Profile, saved addresses, order history, tracking, wishlist, returns, and invoices are modeled for authenticated customers.</p>
        </section>
      </div>
    </main>
  );
}
