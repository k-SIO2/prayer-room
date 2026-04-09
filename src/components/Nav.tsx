"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const path = usePathname();
  return (
    <header className="border-b border-stone-200 bg-white sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-base font-semibold text-stone-800">
          🌳 다윗나무
        </Link>
        <nav className="flex gap-1 text-sm">
          <Link
            href="/board"
            className={`px-3 py-1.5 rounded-full ${
              path === "/board"
                ? "bg-stone-800 text-white"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            게시판
          </Link>
          <Link
            href="/me"
            className={`px-3 py-1.5 rounded-full ${
              path === "/me"
                ? "bg-stone-800 text-white"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            내 기도제목
          </Link>
        </nav>
      </div>
    </header>
  );
}
