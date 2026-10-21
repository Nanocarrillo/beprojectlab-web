// BeProject Lab · notify-new-member
// Emails info@beprojectlab.com when a new member has confirmed their email and
// is waiting to be verified. Called by the database (pg_net) with { id }.
//
// It is safe to call this endpoint without a token: it only ever sends one
// email per account, only for accounts that are pending and have a confirmed
// email, and only to info@beprojectlab.com.
//
// Secrets (Supabase → Edge Functions → Secrets):
//   SMTP_PASSWORD  password of the info@beprojectlab.com mailbox (required)
//   NOTIFY_TO      where to send the notice (optional, default info@beprojectlab.com)
import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import nodemailer from 'npm:nodemailer@6.9.16';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SMTP_PASSWORD = Deno.env.get('SMTP_PASSWORD') ?? '';
const SMTP_USER = 'info@beprojectlab.com';
const NOTIFY_TO = Deno.env.get('NOTIFY_TO') ?? 'info@beprojectlab.com';
const TABLE_URL = 'https://supabase.com/dashboard/project/sohfylmeymppewbetvhd/editor';

const ROLES: Record<string, string> = { owner: 'Project owner', pm: 'Project manager', coach: 'Coach', mentor: 'Mentor' };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const reply = (status: number, msg: string) => new Response(msg, { status, headers: { 'Content-Type': 'text/plain' } });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return reply(405, 'method not allowed');
  let id = '';
  try { id = String((await req.json()).id ?? ''); } catch { return reply(400, 'bad request'); }
  if (!UUID.test(id)) return reply(400, 'bad request');
  if (!SMTP_PASSWORD || !SERVICE_KEY) { console.error('missing SMTP_PASSWORD or service key'); return reply(500, 'not configured'); }

  const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

  // Only accounts with a confirmed email.
  const { data: userRes, error: userErr } = await db.auth.admin.getUserById(id);
  const user = userRes?.user;
  if (userErr || !user || !user.email_confirmed_at) return reply(200, 'nothing to do');

  // Claim the notice: only pending profiles that were not notified yet.
  const { data: p, error } = await db.from('profiles')
    .update({ admin_notified_at: new Date().toISOString() })
    .eq('id', id).eq('status', 'pending').is('admin_notified_at', null)
    .select('*')
    .maybeSingle();
  if (error) { console.error('profiles update', error.message); return reply(500, 'db error'); }
  if (!p) return reply(200, 'nothing to do');

  const name = p.full_name || 'Miembro';
  // Profile types: a list since 21 Oct 2026 (roles); older rows had a single role.
  const types: string[] = Array.isArray(p.roles) ? p.roles : p.role ? [p.role] : [];
  const role = types.map((r) => ROLES[r] ?? r).join(', ') || '-';
  const linkedin = p.linkedin_url || 'no indicado';
  const when = new Intl.DateTimeFormat('es-ES', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Madrid' }).format(new Date(p.created_at));
  const lines = [
    'Hay una cuenta nueva en la comunidad de BeProject Lab esperando tu verificación.',
    '',
    `Nombre: ${name}`,
    `Tipo de perfil: ${role}`,
    `LinkedIn: ${linkedin}`,
    `Email: ${user.email ?? '-'}`,
    `Registrada: ${when}`,
    `Id: ${p.id}`,
    '',
    'Para aprobarla: Supabase → Table Editor → profiles, busca esta fila y cambia status a approved (o a rejected para rechazarla).',
    TABLE_URL,
  ];
  const html = `<p>Hay una cuenta nueva en la comunidad de BeProject Lab esperando tu verificación.</p>
<table cellpadding="4" style="border-collapse:collapse">
<tr><td><b>Nombre</b></td><td>${esc(name)}</td></tr>
<tr><td><b>Tipo de perfil</b></td><td>${esc(role)}</td></tr>
<tr><td><b>LinkedIn</b></td><td>${p.linkedin_url ? `<a href="${esc(p.linkedin_url)}">${esc(p.linkedin_url)}</a>` : 'no indicado'}</td></tr>
<tr><td><b>Email</b></td><td>${esc(user.email ?? '-')}</td></tr>
<tr><td><b>Registrada</b></td><td>${esc(when)}</td></tr>
<tr><td><b>Id</b></td><td>${esc(p.id)}</td></tr>
</table>
<p>Para aprobarla: Supabase → Table Editor → profiles, busca esta fila y cambia <b>status</b> a <b>approved</b> (o a <b>rejected</b> para rechazarla).</p>
<p><a href="${TABLE_URL}">Abrir el editor de tablas de Supabase</a></p>`;

  try {
    const mail = nodemailer.createTransport({ host: 'smtp.hostinger.com', port: 465, secure: true, auth: { user: SMTP_USER, pass: SMTP_PASSWORD } });
    await mail.sendMail({
      from: `"BeProject Lab" <${SMTP_USER}>`,
      to: NOTIFY_TO,
      subject: `Nueva cuenta para verificar: ${name}`,
      text: lines.join('\n'),
      html,
    });
  } catch (e) {
    // Let it be retried later.
    await db.from('profiles').update({ admin_notified_at: null }).eq('id', id);
    console.error('smtp', e instanceof Error ? e.message : String(e));
    return reply(502, 'email failed');
  }
  return reply(200, 'sent');
});
