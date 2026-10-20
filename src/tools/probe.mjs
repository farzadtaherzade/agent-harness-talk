// CDP probe: node probe.mjs <html> <js-expression> [slideIndex]
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
const [htmlArg, expr, idx] = process.argv.slice(2);
const html = resolve(htmlArg || new URL('../../index.html', import.meta.url).pathname);
const PORT = 9700 + Math.floor(Math.random() * 200);
const chrome = spawn('/usr/bin/google-chrome', ['--headless=new','--disable-gpu','--no-sandbox',
  '--hide-scrollbars','--disable-dev-shm-usage','--window-size=1600,1000',
  `--remote-debugging-port=${PORT}`,'file://'+html], { stdio:'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let wsUrl;
for (let i=0;i<60;i++){ try{ const l=await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const p=l.find(t=>t.type==='page'&&t.webSocketDebuggerUrl); if(p){wsUrl=p.webSocketDebuggerUrl;break;} }catch{} await sleep(250); }
const ws = new WebSocket(wsUrl); await new Promise(r=>ws.addEventListener('open',r));
let id=0; const pend=new Map();
ws.addEventListener('message', e=>{ const m=JSON.parse(e.data); if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id);} });
const send=(m,p={})=>new Promise(res=>{const i=++id;pend.set(i,res);ws.send(JSON.stringify({id:i,method:m,params:p}));});
await send('Runtime.enable'); await sleep(2200);
const ev = async e => { const r = await send('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});
  if (r.result.exceptionDetails) return 'EXC: '+r.result.exceptionDetails.text;
  return r.result.result.value; };
if (idx !== undefined) { await ev(`document.dispatchEvent(new CustomEvent('deck:jump',{detail:{index:${idx}}}))`); await sleep(900); }
console.log(JSON.stringify(await ev(expr)));
chrome.kill(); process.exit(0);
