alter table public.profile_role_requests
  add column if not exists legal_name text,
  add column if not exists phone_number text,
  add column if not exists agency_name text,
  add column if not exists office_address text,
  add column if not exists property_address text,
  add column if not exists document_files jsonb not null default '[]'::jsonb,
  add column if not exists application_submitted boolean not null default false,
  add column if not exists submitted_at timestamptz,
  add column if not exists decision_reason text,
  add column if not exists decided_by uuid references public.profiles (id) on delete set null,
  add column if not exists decided_at timestamptz;

alter table public.profile_role_requests
  drop constraint if exists profile_role_requests_status_check;
alter table public.profile_role_requests
  add constraint profile_role_requests_status_check
  check (status in ('pending', 'approved', 'rejected', 'needs_info'));

alter table public.profile_role_requests
  drop constraint if exists profile_role_requests_document_files_array_check;
alter table public.profile_role_requests
  add constraint profile_role_requests_document_files_array_check
  check (jsonb_typeof(document_files) = 'array');

drop policy if exists "Users can request an owner or agent role"
  on public.profile_role_requests;
create policy "Users can request an owner or agent role"
  on public.profile_role_requests for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and requested_role in ('owner', 'agent')
  );
grant insert (user_id, requested_role) on public.profile_role_requests to authenticated;

create table if not exists public.profile_role_request_decisions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.profile_role_requests (id) on delete cascade,
  applicant_id uuid not null references public.profiles (id) on delete cascade,
  admin_id uuid references public.profiles (id) on delete set null,
  action text not null check (action in ('approved', 'rejected', 'needs_info')),
  reason text,
  created_at timestamptz not null default now()
);

alter table public.profile_role_request_decisions enable row level security;
drop policy if exists "Administrators can read role request decisions"
  on public.profile_role_request_decisions;
create policy "Administrators can read role request decisions"
  on public.profile_role_request_decisions for select
  to authenticated
  using (public.is_admin());
revoke all on public.profile_role_request_decisions from anon, authenticated;
grant select on public.profile_role_request_decisions to authenticated;

revoke insert, update, delete on public.profile_role_requests
  from anon, authenticated;
grant select on public.profile_role_requests to authenticated;
grant insert (user_id, requested_role) on public.profile_role_requests
  to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'verification-documents',
  'verification-documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Applicants and administrators can read verification documents"
  on storage.objects;
create policy "Applicants and administrators can read verification documents"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'verification-documents'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.is_admin()
    )
  );

drop policy if exists "Applicants can upload their verification documents"
  on storage.objects;
create policy "Applicants can upload their verification documents"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'verification-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.profiles
      where id = (select auth.uid())
        and role in ('seeker', 'owner', 'agent')
    )
  );

drop policy if exists "Applicants can remove their verification documents"
  on storage.objects;
create policy "Applicants can remove their verification documents"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'verification-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and not exists (
      select 1
      from public.profile_role_requests as request
      where request.user_id = (select auth.uid())
        and request.status in ('pending', 'approved')
        and request.document_files @> jsonb_build_array(
          jsonb_build_object('path', name)
        )
    )
  );

revoke update (role, is_verified) on public.profiles from anon, authenticated;

drop policy if exists "Owners and agents can create their listings"
  on public.properties;
create policy "Verified owners and agents can create their listings"
  on public.properties for insert
  to authenticated
  with check (
    owner_id = (select auth.uid())
    and (agent_id is null or agent_id = (select auth.uid()))
    and exists (
      select 1 from public.profiles
      where id = (select auth.uid())
        and role in ('owner', 'agent')
        and is_verified
    )
  );

drop policy if exists "Owners and agents can update their listings"
  on public.properties;
create policy "Verified owners and agents can update their listings"
  on public.properties for update
  to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.profiles
      where id = (select auth.uid())
        and role in ('owner', 'agent')
        and is_verified
    )
  )
  with check (
    owner_id = (select auth.uid())
    and (agent_id is null or agent_id = (select auth.uid()))
    and exists (
      select 1 from public.profiles
      where id = (select auth.uid())
        and role in ('owner', 'agent')
        and is_verified
    )
  );

