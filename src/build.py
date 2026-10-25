#!/usr/bin/env python3
"""Assemble the 13-slide deck from the 5-slide base + new parts."""
import re, io, sys, os

ROOT = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.join(ROOT, 'base.html')
OUT  = os.path.join(os.path.dirname(ROOT), 'index.html')
PARTS = os.path.join(ROOT, 'parts')

src = open(BASE, encoding='utf-8').read()

# ---------- split base into head / deck region / tail ----------
m = re.search(r'<main id="deck" aria-live="polite">', src)
head = src[:m.start()] + '<main id="deck" aria-live="polite">'
rest = src[m.end():]
hud_marker = '<!-- ============================================================\n     HUD / NAVIGATION'
ti = rest.index(hud_marker)
deck_region = re.sub(r'\n</main>\s*$', '\n', rest[:ti])
tail = rest[ti:]

# split deck region into slide sections
lead = '\n'
sections = [mm.group(0) for mm in re.finditer(r'(?:  <!--.*?-->\n)*  <section class="slide.*?\n  </section>', deck_region, re.S)]
assert len(sections) == 5, 'expected 5 base slides, got %d' % len(sections)
for s in sections:
    assert s.rstrip().endswith('</section>'), 'bad section split'

def slide_text(s):
    """strip the leading newline and normalise indentation"""
    return s.strip('\n')

old = [slide_text(s) for s in sections]

# ---------- new slides ----------
a = re.split(r'(?=\n  <!-- ={4,})', open(PARTS + '/slides_a.html', encoding='utf-8').read())
b = re.split(r'(?=\n  <!-- ={4,})', open(PARTS + '/slides_b.html', encoding='utf-8').read())
def clean_slides(blocks):
    out = []
    for blk in blocks:
        if '<section class="slide' not in blk:
            continue
        out.append(blk.strip('\n'))
    return out
A = clean_slides(a)
B = clean_slides(b)
assert len(A) == 3, 'slides_a -> %d' % len(A)
assert len(B) == 6, 'slides_b -> %d' % len(B)

#  0 title · 1 agenda · 2 fund · 3 car · 4 anat · 5 react · 6 div3
#  7 replay · 8 playground · 9 code · 10 tools+mcp+memory · 11 live demo · 12 summary
order = [old[0], A[0], A[1], old[1], A[2], old[2],
         B[0], B[1], B[2], B[3], B[4], B[5], old[4]]
assert len(order) == 13

# ---------- patch reused slides ----------
def patch_slide(idx, pairs):
    s = order[idx]
    for a_, b_ in pairs:
        assert a_ in s, 'missing in slide %d: %r' % (idx, a_[:60])
        s = s.replace(a_, b_, 1)
    order[idx] = s

# 0 — title
patch_slide(0, [
    ('<b>05</b><span>اسلاید</span>', '<b>13</b><span>اسلاید</span>'),
    ('۲۵ دقیقه + پرسش و پاسخ', '۳۰ دقیقه + پرسش و پاسخ'),
    ('<div class="st rv" style="--d:.78s"><b>ReAct</b><span>حلقهٔ استدلال</span></div>',
     '<div class="st rv" style="--d:.78s"><b>۰۴</b><span>دموی تعاملی</span></div>'),
])

# 3 — car
patch_slide(3, [
    ('<section class="slide s2" data-label="استعارهٔ خودرو">',
     '<section class="slide s2" id="carSlide" data-label="استعارهٔ خودرو">'),
    ('<div class="ghost">02</div>', '<div class="ghost">04</div>'),
    ('<span class="n">02</span> — analogy', '<span class="n">04</span> — analogy'),
])

# 5 — ReAct: 4th (memory) step, live phase in the ring, renumber
STEP3 = '''            <div class="snip">{"observation": "exit_code=1, 1 failed"}</div>
          </div>
        </div>'''
