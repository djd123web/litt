/* Site menu: burger on mobile and tablet, one-line menu on desktop,
   and a "Where we work" dropdown (disclosure pattern, keyboard accessible). */
(function () {
  'use strict';
  var toggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('site-nav');
  if (!toggle || !nav) { return; }
  var subs = [].slice.call(nav.querySelectorAll('.has-sub'));
  var desktop = window.matchMedia('(min-width: 70rem)');

  function setNav(open) {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function setSub(li, open) {
    li.classList.toggle('open', open);
    li.querySelector('.sub-toggle').setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function closeSubs(except) {
    subs.forEach(function (li) { if (li !== except) { setSub(li, false); } });
  }

  toggle.addEventListener('click', function () { setNav(!nav.classList.contains('open')); });

  subs.forEach(function (li) {
    li.querySelector('.sub-toggle').addEventListener('click', function () {
      var willOpen = !li.classList.contains('open');
      closeSubs(li);
      setSub(li, willOpen);
    });
    /* On desktop, close the dropdown when keyboard focus leaves it */
    li.addEventListener('focusout', function (e) {
      if (desktop.matches && e.relatedTarget && !li.contains(e.relatedTarget)) { setSub(li, false); }
    });
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.has-sub')) { closeSubs(); }
    if (!desktop.matches && nav.classList.contains('open') && e.target.closest('#site-nav a')) { setNav(false); }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') { return; }
    var openSub = subs.filter(function (li) { return li.classList.contains('open'); })[0];
    if (openSub) { setSub(openSub, false); openSub.querySelector('.sub-toggle').focus(); return; }
    if (!desktop.matches && nav.classList.contains('open')) { setNav(false); toggle.focus(); }
  });

  function reset() { setNav(false); closeSubs(); }
  if (desktop.addEventListener) { desktop.addEventListener('change', reset); } else { desktop.addListener(reset); }
})();
