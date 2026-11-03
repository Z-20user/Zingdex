/* Zingdex — app.js
   共享导航/页脚渲染 + 各页面逻辑
*/

const LOGO = (size = 26) => `
<svg width="${size}" height="${size}" viewBox="0 0 26 26" aria-hidden="true">
  <defs>
    <linearGradient id="trInk" x1="0.85" y1="0.12" x2="0.05" y2="0.95">
      <stop offset="0" stop-color="#14160F"/>
      <stop offset="1" stop-color="#DCEFB0"/>
    </linearGradient>
  </defs>
  <rect width="26" height="26" rx="6.4" fill="#C6F24C"/>
  <circle cx="17.5" cy="9.7" r="4.7" fill="#14160F"/>
  <path d="M15 11.6C12 13.5 9.7 16.5 8.6 20.3c-.25.85.6 1.4 1.25.95 2.8-2.1 4.9-5 6-8.1.35-.95-.2-1.9-.85-1.55z"
        fill="url(#trInk)"/>
</svg>`;

const ARROW = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
  <path d="M2.5 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const SEARCH_ICON = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
  <circle cx="6" cy="6" r="4.6" stroke="#6C7280" stroke-width="1.4"/>
  <path d="M9.6 9.6L12.6 12.6" stroke="#6C7280" stroke-width="1.4" stroke-linecap="round"/></svg>`;

const THEME_TOGGLE = `
<button class="theme-toggle" data-theme-toggle aria-label="切换深色 / 浅色主题" title="切换主题">
  <svg class="i-moon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M13.4 9.9A5.9 5.9 0 0 1 6.1 2.6a4.8 4.8 0 1 0 7.3 7.3Z"
          stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
  </svg>
  <svg class="i-sun" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="3.1" stroke="currentColor" stroke-width="1.3"/>
    <path d="M8 1.1v1.5M8 13.4v1.5M1.1 8h1.5M13.4 8h1.5M3.2 3.2l1 1M11.8 11.8l1 1M12.8 3.2l-1 1M4.2 11.8l-1 1"
          stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
  </svg>
  <span class="theme-toggle__knob"></span>
</button>`;

const GEAR_ICON = `
<a class="nav__icon" href="settings.html" aria-label="设置" title="设置">
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="2.4" stroke="currentColor" stroke-width="1.3"/>
    <path d="M8 1.4v1.7M8 12.9v1.7M1.4 8h1.7M12.9 8h1.7M3.4 3.4l1.2 1.2M11.4 11.4l1.2 1.2M12.6 3.4l-1.2 1.2M4.6 11.4l-1.2 1.2"
          stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
  </svg>
</a>`;

/* ---------- 动效预览块 ---------- */

function motifHTML(motif) {
  switch (motif) {
    case "dock":
      return `<div class="pv pv--dock"><i></i><i></i><i></i><i></i><i></i></div>`;
    case "shimmer":
      return `<div class="pv pv--shimmer"><b></b><b></b><b></b></div>`;
    case "ring":
      return `<div class="pv pv--ring"><b></b><s>72%</s></div>`;
    case "bars":
      return `<div class="pv pv--bars"><i></i><i></i><i></i><i></i><i></i><i></i></div>`;
    case "particles":
      return `<div class="pv pv--particles"></div>`;
    case "curve":
      return `<div class="pv pv--curve"><svg viewBox="0 0 200 100" preserveAspectRatio="none">
        <path class="grid" d="M14 10V88H188M14 40H188M14 64H188M70 10V88M126 10V88"/>
        <path class="path" d="M14 88C76 88 98 14 188 14"/></svg></div>`;
    case "mask":
      return `<div class="pv pv--mask"><b>SCALE IN</b></div>`;
    case "tilt":
      return `<div class="pv pv--tilt"><b></b></div>`;
    case "wave":
      return `<div class="pv pv--wave"><b></b></div>`;
    default:
      return `<div class="pv pv--ripple"><i></i><i></i><i></i></div>`;
  }
}

/* ---------- 预览母版选择：按语义匹配，避免「文字遮罩」显示成曲线 ---------- */

const MOTIF_RULES = [
  [/粒子|爆破|聚合|散点/, "particles"],
  [/骨架|微光|占位|脉冲|呼吸|闪烁/, "shimmer"],
  [/环|进度|仪表|填充|强度/, "ring"],
  [/柱|生长|数据|走势|桑基|雷达|迷你|数字/, "bars"],
  [/曲线|缓动|折线|路径|描边/, "curve"],
  [/涟漪|扩散|通知|提示|成功|点击|角标/, "ripple"],
  [/形变|液态|波浪|有机|果冻|液体/, "wave"],
  [/倾斜|抬升|玻璃|全息|堆叠|堆栈|卡片|网格|视差|边框|聚光|展开|收起|折叠/, "tilt"],
  [/遮罩|蒙版|擦除|揭示|文字|字符|跑马|字重|字格|排版|幕布|翻页|穿越|解码|打孔|逐字|光标/, "mask"],
  [/导航|按钮|菜单|岛|速拨|标签|面包屑|图标|旋转|切换|放大|抽屉|侧栏|磁吸|超级/, "dock"]
];


/* 目录里的 fam（25 种）映射到站点已有的 10 套母版 */
const FAM_MOTIF = {
  slide: "dock", scale: "dock", rotate: "dock", flip: "tilt",
  clip: "mask", text: "mask", draw: "curve", dash: "curve",
  blur: "shimmer", skeleton: "shimmer", dots: "shimmer",
  spring: "wave", bounce: "wave", morph: "wave",
  particles: "particles", glow: "shimmer", pulse: "ripple",
  shake: "ripple", ripple: "ripple", wave: "wave",
  orbit: "ring", gauge: "ring", marquee: "bars",
  gradient: "wave", tilt: "tilt", parallax: "tilt"
};
function famToMotif(fam) {
  return FAM_MOTIF[fam] || "dock";
}

function motifFor(cat, seed) {
  const text = `${cat.zh} ${cat.en}`;
  for (const [re, motif] of MOTIF_RULES) if (re.test(text)) return motif;
  return MOTIFS[seed % MOTIFS.length];
}

function easeKey(ease) {
  const keys = ["ease-out-expo", "ease-out-cubic", "ease-in-out-quart", "spring"];
  if (keys.includes(ease)) return ease;
  if (/spring/.test(ease)) return "spring";
  if (/in-out/.test(ease)) return "ease-in-out-quart";
  if (/back|quint/.test(ease)) return "spring";
  return "ease-out-expo";
}

/* ---------- 导航 ---------- */

const NAV_ITEMS = [
  { key: "home", href: "index.html", label: "首页" },
  { key: "library", href: "library.html", label: "组件库" },
  { key: "motion", href: "motion.html", label: "动效规范" },
  { key: "guide", href: "guide.html", label: "接入指南" },
  { key: "ai", href: "ai.html", label: "AI 接入" }
];

function renderNav(active) {
  const links = NAV_ITEMS.map(
    (i) =>
      `<a class="nav__link" href="${i.href}"${i.key === active ? ' aria-current="page"' : ""}>${i.label}</a>`
  ).join("");

  return `
<header class="nav">
  <div class="wrap nav__in">
    <a class="brand" href="index.html" aria-label="Zingdex 首页">
      ${LOGO(26)}
      <span class="brand__word">Zingdex</span>
    </a>
    <nav class="nav__links" aria-label="主导航">${links}</nav>
    <div class="nav__right">
      <label class="search-pill">
        ${SEARCH_ICON}
        <input type="search" placeholder="搜索组件或分类" aria-label="搜索组件" data-global-search>
      </label>
      ${THEME_TOGGLE}
      ${GEAR_ICON}
      <a class="btn btn--solid btn--sm btn--nav" href="library.html">开始使用</a>
      <a class="nav__note" href="license.html#summary" title="开始之前：这段说明讲清能用什么、不能做什么">相关说明</a>
      <button class="nav__burger" aria-label="打开菜单" aria-expanded="false" data-burger>
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
          <path d="M0 1h18M0 6h12M0 11h18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </div>
  <div class="nav__mobile" data-mobile-menu hidden></div>
</header>`;
}

function renderFooter() {
  const specs = window.LIB ? window.LIB.items.filter((x) => ["phone","wide","vehicle","wear","terminal"].indexOf(x.group) >= 0).length : 0;
  const total = window.LIB ? window.LIB.items.length : 0;
  const meta = specs ? specs + " 个组件 · " + total + " 条条目 · 完全离线" : "完全离线 · 无任何网络请求";
  return `
<footer class="footer">
  <div class="wrap footer__top">
    <div class="footer__brand">
      <a class="brand" href="index.html">
        ${LOGO(26)}
        <span class="brand__word">Zingdex</span>
      </a>
      <p class="footer__tag">为界面提供有依据的运动。每一个组件都标注触发条件、时长与缓动曲线，代码可以直接复制走。</p>
      <p class="footer__meta">${meta}</p>
    </div>
    <div class="footer__cols">
      <div class="footer__col">
        <h5>产品</h5>
        <a href="library.html">组件库</a>
        <a href="motion.html">动效规范</a>
        <a href="guide.html">接入指南</a>
        <a href="settings.html">设置</a>
      </div>
      <div class="footer__col">
        <h5>资源</h5>
        <a href="resources.html">插件与资源</a>
        <a href="usage.html">使用规范</a>
        <a href="usage.html#keys">快捷键</a>
        <a href="usage.html#faq">常见问题</a>
      </div>
      <div class="footer__col">
        <h5>关于</h5>
        <a href="license.html">开源许可</a>
        <a href="license.html#versions">版本记录</a>
        <a href="usage.html#offline">离线说明</a>
        <a href="license.html#c7">免责声明</a>
      </div>
    </div>
  </div>
  <div class="footer__word" aria-hidden="true">Zingdex</div>
  <div class="wrap footer__bottom">
    <span>© 2026 Zingdex · 由跃索相关团队开发与维护</span>
    <span class="footer__hint">Esc 退出全屏 · F11 切换全屏 · 右键退出全屏 · 详情页可「调参数 / 对比默认」</span>
    <span class="footer__off">离线可用 · 无任何网络请求</span>
  </div>
