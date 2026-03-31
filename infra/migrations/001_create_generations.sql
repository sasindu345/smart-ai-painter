-- Phase 3: Create generations table for user gallery
-- Run this in Supabase SQL Editor

create table generations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users on delete cascade,
  prompt      text not null,
  style       text not null,
  image_url   text not null,
  created_at  timestamptz default now()
);

alter table generations enable row level security;

create policy "Users manage own generations"
  on generations for all using (auth.uid() = user_id);

-- Create index for gallery queries (user's generations ordered by date)
create index idx_generations_user_created
  on generations (user_id, created_at desc);
