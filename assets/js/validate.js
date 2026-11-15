/* Pure validation helpers (no DOM). Works in the browser and in Node tests. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.LittValidate = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var ES = {
    'Enter your full name.': 'Escriba su nombre completo.',
    'Enter your email address.': 'Escriba su correo electrónico.',
    'Enter a valid email address, like name@company.com.': 'Escriba un correo válido, como nombre@empresa.com.',
    'Choose the service you are interested in.': 'Elija el servicio que le interesa.',
    'Choose your delivery area.': 'Elija su zona de entrega.',
    'Tell us what you would like to order.': 'Cuéntenos qué le gustaría pedir.',
    'Tell us a little about what you need.': 'Cuéntenos brevemente qué necesita.',
    'Please write at least a short sentence (10 characters or more).': 'Escriba al menos una frase corta (10 caracteres o más).',
    'Enter your mobile number so we can reach you about your delivery.': 'Escriba su número de celular para poder contactarle sobre su entrega.',
    'Use only numbers, spaces, dashes or brackets in the phone number.': 'Use solo números, espacios, guiones o paréntesis en el teléfono.',
    'Enter a phone number with 4 to 14 digits.': 'Escriba un teléfono de 4 a 14 dígitos.',
    'Choose your country so we can add the right country code.': 'Elija su país para agregar el código de país correcto.',
    'Please confirm your age to continue.': 'Confirme su edad para continuar.',
    'Please agree to the membership terms to continue.': 'Acepte los términos de la membresía para continuar.',
    'Please confirm that you agree to us contacting you about this request.': 'Confirme que acepta que le contactemos sobre esta solicitud.',
    'Enter the name on your Zelle account so we can match your payment.': 'Escriba el nombre de su cuenta de Zelle para poder identificar su pago.'
  };
  function tr(lang, s) { return lang === 'es' && ES[s] ? ES[s] : s; }

  function digitsOnly(s) { return String(s || '').replace(/\D/g, ''); }
  function blank(x) { return !String(x || '').trim(); }

  /* kind: 'contact' | 'delivery' | 'member' */
  function validate(v, kind, lang) {
    var e = validateRaw(v, kind);
    for (var k in e) { if (e.hasOwnProperty(k)) { e[k] = tr(lang, e[k]); } }
    return e;
  }

  function validateRaw(v, kind) {
    var e = {};
    var phone = String(v.phone || '').trim();
    var code = String(v.country_code || '').trim();

    if (blank(v.name)) { e.name = 'Enter your full name.'; }
    if (blank(v.email)) { e.email = 'Enter your email address.'; }
    else if (!EMAIL_RE.test(String(v.email).trim())) { e.email = 'Enter a valid email address, like name@company.com.'; }

    if (kind === 'contact' && blank(v.interest)) { e.interest = 'Choose the service you are interested in.'; }
    if ((kind === 'delivery' || kind === 'member') && blank(v.area)) { e.area = 'Choose your delivery area.'; }

    if (kind === 'contact' || kind === 'delivery') {
      var message = String(v.message || '').trim();
      if (!message) { e.message = kind === 'delivery' ? 'Tell us what you would like to order.' : 'Tell us a little about what you need.'; }
      else if (message.length < 10) { e.message = 'Please write at least a short sentence (10 characters or more).'; }
    }

    var phoneRequired = kind !== 'contact';
    if (!phone) {
      if (phoneRequired) { e.phone = 'Enter your mobile number so we can reach you about your delivery.'; }
    } else {
      if (/[^0-9\s()\-.]/.test(phone)) { e.phone = 'Use only numbers, spaces, dashes or brackets in the phone number.'; }
      else if (digitsOnly(phone).length < 4 || digitsOnly(phone).length > 14) { e.phone = 'Enter a phone number with 4 to 14 digits.'; }
    }
    if ((phone || phoneRequired) && !code && !e.phone) { e.country_code = 'Choose your country so we can add the right country code.'; }

    if (kind === 'member' && !v.age) { e.age = 'Please confirm your age to continue.'; }
    if (!v.consent) {
      e.consent = kind === 'member' ? 'Please agree to the membership terms to continue.' : 'Please confirm that you agree to us contacting you about this request.';
    }
    return e;
  }

  function validateZelle(v, lang) {
    var e = {};
    if (blank(v.zname)) { e.zname = tr(lang, 'Enter the name on your Zelle account so we can match your payment.'); }
    return e;
  }

  function fullPhone(code, phone) {
    var d = digitsOnly(phone);
    if (!d) { return ''; }
    return String(code || '').trim() + ' ' + String(phone).trim();
  }

  return { validate: validate, validateZelle: validateZelle, fullPhone: fullPhone, digitsOnly: digitsOnly };
});