</footer>`;
}

/* ---------- 组件库访问层 ---------- */

function MOTIONS() {
  return window.Zingdex || null;
}

function effectEntry(sceneId, catEn) {
  const lib = MOTIONS();
  if (!lib) return null;
  const s = SCENES.find((x) => x.id === sceneId);
  const c = s && s.cats.find((y) => y.en === catEn);
  if (c && c.fx) {
    const fid = c.fx.replace(/^fx-/, "");
    if (lib.byId && lib.byId[fid]) return lib.byId[fid];
    if (lib.byId && lib.byId[c.fx]) return lib.byId[c.fx];
  }
  const id = lib.CATALOG && lib.CATALOG[sceneId + ":" + catEn];
  return id && lib.byId ? lib.byId[id] : null;
}

function effectAt(sceneId, catIndex) {
  const s = SCENES.find((x) => x.id === sceneId);
  if (!s || !s.cats[catIndex]) return null;
  return effectEntry(sceneId, s.cats[catIndex].en);
}

function readyEffectCount() {
  const lib = MOTIONS();
  return lib ? lib.EFFECTS.length : 0;
}

function sceneReadyCount(sceneId) {
  return SCENES.find((s) => s.id === sceneId).cats.filter((c) => effectEntry(sceneId, c.en)).length;
}

/* 让组件在舞台里“填满但不溢出”：小元件放大，大面板保持原尺寸 */
/* ---------- 重播：把舞台里所有动画拉回第 0 帧 ---------- */

function replayStage(stage) {
  if (!stage) return false;
  let list = [];
  try {
    if (typeof stage.getAnimations === "function") {
      list = stage.getAnimations({ subtree: true });
    }
  } catch (e) {
    list = [];
  }
  if (!list.length) return false;
  list.forEach((a) => {
    try {
      a.currentTime = 0;
      if (a.playState === "paused" || a.playState === "idle") a.play();
    } catch (e) {
      /* 单个动画失败不影响其它 */
    }
  });
  return true;
}

function flashLabel(btn, text) {
  if (!btn) return;
  const old = btn.dataset.label || btn.textContent;
  btn.dataset.label = old;
  btn.textContent = text;
  btn.classList.add("is-flash");
  window.clearTimeout(btn._ft);
  btn._ft = window.setTimeout(() => {
    btn.textContent = old;
    btn.classList.remove("is-flash");
  }, 700);
}

function fitStage(stage) {
  if (!stage) return;

  function apply() {
    const el = Array.from(stage.children).find((c) => c.tagName !== "STYLE");
    if (!el) return;
    // offsetWidth / offsetHeight 不受 transform 影响，量的是真实布局尺寸
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const box = stage.getBoundingClientRect();
    if (!w || !h || !box.width || !box.height) return;
    const s = Math.min(1.7, Math.min((box.width * 0.84) / w, (box.height * 0.8) / h));
    el.style.transform = s > 1.03 ? "scale(" + s.toFixed(2) + ")" : "";
  }

  apply();
  setTimeout(apply, 80);
}

/* 把组件真实代码挂到容器：看到的样式，就是复制出去的样式 */
function paint(container, effect, settings, runJs) {
  const lib = MOTIONS();
  if (!lib || !effect) return null;
  const code = lib.build(effect, settings || {});
  container.innerHTML = "<style>" + code.css + "</style>" + code.html;

  if (runJs) {
    if (code.jsBody) {
      try {
        new Function("root", code.jsBody)(container);
      } catch (err) {
        console.warn("[Zingdex] init failed:", err);
      }
    }
    if (effect.demo) {
      try {
        effect.demo(container, code.params);
      } catch (err) {
        console.warn("[Zingdex] demo failed:", err);
      }
    }
  }
  return code;
}

const previewCache = new Map();
function staticCode(effect) {
  const lib = MOTIONS();
  if (!lib) return { html: "", css: "", jsBody: "" };
  if (!previewCache.has(effect.id)) previewCache.set(effect.id, lib.build(effect, {}));
  return previewCache.get(effect.id);
}

/* 所有组件共用一个样式表，避免每张卡片重复注入 */
function ensureLibStyles() {
  const lib = MOTIONS();
  if (!lib) return;
  let style = document.querySelector("[data-lib-styles]");
  if (!style) {
    style = document.createElement("style");
    style.setAttribute("data-lib-styles", "");
    document.head.appendChild(style);
  }
  style.textContent = lib.EFFECTS.map((e) => staticCode(e).css).join("\n");
}

/* 卡片预览：注入真实代码并启动该组件的自动演示 */
function mountCardPreview(host, effect) {
  const code = staticCode(effect);
  host.innerHTML = '<div class="pv-live"><div class="pv-live__in">' + code.html + "</div></div>";
  const root = host.querySelector(".pv-live__in");
  if (!root) return;
  if (code.jsBody) {
    try { new Function("root", code.jsBody)(root); } catch (err) { /* 预览容错 */ }
  }
  if (effect.demo) {
    try { effect.demo(root, code.params); } catch (err) { /* 预览容错 */ }
  }
}

function previewMarkup(effect) {
  return '<div class="pv-live" data-preview="' + effect.id + '"></div>';
}

/* 渲染完成后统一挂载预览：真实代码 + 自动演示 */
function hydratePreviews(scope) {
  if (!scope) return;
  scope.querySelectorAll("[data-preview]").forEach((host) => {
    const effect = MOTIONS() && MOTIONS().byId[host.dataset.preview];
    if (effect) mountCardPreview(host, effect);

    // 卡片是 <a>，组件里的按钮/标签被点击时会触发跳转：
    // 在链接层拦掉来自预览区的默认行为，组件自身的交互照常工作
    const link = host.closest("a");
    if (link && !link.dataset.guarded) {
      link.dataset.guarded = "1";
      link.addEventListener("click", (e) => {
        if (e.target.closest("[data-preview]")) e.preventDefault();
      });
    }
  });
}

/* ---------- 原生桥（桌面壳） ---------- */

function nativeApi() {
  return window.pywebview && window.pywebview.api ? window.pywebview.api : null;
}

async function copyText(text, btn, label) {
  let ok = false;
  try {
    if (window.zingdex && window.zingdex.copy) {
      const res = await window.zingdex.copy(text);
      ok = !(res && res.ok === false);
    } else if (nativeApi() && nativeApi().copy) {
      await nativeApi().copy(text);
      ok = true;
    } else if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      ok = true;
    }
  } catch (err) {
    ok = false;
  }
  if (!ok) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;left:-9999px;top:0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); ok = true; } catch (e) { ok = false; }
    ta.remove();
  }
  if (btn) {
    const old = btn.textContent;
    btn.textContent = ok ? (label || "已复制") : "复制失败";
    setTimeout(() => (btn.textContent = old), 1400);
  }
  return ok;
}

function downloadText(filename, text) {
  if (window.zingdex && window.zingdex.saveText) {
    window.zingdex.saveText(filename, text);
    return;
  }
  const api = nativeApi();
  if (api && api.save_text) {
    api.save_text(filename, text);
    return;
  }
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ---------- 交给 AI ---------- */

/* 名单在 paths.js，自定义项与模板在 ai.js（三端共用） */
const AI_TARGETS_CN = (window.TZP && window.TZP.AI_TARGETS_CN) || [];
const AI_TARGETS_INTL = (window.TZP && window.TZP.AI_TARGETS_INTL) || [];

function aiChipHTML(t) {
  const x = t.custom
    ? '<i class="ai-btn__x" data-ai-del="' + t.key + '" title="删除这个自定义项">×</i>'
    : "";
  return '<button class="ai-btn' + (t.custom ? " ai-btn--own" : "") +
    '" type="button" data-ai="' + t.key + '">' + t.label + x + "</button>";
}

function aiOwnHTML() {
  const own = window.TZAI ? window.TZAI.custom() : [];
  return own.map(aiChipHTML).join("");
}

function aiRowHTML() {
  const tpl = window.TZAI ? window.TZAI.template() : {};
  const tplRows = (window.TZAI ? window.TZAI.TPL_FIELDS : []).map(function (f) {
    return '<label class="ai-field"><span>' + f.label + "</span>" +
      '<input data-ai-tpl-field="' + f.k + '" placeholder="' + f.ph + '" value="' +
      String(tpl[f.k] || "").replace(/"/g, "&quot;") + '"></label>';
  }).join("");

  return '<div class="ai-row">' +
      '<span class="ai-row__lb">交给 AI</span>' +
      '<span class="ai-group">' + AI_TARGETS_CN.map(aiChipHTML).join("") + "</span>" +
      '<button class="ai-btn ai-btn--more" type="button" data-ai-more aria-expanded="false">海外 ' +
        AI_TARGETS_INTL.length + " 个 ▾</button>" +
      '<span class="ai-group ai-group--intl" data-ai-intl hidden>' +
        AI_TARGETS_INTL.map(aiChipHTML).join("") + "</span>" +
      '<span class="ai-group ai-group--own" data-ai-own>' + aiOwnHTML() + "</span>" +
      '<button class="ai-btn ai-btn--ghost" type="button" data-ai-custom-add>+ 自定义</button>' +
      '<button class="ai-btn ai-btn--ghost" type="button" data-ai-tpl-toggle aria-expanded="false">模板</button>' +
    "</div>" +
    '<div class="ai-panel" data-ai-custom-panel hidden>' +
      '<div class="ai-panel__r">' +
        '<input data-ai-name placeholder="名称，如「本地 Ollama」">' +
        '<input data-ai-url placeholder="网址；支持 {q} 占位，如 https://x.com/?q={q}">' +
        '<button class="btn btn--solid btn--sm" type="button" data-ai-save>保存</button>' +
        '<button class="btn btn--ghost btn--sm" type="button" data-ai-cancel>取消</button>' +
      "</div>" +
      '<p class="ai-hint" data-ai-msg>只存在本机。网址里的 {q} 会把提示词拼进去；没有 {q} 就只复制、打开站点。</p>' +
    "</div>" +
    '<div class="ai-panel" data-ai-tpl-panel hidden>' +
      '<div class="ai-grid">' + tplRows + "</div>" +
      '<div class="ai-panel__r"><button class="btn btn--solid btn--sm" type="button" data-ai-tpl-save>保存模板</button>' +
        '<span class="ai-hint">保存后，每次复制提示词都会自动附上这些约束。</span></div>' +
    "</div>";
}

function openInBrowser(url) {
  if (window.TZAI) { window.TZAI.openUrl(url); return; }
  if (window.zingdex && typeof window.zingdex.openExternal === "function") {
    window.zingdex.openExternal(url);
    return;
  }
  window.open(url, "_blank", "noopener");
}

function bindAiRow(scope, getPrompt) {
  if (!scope) return;

  const more = scope.querySelector("[data-ai-more]");
  const intl = scope.querySelector("[data-ai-intl]");
  if (more && intl) {
    more.addEventListener("click", () => {
      const open = intl.hasAttribute("hidden");
      if (open) intl.removeAttribute("hidden");
      else intl.setAttribute("hidden", "");
      more.setAttribute("aria-expanded", open ? "true" : "false");
      more.textContent = open ? "收起 ▴" : "海外 " + AI_TARGETS_INTL.length + " 个 ▾";
    });
  }

  // 自定义面板
  const cPanel = scope.querySelector("[data-ai-custom-panel]");
  const cAdd = scope.querySelector("[data-ai-custom-add]");
  if (cAdd && cPanel) {
    cAdd.addEventListener("click", () => { cPanel.hidden = !cPanel.hidden; });
    const cancel = cPanel.querySelector("[data-ai-cancel]");
    if (cancel) cancel.addEventListener("click", () => { cPanel.hidden = true; });
    const save = cPanel.querySelector("[data-ai-save]");
    if (save) {
      save.addEventListener("click", () => {
        const name = cPanel.querySelector("[data-ai-name]");
        const url = cPanel.querySelector("[data-ai-url]");
        const msg = cPanel.querySelector("[data-ai-msg]");
        const n = (name && name.value || "").trim();
        const u = (url && url.value || "").trim();
        if (!n || !u) { if (msg) msg.textContent = "名称和网址都要填。"; return; }
        const list = window.TZAI ? window.TZAI.addCustom(n, u) : [];
        const own = scope.querySelector("[data-ai-own]");
        if (own && window.TZAI) own.innerHTML = list.map(aiChipHTML).join("");
        if (name) name.value = "";
        if (url) url.value = "";
        if (msg) msg.textContent = "已添加「" + n + "」。";
        cPanel.hidden = true;
      });
    }
  }

  // 模板面板
  const tPanel = scope.querySelector("[data-ai-tpl-panel]");
  const tBtn = scope.querySelector("[data-ai-tpl-toggle]");
  if (tBtn && tPanel) {
    tBtn.addEventListener("click", () => {
      const open = tPanel.hidden;
      tPanel.hidden = !open;
      tBtn.setAttribute("aria-expanded", open ? "true" : "false");
      tBtn.classList.toggle("is-on", open);
    });
    const tSave = tPanel.querySelector("[data-ai-tpl-save]");
    if (tSave) {
      tSave.addEventListener("click", () => {
        const vals = {};
        tPanel.querySelectorAll("[data-ai-tpl-field]").forEach((el) => {
          vals[el.dataset.aiTplField] = el.value;
        });
        if (window.TZAI) window.TZAI.saveTemplate(vals);
        flashLabel(tSave, "已保存");
      });
    }
  }

  // 点 AI：复制 + 打开/分享；点 × 删除自定义
  scope.addEventListener("click", async (e) => {
    const del = e.target.closest("[data-ai-del]");
    if (del) {
      e.preventDefault();
      e.stopPropagation();
      if (window.TZAI) {
        const list = window.TZAI.removeCustom(del.dataset.aiDel);
        const own = scope.querySelector("[data-ai-own]");
        if (own) own.innerHTML = list.map(aiChipHTML).join("");
      }
      return;
    }
    const btn = e.target.closest("[data-ai]");
    if (!btn) return;
    const key = btn.dataset.ai;
    const target = (window.TZAI ? window.TZAI.all() : AI_TARGETS_CN.concat(AI_TARGETS_INTL))
      .find((t) => t.key === key);
    if (!target) return;
    const base = getPrompt();
    const text = window.TZAI ? window.TZAI.composeFrom(base) : base;
    if (window.TZAI) {
      const r = await window.TZAI.send(target, text);
      flashLabel(btn, r.shared ? "已唤起分享" : "已复制，去粘贴");
    } else {
      const ok = await copyText(text, null, "");
      if (!ok) return;
      flashLabel(btn, "已复制，去粘贴");
      openInBrowser(target.url);
    }
  });
}

/* ---------- AI 接入管理（设置页） ---------- */

function aiManagerChip(t) {
  const x = t.custom
    ? '<i class="ai-btn__x" data-aim-del="' + t.key + '" title="删除">×</i>'
    : "";
  return '<button class="ai-btn' + (t.custom ? " ai-btn--own" : "") +
    '" type="button" data-aim-open="' + t.key + '">' + t.label + x + "</button>";
}

function aiManagerHTML() {
  const own = window.TZAI ? window.TZAI.custom() : [];
  const tpl = window.TZAI ? window.TZAI.template() : {};
  const fields = (window.TZAI ? window.TZAI.TPL_FIELDS : []).map(function (f) {
    return '<label class="ai-field"><span>' + f.label + "</span>" +
      '<input data-aim-tpl-field="' + f.k + '" placeholder="' + f.ph + '" value="' +
      String(tpl[f.k] || "").replace(/"/g, "&quot;") + '"></label>';
  }).join("");

  return '<p class="ai-hint">点站点直接用浏览器打开；在组件详情页点同一个按钮，会先复制提示词再打开。' +
      '网址里写 <code>{q}</code> 的站点，会把提示词拼进链接直接带过去。</p>' +
    '<div class="ai-sub">国内常驻 ' + AI_TARGETS_CN.length + " 个</div>" +
    '<div class="ai-group">' + AI_TARGETS_CN.map(aiManagerChip).join("") + "</div>" +
    '<div class="ai-sub">海外 ' + AI_TARGETS_INTL.length + " 个</div>" +
    '<div class="ai-group">' + AI_TARGETS_INTL.map(aiManagerChip).join("") + "</div>" +
    '<div class="ai-sub">自定义 <span data-aim-count>' + own.length + " 个</span></div>" +
    '<div class="ai-group" data-aim-own>' + own.map(aiManagerChip).join("") + "</div>" +
    '<div class="ai-panel__r" style="margin-top:8px">' +
      '<input data-aim-name placeholder="名称，如「本地 Ollama」">' +
      '<input data-aim-url placeholder="网址，可含 {q} 占位">' +
      '<button class="btn btn--solid btn--sm" type="button" data-aim-add>添加</button>' +
    "</div>" +
    '<p class="ai-hint" data-aim-msg>自定义项只存在本机。</p>' +
    '<div class="ai-sub">提示词模板（每次复制都会自动附加）</div>' +
    '<div class="ai-grid">' + fields + "</div>" +
    '<div class="ai-panel__r" style="margin-top:8px">' +
      '<button class="btn btn--solid btn--sm" type="button" data-aim-tpl-save>保存模板</button>' +
      '<span class="ai-hint" data-aim-tpl-msg></span>' +
    "</div>";
}

function initAiPage() {
  initAiManager();

  // 演示用组件库自己的动效：同名条目里挑一条可渲染的
  document.querySelectorAll("[data-ai-demo] [data-demo]").forEach(function (host) {
    if (!window.LIB || host.dataset.mounted) return;
    const name = host.dataset.demo;
    const item = window.LIB.items.find(function (x) {
      return x.zh === name && x.group !== "base" && x.group !== "gl";
    });
    if (!item) return;
    host.dataset.mounted = "1";
    host.setAttribute("data-loop", "1");   // 演示区保留循环，列表才收口
    try { window.LIB.mount(host, item, true); } catch (e) { /* noop */ }
  });
}

function initAiManager() {
  const box = document.querySelector("[data-ai-manager]");
  if (!box || !window.TZAI) return;
  box.innerHTML = aiManagerHTML();

  box.addEventListener("click", (e) => {
    const del = e.target.closest("[data-aim-del]");
    if (del) {
      e.stopPropagation();
      const list = window.TZAI.removeCustom(del.dataset.aimDel);
      repaintOwn(list);
      return;
    }
    const open = e.target.closest("[data-aim-open]");
    if (open) {
      const t = window.TZAI.all().find((x) => x.key === open.dataset.aimOpen);
      if (t) window.TZAI.openUrl(t.url.indexOf("{q}") >= 0 ? t.url.split("{q}").join("") : t.url);
      return;
    }
    if (e.target.closest("[data-aim-add]")) {
      const n = (box.querySelector("[data-aim-name]") || {}).value || "";
      const u = (box.querySelector("[data-aim-url]") || {}).value || "";
      const msg = box.querySelector("[data-aim-msg]");
      if (!n.trim() || !u.trim()) {
        if (msg) msg.textContent = "名称和网址都要填。";
        return;
      }
      const list = window.TZAI.addCustom(n.trim(), u.trim());
      repaintOwn(list);
      box.querySelector("[data-aim-name]").value = "";
      box.querySelector("[data-aim-url]").value = "";
      if (msg) msg.textContent = "已添加「" + n.trim() + "」。";
      return;
    }
    if (e.target.closest("[data-aim-tpl-save]")) {
      const vals = {};
      box.querySelectorAll("[data-aim-tpl-field]").forEach((el) => {
        vals[el.dataset.aimTplField] = el.value;
      });
      window.TZAI.saveTemplate(vals);
      const msg = box.querySelector("[data-aim-tpl-msg]");
      if (msg) msg.textContent = "已保存，下一次复制提示词就会带上。";
    }
  });

  function repaintOwn(list) {
    const own = box.querySelector("[data-aim-own]");
    if (own) own.innerHTML = list.map(aiManagerChip).join("");
    const cnt = box.querySelector("[data-aim-count]");
    if (cnt) cnt.textContent = list.length + " 个";
  }
}

/* ---------- 导出当前文档为 PDF ---------- */

function pad2(n) {
  return String(n).padStart(2, "0");
}

function stampNow(d) {
  return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()) +
    " " + pad2(d.getHours()) + ":" + pad2(d.getMinutes()) + ":" + pad2(d.getSeconds());
}

function removePrintFront() {
  document.querySelectorAll("[data-pdf-front]").forEach((n) => n.remove());
}

function buildPrintFront(title, human, ver) {
  removePrintFront();
  const main = document.querySelector("main");
  if (!main) return;

  const heads = Array.prototype.slice
    .call(document.querySelectorAll(".doc__sec h2, .guide__block h2, .spec-block h2"))
    .map((h) => h.textContent.trim())
    .filter(Boolean);

  const specs = window.LIB ? window.LIB.items.filter((x) => ["phone","wide","vehicle","wear","terminal"].indexOf(x.group) >= 0).length : 0;
  const rows = [
    ["文档", title],
    ["版本", ver ? "v" + ver : "—"],
    ["导出时间", human],
    ["组件总数", specs ? specs + " 个" : "—"],
    ["出具", "跃索相关团队"]
  ];

  const cover = document.createElement("section");
  cover.className = "pdf-front";
  cover.setAttribute("data-pdf-front", "");
  cover.innerHTML =
    '<div class="pdf-cover">' +
      '<div class="pdf-cover__mark"><span>Zingdex</span><i></i></div>' +
      '<h1 class="pdf-cover__title">' + escAttr(title) + "</h1>" +
      '<p class="pdf-cover__sub">跃索 · 动效组件库</p>' +
      '<dl class="pdf-cover__meta">' +
        rows.map((r) => "<div><dt>" + escAttr(r[0]) + "</dt><dd>" + escAttr(r[1]) + "</dd></div>").join("") +
      "</dl>" +
      '<p class="pdf-cover__note">本文件由应用在导出时自动生成，封面与文末的时间不可修改。</p>' +
    "</div>" +
    (heads.length
      ? '<div class="pdf-toc"><h2>目录</h2><ol>' +
        heads.map((t) => "<li>" + escAttr(t) + "</li>").join("") + "</ol></div>"
      : "");

  main.insertBefore(cover, main.firstChild);
}

async function exportDocPdf(title) {
  const now = new Date();
  const human = stampNow(now);
  const compact = String(now.getFullYear()) + pad2(now.getMonth() + 1) + pad2(now.getDate()) +
    "-" + pad2(now.getHours()) + pad2(now.getMinutes());

  let ver = "";
  try {
    if (window.zingdex && typeof window.zingdex.info === "function") {
      const info = await window.zingdex.info();
      ver = (info && info.version) || "";
    }
  } catch (e) {
    /* 浏览器里没有版本信息 */
  }

  document.querySelectorAll("[data-pdf-stamp]").forEach((el) => {
    el.textContent = "导出时间：" + human + " · 该时间由导出时自动生成，不可修改";
  });

  buildPrintFront(title, human, ver);

  const name = "Zingdex-" + title + (ver ? "-v" + ver : "") + "-" + compact + ".pdf";
  const oldTitle = document.title;
  document.title = name.replace(/\.pdf$/, "");
  document.documentElement.classList.add("is-exporting");

  /* 打印时整页必须白底：用内联样式压过主题变量，避免深色主题把页边染黑 */
  const html = document.documentElement;
  const body = document.body;
  const saved = {
    htmlBg: html.style.background,
    bodyBg: body.style.background,
    scheme: html.style.colorScheme
  };
  html.style.background = "#FFFFFF";
  body.style.background = "#FFFFFF";
  html.style.colorScheme = "light";

  try {
    if (window.zingdex && typeof window.zingdex.exportPdf === "function") {
      await window.zingdex.exportPdf({
        filename: name,
        footer: { left: "Zingdex · " + title, right: "导出时间 " + human }
      });
    } else {
      window.print();
      await new Promise((r) => window.setTimeout(r, 700));
    }
  } finally {
    document.title = oldTitle;
    html.style.background = saved.htmlBg;
    body.style.background = saved.bodyBg;
    html.style.colorScheme = saved.scheme;
    document.documentElement.classList.remove("is-exporting");
    removePrintFront();
  }
}

/* 元信息一行：只显示真实存在的字段，不出现 0ms / 0 类设备 / Canvas 2D 这类噪音 */
function metaLine(item) {
  const parts = [];
  const raw = String(item.cat || "");
  const isTech = /canvas|webgl|webgpu|2d|3d|shader/i.test(raw);
  if (raw && !isTech) parts.push(raw);
  else if (item.group === "gl") parts.push("重特效");

  if (item.scene) parts.push(item.scene);

  if (item.duration && item.duration >= 50) parts.push(item.duration + "ms");

  const dev = (item.devices || []).length;
  parts.push(dev ? dev + " 类设备可用" : "通用 · 手机 / 平板 / 桌面 / 小程序");

  return parts.join(" · ");
}

/* ---------- 选入接入台 ---------- */

const PICK_KEY = "tr-pick";

function pinnedUid() {
  try {
    return localStorage.getItem(PICK_KEY) || "";
  } catch (e) {
    return "";
  }
}

function pinItem(uid) {
  try {
    localStorage.setItem(PICK_KEY, uid);
  } catch (e) {
    /* noop */
  }
}

function pinButtonHTML(uid) {
  return '<button class="pin-btn" type="button" data-pin="' + uid + '" title="选入接入台">' +
    '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">' +
    '<path d="M6 1v7M3 5.4L6 8.6l3-3.2M2 10.6h8" stroke="currentColor" stroke-width="1.4" ' +
    'stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
}

/* 选了就跳转：直接进接入指南，整页按这个组件重排 */
function bindPinButtons(scope) {
  if (!scope) return;
  scope.querySelectorAll("[data-pin]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      pinItem(btn.dataset.pin);
      location.href = "guide.html";
    });
  });
}

/* ---------- 10 条常见开发路径（实现在 paths.js，与手机端共用） ---------- */

const DEV_PATHS = (window.TZP && window.TZP.DEV_PATHS) || [];

function escAttr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function codeForPath(item, key) {
  return window.TZP ? window.TZP.codeForPath(item, key) : "";
}

/* ---------- 接入台 ---------- */

function renderGuidePin() {
  const host = document.querySelector("[data-guide-pin]");
  if (!host || !window.LIB) return;

  const uid = pinnedUid();
  const item = uid ? window.LIB.byUid[uid] : null;

  // 规格分片没到齐就先等，到齐后整页重跑一次
  if (item && ["phone","wide","vehicle","wear","terminal"].indexOf(item.group) >= 0 && !item._loaded) {
    window.LIB.ensure(item).then(renderGuidePin);
    return;
  }

  if (!item) {
    host.innerHTML =
      '<div class="pin pin--empty">' +
      '<div class="pin__stage pin__stage--empty">＋</div>' +
      '<div class="pin__side">' +
      '<span class="mono">接入台</span>' +
      '<h2 class="pin__name">还没有选组件</h2>' +
      '<p class="pin__meta">去组件库，点卡片左上角那个「↓」，会直接跳到这里，整页按这个组件重排。</p>' +
      '<div class="pin__acts"><a class="btn btn--solid btn--sm" href="library.html">去组件库挑一个</a></div>' +
      "</div></div>";
    const sec = document.querySelector("[data-guide-paths]");
    if (sec) sec.innerHTML = "";
    return;
  }

  let active = "html";

  host.innerHTML =
    '<div class="pin">' +
    '<div class="pin__stage" data-pin-stage></div>' +
    '<div class="pin__side">' +
    '<div class="pin__head"><span class="mono">当前组件</span>' +
    '<button class="pin__copy" type="button" data-pin-copy>复制代码</button></div>' +
    '<h2 class="pin__name">' + item.zh + "</h2>" +
    '<p class="pin__meta">' + metaLine(item) + "</p>" +
    '<div class="pin__paths" data-pin-paths></div>' +
    '<pre class="pin__code"><code data-pin-code></code></pre>' +
    '<div class="pin__acts">' +
    '<button class="btn btn--ghost btn--sm" type="button" data-pin-dl>下载单文件</button>' +
    '<a class="btn btn--ghost btn--sm" href="library.html">换一个</a>' +
    '<a class="btn btn--ghost btn--sm" href="detail.html?uid=' + encodeURIComponent(item.uid) + '">看详情</a>' +
    "</div>" +
    "</div></div>";

  const stage = host.querySelector("[data-pin-stage]");
  try {
    window.LIB.mount(stage, item, true);
    fitStage(stage);
  } catch (e) {
    /* noop */
  }

  const pathsEl = host.querySelector("[data-pin-paths]");
  const codeEl = host.querySelector("[data-pin-code]");
  const copyBtn = host.querySelector("[data-pin-copy]");

  function paint() {
    pathsEl.innerHTML = DEV_PATHS.map((p) =>
      '<button class="codetab ' + (p.key === active ? "is-on" : "") +
      '" type="button" data-path="' + p.key + '">' + p.label + "</button>").join("");
    codeEl.textContent = codeForPath(item, active);
    const cur = DEV_PATHS.find((p) => p.key === active);
    if (copyBtn) copyBtn.textContent = "复制 " + (cur ? cur.label : "") + " 代码";
  }
  paint();

  pathsEl.addEventListener("click", (e) => {
    const b = e.target.closest("[data-path]");
    if (!b) return;
    active = b.dataset.path;
    paint();
  });

  if (copyBtn) {
    copyBtn.addEventListener("click", () => copyText(codeForPath(item, active), copyBtn, "已复制"));
  }

  const dl = host.querySelector("[data-pin-dl]");
  if (dl) {
    dl.addEventListener("click", () => {
      downloadText("zingdex-" + (item.id || "component") + ".html", window.LIB.fullHtml(item));
    });
  }

  renderGuidePaths(item);
}

/* ---------- 下面的接入说明：按选中的组件重排 ---------- */

function renderGuidePaths(item) {
  const host = document.querySelector("[data-guide-paths]");
  if (!host) return;
  host.innerHTML = DEV_PATHS.map((p) => {
    const code = codeForPath(item, p.key);
    return '<article class="path-card">' +
      '<div class="path-card__head">' +
      "<div><h2>" + p.label + "</h2><p>" + p.intro + "</p></div>" +
      '<button class="btn btn--ghost btn--sm" type="button" data-path-copy="' + p.key + '">复制</button>' +
      "</div>" +
      '<pre class="path-card__code"><code>' + escAttr(code) + "</code></pre>" +
      "</article>";
  }).join("");

  host.querySelectorAll("[data-path-copy]").forEach((btn) => {
    btn.addEventListener("click", () => {
      copyText(codeForPath(item, btn.dataset.pathCopy), btn, "已复制");
    });
  });
}

/* ---------- 首页 ---------- */

const EFFECT_SCENE_LABEL = {
  nav: "导航与菜单", loading: "加载与等待", cards: "卡片与容器", data: "数据可视化",
  forms: "表单与输入", feedback: "反馈与提示", transition: "转场与路由",
  scroll: "滚动与视差", type: "文字与排版", icons: "图标与装饰"
};

function domains() {
  const map = new Map();
  SCENES.forEach((s) => {
    if (!map.has(s.domain)) map.set(s.domain, []);
    map.get(s.domain).push(s);
  });
  return Array.from(map.entries()).map(([name, scenes]) => ({
    name: name,
    scenes: scenes,
    count: scenes.reduce((n, s) => n + s.cats.length, 0)
  }));
}

function sceneTicks(seed) {
  let out = "";
  for (let i = 0; i < 10; i++) {
    out += `<i class="${(i + seed) % 3 === 0 ? "on" : ""}"></i>`;
  }
  return out;
}

function specUidFor(sceneId, catIndex) {
  return "spec:fx-" + sceneId + "-" + String(catIndex + 1).padStart(2, "0");
}

function renderHome() {
  const lib = window.LIB;

  const grid = document.querySelector("[data-scene-grid]");
  if (grid && lib) {
    // 首页分类墙统计手机向 + 设备向，两边都算进去，否则数字和标题对不上
    const specTotal = lib.items.filter((x) => ["phone","wide","vehicle","wear","terminal"].indexOf(x.group) >= 0).length;
    const cats = [];
    lib.items.forEach((it) => {
      if (["phone","wide","vehicle","wear","terminal"].indexOf(it.group) < 0) return;
      const c = cats.find((x) => x.name === it.cat);
      if (c) {
        c.count += 1;
        if (c.scenes.length < 3 && c.scenes.indexOf(it.scene) < 0) c.scenes.push(it.scene);
      } else {
        cats.push({ name: it.cat, count: 1, scenes: [it.scene] });
      }
    });
    grid.innerHTML = cats
      .map(
        (c, i) => `
      <a class="scene-tile reveal" href="library.html?cat=${encodeURIComponent(c.name)}">
        <span class="scene-tile__idx">${String(i + 1).padStart(2, "0")} — ${c.count} 个组件</span>
        <span class="scene-tile__name">${c.name}</span>
        <span class="scene-tile__en">${c.scenes.join(" / ")}</span>
        <span class="ticks">${sceneTicks(i)}</span>
      </a>`
      )
      .join("");
    const hint = document.querySelector("[data-scene-count]");
    if (hint) hint.textContent = specTotal + " 个组件 · " + cats.length + " 个分类";
  }

  const cards = document.querySelector("[data-featured]");
  if (cards && lib) {
    const seenCat = {};
    const picks = [];
    lib.items.forEach((it) => {
      if (["phone","wide","vehicle","wear","terminal"].indexOf(it.group) < 0 || seenCat[it.cat]) return;
      if (it.duration > 900) return;
      seenCat[it.cat] = true;
      picks.push(it);
    });
    cards.innerHTML = picks
      .slice(0, 4)
      .map((item, i) => {
        const uid = item.uid;
        if (!item) return "";
        return `
      <a class="card reveal" href="detail.html?uid=${encodeURIComponent(uid)}">
        <div class="card__pv tint-${"abcd"[i % 4]}">${previewMarkup({ id: uid })}</div>
        <div class="card__body">
          <div class="card__row">
            <span class="card__title">${item.zh}</span>
            <span class="chip-time">${["编辑推荐", "本周新增", "最高复用", "最小体积"][i] || ""}</span>
          </div>
          <span class="card__tags">${item.cat} · ${item.duration}ms</span>
        </div>
      </a>`;
      })
      .join("");
    cards.querySelectorAll("[data-preview]").forEach((host) => {
      const item = lib.byUid[host.dataset.preview];
      if (!item) return;
      host.innerHTML = "";
      try { window.LIB.mount(host, item, false); } catch (err) { /* noop */ }
    });

    // 首页「实时组件」格子里挂真实场景组件
    document.querySelectorAll("[data-mount]").forEach((host) => {
      const item = lib.byUid[host.dataset.mount];
      if (!item) return;
      try { window.LIB.mount(host, item, false); } catch (err) { /* noop */ }
    });
  }

  ensureLibStyles();
  initHeroStage();
}

/* 首页实时预览：10 个挑过的组件，随机顺序轮播；只有点了才进详情 */
const HERO_CYCLE = 5000;

/* 首页只放这 10 个：覆盖列表、卡片、图表、进度、对话、海报、评分、播放。
   想换就把这一行改成别的「场景 + 动效名」。 */
const HERO_PICKS = [
  ["商品列表", "逐项错峰"],
  ["商品详情", "中心放大"],
  ["播控中心", "呼吸强调"],
  ["学习进度", "进度填充"],
  ["私信会话", "弹性回弹"],
  ["活动海报", "遮罩揭开"],
  ["评分评价", "外发光"],
  ["行情列表", "上滑入场"],
  ["地图导航", "视差分层"],
  ["运动记录", "呼吸强调"]
];

function heroItems() {
  const lib = window.LIB;
  if (!lib || !lib.items) return [];
  const picked = [];
  HERO_PICKS.forEach(([scene, name]) => {
    const hit = lib.items.find((x) => x.scene === scene && x.zh === name);
    if (hit) picked.push(hit);
  });
  /* 兜底：万一某个名字改了，用分类里靠前的组件补够 10 个 */
  if (picked.length < 10) {
    lib.items.forEach((x) => {
      if (picked.length >= 10 || ["phone","wide","vehicle","wear","terminal"].indexOf(x.group) < 0) return;
      if (picked.some((y) => y.uid === x.uid)) return;
      picked.push(x);
    });
  }
  if (!picked.length) return [];

  /* 随机顺序，且一轮之内不重复 */
  const list = picked.slice(0, 10);
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function heroHref(item) {
  return item.group === "base"
    ? "detail.html?id=" + encodeURIComponent(item.id)
    : "detail.html?uid=" + encodeURIComponent(item.uid);
}

function initHeroStage() {
  const host = document.querySelector("[data-hero-live]");
  if (!host || !window.LIB) return;
  const stage = host.closest(".stage");
  const nameEl = document.querySelector("[data-hero-name]");
  const play = stage && stage.querySelector(".play");
  const fill = stage && stage.querySelector(".track__fill");
  const items = heroItems();
  if (!items.length) return;

  let idx = 0;
  let timer = null;
  let current = null;

  function restartTrack() {
    if (!fill) return;
    fill.style.animation = "none";
    void fill.offsetWidth;
    fill.style.animation = "heroTrack " + HERO_CYCLE + "ms linear forwards";
  }

  function place() {
    current = items[idx % items.length];
    idx += 1;

    if (nameEl) {
      nameEl.textContent = current.zh + " · " + (current.duration || 0) + "ms";
    }
    host.innerHTML = "";
    try {
      window.LIB.mount(host, current, true);
    } catch (e) {
      /* 单个组件失败不影响轮播 */
    }
    fitStage(host);
    if (stage) stage.dataset.heroHref = heroHref(current);
    restartTrack();
  }

  function schedule() {
    window.clearInterval(timer);
    timer = window.setInterval(place, HERO_CYCLE);
  }

  place();
  schedule();

  /* 播放键＝立刻换下一个（不跳转） */
  if (play) {
    play.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      place();
      schedule();
    });
  }

  /* 只有点预览区才进详情；播完 5 秒只切换，不跳转 */
  if (stage) {
    stage.addEventListener("click", (e) => {
      if (e.target.closest(".play")) return;
      const href = stage.dataset.heroHref;
      if (href) location.href = href;
    });
  }
}

/* ---------- 组件库 ---------- */

const libView = (() => {
  const s = (window.TRSettings && window.TRSettings.get()) || {};
  return {
    group: ["phone","wide","vehicle","wear","terminal"].indexOf(s.libGroup) >= 0 ? s.libGroup : "phone",
    q: "",
    cat: "全部",
    device: s.libDevice || "all",
    shown: s.libShown || 60
  };
})();

const DEVICE_LABEL = {
  phone: "手机", tablet: "平板", laptop: "笔记本", desktop: "桌面",
  kiosk: "自助机", car: "车机", tv: "电视", watch: "手表",
  ar: "AR / VR", eink: "墨水屏", hmi: "工业屏"
};

function libItems() {
  return window.LIB ? window.LIB.items : [];
}

/* 组件条目上没有 devices 字段（生成时没带过来），设备筛选会一律筛空。
   这里按形态给一份兜底：手机上跑的组件，平板也能跑；大屏类落到桌面与电视。 */
const DEV_FALLBACK = {
  phone: ["phone", "tablet"],
  wide: ["desktop", "tv", "laptop"],
  vehicle: ["car"],
  wear: ["watch"],
  terminal: ["kiosk", "eink", "hmi", "ar"],
  gl: ["phone", "tablet", "desktop"],
  base: ["phone", "tablet", "desktop"]
};

function devicesOf(it) {
  if (it.devices && it.devices.length) return it.devices;
  return DEV_FALLBACK[it.group] || [];
}

/* 条数太少的分类并进「其他」，避免标签栏里一堆点进去没东西的项 */
const CAT_OTHER = "__other__";
let catOther = [];

function libFiltered() {
  const q = libView.q.trim().toLowerCase();
  const list = libItems().filter((it) => {
    if (it.group !== libView.group) return false;
    if (libView.cat !== "全部") {
      if (libView.cat === CAT_OTHER) {
        if (catOther.indexOf(it.cat) < 0) return false;
      } else if (it.cat !== libView.cat) return false;
    }
    if (libView.device !== "all" && devicesOf(it).indexOf(libView.device) < 0) return false;
    if (!q) return true;
    return (
      it.zh.toLowerCase().includes(q) ||
      String(it.en || "").toLowerCase().includes(q) ||
      String(it.cat || "").toLowerCase().includes(q)
    );
  });

  const sort = (window.TRSettings && window.TRSettings.get().libSort) || "default";
  if (sort === "name") {
    list.sort((a, b) => String(a.zh).localeCompare(String(b.zh), "zh-Hans-CN"));
  } else if (sort === "dur") {
    list.sort((a, b) => (a.duration || 0) - (b.duration || 0));
  }
  return list;
}

function libCard(it, index) {
  const meta = it.duration ? it.duration + "ms" : it.easing ? "CSS" : "";
  const badge =
    it.group === "gl"
      ? '<span class="lib-card__badge">Canvas</span>'
      : it.tier === "flagship"
        ? '<span class="lib-card__badge lib-card__badge--flag">旗舰</span>'
        : "";
  const devText = (it.devices || []).map((d) => DEVICE_LABEL[d] || d).slice(0, 2).join(" · ");
  const left = it.scene || it.cat || "";
  const right = it.scene ? it.mcat || it.cat || "" : devText || it.en || "";
  const fxd = it.scene ? "--fxd:-" + ((index || 0) * 173) % 2600 + "ms;" : "";
  return `
    <a class="lib-card lib-card--ready" style="--i:${(index || 0) % 12};${fxd}" href="${it.group === "base" ? "detail.html?id=" + encodeURIComponent(it.id) : "detail.html?uid=" + encodeURIComponent(it.uid)}">
      <div class="lib-card__pv">
        <div class="pv-live" data-mount="${it.uid}"></div>
        ${badge}
        ${pinButtonHTML(it.uid)}
      </div>
      <div class="lib-card__b">
        <div class="lib-card__r">
          <span class="lib-card__t">${it.zh}</span>
          <span class="lib-card__e">${meta}</span>
        </div>
        <div class="lib-card__r">
          <span class="lib-card__m">${left}</span>
          <span class="lib-card__m">${right}</span>
        </div>
      </div>
    </a>`;
}

function guardCardLink(host) {
  const link = host.closest("a");
  if (!link || link.dataset.guarded) return;
  link.dataset.guarded = "1";
  link.addEventListener("click", (e) => {
    if (e.target.closest("[data-mount]") || e.target.closest("[data-preview]") || e.target.closest("[data-pin]")) e.preventDefault();
  });
}

/* ---------- 卡片预览的懒挂载 ----------
   不依赖 IntersectionObserver：部分 WebView 与后台标签里它可能一次回调都不给，
   卡片就会一直空着。改成滚动时按视口位置扫描，rAF 节流，60～120 张卡的开销可忽略。
*/
let sweepHosts = [];
let sweepTimer = 0;
let sweepLast = 0;

function viewportH() {
  return document.documentElement.clientHeight || window.innerHeight || 800;
}

function mountHost(host) {
  if (!host || host.dataset.mounted || !host.isConnected) return;
  const item = window.LIB.byUid[host.dataset.mount];
  host.dataset.mounted = "1";
  if (item) {
    // Canvas / 3D 卡片必须跑脚本，否则画布是空的；挂载是按视口的，同时存在的同屏数量有限
    try { window.LIB.mount(host, item, true); } catch (err) { /* 单卡失败不影响整体 */ }
  }
  guardCardLink(host);
  bindPinButtons(host.parentElement);
}

function libSweep() {
  const vh = viewportH();
  const left = [];
  for (let i = 0; i < sweepHosts.length; i += 1) {
    const h = sweepHosts[i];
    if (!h.isConnected || h.dataset.mounted) continue;
    const r = h.getBoundingClientRect();
    if (r.top < vh + 400 && r.bottom > -400) mountHost(h);
    else left.push(h);
  }
  sweepHosts = left;
}

/* setTimeout 节流而不是 rAF：后台标签与部分 WebView 会停掉动画帧 */
function libScheduleSweep() {
  if (sweepTimer) return;
  const wait = Math.max(0, 80 - (Date.now() - sweepLast));
  sweepTimer = setTimeout(() => {
    sweepTimer = 0;
    sweepLast = Date.now();
    libSweep();
    sweepIdle = 0;
    libStartPulse();
  }, wait);
}

window.addEventListener("scroll", libScheduleSweep, { passive: true });
window.addEventListener("resize", libScheduleSweep, { passive: true });

/* 兜底：滚动事件在某些 WebView / 合成滚动里可能不派发。
   有待挂载卡片时每 400ms 扫一次；连续 3 次没进展就停，不留常驻定时器。 */
let sweepPulse = 0;
let sweepIdle = 0;

function libStartPulse() {
  if (sweepPulse || !sweepHosts.length) return;
  sweepPulse = setInterval(() => {
    const before = sweepHosts.length;
    libSweep();
    if (!sweepHosts.length) {
      clearInterval(sweepPulse);
      sweepPulse = 0;
      return;
    }
    if (sweepHosts.length === before) {
      sweepIdle += 1;
      if (sweepIdle >= 3) {
        clearInterval(sweepPulse);
        sweepPulse = 0;
      }
    } else {
      sweepIdle = 0;
    }
  }, 400);
}

function libObserve(scope) {
  if (!window.LIB) return;

  // 先同步挂载首屏前 8 个，保证任何情况下都有内容可见
  const hosts = Array.from(scope.querySelectorAll("[data-mount]"));
  hosts.slice(0, 8).forEach(mountHost);

  // 其余交给视口扫描；旧节点在扫描时按 isConnected 自动淘汰
  sweepHosts = sweepHosts.filter((h) => h.isConnected && !h.dataset.mounted);
  hosts.slice(8).forEach((h) => { if (!h.dataset.mounted) sweepHosts.push(h); });
  libSweep();
  libStartPulse();
}

/* 切换筛选时的过渡：老内容向上让半步 → 换内容 → 新内容逐项浮回。
   节奏取自组件库「逐项错峰 / Stagger List 420ms」，全程不盖遮罩、不出现空白。 */
let libSwapAnim = null;
let libStampTimer = 0;

function libStamp(on) {
  const hint = document.querySelector("[data-lib-group-hint]");
  if (!hint) return;
  let tag = hint.querySelector("[data-lib-tag]");
  if (on) {
    if (!tag) {
      tag = document.createElement("i");
      tag.className = "libtag";
      tag.setAttribute("data-lib-tag", "");
      tag.textContent = "逐项错峰 · 组件库动效";
      hint.appendChild(tag);
    }
    tag.hidden = false;
    clearTimeout(libStampTimer);
  } else if (tag) {
    clearTimeout(libStampTimer);
    libStampTimer = setTimeout(function () { tag.hidden = true; }, 300);
  }
}

function libStagger(grid) {
  if (!grid || typeof grid.animate !== "function") return;
  const cards = Array.prototype.slice.call(grid.children, 0, 12);
  cards.forEach(function (el, i) {
    el.animate(
      [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }],
      { duration: 420, delay: i * 16, easing: "cubic-bezier(.22,.61,.36,1)", fill: "backwards" }
    );
  });
}

function libSwap(grid, paint) {
  if (!grid || typeof grid.animate !== "function" || document.hidden) { paint(); return; }
  if (libSwapAnim) { try { libSwapAnim.cancel(); } catch (e) { /* noop */ } libSwapAnim = null; }

  let swapped = false;
  function swapNow() {
    if (swapped) return;
    swapped = true;
    paint();
    libStagger(grid);
    // 提示条在重排之后补，否则会被 paintList 覆写掉
    libStamp(true);
    setTimeout(function () { libStamp(false); }, 520);
    const settle = grid.animate(
      [{ opacity: .45, transform: "translateY(-6px)" }, { opacity: 1, transform: "none" }],
      { duration: 300, easing: "cubic-bezier(.22,.61,.36,1)", fill: "both" }
    );
    function clear() {
      try { lift.cancel(); settle.cancel(); } catch (e) { /* noop */ }
      libSwapAnim = null;
    }
    settle.onfinish = clear;
    setTimeout(clear, 800);          // 窗口在后台时动画不推进，兜底清掉
  }

  const lift = grid.animate(
    [{ opacity: 1, transform: "none" }, { opacity: .45, transform: "translateY(-6px)" }],
    { duration: 110, easing: "cubic-bezier(.4,0,1,1)", fill: "both" }
  );
  libSwapAnim = lift;
  lift.onfinish = swapNow;
  setTimeout(swapNow, 200);          // 兜底：动画被暂停也保证内容换掉
}

function renderLibrary() {
  const grid = document.querySelector("[data-lib-grid]");
  if (!grid || !window.LIB) return;

  const lib = window.LIB;
  const tabs = document.querySelector("[data-lib-tabs]");
  const countEl = document.querySelector("[data-lib-count]");
  const hintEl = document.querySelector("[data-lib-group-hint]");
  const catSel = document.querySelector("[data-lib-cat]");
  const moreBtn = document.querySelector("[data-more]");
  const search = document.querySelector("[data-lib-search]");

  const params = new URLSearchParams(location.search);
  if (params.get("g")) libView.group = params.get("g");
  if (params.get("cat")) libView.cat = params.get("cat");
  if (params.get("device")) libView.device = params.get("device");
  if (params.get("q")) {
    libView.q = params.get("q");
    if (search) search.value = libView.q;
  }

  const catBox = document.querySelector("[data-cat-chips]");
  const clearBtn = document.querySelector("[data-lib-clear]");

  function paintClear() {
    if (!clearBtn) return;
    clearBtn.hidden = !(libView.cat !== "全部" || libView.device !== "all" || !!libView.q);
  }

  function applyCats() {
    if (!catBox) return;
    const inGroup = lib.items.filter((it) => it.group === libView.group);
    const byCat = {};
    inGroup.forEach((it) => {
      if (!it.cat) return;
      byCat[it.cat] = (byCat[it.cat] || 0) + 1;
    });
    // 条数太少的分类并成「其他」，空分类直接不出现，标签栏别塞一堆点了没结果的
    const MIN_CAT = 10;
    const big = Object.keys(byCat).filter((c) => byCat[c] >= MIN_CAT).sort();
    const small = Object.keys(byCat).filter((c) => byCat[c] < MIN_CAT).sort();
    catOther = small;
    const smallCount = small.reduce((a, c) => a + byCat[c], 0);

    const chips = [{ key: "全部", label: "全部分类", n: inGroup.length }]
      .concat(big.map((c) => ({ key: c, label: c, n: byCat[c] })));
    if (smallCount > 0) chips.push({ key: CAT_OTHER, label: "其他", n: smallCount });

    if (chips.map((x) => x.key).indexOf(libView.cat) < 0) libView.cat = "全部";

    catBox.innerHTML = chips
      .map(
        (x) =>
          '<button class="devchip ' + (x.key === libView.cat ? "is-on" : "") +
          '" type="button" data-cat-chip="' + x.key + '">' + x.label +
          '<b class="devchip__n">' + x.n + "</b></button>"
      )
      .join("");
    paintClear();
  }

  function paintList() {
    const list = libFiltered();
    if (countEl) countEl.textContent = list.length;
    paintClear();
    const g = lib.groups.find((x) => x.key === libView.group) || lib.groups[0];
    if (hintEl) hintEl.textContent = g.hint + " · 共 " + g.count + " 条，当前筛选出 " + list.length +
      " 条（组件库合计 " + (window.LIB && window.LIB.items
        ? window.LIB.items.filter((x) => ["phone", "wide", "vehicle", "wear", "terminal"].indexOf(x.group) >= 0).length
        : g.count) + " 条）";

    const slice = list.slice(0, libView.shown);
    grid.innerHTML = slice.length
      ? slice.map((it, i) => libCard(it, i)).join("")
      : '<div class="empty">没有匹配的条目。换个关键词，或切换来源。</div>';

    libObserve(grid);
    if (moreBtn) moreBtn.style.display = list.length > libView.shown ? "inline-flex" : "none";
  }

  // 重排一次要几十毫秒，中间先盖一层：动画有出处，也避免看到半张网格
  function apply(withSwap) {
    if (!withSwap) { paintList(); return; }
    libSwap(grid, paintList);
  }

  const devBox = document.querySelector("[data-dev-chips]");

  function paintDevices() {
    const row = document.querySelector("[data-dev-row]");
    if (!devBox) return;
    if (["phone","wide","vehicle","wear","terminal"].indexOf(libView.group) < 0) {
      if (row) row.hidden = true;
      libView.device = "all";
      return;
    }
    if (row) row.hidden = false;
    // 只显示这一组里真的有东西的设备，点进去空的标签没有必要留
    const inGroup = lib.items.filter((it) => it.group === libView.group);
    const countOf = {};
    inGroup.forEach((it) => {
      devicesOf(it).forEach((d) => { countOf[d] = (countOf[d] || 0) + 1; });
    });
    const order = ["phone", "tablet", "laptop", "desktop", "kiosk", "car", "tv", "watch", "ar", "eink", "hmi"];
    const usable = order.filter((d) => countOf[d] > 0);
    if (libView.device !== "all" && usable.indexOf(libView.device) < 0) libView.device = "all";
    devBox.innerHTML =
      '<button class="devchip ' + (libView.device === "all" ? "is-on" : "") +
      '" type="button" data-dev="all">全部设备<b class="devchip__n">' + inGroup.length + "</b></button>" +
      usable
        .map(
          (d) =>
            '<button class="devchip ' + (libView.device === d ? "is-on" : "") + '" type="button" data-dev="' + d + '">' +
            DEVICE_LABEL[d] + '<b class="devchip__n">' + countOf[d] + "</b></button>"
        )
        .join("");
  }

  function paintTabs() {
    if (!tabs) return;
    tabs.innerHTML = lib.groups
      .map(
        (g) => `<button class="libtab ${g.key === libView.group ? "is-on" : ""}" data-group="${g.key}" role="tab">
          ${g.label}<span>${g.count}</span></button>`
      )
      .join("");
  }

  paintTabs();
  applyCats();
  paintDevices();
  apply();

  if (tabs) {
    tabs.addEventListener("click", (ev) => {
      const btn = ev.target.closest("[data-group]");
      if (!btn) return;
      libView.group = btn.dataset.group;
      libView.cat = "全部";
      libView.device = "all";
      libView.shown = 60;
      paintTabs();
      applyCats();
      paintDevices();
      apply(true);
    });
  }

  if (devBox) {
    devBox.addEventListener("click", (ev) => {
      const btn = ev.target.closest("[data-dev]");
      if (!btn) return;
      libView.device = btn.dataset.dev;
      libView.shown = 60;
      paintDevices();
      apply(true);
    });
  }

  if (catBox) {
    catBox.addEventListener("click", (ev) => {
      const btn = ev.target.closest("[data-cat-chip]");
      if (!btn) return;
      libView.cat = btn.dataset.catChip;
      libView.shown = 60;
      applyCats();
      apply(true);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      libView.cat = "全部";
      libView.device = "all";
      libView.q = "";
      if (search) search.value = "";
      paintDevices();
      applyCats();
      apply(true);
    });
  }

  if (catSel) {
    catSel.addEventListener("change", () => {
      libView.cat = catSel.value;
      libView.shown = 60;
      apply(true);
    });
  }

  if (search) {
    let timer = null;
    search.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        libView.q = search.value.trim();
        libView.shown = 60;
        apply();
      }, 180);
    });
  }

  if (moreBtn) {
    moreBtn.addEventListener("click", () => {
      libView.shown += 60;
      apply();
    });
  }
}

/* ---------- 详情页 ---------- */

function genericPrompt(scene, cat) {
  return `你是资深前端动效工程师。请实现一个「${cat.zh}」（${cat.en}）组件，用于「${scene.zh}」场景。

