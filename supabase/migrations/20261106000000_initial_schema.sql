create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (length(trim(display_name)) between 1 and 120),
  role text not null default 'seeker'
    check (role in ('seeker', 'owner', 'agent')),
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'ProZone user'),
    'seeker'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

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

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  agent_id uuid references public.profiles (id) on delete set null,
  title text not null check (length(trim(title)) between 1 and 160),
  location text not null check (length(trim(location)) between 1 and 240),
  price numeric(15, 2) not null check (price > 0),
  price_period text not null check (price_period in ('month', 'total')),
  bedrooms integer not null check (bedrooms >= 0),
  bathrooms integer not null check (bathrooms >= 0),
  area numeric(10, 2) not null check (area > 0),
  category text not null check (category in ('House', 'Apartment', 'Villa')),
  description text not null default '',
  cover_image_url text not null,
  listing_status text not null default 'active'
    check (listing_status in ('draft', 'active', 'pending', 'sold')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint properties_agent_owner_check
    check (agent_id is null or agent_id = owner_id)
);

create index if not exists properties_marketplace_idx
  on public.properties (listing_status, created_at desc);
create index if not exists properties_owner_idx
  on public.properties (owner_id, created_at desc);

drop trigger if exists properties_set_updated_at on public.properties;
create trigger properties_set_updated_at
  before update on public.properties
  for each row execute procedure public.set_updated_at();

create table if not exists public.property_inquiries (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  property_title text not null,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  sender_name text not null check (length(trim(sender_name)) between 1 and 120),
  sender_phone text not null check (length(trim(sender_phone)) between 7 and 40),
  message text not null check (length(trim(message)) between 1 and 4000),
  status text not null default 'new' check (status in ('new', 'contacted')),
  created_at timestamptz not null default now()
);

create index if not exists property_inquiries_recipient_idx
  on public.property_inquiries (recipient_id, created_at desc);
create index if not exists property_inquiries_sender_idx
  on public.property_inquiries (sender_id, created_at desc);

create or replace function public.assign_inquiry_recipient()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  listing public.properties%rowtype;
begin
  select * into listing
  from public.properties
  where id = new.property_id and listing_status = 'active';

  if not found then
    raise exception 'This listing is not available for inquiries';
  end if;

  new.recipient_id := coalesce(listing.agent_id, listing.owner_id);
  if new.sender_id = new.recipient_id then
    raise exception 'You cannot inquire about your own listing';
  end if;
  new.property_title := listing.title;
  return new;
end;
$$;

drop trigger if exists property_inquiries_assign_recipient on public.property_inquiries;
create trigger property_inquiries_assign_recipient
  before insert on public.property_inquiries
  for each row execute procedure public.assign_inquiry_recipient();

create or replace function public.guard_inquiry_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status
     and (auth.uid() is distinct from old.recipient_id
       or old.status <> 'new'
       or new.status <> 'contacted') then
    raise exception 'Only the listing contact can mark a new inquiry as contacted';
  end if;
  return new;
end;
$$;

drop trigger if exists property_inquiries_guard_status on public.property_inquiries;
create trigger property_inquiries_guard_status
  before update on public.property_inquiries
  for each row execute procedure public.guard_inquiry_status();

create table if not exists public.inspection_bookings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  property_title text not null,
  property_location text not null,
  visitor_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  visitor_name text not null check (length(trim(visitor_name)) between 1 and 120),
  visitor_phone text not null check (length(trim(visitor_phone)) between 7 and 40),
  visit_date date not null,
  visit_time text not null check (length(trim(visit_time)) between 1 and 40),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists inspection_bookings_recipient_idx
  on public.inspection_bookings (recipient_id, visit_date, visit_time);
create index if not exists inspection_bookings_visitor_idx
  on public.inspection_bookings (visitor_id, created_at desc);

create or replace function public.assign_booking_recipient()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  listing public.properties%rowtype;
begin
  select * into listing
  from public.properties
  where id = new.property_id and listing_status = 'active';

  if not found then
    raise exception 'This listing is not available for inspection bookings';
  end if;
  if new.visit_date < current_date then
    raise exception 'Inspection date cannot be in the past';
  end if;

  new.recipient_id := coalesce(listing.agent_id, listing.owner_id);
  if new.visitor_id = new.recipient_id then
    raise exception 'You cannot book an inspection for your own listing';
  end if;
  new.property_title := listing.title;
  new.property_location := listing.location;
  return new;
end;
$$;

drop trigger if exists inspection_bookings_assign_recipient on public.inspection_bookings;
create trigger inspection_bookings_assign_recipient
  before insert on public.inspection_bookings
  for each row execute procedure public.assign_booking_recipient();

create or replace function public.guard_booking_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if auth.uid() = old.visitor_id then
      if new.status <> 'cancelled'
         or old.status not in ('pending', 'confirmed') then
        raise exception 'Visitors can only cancel their own active requests';
      end if;
    elsif auth.uid() = old.recipient_id then
      if new.status not in ('confirmed', 'cancelled')
         or old.status not in ('pending', 'confirmed') then
        raise exception 'Listing contacts can only confirm or cancel active requests';
      end if;
    else
      raise exception 'Not authorized to change this inspection request';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists inspection_bookings_guard_status on public.inspection_bookings;
create trigger inspection_bookings_guard_status
  before update on public.inspection_bookings
  for each row execute procedure public.guard_booking_status();

create table if not exists public.saved_properties (
  user_id uuid not null references public.profiles (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, property_id)
);

