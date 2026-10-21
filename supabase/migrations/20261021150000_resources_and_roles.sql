-- BeProject Lab · Several profile types per member, and shared resources
--
-- 1. A member can have one or more profile types (profiles.roles), chosen at
--    sign-up. They can change them only while the account is pending.
--    The old single column profiles.role stays (nothing is dropped, because the
--    Supabase connection used to apply changes cancels anything that deletes),
--    but members can no longer read it; it is kept equal to roles[1].
--    The full profile is now read with public.member_profile(); the old
--    public.get_profile() can no longer be called by members.
-- 2. Project managers, coaches and mentors share resources (links) from
--    "Mi perfil". Each resource waits as 'pending' until the site owner sets
--    it to 'published' (or 'rejected') in the Supabase dashboard. Published
--    resources are visible to approved members only. The author gets an
--    in-site notification when a resource is published.

-- ---------------------------------------------------------------------------
-- Several profile types
-- ---------------------------------------------------------------------------
create function private.valid_roles(r public.member_role[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select r is not null
     and cardinality(r) between 1 and 4
     and array_position(r, null) is null
     and cardinality(r) = (select count(distinct x) from unnest(r) x);
$$;

alter table public.profiles add column roles public.member_role[];
update public.profiles set roles = array[role] where roles is null;
alter table public.profiles
  alter column roles set not null,
  alter column roles set default array['owner']::public.member_role[],
  add constraint profiles_roles_valid check (private.valid_roles(roles));

comment on column public.profiles.roles is
  'Profile types: one or more of owner, pm, coach, mentor. Can change only while the account is pending.';

-- Sign-up: read "roles" (a list) from the form; an old single "role" still works.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_name text := left(btrim(coalesce(meta ->> 'full_name', '')), 80);
  v_roles public.member_role[];
  v_linkedin text := nullif(btrim(coalesce(meta ->> 'linkedin_url', '')), '');
  v_terms timestamptz;
begin
  if char_length(v_name) < 2 then
    v_name := 'Miembro';
  end if;
  select coalesce(array_agg(distinct x::public.member_role order by x::public.member_role), '{}')
    into v_roles
    from jsonb_array_elements_text(
      case when jsonb_typeof(meta -> 'roles') = 'array' then meta -> 'roles' else '[]'::jsonb end
    ) x
    where x in ('owner', 'pm', 'coach', 'mentor');
  if cardinality(v_roles) = 0 and (meta ->> 'role') in ('owner', 'pm', 'coach', 'mentor') then
    v_roles := array[(meta ->> 'role')::public.member_role];
  end if;
  if cardinality(v_roles) = 0 then
    v_roles := array['owner']::public.member_role[];
  end if;
  if v_linkedin is not null and (char_length(v_linkedin) > 200
      or v_linkedin !~* '^https://([a-z0-9-]+\.)?linkedin\.com/[^[:space:]]*$') then
    v_linkedin := null;
  end if;
  if (meta ->> 'terms_accepted') = 'true' then
    v_terms := now();
  end if;

  insert into public.profiles (id, full_name, roles, role, linkedin_url, terms_accepted_at)
  values (new.id, v_name, v_roles, v_roles[1], v_linkedin, v_terms);
  return new;
end;
$$;

-- Members can never change their own status; profile types only while pending.
create or replace function private.profiles_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.role := coalesce(new.roles[1], new.role);
  if current_user in ('authenticated', 'anon') then
    new.id := old.id;
    new.status := old.status;
    new.approved_at := old.approved_at;
    new.terms_accepted_at := old.terms_accepted_at;
    new.created_at := old.created_at;
    if new.roles is distinct from old.roles and old.status <> 'pending' then
      raise exception 'role_locked' using hint = 'Profile types can only change while the account is pending.';
    end if;
  end if;
  if new.status = 'approved' and old.status is distinct from 'approved' then
    new.approved_at := now();
  end if;
  return new;
end;
$$;

-- The old single role: kept in step with roles[1], no longer readable by members.
comment on column public.profiles.role is
  'Old single profile type, kept equal to roles[1]. Use roles.';
revoke select (role), update (role) on public.profiles from authenticated;
grant select (roles) on public.profiles to authenticated;
grant update (roles) on public.profiles to authenticated;

-- The full profile, now with roles. Replaces get_profile (which returned role).
revoke execute on function public.get_profile(uuid) from authenticated;

create function public.member_profile(p_id uuid)
returns table (
  id uuid,
  full_name text,
  roles public.member_role[],
  status public.member_status,
  headline text,
  bio text,
  country text,
  linkedin_url text,
  instagram_url text,
  tiktok_url text,
  website_url text,
  contact_info text,
  is_self boolean,
  connected_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.full_name, p.roles, p.status, p.headline, p.bio, p.country,
         p.linkedin_url, p.instagram_url, p.tiktok_url, p.website_url, p.contact_info,
         p.id = (select auth.uid()),
         (select min(c.created_at) from public.connections c
           where (c.owner_id = (select auth.uid()) and c.helper_id = p.id)
              or (c.owner_id = p.id and c.helper_id = (select auth.uid())))
  from public.profiles p
  where p.id = p_id
    and (
      p.id = (select auth.uid())
      or (
        p.status = 'approved'
        and private.is_approved()
        and private.are_connected((select auth.uid()), p.id)
      )
    );
$$;

revoke all on function public.member_profile(uuid) from public, anon;
grant execute on function public.member_profile(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Resources
-- ---------------------------------------------------------------------------
create type public.resource_kind as enum ('template', 'guide', 'tool', 'video', 'other');
create type public.resource_status as enum ('pending', 'published', 'rejected');

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  section public.member_role not null check (section in ('pm', 'coach', 'mentor')),
  kind public.resource_kind not null,
  title text not null check (char_length(btrim(title)) between 5 and 120),
  description text not null check (char_length(btrim(description)) between 20 and 300),
  url text not null check (char_length(url) <= 500 and url ~* '^https://[^[:space:]]+$'),
  status public.resource_status not null default 'pending',
  published_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.resources is
  'Links shared by members. Publish one by setting status to published; reject with rejected.';

alter table public.resources enable row level security;

create policy "Members read published resources and their own"
  on public.resources for select
  to authenticated
  using (
    author_id = (select auth.uid())
    or (status = 'published' and (select private.is_approved()))
  );

create policy "Members share resources in a section of their own profile types"
  on public.resources for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and (select private.is_approved())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and section = any (p.roles)
    )
  );

create policy "Authors delete their own resources"
  on public.resources for delete
  to authenticated
  using (author_id = (select auth.uid()));

revoke all on public.resources from anon, authenticated;
grant select, delete on public.resources to authenticated;
grant insert (section, kind, title, description, url) on public.resources to authenticated;

create index resources_author_id_idx on public.resources (author_id);
create index resources_status_section_idx on public.resources (status, section);

-- Publishing sets the date and tells the author.
alter type public.notification_kind add value if not exists 'resource_published';

alter table public.notifications
  add column resource_id uuid references public.resources (id) on delete cascade;

create index notifications_resource_id_idx on public.notifications (resource_id);

create function private.resources_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and old.status is distinct from 'published' then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger resources_before_update
  before update on public.resources
  for each row execute function private.resources_before_update();

create function private.notify_resource_published()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'published' and old.status is distinct from 'published' then
    insert into public.notifications (user_id, kind, resource_id, request_title)
    values (new.author_id, 'resource_published', new.id, new.title);
  end if;
  return new;
end;
$$;

revoke all on function private.notify_resource_published() from public, anon, authenticated;

create trigger resources_notify_published
  after update of status on public.resources
  for each row execute function private.notify_resource_published();
