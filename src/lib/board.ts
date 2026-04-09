import { supabase } from "./supabase";

const TOKEN_KEY = "prayer-board-anon-token";

export function getAnonToken(): string {
  if (typeof window === "undefined") return "";
  let t = localStorage.getItem(TOKEN_KEY);
  if (!t) {
    t = crypto.randomUUID();
    localStorage.setItem(TOKEN_KEY, t);
  }
  return t;
}

export type Comment = {
  id: string;
  prayer_id: string;
  content: string;
  author_name: string;
  is_anonymous: boolean;
  created_at: string;
};

export type Prayer = {
  id: string;
  content: string;
  author_name: string;
  is_anonymous: boolean;
  is_public: boolean;
  is_mine: boolean;
  created_at: string;
  hearts: number;
  i_hearted: boolean;
  comments: Comment[];
};

const SELECT_COLS = `id, content, author_name, is_anonymous, is_public, anon_token, created_at,
  prayer_hearts ( anon_token ),
  comments ( id, prayer_id, content, author_name, is_anonymous, created_at )`;

type Row = {
  id: string;
  content: string;
  author_name: string;
  is_anonymous: boolean;
  is_public: boolean;
  anon_token: string;
  created_at: string;
  prayer_hearts: { anon_token: string }[];
  comments: Comment[];
};

function mapRow(p: Row, token: string): Prayer {
  return {
    id: p.id,
    content: p.content,
    author_name: p.is_anonymous ? "익명" : p.author_name,
    is_anonymous: p.is_anonymous,
    is_public: p.is_public,
    is_mine: p.anon_token === token,
    created_at: p.created_at,
    hearts: p.prayer_hearts.length,
    i_hearted: p.prayer_hearts.some((h) => h.anon_token === token),
    comments: (p.comments || [])
      .map((c) => ({ ...c, author_name: c.is_anonymous ? "익명" : c.author_name }))
      .sort((a, b) => a.created_at.localeCompare(b.created_at)),
  };
}

// Public board: only is_public = true
export async function fetchPublicPrayers(): Promise<Prayer[]> {
  const token = getAnonToken();
  const { data, error } = await supabase
    .from("prayers")
    .select(SELECT_COLS)
    .eq("is_public", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as Row[]).map((r) => mapRow(r, token));
}

// Personal page: all my prayers (private + public), filtered by anon_token
export async function fetchMyPrayers(): Promise<Prayer[]> {
  const token = getAnonToken();
  if (!token) return [];
  const { data, error } = await supabase
    .from("prayers")
    .select(SELECT_COLS)
    .eq("anon_token", token)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as Row[]).map((r) => mapRow(r, token));
}

export async function createPrayer(
  content: string,
  authorName: string,
  isAnonymous: boolean,
  isPublic: boolean
) {
  const { error } = await supabase.from("prayers").insert({
    content: content.trim(),
    author_name: isAnonymous ? "익명" : authorName.trim(),
    is_anonymous: isAnonymous,
    is_public: isPublic,
    anon_token: getAnonToken(),
  });
  if (error) throw error;
}

export async function setPublic(prayerId: string, isPublic: boolean) {
  const token = getAnonToken();
  const { error } = await supabase
    .from("prayers")
    .update({ is_public: isPublic })
    .eq("id", prayerId)
    .eq("anon_token", token);
  if (error) throw error;
}

export async function updatePrayer(prayerId: string, content: string) {
  const token = getAnonToken();
  const { error } = await supabase
    .from("prayers")
    .update({ content: content.trim() })
    .eq("id", prayerId)
    .eq("anon_token", token);
  if (error) throw error;
}

export async function deletePrayer(prayerId: string) {
  const token = getAnonToken();
  const { error } = await supabase
    .from("prayers")
    .delete()
    .eq("id", prayerId)
    .eq("anon_token", token);
  if (error) throw error;
}

export async function toggleHeart(prayerId: string, currentlyHearted: boolean) {
  const token = getAnonToken();
  if (currentlyHearted) {
    const { error } = await supabase
      .from("prayer_hearts")
      .delete()
      .eq("prayer_id", prayerId)
      .eq("anon_token", token);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("prayer_hearts")
      .insert({ prayer_id: prayerId, anon_token: token });
    if (error && error.code !== "23505") throw error;
  }
}

export async function createComment(
  prayerId: string,
  content: string,
  authorName: string,
  isAnonymous: boolean
) {
  const { error } = await supabase.from("comments").insert({
    prayer_id: prayerId,
    content: content.trim(),
    author_name: isAnonymous ? "익명" : authorName.trim(),
    is_anonymous: isAnonymous,
    anon_token: getAnonToken(),
  });
  if (error) throw error;
}