【场景说明】
${scene.desc}

【建议参数】
- 默认时长：${cat.ms}ms
- 建议缓动：${cat.ease}

【硬性要求】
1. 只用 HTML / CSS / JavaScript，不引入任何框架与外部资源
2. 动画只改 transform 与 opacity，目标 60 FPS，不触发布局重排
3. 支持 prefers-reduced-motion，键盘可操作，带 aria 语义
4. 输出一个可直接双击运行的单文件 index.html，并附 React / Vue 用法说明`;
}

/* ---------- 通用组件详情（来自 04 动效代码库的条目） ---------- */

function renderLibraryItem(item) {
  const stage = document.querySelector("[data-stage]");
  const codeEl = document.querySelector("[data-code]");
  const tabsEl = document.querySelector("[data-tabs]");
  const hud = document.querySelector("[data-hud]");
  const hudTag = document.querySelector("[data-hud-tag]");
  const ctrls = document.querySelector("[data-ctrls]");
  const group = (window.LIB.groups.find((g) => g.key === item.group) || { label: item.group }).label;
  let activeTab = "css";
  let lastCode = null;

  document.title = item.zh + " · " + group + " — Zingdex";

  const crumb = document.querySelector("[data-crumb]");
  if (crumb) {
    crumb.innerHTML = '<a href="index.html">首页</a><span class="sep">/</span>' +
      '<a href="library.html">组件库</a><span class="sep">/</span>' +
      '<a href="library.html?g=' + item.group + '">' + group + '</a><span class="sep">/</span>' +
      '<span style="color:var(--ink-2)">' + item.zh + "</span>";
  }

  const title = document.querySelector("[data-title]");
  if (title) title.textContent = item.zh;
  const sub = document.querySelector("[data-sub]");
  if (sub) sub.textContent = (item.cat || "") + " · " + (item.en || "");
  const desc = document.querySelector("[data-desc]");
  if (desc) desc.textContent = item.note || ("来自「" + group + "」的可运行实现，代码可直接复制到项目里。");

  const badges = document.querySelector("[data-badges]");
  if (badges) {
    badges.innerHTML = '<span class="badge badge--acc">可复制代码</span>' +
      '<span class="badge">' + group + "</span>" +
      (item.duration ? '<span class="badge">' + item.duration + "ms</span>" : "") +
      (item.easing ? '<span class="badge">' + item.easing + "</span>" : "") +
      (item.devices && item.devices.length
        ? '<span class="badge">' + item.devices.map((d) => DEVICE_LABEL[d] || d).join(" / ") + "</span>"
        : "") +
      '<span class="badge">离线可用</span>';
  }

  if (hud) hud.textContent = item.duration ? item.duration + "ms · " + item.easing : "CSS 关键帧";
  if (hudTag) {
    const catLabel = /canvas|webgl|webgpu|2d|3d|shader/i.test(String(item.cat || ""))
      ? group
      : (item.cat || group);
    hudTag.textContent = catLabel + " / " + (item.en || item.id);
  }

  const tabs = [
    { key: "html", label: "HTML" },
    { key: "css", label: "CSS" },
    { key: "js", label: "JS" },
    { key: "prompt", label: "AI 提示词" }
  ];

  /* ---------- 参数：实时调，实时进代码与提示词 ---------- */
  const vals = window.LIB.defaultVals ? window.LIB.defaultVals(item) : { dur: item.duration || 300, ease: "out", amp: 1, gap: 70 };
  const EASE_MAP = (window.LIB && window.LIB.EASE_MAP) || {
    out: "cubic-bezier(0.16,1,0.3,1)",
    outc: "cubic-bezier(0.33,1,0.68,1)",
    inout: "cubic-bezier(0.76,0,0.24,1)",
    spring: "cubic-bezier(0.34,1.56,0.64,1)",
    linear: "linear"
  };
  const EASE_LABEL = { out: "减速", outc: "缓减速", inout: "对称", spring: "回弹", linear: "匀速" };

  function currentCss() {
    return window.LIB.cssWithParams ? window.LIB.cssWithParams(item.css, item.id, vals) : item.css;
  }

  const baseVals = Object.assign({}, vals);
  let compare = false;

  function writeRoot(rootEl, v) {
    if (!rootEl) return;
    rootEl.style.setProperty("--fx-dur", v.dur + "ms");
    rootEl.style.setProperty("--fx-ease", EASE_MAP[v.ease] || EASE_MAP.out);
    rootEl.style.setProperty("--fx-amp", String(v.amp));
    rootEl.style.setProperty("--fx-gap", v.gap + "ms");
  }

  function applyVals() {
    if (!stage) return;
    const baseHost = stage.querySelector('[data-cmp="base"]');
    const nowHost = stage.querySelector('[data-cmp="now"]');
    if (baseHost || nowHost) {
      writeRoot(baseHost && baseHost.querySelector('[class^="fx-"]'), baseVals);
      writeRoot(nowHost && nowHost.querySelector('[class^="fx-"]'), vals);
      return;
    }
    const root = stage.querySelector('[class^="fx-"]') || stage.querySelector(".detail__mount > div");
    writeRoot(root, vals);
  }

  function valText(v) {
    const amp = (Math.round(v.amp * 100) / 100).toFixed(2);
    return amp + "× · " + v.dur + "ms";
  }

  function codeMap() {
    item._vals = vals;
    return {
      html: item.html,
      css: currentCss(),
      js: item.js || "/* 这个组件不需要 JavaScript */",
      prompt: window.LIB.promptFor(item)
    };
  }

  function mountStage() {
    if (!stage) return;
    stage.className = "detail__stage tint-b";
    stage.innerHTML = "";

    const host = document.createElement("div");
    host.className = "detail__mount" + (compare ? " is-cmp" : "");
    stage.appendChild(host);

    if (compare) {
      host.innerHTML =
        '<div class="cmp-pane"><span class="cmp-lb">默认 · ' + valText(baseVals) + "</span>" +
        '<div class="cmp-host" data-cmp="base"></div></div>' +
        '<div class="cmp-pane"><span class="cmp-lb">当前 · ' + valText(vals) + "</span>" +
        '<div class="cmp-host" data-cmp="now"></div></div>';
      const hb = host.querySelector('[data-cmp="base"]');
      const hn = host.querySelector('[data-cmp="now"]');
      window.LIB.mount(hb, item, true);
      window.LIB.mount(hn, item, true);
      applyVals();
      fitStage(hb);
      fitStage(hn);
      return;
    }

    window.LIB.mount(host, item, true);
    applyVals();
    fitStage(host);
  }

  function paintCode() {
    lastCode = codeMap();
    if (codeEl) codeEl.textContent = lastCode[activeTab];
    if (tabsEl) {
      tabsEl.innerHTML = tabs
        .map((t) => '<button class="codetab ' + (t.key === activeTab ? "is-on" : "") +
          '" data-tab="' + t.key + '">' + t.label + "</button>")
        .join("");
    }
  }

  if (ctrls) {
    const params = window.LIB.paramList ? window.LIB.paramList(item) : (item.params || []);
    const tunable = params.length > 0;
    const rows = [];

    params.forEach((p) => {
      if (p.k === "ease") {
        rows.push(
          '<div class="tune-row"><div class="tune-row__h"><span>' + p.label + '</span>' +
          '<b data-out="ease">' + (EASE_LABEL[vals.ease] || vals.ease) + "</b></div>" +
          '<div class="seg seg--tune" data-tune-ease>' +
          (p.options || []).map((o) =>
            '<button type="button" data-ease-v="' + o.k + '" class="' +
            (o.k === vals.ease ? "is-on" : "") + '">' + o.label + "</button>").join("") +
          "</div></div>"
        );
        return;
      }
      const out = p.k === "dur" ? vals.dur + "ms"
        : p.k === "gap" ? vals.gap + "ms"
        : (Math.round(vals.amp * 100) / 100).toFixed(2) + "×";
      rows.push(
        '<div class="tune-row"><div class="tune-row__h"><span>' + p.label + "</span>" +
        '<b data-out="' + p.k + '">' + out + "</b></div>" +
        '<input type="range" data-tune="' + p.k + '" min="' + p.min + '" max="' + p.max +
        '" step="' + p.step + '" value="' + (vals[p.k] !== undefined ? vals[p.k] : p.v) + '"></div>'
      );
    });

    ctrls.innerHTML =
      '<div class="ctrl ctrl--row tune-actions">' +
      '<button class="btn btn--ghost btn--sm" type="button" data-replay>重播</button>' +
      '<button class="btn btn--ghost btn--sm" type="button" data-pin="' + item.uid + '">选入接入台</button>' +
      (tunable
        ? '<button class="btn btn--ghost btn--sm" type="button" data-tune-toggle aria-expanded="false">调参数</button>' +
          '<button class="btn btn--ghost btn--sm" type="button" data-cmp-toggle aria-pressed="false">对比默认</button>'
        : "") +
      '<span class="mono tune-hint">参数会同步进 CSS 与 AI 提示词</span>' +
      "</div>" +
      aiRowHTML() +
      (tunable ? '<div class="tune-panel" data-tune-panel hidden>' + rows.join("") +
        '<div class="tune-foot"><button class="btn btn--ghost btn--sm" type="button" data-tune-reset>恢复默认</button>' +
        '<span class="mono">改完直接点「复制」或切到 AI 提示词</span></div></div>' : "");

    const replay = ctrls.querySelector("[data-replay]");
    if (replay) {
      replay.addEventListener("click", () => {
        if (replayStage(stage)) {
          applyVals();
          flashLabel(replay, "已重播");
        } else {
          mountStage();
        }
      });
    }

    bindAiRow(ctrls, () => window.LIB.promptFor(item));
    bindPinButtons(ctrls);

    const cmpBtn = ctrls.querySelector("[data-cmp-toggle]");
    if (cmpBtn) {
      cmpBtn.addEventListener("click", () => {
        compare = !compare;
        cmpBtn.classList.toggle("is-on", compare);
        cmpBtn.setAttribute("aria-pressed", compare ? "true" : "false");
        cmpBtn.textContent = compare ? "退出对比" : "对比默认";
        mountStage();
      });
    }

    const panel = ctrls.querySelector("[data-tune-panel]");
    const toggle = ctrls.querySelector("[data-tune-toggle]");
    if (toggle && panel) {
      toggle.addEventListener("click", () => {
        const open = panel.hasAttribute("hidden");
        if (open) panel.removeAttribute("hidden");
        else panel.setAttribute("hidden", "");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        toggle.classList.toggle("is-on", open);
      });
    }

    function syncOut(key) {
      const out = ctrls.querySelector('[data-out="' + key + '"]');
      if (!out) return;
      if (key === "dur") out.textContent = vals.dur + "ms";
      else if (key === "gap") out.textContent = vals.gap + "ms";
      else if (key === "amp") out.textContent = (Math.round(vals.amp * 100) / 100).toFixed(2) + "×";
      else if (key === "ease") out.textContent = EASE_LABEL[vals.ease] || vals.ease;
    }

    ctrls.querySelectorAll("[data-tune]").forEach((input) => {
      input.addEventListener("input", () => {
        const key = input.dataset.tune;
        vals[key] = Number(input.value);
        applyVals();
        syncOut(key);
        paintCode();
      });
      input.addEventListener("change", () => {
        if (compare) mountStage();
      });
    });

    ctrls.querySelectorAll("[data-ease-v]").forEach((btn) => {
      btn.addEventListener("click", () => {
        vals.ease = btn.dataset.easeV;
        ctrls.querySelectorAll("[data-ease-v]").forEach((b) => b.classList.toggle("is-on", b === btn));
        applyVals();
        syncOut("ease");
        paintCode();
        if (compare) mountStage();
      });
    });

    const reset = ctrls.querySelector("[data-tune-reset]");
    if (reset) {
      reset.addEventListener("click", () => {
        const d = window.LIB.defaultVals(item);
        Object.keys(d).forEach((k) => { vals[k] = d[k]; });
        ctrls.querySelectorAll("[data-tune]").forEach((input) => {
          const key = input.dataset.tune;
          input.value = vals[key];
          syncOut(key);
        });
        ctrls.querySelectorAll("[data-ease-v]").forEach((b) => {
          b.classList.toggle("is-on", b.dataset.easeV === vals.ease);
        });
        syncOut("ease");
        applyVals();
        paintCode();
      });
    }
  }

  if (tabsEl) {
    tabsEl.addEventListener("click", (ev) => {
      const btn = ev.target.closest("[data-tab]");
      if (!btn) return;
      activeTab = btn.dataset.tab;
      paintCode();
    });
  }

  const copyBtn = document.querySelector("[data-copy-code]");
  if (copyBtn) {
    copyBtn.textContent = "复制当前代码";
    copyBtn.onclick = () => copyText(lastCode[activeTab], copyBtn, "已复制");
  }

  const dl = document.querySelector("[data-download]");
  if (dl) {
    dl.style.display = "";
    dl.onclick = () => {
      downloadText("zingdex-" + item.id + ".html", window.LIB.fullHtml(item));
      dl.textContent = "已保存";
      setTimeout(() => (dl.textContent = "下载单文件"), 1600);
    };
  }

  const cp = document.querySelector("[data-copy-prompt]");
  if (cp) {
    cp.style.display = "";
    cp.onclick = () => copyText(lastCode.prompt, cp, "已复制提示词");
  }

  mountStage();
  paintCode();

  const related = document.querySelector("[data-related]");
  if (related) {
    const same = window.LIB.items.filter((x) => x.group === item.group && x.uid !== item.uid).slice(0, 3);
    related.innerHTML = same
      .map(
        (x) =>
          '<a class="lib-card" href="detail.html?uid=' + encodeURIComponent(x.uid) + '">' +
          '<div class="lib-card__pv"><div class="pv-live" data-mount="' + x.uid + '"></div></div>' +
          '<div class="lib-card__b"><div class="lib-card__r">' +
          '<span class="lib-card__t">' + x.zh + "</span>" +
          '<span class="lib-card__e">' + (x.duration ? x.duration + "ms" : "") + "</span></div>" +
          '<div class="lib-card__r"><span class="lib-card__m">' + (x.cat || "") + "</span>" +
          '<span class="lib-card__m">' + (x.en || "") + "</span></div></div></a>"
      )
      .join("");
    libObserve(related);
  }
}

function renderDetail() {
  const root = document.querySelector("[data-detail]");
  if (!root) return;

  ensureLibStyles();

  const params = new URLSearchParams(location.search);
  const uid = params.get("uid");
  if (uid && window.LIB && window.LIB.byUid[uid]) {
    const picked = window.LIB.byUid[uid];
    if (picked.group === "base" && picked.effect) {
      // 基础组件有自己的参数面板，走完整详情页
      location.replace("detail.html?id=" + encodeURIComponent(picked.id));
      return;
    }
    // 规格条目的 html / css 按场景分片加载，先等负载到齐再渲染
    window.LIB.ensure(picked).then(() => renderLibraryItem(picked));
    return;
  }
  const lib = MOTIONS();
  let scene = SCENES.find((s) => s.id === params.get("s")) || SCENES[0];
  let catIndex = Number(params.get("c") || 0);

  /* 全部条目统一用 ?id=s123-05 直达，先按 id 反解出场景与序号 */
  const rawId = params.get("id") || "";
  const mId = rawId.match(/^(s\d{3})-(\d{1,2})$/);
  if (mId) {
    scene = SCENES.find((s) => s.id === mId[1]) || scene;
    catIndex = Math.max(0, Math.min(scene.cats.length - 1, parseInt(mId[2], 10) - 1));
  }
  let effect = rawId && lib ? lib.byId[rawId] || lib.byId["fx-" + rawId] || null : null;

  if (effect && mId) {
    /* 已经由 id 解析好了场景，不需要再按旧库字段回查 */
  } else if (effect) {
    // 基础组件与场景库没有从属关系，标签用固定映射
    catIndex = 0;
  } else {
    effect = effectAt(scene.id, catIndex);
  }

  const cat = scene.cats[catIndex] || scene.cats[0];

  /* 面包屑 */
  const crumb = document.querySelector("[data-crumb]");
  if (crumb) {
    const back = effect ? `detail.html?id=${effect.id}` : `detail.html?s=${scene.id}&c=${catIndex}`;
    crumb.innerHTML = `<a href="index.html">首页</a><span class="sep">/</span>
      <a href="library.html">组件库</a><span class="sep">/</span>
      <a href="library.html?g=base">基础组件</a><span class="sep">/</span>
      <span style="color:var(--ink-2)">${effect ? effect.zh : cat.zh}</span>`;
    document.title = `${effect ? effect.zh : cat.zh} · ${effect ? (EFFECT_SCENE_LABEL[effect.scene] || "基础组件") : scene.zh} — Zingdex`;
    void back;
  }

  /* ---------- 规格条目：有真实代码就直接打开 ---------- */
  if (!effect) {
    const specScene = mId ? mId[1] : scene.id;
    const specUid = "spec:fx-" + specScene + "-" + String(catIndex + 1).padStart(2, "0");
    if (window.LIB && window.LIB.byUid[specUid]) {
      renderLibraryItem(window.LIB.byUid[specUid]);
      return;
    }
  }

  /* ---------- 兜底：没有实现时给出可用的 AI 提示词 ---------- */
  if (!effect) {
    const stage = document.querySelector("[data-stage]");
    if (stage) {
      stage.className = "detail__stage tint-a";
      /* 用母版引擎直接渲一个可运行的预览：语义匹配，不是随机图 */
      const motif = cat.fam ? famToMotif(cat.fam) : motifFor(cat, catIndex);
      const ease = EASES[easeKey(cat.ease)] || EASES["ease-out-expo"];
      stage.innerHTML = `<div class="plan-stage plan-stage--live" style="--dur:${cat.ms}ms;--ease2:${ease}">
        <span class="plan-stage__tag">${cat.fam || "MOTION"} · ${cat.ms}ms</span>
        ${motifHTML(motif)}
      </div>`;
    }
    const title = document.querySelector("[data-title]");
    if (title) title.textContent = cat.zh;
    const sub = document.querySelector("[data-sub]");
    if (sub) sub.textContent = `${scene.zh} · ${cat.en}`;
    const badges = document.querySelector("[data-badges]");
    if (badges) {
      badges.innerHTML = `<span class="badge">${cat.ms} ms</span>
        <span class="badge">${cat.ease}</span>
        ${cat.dev ? `<span class="badge">${cat.dev.length} 类设备</span>` : ""}
        <span class="badge badge--ok">实时预览</span>`;
    }
    const desc = document.querySelector("[data-desc]");
    if (desc) desc.textContent = scene.desc;
    const ctrls = document.querySelector("[data-ctrls]");
    if (ctrls) ctrls.innerHTML = "";
    const code = document.querySelector("[data-code]");
    const prompt = genericPrompt(scene, cat);
    if (code) code.textContent = prompt;
    const tabs = document.querySelector("[data-tabs]");
    if (tabs) tabs.innerHTML = "";
    const cb = document.querySelector("[data-copy-code]");
    if (cb) {
      cb.textContent = "复制 AI 提示词";
      cb.onclick = () => copyText(prompt, cb, "已复制提示词");
    }
    const dl = document.querySelector("[data-download]");
    if (dl) dl.style.display = "none";
    const cp = document.querySelector("[data-copy-prompt]");
    if (cp) cp.style.display = "none";
    renderRelated(scene, catIndex);
    return;
  }

  /* ---------- 已实现的组件：真实代码 + 实时预览 ---------- */
  let settings = { duration: effect.duration, easing: effect.easing };
  (effect.params || []).forEach((p) => (settings[p.key] = p.value));

  const stage = document.querySelector("[data-stage]");
  const codeEl = document.querySelector("[data-code]");
  const tabsEl = document.querySelector("[data-tabs]");
  const hud = document.querySelector("[data-hud]");
  const hudTag = document.querySelector("[data-hud-tag]");

  const tabs = [
    { key: "html", label: "HTML" },
    { key: "css", label: "CSS" },
    { key: "js", label: "JS" },
    { key: "react", label: "React" },
    { key: "vue", label: "Vue" },
    { key: "wx", label: "小程序" },
    { key: "prompt", label: "AI 提示词" }
  ];
  let activeTab = "css";
  let lastCode = null;

  function current() {
    const c = MOTIONS().build(effect, settings);
    return {
      raw: c,
      text: {
        html: c.html,
        css: c.css,
        js: c.jsBody ? MOTIONS().jsSource(effect, c) : "/* 这个组件不需要 JavaScript */",
        react: MOTIONS().code.react(effect, c),
        vue: MOTIONS().code.vue(effect, c),
        wx: MOTIONS().code.wx(effect, c),
        prompt: MOTIONS().code.prompt(effect, c)
      }
    };
  }

  function mount() {
    if (stage) {
      stage.className = `detail__stage tint-${["a", "b", "c", "d"][catIndex % 4]}`;
      paint(stage, effect, settings, true);
      fitStage(stage);
    }
    lastCode = current();
    if (hud) hud.textContent = `${settings.duration}ms · ${settings.easing}`;
    if (hudTag) hudTag.textContent = `${EFFECT_SCENE_LABEL[effect.scene] || "基础组件"} / ${effect.en}`;
    if (codeEl) codeEl.textContent = lastCode.text[activeTab];
    if (tabsEl) {
      tabsEl.innerHTML = tabs
        .map(
          (t) =>
            `<button class="codetab ${t.key === activeTab ? "is-on" : ""}" data-tab="${t.key}">${t.label}</button>`
        )
        .join("");
    }
  }

  const title = document.querySelector("[data-title]");
  if (title) title.textContent = effect.zh;
  const sub = document.querySelector("[data-sub]");
  if (sub) sub.textContent = `${EFFECT_SCENE_LABEL[effect.scene] || "基础组件"} · ${effect.en}`;
  const desc = document.querySelector("[data-desc]");
  if (desc) desc.textContent = effect.desc;
  const badges = document.querySelector("[data-badges]");
  if (badges) {
    badges.innerHTML = `<span class="badge badge--acc">可复制代码</span>
      <span class="badge">${effect.duration}ms</span>
      <span class="badge">${effect.easeName}</span>
      <span class="badge">离线可用</span>`;
  }

  /* 控件：时长 + 缓动 + 组件参数 */
  const ctrls = document.querySelector("[data-ctrls]");
  if (ctrls) {
    const easeOptions = [
      ["ease-out-expo", "expo 0.16,1,0.3,1"],
      ["ease-out-cubic", "cubic 0.33,1,0.68,1"],
      ["ease-in-out-quart", "in-out 0.76,0,0.24,1"],
      ["spring", "spring 0.34,1.56,0.64,1"],
      ["linear", "linear"]
    ];
    const easeValue = (name) => (EASES[name] || name);

    ctrls.innerHTML = `
      <div class="ctrl">
        <div class="ctrl__head"><span>时长 Duration</span><span class="ctrl__val" data-dur-out>${settings.duration}ms</span></div>
        <input type="range" min="100" max="2400" step="20" value="${settings.duration}" data-dur aria-label="动效时长">
      </div>
      <div class="ctrl">
        <div class="ctrl__head"><span>缓动 Easing</span></div>
        <div class="seg seg--wrap">
          ${easeOptions
            .map(
              ([k, label]) =>
                `<button data-ease="${k}" class="${easeValue(k) === settings.easing ? "is-on" : ""}">${label.split(" ")[0]}</button>`
            )
            .join("")}
        </div>
      </div>
      ${(effect.params || [])
        .map(
          (p) => `
        <div class="ctrl">
          <div class="ctrl__head"><span>${p.label}</span><span class="ctrl__val" data-param-out="${p.key}">${settings[p.key]}${p.unit || ""}</span></div>
          ${
            p.type === "text"
              ? `<input class="ctrl__text" type="text" value="${settings[p.key]}" data-param="${p.key}">`
              : `<input type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${settings[p.key]}" data-param="${p.key}">`
          }
        </div>`
        )
        .join("")}
      <div class="ctrl ctrl--row">
        <button class="btn btn--ghost btn--sm" type="button" data-replay>重播</button>
        <span class="mono" style="font-size: 9px;color:var(--ink-4)">参数改动会实时重建预览，复制出的代码同步更新</span>
      </div>`;

    const dur = ctrls.querySelector("[data-dur]");
    const durOut = ctrls.querySelector("[data-dur-out]");
    dur.addEventListener("input", () => {
      settings.duration = Number(dur.value);
      durOut.textContent = settings.duration + "ms";
      mount();
    });

    ctrls.querySelectorAll("[data-ease]").forEach((btn) => {
      btn.addEventListener("click", () => {
        ctrls.querySelectorAll("[data-ease]").forEach((b) => b.classList.toggle("is-on", b === btn));
        settings.easing = easeValue(btn.dataset.ease);
        mount();
      });
    });

    ctrls.querySelectorAll("[data-param]").forEach((input) => {
      input.addEventListener("input", () => {
        const key = input.dataset.param;
        const val = input.type === "text" ? input.value : Number(input.value);
        settings[key] = val;
        const out = ctrls.querySelector(`[data-param-out="${key}"]`);
        if (out) out.textContent = val;
        mount();
      });
    });

    const replay = ctrls.querySelector("[data-replay]");
    if (replay) {
      replay.addEventListener("click", () => {
        mount();
        requestAnimationFrame(() => replayStage(stage));
      });
    }
  }

  if (tabsEl) {
    tabsEl.addEventListener("click", (ev) => {
      const btn = ev.target.closest("[data-tab]");
      if (!btn) return;
      activeTab = btn.dataset.tab;
      mount();
    });
  }

  const copyBtn = document.querySelector("[data-copy-code]");
  if (copyBtn) {
    copyBtn.textContent = "复制当前代码";
    copyBtn.onclick = () => copyText(lastCode.text[activeTab], copyBtn, "已复制");
  }

  const dl = document.querySelector("[data-download]");
  if (dl) {
    dl.style.display = "";
    dl.onclick = () => {
      const c = MOTIONS().build(effect, settings);
      downloadText(`zingdex-${effect.id}.html`, MOTIONS().code.full(effect, c));
      dl.textContent = "已保存";
      setTimeout(() => (dl.textContent = "下载单文件"), 1600);
    };
  }

  const cp = document.querySelector("[data-copy-prompt]");
  if (cp) {
    cp.style.display = "";
    cp.onclick = () => copyText(lastCode.text.prompt, cp, "已复制提示词");
  }

  mount();
  renderRelatedBase(effect);
}

