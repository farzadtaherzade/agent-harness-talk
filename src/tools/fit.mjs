// Fit check: node src/tools/fit.mjs [html] [WxH ...]  → per-slide overflow report
// Flags content that does not fit the stage (clipped by the deck) at each viewport.
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const html = resolve(process.argv[2] || new URL('../../index.html', import.meta.url).pathname);
const sizes = process.argv.slice(3).map(s => s.split('x').map(Number)).filter(s => s.length === 2);
const list = sizes.length ? sizes : [[1280, 720], [1280, 640], [1600, 1000], [1920, 1080]];

for (const [W, H] of list) {
  const PORT = 9200 + Math.floor(Math.random() * 400);
  const chrome = spawn('/usr/bin/google-chrome', ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--hide-scrollbars', '--disable-dev-shm-usage', `--remote-debugging-port=${PORT}`, 'file://' + html], { stdio: 'ignore' });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let wsUrl;
  for (let i = 0; i < 80; i++) {
    try {
      const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const pg = l.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      if (pg) { wsUrl = pg.webSocketDebuggerUrl; break; }
    } catch {}
    await sleep(250);
  }
  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const pend = new Map(); const errs = [];
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); return; }
    if (m.method === 'Runtime.exceptionThrown') errs.push('EXC ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errs.push('CONSOLE ' + m.params.args.map(a => a.value || a.description).join(' '));
  });
  const send = (m, p = {}) => new Promise(res => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  const ev = e => send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }).then(r => r.result.exceptionDetails ? 'ERR' : r.result.result.value);
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  // wait until the deck is parsed and laid out at the new size
  for (let i = 0; i < 60; i++) {
    const ok = await ev('document.readyState === "complete" && document.querySelectorAll(".slide").length >= 13');
    if (ok === true) break;
    await sleep(250);
  }
  await sleep(600);
  // freeze the reveal animations — otherwise the "translateY(22px)" start state
  // is measured as a layout overflow
  await ev(`(function(){var s=document.createElement('style');s.textContent='.rv,.rv-r,.rv-s{opacity:1!important;transform:none!important;transition:none!important}';document.head.appendChild(s);})()`);
  const sweep = `(async()=>{const out=[];const sl=[...document.querySelectorAll('.slide')];
  const hud=document.querySelector('.hud');const hudTop=hud?hud.getBoundingClientRect().top:innerHeight;
  for(let i=0;i<sl.length;i++){document.dispatchEvent(new CustomEvent('deck:jump',{detail:{index:i}}));await new Promise(r=>setTimeout(r,700));
  const s=sl[i];const over=[];let minF=99;let bottom=0;
  for(const el of s.querySelectorAll('*')){const cs=getComputedStyle(el);if(cs.display==='none'||+cs.opacity===0)continue;
  const cls=(el.className||'').toString().split(' ')[0];
  if(el.children.length===0&&el.textContent.trim())minF=Math.min(minF,parseFloat(cs.fontSize));
  if(el.children.length===0&&el.textContent.trim()&&!['ghost'].includes(cls))
    bottom=Math.max(bottom,el.getBoundingClientRect().bottom);
  const d=el.scrollHeight-el.clientHeight;
  if(d>6&&el.clientHeight>30&&!['ghost','rv','rv-r','rp-ghost-wrap','div-num','div-wrap','div-title'].includes(cls))
    over.push((cls||el.tagName.toLowerCase())+'+'+d);}
  out.push({i,id:s.id||'title',minF:+minF.toFixed(1),behind:Math.round(bottom-hudTop),over:[...new Set(over)]});}
  return out;})()`;
  const res = await ev(sweep);
  if (!Array.isArray(res) || !res.length) {
    console.log('  DEBUG slides=', await ev('document.querySelectorAll(".slide").length'),
      'raw=', JSON.stringify(await send('Runtime.evaluate', { expression: sweep, returnByValue: true, awaitPromise: true }).then(r => r.result).catch(e => String(e))).slice(0, 300));
  }
  console.log(`\n=== ${W}x${H} ===`);
  for (const s of res) console.log(`  ${String(s.i).padStart(2)} ${s.id.padEnd(12)} minFont=${s.minF}px  hudGap=${s.behind}px  ${s.over.length ? 'OVERFLOW: ' + s.over.join(', ') : 'ok'}`);
  if (errs.length) console.log('  JS ERRORS:', errs.slice(0, 5));
  chrome.kill();
}
process.exit(0);
