-- ============================================================
-- World Cup 2026 Hub — Supabase setup SQL
-- Run this in Supabase → SQL Editor (one-time)
-- ============================================================

-- 1. Profiles table (public, one row per auth user)
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  bio           text,
  avatar_url    text,
  country       text,
  fav_team      text,          -- matches TEAMS[].id e.g. "por", "eng"
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Row Level Security: users can only read/write their own row
alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 2. Predictions table (if not already created)
create table if not exists public.predictions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade,
  favorite_nation text,
  champion        text,
  runner_up       text,
  created_at      timestamptz default now(),
  unique(user_id)
);

alter table public.predictions enable row level security;

create policy "Users can manage their own predictions"
  on public.predictions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. Auto-create a blank profile row whenever a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