function renderRelatedBase(effect) {
  const related = document.querySelector("[data-related]");
  const lib = MOTIONS();
  if (!related || !lib) return;
  related.innerHTML = lib.EFFECTS.filter((e) => e.id !== effect.id)
    .slice(0, 3)
    .map(
      (e) => `
    <a class="lib-card" href="detail.html?id=${e.id}">
      <div class="lib-card__pv tint-b"><div class="pv-live" data-preview="base:${e.id}"></div></div>
      <div class="lib-card__b">
        <div class="lib-card__r">
          <span class="lib-card__t">${e.zh}</span>
          <span class="lib-card__e">${e.duration}ms</span>
        </div>
        <div class="lib-card__r">
          <span class="lib-card__m">${EFFECT_SCENE_LABEL[e.scene] || "基础组件"}</span>
          <span class="lib-card__m">${e.en}</span>
        </div>
      </div>
    </a>`
    )
    .join("");

  const byId = window.LIB && window.LIB.byUid;
  related.querySelectorAll("[data-preview]").forEach((host) => {
    const item = byId && byId[host.dataset.preview];
    if (item) mountCardPreview(host, item);
  });
}

function renderRelated(scene, catIndex) {
  const related = document.querySelector("[data-related]");
  if (!related) return;
  const lib = MOTIONS();

  const picks = [];
  SCENES.forEach((s) => {
    s.cats.forEach((c, i) => {
      const e = effectEntry(s.id, c.en);
      if (!e) return;
      if (s.id === scene.id && i === catIndex) return;
      picks.push({ s, c, i, e });
    });
  });
  const same = picks.filter((p) => p.s.id === scene.id);
  const others = picks.filter((p) => p.s.id !== scene.id);
  const list = same.concat(others).slice(0, 3);

  related.innerHTML = list
    .map(
      ({ s, c, e }) => `
    <a class="lib-card" href="detail.html?id=${e.id}">
      <div class="lib-card__pv tint-b">${previewMarkup(e)}</div>
      <div class="lib-card__b">
        <div class="lib-card__r">
          <span class="lib-card__t">${e.zh}</span>
          <span class="lib-card__e">${e.duration}ms</span>
        </div>
        <div class="lib-card__r">
          <span class="lib-card__m">${s.zh}</span>
          <span class="lib-card__m">${c.en}</span>
        </div>
      </div>
    </a>`
    )
    .join("");
  hydratePreviews(related);
}

