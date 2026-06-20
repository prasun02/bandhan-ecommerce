export default function AboutPage() {
  return <InfoPage title="About Us" body="Bandhan is configured as a customizable fashion storefront for Bangladesh, with editable settings, menus, policies, homepage sections, and catalog data." />;
}

function InfoPage({ title, body }: { title: string; body: string }) {
  return <main className="container py-10"><section className="rounded-md bg-white p-6 shadow-sm"><h1 className="text-3xl font-black">{title}</h1><p className="mt-4 leading-7 text-ink/70">{body}</p></section></main>;
}
