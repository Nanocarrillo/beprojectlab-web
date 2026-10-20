-- BeProject Lab · Community
-- Member profiles (verified by hand), "cajas de diálogo" (requests) and replies.
--
-- How access works:
--   * Anyone can create an account. A profile row is created automatically with
--     status 'pending'. Only the site owner approves members, from the Supabase
--     dashboard (Table Editor → profiles → status = approved).
--   * Pending members can see and edit only their own profile.
--   * Approved members can see approved profiles, all cajas and replies, and can
--     publish cajas and replies. Nobody can see email addresses of other members.
--   * Visitors without an account (anon) cannot read anything.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.member_role as enum ('owner', 'pm', 'coach', 'mentor');
create type public.member_status as enum ('pending', 'approved', 'rejected');
create type public.seeking as enum ('pm', 'coach', 'mentor', 'unsure');

-- Helper functions live in a schema that is not exposed through the API.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 80),
  role public.member_role not null default 'owner',
  headline text check (char_length(headline) <= 120),
  bio text check (char_length(bio) <= 600),
  country text check (char_length(country) <= 60),
  linkedin_url text check (char_length(linkedin_url) <= 200
    and linkedin_url ~* '^https://([a-z0-9-]+\.)?linkedin\.com/[^[:space:]]*$'),
  instagram_url text check (char_length(instagram_url) <= 200
    and instagram_url ~* '^https://([a-z0-9-]+\.)?instagram\.com/[^[:space:]]*$'),
  tiktok_url text check (char_length(tiktok_url) <= 200
    and tiktok_url ~* '^https://([a-z0-9-]+\.)?tiktok\.com/[^[:space:]]*$'),
  website_url text check (char_length(website_url) <= 200
    and website_url ~* '^https://[^[:space:]]+$'),
  status public.member_status not null default 'pending',
  terms_accepted_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'One row per account. Approve a member by setting status to approved.';

-- Is the current user an approved member?
create function private.is_approved()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and status = 'approved'
  );
$$;

revoke all on function private.is_approved() from public, anon;
grant execute on function private.is_approved() to authenticated;

-- Create the profile when an account is created, from the sign-up form data.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_name text := left(btrim(coalesce(meta ->> 'full_name', '')), 80);
  v_role text := meta ->> 'role';
  v_linkedin text := nullif(btrim(coalesce(meta ->> 'linkedin_url', '')), '');
  v_terms timestamptz;
begin
  if char_length(v_name) < 2 then
    v_name := 'Miembro';
  end if;
  if v_role is null or v_role not in ('owner', 'pm', 'coach', 'mentor') then
    v_role := 'owner';
  end if;
  if v_linkedin is not null and (char_length(v_linkedin) > 200
      or v_linkedin !~* '^https://([a-z0-9-]+\.)?linkedin\.com/[^[:space:]]*$') then
    v_linkedin := null;
  end if;
  if (meta ->> 'terms_accepted') = 'true' then
    v_terms := now();
  end if;

  insert into public.profiles (id, full_name, role, linkedin_url, terms_accepted_at)
  values (new.id, v_name, v_role::public.member_role, v_linkedin, v_terms);
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Members can never change their own status; the role can only change while
-- the account is still pending.
create function private.profiles_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  if current_user in ('authenticated', 'anon') then
    new.id := old.id;
    new.status := old.status;
    new.approved_at := old.approved_at;
    new.terms_accepted_at := old.terms_accepted_at;
    new.created_at := old.created_at;
    if new.role is distinct from old.role and old.status <> 'pending' then
      raise exception 'role_locked' using hint = 'The role can only change while the account is pending.';
    end if;
  end if;
  if new.status = 'approved' and old.status is distinct from 'approved' then
    new.approved_at := now();
  end if;
  return new;
end;
$$;

create trigger profiles_before_update
  before update on public.profiles
  for each row execute function private.profiles_before_update();

alter table public.profiles enable row level security;

create policy "Members see their own profile and approved members see approved profiles"
  on public.profiles for select
  to authenticated
  using (
    id = (select auth.uid())
    or (status = 'approved' and (select private.is_approved()))
  );

create policy "Members update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, role, headline, bio, country,
              linkedin_url, instagram_url, tiktok_url, website_url)
  on public.profiles to authenticated;

create index profiles_status_idx on public.profiles (status);

-- ---------------------------------------------------------------------------
-- Cajas de diálogo (requests)
-- ---------------------------------------------------------------------------
create table public.requests (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 5 and 120),
  body text not null check (char_length(btrim(body)) between 20 and 2000),
  seeking public.seeking not null,
  is_open boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.requests is
  'Cajas de diálogo: a member describes a project and who they are looking for.';

create function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger requests_touch_updated_at
  before update on public.requests
  for each row execute function private.touch_updated_at();

alter table public.requests enable row level security;

create policy "Approved members read cajas"
  on public.requests for select
  to authenticated
  using ((select private.is_approved()));

create policy "Approved members publish their own cajas"
  on public.requests for insert
  to authenticated
  with check (author_id = (select auth.uid()) and (select private.is_approved()));

create policy "Authors edit their own cajas"
  on public.requests for update
  to authenticated
  using (author_id = (select auth.uid()) and (select private.is_approved()))
  with check (author_id = (select auth.uid()));

create policy "Authors delete their own cajas"
  on public.requests for delete
  to authenticated
  using (author_id = (select auth.uid()));

revoke all on public.requests from anon, authenticated;
grant select, delete on public.requests to authenticated;
grant insert (title, body, seeking) on public.requests to authenticated;
grant update (title, body, seeking, is_open) on public.requests to authenticated;

create index requests_author_id_idx on public.requests (author_id);
create index requests_created_at_idx on public.requests (created_at desc);

-- ---------------------------------------------------------------------------
-- Replies
-- ---------------------------------------------------------------------------
create table public.replies (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  author_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 2 and 1000),
  created_at timestamptz not null default now()
);

alter table public.replies enable row level security;

create policy "Approved members read replies"
  on public.replies for select
  to authenticated
  using ((select private.is_approved()));

create policy "Approved members reply to open cajas"
  on public.replies for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and (select private.is_approved())
    and exists (
      select 1 from public.requests r
      where r.id = request_id and r.is_open
    )
  );

create policy "Authors delete their own replies"
  on public.replies for delete
  to authenticated
  using (author_id = (select auth.uid()));

revoke all on public.replies from anon, authenticated;
grant select, delete on public.replies to authenticated;
grant insert (request_id, body) on public.replies to authenticated;

create index replies_request_id_idx on public.replies (request_id, created_at);
create index replies_author_id_idx on public.replies (author_id);

-- ---------------------------------------------------------------------------
-- Delete my account (removes the profile, cajas and replies too)
-- ---------------------------------------------------------------------------
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  delete from auth.users where id = v_uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
