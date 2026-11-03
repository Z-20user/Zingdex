# -*- coding: utf-8 -*-
"""把版权说明生成为应用内页面 apps/web/terms.html，并把 PDF 一起放进资源目录。

用法：python tools/build_terms.py <使用说明与版权声明.md>
产物：
    apps/web/terms.html          应用内可完整阅读的页面（电脑 / 手机同一份）
    apps/web/assets/terms.pdf    一键导出的那份 PDF（两端同一文件）
"""
import io
import os
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SITE = os.path.join(ROOT, "apps", "web")

sys.path.insert(0, HERE)
import md2html  # noqa: E402

if len(sys.argv) < 2:
    sys.exit("用法：python tools/build_terms.py <使用说明与版权声明.md>")
MD = sys.argv[1]
# PDF 与 markdown 同名同目录：改名时两边一起改，不会指到旧文件
PDF_SRC = os.path.splitext(MD)[0] + ".pdf"

PAGE = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>使用说明与版权声明 — Zingdex</title>
<link rel="stylesheet" href="assets/fonts.css?v=3.17.1">
<script>
  (function () {
    try {
      var s = JSON.parse(localStorage.getItem("tr-settings") || "{}");
      var t = s.theme || "auto";
      if (t === "auto") {
        // WebView 的 prefers-color-scheme 跟的是应用主题，安卓上不可靠，优先问原生
        var sysDark = null;
        try {
          if (window.ZingdexHost && ZingdexHost.systemDark) sysDark = ZingdexHost.systemDark();
        } catch (e) {}
        if (sysDark === null) sysDark = matchMedia("(prefers-color-scheme: dark)").matches;
        t = sysDark ? "dark" : "light";
      }
      document.documentElement.dataset.theme = t;
      if (s.fs) document.documentElement.dataset.fs = s.fs;
      if (s.lh) document.documentElement.dataset.lh = s.lh;
    } catch (e) { document.documentElement.dataset.theme = "light"; }
  })();
