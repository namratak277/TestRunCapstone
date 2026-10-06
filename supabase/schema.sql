-- Test Run database schema. Paste into Supabase: SQL Editor -> New query -> Run.

create extension if not exists "pgcrypto";

-- PROFILES -------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now()
);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- POSTS ----------------------------------------------------------------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('skill','activity','request')),
  title text not null check (char_length(title) between 3 and 120),
  category text not null default '',
  description text not null default '',
  location text not null default '',
  price_cents integer not null default 0 check (price_cents >= 0),
  capacity integer not null default 1 check (capacity between 1 and 50),
  duration_min integer not null default 60 check (duration_min between 15 and 480),
  requires_waiver boolean not null default true,
  spots_filled integer not null default 0,
  status text generated always as (case when spots_filled >= capacity then 'booked' else 'open' end) stored,
  created_at timestamptz not null default now()
);
create index posts_created_idx on public.posts (created_at desc);

create table public.post_times (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  starts_at timestamptz not null
);
create index post_times_post_idx on public.post_times (post_id, starts_at);

-- PARTICIPANTS ---------------------------------------------------------
create table public.participants (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  time_id uuid references public.post_times(id) on delete set null,
  message text not null default '',
  waiver_at timestamptz,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

-- Helper used by policies (security definer avoids recursive policy checks)
create function public.is_post_member(p_post uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.posts where id = p_post and host_id = auth.uid())
      or exists (select 1 from public.participants where post_id = p_post and user_id = auth.uid());
$$;

-- Atomic join: checks capacity, waiver, duplicates, and updates the counter
create function public.join_post(p_post uuid, p_time uuid, p_message text, p_waiver boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v public.posts%rowtype;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select * into v from public.posts where id = p_post for update;
  if not found then raise exception 'Post not found'; end if;
  if v.host_id = auth.uid() then raise exception 'You cannot join your own post'; end if;
  if exists (select 1 from public.participants where post_id = p_post and user_id = auth.uid()) then
    raise exception 'You already joined this post';
  end if;
  if v.spots_filled >= v.capacity then raise exception 'This post is booked'; end if;
  if v.requires_waiver and not coalesce(p_waiver, false) then raise exception 'Please acknowledge the waiver'; end if;
  if p_time is not null and not exists (select 1 from public.post_times where id = p_time and post_id = p_post) then
    raise exception 'Invalid time option';
  end if;
  insert into public.participants (post_id, user_id, time_id, message, waiver_at)
  values (p_post, auth.uid(), p_time, coalesce(p_message, ''), case when p_waiver then now() end);
  update public.posts set spots_filled = spots_filled + 1 where id = p_post;
end $$;

create function public.leave_post(p_post uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.participants where post_id = p_post and user_id = auth.uid();
  if found then update public.posts set spots_filled = greatest(spots_filled - 1, 0) where id = p_post; end if;
end $$;

-- MESSAGES (one chat per post: host + everyone who joined) -------------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index messages_post_idx on public.messages (post_id, created_at);

-- QUESTIONS (public Q&A on a post) -------------------------------------
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  answer text,
  created_at timestamptz not null default now()
);

-- RATINGS ----------------------------------------------------------------
create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  rater_id uuid not null references public.profiles(id) on delete cascade,
  ratee_id uuid not null references public.profiles(id) on delete cascade,
  showed_up boolean not null default true,
  stars integer check (stars between 1 and 5),
  tags text[] not null default '{}',
  comment text not null default '',
  created_at timestamptz not null default now(),
  unique (post_id, rater_id, ratee_id),
  check (rater_id <> ratee_id)
);

-- REPORTS ----------------------------------------------------------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  reason text not null default '',
  created_at timestamptz not null default now()
);

-- ROW LEVEL SECURITY -----------------------------------------------------
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_times enable row level security;
alter table public.participants enable row level security;
alter table public.messages enable row level security;
alter table public.questions enable row level security;
alter table public.ratings enable row level security;
alter table public.reports enable row level security;

create policy "profiles readable" on public.profiles for select using (true);
create policy "profiles update own" on public.profiles for update using (id = auth.uid());

create policy "posts readable" on public.posts for select using (true);
create policy "posts insert own" on public.posts for insert with check (host_id = auth.uid());
create policy "posts update own" on public.posts for update using (host_id = auth.uid());
create policy "posts delete own" on public.posts for delete using (host_id = auth.uid());

create policy "times readable" on public.post_times for select using (true);
create policy "times insert by host" on public.post_times for insert
  with check (exists (select 1 from public.posts p where p.id = post_id and p.host_id = auth.uid()));
create policy "times delete by host" on public.post_times for delete
  using (exists (select 1 from public.posts p where p.id = post_id and p.host_id = auth.uid()));

-- participants: no insert policy on purpose, joining goes through join_post()
create policy "participants readable by members" on public.participants for select
  using (user_id = auth.uid() or public.is_post_member(post_id));

create policy "messages readable by members" on public.messages for select using (public.is_post_member(post_id));
create policy "messages insert by members" on public.messages for insert
  with check (sender_id = auth.uid() and public.is_post_member(post_id));

create policy "questions readable" on public.questions for select using (true);
create policy "questions insert signed in" on public.questions for insert with check (user_id = auth.uid());
create policy "questions answer by host" on public.questions for update
  using (exists (select 1 from public.posts p where p.id = post_id and p.host_id = auth.uid()));

create policy "ratings readable" on public.ratings for select using (true);
create policy "ratings insert by members" on public.ratings for insert
  with check (rater_id = auth.uid() and public.is_post_member(post_id));

create policy "reports insert own" on public.reports for insert with check (reporter_id = auth.uid());

-- REALTIME ---------------------------------------------------------------
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.posts;
