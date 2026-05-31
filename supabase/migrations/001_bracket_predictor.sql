-- ============================================================
-- World Cup 2026 Hub — Bracket Predictor Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Bracket predictions table
create table if not exists public.bracket_predictions (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  email         text,
  fav_team      text,
  group_winners jsonb default '{}'::jsonb,
  champion      text,
  updated_at    timestamptz default now(),
  created_at    timestamptz default now(),
  unique(user_id)
);

-- User profiles (nickname / fav team)
create table if not exists public.user_profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nickname   text,
  fav_team   text,
  updated_at timestamptz default now()
);

-- RLS: each user sees only their own rows
alter table public.bracket_predictions enable row level security;
alter table public.user_profiles       enable row level security;

create policy "bracket_select_own" on public.bracket_predictions
  for select using (auth.uid() = user_id);
create policy "bracket_insert_own" on public.bracket_predictions
  for insert with check (auth.uid() = user_id);
create policy "bracket_update_own" on public.bracket_predictions
  for update using (auth.uid() = user_id);

create policy "profile_select_own" on public.user_profiles
  for select using (auth.uid() = id);
create policy "profile_insert_own" on public.user_profiles
  for insert with check (auth.uid() = id);
create policy "profile_update_own" on public.user_profiles
  for update using (auth.uid() = id);

-- Indexes
create index if not exists idx_bracket_user     on public.bracket_predictions(user_id);
create index if not exists idx_bracket_champion on public.bracket_predictions(champion);
