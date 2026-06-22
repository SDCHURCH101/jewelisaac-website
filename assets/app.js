/* ============================================================
   JEWEL ISAAC, LLC — shared behaviour
   ============================================================ */
(function () {
  'use strict';

  /* ---- background images with graceful gradient fallback ----
     Usage: <div class="bg" data-bg="https://...jpg"></div>            */
  var FALLBACK = 'linear-gradient(135deg,#1b1f26 0%,#0f1115 60%),' +
    'repeating-linear-gradient(45deg,rgba(255,178,0,.06) 0 18px,transparent 18px 36px)';
  function setBg(el, url) {
    if (!el || !url) return;
    var im = new Image();
    im.onload = function () { el.style.backgroundImage = 'url(' + url + ')'; };
    im.onerror = function () { el.style.backgroundImage = FALLBACK; };
    im.src = url;
  }
  document.querySelectorAll('[data-bg]').forEach(function (el) {
    setBg(el, el.getAttribute('data-bg'));
  });

  /* ---- active nav link based on current file ---- */
  (function () {
    var path = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a, .mobile a').forEach(function (a) {
      var href = (a.getAttribute('href') || '').split('#')[0];
      if (href && href === path) a.classList.add('active');
    });
  })();

  /* ---- header shrink ---- */
  var header = document.getElementById('header');
  if (header) {
    addEventListener('scroll', function () {
      header.classList.toggle('shrink', scrollY > 40);
    }, { passive: true });
  }

  /* ---- mobile menu ---- */
  var mob = document.getElementById('mobile');
  var burger = document.getElementById('burger');
  var close = document.getElementById('close');
  if (burger && mob) burger.onclick = function () { mob.classList.add('open'); };
  if (close && mob) close.onclick = function () { mob.classList.remove('open'); };
  if (mob) mob.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { mob.classList.remove('open'); });
  });

  /* ---- reveal on scroll ---- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* ---- count up ---- */
  var countObs = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target, raw = el.dataset.raw, dec = +(el.dataset.dec || 0),
        to = raw ? parseFloat(raw) : +el.dataset.to, t0 = performance.now(), dur = 1500;
      (function step(t) {
        var p = Math.min((t - t0) / dur, 1), ease = 1 - Math.pow(1 - p, 3), v = to * ease;
        el.textContent = dec ? v.toFixed(dec) : Math.round(v);
        if (p < 1) requestAnimationFrame(step); else el.textContent = dec ? to.toFixed(dec) : to;
      })(t0);
      countObs.unobserve(el);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('.cnt').forEach(function (el) { countObs.observe(el); });

  /* ---- project filter ---- */
  var filter = document.querySelector('.filter');
  if (filter) {
    filter.addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      filter.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      var f = b.dataset.filter;
      document.querySelectorAll('.pgrid .card').forEach(function (c) {
        var show = f === 'all' || (c.dataset.market || '').split(' ').indexOf(f) > -1;
        c.classList.toggle('hide', !show);
      });
    });
  }

  /* ---- bid form ----
     This form runs client-side validation, then shows a success panel.
     To actually RECEIVE submissions, do ONE of:
       • Netlify: add  name="bid" method="POST" data-netlify="true"  to <form>
         and a hidden <input name="form-name" value="bid">, then remove data-demo.
       • Formspree: set the form's action to https://formspree.io/f/XXXX
         and remove data-demo so it posts normally.
       • Your CRM/endpoint: point action/method at it and remove data-demo.   */
  var form = document.getElementById('bidForm');
  if (form) {
    var fields = form.querySelectorAll('[required]');
    function validateField(el) {
      var wrap = el.closest('.field'), ok = true;
      if (el.type === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
      else ok = el.value.trim().length > 0;
      if (wrap) wrap.classList.toggle('bad', !ok);
      return ok;
    }
    fields.forEach(function (el) {
      el.addEventListener('blur', function () { validateField(el); });
      el.addEventListener('input', function () {
        var w = el.closest('.field'); if (w && w.classList.contains('bad')) validateField(el);
      });
    });
    form.addEventListener('submit', function (ev) {
      var allOk = true;
      fields.forEach(function (el) { if (!validateField(el)) allOk = false; });
      if (!allOk) {
        ev.preventDefault();
        var firstBad = form.querySelector('.field.bad');
        if (firstBad) firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (form.dataset.demo === 'true') {
        ev.preventDefault();
        form.classList.add('is-submitting');
        var btn = form.querySelector('[type=submit]');
        if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
        setTimeout(function () {
          var body = form.querySelector('.form-body'),
            done = document.getElementById('formSuccess');
          if (body) body.style.display = 'none';
          if (done) { done.classList.add('show'); done.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        }, 850);
      }
      /* if not demo, the browser submits to the form's action normally */
    });
  }

  /* ---- year ---- */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();
})();

/* ============================================================
   Language switcher (custom UI over Google Translate)
   Covers the languages of the Alaska LNG project partners.
   ============================================================ */
(function () {
  'use strict';
  var SHORT = { en:'EN', ja:'JA', ko:'KO', 'zh-TW':'TW', 'zh-CN':'CN', th:'TH', fr:'FR', el:'EL', ru:'RU' };
  var wrap = document.getElementById('lang');
  if (!wrap) return;
  var btn = document.getElementById('langBtn'),
      menu = document.getElementById('langMenu'),
      cur = document.getElementById('langCur');

  function cookieLang() {
    var m = document.cookie.match(/googtrans=\/[A-Za-z-]+\/([A-Za-z-]+)/);
    return (m && SHORT[m[1]]) ? m[1] : 'en';
  }
  function mark(code) {
    if (cur) cur.textContent = SHORT[code] || 'EN';
    if (menu) menu.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-lang') === code);
    });
  }
  function clearCookie() {
    var exp = ';expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    document.cookie = 'googtrans=' + exp;
    try { document.cookie = 'googtrans=' + exp + ';domain=.' + location.hostname; } catch (e) {}
  }
  function setCookie(v) {
    document.cookie = 'googtrans=' + v + ';path=/';
    try { document.cookie = 'googtrans=' + v + ';path=/;domain=.' + location.hostname; } catch (e) {}
  }
  function setLang(code) {
    mark(code);
    if (code === 'en') { clearCookie(); location.reload(); return; }
    setCookie('/en/' + code);
    var combo = document.querySelector('.goog-te-combo');
    if (combo) { combo.value = code; combo.dispatchEvent(new Event('change')); }
    else { location.reload(); }
  }

  mark(cookieLang());
  btn.addEventListener('click', function (e) { e.stopPropagation(); wrap.classList.toggle('open'); });
  document.addEventListener('click', function () { wrap.classList.remove('open'); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') wrap.classList.remove('open'); });
  menu.addEventListener('click', function (e) {
    e.stopPropagation();
    var b = e.target.closest('button'); if (!b) return;
    setLang(b.getAttribute('data-lang'));
    wrap.classList.remove('open');
  });
})();

/* ---- project film facades (lazy YouTube) ---- */
(function(){
  document.querySelectorAll('.film[data-yt]').forEach(function(f){
    f.addEventListener('click', function(){
      if (f.classList.contains('on')) return;
      var id=f.getAttribute('data-yt');
      var h=f.querySelector('h3');
      var ifr=document.createElement('iframe');
      ifr.src='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0&modestbranding=1';
      ifr.title=h?h.textContent:'Jewel Isaac project film';
      ifr.setAttribute('allow','accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
      ifr.setAttribute('allowfullscreen','');
      f.classList.add('on');
      f.appendChild(ifr);
    });
  });
})();
