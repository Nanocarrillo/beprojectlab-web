-- BeProject Lab · Articles written by members, published in the blog after review.
--
-- * Any approved member proposes an article from "Mi perfil": title, summary,
--   text and language (es or en), plus two consents (the text is theirs and
--   BeProject Lab may publish it; their name and profile types may appear
--   publicly with it). Each article waits as 'pending'.
-- * Nothing is published until an administrator (second factor, aal2) sets it
--   to 'published' in the panel; 'rejected' is "not published" (also used to
--   withdraw a published one). Every decision is logged.
-- * The author can edit their article at any time; every edit sends it back
--   to review ('pending'), so it leaves the blog until it is approved again.
--   The author can also remove it.
-- * Visitors (no account needed) read published articles through two
--   functions, blog_articles and blog_article, which show the author's name and
--   profile types only. Articles under review are seen only by their author
--   and administrators. Articles by a suspended member leave the blog.
-- * Notices in the bell: administrators get one for each article to review
--   (new or edited); the author gets one when it is published or not.

create type public.article_status as enum ('pending', 'published', 'rejected');

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  lang text not null check (lang in ('es', 'en')),
  title text not null check (char_length(btrim(title)) between 5 and 120),
  summary text not null check (char_length(btrim(summary)) between 20 and 240),
  body text not null check (char_length(btrim(body)) between 300 and 12000),
  consent_own boolean not null check (consent_own),
  consent_name boolean not null check (consent_name),
  status public.article_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz not null default now(),
  published_at timestamptz,
  first_published_at timestamptz
);

comment on table public.articles is
  'Blog articles proposed by members. Published only when an administrator approves them; any edit by the author sends them back to review.';

alter table public.articles enable row level security;

create policy "Authors read their own articles"
  on public.articles for select
  to authenticated
  using (author_id = (select auth.uid()));

create policy "Approved members propose articles"
  on public.articles for insert
  to authenticated
  with check (author_id = (select auth.uid()) and (select private.is_approved()));

create policy "Authors edit their own articles"
  on public.articles for update
  to authenticated
  using (author_id = (select auth.uid()) and (select private.is_approved()))
  with check (author_id = (select auth.uid()));

create policy "Authors remove their own articles"
  on public.articles for delete
  to authenticated
  using (author_id = (select auth.uid()));

revoke all on public.articles from anon, authenticated;
grant select, delete on public.articles to authenticated;
grant insert (lang, title, summary, body, consent_own, consent_name) on public.articles to authenticated;
grant update (lang, title, summary, body, consent_own, consent_name) on public.articles to authenticated;

create index articles_author_id_idx on public.articles (author_id);
create index articles_status_lang_idx on public.articles (status, lang);

-- An edit by the author always goes back to review. Only administrators (through
-- admin_set_article_status) change the status; publishing sets the dates.
create function private.articles_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.id := old.id;
    new.author_id := old.author_id;
    new.created_at := old.created_at;
    new.first_published_at := old.first_published_at;
    if (new.title, new.summary, new.body, new.lang) is distinct from (old.title, old.summary, old.body, old.lang) then
      new.status := 'pending';
      new.submitted_at := now();
      new.updated_at := now();
      new.published_at := null;
    else
      new.status := old.status;
      new.published_at := old.published_at;
      new.submitted_at := old.submitted_at;
      new.updated_at := old.updated_at;
    end if;
  elsif new.status = 'published' and old.status is distinct from 'published' then
    new.published_at := now();
    new.first_published_at := coalesce(old.first_published_at, now());
  elsif new.status <> 'published' then
    new.published_at := null;
  end if;
  return new;
end;
$$;

create trigger articles_before_update
  before update on public.articles
  for each row execute function private.articles_before_write();

-- ---------------------------------------------------------------------------
-- Notices
-- ---------------------------------------------------------------------------
alter type public.notification_kind add value if not exists 'article_published';
alter type public.notification_kind add value if not exists 'article_rejected';
alter type public.notification_kind add value if not exists 'admin_new_article';

alter table public.notifications
  add column article_id uuid references public.articles (id) on delete cascade;

create index notifications_article_id_idx on public.notifications (article_id);

-- To the author: published, or not published (also when withdrawn).
create function private.notify_article_decision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status and new.status in ('published', 'rejected')
     and (select auth.uid()) is distinct from new.author_id then
    insert into public.notifications (user_id, kind, article_id, request_title)
    values (new.author_id,
            case new.status when 'published' then 'article_published'::public.notification_kind
                            else 'article_rejected'::public.notification_kind end,
            new.id, new.title);
  end if;
  return new;
