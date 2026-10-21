-- BeProject Lab · Administrator notices in the bell, and a clearer log.
--
-- * Every administrator gets an in-site notification when a new account is
--   ready to review (its email was confirmed and it is pending) and when a
--   member shares a resource. The email to info@beprojectlab.com for new
--   accounts stays as it is.
-- * The log now keeps the status before and after each change
--   ("pending>approved: Name"), so the panel can tell approving from
--   reactivating, and a removed reply keeps the title of its box.

alter type public.notification_kind add value if not exists 'admin_new_member';
alter type public.notification_kind add value if not exists 'admin_new_resource';

-- ---------------------------------------------------------------------------
-- New account to review. The name goes in request_title because administrators
-- cannot read a pending profile through the API.
-- Named so it runs after on_auth_user_created, which creates the profile.
-- A failure here never blocks the account's confirmation.
-- ---------------------------------------------------------------------------
create function private.notify_admins_new_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email_confirmed_at is not null
     and (tg_op = 'INSERT' or old.email_confirmed_at is null) then
    begin
      insert into public.notifications (user_id, kind, actor_id, request_title)
      select a.user_id, 'admin_new_member', p.id, p.full_name
      from private.admins a
      join public.profiles p on p.id = new.id and p.status = 'pending'
      where a.user_id <> new.id
        and exists (select 1 from public.profiles ap where ap.id = a.user_id);
    exception when others then
      null;
    end;
  end if;
  return new;
end;
$$;

revoke all on function private.notify_admins_new_member() from public, anon, authenticated;

create trigger on_auth_user_ready_notify_admins
  after insert or update of email_confirmed_at on auth.users
  for each row execute function private.notify_admins_new_member();

-- ---------------------------------------------------------------------------
-- New resource to review (not when the administrator shares it themself).
-- ---------------------------------------------------------------------------
create function private.notify_admins_new_resource()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, kind, actor_id, resource_id, request_title)
  select a.user_id, 'admin_new_resource', new.author_id, new.id, new.title
  from private.admins a
  where a.user_id <> new.author_id
    and exists (select 1 from public.profiles ap where ap.id = a.user_id);
  return new;
end;
$$;

revoke all on function private.notify_admins_new_resource() from public, anon, authenticated;

create trigger resources_notify_admins
  after insert on public.resources
  for each row execute function private.notify_admins_new_resource();

-- ---------------------------------------------------------------------------
-- Clearer log: status before and after.
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_member_status(p_id uuid, p_status public.member_status)
returns public.member_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin uuid := private.require_admin();
  v_old public.member_status;
  v_name text;
begin
  if p_id = v_admin then
    raise exception 'not_self' using hint = 'An administrator cannot change their own status.';
  end if;
  select status into v_old from public.profiles where id = p_id for update;
  if not found then
    raise exception 'not_found';
  end if;
  update public.profiles set status = p_status where id = p_id returning full_name into v_name;
  perform private.admin_note('member_status', p_id, v_old::text || '>' || p_status::text || ': ' || v_name);
  return p_status;
end;
$$;

create or replace function public.admin_set_resource_status(p_id uuid, p_status public.resource_status)
returns public.resource_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old public.resource_status;
  v_title text;
begin
  perform private.require_admin();
  select status into v_old from public.resources where id = p_id for update;
  if not found then
    raise exception 'not_found';
  end if;
  update public.resources set status = p_status where id = p_id returning title into v_title;
  perform private.admin_note('resource_status', p_id, v_old::text || '>' || p_status::text || ': ' || v_title);
  return p_status;
end;
$$;

-- A removed reply keeps its box's title: "title" newline "reply".
create or replace function private.log_admin_removal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title text;
begin
  if tg_table_name = 'replies' then
    select r.title into v_title from public.requests r where r.id = (to_jsonb(old) ->> 'request_id')::uuid;
    -- A reply whose box is gone was removed together with the box.
    if not found then
      return old;
    end if;
  end if;
  if (select auth.uid()) is distinct from old.author_id
     and private.is_admin() then
    perform private.admin_note(
      case tg_table_name when 'requests' then 'delete_request' else 'delete_reply' end,
      old.id,
      case tg_table_name when 'requests' then to_jsonb(old) ->> 'title'
           else left(v_title, 120) || chr(10) || (to_jsonb(old) ->> 'body') end
    );
  end if;
  return old;
end;
$$;
