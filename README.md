# معماری ایجنت‌های هوش مصنوعی و هارنس

ارائهٔ تعاملی ۳۰ دقیقه‌ای دربارهٔ اینکه **مدل** چه می‌کند، **ایجنت** چه می‌کند و **هارنس** چه چیزی به آن اضافه می‌کند.
یک فایل HTML، بدون وابستگی، بدون اینترنت، فارسی و راست‌به‌چپ.

> مدل تولید و استدلال می‌کند، ایجنت دنبال یک هدف می‌رود، و هارنس بستر اجرا و ابزارهای کنترلی را فراهم می‌کند
> که ایجنت در آن کار می‌کند. — این یک مدل ذهنی است، نه یک مرز جهانی: در هر پیاده‌سازی، مرزها کشیده‌تر یا جابه‌جا می‌شوند.

---

## اجرا

```bash
# ساده‌ترین راه: فایل را در مرورگر باز کنید
xdg-open index.html          # یا فقط دوبار کلیک روی index.html

# یا با یک سرور محلی (پیشنهادی برای تست روی موبایل)
python3 -m http.server 8000  # → http://localhost:8000
```

نیازمندی: یک مرورگر به‌روز (Chrome / Edge / Safari / Firefox). هیچ نصب، هیچ بسته، هیچ کلید API.

## کلیدهای میان‌بر

| کلید | کار |
|---|---|
| `←` `→` `Space` | اسلاید قبلی / بعدی |
| `F` | تمام‌صفحه |
| `S` | یادداشت‌های ارائه‌دهنده |
| `T` (`Shift+T`) | تایمر ۳۰ دقیقه (بازنشانی) |
| `C` | حالت تمیز (پنهان‌کردن رابط) |
| `?` | راهنمای میان‌برها |
| `Home` / `End` | اسلاید اول / آخر |

روی برچسب‌های زمانِ «نقشهٔ راه» بزنید تا مستقیم به هر بخش بروید.

## فهرست اسلایدها

| # | اسلاید | زمان |
|---|---|---|
| ۰۱ | عنوان و قرارداد جلسه | ۱′ |
| ۰۲ | نقشهٔ راه: ۳۰ دقیقه روی یک محور | ۳۰″ |
| ۰۳ | سه لایه که یک مدل را به ایجنت تبدیل می‌کند (مدل / ایجنت / هارنس + ضد-مثال‌ها) | ۳′ |
| ۰۴ | تشبیه خودرو: موتور، ECU و دستهٔ سیم (مدل سه‌بعدی تعاملی) | ۳′ |
| ۰۵ | نقشهٔ هارنس: هفت قطعه + نمونهٔ زنده | ۲.۵′ |
| ۰۶ | حلقهٔ ReAct: فکر ← عمل ← مشاهده ← حافظه | ۲′ |
| ۰۷ | ابزار، MCP و حافظه | ۴.۵′ |
| ۰۸ | در عمل (جداکننده) | ۳۰″ |
| ۰۹ | یک جلسهٔ واقعی: از «باگ گزارش» تا تست سبز (پخش گام‌به‌گام) | ۴′ |
| ۱۰ | سکوی آزمایش: گاردریل را خاموش کنید | ۳′ |
| ۱۱ | کد هارنس در حرکت | ۲.۵′ |
| ۱۲ | دموی زنده | ۱٫۵′ |
| ۱۳ | جمع‌بندی: چه چیزی یک هارنس را تولیدی می‌کند | ۲′ |

> دموها **شبیه‌سازیِ قطعی** داخل همین فایل‌اند: هر بار یکسان اجرا می‌شوند و به اینترنت، کلید API یا شبکه نیاز ندارند.

## ساختار پروژه

```
index.html              ← فایل نهایی ارائه (خروجی ساخت)
assets/fonts/           ← فونت Vazirmatn (محلی، برای کار بدون اینترنت) + مجوز OFL
src/base.html           ← قالب اصلی ۵ اسلایدی: head، متغیرهای CSS و اسکریپت اپ
src/build.py            ← اسمبل کردن head + ۱۳ اسلاید + اسکریپت → ../index.html
src/patch_js.py         ← ساخت دوبارهٔ src/parts/new.js از new.js.bak + notes13.txt + features.js
src/make_slides.py      ← ساخت دوبارهٔ slides_a.html (۳) و slides_b.html (۶) از .bak + blocks/
src/parts/              ← منابع محتوا: notes13.txt، features.js، new.css، new13.css، blocks/*.html
src/tools/              ← ابزار تست مرورگر (CDP)
```

`index.html` خروجی ساخت است و **نباید مستقیم ویرایش شود**؛ از منابع `src/` ویرایش کنید.

## خط لولهٔ ساخت

```bash
python3 src/patch_js.py      # notes + features → src/parts/new.js
python3 src/make_slides.py   # blocks → slides_a.html / slides_b.html
python3 src/build.py         # → ../index.html
```

هر سه اسکریپت ایدپوتنت هستند و از مسیر خودشان (`__file__`) فایل‌ها را پیدا می‌کنند.

## ابزار تست (مرورگر واقعی، headless Chrome)

