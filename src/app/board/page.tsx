"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchPublicPrayers, type Prayer } from "@/lib/board";
import Nav from "@/components/Nav";
import PrayerCard from "@/components/PrayerCard";
import ComposeModal from "@/components/ComposeModal";

export default function BoardPage() {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);

  const reload = useCallback(async () => {
    try {
      setPrayers(await fetchPublicPrayers());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "불러오기 실패");
    }
  }, []);

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [reload]);

  useEffect(() => {
    const ch = supabase
      .channel("board")
      .on("postgres_changes", { event: "*", schema: "public", table: "prayers" }, () => reload())
      .on("postgres_changes", { event: "*", schema: "public", table: "prayer_hearts" }, () => reload())
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, () => reload())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [reload]);

  return (
    <main className="min-h-screen bg-stone-50 pb-32">
      <Nav />
      <div className="max-w-2xl mx-auto px-4 pt-4 flex justify-end">
        <button
          onClick={() => setComposing(true)}
          className="px-4 py-2 rounded-full bg-stone-800 text-white text-sm"
        >
          + 기도제목 올리기
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {loading && <p className="text-center text-stone-400 py-8">불러오는 중…</p>}
        {err && <p className="text-center text-red-600 py-4">{err}</p>}
        {!loading && prayers.length === 0 && (
          <p className="text-center text-stone-400 py-12">
            아직 공개된 기도제목이 없어요.
          </p>
        )}
        {prayers.map((p) => (
          <PrayerCard key={p.id} prayer={p} onChange={reload} />
        ))}
      </div>

      {composing && (
        <ComposeModal
          defaultPublic={true}
          showVisibilityChoice={false}
          onClose={() => setComposing(false)}
          onCreated={() => {
            setComposing(false);
            reload();
          }}
        />
      )}
    </main>
  );
}
