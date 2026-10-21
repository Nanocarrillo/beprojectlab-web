-- BeProject Lab · Site administrator
--
-- The administrator manages the community from the site (beprojectlab.com/admin/):
-- accounts, resources and moderation, instead of editing tables in the
-- Supabase dashboard.
--
-- * Who is an administrator lives in private.admins. Nobody can read or change
--   it through the API; it is edited only from the Supabase dashboard
--   (SQL editor). The first administrator is added there by account id, so no
--   email address is written in this file.
-- * Every administrator action needs a session confirmed with a second factor
--   (a code from an authenticator app, Supabase "aal2").
-- * Every action goes through a function below, which checks the caller and
--   writes a line to private.admin_log.
-- * Deleting boxes and replies is in the next migration (admin_moderation).

-- ---------------------------------------------------------------------------
-- Who is an administrator, and what they did
-- ---------------------------------------------------------------------------
create table private.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table private.admins is
  'Site administrators. Add or remove rows only from the Supabase SQL editor.';

create table private.admin_log (
  id bigint generated always as identity primary key,
  admin_id uuid references auth.users (id) on delete set null,
  action text not null,
  target_id uuid,
  detail text,
  created_at timestamptz not null default now()
);

comment on table private.admin_log is
  'One row per administrator action, written by the admin_* functions.';

revoke all on private.admins, private.admin_log from public, anon, authenticated;

-- True only for an administrator whose session passed the second factor.
create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from private.admins a where a.user_id = (select auth.uid()))
     and coalesce((select auth.jwt()) ->> 'aal', '') = 'aal2';
$$;

-- Stops the calling function unless the caller is an administrator; returns their id.
create function private.require_admin()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  return (select auth.uid());
end;
$$;

create function private.admin_note(p_action text, p_target uuid, p_detail text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into private.admin_log (admin_id, action, target_id, detail)
  values ((select auth.uid()), p_action, p_target, left(p_detail, 200));
$$;

revoke all on function private.is_admin(), private.require_admin(), private.admin_note(text, uuid, text)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- For the site: am I an administrator, and is my session confirmed?
-- Tells only the caller about themselves.
-- ---------------------------------------------------------------------------
create function public.admin_status()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'admin', exists (select 1 from private.admins a where a.user_id = (select auth.uid())),
    'aal', coalesce((select auth.jwt()) ->> 'aal', 'aal1')
  );
$$;

-- ---------------------------------------------------------------------------
-- Overview
-- ---------------------------------------------------------------------------
create function public.admin_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_admin();
  return jsonb_build_object(
    'members_pending', (select count(*) from public.profiles p join auth.users u on u.id = p.id
                         where p.status = 'pending' and u.email_confirmed_at is not null),
    'members_unconfirmed', (select count(*) from public.profiles p join auth.users u on u.id = p.id
                         where p.status = 'pending' and u.email_confirmed_at is null),
    'members_approved', (select count(*) from public.profiles where status = 'approved'),
    'members_rejected', (select count(*) from public.profiles where status = 'rejected'),
    'resources_pending', (select count(*) from public.resources where status = 'pending'),
    'resources_published', (select count(*) from public.resources where status = 'published'),
    'requests_open', (select count(*) from public.requests where is_open),
    'connections', (select count(*) from public.connections)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------------------
create function public.admin_members(p_status public.member_status default null)
returns table (
  id uuid,
  full_name text,
  roles public.member_role[],
  status public.member_status,
  email text,
  email_confirmed boolean,
  linkedin_url text,
  headline text,
  country text,
  created_at timestamptz,
  approved_at timestamptz,
  is_admin boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_admin();
  return query
    select p.id, p.full_name, p.roles, p.status, u.email::text, u.email_confirmed_at is not null,
           p.linkedin_url, p.headline, p.country, p.created_at, p.approved_at,
           exists (select 1 from private.admins a where a.user_id = p.id)
    from public.profiles p
    join auth.users u on u.id = p.id
    where p_status is null or p.status = p_status
    order by p.created_at desc;
end;
$$;

create function public.admin_set_member_status(p_id uuid, p_status public.member_status)
returns public.member_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin uuid := private.require_admin();
  v_name text;
begin
  if p_id = v_admin then
    raise exception 'not_self' using hint = 'An administrator cannot change their own status.';
  end if;
  update public.profiles set status = p_status where id = p_id returning full_name into v_name;
  if not found then
    raise exception 'not_found';
  end if;
  perform private.admin_note('member_status', p_id, p_status::text || ': ' || v_name);
  return p_status;
end;
$$;

-- ---------------------------------------------------------------------------
-- Resources
-- ---------------------------------------------------------------------------
create function public.admin_resources(p_status public.resource_status default null)
returns table (
  id uuid,
  title text,
  description text,
  url text,
  kind public.resource_kind,
  section public.member_role,
  status public.resource_status,
  created_at timestamptz,
  published_at timestamptz,
  author_id uuid,
  author_name text,
  author_roles public.member_role[]
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_admin();
  return query
    select r.id, r.title, r.description, r.url, r.kind, r.section, r.status, r.created_at, r.published_at,
           r.author_id, p.full_name, p.roles
    from public.resources r
    join public.profiles p on p.id = r.author_id
    where p_status is null or r.status = p_status
    order by r.created_at desc;
end;
$$;

create function public.admin_set_resource_status(p_id uuid, p_status public.resource_status)
returns public.resource_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title text;
begin
  perform private.require_admin();
  update public.resources set status = p_status where id = p_id returning title into v_title;
  if not found then
    raise exception 'not_found';
  end if;
  perform private.admin_note('resource_status', p_id, p_status::text || ': ' || v_title);
  return p_status;
end;
$$;

-- ---------------------------------------------------------------------------
-- What administrators did, newest first
-- ---------------------------------------------------------------------------
create function public.admin_log_recent(p_limit integer default 50)
returns table (
  created_at timestamptz,
  action text,
  target_id uuid,
  detail text,
  admin_name text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_admin();
  return query
    select l.created_at, l.action, l.target_id, l.detail, p.full_name
    from private.admin_log l
    left join public.profiles p on p.id = l.admin_id
    order by l.created_at desc, l.id desc
    limit least(greatest(coalesce(p_limit, 50), 1), 200);
end;
$$;

-- Only signed-in members can call these, and the functions themselves refuse
-- anyone who is not an administrator with a confirmed session.
revoke all on function
  public.admin_status(),
  public.admin_overview(),
  public.admin_members(public.member_status),
  public.admin_set_member_status(uuid, public.member_status),
  public.admin_resources(public.resource_status),
  public.admin_set_resource_status(uuid, public.resource_status),
  public.admin_log_recent(integer)
  from public, anon;

grant execute on function
  public.admin_status(),
  public.admin_overview(),
  public.admin_members(public.member_status),
  public.admin_set_member_status(uuid, public.member_status),
  public.admin_resources(public.resource_status),
  public.admin_set_resource_status(uuid, public.resource_status),
  public.admin_log_recent(integer)
  to authenticated;
