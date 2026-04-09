"use client";

import { useState } from "react";
import {
  toggleHeart,
  createComment,
  deletePrayer,
  setPublic,
  type Prayer,
} from "@/lib/board";

export default function PrayerCard({
  prayer,
  onChange,
  showVisibilityToggle = false,
}: {
  prayer: Prayer;
  onChange: () => void;
  showVisibilityToggle?: boolean;
}) {
  const [showComments, setShowComments] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onHeart() {
    try {
      await toggleHeart(prayer.id, prayer.i_hearted);
      onChange();
    } catch (e) {
      console.error(e);
    }
  }

  async function onDelete() {
    if (!confirm("정말 삭제하시겠어요?")) return;
    setBusy(true);
    try {
      await deletePrayer(prayer.id);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  async function onTogglePublic() {
    setBusy(true);
    try {
      await setPublic(prayer.id, !prayer.is_public);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-stone-700">{prayer.author_name}</span>
          {showVisibilityToggle && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                prayer.is_public
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-stone-100 text-stone-500 border border-stone-200"
              }`}
            >
              {prayer.is_public ? "공개" : "비공개"}
            </span>
          )}
        </div>
        <span className="text-xs text-stone-400">
          {new Date(prayer.created_at).toLocaleString("ko-KR")}
        </span>
      </div>
      <p className="text-stone-800 whitespace-pre-wrap mb-4">{prayer.content}</p>
      <div className="flex items-center gap-2 text-sm flex-wrap">
        <button
          onClick={onHeart}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${
            prayer.i_hearted
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : "bg-white border-stone-200 text-stone-600"
          }`}
        >
          {prayer.i_hearted ? "❤️" : "🤍"} 기도할게요 · {prayer.hearts}
        </button>
        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-200 bg-white text-stone-600"
        >
          💬 댓글 · {prayer.comments.length}
        </button>
        {showVisibilityToggle && prayer.is_mine && (
          <button
            onClick={onTogglePublic}
            disabled={busy}
            className="px-3 py-1.5 rounded-full border border-stone-200 bg-white text-stone-600 disabled:opacity-50"
          >
            {prayer.is_public ? "비공개로" : "게시판에 공개"}
          </button>
        )}
        {prayer.is_mine && (
          <button
            onClick={onDelete}
            disabled={busy}
            className="ml-auto px-3 py-1.5 rounded-full border border-rose-200 text-rose-600 bg-white disabled:opacity-50"
          >
            삭제
          </button>
        )}
      </div>
      {showComments && (
        <CommentSection prayerId={prayer.id} comments={prayer.comments} onChange={onChange} />
      )}
    </div>
  );
}

function CommentSection({
  prayerId,
  comments,
  onChange,
}: {
  prayerId: string;
  comments: Prayer["comments"];
  onChange: () => void;
}) {
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [anon, setAnon] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    if (!anon && !name.trim()) return;
    setBusy(true);
    try {
      await createComment(prayerId, text, name, anon);
      setText("");
      onChange();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-stone-100 space-y-3">
      {comments.map((c) => (
        <div key={c.id} className="text-sm">
          <span className="font-medium text-stone-700">{c.author_name}</span>
          <span className="text-stone-400 text-xs ml-2">
            {new Date(c.created_at).toLocaleString("ko-KR")}
          </span>
          <p className="text-stone-700 whitespace-pre-wrap mt-1">{c.content}</p>
        </div>
      ))}
      <form onSubmit={submit} className="space-y-2 pt-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="닉네임"
          disabled={anon}
          className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm disabled:bg-stone-100"
          maxLength={30}
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="댓글을 남겨주세요"
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm resize-none"
          maxLength={1000}
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-stone-600">
            <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} />
            익명
          </label>
          <button
            type="submit"
            disabled={busy || !text.trim() || (!anon && !name.trim())}
            className="px-3 py-1.5 rounded-lg bg-stone-800 text-white text-xs disabled:bg-stone-300"
          >
            올리기
          </button>
        </div>
      </form>
    </div>
  );
}
