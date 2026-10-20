-- BeProject Lab · email to info@beprojectlab.com when a new member confirms
-- their email and is waiting to be verified.
--
-- How it works: when an account's email gets confirmed (or the account is
-- created already confirmed), the database queues an HTTP call to the Edge
-- Function notify-new-member with the account id. The function checks the
-- profile is still pending and not yet notified, marks it as notified and
-- sends the email through Hostinger SMTP. Sign-up never waits for the email.

create extension if not exists pg_net with schema extensions;

alter table public.profiles add column if not exists admin_notified_at timestamptz;

comment on column public.profiles.admin_notified_at is
  'When info@beprojectlab.com was told about this new account. Set by the notify-new-member Edge Function.';

create or replace function private.queue_new_member_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email_confirmed_at is not null
     and (tg_op = 'INSERT' or old.email_confirmed_at is null) then
    perform net.http_post(
      url := 'https://sohfylmeymppewbetvhd.supabase.co/functions/v1/notify-new-member',
      body := jsonb_build_object('id', new.id),
      headers := jsonb_build_object('Content-Type', 'application/json'),
      timeout_milliseconds := 10000
    );
  end if;
  return new;
end;
$$;

revoke all on function private.queue_new_member_notification() from public, anon, authenticated;

create trigger on_auth_user_email_confirmed
  after insert or update of email_confirmed_at on auth.users
  for each row execute function private.queue_new_member_notification();
