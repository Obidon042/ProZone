create or replace function public.prevent_self_role_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null then
    raise exception 'Profile role changes require administrator approval';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_self_role_change on public.profiles;
create trigger profiles_prevent_self_role_change
  before update on public.profiles
  for each row execute procedure public.prevent_self_role_change();

revoke update on public.profiles from anon, authenticated;
revoke update (role) on public.profiles from anon, authenticated;
grant update (display_name) on public.profiles to authenticated;

create table if not exists public.profile_role_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  requested_role text not null check (requested_role in ('owner', 'agent')),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create unique index if not exists profile_role_requests_one_pending_idx
  on public.profile_role_requests (user_id)
  where status = 'pending';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'requested_role';
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'ProZone user'),
    'seeker'
  );

  if requested_role in ('owner', 'agent') then
    insert into public.profile_role_requests (user_id, requested_role)
    values (new.id, requested_role);
  end if;

  return new;
end;
$$;

alter table public.profile_role_requests enable row level security;

drop policy if exists "Users can read their role requests"
  on public.profile_role_requests;
create policy "Users can read their role requests"
  on public.profile_role_requests for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can request an owner or agent role"
  on public.profile_role_requests;
create policy "Users can request an owner or agent role"
  on public.profile_role_requests for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and requested_role in ('owner', 'agent')
  );

revoke all on public.profile_role_requests from anon, authenticated;
grant select on public.profile_role_requests to authenticated;
grant insert (user_id, requested_role) on public.profile_role_requests to authenticated;
