create table if not exists generations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users on delete cascade,
  prompt      text not null,
  style       text not null,
  image_url   text not null,
  created_at  timestamptz default now()
);

alter table generations enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'Users manage own generations'
  ) then
    create policy "Users manage own generations"
      on generations for all using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists idx_generations_user_created
  on generations (user_id, created_at desc);
