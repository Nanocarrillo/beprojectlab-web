/* BeProject Lab · community app
   Accounts (sign in, sign up, password reset), "Mi perfil" and the
   community page with cajas de diálogo. Talks to Supabase from the browser;
   what each person can read or change is enforced by the database itself. */
(function () {
  'use strict';

  // Public settings. The publishable key is meant to live in the website.
  var SUPABASE_URL = 'https://sohfylmeymppewbetvhd.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_OtMKVmMrnKAs1T95x0GM_Q_zpoIHpjF';

  var LANG = document.documentElement.lang === 'en' ? 'en' : 'es';
  var PAGE = document.body.getAttribute('data-page');
  var ROOT = document.getElementById('app');
  var INITIAL_HASH = window.location.hash || '';
  var CONTACT = 'info@beprojectlab.com';

  var PATHS = {
    es: { home: '/', community: '/comunidad/', account: '/cuenta/', profile: '/perfil/', notifications: '/notificaciones/', privacy: '/privacidad/', terms: '/condiciones/' },
    en: { home: '/en/', community: '/en/community/', account: '/en/account/', profile: '/en/profile/', notifications: '/en/notifications/', privacy: '/en/privacy/', terms: '/en/terms/' }
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
      filter_prefix: 'Buscan:',
      empty_all: 'Todavía no hay cajas. Abre la primera.',
      empty_filter: 'No hay cajas que coincidan con tu búsqueda.',
      replies_0: 'Sin respuestas', replies_1: '1 respuesta', replies_n: '{n} respuestas',
      view: 'Ver caja', hide: 'Ocultar',
      closed: 'Cerrada',
      close_caja: 'Cerrar caja', reopen: 'Reabrir',
      delete: 'Borrar', delete_sure: 'Confirmar: borrar',
      reply_label: 'Tu respuesta',
      reply_hint: 'Las respuestas las ven todos los miembros, con tu nombre y tu tipo de perfil.',
      reply_btn: 'Responder',
      err_reply: 'Escribe al menos 2 caracteres (máximo 1.000).',
      closed_note: 'Esta caja está cerrada y ya no admite respuestas.',
      no_links: 'Todavía no ha añadido sus redes.',
      view_profile: 'Ver perfil de {name}',
      // interest and connections
      can_help: '¿Puedes ayudar a {name}?',
      can_help_text: '{name} leerá tu mensaje. Vuestros perfiles y enlaces solo se comparten si los dos aceptáis conectaros.',
      interest_btn: 'Me interesa',
      interest_lead: 'Cuéntale a {name} cómo puedes ayudar. Todavía no ve tu perfil: este mensaje es tu presentación.',
      interest_label: 'Tu mensaje',
      interest_lock: 'Tu perfil y tus enlaces siguen ocultos. Solo se comparten si {name} conecta contigo.',
      err_interest: 'Escribe al menos 20 caracteres (máximo 500).',
      send: 'Enviar',
      interest_sent: 'Interés enviado · {date}',
      interest_sent_text: '{name} ya tiene tu mensaje. Si conecta contigo, te llegará una notificación aquí y podréis ver vuestros perfiles.',
      show_my_msg: 'Ver mi mensaje', hide_my_msg: 'Ocultar mi mensaje',
      withdraw: 'Retirar interés', withdraw_sure: 'Confirmar: retirar',
      connected_pill: 'Conectados · {date}',
      connected_text: 'Ya podéis ver vuestros perfiles y cómo contactaros.',
      interested_title: 'Interesados',
      interested_hint: 'Solo tú ves esta lista. Si no conectas con alguien, no recibe ningún aviso.',
      interested_empty: 'Todavía nadie ha dicho «Me interesa».',
      connect: 'Conectar',
      connect_q: '¿Conectar con {name}?',
      connect_text: '{name} verá tu perfil completo y cómo contactarte, y tú verás los suyos. {name} recibirá una notificación.',
      connect_shared_label: 'Se comparte',
      connect_shared: 'Una línea sobre ti, país, descripción, LinkedIn, Instagram, TikTok, web y «Cómo contactarme». Tu email de acceso nunca se comparte.',
      connected_done: 'Conectados. {name} ya puede ver tu perfil y tú el suyo.',
      foot_interested_1: '1 interesado', foot_interested_n: '{n} interesados',
      foot_interest_sent: 'Interés enviado', foot_connected: 'Conectados',
      locked_text: 'Su perfil y sus enlaces se ven cuando los dos aceptáis conectaros.',
      locked_hint: 'Para conectar, pulsa «Me interesa» en una de sus cajas.',
      contact_label: 'Cómo contactarme',
      no_contact: 'Todavía no ha escrito cómo prefiere que le contacten.',
      this_is_you: 'Así te ven las personas con las que conectas.',
      edit_profile: 'Editar mi perfil',
      // profile: privacy, contact and connections
      privacy_note: 'Todos los miembros ven tu nombre y tu tipo de perfil. El resto, incluido cómo contactarte, solo lo ven las personas con las que conectas.',
      contact_field: 'Cómo contactarme',
      contact_hint: 'Por ejemplo, un email o tu LinkedIn. Solo lo ven las personas con las que conectas; tu email de acceso nunca se comparte.',
      my_data: 'Tus datos',
      connections_title: 'Mis conexiones',
      connections_empty: 'Todavía no tienes conexiones. Empiezan en las cajas: di «Me interesa» en la de otra persona o conecta con quien se interese por la tuya.',
      pending_interests_1: 'Tienes 1 interés enviado en espera.',
      pending_interests_n: 'Tienes {n} intereses enviados en espera.',
      view_profile_btn: 'Ver perfil',
      // notifications
      bell: 'Notificaciones', bell_1: 'Notificaciones: 1 nueva', bell_n: 'Notificaciones: {n} nuevas',
      notif_title: 'Notificaciones',
      notif_empty: 'Todavía no tienes notificaciones.',
      notif_interest: '{name}, {role}, quiere ayudarte con tu caja «{title}».',
      notif_connected: '{name} ha conectado contigo por la caja «{title}». Ya podéis ver vuestros perfiles y cómo contactaros.',
      notif_reply: '{name} respondió en tu caja «{title}».',
      notif_approved: 'Tu cuenta está aprobada. Ya puedes abrir cajas, responder y decir «Me interesa».',
      notif_new: 'Nueva',
      notif_view_interested: 'Ver interesados',
      notif_view_caja: 'Ver caja',
      someone: 'Un miembro',
      t_now: 'Hace un momento', t_min: 'Hace {n} min', t_h: 'Hace {n} h', t_yesterday: 'Ayer'
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
      filter_prefix: 'Looking for:',
      empty_all: 'No posts yet. Write the first one.',
      empty_filter: 'No posts match your search.',
      replies_0: 'No replies yet', replies_1: '1 reply', replies_n: '{n} replies',
      view: 'View post', hide: 'Hide',
      closed: 'Closed',
      close_caja: 'Close post', reopen: 'Reopen',
      delete: 'Delete', delete_sure: 'Confirm: delete',
      reply_label: 'Your reply',
      reply_hint: 'All members see replies, with your name and profile type.',
      reply_btn: 'Reply',
      err_reply: 'Use at least 2 characters (1,000 at most).',
      closed_note: 'This post is closed and no longer accepts replies.',
      no_links: 'No social profiles added yet.',
      view_profile: "View {name}'s profile",
      can_help: 'Can you help {name}?',
      can_help_text: '{name} will read your message. Your profiles and links are shared only if you both agree to connect.',
      interest_btn: "I'm interested",
      interest_lead: "Tell {name} how you can help. They can't see your profile yet: this message is how you introduce yourself.",
      interest_label: 'Your message',
      interest_lock: 'Your profile and links stay hidden. They are shared only if {name} connects with you.',
      err_interest: 'Use at least 20 characters (500 at most).',
      send: 'Send',
      interest_sent: 'Interest sent · {date}',
      interest_sent_text: '{name} has your message. If they connect with you, you will get a notification here and you will both see each other’s profiles.',
      show_my_msg: 'Show my message', hide_my_msg: 'Hide my message',
      withdraw: 'Withdraw interest', withdraw_sure: 'Confirm: withdraw',
      connected_pill: 'Connected · {date}',
      connected_text: 'You can now see each other’s profiles and how to get in touch.',
      interested_title: 'Interested',
      interested_hint: 'Only you see this list. If you don’t connect with someone, they are not told.',
      interested_empty: "Nobody has said “I'm interested” yet.",
      connect: 'Connect',
      connect_q: 'Connect with {name}?',
      connect_text: '{name} will see your full profile and how to contact you, and you will see theirs. {name} will get a notification.',
      connect_shared_label: 'What is shared',
      connect_shared: 'One line about you, country, description, LinkedIn, Instagram, TikTok, website and “How to reach me”. Your sign-in email is never shared.',
      connected_done: 'Connected. {name} can now see your profile and you can see theirs.',
      foot_interested_1: '1 interested', foot_interested_n: '{n} interested',
      foot_interest_sent: 'Interest sent', foot_connected: 'Connected',
      locked_text: 'Their profile and links become visible once you both agree to connect.',
      locked_hint: "To connect, press “I'm interested” on one of their posts.",
      contact_label: 'How to reach me',
      no_contact: 'They have not said how they prefer to be contacted yet.',
      this_is_you: 'This is how the people you connect with see you.',
      edit_profile: 'Edit my profile',
      privacy_note: 'All members see your name and profile type. Everything else, including how to reach you, is visible only to the people you connect with.',
      contact_field: 'How to reach me',
      contact_hint: 'For example an email or your LinkedIn. Only the people you connect with see it; your sign-in email is never shared.',
      my_data: 'Your details',
      connections_title: 'My connections',
      connections_empty: "You have no connections yet. They start in the posts: say “I'm interested” on someone else's, or connect with someone interested in yours.",
      pending_interests_1: 'You have 1 interest waiting for an answer.',
      pending_interests_n: 'You have {n} interests waiting for an answer.',
      view_profile_btn: 'View profile',
      bell: 'Notifications', bell_1: 'Notifications: 1 new', bell_n: 'Notifications: {n} new',
      notif_title: 'Notifications',
      notif_empty: 'You have no notifications yet.',
      notif_interest: '{name}, {role}, wants to help with your post “{title}”.',
      notif_connected: '{name} connected with you through the post “{title}”. You can now see each other’s profiles and how to get in touch.',
      notif_reply: '{name} replied to your post “{title}”.',
      notif_approved: "Your account is approved. You can now post, reply and say “I'm interested”.",
      notif_new: 'New',
      notif_view_interested: 'See who is interested',
      notif_view_caja: 'View post',
      someone: 'A member',
      t_now: 'Just now', t_min: '{n} min ago', t_h: '{n} h ago', t_yesterday: 'Yesterday'
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
  function ago(iso) {
    var s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (!(s >= 0)) return fmtDate(iso);
    if (s < 60) return t('t_now');
    if (s < 3600) return t('t_min', { n: Math.floor(s / 60) });
    if (s < 86400) return t('t_h', { n: Math.floor(s / 3600) });
    if (s < 172800) return t('t_yesterday');
    return fmtDate(iso);
  }
  // Fixed icon markup (no user data), drawn with stroke so it follows the text colour.
  var ICONS = {
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
  };
  function icon(name) { var s = document.createElement('span'); s.className = 'icon'; s.innerHTML = ICONS[name]; return s; }
  function lockbox(text) { return h('div', { class: 'lockbox' }, [icon('lock'), h('p', { text: text })]); }
  function armed(btn, label, sure, action) {
    return function () {
      if (btn.dataset.armed !== '1') { btn.dataset.armed = '1'; btn.textContent = sure; setTimeout(function () { btn.dataset.armed = ''; btn.textContent = label; }, 5000); return; }
      action();
    };
  }
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
      if (session && PAGE !== 'account') setupBell();
      if (PAGE === 'account') accountPage(session);
      else if (PAGE === 'profile') profilePage(session);
      else if (PAGE === 'community') communityPage(session);
      else if (PAGE === 'notifications') notificationsPage(session);
    }).catch(function () { mount(notice(t('error_generic'), 'error')); });
  }

  // Your own full profile. Other members' profiles are private (see get_profile).
  function loadMyProfile(user) {
    return sb.rpc('get_profile', { p_id: user.id }).maybeSingle();
  }

  // ---------------------------------------------------------------- bell
  var bellEl = null;
  function setupBell() {
    var nav = document.querySelector('.site-header .nav');
    if (!nav || bellEl) return;
    bellEl = h('a', { class: 'bell', href: PATHS.notifications, 'aria-label': t('bell') }, [icon('bell'), h('span', { class: 'bell-count', 'aria-hidden': 'true', hidden: true })]);
    if (PAGE === 'notifications') bellEl.setAttribute('aria-current', 'page');
    nav.insertBefore(bellEl, nav.querySelector('.lang'));
    refreshBell();
    setInterval(function () { if (!document.hidden) refreshBell(); }, 60000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) refreshBell(); });
  }
  function setBell(n) {
    if (!bellEl) return;
    var c = bellEl.querySelector('.bell-count');
    c.hidden = !n; c.textContent = n > 9 ? '9+' : String(n);
    bellEl.setAttribute('aria-label', !n ? t('bell') : n === 1 ? t('bell_1') : t('bell_n', { n: n }));
  }
  function refreshBell() {
    sb.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null).then(function (res) {
      if (!res.error) setBell(res.count || 0);
    });
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
    var contact = field({ label: t('contact_field'), name: 'contact', textarea: true, rows: 3, max: 300, optional: true, hint: t('contact_hint'), value: p.contact_info });
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
        contact_info: contact.input.value.trim() || null,
        linkedin_url: li.input.value || null,
        instagram_url: ig.input.value || null,
        tiktok_url: tk.input.value || null,
        website_url: web.input.value || null
      };
      if (pending) update.role = roleSel.value;
      busy(btn, true);
      sb.from('profiles').update(update).eq('id', user.id).then(function (res) {
        busy(btn, false);
        if (res.error) { msg.replaceChildren(notice(t('error_generic'), 'error')); return; }
        msg.replaceChildren(notice(t('saved'), 'ok'));
      });
    } }, [name.wrap, roleWrap, headline.wrap, bio.wrap, country.wrap, contact.wrap, li.wrap, ig.wrap, tk.wrap, web.wrap, email.wrap, msg, h('div', { class: 'actions' }, [btn])]);

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
      p.status === 'approved' ? connectionsSection(user) : null,
      h('h2', { class: 'section-title', text: t('my_data') }),
      h('p', { class: 'small muted', style: 'margin:10px 0 0', text: t('privacy_note') }),
      form,
      danger
    );
  }

  function connectionsSection(user) {
    var list = h('div', null, [h('p', { class: 'small muted', style: 'margin-top:12px', text: t('loading') })]);
    Promise.all([
      sb.from('connections')
        .select('id,owner_id,helper_id,request_title,created_at,owner:profiles!connections_owner_id_fkey(id,full_name,role),helper:profiles!connections_helper_id_fkey(id,full_name,role)')
        .order('created_at', { ascending: false }),
      sb.from('interests').select('id', { count: 'exact', head: true }).eq('helper_id', user.id).is('connected_at', null)
    ]).then(function (r) {
      var res = r[0], pend = r[1];
      if (res.error) { list.replaceChildren(notice(t('error_generic'), 'error')); return; }
      var rows = (res.data || []).map(function (c) {
        var other = c.owner_id === user.id ? c.helper : c.owner;
        if (!other) return null;
        return h('li', { class: 'conn' }, [
          h('div', { class: 'who' }, [
            h('div', null, [h('b', { text: other.full_name }), h('span', { class: 'muted', text: ' · ' + roleLabel(other.role) })]),
            h('div', { class: 'small muted', text: c.request_title + ' · ' + fmtDate(c.created_at) })
          ]),
          h('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: t('view_profile_btn'), 'aria-label': t('view_profile', { name: other.full_name }), onclick: function () { openProfile(other.id); } })
        ]);
      }).filter(Boolean);
      var n = pend && !pend.error ? (pend.count || 0) : 0;
      put(list, [
        rows.length ? h('ul', { class: 'conns' }, rows) : h('p', { class: 'small muted', style: 'margin-top:12px', text: t('connections_empty') }),
        n ? h('p', { class: 'small muted', style: 'margin-top:12px', text: n === 1 ? t('pending_interests_1') : t('pending_interests_n', { n: n }) }) : null
      ]);
    }).catch(function () { list.replaceChildren(notice(t('error_generic'), 'error')); });
    return h('section', { 'aria-labelledby': 'conn-title' }, [h('h2', { id: 'conn-title', class: 'section-title', text: t('connections_title') }), list]);
  }

  function signOut() { sb.auth.signOut().finally(function () { window.location.href = PATHS.community; }); }

  // ================================================================ COMMUNITY
  var state = { me: null, user: null, cajas: [], filter: 'all', q: '', open: {}, replies: {}, interests: {} };

  function communityPage(session) {
    if (!session) return; // the page already shows the public intro
    ROOT.setAttribute('aria-busy', 'true');
    ROOT.replaceChildren(h('p', { class: 'lead', text: t('loading') }));
    state.user = session.user;
    var wanted = new URLSearchParams(window.location.search).get('caja');
    if (wanted && !/^[0-9a-f-]{36}$/i.test(wanted)) wanted = null;
    loadMyProfile(session.user).then(function (res) {
      if (res.error || !res.data) { mount(h('h1', { class: 'page-title', text: t('comm_title') }), notice(t('error_generic'), 'error')); return; }
      state.me = res.data;
      if (res.data.status === 'approved') renderBoard(wanted);
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
  function renderBoard(wanted) {
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
    mount(
      userbar(),
      h('div', { class: 'head-row' }, [h('h1', { class: 'page-title', text: t('comm_title') }), newBtn]),
      formPanel,
      h('div', { class: 'toolbar' }, [h('label', { class: 'sr', for: 'q', text: t('search_label') }), search,
        h('div', { class: 'filter-row' }, [h('span', { class: 'filter-label', 'aria-hidden': 'true', text: t('filter_prefix') }), chips])]),
      countEl,
      listEl
    );
    loadCajas(wanted, true);
  }

  // Each caja carries the interests the reader may see: all of them for its
  // author, only their own for anyone else (the database decides).
  function loadCajas(openId, scroll) {
    return sb.from('requests')
      .select('id,title,body,seeking,is_open,created_at,author_id,author:profiles!requests_author_id_fkey(id,full_name,role),replies(count),interests(id,helper_id,connected_at)')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(function (res) {
        if (res.error) { listEl.replaceChildren(h('li', null, [notice(t('error_generic'), 'error')])); return; }
        state.cajas = res.data || [];
        var known = openId && state.cajas.some(function (c) { return c.id === openId; });
        if (known) state.open[openId] = true;
        renderList();
        if (known) {
          loadReplies(openId);
          loadInterests(openId);
          if (scroll) { var el = document.getElementById('c-' + openId); if (el) el.scrollIntoView({ block: 'start' }); }
        }
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
    var li = h('li', { class: 'caja', id: 'c-' + c.id });
    var toggle = function () { state.open[c.id] = !open; renderList(); if (!open) { loadReplies(c.id); loadInterests(c.id); } };
    var ints = c.interests || [];
    var myInt = mine ? null : ints.filter(function (x) { return x.helper_id === state.user.id; })[0];
    var kids = [
      h('div', { class: 'caja-top' }, [h('span', { class: 'badge', text: t('seek_' + c.seeking) }), c.is_open ? null : h('span', { class: 'badge closed', text: t('closed') })]),
      h('h2', null, [h('button', { type: 'button', 'aria-expanded': String(open), 'aria-controls': detailId, text: c.title, onclick: toggle })]),
      h('div', { class: 'meta-line' }, [authorButton(c.author), h('span', { 'aria-hidden': 'true', text: '·' }), h('span', { text: roleLabel(c.author && c.author.role) }), h('span', { 'aria-hidden': 'true', text: '·' }), h('span', { text: fmtDate(c.created_at) })])
    ];
    if (!open) {
      kids.push(h('p', { class: 'excerpt', text: c.body.length > 220 ? c.body.slice(0, 217).trimEnd() + '…' : c.body }));
    } else {
      kids.push(h('div', { id: detailId }, [
        h('p', { class: 'fulltext', text: c.body }),
        h('div', { class: 'interest', 'data-interest': c.id }),
        h('div', { class: 'thread', 'data-thread': c.id }, [h('p', { class: 'small muted', style: 'margin-top:20px', text: t('loading') })])
      ]));
    }
    var intNote = null;
    if (mine && ints.length) intNote = h('span', { class: 'int-note', text: ints.length === 1 ? t('foot_interested_1') : t('foot_interested_n', { n: ints.length }) });
    else if (myInt) intNote = h('span', { class: 'int-note', text: myInt.connected_at ? t('foot_connected') : t('foot_interest_sent') });
    var foot = h('div', { class: 'caja-foot' }, [
      h('span', { text: replyCount(c) }),
      intNote,
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
    li.replaceChildren.apply(li, kids.filter(Boolean));
    if (open && state.replies[c.id]) renderThread(c, li.querySelector('[data-thread]'));
    if (open && state.interests[c.id]) renderInterests(c, li.querySelector('[data-interest]'));
    return li;
  }

  // ---------------------------------------------------------------- interests
  function loadInterests(id) {
    return sb.from('interests')
      .select('id,request_id,helper_id,message,connected_at,created_at,helper:profiles!interests_helper_id_fkey(id,full_name,role)')
      .eq('request_id', id)
      .order('created_at', { ascending: true })
      .then(function (res) {
        state.interests[id] = res.error ? null : (res.data || []);
        var box = listEl && listEl.querySelector('[data-interest="' + id + '"]');
        var c = state.cajas.filter(function (x) { return x.id === id; })[0];
        if (box && c) {
          if (res.error) box.replaceChildren(notice(t('error_generic'), 'error'));
          else renderInterests(c, box);
        }
      });
  }

  function cajaChanged(id) {
    delete state.interests[id];
    loadCajas(id);
  }

  function renderInterests(c, box) {
    var list = state.interests[c.id] || [];
    if (c.author_id === state.user.id) return renderInterested(c, box, list);
    var mine = list.filter(function (x) { return x.helper_id === state.user.id; })[0];
    var who = c.author ? firstName(c.author.full_name) : t('someone');
    var panel = h('section', { class: 'int-panel' });
    if (mine && mine.connected_at) {
      put(panel, [
        h('span', { class: 'status-pill connected', text: t('connected_pill', { date: fmtDate(mine.connected_at) }) }),
        h('p', { text: t('connected_text') }),
        c.author ? h('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: t('view_profile', { name: who }), onclick: function () { openProfile(c.author.id); } }) : null
      ]);
    } else if (mine) {
      var msgEl = h('p', { class: 'my-msg', hidden: true, text: mine.message });
      var toggleMsg = h('button', { class: 'linkish', type: 'button', text: t('show_my_msg'), 'aria-expanded': 'false', onclick: function () {
        msgEl.hidden = !msgEl.hidden;
        toggleMsg.textContent = msgEl.hidden ? t('show_my_msg') : t('hide_my_msg');
        toggleMsg.setAttribute('aria-expanded', String(!msgEl.hidden));
      } });
      var wd = h('button', { class: 'linkish', type: 'button', text: t('withdraw') });
      wd.addEventListener('click', armed(wd, t('withdraw'), t('withdraw_sure'), function () {
        busy(wd, true);
        sb.from('interests').delete().eq('id', mine.id).then(function (res) {
          if (res.error) { busy(wd, false); panel.appendChild(notice(t('error_generic'), 'error')); return; }
          cajaChanged(c.id);
        });
      }));
      put(panel, [
        h('span', { class: 'status-pill', text: t('interest_sent', { date: fmtDate(mine.created_at) }) }),
        h('p', { text: t('interest_sent_text', { name: who }) }),
        msgEl,
        h('div', { class: 'int-links' }, [toggleMsg, wd])
      ]);
    } else if (c.is_open && c.author) {
      var start = h('button', { class: 'btn btn-primary', type: 'button', text: t('interest_btn'), onclick: function () { interestForm(c, panel, who); } });
      put(panel, [h('h3', { text: t('can_help', { name: who }) }), h('p', { text: t('can_help_text', { name: who }) }), start]);
    } else {
      box.replaceChildren();
      return;
    }
    box.replaceChildren(panel);
  }

  function interestForm(c, panel, who) {
    var f = field({ label: t('interest_label'), name: 'interest', textarea: true, rows: 5, max: 500, hint: t('interest_lead', { name: who }) });
    var msg = h('div');
    var btn = h('button', { class: 'btn btn-primary', type: 'submit', text: t('send') });
    var form = h('form', { class: 'form', style: 'margin-top:0', novalidate: true, onsubmit: function (e) {
      e.preventDefault();
      var v = f.input.value.trim();
      var bad = v.length < 20 || v.length > 500;
      f.error(bad ? t('err_interest') : '');
      if (bad) return f.input.focus();
      busy(btn, true);
      sb.from('interests').insert({ request_id: c.id, message: v }).then(function (res) {
        if (res.error) { busy(btn, false); msg.replaceChildren(notice(t('error_generic'), 'error')); return; }
        cajaChanged(c.id);
      });
    } }, [
      f.wrap,
      lockbox(t('interest_lock', { name: who })),
      msg,
      h('div', { class: 'actions', style: 'margin-top:4px' }, [btn, h('button', { class: 'btn btn-ghost', type: 'button', text: t('cancel'), onclick: function () { renderInterests(c, panel.parentNode); } })])
    ]);
    put(panel, [h('h3', { text: t('interest_btn') }), form]);
    f.input.focus();
  }

  function renderInterested(c, box, list) {
    var items = list.map(function (it) {
      var p = it.helper;
      var name = p ? p.full_name : t('someone');
      var tail;
      if (it.connected_at) {
        tail = h('div', { class: 'int-links' }, [
          h('span', { class: 'status-pill connected', text: t('connected_pill', { date: fmtDate(it.connected_at) }) }),
          p ? h('button', { class: 'linkish', type: 'button', text: t('view_profile_btn'), 'aria-label': t('view_profile', { name: name }), onclick: function () { openProfile(p.id); } }) : null
        ]);
      } else {
        tail = h('button', { class: 'btn btn-primary btn-sm', type: 'button', text: t('connect'), 'aria-label': t('connect_q', { name: name }), onclick: function () { confirmConnect(c, it, name); } });
      }
      return h('li', { class: 'int-card' }, [
        h('div', { class: 'meta-line' }, [authorButton(p), h('span', { 'aria-hidden': 'true', text: '·' }), h('span', { text: roleLabel(p && p.role) }), h('span', { 'aria-hidden': 'true', text: '·' }), h('span', { text: fmtDate(it.created_at) })]),
        h('p', { text: it.message }),
        tail
      ]);
    });
    box.replaceChildren(h('section', { class: 'int-section', 'aria-labelledby': 'int-' + c.id }, [
      h('div', { class: 'int-head' }, [h('h3', { id: 'int-' + c.id, text: t('interested_title') }), list.length ? h('span', { class: 'int-count', text: String(list.length) }) : null]),
      h('p', { class: 'small muted', style: 'margin:6px 0 0', text: t('interested_hint') }),
      items.length ? h('ul', { class: 'int-list' }, items) : h('p', { class: 'small muted', style: 'margin:12px 0 0', text: t('interested_empty') })
    ]));
  }

  function confirmConnect(c, it, name) {
    var d = ensureDialog();
    var who = firstName(name);
    var msg = h('div');
    var yes = h('button', { class: 'btn btn-primary', type: 'button', text: t('connect'), onclick: function () {
      busy(yes, true);
      sb.rpc('connect_interest', { p_interest: it.id }).then(function (res) {
        if (res.error) { busy(yes, false); msg.replaceChildren(notice(t('error_generic'), 'error')); return; }
        d.close();
        cajaChanged(c.id);
      });
    } });
    d.replaceChildren(
      h('button', { class: 'dialog-close', type: 'button', 'aria-label': t('close'), text: '×', onclick: function () { d.close(); } }),
      h('h2', { id: 'pd-name', text: t('connect_q', { name: who }) }),
      h('p', { class: 'bio', text: t('connect_text', { name: who }) }),
      h('div', { class: 'shared-box' }, [h('span', { class: 'badge', text: t('connect_shared_label') }), h('p', { text: t('connect_shared') })]),
      msg,
      h('div', { class: 'actions', style: 'margin-top:20px' }, [yes, h('button', { class: 'btn btn-ghost', type: 'button', text: t('cancel'), onclick: function () { d.close(); } })])
    );
    if (!d.open) d.showModal();
    yes.focus();
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

  // One dialog per page, used for profiles and for confirming a connection.
  function ensureDialog() {
    if (dialog && dialog.isConnected) return dialog;
    dialog = h('dialog', { class: 'profile-dialog', 'aria-labelledby': 'pd-name' });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
    document.body.appendChild(dialog);
    return dialog;
  }

  // Full profile for yourself and your connections; name and type only for
  // everyone else (the database returns nothing more).
  function openProfile(id) {
    var d = ensureDialog();
    var close = h('button', { class: 'dialog-close', type: 'button', 'aria-label': t('close'), text: '×', onclick: function () { d.close(); } });
    d.replaceChildren(close, h('p', { class: 'small muted', text: t('loading') }));
    if (!d.open) d.showModal();
    Promise.all([
      sb.rpc('get_profile', { p_id: id }).maybeSingle(),
      sb.from('profiles').select('id,full_name,role').eq('id', id).maybeSingle()
    ]).then(function (r) {
      var full = r[0] && !r[0].error ? r[0].data : null;
      var basic = r[1] && !r[1].error ? r[1].data : null;
      if (!full && !basic) { d.replaceChildren(close, notice(t('error_generic'), 'error')); return; }
      if (!full) {
        put(d, [
          close,
          h('span', { class: 'badge', text: roleLabel(basic.role) }),
          h('h2', { id: 'pd-name', text: basic.full_name }),
          h('div', { class: 'lockbox', style: 'margin-top:20px' }, [icon('lock'), h('div', null, [h('p', { text: t('locked_text') }), h('p', { class: 'muted', text: t('locked_hint') })])])
        ]);
        close.focus();
        return;
      }
      var p = full;
      var links = [['LinkedIn', p.linkedin_url], [t('instagram'), p.instagram_url], [t('tiktok'), p.tiktok_url], [t('website'), p.website_url]]
        .filter(function (l) { return l[1] && /^https:\/\//i.test(l[1]); })
        .map(function (l) { return h('a', { href: l[1], target: '_blank', rel: 'noopener noreferrer nofollow', text: l[0] }); });
      put(d, [
        close,
        h('div', { class: 'pd-top' }, [
          h('span', { class: 'badge', text: roleLabel(p.role) }),
          p.connected_at && !p.is_self ? h('span', { class: 'status-pill connected', text: t('connected_pill', { date: fmtDate(p.connected_at) }) }) : null
        ]),
        h('h2', { id: 'pd-name', text: p.full_name }),
        p.is_self ? h('p', { class: 'small muted', style: 'margin:8px 0 0', text: t('this_is_you') }) : null,
        p.headline ? h('p', { class: 'headline', text: p.headline }) : null,
        p.country ? h('p', { class: 'small muted', style: 'margin:6px 0 0', text: p.country }) : null,
        p.bio ? h('p', { class: 'bio', text: p.bio }) : null,
        h('div', { class: 'shared-box', style: 'margin-top:20px' }, [
          h('span', { class: 'badge', text: t('contact_label') }),
          h('p', { class: p.contact_info ? 'contact' : 'muted', text: p.contact_info || t('no_contact') })
        ]),
        links.length ? h('div', { class: 'socials' }, links) : h('p', { class: 'small muted', style: 'margin-top:20px', text: t('no_links') }),
        p.is_self ? h('p', { class: 'small', style: 'margin-top:16px' }, [h('a', { class: 'linkish', href: PATHS.profile, text: t('edit_profile') })]) : null
      ]);
      close.focus();
    }).catch(function () { d.replaceChildren(close, notice(t('error_generic'), 'error')); });
  }

  // ================================================================ NOTIFICATIONS
  function notificationsPage(session) {
    if (!session) { window.location.replace(PATHS.account); return; }
    var user = session.user;
    sb.from('notifications')
      .select('id,kind,actor_id,request_id,request_title,read_at,created_at,actor:profiles!notifications_actor_id_fkey(id,full_name,role)')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(function (res) {
        if (res.error) { mount(h('h1', { class: 'page-title', text: t('notif_title') }), notice(t('error_generic'), 'error')); return; }
        var rows = res.data || [];
        mount(
          h('div', { class: 'userbar' }, [
            h('span', { class: 'hello' }),
            h('a', { class: 'linkish', href: PATHS.community, text: t('go_community') }),
            h('a', { class: 'linkish', href: PATHS.profile, text: t('my_profile') }),
            h('button', { class: 'linkish', type: 'button', text: t('signout'), onclick: signOut })
          ]),
          h('h1', { class: 'page-title', text: t('notif_title') }),
          rows.length ? h('ul', { class: 'notifs' }, rows.map(notifItem)) : h('p', { class: 'lead', text: t('notif_empty') })
        );
        if (rows.some(function (n) { return !n.read_at; })) {
          sb.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null).then(function (r) {
            if (!r.error) setBell(0);
          });
        }
      });
  }

  function notifItem(n) {
    var actor = n.actor;
    var name = actor ? actor.full_name : t('someone');
    var title = n.request_title || '';
    var cajaLink = n.request_id ? PATHS.community + '?caja=' + encodeURIComponent(n.request_id) : PATHS.community;
    var key, acts = [];
    if (n.kind === 'interest') {
      key = 'notif_interest';
      acts.push(h('a', { class: 'linkish', href: cajaLink, text: t('notif_view_interested') }));
    } else if (n.kind === 'connected') {
      key = 'notif_connected';
      if (actor) acts.push(h('button', { class: 'btn btn-primary btn-sm', type: 'button', text: t('view_profile', { name: firstName(name) }), onclick: function () { openProfile(actor.id); } }));
    } else if (n.kind === 'reply') {
      key = 'notif_reply';
      acts.push(h('a', { class: 'linkish', href: cajaLink, text: t('notif_view_caja') }));
    } else {
      key = 'notif_approved';
      acts.push(h('a', { class: 'linkish', href: PATHS.community, text: t('go_community') }));
    }
    // The member's name in bold: fill the other values, then split on {name}.
    var parts = t(key, { role: roleLabel(actor && actor.role).toLowerCase(), title: title }).split('{name}');
    var text = [];
    parts.forEach(function (part, i) { if (i) text.push(h('b', { text: name })); if (part) text.push(part); });
    var unread = !n.read_at;
    return h('li', { class: 'notif' + (unread ? ' unread' : '') }, [
      h('p', { class: 'text' }, text),
      h('p', { class: 'when' }, [ago(n.created_at), unread ? ' · ' + t('notif_new') : '']),
      h('div', { class: 'acts' }, acts)
    ]);
  }

  start();
})();
