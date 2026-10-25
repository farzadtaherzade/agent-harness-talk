
  /* ==========================================================
     13-SLIDE EDITION
     timeline · anatomy live-demo · replay preload/autoplay
     playground preset · teaser · terminal reel · help overlay
     ========================================================== */

  /* ---------- 1. timeline (agenda): fill + "you are here" ---------- */
  const tlHere = $('#tlHere'), tlFill = $('#tlFill');
  const tlSegs = $$('.tl-seg');
  function sectionStart(i){
    let acc = 0;
    for (const s of SECTIONS){
      if (i >= s.from && i <= s.to) return acc;
      acc += s.min * 60;
    }
    return acc;
  }
  function paintTimeline(){
    if (!tlHere) return;
    const p = Math.max(0, Math.min(1, tSec / (TOTAL || 1)));
    tlHere.style.right = (p * 100).toFixed(2) + '%';
    if (tlFill) tlFill.style.width = (p * 100).toFixed(2) + '%';
    const s = sectionOf(currentIndex);
    const over = tSec > sectionStart(currentIndex) + s.min * 60;
    tlHere.classList.toggle('over', over);
    if (hudTimer) hudTimer.classList.toggle('over', over);
  }
  const _paintTimer0 = paintTimer;
  paintTimer = function(){ _paintTimer0(); paintTimeline(); };
  tlSegs.forEach(seg => on(seg, 'click', () => {
    document.dispatchEvent(new CustomEvent('deck:goto', { detail:{ index: +seg.dataset.goto } }));
  }));

  /* ---------- 2. anatomy: live mini-demo per part ---------- */
  const AD_LINES = {
    loop:   ['loop: step = policy.decide(state)', 'loop: budget.check(step) → allow', 'loop: step 3/8 → continue'],
    tools:  ['registry: 7 tools loaded', 'registry: read_file(path) → schema ok', 'tool: dispatching inside sandbox'],
    memory: ['memory: append(observation)', 'memory: short-term = 12 events', 'memory: long-term → facts[]'],
    guard:  ['guard: action = shell(rm -rf /)', 'guard: policy = deny → BLOCKED', 'guard: human approval → not needed'],
    budget: ['budget: steps 3/8 · tokens 4.9k/32k', 'budget: cost $0.43 → within cap', 'budget: cap 32k → keep going'],
    context:['context: tokens 8,220/32,000', 'context: compaction @80% → summary', 'context: window refreshed'],
    log:    ['log: append(event, step, tokens)', 'log: trace_id = run-7f3a', 'log: every step replayable']
  };
  const adLog = $('#anatDemo'), adState = $('#adState');
  let adTimer = null;
  function adShow(part){
    if (!adLog) return;
    const lines = AD_LINES[part] || [];
    if (adState) adState.textContent = String(part || '').toUpperCase();
    clearInterval(adTimer);
    let li = 0, ci = 0;
    adLog.textContent = '';
    adTimer = setInterval(() => {
      if (li >= lines.length){ clearInterval(adTimer); adTimer = null; return; }
      if (ci === 0) adLog.textContent += (li ? '\n' : '') + '$ ';
      const line = lines[li];
      if (ci < line.length) adLog.textContent += line[ci++];
      else { li++; ci = 0; }
      adLog.scrollTop = adLog.scrollHeight;
    }, 16);
  }
  const _paintAnat0 = paintAnat;
  paintAnat = function(part){ _paintAnat0(part); adShow(part); };

  /* ---------- 3. ReAct: live phase in the middle of the ring ---------- */
  const PHASE_LIVE = [
    { k:'فکر',    s:'THOUGHT',    c:'#a78bfa' },
    { k:'عمل',    s:'ACTION',     c:'#38bdf8' },
    { k:'مشاهده', s:'OBSERVATION', c:'#10b981' },
    { k:'حافظه',  s:'MEMORY',     c:'#f59e0b' }
  ];
  const loopLive = $('#loopLive');
  function loopLiveSet(i){
    if (!loopLive) return;
    const p = PHASE_LIVE[Math.max(0, Math.min(3, i))];
    loopLive.innerHTML = '<b>' + p.k + '</b><span>' + p.s + '</span>';
    loopLive.style.setProperty('--c', p.c);
  }
  const reactState = document.getElementById('reactState');
  if (reactState && window.MutationObserver){
    new MutationObserver(() => {
      const m = /(\d+)\s*\/\s*(\d+)/.exec(reactState.textContent || '');
      loopLiveSet(m ? (+m[1]) - 1 : 0);
    }).observe(reactState, { childList:true, characterData:true, subtree:true });
    loopLiveSet(0);
  }

  /* ---------- 4. replay: preload transcript + autoplay + tool chip ---------- */
  RP_EVENTS.forEach(e => { e.dur = e.k === 'user' ? 900 : Math.max(1200, Math.min(1800, e.dur || 1400)); });
  const rpGhost = $('#rpGhost'), rpTool = $('#rpTool');
  function rpGhostRender(){
    if (!rpGhost) return;
    rpGhost.innerHTML = RP_EVENTS.slice(rpIdx + 1).map(e =>
      '<div class="rp-msg rp-ghost ' + e.k + (e.err ? ' err' : '') + '">' +
      '<span class="who">' + e.who + (e.tool ? ' · ' + e.tool : '') + '</span>' +
      (e.k === 'tool' ? '<span class="code">' + e.txt + '</span>' : e.txt) + '</div>').join('');
  }
  const _rpStep0 = rpStep;
  rpStep = function(){
    _rpStep0();
    const e = RP_EVENTS[rpIdx];
    if (rpTool) rpTool.textContent = e ? (e.tool || e.who) : '—';
    rpGhostRender();
  };
  const _rpReset0 = rpReset;
  rpReset = function(){
    _rpReset0();
    const first = rpLog && rpLog.querySelector('.rp-msg');
    if (first) first.innerHTML = '▶ اجرای خودکار شروع می‌شود — ۷ فراخوانی ابزار، ۱ خطای واقعی و ۲ اصلاح در این جلسه.';
    if (rpTool) rpTool.textContent = '—';
    rpGhostRender();
  };
  function rpAutoplay(){
    rpReset();
    setTimeout(() => { if (!rpTimer) rpPlayNext(); }, 1100);
  }

  /* ---------- 5. playground: one-click preset ---------- */
  const pgSample = $('#pgSample');
  on(pgSample, 'click', () => {
    $$('.pg-goal').forEach(g => { if (g.dataset.goal === 'bug' && !g.classList.contains('on')) g.click(); });
    $$('.pg-tool').forEach(t => { if (!t.classList.contains('on')) t.click(); });
    $$('.pg-guard input').forEach(i => { if (!i.checked){ i.checked = true; i.dispatchEvent(new Event('change')); } });
    const run = $('#pgRun'); if (run) run.click();
  });

  /* ---------- 6. divider teaser: typing loop ---------- */
  const TEASER = [
    'user › fix the failing billing test',
    'harness › read_file(billing/report.py)',
    'tool  › 128 lines · 2 suspicious',
    'tool  › shell(pytest -q) → exit 1',
    'harness › line 42 → ZeroDivisionError',
    'tool  › edit(+2 −1)',
    'tool  › shell(pytest -q) → exit 0  ✓'
  ];
  const teaserLog = $('#teaserLog');
  let teaserTimer = null, teaserLi = 0, teaserCi = 0, teaserHold = 0, teaserClear = false;
  function teaserTick(){
    if (!teaserLog) return;
    if (teaserClear){ teaserLog.textContent = ''; teaserClear = false; }
    if (teaserHold > 0){ teaserHold--; return; }
    if (teaserCi === 0 && teaserLi > 0) teaserLog.textContent += '\n';
    const line = TEASER[teaserLi % TEASER.length];
    if (teaserCi < line.length) teaserLog.textContent += line[teaserCi++];
    else {
      teaserCi = 0; teaserLi++;
      if (teaserLi % TEASER.length === 0){ teaserHold = 30; teaserClear = true; teaserLi = 0; }
    }
    teaserLog.scrollTop = teaserLog.scrollHeight;
  }
  function teaserStart(){ if (!teaserTimer) teaserTimer = setInterval(teaserTick, 16); }

  /* ---------- 7. live-demo terminal reel ---------- */
  const TERM = [
    '$ claude "fix the failing billing test"',
    '▸ reading billing/report.py … 128 lines',
    '▸ running pytest -q … 1 failed',
    '▸ ZeroDivisionError at report.py:42',
    '▸ patching line 42 … +2 −1',
    '▸ running pytest -q … all green ✓',
    '$ _'
  ];
  const termReel = $('#termReel');
  let termTimer = null, termLi = 0, termCi = 0, termHold = 0, termClear = false;
  function termTick(){
    if (!termReel) return;
    if (termClear){ termReel.textContent = ''; termClear = false; }
    if (termHold > 0){ termHold--; return; }
    if (termCi === 0 && termLi > 0) termReel.textContent += '\n';
    const line = TERM[termLi % TERM.length];
    if (termCi < line.length) termReel.textContent += line[termCi++];
    else {
      termCi = 0; termLi++;
      if (termLi % TERM.length === 0){ termHold = 35; termClear = true; termLi = 0; }
    }
    termReel.scrollTop = termReel.scrollHeight;
  }
  function termStart(){ if (!termTimer) termTimer = setInterval(termTick, 18); }

  /* ---------- 8. help overlay (?) ---------- */
  const helpEl = document.createElement('div');
  helpEl.className = 'help-overlay';
  helpEl.innerHTML = '<div class="help-card"><h3>کلیدهای ارائه</h3><ul>' +
    '<li><kbd>←</kbd><kbd>→</kbd><kbd>Space</kbd> جابه‌جایی بین اسلایدها</li>' +
    '<li><kbd>F</kbd> تمام‌صفحه</li>' +
    '<li><kbd>S</kbd> یادداشت‌های ارائه‌دهنده</li>' +
    '<li><kbd>T</kbd> تایمر ۳۰ دقیقه <em>(Shift+T بازنشانی)</em></li>' +
    '<li><kbd>C</kbd> حالت تمیز (پنهان‌کردن رابط)</li>' +
    '<li><kbd>?</kbd> بستن همین راهنما</li></ul></div>';
  document.body.appendChild(helpEl);
  on(helpEl, 'click', () => helpEl.classList.remove('on'));
  document.addEventListener('keydown', e => {
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.key === '?' || (e.key === '/' && e.shiftKey)){
      e.preventDefault();
      helpEl.classList.toggle('on');
    }
  });

  /* ---------- 8b. fund slide: the four layers drive a live readout ---------- */
  const FUND_EQ = [
    'model = f(prompt) → text',
    'model + tools = one action, one answer',
    'agent = model + tools + loop',
    'harness = prompt + tools + loop + policy + memory + log'
  ];
  const FUND_NOTE = [
    'مدل تنها: خطا یعنی از صفر شروع کن؛ بین دو فراخوانی هیچ حافظه‌ای نیست.',
    'مدل + ابزار: می‌تواند بخواند و اجرا کند، اما گام بعدی را شما انتخاب می‌کنید.',
    'مدل + ابزار + حلقه: حلقه مالکِ جریان است — همین‌جا «ایجنت» متولد می‌شود.',
    'هارنس: حلقه + سیاست + بودجه + حافظه + لاگ — رفتارِ قابل‌اتکا در تولید.'
  ];
  const FUND_C = ['#8497b1','#38bdf8','#10b981','#f59e0b'];
  const FUND_N = ['۰۱','۰۲','۰۳','۰۴'];
  const fundDetEl = document.getElementById('fundDetail');
  let fundLock = false;
  function fundApply(i){
    if (!fundDetEl) return;
    const k = i % 4;
    fundDetEl.style.setProperty('--c', FUND_C[k]);
    fundDetEl.innerHTML = '<b>لایهٔ ' + FUND_N[k] + '</b> <code>' + FUND_EQ[k] + '</code> — ' + FUND_NOTE[k];
  }
  const _paintFund0 = paintFund;
  paintFund = function(i){
    if (fundLock) return;          // auto-build stops once the presenter picks a layer
    _paintFund0(i);
    fundApply(i);
  };
  fundRows.forEach((r, k) => on(r, 'click', () => { fundLock = true; fundApply(k); }));

  /* ---------- 9. per-slide react (nav hiding, timeline, teasers) ---------- */
  document.addEventListener('deck:slide', e => {
    const slide = document.querySelector('.slide.active');
    const id = slide ? slide.id : '';
    fundLock = false;
    document.body.classList.toggle('hide-nav', id === 'replaySlide');
    tlSegs.forEach((seg, k) => {
      const s = SECTIONS[k];
      seg.classList.toggle('on', !!s && currentIndex >= s.from && currentIndex <= s.to);
    });
    paintTimeline();
  });

  /* ---------- 9b. keyboard + screen-reader support ---------- */
  // divs that behave like buttons (mouse-only until now)
  ['.fund-row', '.phase', '.anat-part'].forEach(sel => {
    $$(sel).forEach(el => {
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); e.stopPropagation();
          if (el.click) el.click(); else el.dispatchEvent(new MouseEvent('click', { bubbles:true })); }
      });
    });
  });
  // live regions for the readouts that change while you talk
  ['fundDetail', 'anatTitle', 'anatText', 'adState', 'pgState', 'ctxUsed'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.setAttribute('aria-live', 'polite');
  });

  /* ---------- 9c. fit the stage: scale the deck down on short screens ---------- */
  // the deck is laid out for ~1440×900; on a 720p projector (or a window that is
  // not full screen) the stage is scaled down instead of letting content spill
  // under the HUD. Narrow screens keep their own one-column layout.
  const deckEl = document.getElementById('deck');
  function fitDeck(){
    const s = innerWidth >= 1000 ? Math.min(1, innerWidth / 1280, innerHeight / 720) : 1;
    deckEl.style.zoom = s === 1 ? '' : s;
  }
  fitDeck();
  addEventListener('resize', fitDeck);

  teaserStart();
  termStart();
  paintTimeline();