end;
$$;

revoke all on function private.notify_article_decision() from public, anon, authenticated;

-- (Plain "after update": an author's edit changes the status inside the
-- trigger above, so "update of status" would not see it.)
create trigger articles_notify_decision
  after update on public.articles
  for each row execute function private.notify_article_decision();

-- To every administrator (but not about their own article): one to review,
-- new or edited. An edit of an article already waiting does not repeat it.
create function private.notify_admins_new_article()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or (new.status = 'pending' and old.status <> 'pending') then
    insert into public.notifications (user_id, kind, actor_id, article_id, request_title)
    select a.user_id, 'admin_new_article', new.author_id, new.id, new.title
    from private.admins a
    where a.user_id <> new.author_id
      and exists (select 1 from public.profiles ap where ap.id = a.user_id);
  end if;
  return new;
end;
$$;

revoke all on function private.notify_admins_new_article() from public, anon, authenticated;

create trigger articles_notify_admins
  after insert or update on public.articles
  for each row execute function private.notify_admins_new_article();

-- ---------------------------------------------------------------------------
-- The blog: published articles for everyone, with the author's name and types.
-- ---------------------------------------------------------------------------
create function public.blog_articles(p_lang text)
returns table (
  id uuid,
  title text,
  summary text,
  lang text,
  published_at timestamptz,
  author_name text,
  author_roles public.member_role[],
  words integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.title, a.summary, a.lang, coalesce(a.first_published_at, a.published_at),
         p.full_name, p.roles,
         coalesce(array_length(regexp_split_to_array(btrim(a.body), '\s+'), 1), 0)
  from public.articles a
  join public.profiles p on p.id = a.author_id
  where a.status = 'published' and p.status = 'approved' and a.lang = p_lang
  order by coalesce(a.first_published_at, a.published_at) desc
  limit 100;
$$;

create function public.blog_article(p_id uuid)
returns table (
  id uuid,
  title text,
  summary text,
  body text,
  lang text,
  published_at timestamptz,
  updated_at timestamptz,
  author_name text,
  author_roles public.member_role[],
  words integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.title, a.summary, a.body, a.lang, coalesce(a.first_published_at, a.published_at), a.published_at,
         p.full_name, p.roles,
         coalesce(array_length(regexp_split_to_array(btrim(a.body), '\s+'), 1), 0)
  from public.articles a
  join public.profiles p on p.id = a.author_id
  where a.id = p_id and a.status = 'published' and p.status = 'approved';
$$;

revoke all on function public.blog_articles(text), public.blog_article(uuid) from public;
grant execute on function public.blog_articles(text), public.blog_article(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Administration
-- ---------------------------------------------------------------------------
create function public.admin_articles(p_status public.article_status default null)
returns table (
  id uuid,
  title text,
  summary text,
  body text,
  lang text,
  status public.article_status,
  created_at timestamptz,
  submitted_at timestamptz,
  published_at timestamptz,
  first_published_at timestamptz,
  author_id uuid,
  author_name text,
  author_roles public.member_role[],
  words integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_admin();
  return query
    select a.id, a.title, a.summary, a.body, a.lang, a.status, a.created_at, a.submitted_at,
           a.published_at, a.first_published_at, a.author_id, p.full_name, p.roles,
           coalesce(array_length(regexp_split_to_array(btrim(a.body), '\s+'), 1), 0)
    from public.articles a
    join public.profiles p on p.id = a.author_id
    where p_status is null or a.status = p_status
    order by a.submitted_at desc;
end;
$$;

create function public.admin_set_article_status(p_id uuid, p_status public.article_status)
returns public.article_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old public.article_status;
  v_title text;
begin
  perform private.require_admin();
  select status into v_old from public.articles where id = p_id for update;
  if not found then
    raise exception 'not_found';
  end if;
  update public.articles set status = p_status where id = p_id returning title into v_title;
  perform private.admin_note('article_status', p_id, v_old::text || '>' || p_status::text || ': ' || v_title);
  return p_status;
end;
$$;

revoke all on function public.admin_articles(public.article_status),
  public.admin_set_article_status(uuid, public.article_status) from public, anon;
grant execute on function public.admin_articles(public.article_status),
  public.admin_set_article_status(uuid, public.article_status) to authenticated;

-- The overview now counts articles too.
create or replace function public.admin_overview()
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
    'articles_pending', (select count(*) from public.articles where status = 'pending'),
    'articles_published', (select count(*) from public.articles where status = 'published'),
    'requests_open', (select count(*) from public.requests where is_open),
    'connections', (select count(*) from public.connections)
  );
end;
$$;