```bash
node src/tools/itest.mjs                 # کل ۱۳ اسلاید + همهٔ دموها + خطاهای کنسول
node src/tools/fit.mjs                   # بررسی جا شدن محتوا در چند اندازهٔ صفحه
node src/tools/fit.mjs index.html 1280x720 1920x1080
node src/tools/shot.mjs index.html 10 /tmp/s.png   # اسکرین‌شات اسلاید ۱۱
WS=414,896 node src/tools/shot.mjs index.html 3 /tmp/m.png   # نمای موبایل
node src/tools/probe.mjs index.html "document.title" 2      # اجرای یک عبارت در صفحه
```

`fit.mjs` گزارش می‌دهد کدام اسلاید در کدام اندازهٔ صفحه بیرون می‌زند (سرریز) و آیا محتوا زیر نوار پایین می‌رود یا نه.

## نکات فنی

- **بدون اینترنت**: فونت محلی است و تنها وابستگی بیرونی (three.js برای مدل سه‌بعدیِ اسلاید ۰۴) در نبود شبکه
  به‌طور خودکار به نمای دوبعدی جایگزین برمی‌گردد. بقیهٔ ارائه کاملاً آفلاین است.
- **واکنش‌گرایی**: زیر ۱۰۰۰ پیکسل عرض، چیدمان تک‌ستونی می‌شود و اسلایدها قابل پیمایش‌اند.
  زیر ۸۶۰ پیکسل ارتفاع، حالت فشرده فعال می‌شود و زیر ۷۲۰ پیکسل، صحنه به‌تناسب کوچک می‌شود.
- **چاپ / PDF**: `Ctrl+P` یک نسخهٔ PDF پشتیبان می‌سازد (یک اسلاید در هر صفحه، بدون رابط کاربری).
- **دسترس‌پذیری**: دکمه‌ها و کادرهای انتخابی با `Tab` قابل رسیدن‌اند، `Space`/`Enter` آن‌ها را فعال می‌کند،
  و میان‌برها هرگز ورودی متن یا چک‌باکس‌ها را نمی‌ربایند.

## مجوز

MIT — فایل [LICENSE](LICENSE).
فونت Vazirmatn تحت SIL Open Font License 1.1 منتشر شده است (متن کامل: `assets/fonts/OFL.txt`).

---

## English summary

An interactive, offline-capable Persian (RTL) talk explaining **AI agents vs. agent harnesses** for a
30-minute session: what a model does, what an agent does, what a harness adds (tools, control loop,
guardrails, budget, context engineering, logging), and how harness design decides autonomy,
reliability, security, observability and cost.

- **Run it**: open `index.html` — no build, no dependencies, no network needed.
- **Rebuild it**: `python3 src/patch_js.py && python3 src/make_slides.py && python3 src/build.py`
- **Test it**: `node src/tools/itest.mjs` (all slides + demos) and `node src/tools/fit.mjs` (layout fit per viewport).
- **License**: MIT (see `LICENSE`). Bundled font: Vazirmatn, SIL OFL 1.1.

## ساخت، انتشار و نکات نگهداری — Build, release & maintenance

### گردش کار ساخت (Build pipeline)
سه فایل پایتون، به‌ترتیب اجرا می‌شوند و `index.html` را می‌سازند:

```bash
python3 src/patch_js.py      # parts/new.js  (اسکریپت ارائه + notes + features)
python3 src/make_slides.py   # parts/slides_a.html و slides_b.html (۱۳ اسلاید)
python3 src/build.py         # index.html
```

سه فایل تولیدشده (`src/parts/new.js`، `src/parts/slides_a.html`، `src/parts/slides_b.html`) در `.gitignore` هستند؛
نسخهٔ اصلی آن‌ها (`.bak` و `parts/blocks/*`) در مخزن نگه‌داری می‌شود. بیلد باید **byte-identical** تکرارپذیر باشد.

### انتشار (Release)
```bash
git add -A && git commit -m "…" && git push origin main
```
`index.html`، تنها خروجی قابل ارائه است؛ آن را می‌توانید مستقیم باز کنید یا در یک پوشهٔ ثابت (مثلاً
`https://<user>.github.io/agent-harness-talk/`) میزبانی کنید تا آفلاین هم کار کند.

### قلاب ویدئوی دمو (VIDEO_SRC hook)
اسلاید «دموی زنده» یک قاب ویدئو دارد. اگر ویدئوی آماده دارید، مقدار `const VIDEO_SRC = ''` را در انتهای
اسکریپت ارائه با داده‌ی base64 پر کنید؛ در غیر این صورت همان قاب، متن راهنما را نشان می‌دهد.

### ابزارهای تست (Test tools)
```bash
node src/tools/itest.mjs                 # همهٔ ۱۳ اسلاید و دموها + بررسی خطای کنسول
node src/tools/fit.mjs index.html 1280x720 1920x1080   # گزارش سرریز/خروج از کادر
node src/tools/shot.mjs index.html 2 out.png            # اسکرین‌شات (WS=1280,720 برای اندازهٔ دلخواه)
node src/tools/probe.mjs index.html "<js-expression>"   # اجرای یک عبارت در صفحه و چاپ JSON
```
