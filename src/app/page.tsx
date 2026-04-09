import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-stone-50 to-stone-100 p-6">
      <Link
        href="/board"
        className="block w-full max-w-md text-center bg-white border border-stone-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-12"
      >
        <div className="text-5xl mb-4">🌳</div>
        <h1 className="text-3xl font-semibold text-stone-800 mb-2">다윗나무에 사랑 열렸네</h1>
        <p className="text-sm text-stone-500">함께 기도해요</p>
        <div className="mt-8 inline-block px-6 py-2 rounded-full bg-stone-800 text-white text-sm">
          입장하기 →
        </div>
      </Link>
    </main>
  );
}
