/* Phone field: country picker + number with a visible +code prefix.
   - United States (+1) is selected by default in the markup.
   - Accepts a pasted full number such as "+57 300 123 4567" and splits it for you. */
(function () {
  'use strict';

  function init(group) {
    var sel = group.querySelector('select');
    var inp = group.querySelector('input[type="tel"]');
    var pre = group.querySelector('.phone-prefix');
    if (!sel || !inp || !pre) { return; }

    function showPrefix() { pre.textContent = sel.value || '+'; }

    showPrefix();

    /* Longest-match dial code lookup for pasted international numbers */
    var codes = {};
    [].slice.call(sel.options).forEach(function (o) {
      if (o.value && !codes[o.value.slice(1)]) { codes[o.value.slice(1)] = o; }
    });

    function splitPasted() {
      var raw = inp.value.trim();
      if (raw.charAt(0) !== '+') { return; }
      var digits = raw.replace(/\D/g, '');
      for (var len = 5; len >= 1; len--) {
        var c = digits.slice(0, len);
        if (codes[c] && digits.length > len) {
          codes[c].selected = true;
          inp.value = digits.slice(len);
          showPrefix();
          return;
        }
      }
    }

    sel.addEventListener('change', showPrefix);
    inp.addEventListener('input', splitPasted);
    inp.addEventListener('paste', function () { setTimeout(splitPasted, 0); });
  }

  [].slice.call(document.querySelectorAll('.phone-group')).forEach(init);
})();