STEP4 = STEP3 + '''

        <div class="step rv-r" style="--d:.58s;--c:#f59e0b" data-step="3">
          <div class="num">04</div>
          <div>
            <div class="t">حافظه <code>Memory</code></div>
            <div class="d">هر مشاهده به حافظهٔ کوتاه‌مدت برمی‌گردد و خلاصه‌ای از آن در حافظهٔ بلندمدت ثبت می‌شود. حلقه از همین‌جا دوباره تغذیه می‌گیرد.</div>
            <div class="snip">{"memory": "short=12 events · long=1 fact"}</div>
          </div>
        </div>'''
patch_slide(5, [
    ('<section class="slide s3" data-label="حلقهٔ ReAct">',
     '<section class="slide s3" id="reactSlide" data-label="حلقهٔ ReAct">'),
    ('<div class="ghost">03</div>', '<div class="ghost">06</div>'),
    ('<span class="n">03</span> — theory', '<span class="n">06</span> — theory'),
    ('<h2 class="s-title rv" style="--d:.12s">حلقهٔ <em>ReAct</em>: فکر ← عمل ← مشاهده</h2>',
     '<h2 class="s-title rv" style="--d:.12s">حلقهٔ <em>ReAct</em>: فکر ← عمل ← مشاهده ← حافظه</h2>'),
    (STEP3, STEP4),
    ('        </svg>\n      </div>',
     '        </svg>\n        <div class="loop-live" id="loopLive"></div>\n      </div>'),
    ('<span class="mini-note" id="reactState">step: 1 / 3</span>',
     '<span class="mini-note" id="reactState">step: 1 / 4</span>'),
])

# 12 — summary + real-world mini table
realmini = open(PARTS + '/blocks/realmini.html', encoding='utf-8').read().rstrip('\n')
patch_slide(12, [
    ('<section class="slide s5" data-label="جمع‌بندی">',
     '<section class="slide s5" id="sumSlide" data-label="جمع‌بندی">'),
    ('<div class="ghost">05</div>', '<div class="ghost">13</div>'),
    ('<span class="n">05</span> — takeaways', '<span class="n">13</span> — takeaways'),
    ('    <div class="closing rv" style="--d:.7s">',
     '    ' + realmini + '\n\n    <div class="closing rv" style="--d:.7s">'),
])

# ---------- patch the app script ----------
src_js_old = 'if (window.__carTick) window.__carTick(index === 1);'
src_js_new = "if (window.__carTick) window.__carTick(slides[index].id === 'carSlide');"

sim_start = tail.index('     SLIDE 4 — live harness simulator')
sim_end   = tail.index('     SLIDE 5 — metric count-up')
sim_block = tail[sim_start:sim_end]
assert 'runHarness' in sim_block
tail = tail[:sim_start] + tail[sim_end:]

old_enter = """  function onEnter(slide, i){
    if (i === 2) startReact();
    if (i === 4) slide.querySelectorAll('[data-count]').forEach(countUp);
  }"""
new_enter = """  function onEnter(slide, i){
    if (slide.id === 'reactSlide') startReact();
    if (slide.id === 'sumSlide') slide.querySelectorAll('[data-count]').forEach(countUp);
    if (window.__slideEnter) window.__slideEnter(slide, i);
  }"""

old_show_tail = "  show(0);\n})();"
new_show_tail = """  document.addEventListener('deck:jump', e => show(e.detail.index));
  show(0);
})();"""

car_old = "    document.addEventListener('deck:slide', e => { deckIndex = e.detail.index; setActive(deckIndex === 1); });"
car_new = "    document.addEventListener('deck:slide', e => { deckIndex = e.detail.index; setActive(!!document.querySelector('#carSlide.active')); });"
act_old = "    setActive(deckIndex === 1);"
act_new = "    setActive(!!document.querySelector('#carSlide.active'));"

