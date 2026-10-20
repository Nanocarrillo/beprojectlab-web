/* BeProject Lab · community app
   Accounts (sign in, sign up, password reset), "Mi perfil" and the
   community page with cajas de diálogo. Talks to Supabase from the browser;
   what each person can read or change is enforced by the database itself. */
(function () {
  'use strict';

  // Public settings. The publishable key is meant to live in the website.
  var SUPABASE_URL = 'https://sohfylmeymppewbetvhd.supabase.co';
  var SUPABASE_KEY = '';

  var LANG = document.documentElement.lang === 'en' ? 'en' : 'es';
  var PAGE = document.body.getAttribute('data-page');
  var ROOT = document.getElementById('app');
  var INITIAL_HASH = window.location.hash || '';
  var CONTACT = 'info@beprojectlab.com';

  var PATHS = {
    es: { home: '/', community: '/comunidad/', account: '/cuenta/', profile: '/perfil/', privacy: '/privacidad/', terms: '/condiciones/' },
    en: { home: '/en/', community: '/en/community/', account: '/en/account/', profile: '/en/profile/', privacy: '/en/privacy/', terms: '/en/terms/' }
  }[LANG];

  var STR = {
    es: {
      loading: 'Cargando…',
      wait: 'Un momento…',
      error_generic: 'Algo no ha funcionado. Vuelve a intentarlo en unos segundos.',
      not_ready: 'La comunidad abre muy pronto. Vuelve en unos días.',
      back_home: 'Volver al inicio',
      optional: '(opcional)',
      cancel: 'Cancelar',
      close: 'Cerrar',
      member: 'Miembro',
      role_owner: 'Project owner', role_pm: 'Project manager', role_coach: 'Coach', role_mentor: 'Mentor',
      role_desc_owner: 'Tienes un proyecto y buscas ayuda para sacarlo adelante.',
      role_desc_pm: 'Das estructura: plan, prioridades y seguimiento.',
      role_desc_coach: 'Ayudas a sostener el proyecto en el tiempo.',
      role_desc_mentor: 'Conoces los tres terrenos y orientas el camino.',
      seek_pm: 'Busca project manager', seek_coach: 'Busca coach', seek_mentor: 'Busca mentor', seek_unsure: 'Aún no sabe qué necesita',
      opt_pm: 'Un project manager', opt_coach: 'Un coach', opt_mentor: 'Un mentor', opt_unsure: 'Aún no lo sé',
      filter_all: 'Todas', filter_pm: 'Project manager', filter_coach: 'Coach', filter_mentor: 'Mentor', filter_unsure: 'Sin decidir',
      // account
      signin_title: 'Entrar',
      signin_lead: 'Entra con tu email y tu contraseña.',
      email: 'Email',
      password: 'Contraseña',
      signin_btn: 'Entrar',
      no_account: '¿Todavía no tienes cuenta?',
      to_signup: 'Crear una cuenta',
      forgot_link: '¿Olvidaste tu contraseña?',
      signup_title: 'Crear cuenta',
      signup_lead: 'Elige cómo participas. Revisamos cada cuenta a mano antes de abrirle la comunidad.',
      full_name: 'Nombre y apellido',
      role_legend: 'Me registro como',
      linkedin: 'Perfil de LinkedIn',
      linkedin_hint: 'Lo usamos para verificar tu cuenta. Ejemplo: https://www.linkedin.com/in/tu-nombre',
      password_hint: 'Mínimo 8 caracteres.',
      terms_1: 'Tengo 18 años o más y acepto las ',
      terms_link: 'condiciones de uso',
      terms_2: ' y la ',
      privacy_link: 'política de privacidad',
      terms_3: '.',
      signup_btn: 'Crear cuenta',
      have_account: '¿Ya tienes cuenta?',
      to_signin: 'Entrar',
      sent_title: 'Revisa tu email',
      sent_text: 'Te enviamos un enlace a {email} para confirmar tu cuenta. Después la revisaremos y te daremos acceso a la comunidad.',
      sent_spam: 'Si no lo ves en unos minutos, mira en la carpeta de spam.',
      forgot_title: 'Recuperar contraseña',
      forgot_lead: 'Escribe tu email y te enviamos un enlace para crear una contraseña nueva.',
      forgot_btn: 'Enviar enlace',
      forgot_sent: 'Si hay una cuenta con ese email, te llegará un enlace en unos minutos.',
      back_signin: 'Volver a entrar',
      recovery_title: 'Nueva contraseña',
      recovery_lead: 'Escribe tu contraseña nueva.',
      recovery_btn: 'Guardar contraseña',
      new_password: 'Contraseña nueva',
      err_credentials: 'El email o la contraseña no son correctos.',
      err_not_confirmed: 'Todavía no has confirmado tu email. Busca el enlace que te enviamos.',
      err_rate: 'Demasiados intentos. Espera unos minutos y vuelve a probar.',
      err_weak: 'La contraseña es demasiado débil. Usa al menos 8 caracteres, mezclando letras y números.',
      err_same_password: 'La contraseña nueva tiene que ser distinta de la anterior.',
      err_link_expired: 'El enlace ha caducado o ya se usó. Pide uno nuevo.',
      err_required: 'Este campo es obligatorio.',
      err_email: 'Escribe un email válido.',
      err_name: 'Escribe tu nombre y apellido.',
      err_pw_short: 'La contraseña es demasiado corta.',
      err_role: 'Elige cómo te registras.',
      err_terms: 'Para crear tu cuenta tienes que aceptar las condiciones.',
      err_linkedin: 'Pega el enlace de tu perfil de LinkedIn. Empieza por https://www.linkedin.com/',
      err_instagram: 'El enlace tiene que ser de instagram.com.',
      err_tiktok: 'El enlace tiene que ser de tiktok.com.',
      err_url: 'Escribe un enlace completo, por ejemplo https://tuweb.com',
      err_too_long: 'Es demasiado largo.',
      // profile
      profile_title: 'Mi perfil',
      status_pending: 'En revisión', status_approved: 'Cuenta verificada', status_rejected: 'No verificada',
      pending_notice: 'Tu cuenta está en revisión. Un perfil completo nos ayuda a verificarla antes.',
      rejected_notice: 'No hemos podido verificar tu cuenta. Si crees que es un error, escríbenos a ' + CONTACT + '.',
      role_field: 'Perfil',
      role_locked_hint: 'El perfil solo se puede cambiar mientras la cuenta está en revisión. Si necesitas cambiarlo, escríbenos.',
      headline: 'Una línea sobre ti',
      headline_hint: 'Por ejemplo: project manager en proyectos de tecnología.',
      bio: 'Sobre ti',
      bio_hint: 'Qué haces, en qué puedes ayudar o qué estás construyendo.',
      country: 'País',
      instagram: 'Instagram', tiktok: 'TikTok', website: 'Web',
      email_hint: 'Nadie más en la comunidad ve tu email.',
      save: 'Guardar cambios',
      saved: 'Cambios guardados.',
      signout: 'Salir',
      go_community: 'Ir a la comunidad',
      delete_title: 'Borrar mi cuenta',
      delete_text: 'Se borran tu cuenta, tu perfil, tus cajas y tus respuestas. No se puede deshacer.',
      delete_confirm: 'Sí, borrar mi cuenta',
      // community
      comm_title: 'Comunidad',
      pending_title: 'Tu cuenta está en revisión',
      pending_text: 'Revisamos cada cuenta a mano. Mientras tanto, completa tu perfil: nos ayuda a verificarte.',
      complete_profile: 'Completar mi perfil',
      rejected_title: 'No hemos podido verificar tu cuenta',
      hello: 'Hola, {name}',
      my_profile: 'Mi perfil',
      new_caja: 'Nueva caja',
      new_caja_title: 'Abre tu caja',
      f_title: 'Título',
      f_title_hint: 'En una frase: de qué trata tu proyecto.',
      f_body: 'Tu proyecto',
      f_body_hint: 'Dónde estás hoy (A), adónde quieres llegar (B) y dónde estás atascado.',
      f_seeking: '¿Qué buscas?',
      err_title: 'Entre 5 y 120 caracteres.',
      err_body: 'Cuéntalo en al menos 20 caracteres (máximo 2.000).',
      err_seeking: 'Elige qué buscas.',
      publish: 'Publicar',
      search_label: 'Buscar',
      search_ph: 'Buscar en las cajas',
      filter_label: 'Qué buscan',
      empty_all: 'Todavía no hay cajas. Abre la primera.',
      empty_filter: 'No hay cajas que coincidan con tu búsqueda.',
      replies_0: 'Sin respuestas', replies_1: '1 respuesta', replies_n: '{n} respuestas',
      view: 'Ver caja', hide: 'Ocultar',
      closed: 'Cerrada',
      close_caja: 'Cerrar caja', reopen: 'Reabrir',
      delete: 'Borrar', delete_sure: 'Confirmar: borrar',
      reply_label: 'Tu respuesta',
      reply_hint: 'Cuenta cómo puedes ayudar. Si encaja, la persona verá tu perfil y tus redes.',
      reply_btn: 'Responder',
      err_reply: 'Escribe al menos 2 caracteres (máximo 1.000).',
      closed_note: 'Esta caja está cerrada y ya no admite respuestas.',
      no_links: 'Todavía no ha añadido sus redes.',
      view_profile: 'Ver perfil de {name}'
    },
    en: {
      loading: 'Loading…',
      wait: 'One moment…',
      error_generic: 'Something went wrong. Please try again in a few seconds.',
      not_ready: 'The community opens very soon. Come back in a few days.',
      back_home: 'Back to home',
      optional: '(optional)',
      cancel: 'Cancel',
      close: 'Close',
      member: 'Member',
      role_owner: 'Project owner', role_pm: 'Project manager', role_coach: 'Coach', role_mentor: 'Mentor',
      role_desc_owner: 'You have a project and want help to move it forward.',
      role_desc_pm: 'You bring structure: plan, priorities and follow-up.',
      role_desc_coach: 'You help people keep the project going over time.',
      role_desc_mentor: 'You know all three areas and help set the direction.',
      seek_pm: 'Looking for a project manager', seek_coach: 'Looking for a coach', seek_mentor: 'Looking for a mentor', seek_unsure: 'Not sure yet',
      opt_pm: 'A project manager', opt_coach: 'A coach', opt_mentor: 'A mentor', opt_unsure: 'Not sure yet',
      filter_all: 'All', filter_pm: 'Project manager', filter_coach: 'Coach', filter_mentor: 'Mentor', filter_unsure: 'Not sure',
      signin_title: 'Sign in',
      signin_lead: 'Sign in with your email and password.',
      email: 'Email',
      password: 'Password',
      signin_btn: 'Sign in',
      no_account: "Don't have an account yet?",
      to_signup: 'Create an account',
      forgot_link: 'Forgot your password?',
      signup_title: 'Create account',
      signup_lead: 'Choose how you take part. We review every account by hand before opening the community to it.',
      full_name: 'Full name',
      role_legend: 'I am joining as',
      linkedin: 'LinkedIn profile',
      linkedin_hint: 'We use it to verify your account. Example: https://www.linkedin.com/in/your-name',
      password_hint: 'At least 8 characters.',
      terms_1: 'I am 18 or older and I accept the ',
      terms_link: 'terms of use',
      terms_2: ' and the ',
      privacy_link: 'privacy policy',
      terms_3: '.',
      signup_btn: 'Create account',
      have_account: 'Already have an account?',
      to_signin: 'Sign in',
      sent_title: 'Check your email',
      sent_text: 'We sent a link to {email} to confirm your account. Then we will review it and give you access to the community.',
      sent_spam: "If you don't see it within a few minutes, check your spam folder.",
      forgot_title: 'Reset your password',
      forgot_lead: 'Enter your email and we will send you a link to set a new password.',
      forgot_btn: 'Send link',
      forgot_sent: 'If an account exists for that email, a link will arrive in a few minutes.',
      back_signin: 'Back to sign in',
      recovery_title: 'New password',
      recovery_lead: 'Enter your new password.',
      recovery_btn: 'Save password',
      new_password: 'New password',
      err_credentials: 'The email or password is incorrect.',
      err_not_confirmed: 'You have not confirmed your email yet. Look for the link we sent you.',
      err_rate: 'Too many attempts. Wait a few minutes and try again.',
      err_weak: 'That password is too weak. Use at least 8 characters, mixing letters and numbers.',
      err_same_password: 'The new password must be different from the old one.',
      err_link_expired: 'The link has expired or was already used. Ask for a new one.',
      err_required: 'This field is required.',
      err_email: 'Enter a valid email.',
      err_name: 'Enter your full name.',
      err_pw_short: 'That password is too short.',
      err_role: 'Choose how you are joining.',
      err_terms: 'You need to accept the terms to create your account.',
      err_linkedin: 'Paste the link to your LinkedIn profile. It starts with https://www.linkedin.com/',
      err_instagram: 'The link must be from instagram.com.',
      err_tiktok: 'The link must be from tiktok.com.',
      err_url: 'Enter a full link, for example https://yoursite.com',
      err_too_long: 'This is too long.',
      profile_title: 'My profile',
      status_pending: 'Under review', status_approved: 'Verified account', status_rejected: 'Not verified',
      pending_notice: 'Your account is under review. A complete profile helps us verify it sooner.',
      rejected_notice: 'We could not verify your account. If you think this is a mistake, write to us at ' + CONTACT + '.',
      role_field: 'Profile type',
      role_locked_hint: 'The profile type can only change while the account is under review. If you need to change it, write to us.',
      headline: 'One line about you',
      headline_hint: 'For example: project manager on technology projects.',
      bio: 'About you',
      bio_hint: 'What you do, how you can help or what you are building.',
      country: 'Country',
      instagram: 'Instagram', tiktok: 'TikTok', website: 'Website',
      email_hint: 'Nobody else in the community sees your email.',
      save: 'Save changes',
      saved: 'Changes saved.',
      signout: 'Sign out',
      go_community: 'Go to the community',
      delete_title: 'Delete my account',
      delete_text: 'This deletes your account, your profile, your posts and your replies. It cannot be undone.',
      delete_confirm: 'Yes, delete my account',
      comm_title: 'Community',
      pending_title: 'Your account is under review',
      pending_text: 'We review every account by hand. Meanwhile, complete your profile: it helps us verify you.',
      complete_profile: 'Complete my profile',
      rejected_title: 'We could not verify your account',
      hello: 'Hi, {name}',
      my_profile: 'My profile',
      new_caja: 'New post',
      new_caja_title: 'Describe your project',
      f_title: 'Title',
      f_title_hint: 'One sentence: what your project is about.',
      f_body: 'Your project',
      f_body_hint: 'Where you are today (A), where you want to get (B) and where you are stuck.',
      f_seeking: 'What are you looking for?',
      err_title: 'Between 5 and 120 characters.',
      err_body: 'Use at least 20 characters (2,000 at most).',
      err_seeking: 'Choose what you are looking for.',
      publish: 'Post',
      search_label: 'Search',
      search_ph: 'Search posts',
      filter_label: 'What they are looking for',
      empty_all: 'No posts yet. Write the first one.',
      empty_filter: 'No posts match your search.',
      replies_0: 'No replies yet', replies_1: '1 reply', replies_n: '{n} replies',
      view: 'View post', hide: 'Hide',
      closed: 'Closed',
      close_caja: 'Close post', reopen: 'Reopen',
      delete: 'Delete', delete_sure: 'Confirm: delete',
      reply_label: 'Your reply',
      reply_hint: 'Say how you can help. If it fits, they will see your profile and your social links.',
      reply_btn: 'Reply',
      err_reply: 'Use at least 2 characters (1,000 at most).',
      closed_note: 'This post is closed and no longer accepts replies.',
      no_links: 'No social profiles added yet.',
      view_profile: "View {name}'s profile"
    }
  }[LANG];

  function t(key, vars) {
    var s = STR[key] != null ? STR[key] : key;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.split('{' + k + '}').join(vars[k]); });
    return s;
  }

  // ---------------------------------------------------------------- helpers
  function h(tag, props, kids) {
    var el = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        var v = props[k];
        if (v == null || v === false) return;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k.indexOf('on') === 0) el.addEventListener(k.slice(2), v);
        else if (k === 'value') el.value = v;
        else if (k === 'checked') el.checked = !!v;
        else el.setAttribute(k, v === true ? '' : v);
      });
    }
    (kids || []).forEach(function (c) {
      if (c == null || c === false) return;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return el;
  }
  function put(el, kids) { el.replaceChildren.apply(el, kids.filter(function (k) { return k != null && k !== false; })); }
  function mount() { ROOT.removeAttribute('aria-busy'); put(ROOT, [].slice.call(arguments)); }
  function focusTitle() { var t1 = ROOT.querySelector('h1'); if (t1) { t1.setAttribute('tabindex', '-1'); t1.focus({ preventScroll: true }); } window.scrollTo(0, 0); }
  function notice(text, kind) { return h('div', { class: 'notice' + (kind ? ' ' + kind : ''), role: kind === 'error' ? 'alert' : 'status' }, [text]); }
  function busy(btn, on) {
    if (on) { btn.dataset.label = btn.textContent; btn.textContent = t('wait'); btn.disabled = true; }
    else { btn.textContent = btn.dataset.label || btn.textContent; btn.disabled = false; }
  }
  var uid = 0;
  function field(o) {
    var id = 'f' + (++uid);
    var hintId = id + '-hint', errId = id + '-err';
    var input = o.textarea
      ? h('textarea', { id: id, class: 'textarea', name: o.name, rows: o.rows || 5, maxlength: o.max, required: o.required, 'aria-describedby': o.hint ? hintId : null })
      : h('input', { id: id, class: 'input', name: o.name, type: o.type || 'text', autocomplete: o.autocomplete || null, maxlength: o.max, required: o.required, readonly: o.readonly, placeholder: o.placeholder || null, inputmode: o.inputmode || null, 'aria-describedby': o.hint ? hintId : null });
    if (o.value != null) input.value = o.value;
    var err = h('div', { id: errId, class: 'field-error', hidden: true });
    var wrap = h('div', { class: 'field' }, [
      h('label', { for: id }, [o.label, o.optional ? h('span', { class: 'opt', text: ' ' + t('optional') }) : null]),
      input,
      o.hint ? h('div', { id: hintId, class: 'hint', text: o.hint }) : null,
      err
    ]);
    return {
      wrap: wrap, input: input,
      error: function (msg) {
        wrap.classList.toggle('invalid', !!msg);
        err.hidden = !msg; err.textContent = msg || '';
        input.setAttribute('aria-invalid', msg ? 'true' : 'false');
        if (msg) input.setAttribute('aria-describedby', (o.hint ? hintId + ' ' : '') + errId);
        else if (o.hint) input.setAttribute('aria-describedby', hintId); else input.removeAttribute('aria-describedby');
      }
    };
  }
  function firstInvalid(form) { var f = form.querySelector('[aria-invalid="true"]'); if (f) f.focus(); }
  function fold(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  var DATE = new Intl.DateTimeFormat(LANG === 'en' ? 'en-GB' : 'es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  function fmtDate(iso) { try { return DATE.format(new Date(iso)); } catch (e) { return ''; } }
  function roleLabel(r) { return t('role_' + (r || 'owner')); }
  function firstName(name) { return (name || '').trim().split(/\s+/)[0] || t('member'); }
  function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
  function normUrl(v) {
    v = (v || '').trim();
    if (!v) return '';
    if (!/^[a-z]+:\/\//i.test(v)) v = 'https://' + v.replace(/^\/+/, '');
    return v.replace(/^http:\/\//i, 'https://');
  }
  function checkUrl(v, host) {
    if (!v) return '';
    if (v.length > 200) return t('err_too_long');
    var u;
    try { u = new URL(v); } catch (e) { return host ? t('err_' + host.split('.')[0]) : t('err_url'); }
    if (u.protocol !== 'https:' || /\s/.test(v)) return host ? t('err_' + host.split('.')[0]) : t('err_url');
    if (host) {
      var re = new RegExp('^([a-z0-9-]+\\.)?' + host.replace('.', '\\.') + '$', 'i');
      if (!re.test(u.hostname)) return t('err_' + host.split('.')[0]);
    } else if (u.hostname.indexOf('.') < 1) return t('err_url');
    return '';
  }
  function authError(err) {
    var m = ((err && (err.code || '')) + ' ' + (err && err.message || '')).toLowerCase();
    if (/invalid.?login|invalid_credentials/.test(m)) return t('err_credentials');
    if (/not.?confirmed/.test(m)) return t('err_not_confirmed');
    if (/rate|too many|over_email_send_rate_limit|429/.test(m)) return t('err_rate');
    if (/same.?password|should be different/.test(m)) return t('err_same_password');
    if (/weak|password should/.test(m)) return t('err_weak');
    if (/expired|invalid.*(token|link)|otp/.test(m)) return t('err_link_expired');
    return t('error_generic');
  }
  function hashError() {
    var p = new URLSearchParams(INITIAL_HASH.replace(/^#/, ''));
    return p.get('error_description') || p.get('error') ? t('err_link_expired') : '';
  }

  // ---------------------------------------------------------------- client
  if (!ROOT || !PAGE) return;
  var sb = null;
  if (SUPABASE_KEY && window.supabase && window.supabase.createClient) {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { flowType: 'implicit', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true }
    });
  }
  var recovering = /type=recovery/.test(INITIAL_HASH);

  function notReady() {
    mount(h('h1', { class: 'page-title', text: PAGE === 'profile' ? t('profile_title') : PAGE === 'account' ? t('signin_title') : t('comm_title') }),
      h('p', { class: 'lead', text: t('not_ready') }),
      h('div', { class: 'actions' }, [h('a', { class: 'btn btn-ghost', href: PATHS.home, text: t('back_home') })]));
  }

  function start() {
    if (!sb) { if (PAGE !== 'community') notReady(); return; }
    sb.auth.onAuthStateChange(function (event) {
      if (event === 'PASSWORD_RECOVERY' && !recovering) { recovering = true; if (PAGE === 'account') renderRecovery(); }
    });
    sb.auth.getSession().then(function (res) {
      var session = res && res.data ? res.data.session : null;
      if (PAGE === 'account') accountPage(session);
      else if (PAGE === 'profile') profilePage(session);
      else if (PAGE === 'community') communityPage(session);
    }).catch(function () { mount(notice(t('error_generic'), 'error')); });
  }

  function loadMyProfile(user) {
    return sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
  }

  // ================================================================ ACCOUNT
  function accountPage(session) {
    if (recovering) return renderRecovery();
    if (session) { window.location.replace(PATHS.community); return; }
    var mode = /[?&](registro|signup)\b/.test(window.location.search) ? 'signup' : 'signin';
    if (mode === 'signup') renderSignup(); else renderSignin(hashError());
  }

  function renderSignin(errorText) {
    var email = field({ label: t('email'), type: 'email', name: 'email', autocomplete: 'email', required: true, inputmode: 'email' });
    var pw = field({ label: t('password'), type: 'password', name: 'password', autocomplete: 'current-password', required: true });
    var msg = h('div');
    var btn = h('button', { class: 'btn btn-primary', type: 'submit', text: t('signin_btn') });
    var form = h('form', { class: 'form', novalidate: true, onsubmit: function (e) {
      e.preventDefault();
      msg.replaceChildren();
      var ev = email.input.value.trim(), pv = pw.input.value;
      email.error(!ev ? t('err_required') : !isEmail(ev) ? t('err_email') : '');
      pw.error(!pv ? t('err_required') : '');
      if (!ev || !isEmail(ev) || !pv) return firstInvalid(form);
      busy(btn, true);
      sb.auth.signInWithPassword({ email: ev, password: pv }).then(function (res) {
        if (res.error) { busy(btn, false); msg.replaceChildren(notice(authError(res.error), 'error')); return; }
        window.location.href = PATHS.community;
      }).catch(function () { busy(btn, false); msg.replaceChildren(notice(t('error_generic'), 'error')); });
    } }, [email.wrap, pw.wrap, msg, h('div', { class: 'actions' }, [btn])]);
    mount(
      h('h1', { class: 'page-title', text: t('signin_title') }),
      h('p', { class: 'lead', text: t('signin_lead') }),
      errorText ? notice(errorText, 'error') : null,
      form,
      h('p', { class: 'small muted', style: 'margin-top:32px' }, [h('button', { class: 'linkish', type: 'button', text: t('forgot_link'), onclick: function () { renderForgot(); focusTitle(); } })]),
      h('p', { class: 'small muted' }, [t('no_account') + ' ', h('button', { class: 'linkish', type: 'button', text: t('to_signup'), onclick: function () { renderSignup(); focusTitle(); } })])
    );
  }

  function renderSignup() {
    var name = field({ label: t('full_name'), name: 'name', autocomplete: 'name', required: true, max: 80 });
    var email = field({ label: t('email'), type: 'email', name: 'email', autocomplete: 'email', required: true, inputmode: 'email' });
    var pw = field({ label: t('password'), type: 'password', name: 'password', autocomplete: 'new-password', required: true, hint: t('password_hint') });
    var li = field({ label: t('linkedin'), type: 'url', name: 'linkedin', autocomplete: 'url', required: true, max: 200, hint: t('linkedin_hint'), inputmode: 'url' });
    var roleErr = h('div', { class: 'field-error', hidden: true });
    var roles = h('div', { class: 'roles', role: 'radiogroup' }, ['owner', 'pm', 'coach', 'mentor'].map(function (r) {
      return h('label', { class: 'role-option' }, [
        h('input', { type: 'radio', name: 'role', value: r }),
        h('span', { class: 'card' }, [h('b', { text: roleLabel(r) }), h('span', { text: t('role_desc_' + r) })])
      ]);
    }));
    var roleSet = h('fieldset', { class: 'field' }, [h('legend', { text: t('role_legend') }), roles, roleErr]);
    var terms = h('input', { type: 'checkbox', name: 'terms', id: 'terms' });
    var termsErr = h('div', { class: 'field-error', hidden: true });
    var termsRow = h('div', { class: 'field' }, [
      h('label', { class: 'check', for: 'terms' }, [terms, h('span', null, [
        t('terms_1'), h('a', { href: PATHS.terms, target: '_blank', rel: 'noopener', text: t('terms_link') }),
        t('terms_2'), h('a', { href: PATHS.privacy, target: '_blank', rel: 'noopener', text: t('privacy_link') }), t('terms_3')
      ])]),
      termsErr
    ]);
    var msg = h('div');
    var btn = h('button', { class: 'btn btn-primary', type: 'submit', text: t('signup_btn') });
    var form = h('form', { class: 'form', novalidate: true, onsubmit: function (e) {
      e.preventDefault();
      msg.replaceChildren();
      var nv = name.input.value.trim(), ev = email.input.value.trim(), pv = pw.input.value;
      var lv = normUrl(li.input.value); li.input.value = lv;
      var rv = (form.querySelector('input[name=role]:checked') || {}).value;
      var ok = true;
      name.error(nv.length < 2 ? t('err_name') : ''); ok = ok && nv.length >= 2;
      email.error(!ev ? t('err_required') : !isEmail(ev) ? t('err_email') : ''); ok = ok && isEmail(ev);
      pw.error(pv.length < 8 ? t('err_pw_short') : ''); ok = ok && pv.length >= 8;
      var le = !lv ? t('err_linkedin') : checkUrl(lv, 'linkedin.com'); li.error(le); ok = ok && !le;
      roleErr.hidden = !!rv; roleErr.textContent = rv ? '' : t('err_role'); ok = ok && !!rv;
      termsErr.hidden = terms.checked; termsErr.textContent = terms.checked ? '' : t('err_terms'); ok = ok && terms.checked;
      if (!ok) { var bad = form.querySelector('[aria-invalid="true"]') || (!rv ? roles.querySelector('input') : terms); bad.focus(); return; }
      busy(btn, true);
      sb.auth.signUp({
        email: ev, password: pv,
        options: {
          emailRedirectTo: window.location.origin + PATHS.community,
          data: { full_name: nv, role: rv, linkedin_url: lv, terms_accepted: 'true', lang: LANG }
        }
      }).then(function (res) {
        busy(btn, false);
        if (res.error) { msg.replaceChildren(notice(authError(res.error), 'error')); return; }
        if (res.data && res.data.session) { window.location.href = PATHS.community; return; }
        renderSent(ev);
      }).catch(function () { busy(btn, false); msg.replaceChildren(notice(t('error_generic'), 'error')); });
    } }, [name.wrap, email.wrap, pw.wrap, roleSet, li.wrap, termsRow, msg, h('div', { class: 'actions' }, [btn])]);
    mount(
      h('h1', { class: 'page-title', text: t('signup_title') }),
      h('p', { class: 'lead', text: t('signup_lead') }),
      form,
      h('p', { class: 'small muted', style: 'margin-top:32px' }, [t('have_account') + ' ', h('button', { class: 'linkish', type: 'button', text: t('to_signin'), onclick: function () { renderSignin(); focusTitle(); } })])
    );
  }

  function renderSent(email) {
    mount(
      h('h1', { class: 'page-title', text: t('sent_title') }),
      h('p', { class: 'lead', text: t('sent_text', { email: email }) }),
      h('p', { class: 'small muted', style: 'margin-top:16px', text: t('sent_spam') })
    );
    focusTitle();
  }

  function renderForgot() {
    var email = field({ label: t('email'), type: 'email', name: 'email', autocomplete: 'email', required: true, inputmode: 'email' });
    var msg = h('div');
    var btn = h('button', { class: 'btn btn-primary', type: 'submit', text: t('forgot_btn') });
    var form = h('form', { class: 'form', novalidate: true, onsubmit: function (e) {
      e.preventDefault();
      var ev = email.input.value.trim();
      email.error(!ev ? t('err_required') : !isEmail(ev) ? t('err_email') : '');
      if (!isEmail(ev)) return firstInvalid(form);
      busy(btn, true);
      sb.auth.resetPasswordForEmail(ev, { redirectTo: window.location.origin + PATHS.account }).then(function (res) {
        busy(btn, false);
        if (res.error && /rate|429/i.test(res.error.message + res.error.status)) { msg.replaceChildren(notice(t('err_rate'), 'error')); return; }
        form.replaceChildren(notice(t('forgot_sent'), 'ok'));
      }).catch(function () { busy(btn, false); msg.replaceChildren(notice(t('error_generic'), 'error')); });
    } }, [email.wrap, msg, h('div', { class: 'actions' }, [btn])]);
    mount(
      h('h1', { class: 'page-title', text: t('forgot_title') }),
      h('p', { class: 'lead', text: t('forgot_lead') }),
      form,
      h('p', { class: 'small', style: 'margin-top:32px' }, [h('button', { class: 'linkish', type: 'button', text: t('back_signin'), onclick: function () { renderSignin(); focusTitle(); } })])
    );
  }

  function renderRecovery() {
    var pw = field({ label: t('new_password'), type: 'password', name: 'password', autocomplete: 'new-password', required: true, hint: t('password_hint') });
    var msg = h('div');
    var btn = h('button', { class: 'btn btn-primary', type: 'submit', text: t('recovery_btn') });
    var form = h('form', { class: 'form', novalidate: true, onsubmit: function (e) {
      e.preventDefault();
      var pv = pw.input.value;
      pw.error(pv.length < 8 ? t('err_pw_short') : '');
      if (pv.length < 8) return firstInvalid(form);
      busy(btn, true);
      sb.auth.updateUser({ password: pv }).then(function (res) {
        if (res.error) { busy(btn, false); msg.replaceChildren(notice(authError(res.error), 'error')); return; }
        recovering = false;
        window.location.href = PATHS.community;
      }).catch(function () { busy(btn, false); msg.replaceChildren(notice(t('error_generic'), 'error')); });
    } }, [pw.wrap, msg, h('div', { class: 'actions' }, [btn])]);
    mount(h('h1', { class: 'page-title', text: t('recovery_title') }), h('p', { class: 'lead', text: t('recovery_lead') }), form);
  }

  // ================================================================ PROFILE
  function profilePage(session) {
    if (!session) { window.location.replace(PATHS.account); return; }
    var user = session.user;
    loadMyProfile(user).then(function (res) {
      if (res.error || !res.data) { mount(h('h1', { class: 'page-title', text: t('profile_title') }), notice(t('error_generic'), 'error')); return; }
      renderProfile(user, res.data);
    });
  }

  function statusPill(status) {
    return h('span', { class: 'status-pill ' + status, text: t('status_' + status) });
  }

  function renderProfile(user, p) {
    var pending = p.status === 'pending';
    var name = field({ label: t('full_name'), name: 'name', autocomplete: 'name', required: true, max: 80, value: p.full_name });
    var roleSel = h('select', { id: 'role', class: 'select', name: 'role', disabled: !pending, 'aria-describedby': pending ? null : 'role-hint' },
      ['owner', 'pm', 'coach', 'mentor'].map(function (r) { var o = h('option', { value: r, text: roleLabel(r) }); if (r === p.role) o.selected = true; return o; }));
    var roleWrap = h('div', { class: 'field' }, [h('label', { for: 'role', text: t('role_field') }), roleSel,
      pending ? null : h('div', { id: 'role-hint', class: 'hint', text: t('role_locked_hint') })]);
    var headline = field({ label: t('headline'), name: 'headline', max: 120, optional: true, hint: t('headline_hint'), value: p.headline });
    var bio = field({ label: t('bio'), name: 'bio', textarea: true, rows: 5, max: 600, optional: true, hint: t('bio_hint'), value: p.bio });
    var country = field({ label: t('country'), name: 'country', autocomplete: 'country-name', max: 60, optional: true, value: p.country });
    var li = field({ label: t('linkedin'), type: 'url', name: 'linkedin', max: 200, inputmode: 'url', value: p.linkedin_url, hint: t('linkedin_hint') });
    var ig = field({ label: t('instagram'), type: 'url', name: 'instagram', max: 200, inputmode: 'url', optional: true, value: p.instagram_url, placeholder: 'https://www.instagram.com/…' });
    var tk = field({ label: t('tiktok'), type: 'url', name: 'tiktok', max: 200, inputmode: 'url', optional: true, value: p.tiktok_url, placeholder: 'https://www.tiktok.com/@…' });
    var web = field({ label: t('website'), type: 'url', name: 'website', max: 200, inputmode: 'url', optional: true, value: p.website_url, placeholder: 'https://…' });
    var email = field({ label: t('email'), type: 'email', name: 'email', readonly: true, value: user.email, hint: t('email_hint') });
    var msg = h('div');
    var btn = h('button', { class: 'btn btn-primary', type: 'submit', text: t('save') });
    var form = h('form', { class: 'form', novalidate: true, onsubmit: function (e) {
      e.preventDefault();
      msg.replaceChildren();
      var nv = name.input.value.trim();
      var links = [[li, 'linkedin.com'], [ig, 'instagram.com'], [tk, 'tiktok.com'], [web, null]];
      var ok = nv.length >= 2;
      name.error(ok ? '' : t('err_name'));
      links.forEach(function (pair) {
        var v = normUrl(pair[0].input.value); pair[0].input.value = v;
        var err = pair[1] === 'linkedin.com' && !v ? t('err_linkedin') : checkUrl(v, pair[1]);
        pair[0].error(err); if (err) ok = false;
      });
      if (!ok) return firstInvalid(form);
      var update = {
        full_name: nv,
        headline: headline.input.value.trim() || null,
        bio: bio.input.value.trim() || null,
        country: country.input.value.trim() || null,
        linkedin_url: li.input.value || null,
        instagram_url: ig.input.value || null,
        tiktok_url: tk.input.value || null,
        website_url: web.input.value || null
      };
      if (pending) update.role = roleSel.value;
      busy(btn, true);
      sb.from('profiles').update(update).eq('id', user.id).select().maybeSingle().then(function (res) {
        busy(btn, false);
        if (res.error) { msg.replaceChildren(notice(t('error_generic'), 'error')); return; }
        msg.replaceChildren(notice(t('saved'), 'ok'));
      });
    } }, [name.wrap, roleWrap, headline.wrap, bio.wrap, country.wrap, li.wrap, ig.wrap, tk.wrap, web.wrap, email.wrap, msg, h('div', { class: 'actions' }, [btn])]);

    var danger = h('div', { class: 'panel', style: 'margin-top:56px' });
    function dangerIdle() {
      danger.replaceChildren(h('h2', { text: t('delete_title') }), h('p', { class: 'small muted', style: 'margin:10px 0 0', text: t('delete_text') }),
        h('div', { class: 'actions', style: 'margin-top:20px' }, [h('button', { class: 'btn btn-danger', type: 'button', text: t('delete_title'), onclick: dangerConfirm })]));
    }
    function dangerConfirm() {
      var yes = h('button', { class: 'btn btn-danger', type: 'button', text: t('delete_confirm'), onclick: function () {
        busy(yes, true);
        sb.rpc('delete_my_account').then(function (res) {
          if (res.error) { busy(yes, false); danger.appendChild(notice(t('error_generic'), 'error')); return; }
          sb.auth.signOut().finally(function () { window.location.href = PATHS.home; });
        });
      } });
      danger.replaceChildren(h('h2', { text: t('delete_title') }), h('p', { class: 'small', style: 'margin:10px 0 0', text: t('delete_text') }),
        h('div', { class: 'actions', style: 'margin-top:20px' }, [yes, h('button', { class: 'btn btn-ghost', type: 'button', text: t('cancel'), onclick: dangerIdle })]));
      yes.focus();
    }
    dangerIdle();

    mount(
      h('div', { class: 'userbar' }, [
        statusPill(p.status),
        h('span', { class: 'hello' }),
        p.status === 'approved' ? h('a', { class: 'linkish', href: PATHS.community, text: t('go_community') }) : null,
        h('button', { class: 'linkish', type: 'button', text: t('signout'), onclick: signOut })
      ]),
      h('h1', { class: 'page-title', text: t('profile_title') }),
      pending ? notice(t('pending_notice')) : p.status === 'rejected' ? notice(t('rejected_notice'), 'error') : null,
      form,
      danger
    );
  }

  function signOut() { sb.auth.signOut().finally(function () { window.location.href = PATHS.community; }); }

  // ================================================================ COMMUNITY
  var state = { me: null, user: null, cajas: [], filter: 'all', q: '', open: {}, replies: {} };

  function communityPage(session) {
    if (!session) return; // the page already shows the public intro
    ROOT.setAttribute('aria-busy', 'true');
    ROOT.replaceChildren(h('p', { class: 'lead', text: t('loading') }));
    state.user = session.user;
    loadMyProfile(session.user).then(function (res) {
      if (res.error || !res.data) { mount(h('h1', { class: 'page-title', text: t('comm_title') }), notice(t('error_generic'), 'error')); return; }
      state.me = res.data;
      if (res.data.status === 'approved') renderBoard();
      else renderWaiting(res.data);
    });
  }

  function userbar() {
    return h('div', { class: 'userbar' }, [
      h('span', { class: 'hello', text: t('hello', { name: firstName(state.me.full_name) }) }),
      h('a', { class: 'linkish', href: PATHS.profile, text: t('my_profile') }),
      h('button', { class: 'linkish', type: 'button', text: t('signout'), onclick: signOut })
    ]);
  }

  function renderWaiting(p) {
    var rejected = p.status === 'rejected';
    mount(
      userbar(),
      h('h1', { class: 'page-title', text: rejected ? t('rejected_title') : t('pending_title') }),
      h('p', { class: 'lead', text: rejected ? t('rejected_notice') : t('pending_text') }),
      rejected ? null : h('div', { class: 'actions' }, [h('a', { class: 'btn btn-primary', href: PATHS.profile, text: t('complete_profile') })])
    );
  }

  var listEl, countEl, dialog;
  function renderBoard() {
    var formPanel = h('div', { hidden: true });
    var newBtn = h('button', { class: 'btn btn-primary', type: 'button', text: t('new_caja'), 'aria-expanded': 'false', onclick: function () {
      var showing = !formPanel.hidden;
      formPanel.hidden = showing;
      newBtn.setAttribute('aria-expanded', String(!showing));
      if (!showing) { formPanel.replaceChildren(newCajaForm(function () { formPanel.hidden = true; newBtn.setAttribute('aria-expanded', 'false'); })); formPanel.querySelector('input').focus(); }
    } });
    var search = h('input', { id: 'q', class: 'input', type: 'search', placeholder: t('search_ph'), autocomplete: 'off', oninput: function () { state.q = search.value; renderList(); } });
    var chips = h('div', { class: 'chips', role: 'group', 'aria-label': t('filter_label') }, ['all', 'coach', 'pm', 'mentor', 'unsure'].map(function (f) {
      return h('button', { class: 'chip', type: 'button', 'aria-pressed': f === state.filter ? 'true' : 'false', text: t('filter_' + f), onclick: function (e) {
        state.filter = f;
        [].forEach.call(chips.children, function (c) { c.setAttribute('aria-pressed', c === e.currentTarget ? 'true' : 'false'); });
        renderList();
      } });
    }));
    listEl = h('ul', { class: 'cajas' });
    countEl = h('p', { class: 'sr', 'aria-live': 'polite' });
    dialog = buildDialog();
    mount(
      userbar(),
      h('div', { class: 'head-row' }, [h('h1', { class: 'page-title', text: t('comm_title') }), newBtn]),
      formPanel,
      h('div', { class: 'toolbar' }, [h('label', { class: 'sr', for: 'q', text: t('search_label') }), search, chips]),
      countEl,
      listEl,
      dialog
    );
    loadCajas();
  }

  function loadCajas(openId) {
    return sb.from('requests')
      .select('id,title,body,seeking,is_open,created_at,author_id,author:profiles!requests_author_id_fkey(id,full_name,role),replies(count)')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(function (res) {
        if (res.error) { listEl.replaceChildren(h('li', null, [notice(t('error_generic'), 'error')])); return; }
        state.cajas = res.data || [];
        if (openId) state.open[openId] = true;
        renderList();
        if (openId) loadReplies(openId);
      });
  }

  function visibleCajas() {
    var q = fold(state.q.trim());
    return state.cajas.filter(function (c) {
      if (state.filter !== 'all' && c.seeking !== state.filter) return false;
      if (!q) return true;
      return fold(c.title + ' ' + c.body + ' ' + (c.author ? c.author.full_name : '')).indexOf(q) !== -1;
    });
  }

  function replyCount(c) {
    var n = c.replies && c.replies[0] ? c.replies[0].count : 0;
    return n === 0 ? t('replies_0') : n === 1 ? t('replies_1') : t('replies_n', { n: n });
  }

  function renderList() {
    var items = visibleCajas();
    if (!state.cajas.length) { listEl.replaceChildren(h('li', { class: 'empty', text: t('empty_all') })); countEl.textContent = ''; return; }
    if (!items.length) { listEl.replaceChildren(h('li', { class: 'empty', text: t('empty_filter') })); countEl.textContent = t('empty_filter'); return; }
    listEl.replaceChildren.apply(listEl, items.map(cajaItem));
    countEl.textContent = state.q || state.filter !== 'all' ? String(items.length) : '';
  }

  function authorButton(person) {
    var name = person ? person.full_name : t('member');
    if (!person) return h('span', { text: name });
    return h('button', { class: 'linkish', type: 'button', text: name, 'aria-label': t('view_profile', { name: name }), onclick: function () { openProfile(person.id); } });
  }

  function cajaItem(c) {
    var open = !!state.open[c.id];
    var mine = c.author_id === state.user.id;
    var detailId = 'caja-' + c.id;
    var li = h('li', { class: 'caja' });
    var toggle = function () { state.open[c.id] = !open; renderList(); if (!open) loadReplies(c.id); };
    var kids = [
      h('div', { class: 'caja-top' }, [h('span', { class: 'badge', text: t('seek_' + c.seeking) }), c.is_open ? null : h('span', { class: 'badge closed', text: t('closed') })]),
      h('h2', null, [h('button', { type: 'button', 'aria-expanded': String(open), 'aria-controls': detailId, text: c.title, onclick: toggle })]),
      h('div', { class: 'meta-line' }, [authorButton(c.author), h('span', { 'aria-hidden': 'true', text: '·' }), h('span', { text: roleLabel(c.author && c.author.role) }), h('span', { 'aria-hidden': 'true', text: '·' }), h('span', { text: fmtDate(c.created_at) })])
    ];
    if (!open) {
      kids.push(h('p', { class: 'excerpt', text: c.body.length > 220 ? c.body.slice(0, 217).trimEnd() + '…' : c.body }));
    } else {
      kids.push(h('div', { id: detailId }, [h('p', { class: 'fulltext', text: c.body }), h('div', { class: 'thread', 'data-thread': c.id }, [h('p', { class: 'small muted', style: 'margin-top:20px', text: t('loading') })])]));
    }
    var foot = h('div', { class: 'caja-foot' }, [
      h('span', { text: replyCount(c) }),
      h('button', { class: 'linkish', type: 'button', text: open ? t('hide') : t('view'), onclick: toggle })
    ]);
    if (mine) {
      foot.appendChild(h('button', { class: 'linkish', type: 'button', text: c.is_open ? t('close_caja') : t('reopen'), onclick: function () {
        sb.from('requests').update({ is_open: !c.is_open }).eq('id', c.id).then(function (res) { if (!res.error) loadCajas(open ? c.id : null); });
      } }));
      var del = h('button', { class: 'linkish', type: 'button', text: t('delete'), onclick: function () {
        if (del.dataset.armed !== '1') { del.dataset.armed = '1'; del.textContent = t('delete_sure'); setTimeout(function () { del.dataset.armed = ''; del.textContent = t('delete'); }, 5000); return; }
        sb.from('requests').delete().eq('id', c.id).then(function (res) { if (!res.error) { delete state.open[c.id]; loadCajas(); } });
      } });
      foot.appendChild(del);
    }
    kids.push(foot);
    li.replaceChildren.apply(li, kids);
    if (open && state.replies[c.id]) renderThread(c, li.querySelector('[data-thread]'));
    return li;
  }

  function loadReplies(id) {
    return sb.from('replies')
      .select('id,body,created_at,author_id,author:profiles!replies_author_id_fkey(id,full_name,role)')
      .eq('request_id', id)
      .order('created_at', { ascending: true })
      .then(function (res) {
        state.replies[id] = res.error ? null : (res.data || []);
        var box = listEl.querySelector('[data-thread="' + id + '"]');
        var c = state.cajas.filter(function (x) { return x.id === id; })[0];
        if (box && c) {
          if (res.error) box.replaceChildren(notice(t('error_generic'), 'error'));
          else renderThread(c, box);
        }
      });
  }

  function renderThread(c, box) {
    var replies = state.replies[c.id] || [];
    var list = replies.length ? h('ul', { class: 'replies' }, replies.map(function (r) {
      var mine = r.author_id === state.user.id;
      var del = mine ? h('button', { class: 'linkish', type: 'button', text: t('delete'), onclick: function () {
        if (del.dataset.armed !== '1') { del.dataset.armed = '1'; del.textContent = t('delete_sure'); setTimeout(function () { del.dataset.armed = ''; del.textContent = t('delete'); }, 5000); return; }
        sb.from('replies').delete().eq('id', r.id).then(function (res) { if (!res.error) refreshAfterReply(c.id); });
      } }) : null;
      return h('li', { class: 'reply' }, [
        h('div', { class: 'meta-line' }, [authorButton(r.author), h('span', { 'aria-hidden': 'true', text: '·' }), h('span', { text: roleLabel(r.author && r.author.role) }), h('span', { 'aria-hidden': 'true', text: '·' }), h('span', { text: fmtDate(r.created_at) }), del ? h('span', { 'aria-hidden': 'true', text: '·' }) : null, del]),
        h('p', { text: r.body })
      ]);
    })) : null;
    var tail;
    if (c.is_open) {
      var f = field({ label: t('reply_label'), name: 'reply', textarea: true, rows: 3, max: 1000, hint: t('reply_hint') });
      var msg = h('div');
      var btn = h('button', { class: 'btn btn-ghost', type: 'submit', text: t('reply_btn') });
      tail = h('form', { class: 'reply-form', novalidate: true, onsubmit: function (e) {
        e.preventDefault();
        var v = f.input.value.trim();
        f.error(v.length < 2 || v.length > 1000 ? t('err_reply') : '');
        if (v.length < 2 || v.length > 1000) return f.input.focus();
        busy(btn, true);
        sb.from('replies').insert({ request_id: c.id, body: v }).then(function (res) {
          busy(btn, false);
          if (res.error) { msg.replaceChildren(notice(t('error_generic'), 'error')); return; }
          refreshAfterReply(c.id);
        });
      } }, [f.wrap, msg, h('div', null, [btn])]);
    } else {
      tail = h('p', { class: 'small muted', style: 'margin-top:20px', text: t('closed_note') });
    }
    box.replaceChildren.apply(box, [list, tail].filter(Boolean));
  }

  function refreshAfterReply(id) {
    delete state.replies[id];
    loadCajas(id);
  }

  function newCajaForm(done) {
    var title = field({ label: t('f_title'), name: 'title', max: 120, required: true, hint: t('f_title_hint') });
    var body = field({ label: t('f_body'), name: 'body', textarea: true, rows: 6, max: 2000, required: true, hint: t('f_body_hint') });
    var seekErr = h('div', { class: 'field-error', hidden: true });
    var seekGroup = h('div', { class: 'chips', role: 'radiogroup', 'aria-label': t('f_seeking') }, ['coach', 'pm', 'mentor', 'unsure'].map(function (s) {
      return h('button', { class: 'chip', type: 'button', role: 'radio', 'aria-checked': 'false', 'data-value': s, text: t('opt_' + s), onclick: function (e) {
        [].forEach.call(seekGroup.children, function (c) { c.setAttribute('aria-checked', c === e.currentTarget ? 'true' : 'false'); });
        seekErr.hidden = true;
      } });
    }));
    var msg = h('div');
    var btn = h('button', { class: 'btn btn-primary', type: 'submit', text: t('publish') });
    var form = h('form', { class: 'form', novalidate: true, style: 'margin-top:20px', onsubmit: function (e) {
      e.preventDefault();
      var tv = title.input.value.trim(), bv = body.input.value.trim();
      var sel = seekGroup.querySelector('[aria-checked="true"]');
      var ok = true;
      title.error(tv.length < 5 || tv.length > 120 ? t('err_title') : ''); ok = ok && tv.length >= 5 && tv.length <= 120;
      body.error(bv.length < 20 || bv.length > 2000 ? t('err_body') : ''); ok = ok && bv.length >= 20 && bv.length <= 2000;
      seekErr.hidden = !!sel; seekErr.textContent = sel ? '' : t('err_seeking'); ok = ok && !!sel;
      if (!ok) { var bad = form.querySelector('[aria-invalid="true"]') || seekGroup.firstChild; bad.focus(); return; }
      busy(btn, true);
      sb.from('requests').insert({ title: tv, body: bv, seeking: sel.getAttribute('data-value') }).select('id').single().then(function (res) {
        busy(btn, false);
        if (res.error) { msg.replaceChildren(notice(t('error_generic'), 'error')); return; }
        done();
        loadCajas(res.data.id);
      });
    } }, [
      title.wrap, body.wrap,
      h('div', { class: 'field' }, [h('span', { class: 'label', text: t('f_seeking') }), seekGroup, seekErr]),
      msg,
      h('div', { class: 'actions', style: 'margin-top:8px' }, [btn, h('button', { class: 'btn btn-ghost', type: 'button', text: t('cancel'), onclick: done })])
    ]);
    return h('div', { class: 'panel' }, [h('h2', { text: t('new_caja_title') }), form]);
  }

  function buildDialog() {
    var d = h('dialog', { class: 'profile-dialog', 'aria-labelledby': 'pd-name' });
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
    return d;
  }

  function openProfile(id) {
    var close = h('button', { class: 'dialog-close', type: 'button', 'aria-label': t('close'), text: '×', onclick: function () { dialog.close(); } });
    dialog.replaceChildren(close, h('p', { class: 'small muted', text: t('loading') }));
    if (!dialog.open) dialog.showModal();
    sb.from('profiles').select('full_name,role,headline,bio,country,linkedin_url,instagram_url,tiktok_url,website_url').eq('id', id).maybeSingle().then(function (res) {
      if (res.error || !res.data) { dialog.replaceChildren(close, notice(t('error_generic'), 'error')); return; }
      var p = res.data;
      var links = [['LinkedIn', p.linkedin_url], [t('instagram'), p.instagram_url], [t('tiktok'), p.tiktok_url], [t('website'), p.website_url]]
        .filter(function (l) { return l[1] && /^https:\/\//i.test(l[1]); })
        .map(function (l) { return h('a', { href: l[1], target: '_blank', rel: 'noopener noreferrer nofollow', text: l[0] }); });
      put(dialog, [
        close,
        h('span', { class: 'badge', text: roleLabel(p.role) }),
        h('h2', { id: 'pd-name', text: p.full_name }),
        p.headline ? h('p', { class: 'headline', text: p.headline }) : null,
        p.country ? h('p', { class: 'small muted', style: 'margin:6px 0 0', text: p.country }) : null,
        p.bio ? h('p', { class: 'bio', text: p.bio }) : null,
        links.length ? h('div', { class: 'socials' }, links) : h('p', { class: 'small muted', style: 'margin-top:20px', text: t('no_links') })
      ]);
      close.focus();
    });
  }

  start();
})();
