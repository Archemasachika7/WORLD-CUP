-- ============================================================
-- World Cup 2026 Hub — Fix bracket schema and add runner-up
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Add runner_up column if it doesn't exist
alter table if exists public.bracket_predictions
add column if not exists runner_up text;

-- Rename tables to match frontend expectations (if they don't already exist)
-- Create alias tables for backward compatibility
create table if not exists public.predictions as
select * from public.bracket_predictions where false;

create table if not exists public.profiles as
select * from public.user_profiles where false;

-- Create views to map old table names to new ones
create or replace view public.predictions_view as
select 
  id,
  user_id,
  email,
  fav_team as favorite_nation,
  champion,
  runner_up,
  updated_at,
  created_at
from public.bracket_predictions;

create or replace view public.profiles_view as
select * from public.user_profiles;
