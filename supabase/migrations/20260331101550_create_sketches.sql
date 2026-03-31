create table if not exists sketches (
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

do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'Users manage own sketches'
  ) then
    create policy "Users manage own sketches"
      on sketches for all using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists idx_sketches_user_created
  on sketches (user_id, created_at desc);
