(function () {
  'use strict';
  MC.ready(function () {
    const { $, $$, esc } = MC;
    const H = new Date().getHours();
    $('#greet').textContent = H < 5 ? 'Still up' : H < 12 ? 'Good morning' : H < 18 ? 'Good afternoon' : 'Good evening';
    $('#today-label').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

    // editable name
    const nameEl = $('#username');
    nameEl.textContent = MC.settings.name || 'Friend';
    nameEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); nameEl.blur(); } });
    nameEl.addEventListener('blur', () => { MC.settings.name = (nameEl.textContent.trim() || 'Friend').slice(0, 24); nameEl.textContent = MC.settings.name; MC.saveSettings(); });

    // quick faces -> mood tracker preselect
    $('#face-quick').innerHTML = [1, 2, 3, 4, 5].map((v) => `<a href="mood-tracker.html?mood=${v}" title="${MC.moodByValue(v).label}" aria-label="Log mood: ${MC.moodByValue(v).label}">${MC.face(v)}</a>`).join('');

    // stats
    const wk = MC.insights.week(), streak = MC.insights.streak();
    [['#sessions-count', wk.sessions], ['#minutes-spent', wk.minutes], ['#streak-days', streak]].forEach(([s, v]) => { $(s).dataset.count = v; });
    MC.countOnView();

    // week dots
    const act = new Set(MC.data.moods().map((m) => MC.dayKey(m.ts)).concat(MC.data.sessions().map((s) => MC.dayKey(s.ts))));
    const dots = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      dots.push(`<div class="${i === 0 ? 'today' : ''}"><i class="${act.has(MC.dayKey(d.getTime())) ? 'on' : ''}" style="transition-delay:${(6 - i) * 90 + 300}ms">${MC.icon('check')}</i>${d.toLocaleDateString(undefined, { weekday: 'narrow' })}</div>`);
    }
    $('#weekdots').innerHTML = dots.join('');
    $('#weekdots').addEventListener('mc-never', () => {});

    // ML insights
    const pred = MC.insights.predict();
    $('#predicted-mood').textContent = pred.text;
    $('#optimal-time').textContent = MC.insights.bestTime().text;
    const sc = MC.insights.success();
    $('#success-pattern').textContent = sc.text;
    setTimeout(() => ($('#success-meter').style.width = sc.pct + '%'), 500);

    // daily insight text
    const types = MC.insights.recommendedTypes();
    const trig = MC.insights.topTriggers(1)[0];
    const moods = MC.data.moods(), last = moods[moods.length - 1];
    const recent = MC.math.mean(moods.slice(-4).map((m) => m.value)) || 3;
    let text, cta = null;
    if (recent <= 2.3) { text = 'Your last few check-ins have been heavy. Be gentle with yourself today — a slow breathing session is a good first step.'; cta = ['Try calm breathing', 'exercises.html?type=breathing']; }
    else if (recent < 3.6) { text = (trig ? 'You often log ' + trig + ' as a trigger when your mood dips. ' : '') + 'A little movement tends to lift moods like yours — even five minutes counts.'; cta = ['Try a quick stretch', 'exercises.html?type=physical']; }
    else { text = 'You\'ve been feeling good lately' + (pred.slope > 0.03 ? ' and trending upward' : '') + '. Lock it in with a gratitude practice while it\'s fresh.'; cta = ['Three good things', 'exercises.html?type=cognitive']; }
    typeInto($('#insight-text'), text, () => { const a = $('#insight-action'); a.style.display = ''; a.firstChild.textContent = cta[0] + ' '; a.href = cta[1]; });

    // AI "recommended" badges on the top two types
    types.slice(0, 2).forEach((t) => { const el = $('#reco-' + t); if (el) el.classList.add('show'); });

    // chart
    drawChart();
    document.addEventListener('mc:theme', () => { chart && chart.destroy(); drawChart(); });

    // recommendations
    const cols = { breathing: '#5a8f78', physical: '#cf6f45', mindfulness: '#7a9fb0', cognitive: '#d9a441' };
    const why = {
      breathing: 'Slow breathing calms the stress response in under five minutes.',
      physical: 'Movement releases tension and nudges mood upward.',
      mindfulness: 'Grounding attention reduces rumination.',
      cognitive: 'Writing it down turns a loop into a plan.'
    };
    setTimeout(() => {
      const picks = types.slice(0, 3).map((t) => {
        const pool = MC_EXERCISES.filter((e) => e.type === t);
        return pool[Math.floor((Date.now() / 86400000) % pool.length)];
      });
      $('#smart-recommendations').innerHTML = picks.map((e) => `<a class="rec" href="exercises.html?start=${e.id}" style="--c:${cols[e.type]}"><div class="ico">${MC.icon(e.icon)}</div><div><b>${esc(e.name)}</b><span>${esc(why[e.type])} · ${e.minutes} min</span></div>${MC.icon('play')}</a>`).join('');
      MC.icons($('#smart-recommendations'));
    }, 700);

    // activities
    const acts = MC.data.activities().slice(0, 7);
    const icoFor = { mood: 'smile', breathing: 'wind', physical: 'person-standing', mindfulness: 'leaf', cognitive: 'notebook-pen' };
    $('#activities-list').innerHTML = acts.map((a) => `<div class="tl"><div class="dot" style="background:${cols[a.kind] || 'transparent'}">${a.kind === 'mood' ? MC.face(a.v) : MC.icon(icoFor[a.kind] || 'activity')}</div><div><b>${esc(a.title)}</b><small>${esc(a.meta)}</small></div><time>${MC.fmtAgo(a.ts)}</time></div>`).join('');
    $('#activity-count').textContent = acts.length + ' latest';
    if (!MC.data.hasRealMoods && !MC.data.hasRealSessions) $('#sample-note').style.display = '';
    MC.icons();
  });

  let chart;
  function drawChart() {
    const days = MC.dailyAverages(MC.data.moods()).slice(-14);
    const ctx = MC.$('#mood-chart').getContext('2d');
    const clay = MC.cssVar('--clay'), ink = MC.cssVar('--muted'), line = MC.cssVar('--line');
    const g = ctx.createLinearGradient(0, 0, 0, 260); g.addColorStop(0, clay + '66'); g.addColorStop(1, clay + '00');
    chart = new Chart(ctx, {
      type: 'line',
      data: { labels: days.map((d) => new Date(d.day + 'T12:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })), datasets: [{ data: days.map((d) => +d.avg.toFixed(2)), borderColor: clay, backgroundColor: g, fill: true, tension: 0.42, borderWidth: 3, pointRadius: days.length < 8 ? 4 : 0, pointBackgroundColor: clay, pointHoverRadius: 7, pointHoverBackgroundColor: MC.cssVar('--surface'), pointHoverBorderColor: clay, pointHoverBorderWidth: 3 }] },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 1600, easing: 'easeOutQuart' }, interaction: { intersect: false, mode: 'index' },
        scales: { y: { min: 1, max: 5, ticks: { stepSize: 1, color: ink, callback: (v) => ['', '😢', '😞', '😐', '🙂', '😊'][v] }, grid: { color: line }, border: { display: false } }, x: { ticks: { color: ink, maxTicksLimit: 7 }, grid: { display: false }, border: { display: false } } },
        plugins: { legend: { display: false }, tooltip: { backgroundColor: MC.cssVar('--ink'), titleColor: MC.cssVar('--bg'), bodyColor: MC.cssVar('--bg'), padding: 12, cornerRadius: 12, displayColors: false, callbacks: { label: (c) => 'Mood ' + c.parsed.y.toFixed(1) + ' / 5 · ' + MC.moodByValue(c.parsed.y).label } } }
      }
    });
  }

  function typeInto(el, text, done) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = text; done && done(); return; }
    el.textContent = ''; let i = 0;
    const t = setInterval(() => { el.textContent = text.slice(0, ++i); if (i >= text.length) { clearInterval(t); done && done(); } }, 18);
  }
})();