</script>
<style>
  :root {
    --bg: #F7F6F2; --surface: #FFFFFF; --line: #E3E0D5;
    --ink: #14160F; --ink-2: #5C6154; --ink-3: #8B9080;
    --acc: #C6F24C; --acc-deep: #4F6B00;
    --fs-base: 15px; --lh-base: 1.85;
  }
  [data-theme="dark"] {
    --bg: #0A0B0D; --surface: #14171C; --line: #24282F;
    --ink: #F3F2ED; --ink-2: #A6ACB6; --ink-3: #6C7280;
    --acc-deep: #C6F24C;
  }
  [data-fs="s"] { --fs-base: 14px; }
  [data-fs="l"] { --fs-base: 17px; }
  [data-lh="tight"] { --lh-base: 1.6; }
  [data-lh="loose"] { --lh-base: 2.05; }

  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body { margin: 0; padding: 0; }
  body {
    background: var(--bg); color: var(--ink);
    font-family: -apple-system, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
    font-size: var(--fs-base); line-height: var(--lh-base);
    padding-bottom: calc(env(safe-area-inset-bottom) + 30px);
  }

  .bar {
    position: sticky; top: 0; z-index: 10;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: calc(env(safe-area-inset-top) + 12px) 18px 12px;
    background: color-mix(in srgb, var(--bg) 90%, transparent);
    backdrop-filter: blur(14px) saturate(1.3);
    -webkit-backdrop-filter: blur(14px) saturate(1.3);
    border-bottom: 1px solid var(--line);
  }
  .bar b { font-size: 14px; letter-spacing: 0.02em; }
  .bar .acts { display: flex; gap: 8px; }
  .btn {
    padding: 9px 15px; border-radius: 999px; font-size: 13px; font-weight: 600;
    border: 1px solid var(--line); background: var(--surface); color: var(--ink-2);
    font-family: inherit;
  }
  .btn--solid { background: var(--acc); border-color: var(--acc); color: #10130A; }
  [data-theme="dark"] .btn--solid { background: var(--acc); border-color: var(--acc); color: #10130A; }

  .doc {
    max-width: 760px; margin: 0 auto;
    padding: 24px 20px 40px;
  }
  .doc h1 { font-size: 24px; margin: 0 0 10px; letter-spacing: -0.015em; line-height: 1.35; }
  .doc h2 {
    font-size: 17px; margin: 30px 0 10px; padding-left: 10px;
    border-left: 3.5px solid var(--acc); line-height: 1.45;
  }
  .doc h3 { font-size: 15px; margin: 20px 0 6px; color: var(--ink); }
  .doc h4 { font-size: 14px; margin: 16px 0 6px; color: var(--ink-2); }
  .doc p { margin: 0 0 12px; }
  .doc ul, .doc ol { margin: 0 0 14px; padding-left: 20px; }
  .doc li { margin-bottom: 6px; }
  .doc blockquote {
    margin: 0 0 14px; padding: 12px 14px; border-radius: 10px;
    background: color-mix(in srgb, var(--acc) 10%, transparent);
    border-left: 3px solid var(--acc); color: var(--ink-2);
  }
  .doc blockquote p { margin: 0 0 6px; }
  .doc blockquote p:last-child { margin-bottom: 0; }
  .doc table {
    width: 100%; border-collapse: collapse; margin: 10px 0 16px; font-size: 13.5px;
    display: block; overflow-x: auto;
  }
  .doc th { background: color-mix(in srgb, var(--acc) 14%, transparent); text-align: left; }
  .doc th, .doc td { border: 1px solid var(--line); padding: 8px 10px; vertical-align: top; }
  .doc code {
    font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12.5px;
    background: color-mix(in srgb, var(--ink) 7%, transparent);
    padding: 1px 5px; border-radius: 4px;
  }
  .doc pre {
    background: color-mix(in srgb, var(--ink) 5%, transparent);
    border: 1px solid var(--line); border-radius: 10px;
    padding: 12px 14px; overflow-x: auto; font-size: 12.5px; line-height: 1.7;
  }
  .doc hr { border: 0; border-top: 1px solid var(--line); margin: 26px 0; }
  .doc a { color: var(--acc-deep); text-decoration: none; border-bottom: 1px solid currentColor; }
  .doc img { display: block; width: 190px; max-width: 70%; height: auto; margin: 12px auto; border-radius: 10px; background: #fff; padding: 8px; border: 1px solid var(--line); }
  .doc strong { font-weight: 700; }

  .tip {
    max-width: 760px; margin: 0 auto; padding: 0 20px 8px;
    font-size: 12.5px; color: var(--ink-3); line-height: 1.8;
  }
  .toast {
    position: fixed; left: 50%; bottom: calc(env(safe-area-inset-bottom) + 26px);
    transform: translate(-50%, 12px); opacity: 0; pointer-events: none;
    background: var(--acc); color: #10130A; font-weight: 600; font-size: 13.5px;
    padding: 11px 20px; border-radius: 999px; z-index: 20; transition: opacity .18s, transform .18s;
    max-width: 86vw; text-align: center;
  }
  .toast.on { opacity: 1; transform: translate(-50%, 0); }
</style>
</head>
<body>

<div class="bar">
  <button class="btn" type="button" data-back>← 返回</button>
  <b>使用说明与版权声明</b>
  <div class="acts">
    <button class="btn btn--solid" type="button" data-export>导出 PDF</button>
  </div>
</div>

<main class="doc">
__BODY__
</main>

<p class="tip">
  本文档随应用完整内置，可离线阅读。点右上角「导出 PDF」可保存或分享同一份文件。
</p>

<div class="toast" data-toast></div>

<script>
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);

  let toastTimer = 0;
  function toast(msg) {
    const el = $("[data-toast]");
    el.textContent = msg;
    el.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("on"), 1800);
  }

  document.addEventListener("click", async (e) => {
    if (e.target.closest("[data-back]")) {
      if (history.length > 1) history.back();
      else location.href = "library.html";
      return;
    }

    if (e.target.closest("[data-export]")) {
      // 桌面：主进程复制内置 PDF
      if (window.zingdex && typeof window.zingdex.saveDoc === "function") {
        try {
          const r = await window.zingdex.saveDoc();
          if (r && r.ok) toast("已保存到 " + r.filePath);
          else if (r && !r.cancelled) toast("保存失败");
        } catch (err) { toast("保存失败"); }
        return;
      }
      // 手机：原生把内置 PDF 交给系统分享
      if (window.ZingdexHost && typeof window.ZingdexHost.shareDoc === "function") {
        try { window.ZingdexHost.shareDoc(); } catch (err) { /* noop */ }
        return;
      }
      // 纯网页：直接下载
      const a = document.createElement("a");
      a.href = "assets/terms.pdf";
      a.download = "Zingdex-使用说明与版权声明.pdf";
      a.click();
      toast("已开始下载");
    }
  });
})();
</script>
</body>
</html>
"""


def main():
    md = io.open(MD, encoding="utf-8").read()
    body = md2html.to_body(md)
    # 图片路径要指向 assets/，否则内嵌页面会 404
    body = body.replace('src="contact-qr.png"', 'src="assets/contact-qr.png"')
    html = PAGE.replace("__BODY__", body)
    out = os.path.join(SITE, "terms.html")
    io.open(out, "w", encoding="utf-8").write(html)
    print("terms.html ->", out, "(%.1f KB)" % (len(html) / 1024))

    dst_pdf = os.path.join(SITE, "assets", "terms.pdf")
    if os.path.exists(PDF_SRC):
        shutil.copy2(PDF_SRC, dst_pdf)
        print("terms.pdf  ->", dst_pdf, "(%.0f KB)" % (os.path.getsize(dst_pdf) / 1024))
    else:
        print("！没找到 PDF：", PDF_SRC)


if __name__ == "__main__":
    main()