/* ---------- 通用 ---------- */

function initNav() {
  const burger = document.querySelector("[data-burger]");
  const menu = document.querySelector("[data-mobile-menu]");
  if (!burger || !menu) return;

  menu.innerHTML = NAV_ITEMS.map(
    (i) => `<a href="${i.href}">${i.label}</a>`
  ).join("") + `<a href="library.html" class="is-cta">开始使用</a>` +
    `<a href="license.html#summary" class="is-note">相关说明 · 能用什么 / 不能做什么</a>`;

  burger.addEventListener("click", () => {
    const open = menu.hasAttribute("hidden");
    if (open) {
      menu.removeAttribute("hidden");
      burger.setAttribute("aria-expanded", "true");
    } else {
      menu.setAttribute("hidden", "");
      burger.setAttribute("aria-expanded", "false");
    }
  });
}

function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      });
    },
    { rootMargin: "0px 0px 140px 0px", threshold: 0.02 }
  );
  items.forEach((n) => io.observe(n));
}

function initGlobalSearch() {
  document.querySelectorAll("[data-global-search]").forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && input.value.trim()) {
        location.href = `library.html?q=${encodeURIComponent(input.value.trim())}`;
      }
    });
  });
}

/* ---------- 深浅色主题 ---------- */

/* 原生壳联动：安卓 WebView 注入了 ZingdexHost，浏览器里不存在，静默跳过 */
function syncHostTheme(theme) {
  try {
    if (window.ZingdexHost && typeof window.ZingdexHost.setTheme === "function") {
      window.ZingdexHost.setTheme(theme);
    }
  } catch (e) {
    /* 非原生环境忽略 */
  }
}

