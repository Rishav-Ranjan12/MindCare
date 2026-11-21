/* Exercise browser + guided session player */
(function () {
  'use strict';
  const COL = { breathing: '#5a8f78', physical: '#cf6f45', mindfulness: '#7a9fb0', cognitive: '#d9a441' };
  const GLOW = { breathing: 'rgba(207,111,69,.24)', physical: 'rgba(230,180,98,.22)', mindfulness: 'rgba(122,159,176,.3)', cognitive: 'rgba(217,164,65,.22)' };
  const LABEL = { breathing: 'Breathing', physical: 'Physical', mindfulness: 'Mindfulness', cognitive: 'Cognitive' };
  const $ = (s) => document.querySelector(s);

  let ex = null, steps = [], starts = [], total = 0, idx = 0, stepEl = 0, elapsed = 0, playing = false, timer = null, pending = {}, sound = true, audio = null, bgRaf = null;
  const fmt = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

  MC.ready(function () {
    // faces in completion modal
    MC.$$('[data-face]').forEach((d) => (d.innerHTML = MC.face(+d.dataset.face)));
    $('#rating-buttons').innerHTML = Array.from({ length: 10 }, (_, i) => `<button data-r="${i + 1}" aria-label="Rate ${i + 1}">${i + 1}</button>`).join('');

    const params = new URLSearchParams(location.search);
    let filter = ['breathing', 'physical', 'mindfulness', 'cognitive'].includes(params.get('type')) ? params.get('type') : 'all';
    const recs = MC.insights.recommendedTypes().slice(0, 2);

    function render() {
      MC.$$('#filters .chip').forEach((c) => { const on = c.dataset.type === filter; c.classList.toggle('on', on); c.setAttribute('aria-selected', on); });
      const list = MC_EXERCISES.filter((e) => filter === 'all' || e.type === filter);
      $('#exercises-grid').innerHTML = list.map((e, i) => `
        <button class="ex" data-id="${e.id}" data-reveal data-tilt="9" style="--c:${COL[e.type]};--d:${i % 3}" aria-label="Start ${MC.esc(e.name)}">
          ${recs.includes(e.type) ? '<span class="tag clay reco-flag">' + MC.icon('sparkles') + 'AI pick</span>' : ''}
          <div class="ico">${MC.icon(e.icon)}</div>
          <h3>${MC.esc(e.name)}</h3>
          <p>${MC.esc(e.desc)}</p>
          <div class="meta"><span>${MC.icon('clock')}${e.minutes} min</span><span>${MC.icon('gauge')}${e.difficulty}</span><span class="tag">${LABEL[e.type]}</span></div>
          <span class="play"><i>${MC.icon('play')}</i>Begin</span>
        </button>`).join('');
      MC.icons($('#exercises-grid')); MC.reveal($('#exercises-grid')); MC.tilt($('#exercises-grid'));
    }
    render();
    MC.$$('#filters .chip').forEach((c) => c.addEventListener('click', () => { filter = c.dataset.type; render(); }));
    $('#exercises-grid').addEventListener('click', (e) => { const b = e.target.closest('.ex'); if (b) startSession(b.dataset.id); });

    if (params.get('start')) setTimeout(() => startSession(params.get('start')), 350);

    MC.$$('.mood-btn').forEach((b) => b.addEventListener('click', () => {
      MC.$$('.mood-btn').forEach((x) => x.classList.toggle('selected', x === b));
      pending.moodAfter = b.dataset.mood;
      $('#struggle-note').style.display = b.dataset.mood === 'worse' ? '' : 'none';
    }));
    $('#rating-buttons').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      pending.rating = +b.dataset.r; MC.$$('#rating-buttons button').forEach((x) => x.classList.toggle('on', x === b));
    });
    $('#sound-btn').addEventListener('click', () => { sound = !sound; $('#sound-btn').innerHTML = MC.icon(sound ? 'volume-2' : 'volume-x'); MC.icons($('#sound-btn')); });
    document.addEventListener('keydown', (e) => {
      if (!$('#exercise-session').classList.contains('open')) return;
      if (e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') { e.preventDefault(); toggleExercise(); }
      if (e.key === 'Escape') endExerciseSession();
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden && playing) toggleExercise(); });
  });

  /* ------------------------ session setup ------------------------ */
  function buildSteps(e) {
    if (e.type === 'breathing') {
      const goal = e.minutes * 60, out = []; let sum = 0;
      while (sum < goal) { for (const [label, secs, phase] of e.cycle) { out.push({ title: label, secs, phase }); sum += secs; } }
      return out;
    }
    return e.steps.map(([title, text, secs, extra]) => ({ title, text, secs, extra }));
  }

  function startSession(id) {
    ex = MC_EXERCISES.find((x) => x.id === id); if (!ex) return;
    pending = {};
    steps = buildSteps(ex); starts = []; total = 0;
    steps.forEach((s) => { starts.push(total); total += s.secs; });
    const S = $('#exercise-session');
    $('#exercise-name').textContent = ex.name; $('#exercise-type').textContent = LABEL[ex.type];
    $('#exercise-difficulty').textContent = ex.difficulty; $('#total-time').textContent = fmt(total);
    S.style.setProperty('--glow', GLOW[ex.type]);
    MC.$$('#exercise-visual > div').forEach((d) => d.classList.remove('on'));
    $('#' + ex.type + '-visual').classList.add('on');
    S.classList.add('open'); S.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
    MC.icons(S);
    resetExercise(true);
    startBg();
  }

  /* ------------------------ engine ------------------------ */
  function setPlaying(p) {
    playing = p; clearInterval(timer);
    const b = $('#play-pause-btn'); b.innerHTML = MC.icon(p ? 'pause' : 'play'); MC.icons(b);
    if (p) { let last = performance.now(); timer = setInterval(() => { const n = performance.now(), dt = Math.min(0.5, (n - last) / 1000); last = n; tick(dt); }, 100); }
    const o = $('#breathing-circle'); if (o) o.style.animationPlayState = p ? 'running' : 'paused';
  }

  function tick(dt) {
    stepEl += dt;
    const s = steps[idx];
    if (stepEl >= s.secs) { stepEl -= s.secs; if (idx + 1 >= steps.length) { elapsed = total; paint(); return complete(); } idx++; enter(); }
    elapsed = starts[idx] + stepEl; paint();
  }

  function paint() {
    $('#current-time').textContent = fmt(elapsed);
    $('#progress-fill').style.width = Math.min(100, (elapsed / total) * 100) + '%';
    if (ex.type === 'breathing') { const left = Math.ceil(steps[idx].secs - stepEl); $('#breath-count').textContent = playing || stepEl > 0 ? Math.max(1, left) : ''; }
  }

  function enter() {
    const s = steps[idx];
    if (ex.type === 'breathing') {
      const o = $('#breathing-circle'); o.style.setProperty('--dur', (s.phase === 'hold' ? 0.3 : s.secs) + 's');
      if (s.phase === 'in') o.style.setProperty('--k', 1); if (s.phase === 'out') o.style.setProperty('--k', 0.62);
      o.classList.toggle('hold', s.phase === 'hold'); o.classList.toggle('out', s.phase === 'out');
      $('#breath-text').textContent = s.title;
      $('#exercise-guidance').textContent = ex.tip;
    } else if (ex.type === 'physical') {
      $('#pose-name').textContent = s.title; $('#pose-instruction').textContent = s.text;
      const ic = steps[idx] && ex.steps[idx][3]; $('#pose-icon').innerHTML = MC.icon(ic || 'person-standing'); MC.icons($('#pose-icon'));
      const n = $('#pose-name'); n.style.animation = 'none'; void n.offsetWidth; n.style.animation = '';
      $('#exercise-guidance').textContent = 'Step ' + (idx + 1) + ' of ' + steps.length;
    } else if (ex.type === 'mindfulness') {
      const t = $('#mindfulness-text'); t.innerHTML = `<b style="display:block;font-weight:500;margin-bottom:8px">${MC.esc(s.title)}</b><span style="font-size:.62em;opacity:.85">${MC.esc(s.text)}</span>`;
      t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
      $('#exercise-guidance').textContent = 'Breathe naturally. Step ' + (idx + 1) + ' of ' + steps.length;
    } else {
      $('#cognitive-instruction').innerHTML = `${MC.esc(s.title)}<small style="display:block;font-family:var(--font-b);font-size:16px;opacity:.75;margin-top:10px;letter-spacing:0">${MC.esc(s.text)}</small>`;
      $('#cognitive-input').value = ''; $('#cognitive-input').focus({ preventScroll: true });
      $('#exercise-guidance').textContent = 'Prompt ' + (idx + 1) + ' of ' + steps.length + ' · your writing never leaves this device';
    }
    chime(s);
  }

  function saveJournal() {
    if (ex.type !== 'cognitive') return;
    const text = $('#cognitive-input').value.trim(); if (!text) return;
    const j = MC.store.get('journal', []); j.push({ ts: Date.now(), exercise: ex.name, prompt: steps[idx].title, text }); MC.store.set('journal', j); $('#cognitive-input').value = '';
  }

  window.toggleExercise = function () {
    if (!ex) return;
    if (!audio && sound) { try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (!playing && elapsed === 0 && stepEl === 0) enter();
    setPlaying(!playing);
  };
  window.resetExercise = function (silent) {
    if (!ex) return;
    setPlaying(false); idx = 0; stepEl = 0; elapsed = 0; paint(); $('#progress-fill').style.width = '0';
    const o = $('#breathing-circle'); o.style.setProperty('--dur', '1s'); o.style.setProperty('--k', 0.62); o.classList.remove('hold', 'out');
    $('#breath-text').textContent = 'Get ready'; $('#breath-count').textContent = '';
    $('#pose-name').textContent = 'Starting position'; $('#pose-instruction').textContent = 'Press play when you are ready.'; $('#pose-icon').innerHTML = MC.icon('person-standing'); MC.icons($('#pose-icon'));
    $('#mindfulness-text').textContent = 'Press play and begin when ready';
    $('#cognitive-instruction').textContent = "Press play when you're ready to begin."; $('#cognitive-input').value = '';
    $('#exercise-guidance').textContent = ex.tip || ex.desc;
  };
  window.skipStep = function () {
    if (!ex) return;
    if (!playing && elapsed === 0) { toggleExercise(); return; }
    saveJournal();
    if (idx + 1 >= steps.length) return complete();
    idx++; stepEl = 0; elapsed = starts[idx]; enter(); paint();
  };
  window.endExerciseSession = function () {
    setPlaying(false); stopBg(); saveJournal();
    const S = $('#exercise-session'); S.classList.remove('open'); S.setAttribute('aria-hidden', 'true'); document.body.style.overflow = '';
  };

  function complete() {
    saveJournal(); setPlaying(false); chime({ phase: 'done' });
    MC.$$('.mood-btn').forEach((b) => b.classList.remove('selected')); MC.$$('#rating-buttons button').forEach((b) => b.classList.remove('on'));
    $('#struggle-note').style.display = 'none';
    pending = { done: true, ex: ex };
    MC.open($('#completion-modal')); MC.icons($('#completion-modal'));
    // light confetti-ish pulse on the orb
    $('#exercise-session').animate([{ filter: 'brightness(1)' }, { filter: 'brightness(1.35)' }, { filter: 'brightness(1)' }], { duration: 900 });
  }

  function commit() {
    if (!pending.done) return;
    MC.data.addSession({ exerciseId: pending.ex.id, name: pending.ex.name, type: pending.ex.type, minutes: Math.max(1, Math.round(total / 60)), moodAfter: pending.moodAfter || 'same', rating: pending.rating || 7 });
    MC.toast('Session saved to your progress', 'check-circle'); pending.done = false;
  }
  window.closeCompletionModal = function () { commit(); MC.close($('#completion-modal')); endExerciseSession(); };
  window.suggestNextExercise = function () {
    commit();
    const cur = pending.ex || ex, struggled = pending.moodAfter === 'worse';
    const order = MC.insights.recommendedTypes();
    let pool = MC_EXERCISES.filter((e) => e.id !== cur.id);
    const want = struggled ? 'mindfulness' : order.find((t) => t !== cur.type) || order[0];
    const cand = pool.filter((e) => e.type === want); const next = (cand.length ? cand : pool)[Math.floor(Math.random() * (cand.length || pool.length))];
    MC.close($('#completion-modal')); endExerciseSession(); setTimeout(() => startSession(next.id), 500);
  };

  /* ------------------------ gentle sound ------------------------ */
  function chime(s) {
    if (!sound || !audio) return;
    try {
      const now = audio.currentTime, o = audio.createOscillator(), g = audio.createGain();
      o.type = 'sine'; o.frequency.value = s.phase === 'in' ? 392 : s.phase === 'out' ? 294 : s.phase === 'done' ? 523 : 349;
      g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.06, now + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, now + (s.phase === 'done' ? 2.2 : 1.1));
      o.connect(g).connect(audio.destination); o.start(now); o.stop(now + 2.3);
    } catch (e) {}
  }

  /* ------------------------ drifting particles backdrop ------------------------ */
  function startBg() {
    const c = $('#session-bg'), x = c.getContext('2d'); if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const dpr = Math.min(2, devicePixelRatio || 1);
    const size = () => { c.width = c.clientWidth * dpr; c.height = c.clientHeight * dpr; }; size(); addEventListener('resize', size);
    const P = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 2 + 0.6, v: Math.random() * 0.00006 + 0.00002, a: Math.random() * 0.5 + 0.15, ph: Math.random() * 6 }));
    cancelAnimationFrame(bgRaf);
    (function loop(t) {
      x.clearRect(0, 0, c.width, c.height);
      P.forEach((p) => { p.y -= p.v * 16; if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); } x.globalAlpha = p.a * (0.6 + 0.4 * Math.sin(t / 1400 + p.ph)); x.fillStyle = '#f6d9a8'; x.beginPath(); x.arc(p.x * c.width + Math.sin(t / 2500 + p.ph) * 14, p.y * c.height, p.r * dpr, 0, 6.283); x.fill(); });
      bgRaf = requestAnimationFrame(loop);
    })(0);
  }
  function stopBg() { cancelAnimationFrame(bgRaf); }
})();
