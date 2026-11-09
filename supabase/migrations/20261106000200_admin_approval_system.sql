alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('seeker', 'owner', 'agent', 'admin'));

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create or replace function public.prevent_self_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and (
       new.id = (select auth.uid())
       or not public.is_admin()
     ) then
    raise exception 'Only an administrator can change another user role';
  end if;
  return new;
end;
$$;

drop policy if exists "Administrators can read role requests"
  on public.profile_role_requests;
create policy "Administrators can read role requests"
  on public.profile_role_requests for select
  to authenticated
  using (public.is_admin());

create or replace function public.admin_dashboard_stats()
returns table (
  total_users bigint,
  seekers bigint,
  agents bigint,
  owners bigint,
  pending_agents bigint,
  pending_owners bigint,
  approved_requests bigint,
  rejected_requests bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  return query
  select
    (select count(*) from public.profiles),
    (select count(*) from public.profiles where role = 'seeker'),
    (select count(*) from public.profiles where role = 'agent'),
    (select count(*) from public.profiles where role = 'owner'),
    (select count(*) from public.profile_role_requests
      where status = 'pending' and requested_role = 'agent'),
    (select count(*) from public.profile_role_requests
      where status = 'pending' and requested_role = 'owner'),
    (select count(*) from public.profile_role_requests where status = 'approved'),
    (select count(*) from public.profile_role_requests where status = 'rejected');
end;
$$;

create or replace function public.admin_list_role_requests(
  p_status text default null
)
returns table (
  id uuid,
  user_id uuid,
  requested_role text,
  status text,
  created_at timestamptz,
  display_name text,
  profile_role text,
  is_verified boolean,
  email text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;
  if p_status is not null
     and p_status not in ('pending', 'approved', 'rejected') then
    raise exception 'Invalid request status';
  end if;

  return query
  select
    request.id,
    request.user_id,
    request.requested_role,
    request.status,
    request.created_at,
    profile.display_name,
    profile.role,
    profile.is_verified,
    coalesce(auth_user.email, '')::text
  from public.profile_role_requests as request
  join public.profiles as profile on profile.id = request.user_id
  join auth.users as auth_user on auth_user.id = request.user_id
  where p_status is null or request.status = p_status
  order by request.created_at desc;
end;
$$;

create or replace function public.admin_decide_role_request(
  p_request_id uuid,
  p_approve boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  role_request public.profile_role_requests%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;
  if p_approve is null then
    raise exception 'A role request decision is required';
  end if;

  select *
  into role_request
  from public.profile_role_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Role request not found';
  end if;
  if role_request.status <> 'pending' then
    raise exception 'This role request has already been decided';
  end if;

  if p_approve then
    update public.profiles
    set role = role_request.requested_role
    where id = role_request.user_id;
    if not found then
      raise exception 'Applicant profile not found';
    end if;

    update public.profile_role_requests
    set status = 'approved'
    where id = role_request.id;
    return 'approved';
  end if;

  update public.profile_role_requests
  set status = 'rejected'
  where id = role_request.id;
  return 'rejected';
end;
$$;

revoke all on function public.admin_dashboard_stats() from public, anon;
revoke all on function public.admin_list_role_requests(text) from public, anon;
revoke all on function public.admin_decide_role_request(uuid, boolean) from public, anon;
grant execute on function public.admin_dashboard_stats() to authenticated;
grant execute on function public.admin_list_role_requests(text) to authenticated;
grant execute on function public.admin_decide_role_request(uuid, boolean) to authenticated;