function initTheme() {
  const btn = document.querySelector("[data-theme-toggle]");
  syncHostTheme(document.documentElement.dataset.theme || "dark");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const html = document.documentElement;
    const next = html.dataset.theme === "light" ? "dark" : "light";

    html.classList.add("theme-switching");
    html.dataset.theme = next;
    syncHostTheme(next);

    if (window.TRSettings) {
      window.TRSettings.set({ theme: next });
    } else {
      try {
        localStorage.setItem("tr-theme", next);
      } catch (e) {
        /* 隐私模式下忽略 */
      }
    }

    window.clearTimeout(initTheme._t);
    initTheme._t = window.setTimeout(() => html.classList.remove("theme-switching"), 480);
  });
}

/* ---------- 桌面窗口：右键 / Esc / F11 / 自定义组合键退出全屏 ---------- */

/* 这些组合已经被浏览器或系统占用，绑上去会失灵或抢掉用户的常用键。
   Esc 单独处理：不管用户设了什么，它永远能退出全屏。 */
const EXIT_KEY_RESERVED = [
  "Ctrl+W", "Ctrl+T", "Ctrl+N", "Ctrl+R", "Ctrl+P", "Ctrl+S", "Ctrl+F", "Ctrl+K",
  "Ctrl+J", "Ctrl+L", "Ctrl+O", "Ctrl+H", "Ctrl+D",
  "Ctrl+Shift+W", "Ctrl+Shift+I", "Ctrl+Shift+J", "Ctrl+Shift+C", "Ctrl+Shift+N",
  "Alt+F4", "Alt+Tab", "F5", "F11", "F12", "Esc", "Tab", "Enter", "Space"
];

