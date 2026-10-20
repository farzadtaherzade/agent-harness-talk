#!/usr/bin/env python3
"""Patch parts/new.js for the 13-slide edition (idempotent: always rebuilds from a backup)."""
import os, re, shutil

ROOT = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(ROOT, 'parts', 'new.js')
BAK = os.path.join(ROOT, 'parts', 'new.js.bak')

# keep a pristine copy of the pre-13-slide file for repeatable patching
if not os.path.exists(BAK):
    shutil.copy(P, BAK)

src = open(BAK, encoding='utf-8').read()
lines = src.split('\n')          # 0-based list; file line N == lines[N-1]

notes_txt = open(os.path.join(ROOT, 'parts', 'notes13.txt'), encoding='utf-8').read()
notes_block = notes_txt.split('===NOTES===')[1].split('===SECTIONS===')[0].rstrip('\n')
sect_block = notes_txt.split('===SECTIONS===')[1].rstrip('\n')
features = open(os.path.join(ROOT, 'parts', 'features.js'), encoding='utf-8').read().rstrip('\n')

# --- locate anchors (1-based line numbers) -----------------------------------
def find(pat, frm=1):
    for i in range(frm - 1, len(lines)):
        if re.search(pat, lines[i]):
            return i + 1
    raise SystemExit('anchor not found: ' + pat)

n_notes_s = find(r'^  const NOTES = \[$')
n_notes_e = find(r'^  \];$', n_notes_s)
n_sect_s = find(r'^  const SECTIONS = \[$')
n_sect_e = find(r'^  \];$', n_sect_s)
n_tc_s   = find(r'SLIDE 5 — anatomy of a tool call')
n_tc_e   = find(r'^  tcNodes\.forEach\(', n_tc_s)     # last line of TC block
n_hook_s = find(r'^  window\.__slideEnter = function')
n_hook_e = find(r'^  \};$', n_hook_s)
n_init_s = find(r'^  /\* initial paint \*/$')
n_init_e = find(r'^  rpReset\(\);$', n_init_s)
n_end    = find(r'^\}\)\(\);$')

new_hook = """  window.__slideEnter = function(slide){
    if (!slide) return;
    if (slide.id === 'fundSlide')   playFund();
    if (slide.id === 'anatSlide')   paintAnat('loop');
    if (slide.id === 'replaySlide') rpAutoplay();
    if (slide.id === 'div3Slide')   teaserStart();
    if (slide.id === 'liveSlide')   termStart();
    if (slide.id === 'toolsSlide')  ctxReset();
  };"""

new_init = """  /* initial paint */
  renderNotes(0);
  paintTimer();
  rpReset();
  teaserStart();
  termStart();
  paintTimeline();"""

# --- apply replacements from the bottom up ------------------------------------
def repl(s, e, text):          # 1-based inclusive range
    global lines
    lines[s - 1:e] = text.split('\n')

repl(n_end, n_end, features + '\n\n' + new_init + '\n})();')
repl(n_init_s, n_init_e, '')
repl(n_hook_s, n_hook_e, new_hook)
repl(n_tc_s, n_tc_e + 1, '')          # +1 removes the trailing blank line
repl(n_sect_s, n_sect_e, sect_block)
repl(n_notes_s, n_notes_e, notes_block)

out = '\n'.join(lines)
out = re.sub(r'\n{3,}', '\n\n', out)
open(P, 'w', encoding='utf-8').write(out)
print('new.js patched:', len(out), 'bytes')
