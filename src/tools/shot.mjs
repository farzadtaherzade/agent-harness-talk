// CDP screenshotter: node shot.mjs <abs-html> <slideIndex0> <out.png> [waitMs]
// env WS="414,896" sets the window size
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';

const [htmlArg, idx, out, waitMs] = process.argv.slice(2);
const html = resolve(htmlArg || new URL('../../index.html', import.meta.url).pathname);
const [W, H] = (process.env.WS || '1600,1000').split(',').map(Number);
const PORT = 9334 + Math.floor(Math.random() * 200);

const chrome = spawn('/usr/bin/google-chrome', [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  '--disable-dev-shm-usage', '--force-device-scale-factor=1',
  `--window-size=${W},${H}`, `--remote-debugging-port=${PORT}`,
  'file://' + html
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function target() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await r.json();
      const pg = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      if (pg) return pg.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error('no chrome target');
}

const ws = new WebSocket(await target());
await new Promise(r => ws.addEventListener('open', r));

let id = 0;
const pending = new Map();
const errors = [];
ws.addEventListener('message', ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') {
    errors.push(m.params.exceptionDetails.text + ' ' + (m.params.exceptionDetails.exception?.description || ''));
  }
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
    errors.push('LOG ' + m.params.entry.text);
  }
});
const send = (method, params = {}) => new Promise(res => {
  const i = ++id; pending.set(i, res);
  ws.send(JSON.stringify({ id: i, method, params }));
});

await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');
await sleep(1200);

// jump to the requested slide
const jr = await send('Runtime.evaluate', { expression:
  `document.dispatchEvent(new CustomEvent('deck:jump',{detail:{index:${Number(idx)}}}))` });
if (jr.result.exceptionDetails) console.log('JUMP ERROR: ' + JSON.stringify(jr.result.exceptionDetails));
// retry the jump until the requested slide is active (page may still be booting)
for (let i = 0; i < 12; i++) {
  const r = await send('Runtime.evaluate', { expression:
    `(() => { const s = document.querySelectorAll('.slide'); const a = document.querySelector('.slide.active');
      return s.length && a ? Array.prototype.indexOf.call(s, a) : -1; })()`, returnByValue: true });
  if (r.result.result.value === Number(idx)) break;
  await send('Runtime.evaluate', { expression:
    `document.dispatchEvent(new CustomEvent('deck:jump',{detail:{index:${Number(idx)}}}))` });
  await sleep(500);
}
await sleep(Number(waitMs || 1500));

const probe = await send('Runtime.evaluate', { expression: `JSON.stringify({
  slides: document.querySelectorAll('.slide').length,
  active: document.querySelector('.slide.active') ? document.querySelector('.slide.active').id : null,
  opacity: getComputedStyle(document.querySelector('.slide.active')).opacity,
  carReady: !!window.__carReady,
  notes: (document.querySelector('.notes h4')||{}).textContent,
  cur: (document.getElementById('curNum')||{}).textContent,
  act: Array.from(document.querySelectorAll('.slide.active')).map(x=>x.id||x.className).join(',')
})`, returnByValue: true });
console.log('PROBE ' + probe.result.result.value);

const shot = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
console.log('SAVED ' + out);
if (errors.length) console.log('ERRORS:\n' + errors.join('\n'));
else console.log('no js errors');

ws.close();
chrome.kill();
process.exit(0);