function comboFromEvent(e) {
  const mods = [];
  if (e.ctrlKey) mods.push("Ctrl");
  if (e.altKey) mods.push("Alt");
  if (e.shiftKey) mods.push("Shift");
  if (e.metaKey) mods.push("Win");
  const k = e.key;
  if (["Control", "Alt", "Shift", "Meta"].indexOf(k) >= 0) return { key: "", text: "" };
  const name = k.length === 1 ? k.toUpperCase() : k;
  return { key: name, text: mods.concat([name]).join("+") };
}

function comboMatches(e, text) {
  if (!text) return false;
  const c = comboFromEvent(e);
  return !!c.key && c.text === text;
}

function initDesktopKeys() {
  if (!window.zingdex || typeof window.zingdex.setFullscreen !== "function") return;

  const html = document.documentElement;
  const paint = (on) => {
    html.dataset.fullscreen = on ? "on" : "off";
  };

  if (typeof window.zingdex.onFullscreen === "function") {
    window.zingdex.onFullscreen(paint);
  }
  if (typeof window.zingdex.isFullscreen === "function") {
    window.zingdex.isFullscreen().then(paint).catch(() => {});
  }

  // 全屏时点右键退出；窗口模式下不拦截右键
  document.addEventListener("contextmenu", (e) => {
    if (html.dataset.fullscreen === "on") {
      e.preventDefault();
      window.zingdex.setFullscreen(false);
    }
  });

  // 键盘：F11 双向切换，Esc 永远能退出，用户自定义的组合键再补一条。
  // 自定义组合键不看 fullscreen 状态标记 —— 那个标记依赖原生事件到达，
  // 少一次事件就会让快捷键整体失灵，改成直接问主进程当前是不是全屏。
  document.addEventListener("keydown", (e) => {
    if (html.dataset.recording === "1") return;   // 正在录制快捷键，交给录制逻辑

    const custom = window.TRSettings ? window.TRSettings.get().exitKey : "";
    const hitCustom = comboMatches(e, custom);

    if (e.key === "F11") {
      e.preventDefault();
      window.zingdex.isFullscreen().then((on) => window.zingdex.setFullscreen(!on)).catch(() => {});
      return;
    }
    if (e.key === "Escape") {
      window.zingdex.isFullscreen().then((on) => {
        if (on) window.zingdex.setFullscreen(false);
      }).catch(() => {});
      return;
    }
    if (hitCustom) {
      e.preventDefault();
      window.zingdex.isFullscreen().then((on) => {
        if (on) window.zingdex.setFullscreen(false);
      }).catch(() => {});
    }
  });
}

