-- BeProject Lab · Connections and in-site notifications
--
-- Privacy rule: before two members connect, each one sees only the other's
-- name and profile type. The rest of a profile (one line about them, country,
-- description, links and "Cómo contactarme") is visible only to the person
-- themself and to the members they are connected with.
--
-- How two members connect (both have to say yes):
--   1. On a caja, a member presses "Me interesa" and writes how they can help
--      (public.interests). The caja's author gets a notification.
--   2. The caja's author presses "Conectar" (public.connect_interest). A row is
--      added to public.connections and the other member gets a notification.
-- Nobody is told "no": an interest that is never accepted just stays pending.
--
-- Notifications live in public.notifications and are shown in the website
-- (the bell). No emails are sent for any of this.

-- ---------------------------------------------------------------------------
-- Profiles: new contact field; only name and type are readable by others
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column contact_info text check (char_length(contact_info) <= 300);

comment on column public.profiles.contact_info is
  'How this member wants to be contacted. Visible only to the members they are connected with.';

revoke select on public.profiles from authenticated;
grant select (id, full_name, role, status) on public.profiles to authenticated;
grant update (contact_info) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Interests ("Me interesa")
-- ---------------------------------------------------------------------------
create table public.interests (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  helper_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  message text not null check (char_length(btrim(message)) between 20 and 500),
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  unique (request_id, helper_id)
);

comment on table public.interests is
  'A member says "Me interesa" on a caja. connected_at is set when the caja author connects.';

alter table public.interests enable row level security;

create policy "Helpers and caja authors read interests"
  on public.interests for select
  to authenticated
  using (
    (select private.is_approved())
    and (
      helper_id = (select auth.uid())
      or exists (
        select 1 from public.requests r
        where r.id = request_id and r.author_id = (select auth.uid())
      )
    )
  );

create policy "Approved members show interest in open cajas of others"
  on public.interests for insert
  to authenticated
  with check (
    helper_id = (select auth.uid())
    and (select private.is_approved())
    and exists (
      select 1 from public.requests r
      where r.id = request_id and r.is_open and r.author_id <> (select auth.uid())
    )
  );

create policy "Helpers withdraw a pending interest"
  on public.interests for delete
  to authenticated
  using (helper_id = (select auth.uid()) and connected_at is null);

revoke all on public.interests from anon, authenticated;
grant select, delete on public.interests to authenticated;
grant insert (request_id, message) on public.interests to authenticated;

create index interests_helper_id_idx on public.interests (helper_id);

-- ---------------------------------------------------------------------------
-- Connections
-- ---------------------------------------------------------------------------
create table public.connections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  helper_id uuid not null references public.profiles (id) on delete cascade,
  request_id uuid references public.requests (id) on delete set null,
  request_title text not null,
  created_at timestamptz not null default now(),
  unique (owner_id, helper_id),
  check (owner_id <> helper_id)
);

comment on table public.connections is
  'Two members who both said yes: owner_id is the caja author who pressed "Conectar".';

alter table public.connections enable row level security;

create policy "Members read their own connections"
  on public.connections for select
  to authenticated
  using (owner_id = (select auth.uid()) or helper_id = (select auth.uid()));

revoke all on public.connections from anon, authenticated;
grant select on public.connections to authenticated;

create index connections_helper_id_idx on public.connections (helper_id);
create index connections_request_id_idx on public.connections (request_id);

create function private.are_connected(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.connections c
    where (c.owner_id = a and c.helper_id = b)
       or (c.owner_id = b and c.helper_id = a)
  );
$$;