create index if not exists saved_properties_user_idx
  on public.saved_properties (user_id, created_at desc);

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

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_inquiries enable row level security;
alter table public.inspection_bookings enable row level security;
alter table public.saved_properties enable row level security;
alter table public.profile_role_requests enable row level security;

drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable"
  on public.profiles for select
  to anon, authenticated
  using (true);

drop policy if exists "Users can update their profile" on public.profiles;
create policy "Users can update their profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists "Active listings are public; owners can see all theirs" on public.properties;
create policy "Active listings are public; owners can see all theirs"
  on public.properties for select
  to anon, authenticated
  using (listing_status = 'active' or owner_id = (select auth.uid()));

drop policy if exists "Owners and agents can create their listings" on public.properties;
create policy "Owners and agents can create their listings"
  on public.properties for insert
  to authenticated
  with check (
    owner_id = (select auth.uid())
    and (agent_id is null or agent_id = (select auth.uid()))
    and exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role in ('owner', 'agent')
    )
  );

drop policy if exists "Owners and agents can update their listings" on public.properties;
create policy "Owners and agents can update their listings"
  on public.properties for update
  to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role in ('owner', 'agent')
    )
  )
  with check (
    owner_id = (select auth.uid())
    and (agent_id is null or agent_id = (select auth.uid()))
    and exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role in ('owner', 'agent')
    )
  );

drop policy if exists "Owners and agents can delete their listings" on public.properties;
create policy "Owners and agents can delete their listings"
  on public.properties for delete
  to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role in ('owner', 'agent')
    )
  );

drop policy if exists "Participants can read inquiries" on public.property_inquiries;
create policy "Participants can read inquiries"
  on public.property_inquiries for select
  to authenticated
  using (sender_id = (select auth.uid()) or recipient_id = (select auth.uid()));

drop policy if exists "Signed-in users can inquire on active listings" on public.property_inquiries;
create policy "Signed-in users can inquire on active listings"
  on public.property_inquiries for insert
  to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.properties
      where id = property_id and listing_status = 'active'
    )
  );

drop policy if exists "Listing contacts can update inquiry status" on public.property_inquiries;
create policy "Listing contacts can update inquiry status"
  on public.property_inquiries for update
  to authenticated
  using (recipient_id = (select auth.uid()))
  with check (recipient_id = (select auth.uid()));

drop policy if exists "Participants can read inspection bookings" on public.inspection_bookings;
create policy "Participants can read inspection bookings"
  on public.inspection_bookings for select
  to authenticated
  using (visitor_id = (select auth.uid()) or recipient_id = (select auth.uid()));

drop policy if exists "Signed-in users can book active listings" on public.inspection_bookings;
create policy "Signed-in users can book active listings"
  on public.inspection_bookings for insert
  to authenticated
  with check (
    visitor_id = (select auth.uid())
    and exists (
      select 1 from public.properties
      where id = property_id and listing_status = 'active'
    )
  );

drop policy if exists "Participants can update inspection status" on public.inspection_bookings;
create policy "Participants can update inspection status"
  on public.inspection_bookings for update
  to authenticated
  using (
    visitor_id = (select auth.uid()) or recipient_id = (select auth.uid())
  )
  with check (
    visitor_id = (select auth.uid()) or recipient_id = (select auth.uid())
  );

drop policy if exists "Users can read their saved properties" on public.saved_properties;
create policy "Users can read their saved properties"
  on public.saved_properties for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can save properties" on public.saved_properties;
create policy "Users can save properties"
  on public.saved_properties for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.properties
      where id = property_id and listing_status = 'active'
    )
  );

drop policy if exists "Users can unsave properties" on public.saved_properties;
create policy "Users can unsave properties"
  on public.saved_properties for delete
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can read their role requests" on public.profile_role_requests;
create policy "Users can read their role requests"
  on public.profile_role_requests for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can request an owner or agent role" on public.profile_role_requests;
create policy "Users can request an owner or agent role"
  on public.profile_role_requests for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and requested_role in ('owner', 'agent')
  );

revoke all on public.profiles, public.properties, public.property_inquiries,
  public.inspection_bookings, public.saved_properties, public.profile_role_requests
  from anon, authenticated;

grant select on public.profiles, public.properties to anon, authenticated;
revoke update on public.profiles from anon, authenticated;
revoke update (role) on public.profiles from anon, authenticated;
grant update (display_name) on public.profiles to authenticated;

grant insert, delete on public.properties to authenticated;
grant update (
  title, location, price, price_period, bedrooms, bathrooms, area,
  category, description, cover_image_url, listing_status
) on public.properties to authenticated;

grant select, insert on public.property_inquiries to authenticated;
grant update (status) on public.property_inquiries to authenticated;

grant select, insert on public.inspection_bookings to authenticated;
grant update (status) on public.inspection_bookings to authenticated;

grant select, insert, delete on public.saved_properties to authenticated;
grant select on public.profile_role_requests to authenticated;
grant insert (user_id, requested_role) on public.profile_role_requests to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-images',
  'property-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read property photos" on storage.objects;
create policy "Public can read property photos"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'property-images');

drop policy if exists "Users can upload photos to their own folder" on storage.objects;
create policy "Users can upload photos to their own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can update photos in their own folder" on storage.objects;
create policy "Users can update photos in their own folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can delete photos in their own folder" on storage.objects;
create policy "Users can delete photos in their own folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
