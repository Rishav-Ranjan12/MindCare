/* ==========================================================================
   MindCare core — storage, sample data, insights, shell, motion helpers
   ========================================================================== */
(function () {
  'use strict';
  const MC = (window.MC = {});

  /* ------------------------------ storage ------------------------------ */
  MC.store = {
    get(k, d) { try { const v = localStorage.getItem('mc_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('mc_' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
    del(k) { try { localStorage.removeItem('mc_' + k); } catch (e) {} }
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  MC.$ = $; MC.$$ = $$;
  MC.cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  MC.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  MC.API = location.port === '5000' ? '' : 'http://localhost:5000';

  /* ------------------------------ settings / theme ------------------------------ */
  MC.settings = Object.assign({ theme: 'light', speed: 'normal', crisis: true, name: 'Friend' }, MC.store.get('settings', {}));
  MC.saveSettings = () => MC.store.set('settings', MC.settings);

  MC.applyTheme = function () {
    const t = MC.settings.theme;
    const dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.dispatchEvent(new CustomEvent('mc:theme'));
  };
  MC.setTheme = (t) => { MC.settings.theme = t; MC.saveSettings(); MC.applyTheme(); };
  MC.applyTheme();
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => MC.settings.theme === 'auto' && MC.applyTheme());

  /* ------------------------------ icons ------------------------------ */
  MC.icons = function (root) {
    if (window.lucide) window.lucide.createIcons(root ? { root } : undefined);
  };
  MC.icon = (name, cls = '') => `<i data-lucide="${name}" class="${cls}"></i>`;

  MC.logo = `<svg class="mark" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19" fill="currentColor"/><path d="M20 31c-7-3-10-8-9-14 6 0 10 3 9 14z" fill="#86a38c"/><path d="M20 31c7-3 10-8 9-14-6 0-10 3-9 14z" fill="#cf6f45"/></svg>`;

  /* ------------------------------ mood model ------------------------------ */
  MC.MOODS = [
    { v: 1, key: 'very-sad', label: 'Very Sad', color: '#6f86a8' },
    { v: 2, key: 'sad', label: 'Sad', color: '#9fbfc4' },
    { v: 3, key: 'neutral', label: 'Neutral', color: '#d9c9a3' },
    { v: 4, key: 'happy', label: 'Happy', color: '#86a38c' },
    { v: 5, key: 'very-happy', label: 'Very Happy', color: '#e6b462' }
  ];
  MC.moodByValue = (v) => MC.MOODS[Math.max(1, Math.min(5, Math.round(v))) - 1];

  MC.face = function (v) {
    const m = MC.moodByValue(v);
    const mouths = {
      1: '<path d="M22 46 Q32 36 42 46" />',
      2: '<path d="M24 44 Q32 39 40 44" />',
      3: '<path d="M24 42 H40" />',
      4: '<path d="M22 40 Q32 49 42 40" />',
      5: '<path d="M20 38 Q32 55 44 38 Z" fill="#15231d" />'
    };
    const brows = v === 1 ? '<path d="M17 20 L26 23 M47 20 L38 23" />' : v === 2 ? '<path d="M18 22 L26 23 M46 22 L38 23" />' : '';
    const tear = v === 1 ? '<path d="M45 33 q3 5 0 8 q-3 -3 0 -8z" fill="#cfe3f0" stroke="none"/>' : '';
    const cheeks = v >= 4 ? '<circle cx="15" cy="37" r="4" fill="#cf6f45" opacity=".35" stroke="none"/><circle cx="49" cy="37" r="4" fill="#cf6f45" opacity=".35" stroke="none"/>' : '';
    const eyes = v === 5 ? '<path d="M19 29 Q23 22 27 29 M37 29 Q41 22 45 29" />' : '<circle cx="23" cy="29" r="3" fill="#15231d" stroke="none"/><circle cx="41" cy="29" r="3" fill="#15231d" stroke="none"/>';
    return `<svg class="face" viewBox="0 0 64 64" fill="none" stroke="#15231d" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="${m.color}" stroke="none"/>${cheeks}${eyes}${brows}${mouths[v]}${tear}</svg>`;
  };

  /* ------------------------------ data layer ------------------------------ */
  const DAY = 86400000;
  const dayKey = (ts) => { const d = new Date(ts); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  MC.dayKey = dayKey;

  // deterministic PRNG so sample data is stable between reloads
  function rng(seed) { return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }

  function sampleMoods() {
    const r = rng(7), out = [], now = new Date();
    now.setHours(12, 0, 0, 0);
    const weekday = [0.2, -0.45, -0.2, 0.05, 0.1, 0.45, 0.35]; // Sun..Sat
    const lowT = ['work', 'sleep', 'finances', 'relationships', 'health'];
    const highT = ['family', 'weather', 'relationships', 'sleep'];
    for (let i = 29; i >= 0; i--) {
      const base = new Date(now.getTime() - i * DAY);
      const n = r() > 0.7 ? 2 : 1;
      for (let k = 0; k < n; k++) {
        let v = 3.2 + (29 - i) * 0.018 + weekday[base.getDay()] + (r() - 0.5) * 1.3;
        v = Math.max(1, Math.min(5, Math.round(v)));
        const pool = v <= 3 ? lowT : highT;
        const t1 = pool[Math.floor(r() * pool.length)];
        const t2 = pool[Math.floor(r() * pool.length)];
        out.push({
          id: 's' + i + '-' + k, ts: base.getTime() + (k ? 7 : -2) * 3600000 + Math.floor(r() * 3) * 1800000,
          value: v, type: MC.moodByValue(v).key, intensity: 3 + Math.floor(r() * 6),
          triggers: t1 === t2 ? [t1] : [t1, t2], notes: '', sample: true
        });
      }
    }
    return out;
  }

  function sampleSessions() {
    const r = rng(21), out = [], now = Date.now();
    const cat = [
      ['box-breathing', 'Box Breathing', 'breathing'], ['calm-belly', 'Calm Belly Breathing', 'breathing'],
      ['body-scan', 'Body Scan', 'mindfulness'], ['neck-release', 'Neck & Shoulder Release', 'physical'],
      ['gratitude-three', 'Three Good Things', 'cognitive'], ['grounding-54321', '5-4-3-2-1 Grounding', 'mindfulness']
    ];
    for (let i = 0; i < 16; i++) {
      const c = cat[Math.floor(r() * cat.length)];
      const daysAgo = Math.floor(i * 0.9 + r() * 0.7);
      const hr = r() > 0.4 ? 7 + Math.floor(r() * 3) : 19 + Math.floor(r() * 3);
      const d = new Date(now - daysAgo * DAY); d.setHours(hr, Math.floor(r() * 50), 0, 0);
      if (d.getTime() > now) d.setTime(now - 3600000);
      out.push({
        id: 'ss' + i, ts: d.getTime(), exerciseId: c[0], name: c[1], type: c[2],
        minutes: 3 + Math.floor(r() * 6), moodAfter: r() > 0.25 ? (r() > 0.5 ? 'better' : 'much-better') : 'same',
        rating: 6 + Math.floor(r() * 5), sample: true
      });
    }
    return out;
  }

  MC.data = {
    realMoods: () => MC.store.get('moods', []),
    realSessions: () => MC.store.get('sessions', []),
    get hasRealMoods() { return this.realMoods().length > 0; },
    get hasRealSessions() { return this.realSessions().length > 0; },
    moods() { const r = this.realMoods(); return (r.length ? r : sampleMoods()).slice().sort((a, b) => a.ts - b.ts); },
    sessions() { const r = this.realSessions(); return (r.length ? r : sampleSessions()).slice().sort((a, b) => a.ts - b.ts); },
    addMood(e) { const l = this.realMoods(); l.push(Object.assign({ id: 'm' + Date.now(), ts: Date.now() }, e)); MC.store.set('moods', l); },
    addSession(s) { const l = this.realSessions(); l.push(Object.assign({ id: 'x' + Date.now(), ts: Date.now() }, s)); MC.store.set('sessions', l); },
    activities() {
      const a = this.moods().map((m) => ({ ts: m.ts, kind: 'mood', title: 'Logged mood: ' + MC.moodByValue(m.value).label, meta: m.triggers.length ? 'Triggers: ' + m.triggers.join(', ') : 'Check-in', v: m.value }))
        .concat(this.sessions().map((s) => ({ ts: s.ts, kind: s.type, title: s.name, meta: s.minutes + ' min · ' + s.type })));
      return a.sort((x, y) => y.ts - x.ts);
    }
  };

  MC.fmtAgo = function (ts) {
    const m = Math.round((Date.now() - ts) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + ' min ago';
    const h = Math.round(m / 60);
    if (h < 24) return h + (h === 1 ? ' hour ago' : ' hours ago');
    const d = Math.round(h / 24);
    if (d === 1) return 'yesterday';
    if (d < 7) return d + ' days ago';
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  /* ------------------------------ insights (lightweight ML) ------------------------------ */
  const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const std = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))); };
  MC.math = { mean, std };

  function dailyAverages(moods) {
    const by = {};
    moods.forEach((m) => (by[dayKey(m.ts)] = (by[dayKey(m.ts)] || []).concat(m.value)));
    return Object.keys(by).sort().map((k) => ({ day: k, avg: mean(by[k]) }));
  }
  MC.dailyAverages = dailyAverages;

  MC.insights = {
    streak() {
      const days = new Set(MC.data.moods().map((m) => dayKey(m.ts)).concat(MC.data.sessions().map((s) => dayKey(s.ts))));
      let n = 0, t = Date.now();
      if (!days.has(dayKey(t))) t -= DAY;
      while (days.has(dayKey(t))) { n++; t -= DAY; }
      return n;
    },
    week() {
      const from = Date.now() - 7 * DAY;
      const s = MC.data.sessions().filter((x) => x.ts >= from);
      return { sessions: s.length, minutes: s.reduce((a, b) => a + b.minutes, 0) };
    },
    predict() {
      const d = dailyAverages(MC.data.moods()).slice(-14);
      if (d.length < 4) return { value: null, text: 'Log a few more days to unlock', slope: 0 };
      const n = d.length, xs = d.map((_, i) => i), ys = d.map((x) => x.avg);
      const mx = mean(xs), my = mean(ys);
      const slope = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / (xs.reduce((a, x) => a + (x - mx) ** 2, 0) || 1);
      const recent = mean(ys.slice(-3));
      const value = Math.max(1, Math.min(5, recent + slope * 0.8));
      const dir = slope > 0.03 ? 'trending up' : slope < -0.03 ? 'dipping slightly' : 'holding steady';
      return { value, slope, text: MC.moodByValue(value).label + ' · ' + value.toFixed(1) + '/5, ' + dir };
    },
    bestTime() {
      const s = MC.data.sessions();
      if (s.length < 3) return { text: 'Complete a few sessions to learn' };
      const gain = { 'much-better': 2, better: 1, same: 0, worse: -1 };
      const buckets = { Morning: [5, 11], Afternoon: [11, 17], Evening: [17, 22], Night: [22, 29] };
      const score = {}, cnt = {};
      s.forEach((x) => {
        let h = new Date(x.ts).getHours(); if (h < 5) h += 24;
        for (const [k, [a, b]] of Object.entries(buckets)) if (h >= a && h < b) { score[k] = (score[k] || 0) + (gain[x.moodAfter] ?? 0) + (x.rating || 5) / 5; cnt[k] = (cnt[k] || 0) + 1; }
      });
      let best = null, bs = -Infinity;
      Object.keys(score).forEach((k) => { const v = score[k] / cnt[k]; if (v > bs) { bs = v; best = k; } });
      const hrs = s.filter((x) => { let h = new Date(x.ts).getHours(); if (h < 5) h += 24; return h >= buckets[best][0] && h < buckets[best][1]; }).map((x) => new Date(x.ts).getHours());
      const avg = Math.round(mean(hrs));
      const label = (avg % 12 || 12) + (avg % 24 < 12 ? ' AM' : ' PM');
      return { text: best + 's · around ' + label };
    },
    success() {
      const s = MC.data.sessions();
      if (!s.length) return { text: 'No sessions yet', pct: 0 };
      const ok = s.filter((x) => x.moodAfter === 'better' || x.moodAfter === 'much-better' || (x.rating || 0) >= 8).length;
      const pct = Math.round((ok / s.length) * 100);
      return { text: pct + '% of sessions lifted your mood', pct };
    },
    // order of exercise types to suggest, based on how you've been feeling
    recommendedTypes() {
      const m = MC.data.moods();
      const last = m.length ? m[m.length - 1] : null;
      const recent = mean(m.slice(-4).map((x) => x.value)) || 3;
      const pref = {};
      MC.data.sessions().forEach((s) => { pref[s.type] = (pref[s.type] || 0) + (s.rating || 5); });
      let order;
      if (recent <= 2.3 || (last && last.value <= 2)) order = ['breathing', 'mindfulness', 'physical', 'cognitive'];
      else if (recent < 3.6) order = ['physical', 'mindfulness', 'breathing', 'cognitive'];
      else order = ['cognitive', 'physical', 'mindfulness', 'breathing'];
      // tiny nudge from past ratings
      return order.sort((a, b) => (order.indexOf(a) - (pref[a] || 0) / 60) - (order.indexOf(b) - (pref[b] || 0) / 60));
    },
    topTriggers(limit = 3) {
      const c = {};
      MC.data.moods().forEach((m) => m.triggers.forEach((t) => (c[t] = (c[t] || 0) + (m.value <= 3 ? 1.4 : 1))));
      return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, limit).map((x) => x[0]);
    }
  };

  /* ------------------------------ toast / modal ------------------------------ */
  MC.toast = function (msg, icon = 'sparkles', ms = 3200) {
    let host = $('.toasts');
    if (!host) { host = document.createElement('div'); host.className = 'toasts'; host.setAttribute('role', 'status'); document.body.appendChild(host); }
    const t = document.createElement('div');
    t.className = 'toast'; t.innerHTML = MC.icon(icon) + '<span>' + MC.esc(msg) + '</span>';
    host.appendChild(t); MC.icons(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, ms);
  };
  MC.open = (el) => { el.classList.add('open'); document.body.style.overflow = 'hidden'; };
  MC.close = (el) => { el.classList.remove('open'); document.body.style.overflow = ''; };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.backdrop');
    if (b && e.target === b && !b.dataset.sticky) MC.close(b);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $$('.backdrop.open').forEach((b) => !b.dataset.sticky && MC.close(b)); });

  /* ------------------------------ crisis sheet (global) ------------------------------ */
  MC.crisisHTML = `
    <div class="backdrop" id="crisis-modal" role="dialog" aria-modal="true" aria-labelledby="crisis-title">
      <div class="modal crisis">
        <span class="tag clay">${MC.icon('life-buoy')} You're not alone</span>
        <h3 id="crisis-title" style="margin:14px 0 8px">Talk to a real person, right now.</h3>
        <p class="muted">If you're thinking about harming yourself or you're in danger, please reach out. These services are free, confidential and open all day, every day.</p>
        <div class="crisis-list">
          <a href="tel:988"><span>${MC.icon('phone')}<b>988 Suicide &amp; Crisis Lifeline</b><small>US · call or text</small></span><em>Call 988</em></a>
          <a href="sms:741741?&body=HOME"><span>${MC.icon('message-square')}<b>Crisis Text Line</b><small>US · text from anywhere</small></span><em>Text HOME to 741741</em></a>
          <a href="tel:911"><span>${MC.icon('siren')}<b>Emergency services</b><small>US · immediate danger</small></span><em>Call 911</em></a>
          <a href="tel:14416"><span>${MC.icon('heart-handshake')}<b>Tele-MANAS</b><small>India · free, 24/7</small></span><em>Call 14416</em></a>
        </div>
        <p class="muted" style="font-size:13px;margin-top:14px">Somewhere else? <a href="https://findahelpline.com" target="_blank" rel="noopener" style="text-decoration:underline">findahelpline.com</a> lists free lines in most countries.</p>
        <div class="row" style="margin-top:22px;justify-content:flex-end"><button class="btn btn-ghost btn-sm" data-close>I'm safe — continue</button></div>
      </div>
    </div>`;
  MC.openCrisis = () => { const m = $('#crisis-modal'); if (m) { MC.open(m); MC.icons(m); } };
  MC.closeCrisis = () => { const m = $('#crisis-modal'); if (m) MC.close(m); };

  /* ------------------------------ app shell ------------------------------ */
  const NAV = [
    ['dashboard.html', 'layout-dashboard', 'Dashboard', 'dashboard'],
    ['mood-tracker.html', 'activity', 'Mood Analytics', 'mood'],
    ['exercises.html', 'wind', 'Exercises', 'exercises'],
    ['chatbot.html', 'messages-square', 'AI Support', 'chat'],
    ['therapist-directory.html', 'stethoscope', 'Find Therapist', 'therapists'],
    ['resources.html', 'library', 'Resources', 'resources']
  ];

  function buildRail() {
    const host = $('#rail');
    if (!host) return;
    const active = host.dataset.active;
    host.innerHTML = `<div class="rail-in">
      <a class="brand" href="index.html">${MC.logo}<span>MindCare</span></a>
      <nav aria-label="Main">${NAV.map((n) => `<a href="${n[0]}" class="${n[3] === active ? 'active' : ''}" ${n[3] === active ? 'aria-current="page"' : ''}>${MC.icon(n[1])}<span>${n[2]}</span></a>`).join('')}</nav>
      <div class="rail-foot">
        <button class="help-pill" data-crisis>${MC.icon('life-buoy')}<span><b>Need help right now?</b>Crisis lines, one tap away</span></button>
        <div class="row"><a href="index.html">${MC.icon('house')}Home</a><button id="theme-toggle" aria-label="Toggle theme">${MC.icon('moon')}Theme</button></div>
      </div></div>`;
    $('#theme-toggle').addEventListener('click', () => {
      MC.setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    });
  }

  /* ------------------------------ motion helpers ------------------------------ */
  MC.reveal = function (root = document) {
    const io = (MC._io = MC._io || new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }));
    $$('[data-reveal]:not(.in)', root).forEach((el) => io.observe(el));
  };

  MC.tilt = function (root = document) {
    if (matchMedia('(hover: none)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    $$('[data-tilt]:not([data-tilt-on])', root).forEach((el) => {
      el.dataset.tiltOn = '1';
      const max = parseFloat(el.dataset.tilt) || 8;
      if (!el.querySelector(':scope > .glare')) { const g = document.createElement('span'); g.className = 'glare'; el.appendChild(g); }
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.transition = 'transform 0.08s linear, box-shadow 0.4s';
        el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * max}deg) rotateY(${(px - 0.5) * max}deg) translateZ(0) scale(1.012)`;
        el.style.setProperty('--gx', px * 100 + '%'); el.style.setProperty('--gy', py * 100 + '%');
      });
      el.addEventListener('pointerleave', () => { el.style.transition = ''; el.style.transform = ''; });
    });
  };

  MC.magnetic = function (root = document) {
    if (matchMedia('(hover: none)').matches) return;
    $$('[data-magnetic]:not([data-mag-on])', root).forEach((el) => {
      el.dataset.magOn = '1';
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
      });
      el.addEventListener('pointerleave', () => (el.style.transform = ''));
    });
  };

  MC.countUp = function (el, to, { dur = 1400, dec = 0, suffix = '' } = {}) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = to.toFixed(dec) + suffix; return; }
    const t0 = performance.now(), from = parseFloat(el.dataset.from || 0);
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = (from + (to - from) * e).toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  MC.countOnView = function (root = document) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target; io.unobserve(el);
      MC.countUp(el, parseFloat(el.dataset.count), { dec: +(el.dataset.dec || 0), suffix: el.dataset.suffix || '' });
    }), { threshold: 0.6 });
    $$('[data-count]', root).forEach((el) => io.observe(el));
  };

  /* soft page transitions */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank' || a.hasAttribute('download')) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || /^(https?:|mailto:|tel:|sms:|javascript:)/.test(href)) return;
    e.preventDefault();
    document.body.classList.add('leaving');
    setTimeout(() => (location.href = href), 200);
  });
  window.addEventListener('pageshow', (e) => { if (e.persisted) document.body.classList.remove('leaving'); });

  /* global delegated actions */
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-crisis]')) { e.preventDefault(); MC.openCrisis(); }
    const c = e.target.closest('[data-close]');
    if (c) { const b = c.closest('.backdrop'); if (b) MC.close(b); }
  });

  /* ------------------------------ boot ------------------------------ */
  function boot() {
    if (!$('.ambient')) { const a = document.createElement('div'); a.className = 'ambient'; a.innerHTML = '<span></span><span></span><span></span>'; document.body.prepend(a); }
    buildRail();
    if (!$('#crisis-modal')) document.body.insertAdjacentHTML('beforeend', MC.crisisHTML);
    MC.icons(); MC.reveal(); MC.tilt(); MC.magnetic(); MC.countOnView();
    requestAnimationFrame(() => document.body.classList.add('ready'));
    MC._ready = true;
    document.dispatchEvent(new CustomEvent('mc:ready'));
  }
  MC.ready = (fn) => (MC._ready ? fn() : document.addEventListener('mc:ready', fn, { once: true }));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
