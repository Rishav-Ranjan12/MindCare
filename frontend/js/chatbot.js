/* Chat: persistent history, settings, crisis detection, on-device reply engine */
(function () {
  'use strict';
  const CRISIS = /\b(suicid\w*|kill (myself|me)|end (my life|it all)|want to die|don'?t want to (live|be here)|self[- ]?harm|hurt myself|cut myself|no reason to live|better off dead)\b/i;
  const QUICK = [['😰', "I'm feeling anxious"], ['🫁', 'I need breathing exercises'], ['😴', "I'm having trouble sleeping"], ['😵', 'I feel overwhelmed']];
  const WELCOME = "Hello! I'm your MindCare AI assistant. I'm here to provide support, guidance, and personalized recommendations for your mental wellness journey. How are you feeling today?";

  const A = {
    breathe: ['wind', 'Start a breathing exercise', 'exercises.html?type=breathing'],
    ground: ['anchor', '5-4-3-2-1 grounding', 'exercises.html?start=grounding-54321'],
    sleep: ['moon', '4-7-8 breathing', 'exercises.html?start=478'],
    body: ['scan-line', 'Body scan', 'exercises.html?start=body-scan'],
    move: ['person-standing', 'Quick stretch', 'exercises.html?start=desk-reset'],
    dump: ['notebook-pen', 'Worry dump', 'exercises.html?start=worry-dump'],
    reframe: ['repeat', 'Reframe a thought', 'exercises.html?start=thought-reframe'],
    thanks: ['sparkles', 'Three good things', 'exercises.html?start=gratitude-three'],
    kind: ['heart-handshake', 'Loving-kindness', 'exercises.html?start=loving-kindness'],
    mood: ['activity', 'Log my mood', 'mood-tracker.html'],
    therapist: ['stethoscope', 'Find a therapist', 'therapist-directory.html'],
    res: ['library', 'Resources', 'resources.html']
  };

  // each intent: regex, replies (rotated), suggested action keys
  const INTENTS = [
    { re: /\b(panic|can'?t breathe|heart (is )?racing|hyperventilat)/i, a: ['breathe', 'ground'],
      r: ["That sounds really intense, and I'm glad you told me. You're safe right now. Let's slow things down together: breathe in through your nose for 4, then out through your mouth for 6. Repeat a few times.", "Panic peaks and then passes — it can't hurt you, even though it feels awful. Try to name five things you can see around you while your breathing slows."] },
    { re: /\b(anxi|anxious|nervous|worried|worry|on edge|stress(ed)?)\b/i, a: ['breathe', 'ground', 'dump'],
      r: ["I'm sorry you're feeling anxious — that's an exhausting place to be. Anxiety is your body's alarm going off, and the good news is you can turn the volume down. Slow, long exhales are the quickest lever.", "Thank you for sharing that. Is the worry about something specific, or more of a general hum? Either way, writing it out or grounding yourself in the present can take the edge off."] },
    { re: /\b(breath(e|ing)|calm down|relax)\b/i, a: ['breathe', 'sleep'],
      r: ["Breathing exercises are one of the fastest ways to calm your nervous system. Box breathing (4-4-4-4) is great for focus, 4-7-8 for winding down, and belly breathing for anxiety. Which sounds right for you?"] },
    { re: /\b(sleep|insomnia|can'?t sleep|awake|tired|restless|nightmare)\b/i, a: ['sleep', 'body', 'dump'],
      r: ["Trouble sleeping is so draining. A few things that help: keep a regular wake time, dim lights an hour before bed, and park your worries on paper earlier in the evening. In the moment, a slow 4-7-8 breath or a body scan can help your body let go.", "When the mind won't switch off, don't fight it. Try a body scan, moving attention slowly from head to toe — it gives your thoughts something gentle to do."] },
    { re: /\b(overwhelm\w*|too much|swamped|burn(ed|t)? ?out|exhaust\w*|drowning)\b/i, a: ['dump', 'breathe', 'move'],
      r: ["Feeling overwhelmed means you're carrying a lot. You don't have to solve it all at once. Let's shrink it: what's the one smallest thing that would make today feel 5% lighter?", "That's a lot to hold. Getting everything out of your head and onto paper often helps — then we can pick one tiny next step. Want to try a worry dump?"] },
    { re: /\b(sad|down|depress\w*|empty|hopeless|low|crying|cry|numb|lonely|alone)\b/i, a: ['thanks', 'kind', 'therapist'],
      r: ["I'm really sorry you're hurting. Thank you for putting it into words — that takes courage. You don't have to feel better right now; I'm here with you. What has today been like?", "Low moods can make everything feel heavier and more permanent than it is. Small, kind actions — water, light, a short walk, a message to someone — can nudge things. If this has lasted more than a couple of weeks, talking with a professional can really help."] },
    { re: /\b(angry|furious|mad|irritat\w*|frustrat\w*|rage)\b/i, a: ['breathe', 'move'],
      r: ["Anger is often a signal that something important feels crossed. Before reacting, give your body a moment — a few long exhales or a brisk walk can bring the heat down so you can choose your response."] },
    { re: /\b(happy|great|good|wonderful|better|excited|proud|grateful|amazing)\b/i, a: ['thanks', 'mood'],
      r: ["That's lovely to hear! 🌱 Noticing good moments helps them stick. What's one thing that contributed to feeling this way?"] },
    { re: /\b(focus|concentrat\w*|distract\w*|procrastinat\w*|motivat\w*)\b/i, a: ['breathe', 'move'],
      r: ["Focus is tough when your mind is busy. Try a 2-minute reset — box breathing, then pick just one task and work on it for 10 minutes. Starting is the hardest part."] },
    { re: /\b(therap\w*|counsel\w*|psychiatr\w*|professional|doctor)\b/i, a: ['therapist', 'res'],
      r: ["Reaching out to a professional is a strong step. In the directory you can filter by specialty and location, and contact people directly by email or phone."] },
    { re: /\b(thank(s| you)?|thx)\b/i, a: [], r: ["You're very welcome. I'm here whenever you need me. 💚"] },
    { re: /^(hi|hello|hey|good (morning|evening|afternoon))\b/i, a: ['mood'], r: ["Hi there! It's good to see you. How are you feeling right now — in a word or two?"] },
    { re: /\b(who are you|are you (a )?(bot|real|human)|what are you)\b/i, a: [], r: ["I'm MindCare's AI assistant — a computer program, not a person or a therapist. I can listen, offer coping ideas and point you to exercises, and I'll always encourage you to reach real people when it matters."] }
  ];
  const FALLBACK = ["I hear you. Can you tell me a bit more about what's going on? There's no wrong way to say it.", "Thanks for sharing that with me. What feels hardest about it right now?", "I'm listening. If it helps, we can try an exercise together, or you can just talk — whichever feels better."];

  let history = MC.store.get('chat', []), busy = false, fb = 0, rot = {};
  const $ = MC.$, esc = MC.esc;
  const time = (ts) => new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  MC.ready(function () {
    if (!history.length) history = [{ role: 'ai', text: WELCOME, ts: Date.now(), welcome: true }];
    render();
    MC.icons();

    const f = $('#chat-form'), inp = $('#message-input');
    f.addEventListener('submit', (e) => { e.preventDefault(); const t = inp.value.trim(); if (t) { inp.value = ''; suggest(''); send(t); } });
    inp.addEventListener('input', () => suggest(inp.value));
    $('#attach-btn').addEventListener('click', () => MC.toast('Attachments aren’t available yet', 'paperclip'));
    $('#clear-btn').addEventListener('click', () => { if (confirm('Clear this conversation?')) { history = [{ role: 'ai', text: WELCOME, ts: Date.now(), welcome: true }]; MC.store.set('chat', history); render(); } });

    // settings
    const S = $('#settings-panel');
    $('#settings-btn').addEventListener('click', () => { $('#response-speed').value = MC.settings.speed; $('#chat-theme').value = MC.settings.theme; $('#crisis-detection').checked = MC.settings.crisis; MC.open(S); });
    $('#response-speed').addEventListener('change', (e) => { MC.settings.speed = e.target.value; MC.saveSettings(); });
    $('#chat-theme').addEventListener('change', (e) => MC.setTheme(e.target.value));
    $('#crisis-detection').addEventListener('change', (e) => { MC.settings.crisis = e.target.checked; MC.saveSettings(); });

    $('#chat-messages').addEventListener('click', (e) => {
      const q = e.target.closest('[data-q]'); if (q) { send(q.dataset.q); return; }
      if (e.target.closest('[data-crisis]')) MC.openCrisis();
    });
    inp.focus({ preventScroll: true });
  });

  function suggest(v) {
    const box = $('#input-suggestions'); v = v.toLowerCase().trim();
    const pool = ["I'm feeling anxious", 'I need breathing exercises', "I'm having trouble sleeping", 'I feel overwhelmed', 'I feel sad and low', 'Help me focus', 'I want to talk to a therapist'];
    const m = v.length > 1 ? pool.filter((p) => p.toLowerCase().includes(v) && p.toLowerCase() !== v).slice(0, 3) : [];
    box.innerHTML = m.map((p) => `<button type="button">${esc(p)}</button>`).join('');
    box.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { $('#message-input').value = ''; box.innerHTML = ''; send(b.textContent); }));
  }

  function render() {
    const c = $('#chat-messages');
    c.innerHTML = history.map(row).join('') + (history.length === 1 ? `<div class="quick">${QUICK.map((q) => `<button class="chip" data-q="${esc(q[1])}">${q[0]} ${esc(q[1].replace("I'm ", "I'm ").replace(/^I need /, 'Need '))}</button>`).join('')}</div>` : '');
    MC.icons(c); c.scrollTop = c.scrollHeight;
  }

  function row(m) {
    const acts = (m.acts || []).map((k) => `<a href="${A[k][2]}">${MC.icon(A[k][0])}${A[k][1]}</a>`).join('') + (m.crisis ? `<button data-crisis>${MC.icon('life-buoy')}Support options</button>` : '');
    return `<div class="msg ${m.role}">${m.role === 'ai' ? `<div class="av">${MC.icon('sparkles')}</div>` : ''}<div class="bub"><p>${esc(m.text).replace(/\n/g, '</p><p>')}</p>${acts ? `<div class="acts">${acts}</div>` : ''}<time>${m.welcome ? 'Just now' : time(m.ts)}</time></div></div>`;
  }

  function push(m) {
    history.push(m); MC.store.set('chat', history.slice(-60));
    const c = $('#chat-messages'); c.querySelector('.quick')?.remove();
    c.insertAdjacentHTML('beforeend', row(m)); MC.icons(c); c.scrollTop = c.scrollHeight;
  }

  function reply(text) {
    if (MC.settings.crisis && CRISIS.test(text)) {
      return { text: "I'm really glad you told me, and I'm concerned about you. You deserve support from a real person right now. Please reach out to a crisis line — they're free, confidential and open 24/7. If you're in immediate danger, call your local emergency number.\n\nI'm still here with you too. Would you tell me what's been happening?", acts: ['therapist'], crisis: true };
    }
    const it = INTENTS.find((i) => i.re.test(text));
    if (it) { rot[it.re] = ((rot[it.re] ?? -1) + 1) % it.r.length; return { text: it.r[rot[it.re]], acts: it.a }; }
    return { text: FALLBACK[fb++ % FALLBACK.length], acts: fb % 2 ? ['mood'] : ['breathe'] };
  }

  function send(text) {
    if (busy) return; busy = true;
    push({ role: 'user', text, ts: Date.now() });
    const r = reply(text);
    if (r.crisis) setTimeout(() => MC.openCrisis(), 500);
    const base = { fast: 0, normal: 1200, slow: 3000 }[MC.settings.speed] ?? 1200;
    const delay = base ? base + Math.min(900, r.text.length * 4) : 0;
    const ty = $('#typing-indicator');
    if (delay) { ty.style.display = 'flex'; MC.icons(ty); $('#chat-messages').scrollTop = 1e9; }
    setTimeout(() => { ty.style.display = 'none'; push(Object.assign({ role: 'ai', ts: Date.now() }, r)); busy = false; }, delay);
  }
})();
