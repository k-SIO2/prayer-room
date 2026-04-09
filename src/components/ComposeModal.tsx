"use client";

import { useState } from "react";
import { createPrayer } from "@/lib/board";

export default function ComposeModal({
  defaultPublic,
  showVisibilityChoice,
  onClose,
  onCreated,
}: {
  defaultPublic: boolean;
  showVisibilityChoice: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [content, setContent] = useState("");
  const [name, setName] = useState("");
  const [anon, setAnon] = useState(false);
  const [isPublic, setIsPublic] = useState(defaultPublic);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!content.trim()) return setErr("기도제목을 입력해주세요.");
    if (!anon && !name.trim()) return setErr("닉네임을 입력해주세요.");
    setBusy(true);
    try {
      await createPrayer(content, name, anon, isPublic);
      onCreated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "오류");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-20 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-stone-800">기도제목 나누기</h2>
        <form onSubmit={submit} className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="닉네임"
            disabled={anon}
            className="w-full px-4 py-3 rounded-lg border border-stone-200 disabled:bg-stone-100"
            maxLength={30}
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="기도제목을 나눠주세요…"
            rows={5}
            className="w-full px-4 py-3 rounded-lg border border-stone-200 resize-none"
            maxLength={2000}
            autoFocus
          />
          <label className="flex items-center gap-2 text-sm text-stone-600">
            <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} />
            익명으로 올리기
          </label>
          {showVisibilityChoice && (
            <label className="flex items-center gap-2 text-sm text-stone-600">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              게시판에 공개 (체크 안 하면 나만 볼 수 있어요)
            </label>
          )}
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-lg bg-stone-100 text-stone-700"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 py-3 rounded-lg bg-stone-800 text-white disabled:bg-stone-400"
            >
              {busy ? "..." : "올리기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
