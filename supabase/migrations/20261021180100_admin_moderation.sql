-- BeProject Lab · Administrator moderation: remove any box or reply.
--
-- Done with access rules instead of functions that delete, because the
-- connection used to apply changes cancels SQL with delete statements.
-- The site removes a box or a reply the same way a member removes their own
-- (a normal delete on the table); these rules let an administrator with a
-- confirmed session (second factor) remove anyone's. Each removal of someone
-- else's content is written to private.admin_log. Replies removed together
-- with their box are not logged one by one.

grant execute on function private.is_admin() to authenticated;

create policy "Administrators remove any box"
  on public.requests for delete
  to authenticated
  using ((select private.is_admin()));

create policy "Administrators remove any reply"
  on public.replies for delete
  to authenticated
  using ((select private.is_admin()));

create function private.log_admin_removal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- A reply whose box is gone was removed together with the box.
  if tg_table_name = 'replies'
     and not exists (select 1 from public.requests r where r.id = (to_jsonb(old) ->> 'request_id')::uuid) then
    return old;
  end if;
  if (select auth.uid()) is distinct from old.author_id
     and private.is_admin() then
    perform private.admin_note(
      case tg_table_name when 'requests' then 'delete_request' else 'delete_reply' end,
      old.id,
      case tg_table_name when 'requests' then to_jsonb(old) ->> 'title' else to_jsonb(old) ->> 'body' end
    );
  end if;
  return old;
end;
$$;

revoke all on function private.log_admin_removal() from public, anon, authenticated;

create trigger requests_log_admin_removal
  after delete on public.requests
  for each row execute function private.log_admin_removal();

create trigger replies_log_admin_removal
  after delete on public.replies
  for each row execute function private.log_admin_removal();
