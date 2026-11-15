(function () {
  'use strict';

  var CFG = window.LITT_CONFIG || {};
  var LOCAL = CFG.services === 'local';
  var V = window.LittValidate;
  function $(id) { return document.getElementById(id); }

  /* ---------- Age gate (pages that include #age-gate) ---------- */
  var dlg = $('age-gate');
  if (dlg && typeof dlg.showModal === 'function') {
    var ok = false;
    try { ok = sessionStorage.getItem('litt-age-ok') === '1'; } catch (e) {}
    if (!ok) {
      var yes = $('age-yes'), no = $('age-no'), denied = $('age-denied');
      dlg.addEventListener('cancel', function (e) { e.preventDefault(); });
      yes.addEventListener('click', function () {
        try { sessionStorage.setItem('litt-age-ok', '1'); } catch (e) {}
        dlg.close();
      });
      no.addEventListener('click', function () { denied.hidden = false; });
      dlg.showModal();
      yes.focus();
    }
  }

  /* ---------- Forms ---------- */
  if (!V) { return; }

  function mailKeyReady() {
    var k = CFG.web3formsKey;
    return !!k && String(k).indexOf('YOUR_') !== 0;
  }

  /* Send a message to the site owner's inbox through Web3Forms */
  function sendMail(payload) {
    if (LOCAL) {
      return new Promise(function (resolve) { setTimeout(function () { resolve({ ok: true }); }, 1200); });
    }
    if (!mailKeyReady()) { return Promise.resolve({ ok: false, reason: 'config' }); }
    payload.access_key = CFG.web3formsKey;
    return fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: !!(r.ok && j && j.success) }; }); })
      .catch(function () { return { ok: false, reason: 'network' }; });
  }

  var LANG = String(document.documentElement.lang || 'en').slice(0, 2) === 'es' ? 'es' : 'en';
  var ES = {
    "Sorry, we could not send your message. Please try again in a few minutes, or reach us on X or Facebook.": "Lo sentimos, no pudimos enviar su mensaje. Inténtelo de nuevo en unos minutos o escríbanos en X o Facebook.",
    "This form is not connected to an inbox yet. The site owner needs to add a Web3Forms access key (see README). Your message was not sent.": "Este formulario aún no está conectado a un buzón. El administrador del sitio debe agregar una clave de acceso de Web3Forms. Su mensaje no se envió.",
    "Sending...": "Enviando...",
    "Thank you. Your delivery request has been received. We will confirm your membership and reply by email.": "Gracias. Recibimos su solicitud de entrega. Confirmaremos su membresía y responderemos por correo.",
    "Thank you. Your message has been sent and we will reply by email.": "Gracias. Su mensaje fue enviado y responderemos por correo.",
    "Not available yet": "Aún no disponible",
    "Copied.": "Copiado.",
    "Could not copy. Select the address above and copy it.": "No se pudo copiar. Seleccione la dirección de arriba y cópiela.",
    "Bank transfer (ACH)": "Transferencia bancaria (ACH)",
    "Zelle is not available yet. Please choose bank transfer, or contact us.": "Zelle aún no está disponible. Elija transferencia bancaria o contáctenos.",
    "Submitting...": "Enviando...",
    "Bank payments are not connected yet. The site owner needs to add a payment link (see README).": "Los pagos bancarios aún no están conectados. El administrador del sitio debe agregar un enlace de pago.",
    "Opening secure bank authorization...": "Abriendo la autorización bancaria segura..."
  };
  function t(s) { return LANG === 'es' && ES[s] ? ES[s] : s; }

  var NOT_CONNECTED = t('This form is not connected to an inbox yet. The site owner needs to add a Web3Forms access key (see README). Your message was not sent.');
  var FAILED = t('Sorry, we could not send your message. Please try again in a few minutes, or reach us on X or Facebook.');

  function showStatus(el, kind, text) {
    el.className = 'status ' + kind;
    el.textContent = text;
    el.hidden = false;
    el.setAttribute('tabindex', '-1');
    el.focus();
  }

  /* Error display shared by every form */
  function Errors(p, ids, inline) {
    var summary = inline ? null : $(p + 'error-summary');
    var list = inline ? null : $(p + 'error-summary-list');
    return {
      clear: function () {
        if (summary) { summary.hidden = true; list.innerHTML = ''; }
        ids.forEach(function (id) {
          var el = $(p + id), msg = $(p + 'err-' + id);
          if (el) { el.removeAttribute('aria-invalid'); }
          if (msg) { msg.hidden = true; msg.textContent = ''; }
        });
      },
      show: function (errors) {
        var keys = ids.filter(function (k) { return errors[k]; });
        keys.forEach(function (k) {
          var el = $(p + k), msg = $(p + 'err-' + k);
          if (el) { el.setAttribute('aria-invalid', 'true'); }
          if (msg) { msg.textContent = errors[k]; msg.hidden = false; }
          if (inline) { return; }
          var li = document.createElement('li');
          var a = document.createElement('a');
          a.href = '#' + p + k;
          a.textContent = errors[k];
          a.addEventListener('click', function (e) { e.preventDefault(); if (el) { el.focus(); } });
          li.appendChild(a);
          list.appendChild(li);
        });
        if (keys.length && inline) { var f = $(p + keys[0]); if (f) { f.focus(); } }
        else if (keys.length) { summary.hidden = false; summary.focus(); }
        return keys.length > 0;
      },
      watch: function () {
        ids.forEach(function (id) {
          var el = $(p + id);
          if (!el) { return; }
          var evt = (el.tagName === 'SELECT' || el.type === 'checkbox') ? 'change' : 'input';
          el.addEventListener(evt, function () {
            var msg = $(p + 'err-' + id);
            el.removeAttribute('aria-invalid');
            if (msg) { msg.hidden = true; msg.textContent = ''; }
          });
        });
      }
    };
  }

  function readDetails(form, p) {
    function val(n) { return form.elements[n] ? form.elements[n].value : ''; }
    function chk(n) { return form.elements[n] ? form.elements[n].checked : false; }
    return {
      name: val('name'), email: val('email'), organization: val('organization'),
      interest: val('interest'), region: val('region'), area: val('area'), message: val('message'),
      country_code: val('country_code'), phone: val('phone'),
      age: chk('age'), consent: chk('consent'), botcheck: chk('botcheck')
    };
  }

  /* --- Contact form and delivery request form (send a message) --- */
  [].slice.call(document.querySelectorAll('form[data-form="contact"], form[data-form="delivery"]')).forEach(function (form) {
    var kind = form.getAttribute('data-form');
    var p = form.getAttribute('data-prefix');
    var ids = ['name', 'email', 'interest', 'area', 'country_code', 'phone', 'message', 'consent'];
    var err = Errors(p, ids);
    var status = $(p + 'form-status');
    var btn = $(p + 'submit-btn');
    err.watch();

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      status.hidden = true;
      err.clear();
      var v = readDetails(form, p);
      if (err.show(V.validate(v, kind, LANG))) { return; }

      var payload = {
        subject: kind === 'delivery' ? 'Member delivery request' : 'Litt California enquiry: ' + v.interest,
        from_name: 'Litt California website', language: LANG === 'es' ? 'Spanish' : 'English',
        name: v.name.trim(), email: v.email.trim(),
        phone: V.fullPhone(v.country_code, v.phone),
        message: v.message.trim(), botcheck: v.botcheck
      };
      if (kind === 'contact') { payload.organization = v.organization.trim(); payload.service_interest = v.interest; payload.region = v.region; }
      else { payload.delivery_area = v.area; }

      var label = btn.textContent;
      btn.disabled = true; btn.textContent = t('Sending...');
      sendMail(payload).then(function (res) {
        if (res.ok) {
          form.reset();
          [].slice.call(form.querySelectorAll('.phone-group select')).forEach(function (s) { s.dispatchEvent(new Event('change')); });
          showStatus(status, 'ok', kind === 'delivery'
            ? t('Thank you. Your delivery request has been received. We will confirm your membership and reply by email.')
            : t('Thank you. Your message has been sent and we will reply by email.'));
        } else {
          showStatus(status, 'bad', res.reason === 'config' ? NOT_CONNECTED : FAILED);
        }
        btn.disabled = false; btn.textContent = label;
      });
    });
  });

  /* --- Membership sign-up: details -> payment -> confirmation --- */
  var flow = $('m-flow');
  if (flow) {
    var form = $('m-form');
    var p = 'm-';
    var err = Errors(p, ['name', 'email', 'country_code', 'phone', 'area', 'age', 'consent']);
    var zerr = Errors(p, ['zname'], true);
    err.watch(); zerr.watch();

    var panels = [$('m-panel-1'), $('m-panel-2'), $('m-panel-3')];
    var steps = [$('m-st1'), $('m-st2'), $('m-st3')];
    var state = { details: null, ref: '', method: '' };

    function go(n) {
      panels.forEach(function (el, i) { el.hidden = (i !== n - 1); });
      steps.forEach(function (el, i) {
        if (i === n - 1) { el.setAttribute('aria-current', 'step'); } else { el.removeAttribute('aria-current'); }
        el.className = i < n - 1 ? 'done' : '';
      });
      var h = panels[n - 1].querySelector('h2');
      if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
      window.scrollTo(0, Math.max(0, flow.getBoundingClientRect().top + window.pageYOffset - 16));
    }

    function makeRef() {
      var abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', out = '';
      var arr = new Uint8Array(6);
      (window.crypto || window.msCrypto).getRandomValues(arr);
      for (var i = 0; i < 6; i++) { out += abc.charAt(arr[i] % abc.length); }
      return 'LITT-' + out;
    }

    var zelleReady = LOCAL || (CFG.zelleRecipient && String(CFG.zelleRecipient).indexOf('YOUR_') !== 0);
    $('m-zelle-recipient').textContent = zelleReady ? CFG.zelleRecipient : t('Not available yet');
    if (!zelleReady) { $('m-copy').hidden = true; }

    /* Step 1 -> 2 */
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      err.clear();
      var v = readDetails(form, p);
      if (err.show(V.validate(v, 'member', LANG))) { return; }
      state.details = v;
      state.ref = state.ref || makeRef();
      $('m-ref').textContent = state.ref;
      go(2);
    });

    /* Choose method */
    var radios = [].slice.call(document.querySelectorAll('input[name="method"]'));
    radios.forEach(function (r) {
      r.addEventListener('change', function () {
        state.method = r.value;
        $('m-zelle-panel').hidden = r.value !== 'zelle';
        $('m-ach-panel').hidden = r.value !== 'ach';
      });
    });

    $('m-back').addEventListener('click', function () { go(1); });

    $('m-copy').addEventListener('click', function () {
      var out = $('m-copy-status');
      var text = $('m-zelle-recipient').textContent;
      try {
        navigator.clipboard.writeText(text).then(function () { out.textContent = t('Copied.'); },
          function () { out.textContent = t('Could not copy. Select the address above and copy it.'); });
      } catch (e) { out.textContent = t('Could not copy. Select the address above and copy it.'); }
    });

    function registrationPayload(method, extra) {
      var v = state.details;
      var o = {
        subject: 'New membership request ($29/month)',
        from_name: 'Litt California website', language: LANG === 'es' ? 'Spanish' : 'English',
        name: v.name.trim(), email: v.email.trim(),
        phone: V.fullPhone(v.country_code, v.phone),
        delivery_area: v.area, membership_plan: '$29.00 per month',
        payment_method: method, payment_reference: state.ref, botcheck: v.botcheck,
        message: 'New membership request. Payment method: ' + method + '. Reference: ' + state.ref + '.'
      };
      for (var k in extra) { if (extra.hasOwnProperty(k)) { o[k] = extra[k]; } }
      return o;
    }

    function finish(method) {
      var email = state.details ? state.details.email.trim() : '';
      $('m-done-method').textContent = method === 'zelle' ? 'Zelle' : t('Bank transfer (ACH)');
      $('m-done-ref-row').hidden = method !== 'zelle';
      $('m-done-ref').textContent = state.ref;
      $('m-done-msg').textContent = method === 'zelle'
        ? (LANG === 'es'
          ? 'Confirmaremos su pago de Zelle cuando llegue y ' + (email ? 'le escribiremos a ' + email : 'le escribiremos') + ' en cuanto su membresía esté activa.'
          : 'We will confirm your Zelle payment when it arrives' + (email ? ' and email ' + email : ' and email you') + ' as soon as your membership is active.')
        : (LANG === 'es'
          ? 'Recibimos su autorización bancaria. Los pagos ACH pueden tardar unos días hábiles en acreditarse, y ' + (email ? 'le escribiremos a ' + email : 'le escribiremos') + ' cuando su membresía esté activa.'
          : 'Your bank authorization was received. ACH payments can take a few business days to clear' + (email ? ', and we will email ' + email : ', and we will email you') + ' when your membership is active.');
      go(3);
    }

    /* Zelle: "I've sent the payment" */
    $('m-zelle-done').addEventListener('click', function () {
      zerr.clear();
      if (!zelleReady) { showStatus($('m-pay-status'), 'bad', t('Zelle is not available yet. Please choose bank transfer, or contact us.')); return; }
      var zv = { zname: $('m-zname').value };
      if (zerr.show(V.validateZelle(zv, LANG))) { return; }
      var btn = $('m-zelle-done'), label = btn.textContent, st = $('m-pay-status');
      st.hidden = true;
      btn.disabled = true; btn.textContent = t('Submitting...');
      sendMail(registrationPayload('Zelle', { zelle_account_name: zv.zname.trim(), zelle_confirmation: $('m-zconf').value.trim() })).then(function (res) {
        btn.disabled = false; btn.textContent = label;
        if (res.ok) { finish('zelle'); }
        else { showStatus(st, 'bad', res.reason === 'config' ? NOT_CONNECTED : FAILED); }
      });
    });

    /* ACH: hand off to the payment provider's hosted, secure page. No bank details are entered here. */
    $('m-ach-go').addEventListener('click', function () {
      var btn = $('m-ach-go'), label = btn.textContent, st = $('m-pay-status');
      st.hidden = true;
      var hook = LOCAL ? function () { return new Promise(function (resolve) { setTimeout(resolve, 1800); }); } : null;
      var url = CFG.achPaymentUrl;
      if (!hook && (!url || String(url).indexOf('YOUR_') === 0)) {
        showStatus(st, 'bad', t('Bank payments are not connected yet. The site owner needs to add a payment link (see README).'));
        return;
      }
      btn.disabled = true; btn.textContent = t('Opening secure bank authorization...');
      sendMail(registrationPayload('ACH', {})).then(function (res) {
        if (!res.ok) {
          btn.disabled = false; btn.textContent = label;
          showStatus(st, 'bad', res.reason === 'config' ? NOT_CONNECTED : FAILED);
          return;
        }
        if (hook) {
          hook({ reference: state.ref, amount: '29.00' }).then(function () {
            btn.disabled = false; btn.textContent = label; finish('ach');
          });
        } else {
          window.location.assign(url + (url.indexOf('?') > -1 ? '&' : '?') + 'client_reference_id=' + encodeURIComponent(state.ref));
        }
      });
    });

    /* Returning from the payment provider: show the confirmation */
    try {
      if (new URLSearchParams(window.location.search).get('paid') === '1') { finish('ach'); }
    } catch (e) { /* ignore */ }
  }
})();
