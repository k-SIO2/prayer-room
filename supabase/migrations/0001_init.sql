-- Prayer Room — Phase 1 schema
-- Tables: groups, members, prayers, prayer_actions
-- Security: RLS enabled on all tables. Members can only read/write within groups they belong to.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- groups: a small-group prayer room. join by 6-char code.
-- ─────────────────────────────────────────────────────────────
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- members: (group × auth user). nickname + anonymous flag.
-- ─────────────────────────────────────────────────────────────
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  auth_uid uuid not null references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 30),
  is_anonymous boolean not null default false,
  joined_at timestamptz not null default now(),
  unique (group_id, auth_uid)
);

create index if not exists members_group_idx on members(group_id);
create index if not exists members_auth_idx on members(auth_uid);

-- ─────────────────────────────────────────────────────────────
-- prayers: prayer requests posted to a group.
-- ─────────────────────────────────────────────────────────────
create table if not exists prayers (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists prayers_group_created_idx on prayers(group_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- prayer_actions: "I prayed" action + optional encouragement message.
-- One row per (prayer, member). Message can be UPDATEd later.
-- ─────────────────────────────────────────────────────────────
create table if not exists prayer_actions (
  id uuid primary key default gen_random_uuid(),
  prayer_id uuid not null references prayers(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  prayed_at timestamptz not null default now(),
  message text check (message is null or char_length(message) between 1 and 500),
  created_at timestamptz not null default now(),
  unique (prayer_id, member_id)
);

create index if not exists prayer_actions_prayer_idx on prayer_actions(prayer_id);

-- ─────────────────────────────────────────────────────────────
-- RLS — every table locked down. Membership is the gate.
-- ─────────────────────────────────────────────────────────────
alter table groups enable row level security;
alter table members enable row level security;
alter table prayers enable row level security;
alter table prayer_actions enable row level security;

-- helper: is the current auth user a member of group_id?
create or replace function is_group_member(gid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from members
    where group_id = gid and auth_uid = auth.uid()
  );
$$;

-- groups: anyone authenticated can create a group; only members can read it.
create policy "groups_insert_self" on groups
  for insert to authenticated
  with check (created_by = auth.uid());

create policy "groups_select_members" on groups
  for select to authenticated
  using (is_group_member(id));

-- Lookup-by-code: a security-definer function so non-members can resolve a code
-- without exposing a SELECT-all policy. Returns id+name only when code matches exactly.
create or replace function find_group_by_code(p_code text)
returns table (id uuid, name text)
language sql
security definer
stable
as $$
  select g.id, g.name from groups g where g.code = upper(p_code) limit 1;
$$;

revoke all on function find_group_by_code(text) from public;
grant execute on function find_group_by_code(text) to authenticated;

-- members: a user can insert their OWN membership row (joining a group),
-- and members can see other members of groups they belong to.
create policy "members_insert_self" on members
  for insert to authenticated
  with check (auth_uid = auth.uid());

create policy "members_select_same_group" on members
  for select to authenticated
  using (is_group_member(group_id));

-- prayers: only group members can read or write prayers in their groups.
create policy "prayers_select_members" on prayers
  for select to authenticated
  using (is_group_member(group_id));

create policy "prayers_insert_members" on prayers
  for insert to authenticated
  with check (
    is_group_member(group_id)
    and exists (
      select 1 from members
      where id = member_id and auth_uid = auth.uid()
    )
  );

-- prayer_actions: members of the prayer's group can read; users can insert/update
-- only their own action row.
create policy "prayer_actions_select_members" on prayer_actions
  for select to authenticated
  using (
    exists (
      select 1 from prayers p
      where p.id = prayer_id and is_group_member(p.group_id)
    )
  );

create policy "prayer_actions_insert_self" on prayer_actions
  for insert to authenticated
  with check (
    exists (
      select 1 from members m
      where m.id = member_id and m.auth_uid = auth.uid()
    )
  );

create policy "prayer_actions_update_self" on prayer_actions
  for update to authenticated
  using (
    exists (
      select 1 from members m
      where m.id = member_id and m.auth_uid = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- Realtime: publish prayers + prayer_actions so clients can subscribe.
-- ─────────────────────────────────────────────────────────────
alter publication supabase_realtime add table prayers;
alter publication supabase_realtime add table prayer_actions;
