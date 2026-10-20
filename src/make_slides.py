#!/usr/bin/env python3
"""Rebuild parts/slides_a.html (3 slides) and parts/slides_b.html (6 slides) for the 13-slide edition."""
import re

import os
ROOT = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(ROOT, 'parts', 'slides_a.html')
B = os.path.join(ROOT, 'parts', 'slides_b.html')
BL = os.path.join(ROOT, 'parts', 'blocks') + os.sep

def read(p): return open(p, encoding='utf-8').read()
def write(p, s): open(p, 'w', encoding='utf-8').write(s)

import os, shutil
for src in (A, B):                      # keep a pristine copy so re-runs are idempotent
    bak = src + '.bak'
    if not os.path.exists(bak):
        shutil.copy(src, bak)
def read(p):
    b = p + '.bak'
    return open(b if os.path.exists(b) else p, encoding='utf-8').read()

def split_blocks(text):
    return [p.strip('\n') for p in re.split(r'(?=\n  <!-- ={4,})', text) if p.strip()]

def sub1(txt, old, new):
    assert txt.count(old) == 1, 'not unique/found: ' + old[:60]
    return txt.replace(old, new)

def replace_line(txt, marker, new):
    """replace the whole line containing `marker` with `new`"""
    lines = txt.split('\n')
    hits = [i for i, l in enumerate(lines) if marker in l]
    assert len(hits) == 1, 'marker not unique: ' + marker
    lines[hits[0]:hits[0] + 1] = new.split('\n')
    return '\n'.join(lines)

def insert_after_line(txt, marker, block):
    lines = txt.split('\n')
    for i, l in enumerate(lines):
        if marker in l:
            for j in range(i, len(lines)):
                if lines[j].strip() == '</div>':
                    lines.insert(j + 1, block)
                    return '\n'.join(lines)
            break
    raise SystemExit('insert anchor missing: ' + marker)

def insert_before_section(txt, block):
    i = txt.rfind('\n  </section>')
    assert i > 0
    return txt[:i] + '\n' + block + txt[i:]

a = split_blocks(read(A)); b = split_blocks(read(B))
assert len(a) == 6 and len(b) == 8, (len(a), len(b))
fund, anat = a[2], a[5]
div3, replay, play, code, live = b[0], b[1], b[2], b[3], b[7]

# ---------- fund: ghost/kicker 04 -> 03 ----------
fund = sub1(fund, '<div class="ghost">04</div>', '<div class="ghost">03</div>')
fund = sub1(fund, '<span class="n">04</span> — fundamentals', '<span class="n">03</span> — fundamentals')
# punch line becomes the slide subtitle
fund = sub1(fund, 'هر لایه یک محدودیت را برمی‌دارد: نخست «فقط متن»، سپس «فقط یک‌بار»، و در پایان «بدون کنترل».',
                 'مدل موتور است، هارنس شاسی و ECU و پدال. ایجنت آن چیزی است که وقتی این دو کنار هم کار می‌کنند اتفاق می‌افتد — <b>نه یک قطعه، یک رفتار</b>.')
# definition card: «ایجنت چیست؟» (model / agent / harness)
fund = sub1(fund, '<h3>تعریف عملی</h3>', '<h3>ایجنت چیست؟</h3>')
fund = replace_line(fund, '<p>ایجنت یعنی:', read(BL + 'agentdef.html').rstrip('\n'))
fund = sub1(fund, '<div class="eq">agent = model + tools + loop + policy + memory</div>',
                 '<div class="eq">harness = prompt + tools + loop + policy + memory + log</div>\n'
                 '        <p class="def-caveat"><b>این یک مدل ذهنی است، نه یک مرز جهانی:</b> '
                 'در بعضی پیاده‌سازی‌ها ابزار و حلقه داخل خودِ API مدل جای دارند و «هارنس» به بخشی از محصول تبدیل می‌شود. '
                 'پس مرز میان مدل، ایجنت و هارنس را هر پروژه خودش می‌کشد.</p>')
# shorter build rows (one line each) so the counter-examples fit underneath
fund = sub1(fund, 'یک پرامپت، یک پاسخ. نه دسترسی به جهان، نه امکان خطایابی، نه امکان ادامه‌دادن.',
                 'یک پرامپت، یک پاسخ. نه دست، نه حافظه، نه امکان ادامه‌دادن.')
fund = sub1(fund, 'حالا می‌تواند بخواند، اجرا کند و بپرسد. اما هنوز فقط یک‌بار: یک عمل، یک پاسخ، پایان.',
                 'می‌تواند بخواند و اجرا کند — اما هنوز یک‌بار: یک عمل، یک پاسخ، پایان.')
fund = sub1(fund, 'نتیجهٔ هر عمل دوباره به مدل برمی‌گردد. حالا می‌تواند اشتباه کند — و اشتباهش را اصلاح کند.',
                 'نتیجهٔ هر عمل برمی‌گردد. حالا می‌تواند اشتباه کند — و اصلاحش کند.')
fund = sub1(fund, 'حلقه + سیاست + حافظه + بودجه. اینجاست که یک ایجنتِ آزمایشی به ایجنتِ قابل‌اتکا تبدیل می‌شود.',
                 'حلقه + سیاست + حافظه + بودجه. اینجاست که ایجنتِ آزمایشی قابل‌اتکا می‌شود.')