drop function if exists public.submit_role_verification(
  text, text, text, text, text, text, jsonb
);
create function public.submit_role_verification(
  p_requested_role text,
  p_legal_name text,
  p_phone_number text,
  p_agency_name text,
  p_office_address text,
  p_property_address text,
  p_document_files jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  applicant_id uuid := auth.uid();
  applicant_role text;
  applicant_verified boolean;
  role_request public.profile_role_requests%rowtype;
  result_request_id uuid;
  document jsonb;
  document_path text;
  document_type text;
  document_mime text;
  document_size text;
  document_count integer := 0;
  has_government_id boolean := false;
  has_ownership_proof boolean := false;
begin
  if applicant_id is null then
    raise exception 'Sign in to submit a verification application';
  end if;
  if p_requested_role is null or p_requested_role not in ('agent', 'owner') then
    raise exception 'Select Agent or Owner verification';
  end if;

  select role, is_verified
  into applicant_role, applicant_verified
  from public.profiles
  where id = applicant_id;
  if not found or applicant_role = 'admin' then
    raise exception 'This account cannot submit a verification application';
  end if;
  if applicant_role in ('agent', 'owner')
     and (applicant_role <> p_requested_role or applicant_verified) then
    raise exception 'This account is not eligible for this verification application';
  end if;
  if nullif(trim(p_legal_name), '') is null
     or length(trim(p_legal_name)) > 160
     or nullif(trim(p_phone_number), '') is null
     or length(trim(p_phone_number)) > 40 then
    raise exception 'Enter a legal name and valid phone number';
  end if;
  if p_requested_role = 'owner'
     and nullif(trim(p_property_address), '') is null then
    raise exception 'Property address is required for owner verification';
  end if;
  if p_document_files is null
     or jsonb_typeof(p_document_files) <> 'array'
     or jsonb_array_length(p_document_files) < 1
     or jsonb_array_length(p_document_files) > 8 then
    raise exception 'Attach between one and eight verification documents';
  end if;

  for document in
    select item.value
    from jsonb_array_elements(p_document_files) as item(value)
  loop
    document_count := document_count + 1;
    document_path := document ->> 'path';
    document_type := document ->> 'documentType';
    document_mime := document ->> 'contentType';
    document_size := document ->> 'size';

    if document_type is null or document_type not in (
      'government_id', 'ownership_proof', 'professional_credential',
      'agency_registration', 'other'
    ) then
      raise exception 'A verification document has an unsupported category';
    end if;
    if nullif(trim(document ->> 'fileName'), '') is null
       or length(document ->> 'fileName') > 255
       or document_path is null
       or (storage.foldername(document_path))[1] <> applicant_id::text
       or document_path like '%..%'
       or document_mime is null or document_mime not in (
         'application/pdf', 'image/jpeg', 'image/png', 'image/webp'
       )
       or document_size is null or document_size !~ '^[0-9]+$'
       or document_size::bigint not between 1 and 10485760 then
      raise exception 'A verification document has invalid file details';
    end if;
    if not exists (
      select 1
      from storage.objects as stored_file
      where stored_file.bucket_id = 'verification-documents'
        and stored_file.name = document_path
        and stored_file.metadata ->> 'mimetype' = document_mime
        and (stored_file.metadata ->> 'size') ~ '^[0-9]+$'
        and (stored_file.metadata ->> 'size')::bigint = document_size::bigint
    ) then
      raise exception 'A verification document is missing or does not match its uploaded file';
    end if;

    has_government_id :=
      has_government_id or document_type = 'government_id';
    has_ownership_proof :=
      has_ownership_proof or document_type = 'ownership_proof';
  end loop;

  if not has_government_id then
    raise exception 'Attach a government-issued identification document';
  end if;
  if p_requested_role = 'owner' and not has_ownership_proof then
    raise exception 'Attach evidence of ownership or legal authorization';
  end if;

  select *
  into role_request
  from public.profile_role_requests
  where user_id = applicant_id
    and status in ('pending', 'needs_info')
  order by created_at desc
  limit 1
  for update;

  if found then
    if role_request.requested_role <> p_requested_role then
      raise exception 'A different role request is already in progress';
    end if;
    if role_request.status = 'pending'
       and role_request.application_submitted then
      raise exception 'Your application is already awaiting review';
    end if;

    update public.profile_role_requests
    set legal_name = trim(p_legal_name),
        phone_number = trim(p_phone_number),
        agency_name = nullif(trim(p_agency_name), ''),
        office_address = nullif(trim(p_office_address), ''),
        property_address = nullif(trim(p_property_address), ''),
        document_files = p_document_files,
        application_submitted = true,
        submitted_at = now(),
        status = 'pending',
        decision_reason = null,
        decided_by = null,
        decided_at = null
    where id = role_request.id
    returning id into result_request_id;
    return result_request_id;
  end if;

  insert into public.profile_role_requests (
    user_id, requested_role, status, legal_name, phone_number, agency_name,
    office_address, property_address, document_files, application_submitted,
    submitted_at
  )
  values (
    applicant_id, p_requested_role, 'pending', trim(p_legal_name),
    trim(p_phone_number), nullif(trim(p_agency_name), ''),
    nullif(trim(p_office_address), ''), nullif(trim(p_property_address), ''),
    p_document_files, true, now()
  )
  returning id into result_request_id;
  return result_request_id;
end;
$$;

drop function if exists public.admin_dashboard_stats();
create function public.admin_dashboard_stats()
returns table (
  total_users bigint,
  seekers bigint,
  agents bigint,
  owners bigint,
  pending_agents bigint,
  pending_owners bigint,
  approved_requests bigint,
  rejected_requests bigint,
  approved_agents bigint,
  approved_owners bigint,
  needs_info_agents bigint,
  needs_info_owners bigint
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
      where status = 'pending' and application_submitted
        and requested_role = 'agent'),
    (select count(*) from public.profile_role_requests
      where status = 'pending' and application_submitted
        and requested_role = 'owner'),
    (select count(*) from public.profile_role_requests
      where status = 'approved' and application_submitted),
    (select count(*) from public.profile_role_requests
      where status = 'rejected' and application_submitted),
    (select count(*) from public.profiles
      where role = 'agent' and is_verified),
    (select count(*) from public.profiles
      where role = 'owner' and is_verified),
    (select count(*) from public.profile_role_requests
      where status = 'needs_info' and application_submitted
        and requested_role = 'agent'),
    (select count(*) from public.profile_role_requests
      where status = 'needs_info' and application_submitted
        and requested_role = 'owner');
end;
$$;

drop function if exists public.admin_list_role_requests(text);
create function public.admin_list_role_requests(p_status text default null)
returns table (
  id uuid,
  user_id uuid,
  requested_role text,
  status text,
  created_at timestamptz,
  submitted_at timestamptz,
  display_name text,
  profile_role text,
  is_verified boolean,
  email text,
  legal_name text,
  phone_number text,
  agency_name text,
  office_address text,
  property_address text,
  document_files jsonb,
  decision_reason text,
  decided_at timestamptz,
  decision_history jsonb
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
     and p_status not in ('pending', 'approved', 'rejected', 'needs_info') then
    raise exception 'Invalid request status';
  end if;

  return query
  select
    request.id,
    request.user_id,
    request.requested_role,
    request.status,
    request.created_at,
    request.submitted_at,
    profile.display_name,
    profile.role,
    profile.is_verified,
    coalesce(auth_user.email, '')::text,
    request.legal_name,
    request.phone_number,
    request.agency_name,
    request.office_address,
    request.property_address,
    request.document_files,
    request.decision_reason,
    request.decided_at,
    coalesce(history.decisions, '[]'::jsonb)
  from public.profile_role_requests as request
  join public.profiles as profile on profile.id = request.user_id
  join auth.users as auth_user on auth_user.id = request.user_id
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'action', decision.action,
        'reason', decision.reason,
        'created_at', decision.created_at,
        'admin_name', coalesce(admin_profile.display_name, 'Administrator')
      ) order by decision.created_at desc
    ) as decisions
    from public.profile_role_request_decisions as decision
    left join public.profiles as admin_profile on admin_profile.id = decision.admin_id
    join public.profile_role_requests as previous_request
      on previous_request.id = decision.request_id
    where previous_request.user_id = request.user_id
      and previous_request.requested_role = request.requested_role
  ) as history on true
  where request.application_submitted
    and (p_status is null or request.status = p_status)
  order by request.submitted_at desc nulls last, request.created_at desc;
