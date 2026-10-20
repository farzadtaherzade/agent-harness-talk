// CDP interaction test — 13-slide edition
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
const html = resolve(process.argv[2] || new URL('../../index.html', import.meta.url).pathname);
const PORT = 9500 + Math.floor(Math.random() * 200);
const chrome = spawn('/usr/bin/google-chrome', ['--headless=new','--disable-gpu','--no-sandbox',
  '--hide-scrollbars','--disable-dev-shm-usage','--window-size=1600,1000',
  `--remote-debugging-port=${PORT}`,'file://'+html], { stdio:'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let wsUrl;
for (let i=0;i<60;i++){ try{ const l=await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const p=l.find(t=>t.type==='page'&&t.webSocketDebuggerUrl); if(p){wsUrl=p.webSocketDebuggerUrl;break;} }catch{} await sleep(250); }
const ws = new WebSocket(wsUrl); await new Promise(r=>ws.addEventListener('open',r));
let id=0; const pend=new Map(); const errs=[];
ws.addEventListener('message', ev=>{ const m=JSON.parse(ev.data);
  if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id);}
  if(m.method==='Runtime.exceptionThrown') errs.push(m.params.exceptionDetails.text+' '+(m.params.exceptionDetails.exception?.description||''));});
const send=(method,params={})=>new Promise(res=>{const i=++id;pend.set(i,res);ws.send(JSON.stringify({id:i,method,params}));});
await send('Runtime.enable'); await send('Page.enable'); await sleep(2500);
const ev = async (expr) => { const r = await send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});
  if (r.result.exceptionDetails) return 'EXC: '+r.result.exceptionDetails.text;
  return r.result.result.value; };
const jump = async i => { await ev(`document.dispatchEvent(new CustomEvent('deck:jump',{detail:{index:${i}}}))`); await sleep(800); };

// --- every slide activates ---
const ids = [];
for (let i = 0; i < 13; i++){
  await jump(i);
  ids.push(await ev(`(()=>{const a=document.querySelector('.slide.active');return a? (a.id||a.className)+':'+getComputedStyle(a).opacity : 'NONE';})()`));
}
console.log('SLIDES', ids.join(' | '));

// --- timeline agenda ---
await jump(1);
console.log('TL segs=', await ev(`document.querySelectorAll('.tl-seg').length`),
            'here=', await ev(`(document.getElementById('tlHere')||{}).textContent`));
await ev(`document.querySelectorAll('.tl-seg')[2].click()`); await sleep(700);
console.log('TL jump -> cur=', await ev(`document.getElementById('curNum').textContent`));

// --- anatomy live demo ---
await jump(4);
await ev(`document.querySelector('.anat-chip[data-part="guard"]').click()`);
await sleep(1200);
console.log('ANAT title=', await ev(`document.getElementById('anatTitle').textContent`),
            'demo=', JSON.stringify(await ev(`(document.getElementById('anatDemo')||{}).textContent.slice(0,40)`)),
            'state=', await ev(`(document.getElementById('adState')||{}).textContent`));

// --- ReAct: 4 phases + live center ---
await jump(5);
console.log('REACT steps=', await ev(`document.querySelectorAll('.step').length`),
            'state=', await ev(`(document.getElementById('reactState')||{}).textContent`),
            'live=', JSON.stringify(await ev(`(document.getElementById('loopLive')||{}).textContent`)));

// --- replay: preload + autoplay + tool chip ---
await jump(7);
console.log('REPLAY ghosts=', await ev(`document.querySelectorAll('#rpGhost .rp-msg').length`));
await sleep(4000);
console.log('  after autoplay msgs=', await ev(`document.querySelectorAll('#rpLog .rp-msg').length`),
            'tool=', await ev(`(document.getElementById('rpTool')||{}).textContent`),
            'hideNav=', await ev(`document.body.classList.contains('hide-nav')`));

// --- playground preset button ---
await jump(8);
await ev(`document.getElementById('pgSample').click()`);
await sleep(6000);
console.log('PG sample logs=', await ev(`document.querySelectorAll('#pgLog .log').length`),
            'state=', await ev(`document.getElementById('pgState').textContent`));

// --- code in motion ---
await jump(9);
await ev(`document.querySelectorAll('.phase')[2].click()`);
console.log('CODE hot=', await ev(`document.querySelectorAll('.cl.hot').length`),
            'title=', await ev(`document.getElementById('phaseTitle').textContent`));

// --- merged tools/mcp/memory ---
await jump(10);
await ev(`document.getElementById('ctxPlay').click()`);
await sleep(3000);
console.log('MIX chunks=', await ev(`document.querySelectorAll('.ctx-chunk').length`),
            'used=', await ev(`document.getElementById('ctxUsed').textContent`),
            'pkts=', await ev(`document.querySelectorAll('.mcp-pkt').length`));

// --- teaser + terminal reel ---
await jump(6); await sleep(1500);
console.log('TEASER len=', await ev(`(document.getElementById('teaserLog')||{}).textContent.length`));
await jump(11); await sleep(1500);
console.log('TERM len=', await ev(`(document.getElementById('termReel')||{}).textContent.length`));

// --- summary table ---
await jump(12);
console.log('SUM rows=', await ev(`document.querySelectorAll('.rm-table tbody tr').length`));

// --- presenter aids ---
await jump(1);
await ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'s'}))`); await sleep(300);
console.log('NOTES on=', await ev(`document.querySelector('.notes').classList.contains('on')`),
            'h4=', JSON.stringify(await ev(`document.querySelector('.notes h4').textContent`)));
await ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'t'}))`); await sleep(1200);
console.log('TIMER=', await ev(`document.getElementById('tClock').textContent`),
            'sec=', await ev(`document.getElementById('tSec').textContent`),
            'here=', await ev(`(document.getElementById('tlHere')||{}).style.right`));
await ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'?'}))`); await sleep(200);
console.log('HELP=', await ev(`document.querySelector('.help-overlay').classList.contains('on')`));
await ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'c'}))`);
console.log('CLEAN=', await ev(`document.body.classList.contains('clean')`));
console.log('NAV btn=', JSON.stringify(await ev(`document.getElementById('btnNext').textContent`)));
console.log(errs.length ? 'ERRORS:\n'+errs.join('\n') : 'no js errors');
chrome.kill(); process.exit(0);
