-- Phase 3: Create sketches table for user sketch gallery
-- Run this in Supabase SQL Editor

create table sketches (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users on delete cascade,
  title       text not null default 'Untitled Sketch',
  image_url   text not null,
  page_preset text not null default 'landscape',
  page_width  int not null default 1600,
  page_height int not null default 900,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table sketches enable row level security;

create policy "Users manage own sketches"
  on sketches for all using (auth.uid() = user_id);

create index idx_sketches_user_created
  on sketches (user_id, created_at desc);
