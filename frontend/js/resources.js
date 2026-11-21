(function () {
  'use strict';
  const ART = [
    ['brain', 'Understanding Anxiety Disorders', 'Learn about symptoms, causes, and evidence-based treatments for anxiety disorders.', 8, 'Beginner', '#5a8f78',
      'Anxiety is the body’s alarm system firing when there may be no real danger. It becomes a disorder when it is persistent, out of proportion, and gets in the way of life.',
      ['Common signs: racing thoughts, tension, restlessness, trouble sleeping, avoidance.', 'Cognitive behavioural therapy (CBT) and exposure-based approaches have the strongest evidence.', 'Slow breathing, regular sleep, movement and less caffeine all help day to day.', 'Speak with a professional if worry is constant or you’re avoiding things you care about.']],
    ['heart', 'Depression: Signs and Solutions', 'Comprehensive guide to recognizing depression and finding effective treatment options.', 12, 'Intermediate', '#cf6f45',
      'Depression is more than sadness. It is a persistent low mood or loss of interest that lasts two weeks or more and affects sleep, appetite, energy and concentration.',
      ['Look for: low mood, loss of pleasure, fatigue, hopelessness, changes in sleep or appetite.', 'Therapy (CBT, behavioural activation, interpersonal) and sometimes medication are effective.', 'Small steps — daylight, movement, contact with people — help recovery along.', 'If you have thoughts of self-harm, contact a crisis line or emergency services straight away.']],
    ['shield', 'Building Mental Resilience', 'Practical strategies to develop emotional strength and bounce back from challenges.', 15, 'Advanced', '#7a9fb0',
      'Resilience isn’t a trait you either have or lack — it is a set of skills and supports that can be built over time.',
      ['Keep a few close, reliable relationships.', 'Treat setbacks as information, not verdicts.', 'Protect the basics: sleep, food, movement.', 'Practise self-compassion — speak to yourself as you would to a friend.']],
    ['bed', 'Sleep and Mental Health', 'Understanding the crucial connection between quality sleep and emotional well-being.', 10, 'Beginner', '#7a8fb8',
      'Sleep and mood influence each other: poor sleep worsens anxiety and low mood, and those in turn disturb sleep.',
      ['Keep regular sleep and wake times, even at weekends.', 'Dim screens and lights for an hour before bed.', 'Move worries to paper earlier in the evening.', 'If insomnia lasts weeks, ask a clinician about CBT for insomnia.']],
    ['users', 'Healthy Relationships', 'How to build and maintain supportive relationships that benefit mental health.', 11, 'Intermediate', '#d98b9a',
      'Supportive relationships are one of the strongest predictors of wellbeing. Good ones feel safe, honest and reciprocal.',
      ['Say what you need clearly and kindly.', 'Listen to understand before responding.', 'Boundaries protect relationships — they don’t end them.', 'Notice who leaves you feeling better, and make time for them.']],
    ['leaf', 'Mindfulness in Daily Life', 'Simple ways to incorporate mindfulness practices into your everyday routine.', 7, 'Beginner', '#86a38c',
      'Mindfulness is paying attention to the present moment, on purpose and without judgement. It can be practised in minutes.',
      ['Try one mindful routine a day: the first sip of tea, the walk to the bus.', 'When your mind wanders, gently return — that return is the practice.', 'Use short anchors: three breaths, five senses, feet on the floor.', 'Guided sessions in MindCare’s exercises make it easy to start.']]
  ];
  const TOOLS = [
    ['clipboard-check', 'Mental Health Assessment', 'Quick self-assessment to understand your current mental health status', 'Take assessment', 'assess'],
    ['heart-pulse', 'Stress Level Monitor', 'Track your stress levels and get personalized recommendations', 'Monitor stress', 'stress'],
    ['calendar-check', 'Mood Calendar', 'Visual calendar to track mood patterns and identify triggers', 'View calendar', 'calendar'],
    ['chart-pie', 'Progress Dashboard', 'Comprehensive view of your mental health journey and improvements', 'View progress', 'progress'],
    ['lightbulb', 'Coping Strategies', 'Personalized coping strategies based on your specific needs', 'Get strategies', 'coping'],
    ['book-heart', 'Wellness Journal', 'Digital journal with prompts for reflection and growth', 'Start journal', 'journal']
  ];
  const APPS = [
    ['smartphone', 'Headspace', 'Guided meditation and mindfulness exercises', '4.8', '#cf6f45', 'https://www.headspace.com'],
    ['brain', 'Calm', 'Sleep stories, meditation, and relaxation techniques', '4.7', '#7a9fb0', 'https://www.calm.com'],
    ['heart', 'Sanvello', 'Anxiety and mood tracking with CBT techniques', '4.5', '#86a38c', 'https://www.sanvello.com'],
    ['moon', 'Insight Timer', 'Free meditation library with timer and community', '4.9', '#7a8fb8', 'https://insighttimer.com']
  ];

  const $ = (s) => document.querySelector(s);
  const esc = (s) => MC.esc(s);
  const body = () => $('#res-body');
  const shell = (title, inner) => `<div class="modal-top"><h3>${esc(title)}</h3><button class="icon-btn" data-close aria-label="Close"><i data-lucide="x"></i></button></div>${inner}`;
  function show(html) { body().innerHTML = html; MC.open($('#res-modal')); MC.icons(body()); }

  MC.ready(function () {
    $('#articles').innerHTML = ART.map((a, i) => `<button class="art" data-reveal data-tilt="7" style="--c:${a[5]};--d:${i % 3}" data-art="${i}"><div class="cover">${MC.icon(a[0])}</div><div class="body"><h4>${esc(a[1])}</h4><p>${esc(a[2])}</p><div class="meta"><span>${MC.icon('clock')}${a[3]} min read</span><span class="tag">${a[4]}</span></div></div><span class="read">Read article ${MC.icon('arrow-right')}</span></button>`).join('');
    $('#tools').innerHTML = TOOLS.map((t, i) => `<button class="tool" data-reveal data-tool="${t[4]}" style="--d:${i % 3}"><div class="ic">${MC.icon(t[0])}</div><h4>${esc(t[1])}</h4><p>${esc(t[2])}</p><span class="cta">${esc(t[3])} ${MC.icon('arrow-right')}</span></button>`).join('');
    $('#apps').innerHTML = APPS.map((a, i) => `<div class="card app-c" data-reveal data-tilt="8" style="--c:${a[4]};--d:${i}"><div class="ico">${MC.icon(a[0])}</div><h4>${esc(a[1])}</h4><p>${esc(a[2])}</p><div class="rate"><span>★</span> ${a[3]}/5</div><a class="btn btn-sm btn-ghost" href="${a[5]}" target="_blank" rel="noopener">Visit site ${MC.icon('arrow-up-right')}</a></div>`).join('');
    MC.icons(); MC.reveal(); MC.tilt();

    document.addEventListener('click', (e) => {
      const a = e.target.closest('[data-art]'); if (a) return article(+a.dataset.art);
      const t = e.target.closest('[data-tool]'); if (t) return TOOLFN[t.dataset.tool]();
      const s = e.target.closest('[data-soon]'); if (s) { e.preventDefault(); MC.toast('Community links are coming soon', 'users'); }
    });
  });

  window.openModal = function (id) { ({ 'video-modal': videos, 'audio-modal': audio, 'sheet-modal': sheets })[id](); };

  function article(i) {
    const a = ART[i];
    show(shell(a[1], `<div class="row" style="gap:10px;margin:8px 0 16px"><span class="tag">${MC.icon('clock')}${a[3]} min</span><span class="tag clay">${a[4]}</span></div><p>${esc(a[6])}</p><ul class="takeaways">${a[7].map((x) => `<li>${MC.icon('check-circle-2')}<span>${esc(x)}</span></li>`).join('')}</ul><p class="muted" style="margin-top:18px;font-size:13.5px">General information, not medical advice. If you’re struggling, consider speaking with a licensed professional.</p><div class="help-actions"><a class="btn btn-clay btn-sm" href="therapist-directory.html">Find a therapist</a><a class="btn btn-ghost btn-sm" href="chatbot.html">Talk to AI</a></div>`));
  }

  function videos() {
    const V = [['5-Minute Mindfulness', 'Quick mindfulness practice for busy days'], ['Understanding Anxiety', 'Educational video about anxiety disorders'], ['Progressive Muscle Relaxation', 'Guided relaxation technique']];
    show(shell('Video library', `<div class="stack" style="margin-top:14px">${V.map((v) => `<button class="vid" data-v><div class="th">${MC.icon('play')}</div><div><b>${esc(v[0])}</b><span>${esc(v[1])}</span></div></button>`).join('')}</div><p class="soon-note" style="margin-top:18px">${MC.icon('info')}Videos are coming soon. Try a guided exercise in the meantime.</p>`));
    body().querySelectorAll('[data-v]').forEach((b) => b.addEventListener('click', () => MC.toast('This video is coming soon', 'video')));
  }

  /* Audio: generated ambient soundscapes (no downloads needed) */
  let nodes = null;
  function stopAudio() { if (!nodes) return; try { nodes.g.gain.linearRampToValueAtTime(0, nodes.ctx.currentTime + 0.6); setTimeout(() => nodes.ctx.close(), 700); } catch (e) {} nodes = null; }
  function audio() {
    const S = [['Soft rain', 'cloud-rain', 'rain'], ['Ocean waves', 'waves', 'ocean'], ['Calm drone', 'audio-waveform', 'drone']];
    show(shell('Audio meditations', `<p class="muted">Soothing soundscapes generated right in your browser. Press one to play, press again to stop.</p><div class="stack" style="margin-top:16px">${S.map((s) => `<button class="vid" data-snd="${s[2]}"><div class="th" style="background:var(--sage-d)">${MC.icon(s[1])}</div><div><b>${s[0]}</b><span class="st">Tap to play</span></div></button>`).join('')}</div>`));
    body().querySelectorAll('[data-snd]').forEach((b) => b.addEventListener('click', () => {
      const was = b.classList.contains('playing'); stopAudio(); body().querySelectorAll('[data-snd]').forEach((x) => { x.classList.remove('playing'); x.querySelector('.st').textContent = 'Tap to play'; });
      if (!was) { play(b.dataset.snd); b.classList.add('playing'); b.querySelector('.st').textContent = 'Playing… tap to stop'; }
    }));
    $('#res-modal').addEventListener('click', stopOnClose); document.addEventListener('keydown', (e) => e.key === 'Escape' && stopAudio(), { once: true });
  }
  function stopOnClose(e) { if (e.target.closest('[data-close]') || e.target.id === 'res-modal') stopAudio(); }
  function play(kind) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)(), g = ctx.createGain(); g.gain.value = 0; g.connect(ctx.destination); g.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 1.5);
    nodes = { ctx, g };
    if (kind === 'drone') { [110, 165, 220.5].forEach((f, i) => { const o = ctx.createOscillator(), og = ctx.createGain(); o.type = 'sine'; o.frequency.value = f; og.gain.value = 0.09 / (i + 1); const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 0.07 + i * 0.03; lg.gain.value = 0.04; l.connect(lg).connect(og.gain); o.connect(og).connect(g); o.start(); l.start(); }); return; }
    const len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0); let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = kind === 'rain' ? w * 0.5 : last * 3.5; }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true; const f = ctx.createBiquadFilter(); f.type = kind === 'rain' ? 'highpass' : 'lowpass'; f.frequency.value = kind === 'rain' ? 1800 : 700;
    if (kind === 'ocean') { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 0.09; lg.gain.value = 0.35; const sw = ctx.createGain(); sw.gain.value = 0.65; l.connect(lg).connect(sw.gain); src.connect(f).connect(sw).connect(g); l.start(); }
    else src.connect(f).connect(g);
    src.start();
  }

  function sheets() {
    const W = [['Thought record', 'Catch a thought, test the evidence, find a balanced view.', ['Situation', 'Automatic thought', 'Feeling (0–100)', 'Evidence for', 'Evidence against', 'Balanced thought']],
      ['Weekly wellbeing plan', 'Plan sleep, movement, connection and rest for the week.', ['Sleep goal', 'Movement', 'Time with people', 'Something enjoyable', 'One boundary to keep']],
      ['Grounding card', 'A pocket card for moments of panic.', ['5 things I can see', '4 things I can feel', '3 things I can hear', '2 things I can smell', '1 thing I can taste']]];
    show(shell('Worksheets', `<p class="muted">Download a printable text worksheet.</p><div class="stack" style="margin-top:16px">${W.map((w, i) => `<button class="vid" data-w="${i}"><div class="th" style="background:var(--clay)">${MC.icon('file-down')}</div><div><b>${w[0]}</b><span>${w[1]}</span></div></button>`).join('')}</div>`));
    body().querySelectorAll('[data-w]').forEach((b) => b.addEventListener('click', () => {
      const w = W[+b.dataset.w], txt = w[0].toUpperCase() + '\n' + '='.repeat(w[0].length) + '\n\nDate: ____________\n\n' + w[2].map((f) => f + ':\n\n\n').join('') + '\nMindCare — general self-help material, not medical advice.\n';
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' })); a.download = w[0].toLowerCase().replace(/\s+/g, '-') + '.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); MC.toast('Worksheet downloaded', 'file-down');
    }));
  }

  const TOOLFN = {
    assess() {
      const Q = ['Little interest or pleasure in doing things', 'Feeling down, depressed, or hopeless', 'Trouble falling or staying asleep, or sleeping too much', 'Feeling nervous, anxious, or on edge', 'Not being able to stop or control worrying'];
      const O = ['Not at all', 'Several days', 'More than half', 'Nearly every day']; const ans = Array(Q.length).fill(null);
      show(shell('Quick check-in', `<p class="muted">Over the last two weeks, how often have you been bothered by the following? This is a screening aid, not a diagnosis.</p>${Q.map((q, i) => `<div class="q-row"><b>${q}</b><div class="opts" data-q="${i}">${O.map((o, j) => `<button data-j="${j}">${o}</button>`).join('')}</div></div>`).join('')}<div id="as-res"></div><div class="row" style="justify-content:flex-end;margin-top:20px"><button class="btn btn-clay" id="as-go">See my result</button></div>`));
      body().querySelectorAll('.opts').forEach((o) => o.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; ans[+o.dataset.q] = +b.dataset.j; o.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); }));
      $('#as-go').addEventListener('click', () => {
        if (ans.includes(null)) return MC.toast('Please answer every question', 'circle-alert');
        const s = ans.reduce((a, b) => a + b, 0), lvl = s <= 4 ? ['Minimal', 'Your answers suggest few current symptoms. Keep up the habits that help.'] : s <= 9 ? ['Mild', 'Some symptoms are showing up. Exercises, sleep and talking with someone you trust can help.'] : s <= 14 ? ['Moderate', 'Your symptoms may be affecting daily life. Consider speaking with a professional.'] : ['High', 'Your answers suggest significant distress. Please consider reaching out to a professional soon.'];
        MC.store.set('assessment', { ts: Date.now(), score: s });
        $('#as-res').innerHTML = `<div class="result-box"><b>${lvl[0]} · score ${s}/${Q.length * 3}</b>${lvl[1]}<div class="help-actions"><a class="btn btn-sm btn-clay" href="therapist-directory.html">Find a therapist</a><button class="btn btn-sm btn-ghost" data-crisis>Support options</button></div></div>`;
        $('#as-res').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    },
    stress() {
      show(shell('Stress level monitor', `<p class="muted">Rate your stress right now.</p><div class="intensity" style="margin:22px 0"><input type="range" id="st" min="1" max="10" value="5"><output><span id="stv">5</span><small>/10</small></output></div><button class="btn btn-clay btn-block" id="st-go">Get recommendations</button><div id="st-res"></div>`));
      $('#st').addEventListener('input', (e) => ($('#stv').textContent = e.target.value));
      $('#st-go').addEventListener('click', () => {
        const v = +$('#st').value, r = v <= 3 ? ['Low', 'You’re in a good place. A short mindfulness practice will keep it that way.', 'exercises.html?type=mindfulness', 'Mindfulness'] : v <= 6 ? ['Moderate', 'Some tension is building. Movement or box breathing can release it.', 'exercises.html?start=box-breathing', 'Box breathing'] : ['High', 'Let’s bring this down: slow breathing with long exhales, then a worry dump.', 'exercises.html?start=calm-belly', 'Calm belly breathing'];
        const h = MC.store.get('stress', []); h.push({ ts: Date.now(), v }); MC.store.set('stress', h.slice(-30));
        $('#st-res').innerHTML = `<div class="result-box"><b>${r[0]} stress</b>${r[1]}<div class="help-actions"><a class="btn btn-sm btn-clay" href="${r[2]}">${r[3]}</a></div></div>`;
      });
    },
    calendar() {
      const m = MC.data.moods(), by = {}; m.forEach((x) => (by[MC.dayKey(x.ts)] = (by[MC.dayKey(x.ts)] || []).concat(x.value)));
      const now = new Date(), y = now.getFullYear(), mo = now.getMonth(), first = new Date(y, mo, 1), n = new Date(y, mo + 1, 0).getDate(), pad = (first.getDay() + 6) % 7;
      let cells = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => `<div class="h">${d}</div>`).join('') + '<div></div>'.repeat(pad);
      for (let d = 1; d <= n; d++) { const k = y + '-' + String(mo + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0'), a = by[k] ? MC.math.mean(by[k]) : null; cells += `<div class="d ${a ? 'has' : ''} ${d === now.getDate() ? 'today' : ''}" style="${a ? 'background:' + MC.moodByValue(a).color : ''}" title="${a ? MC.moodByValue(a).label : 'No entry'}">${d}</div>`; }
      show(shell('Mood calendar — ' + now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }), `<div class="cal">${cells}</div><div class="legend">${MC.MOODS.map((x) => `<span><i style="background:${x.color}"></i>${x.label}</span>`).join('')}</div>${MC.data.hasRealMoods ? '' : '<p class="soon-note" style="margin-top:16px">' + MC.icon('info') + 'Showing example data until you log a mood.</p>'}<div class="help-actions"><a class="btn btn-sm btn-clay" href="mood-tracker.html">Log a mood</a></div>`));
    },
    progress() {
      const w = MC.insights.week(), s = MC.insights.streak(), sc = MC.insights.success(), p = MC.insights.predict();
      show(shell('Your progress', `<div class="stat-row" style="margin:16px 0"><div class="stat-big"><b>${w.sessions}</b><span>Sessions / wk</span></div><div class="stat-big"><b>${w.minutes}</b><span>Minutes</span></div><div class="stat-big"><b>${s}</b><span>Day streak</span></div></div><div class="ml-list"><div class="ml-item"><div class="ico">${MC.icon('target')}</div><div><small>Success rate</small><b>${esc(sc.text)}</b></div></div><div class="ml-item"><div class="ico">${MC.icon('trending-up')}</div><div><small>Mood outlook</small><b>${esc(p.text)}</b></div></div></div><div class="help-actions"><a class="btn btn-sm btn-clay" href="dashboard.html">Open dashboard</a></div>`));
    },
    coping() {
      const tr = MC.insights.topTriggers(2), tips = { work: 'Set one boundary today (a hard stop time or a no-meeting block) and take a real break away from the screen.', sleep: 'Anchor your wake time, dim lights an hour before bed, and try 4-7-8 breathing.', relationships: 'Name what you need in one sentence, then share it kindly — or write it first and decide later.', health: 'Pick one small caring action: water, a walk, or booking the appointment you’ve been delaying.', finances: 'Write down the numbers, then one next step. Facing it on paper is usually smaller than in your head.', family: 'Plan a short recharge before and after family time. A short walk counts.', weather: 'Get outside in daylight for 10 minutes, even when it’s grey.', other: 'Try a worry dump to find out what’s underneath.' };
      const list = tr.length ? tr : ['work', 'sleep'];
      show(shell('Coping strategies', `<p class="muted">${tr.length ? 'Based on the triggers you log most:' : 'Starter strategies — log moods with triggers to personalise these.'}</p><div class="stack" style="margin-top:14px">${list.map((t) => `<div class="result-box" style="margin:0"><b style="text-transform:capitalize">${t}</b>${esc(tips[t] || tips.other)}</div>`).join('')}<div class="result-box" style="margin:0"><b>Anytime</b>Slow exhale breathing, a short walk, or messaging someone you trust.</div></div><div class="help-actions"><a class="btn btn-sm btn-clay" href="exercises.html">Try an exercise</a></div>`));
    },
    journal() {
      const P = ['What is one thing I’m carrying today?', 'What made me smile recently?', 'What do I need more of this week?', 'What would I tell a friend in my situation?'];
      const render = () => MC.store.get('journal', []).slice().reverse().slice(0, 12).map((j) => `<div><small>${new Date(j.ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}${j.prompt ? ' · ' + esc(j.prompt) : ''}</small>${esc(j.text)}</div>`).join('') || '<p class="muted">No entries yet.</p>';
      show(shell('Wellness journal', `<p class="muted" id="jp">${P[new Date().getDate() % P.length]}</p><textarea class="field" id="jt" placeholder="Write freely — this stays on your device." style="margin-top:12px"></textarea><div class="row" style="justify-content:space-between;margin-top:12px"><button class="btn btn-sm btn-ghost" id="jn">New prompt</button><button class="btn btn-sm btn-clay" id="js">Save entry</button></div><div class="journal-list" id="jl">${render()}</div>`));
      $('#jn').addEventListener('click', () => ($('#jp').textContent = P[Math.floor(Math.random() * P.length)]));
      $('#js').addEventListener('click', () => { const t = $('#jt').value.trim(); if (!t) return; const j = MC.store.get('journal', []); j.push({ ts: Date.now(), prompt: $('#jp').textContent, text: t }); MC.store.set('journal', j); $('#jt').value = ''; $('#jl').innerHTML = render(); MC.toast('Entry saved', 'check-circle'); });
    }
  };
})();
