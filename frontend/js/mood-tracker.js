(function () {
  'use strict';
  let selected = null, triggers = [], shown = 6, charts = {};
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  MC.ready(function () {
    const { $, $$, esc } = MC;

    // faces
    $('#faces').innerHTML = MC.MOODS.map((m) => `<button type="button" class="face-btn" role="radio" aria-checked="false" data-v="${m.v}"><div class="fc">${MC.face(m.v)}</div><span>${m.label}</span><small>${m.v}</small></button>`).join('');
    $$('.face-btn').forEach((b) => b.addEventListener('click', () => pick(+b.dataset.v)));

    $('#mood-intensity').addEventListener('input', (e) => ($('#intensity-value').textContent = e.target.value));
    $$('#triggers .chip').forEach((c) => c.addEventListener('click', () => {
      const t = c.dataset.trigger, on = c.getAttribute('aria-pressed') !== 'true';
      c.setAttribute('aria-pressed', on); c.classList.toggle('on', on);
      triggers = on ? triggers.concat(t) : triggers.filter((x) => x !== t);
    }));
    $('#log-btn').addEventListener('click', log);
    $('#load-more-btn').addEventListener('click', () => { shown += 6; renderEntries(); });

    // ?mood=3 from dashboard quick faces
    const q = +new URLSearchParams(location.search).get('mood');
    if (q >= 1 && q <= 5) setTimeout(() => pick(q), 500);

    renderAll();
    document.addEventListener('mc:theme', renderCharts);
  });

  function pick(v) {
    selected = v;
    MC.$$('.face-btn').forEach((b) => { const on = +b.dataset.v === v; b.classList.toggle('selected', on); b.setAttribute('aria-checked', on); });
    const d = MC.$('#mood-details'); d.classList.add('open');
    MC.$('#support-banner').classList.toggle('show', v === 1);
    const S = {
      1: ['It\'s okay to not be okay. Reaching out to a friend or counsellor can help, and a slow breathing exercise may ease the weight a little.', 'exercises.html?start=calm-belly', 'Try calm belly breathing'],
      2: ['Sometimes a short walk or a grounding exercise can soften a low moment. Be gentle with yourself today.', 'exercises.html?start=grounding-54321', 'Try 5-4-3-2-1 grounding'],
      3: ['A good moment to practise gratitude or try something creative. Small things add up.', 'exercises.html?start=gratitude-three', 'Try Three Good Things'],
      4: ['Great to see you feeling positive! Share it with someone, or capture what\'s behind it in a few words.', 'exercises.html?start=gratitude-three', 'Savour it with gratitude'],
      5: ['Wonderful! Notice what led here — your triggers and notes will help MindCare spot what works for you.', 'exercises.html?start=loving-kindness', 'Pass it on: loving-kindness']
    }[v];
    MC.$('#suggestions-content').textContent = S[0];
    const l = MC.$('#sugg-link'); l.href = S[1]; l.firstChild.textContent = S[2] + ' ';
    MC.$('#ai-suggestions').style.display = '';
    MC.icons(d);
  }

  function log() {
    if (!selected) { MC.toast('Pick a face first — how are you feeling?', 'smile'); MC.$('#faces').animate([{ transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'none' }], { duration: 350 }); return; }
    const btn = MC.$('#log-btn');
    MC.data.addMood({ value: selected, type: MC.moodByValue(selected).key, intensity: +MC.$('#mood-intensity').value, triggers: triggers.slice(), notes: MC.$('#mood-notes').value.trim() });
    btn.innerHTML = MC.icon('check-circle') + ' Mood logged!'; MC.icons(btn); btn.disabled = true;
    MC.toast('Mood logged. Your insights have been updated.', 'check-circle');
    MC.$('.logger').animate([{ transform: 'scale(1)' }, { transform: 'scale(1.015)' }, { transform: 'scale(1)' }], { duration: 600, easing: 'ease-in-out' });
    const wasLow = selected === 1;
    setTimeout(() => {
      reset(); btn.disabled = false; btn.innerHTML = MC.icon('plus-circle') + ' Log mood &amp; get AI insights'; MC.icons(btn);
      renderAll();
      if (wasLow) MC.openCrisis();
    }, 1400);
  }

  function reset() {
    selected = null; triggers = [];
    MC.$$('.face-btn').forEach((b) => { b.classList.remove('selected'); b.setAttribute('aria-checked', 'false'); });
    MC.$$('#triggers .chip').forEach((c) => { c.classList.remove('on'); c.setAttribute('aria-pressed', 'false'); });
    MC.$('#mood-intensity').value = 5; MC.$('#intensity-value').textContent = '5'; MC.$('#mood-notes').value = '';
    MC.$('#mood-details').classList.remove('open'); MC.$('#ai-suggestions').style.display = 'none';
  }

  function renderAll() { renderCharts(); renderAnalysis(); renderEntries(); }

  function renderCharts() {
    Object.values(charts).forEach((c) => c.destroy()); charts = {};
    const moods = MC.data.moods(), muted = MC.cssVar('--muted'), line = MC.cssVar('--line'), clay = MC.cssVar('--clay'), sage = MC.cssVar('--sage-d');
    const tip = { backgroundColor: MC.cssVar('--ink'), titleColor: MC.cssVar('--bg'), bodyColor: MC.cssVar('--bg'), padding: 12, cornerRadius: 12, displayColors: false };
    const faces = (v) => ['', '😢', '😞', '😐', '🙂', '😊'][v] || '';

    // 30-day trend (daily average + 7-day moving avg)
    const da = MC.dailyAverages(moods).slice(-30);
    const ma = da.map((_, i) => MC.math.mean(da.slice(Math.max(0, i - 6), i + 1).map((x) => x.avg)));
    const c1 = MC.$('#mood-trend-chart').getContext('2d'), g = c1.createLinearGradient(0, 0, 0, 300); g.addColorStop(0, clay + '55'); g.addColorStop(1, clay + '00');
    charts.trend = new Chart(c1, { type: 'line', data: { labels: da.map((d) => new Date(d.day + 'T12:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })), datasets: [
      { label: 'Daily mood', data: da.map((d) => +d.avg.toFixed(2)), borderColor: clay, backgroundColor: g, fill: true, tension: 0.4, borderWidth: 2.5, pointRadius: 3, pointBackgroundColor: clay, pointHoverRadius: 7 },
      { label: '7-day average', data: ma.map((v) => +v.toFixed(2)), borderColor: sage, borderDash: [6, 6], tension: 0.45, borderWidth: 2.5, pointRadius: 0, fill: false }
    ] }, options: { responsive: true, maintainAspectRatio: false, animation: { duration: 1500, easing: 'easeOutQuart' }, interaction: { intersect: false, mode: 'index' },
      scales: { y: { min: 1, max: 5, ticks: { stepSize: 1, color: muted, callback: faces }, grid: { color: line }, border: { display: false } }, x: { ticks: { color: muted, maxTicksLimit: 8 }, grid: { display: false }, border: { display: false } } },
      plugins: { legend: { position: 'bottom', labels: { color: muted, usePointStyle: true, boxWidth: 8, padding: 18 } }, tooltip: Object.assign({}, tip, { displayColors: true }) } } });

    // weekday pattern
    const sums = Array(7).fill(0), cnt = Array(7).fill(0);
    moods.forEach((m) => { const d = new Date(m.ts).getDay(); sums[d] += m.value; cnt[d]++; });
    const wk = sums.map((s, i) => (cnt[i] ? +(s / cnt[i]).toFixed(2) : 0));
    const order = [1, 2, 3, 4, 5, 6, 0];
    charts.week = new Chart(MC.$('#weekly-pattern-chart'), { type: 'bar', data: { labels: order.map((i) => DAYS[i].slice(0, 3)), datasets: [{ data: order.map((i) => wk[i]), backgroundColor: order.map((i) => MC.moodByValue(wk[i] || 3).color), borderRadius: 14, borderSkipped: false, maxBarThickness: 46 }] },
      options: { responsive: true, maintainAspectRatio: false, animation: { duration: 1400, easing: 'easeOutBack' }, scales: { y: { min: 0, max: 5, ticks: { stepSize: 1, color: muted }, grid: { color: line }, border: { display: false } }, x: { ticks: { color: muted }, grid: { display: false }, border: { display: false } } }, plugins: { legend: { display: false }, tooltip: Object.assign({}, tip, { callbacks: { label: (c) => 'Average ' + c.parsed.y.toFixed(1) + ' / 5' } }) } } });

    // distribution
    const dist = [1, 2, 3, 4, 5].map((v) => moods.filter((m) => m.value === v).length);
    charts.dist = new Chart(MC.$('#mood-distribution-chart'), { type: 'doughnut', data: { labels: MC.MOODS.map((m) => m.label), datasets: [{ data: dist, backgroundColor: MC.MOODS.map((m) => m.color), borderColor: MC.cssVar('--surface'), borderWidth: 4, hoverOffset: 12 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '66%', animation: { animateRotate: true, duration: 1600 }, plugins: { legend: { position: 'bottom', labels: { color: muted, usePointStyle: true, boxWidth: 8, padding: 14 } }, tooltip: tip } } });

    const pred = MC.insights.predict();
    MC.$('#trend-tag').textContent = pred.value ? 'Next: ' + MC.moodByValue(pred.value).label : 'Keep logging';
  }

  function renderAll_analysis() {}
  function renderAnalysis() {
    const moods = MC.data.moods(), $ = MC.$;
    const all = moods.map((m) => m.value), sd = MC.math.std(all);
    $('#mood-stability').textContent = sd < 0.8 ? 'Very stable' : sd < 1.1 ? 'Moderately stable' : 'Quite variable';
    const by = Array(7).fill(0), n = Array(7).fill(0);
    moods.forEach((m) => { const d = new Date(m.ts).getDay(); by[d] += m.value; n[d]++; });
    let worst = -1, ws = 9; by.forEach((s, i) => { if (n[i] && s / n[i] < ws) { ws = s / n[i]; worst = i; } });
    $('#challenging-day').textContent = worst >= 0 ? DAYS[worst] + 's' : '—';
    const tt = MC.insights.topTriggers(3);
    $('#primary-triggers').textContent = tt.length ? tt.map((t) => t[0].toUpperCase() + t.slice(1)).join(', ') : 'Add triggers to learn';
    const da = MC.dailyAverages(moods), half = Math.floor(da.length / 2);
    const diff = da.length > 5 ? MC.math.mean(da.slice(half).map((x) => x.avg)) - MC.math.mean(da.slice(0, half).map((x) => x.avg)) : 0;
    const el = $('#improvement-trend');
    el.className = diff > 0.1 ? 'up' : diff < -0.1 ? 'down' : '';
    el.textContent = diff > 0.1 ? '↑ Improving (+' + diff.toFixed(1) + ')' : diff < -0.1 ? '↓ Dipping (' + diff.toFixed(1) + ')' : 'Holding steady';
  }

  function renderEntries() {
    const list = MC.data.moods().slice().reverse(), $ = MC.$;
    $('#mood-entries-list').innerHTML = list.slice(0, shown).map((m) => {
      const mo = MC.moodByValue(m.value);
      return `<article class="entry"><div class="fc">${MC.face(m.value)}</div><div><b>${mo.label}</b><small>${new Date(m.ts).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</small>${m.notes ? `<p>${MC.esc(m.notes)}</p>` : ''}</div><div class="meta"><span class="tag">Intensity ${m.intensity}/10</span><div class="tags">${m.triggers.map((t) => `<span class="tag clay">${MC.esc(t)}</span>`).join('')}</div></div></article>`;
    }).join('');
    $('#load-more-btn').style.display = shown >= list.length ? 'none' : '';
    $('#sample-note-m').textContent = MC.data.hasRealMoods ? '' : 'Showing example data until you log your first mood.';
  }
})();