revoke all on function private.are_connected(uuid, uuid) from public, anon;
grant execute on function private.are_connected(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Notifications (the bell)
-- ---------------------------------------------------------------------------
create type public.notification_kind as enum ('interest', 'connected', 'reply', 'approved');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind public.notification_kind not null,
  actor_id uuid references public.profiles (id) on delete cascade,
  request_id uuid references public.requests (id) on delete set null,
  request_title text,
  interest_id uuid references public.interests (id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.notifications is
  'In-site notifications. Written only by the database (triggers and connect_interest).';

alter table public.notifications enable row level security;

create policy "Members read their own notifications"
  on public.notifications for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Members mark their own notifications as read"
  on public.notifications for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

create index notifications_user_id_idx on public.notifications (user_id, created_at desc);
create index notifications_actor_id_idx on public.notifications (actor_id);
create index notifications_request_id_idx on public.notifications (request_id);
create index notifications_interest_id_idx on public.notifications (interest_id);

-- Someone says "Me interesa": tell the caja's author.
create function private.notify_interest()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.requests;
begin
  select * into r from public.requests where id = new.request_id;
  if found then
    insert into public.notifications (user_id, kind, actor_id, request_id, request_title, interest_id)
    values (r.author_id, 'interest', new.helper_id, r.id, r.title, new.id);
  end if;
  return new;
end;
$$;

revoke all on function private.notify_interest() from public, anon, authenticated;

create trigger interests_notify
  after insert on public.interests
  for each row execute function private.notify_interest();

-- Someone replies in a caja: tell the caja's author (not when they reply themself).
create function private.notify_reply()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.requests;
begin
  select * into r from public.requests where id = new.request_id;
  if found and r.author_id <> new.author_id then
    insert into public.notifications (user_id, kind, actor_id, request_id, request_title)
    values (r.author_id, 'reply', new.author_id, r.id, r.title);
  end if;
  return new;
end;
$$;

revoke all on function private.notify_reply() from public, anon, authenticated;

create trigger replies_notify
  after insert on public.replies
  for each row execute function private.notify_reply();

-- An account is approved: tell its owner.
create function private.notify_approved()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    insert into public.notifications (user_id, kind) values (new.id, 'approved');
  end if;
  return new;
end;
$$;

revoke all on function private.notify_approved() from public, anon, authenticated;

create trigger profiles_notify_approved
  after update of status on public.profiles
  for each row execute function private.notify_approved();

-- ---------------------------------------------------------------------------
-- Read a profile: the full profile only for yourself and your connections
-- ---------------------------------------------------------------------------
create function public.get_profile(p_id uuid)
returns table (
  id uuid,
  full_name text,
  role public.member_role,
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
  select p.id, p.full_name, p.role, p.status, p.headline, p.bio, p.country,
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

revoke all on function public.get_profile(uuid) from public, anon;
grant execute on function public.get_profile(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- "Conectar": only the caja's author can accept an interest
-- ---------------------------------------------------------------------------
create function public.connect_interest(p_interest uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_interest public.interests;
  v_request public.requests;
begin
  if v_uid is null or not private.is_approved() then
    raise exception 'not_allowed';
  end if;
  select * into v_interest from public.interests where id = p_interest for update;
  if not found then
    raise exception 'not_found';
  end if;
  select * into v_request from public.requests where id = v_interest.request_id;
  if not found or v_request.author_id <> v_uid then
    raise exception 'not_allowed';
  end if;
  if not exists (select 1 from public.profiles where id = v_interest.helper_id and status = 'approved') then
    raise exception 'not_allowed';
  end if;
  if v_interest.connected_at is null then
    update public.interests set connected_at = now() where id = v_interest.id;
    insert into public.connections (owner_id, helper_id, request_id, request_title)
    values (v_uid, v_interest.helper_id, v_request.id, v_request.title)
    on conflict (owner_id, helper_id) do nothing;
    insert into public.notifications (user_id, kind, actor_id, request_id, request_title)
    values (v_interest.helper_id, 'connected', v_uid, v_request.id, v_request.title);
  end if;
  return v_interest.helper_id;
end;
$$;

revoke all on function public.connect_interest(uuid) from public, anon;
grant execute on function public.connect_interest(uuid) to authenticated;