# counter-examples: «این ایجنت نیست» — left column, under the four build rows
fund = sub1(fund, '<div class="fund-row" data-i="0"', '<div class="fund-row on" data-i="0"')
fund = sub1(fund, '        </div>\n      </div>\n\n      <div class="fund-right">',
                 '        </div>\n' + read(BL + 'funddetail.html').rstrip('\n') + '\n'
                 + read(BL + 'notagent.html').rstrip('\n') + '\n      </div>\n\n      <div class="fund-right">')

# ---------- anat: ghost/kicker 08 -> 05 + live demo panel ----------
anat = sub1(anat, '<div class="ghost">08</div>', '<div class="ghost">05</div>')
anat = sub1(anat, '<span class="n">08</span> — architecture', '<span class="n">05</span> — architecture')
anat = insert_after_line(anat, 'id="anatQ"', read(BL + 'anatdemo.html').rstrip('\n'))
# the control loop owns the stopping condition — say it by name
anat = sub1(anat, 'fthink · act · observe', 'think · act · observe · stop')
anat = sub1(anat,
  'قلب هارنس. تصمیم می‌گیرد گام بعدی چیست، چند گام مجاز است و کِی باید متوقف شود. بدون این حلقه، مدل فقط یک‌بار حرف می‌زند.',
  'قلب هارنس. تصمیم می‌گیرد گام بعدی چیست، چند گام مجاز است و <b>شرط پایان</b> کِی فرا رسیده است: '
  'پاسخ نهایی، سقف بودجه، خطای مکرر یا تأیید انسان. بدون این حلقه، مدل فقط یک‌بار حرف می‌زند.')

# ---------- div3: ghost 10 -> 07 + teaser ----------
div3 = sub1(div3, '<div class="ghost">10</div>', '<div class="ghost">07</div>')
div3 = insert_before_section(div3, read(BL + 'teaser.html').rstrip('\n'))

# ---------- replay: ghost/kicker 11 -> 08, ghost transcript, LTR transport ----------
replay = sub1(replay, '<div class="ghost">11</div>', '<div class="ghost">08</div>')
replay = sub1(replay, '<span class="n">11</span> — action · replay', '<span class="n">08</span> — action · replay')
replay = sub1(replay,
  '<div class="rp-transcript rv-r" style="--d:.26s" id="rpLog"></div>',
  '<div class="rp-transcript rv-r" style="--d:.26s" id="rpLog"></div>\n'
  '        <div class="rp-ghost-wrap rv-r" style="--d:.26s" id="rpGhost"></div>')
old_transport = re.search(r'    <div class="rp-transport rv".*?\n    </div>', replay, re.S).group(0)
new_transport = '''    <div class="rp-transport rv" style="--d:.44s" dir="ltr">
      <button class="rp-btn" id="rpPrev" title="گام قبل">⏮</button>
      <button class="rp-btn rp-play" id="rpPlay" title="پخش / توقف">▶</button>
      <button class="rp-btn" id="rpNext" title="گام بعد">⏭</button>
      <div class="rp-track"><i id="rpFill"></i></div>
      <span class="rp-time" id="rpTime">00:00 / 01:40</span>
      <button class="rp-speed" id="rpSpeed">1×</button>
      <span class="rp-tool" id="rpTool">—</span>
      <span class="chip cy rp-chip"><span class="dot"></span>جلسهٔ ضبط‌شده</span>
    </div>'''
replay = replay.replace(old_transport, new_transport)

# ---------- playground: ghost/kicker 12 -> 09 + preset button ----------
play = sub1(play, '<div class="ghost">12</div>', '<div class="ghost">09</div>')
play = sub1(play, '<span class="n">12</span> — action · playground', '<span class="n">09</span> — action · playground')
play = sub1(play, '<button class="btn ghost-btn" id="pgReset">',
            '<button class="btn ghost-btn" id="pgSample">اجرای نمونه</button>\n          '
            '<button class="btn ghost-btn" id="pgReset">')

# ---------- code: ghost/kicker 13 -> 10 ----------
code = sub1(code, '<div class="ghost">13</div>', '<div class="ghost">10</div>')
code = sub1(code, '<span class="n">13</span> — action · code', '<span class="n">10</span> — action · code')

# ---------- live demo: ghost 17 -> 12 + terminal reel ----------
live = sub1(live, '<div class="ghost">17</div>', '<div class="ghost">12</div>')
live = insert_before_section(live, read(BL + 'terminal.html').rstrip('\n'))
# the video slot is shown to the audience — no build instructions on screen
live = sub1(live,
  'اگر ویدئویی از اجرای واقعی دارید، فایل <code>VIDEO_SRC</code> را در انتهای اسکریپت با\n'
  '            داده‌ی base64 پر کنید تا اینجا پخش شود.<br>\n'
  '            بدون ویدئو: از پنجرهٔ ترمینال، یک اجرای واقعی را جلوی جمع انجام دهید.',
  'ویدئوی از پیش ضبط‌شده نیست: اجرای واقعی را جلوی جمع انجام می‌دهیم — خطا، اصلاح، تست سبز.\n'
  '            اگر ویدئویی آماده داشتید، این قاب جای آن بود.')

# ---------- write the two part files ----------
write(A, '\n\n'.join([read(BL + 'agenda.html').strip('\n'), fund, anat]) + '\n')
write(B, '\n\n'.join([div3, replay, play, code, read(BL + 'mix.html').strip('\n'), live]) + '\n')
print('slides_a: 3 blocks · slides_b: 6 blocks')
