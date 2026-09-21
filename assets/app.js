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
  /* Eager-load the hero (first [data-bg]) for fast LCP; lazy-load the rest
     just before they scroll into view so off-screen photos don't block load. */
  var bgEls = [].slice.call(document.querySelectorAll('[data-bg]'));
  if (bgEls.length) {
    setBg(bgEls[0], bgEls[0].getAttribute('data-bg'));
    var rest = bgEls.slice(1);
    if ('IntersectionObserver' in window && rest.length) {
      var bgObs = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) {
            setBg(e.target, e.target.getAttribute('data-bg'));
            bgObs.unobserve(e.target);
          }
        });
      }, { rootMargin: '400px 0px' });
      rest.forEach(function (el) { bgObs.observe(el); });
    } else {
      rest.forEach(function (el) { setBg(el, el.getAttribute('data-bg')); });
    }
  }

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
  document.querySelectorAll('.cnt').forEach(function (el) { el.textContent = el.dataset.dec ? (0).toFixed(+el.dataset.dec) : '0'; countObs.observe(el); });

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
   The set of languages is read from the #langMenu markup, so the
   options offered and the set Google Translate is configured for can
   never drift apart. Works from the desktop dropdown AND from a native
   picker injected into the mobile menu, so it is reachable on phones.
   ============================================================ */
(function () {
  'use strict';
  var menu = document.getElementById('langMenu');
  if (!menu) return;
  var wrap = document.getElementById('lang'),
      btn  = document.getElementById('langBtn'),
      cur  = document.getElementById('langCur');

  /* Every language the menu offers, in menu order. */
  var CODES = [].map.call(menu.querySelectorAll('button[data-lang]'),
                          function (b) { return b.getAttribute('data-lang'); });
  var CUSTOM = { en:'EN', 'zh-CN':'CN', 'zh-TW':'TW', iw:'HE', ja:'JA', ko:'KO', el:'EL', uk:'UK' };
  function shortOf(c) { return CUSTOM[c] || c.slice(0, 2).toUpperCase(); }
  function nativeOf(c) {
    var s = menu.querySelector('button[data-lang="' + c + '"] .ln-native');
    return (s && s.textContent) ? s.textContent : c;
  }

  function cookieLang() {
    var m = document.cookie.match(/googtrans=\/[A-Za-z-]+\/([A-Za-z-]+)/);
    return (m && CODES.indexOf(m[1]) > -1) ? m[1] : 'en';
  }
  function mark(code) {
    if (cur) cur.textContent = shortOf(code);
    document.querySelectorAll('button[data-lang]').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-lang') === code);
    });
    var sel = document.getElementById('mlangSel');
    if (sel) sel.value = code;
  }

  /* all domain scopes Google Translate may store googtrans on:
     host-only, the host, .host, and the registrable domain + .registrable
     (e.g. jewelisaac.com / .jewelisaac.com) so reverting to English works. */
  function ggDomains() {
    var host = location.hostname, list = ['', host, '.' + host], p = host.split('.');
    if (p.length > 2) { var root = p.slice(-2).join('.'); list.push(root, '.' + root); }
    return list;
  }
  function clearCookie() {
    var exp = ';expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    ggDomains().forEach(function (d) {
      try { document.cookie = 'googtrans=' + exp + (d ? ';domain=' + d : ''); } catch (e) {}
    });
  }
  function setCookie(v) {
    ggDomains().forEach(function (d) {
      try { document.cookie = 'googtrans=' + v + ';path=/' + (d ? ';domain=' + d : ''); } catch (e) {}
    });
  }
  /* Google Translate is heavy, so load it lazily: only when a visitor opens the
     language menu or already has a non-English translation active. English
     visitors (the majority) never download it, which keeps first load fast. */
  var gtLoaded = false;
  function loadGT() {
    if (gtLoaded) return;
    if (!document.getElementById('google_translate_element')) return;
    gtLoaded = true;
    window.googleTranslateElementInit = function () {
      new google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: CODES.join(','),
        autoDisplay: false
      }, 'google_translate_element');
    };
    var s = document.createElement('script');
    s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.body.appendChild(s);
  }
  /* Google Translate does NOT reliably auto-translate from the googtrans
     cookie on load, so once its widget is ready we drive its hidden <select>
     (.goog-te-combo) directly. Poll until the combo exists, then fire it. */
  function applyCombo(code, tries) {
    tries = tries || 0;
    var combo = document.querySelector('.goog-te-combo');
    if (combo) {
      if (combo.value !== code) { combo.value = code; }
      combo.dispatchEvent(new Event('change'));
      return;
    }
    if (tries < 60) setTimeout(function () { applyCombo(code, tries + 1); }, 150);
  }
  function setLang(code) {
    if (CODES.indexOf(code) < 0) return;
    mark(code);
    if (code === 'en') { clearCookie(); location.reload(); return; }
    setCookie('/en/' + code);   /* persists the choice across pages */
    loadGT();
    applyCombo(code);           /* translates the current page in place */
  }

  /* Phones hide the desktop dropdown, so inject a native <select> language
     picker into the mobile menu. Built from the same CODES list. */
  var mob = document.getElementById('mobile');
  if (mob && !document.getElementById('mlangSel')) {
    var sec = document.createElement('div');
    sec.className = 'mlang notranslate';
    sec.setAttribute('translate', 'no');
    sec.innerHTML = '<span class="mlang-label">Language</span>';
    var sw = document.createElement('div'); sw.className = 'mlang-selwrap';
    var sel = document.createElement('select');
    sel.id = 'mlangSel'; sel.className = 'mlang-select';
    sel.setAttribute('aria-label', 'Select language');
    CODES.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c; o.textContent = nativeOf(c);
      sel.appendChild(o);
    });
    sel.addEventListener('change', function () { setLang(sel.value); });
    sw.appendChild(sel); sec.appendChild(sw);
    var anchor = mob.querySelector('.btn');
    if (anchor) mob.insertBefore(sec, anchor); else mob.appendChild(sec);
  }

  mark(cookieLang());
  if (cookieLang() !== 'en') { loadGT(); applyCombo(cookieLang()); }

  /* The mobile menu's links stay hidden until it opens, so Google Translate
     cannot translate them up front. Re-run translation when the menu opens. */
  var burgerBtn = document.getElementById('burger');
  if (burgerBtn) burgerBtn.addEventListener('click', function () {
    if (cookieLang() !== 'en') setTimeout(function () { applyCombo(cookieLang()); }, 80);
  });

  if (btn && wrap) {
    btn.addEventListener('click', function (e) { e.stopPropagation(); loadGT(); wrap.classList.toggle('open'); });
    document.addEventListener('click', function () { wrap.classList.remove('open'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') wrap.classList.remove('open'); });
  }
  /* one delegated handler serves every language button (desktop dropdown) */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-lang]');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    if (wrap) wrap.classList.remove('open');
    setLang(b.getAttribute('data-lang'));
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