end;
$$;

drop function if exists public.admin_decide_role_request(uuid, boolean);
create function public.admin_decide_role_request(
  p_request_id uuid,
  p_action text,
  p_reason text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  role_request public.profile_role_requests%rowtype;
  decision_status text;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;
  if p_action is null or p_action not in ('approve', 'reject', 'request_info') then
    raise exception 'Invalid verification decision';
  end if;
  if p_action in ('reject', 'request_info')
     and nullif(trim(p_reason), '') is null then
    raise exception 'A reason is required for this decision';
  end if;
  if p_reason is not null and length(trim(p_reason)) > 2000 then
    raise exception 'Decision notes must be 2000 characters or fewer';
  end if;

  select *
  into role_request
  from public.profile_role_requests
  where id = p_request_id
    and application_submitted
  for update;
  if not found then
    raise exception 'Verification application not found';
  end if;
  if role_request.status <> 'pending' then
    raise exception 'This application is no longer awaiting review';
  end if;

  decision_status :=
    case p_action
      when 'approve' then 'approved'
      when 'reject' then 'rejected'
      else 'needs_info'
    end;

  if p_action = 'approve' then
    if role_request.legal_name is null
       or role_request.phone_number is null
       or not exists (
         select 1
         from jsonb_array_elements(role_request.document_files) as item(value)
         where item.value ->> 'documentType' = 'government_id'
       )
       or (
         role_request.requested_role = 'owner'
         and (
           role_request.property_address is null
           or not exists (
             select 1
             from jsonb_array_elements(role_request.document_files) as item(value)
             where item.value ->> 'documentType' = 'ownership_proof'
           )
         )
       ) then
      raise exception 'The application is missing required identity or ownership evidence';
    end if;
    if exists (
      select 1
      from jsonb_array_elements(role_request.document_files) as document(value)
      where not exists (
        select 1
        from storage.objects as stored_file
        where stored_file.bucket_id = 'verification-documents'
          and stored_file.name = document.value ->> 'path'
          and stored_file.metadata ->> 'mimetype' = document.value ->> 'contentType'
          and (stored_file.metadata ->> 'size') ~ '^[0-9]+$'
          and (stored_file.metadata ->> 'size')::bigint =
            (document.value ->> 'size')::bigint
      )
    ) then
      raise exception 'A verification document is missing or no longer matches its uploaded file';
    end if;

    update public.profiles
    set role = role_request.requested_role,
        is_verified = true
    where id = role_request.user_id;
    if not found then
      raise exception 'Applicant profile not found';
    end if;
  elsif p_action = 'reject' then
    update public.profiles
    set is_verified = false
    where id = role_request.user_id;
  end if;

  update public.profile_role_requests
  set status = decision_status,
      decision_reason = nullif(trim(p_reason), ''),
      decided_by = (select auth.uid()),
      decided_at = now()
  where id = role_request.id;

  insert into public.profile_role_request_decisions (
    request_id, applicant_id, admin_id, action, reason
  )
  values (
    role_request.id, role_request.user_id, (select auth.uid()),
    decision_status, nullif(trim(p_reason), '')
  );

  return decision_status;
end;
$$;

revoke all on function public.submit_role_verification(
  text, text, text, text, text, text, jsonb
) from public, anon;
revoke all on function public.admin_dashboard_stats() from public, anon;
revoke all on function public.admin_list_role_requests(text) from public, anon;
revoke all on function public.admin_decide_role_request(uuid, text, text)
  from public, anon;
grant execute on function public.submit_role_verification(
  text, text, text, text, text, text, jsonb
) to authenticated;
grant execute on function public.admin_dashboard_stats() to authenticated;
grant execute on function public.admin_list_role_requests(text) to authenticated;
grant execute on function public.admin_decide_role_request(uuid, text, text)
  to authenticated;
