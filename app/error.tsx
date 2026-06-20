"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="container py-16 text-center">
      <h1 className="text-4xl font-black">Something went wrong</h1>
      <button onClick={reset} className="mt-5 rounded-md bg-ink px-4 py-2 font-bold text-white">Try again</button>
    </main>
  );
}