for a_, b_ in [(src_js_old, src_js_new), (old_enter, new_enter), (old_show_tail, new_show_tail), (car_old, car_new), (act_old, act_new)]:
    assert a_ in tail, 'js patch missing: %r' % a_[:50]
    tail = tail.replace(a_, b_, 1)

# ---------- nav arrows: LTR glyph + Persian label ----------
nav_old = '''  <button id="btnPrev" title="قبلی (→)" aria-label="اسلاید قبلی">→</button>
  <button id="btnNext" title="بعدی (←)" aria-label="اسلاید بعدی">←</button>'''
nav_new = '''  <button id="btnPrev" class="nav-lbl" dir="ltr" title="قبلی (→)" aria-label="اسلاید قبلی"><span class="g">→</span><span class="t">قبلی</span></button>
  <button id="btnNext" class="nav-lbl" dir="ltr" title="بعدی (←)" aria-label="اسلاید بعدی"><span class="g">←</span><span class="t">بعدی</span></button>'''
assert nav_old in tail, 'nav markup changed'
tail = tail.replace(nav_old, nav_new, 1)

# ---------- HUD: timer + key hints ----------
old_hud = """    <span class="keys"><kbd>←</kbd><kbd>→</kbd><kbd>Space</kbd> حرکت · <kbd>F</kbd> تمام‌صفحه</span>"""
new_hud = """    <span class="hud-timer" id="hudTimer"><b id="tClock">00:00</b><span class="sec" id="tSec">—</span></span>
    <span class="keys"><kbd>←</kbd><kbd>→</kbd><kbd>Space</kbd> حرکت · <kbd>F</kbd> تمام‌صفحه · <kbd>S</kbd> یادداشت · <kbd>T</kbd> زمان‌سنج · <kbd>C</kbd> حالت تمیز · <kbd>?</kbd> راهنما</span>"""
assert old_hud in tail
tail = tail.replace(old_hud, new_hud, 1)

# ---------- font is self-hosted (assets/fonts) → no CDN, works offline ----------
FONT_URL = 'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap'
font_old = '<link href="%s" rel="stylesheet">' % FONT_URL
assert font_old in head, 'font link not found'
head = head.replace(font_old, '<!-- font: self-hosted Vazirmatn (assets/fonts) -->', 1)
# drop the now-pointless preconnects to Google Fonts
for pre in ['<link rel="preconnect" href="https://fonts.googleapis.com">\n',
            '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n']:
    head = head.replace(pre, '')

# ---------- inject new CSS + JS ----------
new_css = open(PARTS + '/new.css', encoding='utf-8').read()
try:
    new_css += open(PARTS + '/new13.css', encoding='utf-8').read()
except FileNotFoundError:
    pass
new_js  = open(PARTS + '/new.js', encoding='utf-8').read()

head = head.replace('</style>', new_css + '\n</style>', 1)
i = tail.rindex('</script>')
tail = tail[:i] + '\n' + new_js + '\n' + tail[i:]

# ---------- assemble ----------

# ---------- final slide order: tools/MCP/memory now comes BEFORE the "in action" divider ----
FINAL_ORDER = [0, 1, 2, 3, 4, 5, 10, 6, 7, 8, 9, 11, 12]
order = [order[i] for i in FINAL_ORDER]

# ---------- renumber the visible slide numbers (ghost badge + kicker) ----------
def renum(s, n):
    s = re.sub(r'(class="ghost"[^>]*>)(\d+)(<)', lambda m: m.group(1) + str(n) + m.group(3), s, count=1)
    s = re.sub(r'(<span class="n">)(\d+)(</span>)', lambda m: m.group(1) + str(n) + m.group(3), s, count=1)
    return s
for _i, _s in enumerate(order):
    order[_i] = renum(_s, _i + 1)

deck = lead + '\n' + '\n\n'.join(order) + '\n</main>\n\n'
out = head + deck + tail
open(OUT, 'w', encoding='utf-8').write(out)
print('slides:', len(order), 'bytes:', len(out.encode()))