/* ---------- 设置页 ---------- */

function initStartupToggle() {
  const box = document.querySelector("[data-startup]");
  const row = document.querySelector("[data-startup-row]");
  const msg = document.querySelector("[data-startup-msg]");
  if (!box || !row) return;
  if (!window.zingdex || typeof window.zingdex.getStartup !== "function") return;
  row.hidden = false;

  function paint(on) {
    Array.prototype.forEach.call(box.children, function (b) {
      b.classList.toggle("is-on", b.dataset.v === (on ? "on" : "off"));
    });
  }

  window.zingdex.getStartup().then(function (r) {
    paint(!!(r && r.on));
    if (msg && r && r.stale) {
      msg.textContent = "启动项还指向旧位置，点「开启」改成当前目录";
    }
  }).catch(function () { paint(false); });

  box.addEventListener("click", function (e) {
    const b = e.target.closest("button[data-v]");
    if (!b) return;
    const on = b.dataset.v === "on";
    if (msg) msg.textContent = "处理中…";
    window.zingdex.setStartup(on).then(function (r) {
      if (r && r.ok) {
        paint(!!r.on);
        if (msg) {
          if (r.stale) msg.textContent = "启动项指向旧位置：" + r.path;
          else msg.textContent = r.on ? "已加入开机启动" : "已从开机启动移除";
        }
      } else if (msg) {
        msg.textContent = (r && r.reason) || "修改失败";
      }
    }).catch(function () { if (msg) msg.textContent = "修改失败"; });
  });
}

function initSettingsPage() {
  initAiManager();
  const S = window.TRSettings;
  if (!S) return;

  const isNative = !!(window.zingdex && typeof window.zingdex.setFullscreen === "function");
  document.querySelectorAll("[data-desktop-only]").forEach((el) => {
    el.hidden = !isNative;
  });

  function paint() {
    const s = S.get();
    document.querySelectorAll("[data-set]").forEach((box) => {
      const key = box.dataset.set;
      if (box.tagName === "SELECT") {
        box.value = String(s[key]);
        return;
      }
      box.querySelectorAll("button[data-v]").forEach((b) => {
        b.classList.toggle("is-on", String(s[key]) === b.dataset.v);
      });
    });
  }

  document.querySelectorAll("[data-set]").forEach((box) => {
    const key = box.dataset.set;

    if (box.tagName === "SELECT") {
      box.addEventListener("change", () => {
        S.set({ [key]: box.value });
        paint();
      });
      return;
    }

    box.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-v]");
      if (!b) return;
      const raw = b.dataset.v;
      const val = key === "libShown" ? Number(raw) : raw;
      S.set({ [key]: val });
      paint();
      if (key === "fullscreen" && window.zingdex && window.zingdex.setFullscreen) {
        window.zingdex.setFullscreen(val === "on");
      }
    });
  });

  const reset = document.querySelector("[data-reset-settings]");
  if (reset) {
    reset.addEventListener("click", () => {
      S.reset();
      paint();
    });
  }

  const verEl = document.querySelector("[data-about-version]");
  if (verEl) {
    // 先写兜底值，原生桥回来了再覆盖，避免浏览器里停在旧版本号
    if (window.TR_VER) verEl.textContent = window.TR_VER;
    if (window.zingdex && typeof window.zingdex.info === "function") {
      window.zingdex.info()
        .then((r) => { if (r && r.version) verEl.textContent = r.version; })
        .catch(() => {});
    }
  }

  const countEl = document.querySelector("[data-about-count]");
  if (countEl && window.LIB) {
    const n = window.LIB.items.length;
    const specs = window.LIB.items.filter((x) => ["phone", "wide", "vehicle", "wear", "terminal"].indexOf(x.group) >= 0).length;
    countEl.textContent = n.toLocaleString("zh-CN") + " 条（组件 " + specs.toLocaleString("zh-CN") + " + 特效与基础 " + (n - specs) + "）";
  }


  /* ---------- 联系作者：保存二维码 ---------- */
  const qrSave = document.querySelector("[data-qr-save]");
  const qrMsg = document.querySelector("[data-qr-msg]");
  function setQrMsg(text, state) {
    if (!qrMsg) return;
    qrMsg.textContent = text;
    qrMsg.dataset.state = state || "";
  }

  if (qrSave) {
    qrSave.addEventListener("click", async () => {
      try {
        if (window.zingdex && typeof window.zingdex.saveQr === "function") {
          const r = await window.zingdex.saveQr();
          if (r && r.ok) setQrMsg("已保存到 " + r.filePath + "。若该二维码失效，请打开使用说明，查阅其他联系方式。", "ok");
          else if (r && !r.cancelled) setQrMsg("保存失败", "err");
          return;
        }
        const a = document.createElement("a");
        a.href = "mailto:2083825368@qq.com";
        a.download = "Zingdex-联系作者.png";
        a.click();
        setQrMsg("已保存到相册。若该二维码失效，请打开使用说明，查阅其他联系方式。", "ok");
      } catch (e) {
        setQrMsg("保存失败：" + (e && e.message), "err");
      }
    });
  }

  const fsBtn = document.querySelector("[data-toggle-fullscreen]");
  if (fsBtn && window.zingdex) {
    fsBtn.addEventListener("click", async () => {
      const on = await window.zingdex.isFullscreen();
      window.zingdex.setFullscreen(!on);
    });
  }

  /* ---------- 退出全屏快捷键录制 ---------- */
  const recBtn = document.querySelector("[data-shortcut-record]");
  if (recBtn) {
    const msgEl = document.querySelector("[data-shortcut-msg]");
    const say = (t, bad) => {
      if (!msgEl) return;
      msgEl.textContent = t || "";
      msgEl.dataset.bad = bad ? "1" : "0";
    };
    const label = () => S.get().exitKey || "未设置";
    const paintBtn = () => { recBtn.innerHTML = "当前：<kbd>" + label() + "</kbd>"; };
    paintBtn();

    recBtn.addEventListener("click", () => {
      if (document.documentElement.dataset.recording === "1") return;
      document.documentElement.dataset.recording = "1";
      recBtn.textContent = "请按组合键…（Esc 取消）";
      say("按住 Ctrl / Alt / Shift 再按一个字母，例如 Ctrl+Shift+E。", false);
    });

    document.addEventListener("keydown", (e) => {
      if (document.documentElement.dataset.recording !== "1") return;
      e.preventDefault();
      e.stopPropagation();

      if (e.key === "Escape") {
        delete document.documentElement.dataset.recording;
        paintBtn();
        say("已取消，保持原样。", false);
        return;
      }
      const c = comboFromEvent(e);
      if (!c.key) return;                       // 只按了修饰键，继续等
      if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        say("必须带 Ctrl / Alt / Win，单独一个键会抢掉正常输入。", true);
        return;
      }
      if (EXIT_KEY_RESERVED.indexOf(c.text) >= 0) {
        say("「" + c.text + "」已经被系统或其他功能占用，换一个组合。", true);
        return;
      }

      S.set({ exitKey: c.text });
      delete document.documentElement.dataset.recording;
      recBtn.innerHTML = "当前：<kbd>" + c.text + "</kbd>";
      say("已设为 " + c.text + "。Esc 仍然随时可以退出全屏。", false);
    });
  }

  /* ---------- 卸载 / 一键清除（桌面版） ---------- */
  const actionRow = document.querySelector("[data-app-action-row]");
  if (actionRow && isNative && typeof window.zingdex.mode === "function") {
    window.zingdex.mode().then((mode) => {
      const installed = mode === "installed";
      const title = actionRow.querySelector("[data-app-action-title]");
      const desc = actionRow.querySelector("[data-app-action-desc]");
      const cta = actionRow.querySelector("[data-app-action-cta]");
      const msg = actionRow.querySelector("[data-app-action-msg]");
      const word = installed ? "卸载" : "清除";
      const name = installed ? "卸载本应用" : "清除本机数据";

      actionRow.hidden = false;
      if (title) title.textContent = name;
      if (desc) {
        desc.textContent = installed
          ? "一键清除：程序文件、数据目录（设置 / 授权 / 缓存）、开机启动项、卸载登记与程序注册键、桌面与开始菜单快捷方式。完成后会显示一份报告，卸载后无法恢复。"
          : "一键清除：数据目录（设置 / 授权 / 缓存）、开机启动项、卸载登记与程序注册键、桌面与开始菜单快捷方式。程序文件夹本身不删，可以自己移走。";
      }

      const reset = () => {
        cta.innerHTML = '<button class="btn btn--ghost btn--sm" type="button">' + name + "</button>";
        cta.firstChild.addEventListener("click", ask);
        if (msg) { msg.textContent = ""; msg.dataset.bad = "0"; }
      };
      const ask = () => {
        cta.innerHTML =
          '<button class="btn btn--ghost btn--sm" type="button" data-no>取消</button>' +
          '<button class="btn btn--solid btn--sm" type="button" data-yes>确认' + word + "</button>";
        if (msg) { msg.textContent = "确认后立即执行，没有回收站可以找回。"; msg.dataset.bad = "1"; }
        cta.querySelector("[data-no]").addEventListener("click", reset);
        cta.querySelector("[data-yes]").addEventListener("click", () => {
          if (msg) msg.textContent = "正在" + word + "…";
          window.zingdex.appAction(installed ? "uninstall" : "clear-data").then((r) => {
            if (r && r.ok) return;
            if (msg) { msg.textContent = (r && r.error) || "执行失败，请手动运行程序目录里的脚本。"; msg.dataset.bad = "1"; }
          }).catch(() => {});
        });
      };
      reset();
    }).catch(() => {});
  }

  paint();
}

function initSpotlight() {
  if (window.matchMedia("(hover: none)").matches) return;
  document.addEventListener(
    "pointermove",
    (e) => {
      const card = e.target.closest(".card, .lib-card, .scene-tile");
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    },
    { passive: true }
  );
}

/* ---------- 首页 Motion Lab：字符解码 ---------- */

function initLab() {
  const el = document.querySelector("[data-decode]");
  if (!el) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const words = ["MOTION", "SPRING", "STAGGER", "MORPH", "EASING"];
  const pool = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>";
  let wi = 0;

  const render = (word, solved) =>
    word
      .split("")
      .map((ch, i) =>
        i < solved ? `<i>${ch}</i>` : pool[(Math.random() * pool.length) | 0]
      )
      .join("");

  function cycle() {
    wi = (wi + 1) % words.length;
    const word = words[wi];
    let solved = 0;

    const tick = window.setInterval(() => {
      solved += 1;
      el.innerHTML = solved >= word.length ? word.split("").map((c) => `<i>${c}</i>`).join("") : render(word, solved);
      if (solved >= word.length) window.clearInterval(tick);
    }, 62);
  }

  window.setInterval(cycle, 2400);
}

function initScrollUI() {
  const bar = document.createElement("div");
  bar.className = "scroll-bar";
  document.body.appendChild(bar);

  const top = document.createElement("button");
  top.className = "to-top";
  top.type = "button";
  top.setAttribute("aria-label", "回到顶部");
  top.textContent = "↑";
  top.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  document.body.appendChild(top);

  let raf = null;
  function update() {
    raf = null;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const pct = h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0;
    bar.style.setProperty("--p", pct.toFixed(2) + "%");
    top.classList.toggle("is-on", window.scrollY > 480);
  }
  window.addEventListener("scroll", () => {
    if (!raf) raf = requestAnimationFrame(update);
  }, { passive: true });
  update();
}

/* 页面上的数字一律按库里真实条目算：写死的数字迟早会和实际对不上，
   而且手机端和电脑端会自动保持一致。 */
function paintCounts() {
  const lib = window.LIB;
  if (!lib || !lib.items) return;
  const items = lib.items;
  const put = (k, v) =>
    document.querySelectorAll('[data-count="' + k + '"]').forEach((e) => { e.textContent = v; });
  // 只算场景组件（五种形态）；gl 特效与基础组件是另外两块，不计入「动效组件」总数
  const SPEC = ["phone", "wide", "vehicle", "wear", "terminal"];
  const specs = items.filter((x) => SPEC.indexOf(x.group) >= 0);
  const phone = specs.filter((x) => x.group === "phone").length;
  put("total", specs.length);
  put("phone", phone);
  put("device", specs.length - phone);
  put("forms", new Set(specs.map((x) => x.group).filter(Boolean)).size);
  put("cats", new Set(specs.map((x) => x.cat).filter(Boolean)).size);
  if (document.body.dataset.page === "home")
    document.title = "Zingdex — 动效组件库 · " + specs.length + " 个组件";
}

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  const navMount = document.querySelector("[data-nav]");
  if (navMount) navMount.outerHTML = renderNav(page);

  const footMount = document.querySelector("[data-footer]");
  if (footMount) footMount.outerHTML = renderFooter();

  initScrollUI();
  initNav();
  initGlobalSearch();
  initTheme();
  initSpotlight();
  initLab();
  initDesktopKeys();
  if (page === "settings") initStartupToggle();

  if (page === "home") renderHome();
  paintCounts();
  if (page === "library") renderLibrary();
  if (page === "detail") renderDetail();
  if (page === "settings") initSettingsPage();
  if (page === "ai") initAiPage();
  if (page === "guide") renderGuidePin();

  document.querySelectorAll("[data-pdf]").forEach((btn) => {
    btn.addEventListener("click", () => exportDocPdf(btn.dataset.pdf));
  });

  initReveal();

});
