/* Zingdex 手机版 —— 与电脑端同功能，只用触屏的交互方式
   ------------------------------------------------------------------
   三个视图：组件 / 接入 / 设置；组件点开是详情（参数 / HTML / CSS / AI 提示词）。
   负载按场景分片，滚到哪加载到哪。
*/
(function () {
  "use strict";

  const lib = window.LIB;
  const PAGE = 40;
  const EAGER = 6;
  const PICK_KEY = "tr-mpick";

  let shown = PAGE;
  let activeCat = "全部";
  let catCounts = {};   // 点过的分类才显示条数
  // 按屏幕形态分组
  const SCOPE_LABEL = { phone: "竖屏", wide: "大屏", vehicle: "车机", wear: "手表", terminal: "终端" };
  let scope = "phone";
  let items = [];
  let view = "lib";

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  const grid = $("[data-grid]");
  const chips = $("[data-chips]");
  const secTitle = $("[data-sec-title]");
  const secCount = $("[data-sec-count]");
  const toastEl = $("[data-toast]");

  try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch (e) { /* noop */ }

  /* ---------- 小工具 ---------- */
  let toastTimer = 0;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("on"), 1800);
  }

  function nativeCopy(text) {
    if (window.ZingdexHost && typeof window.ZingdexHost.copy === "function") {
      try { return !!window.ZingdexHost.copy(text); } catch (e) { /* 落到网页层 */ }
    }
    return false;
  }

  /* 拉起系统分享面板：给哪个应用由用户自己选，不查装没装 */
  function nativeShare(title, text) {
    if (window.ZingdexHost && typeof window.ZingdexHost.share === "function") {
      try { return !!window.ZingdexHost.share(title, text); } catch (e) { /* 落到下面 */ }
    }
    return false;
  }

  /* ---------- 确认弹窗 ---------- */
  const dialogEl = $("[data-dialog]");
  let dialogAction = null;

  function showDialog(title, sub, onOk) {
    if (!dialogEl) return;
    $("[data-dialog-title]").textContent = title;
    $("[data-dialog-sub]").textContent = sub || "";
    dialogAction = onOk;
    dialogEl.hidden = false;
  }

  function closeDialog() {
    if (dialogEl) dialogEl.hidden = true;
    dialogAction = null;
  }

  async function copyText(text) {
    if (nativeCopy(text)) { toast("已复制"); return true; }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        toast("已复制");
        return true;
      }
    } catch (e) { /* 继续降级 */ }
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    ta.remove();
    toast(ok ? "已复制" : "复制失败，请长按选择");
    return ok;
  }

  /* ---------- 等比缩放 ---------- */
  function fit(host, maxScale) {
    if (!host || !host.isConnected) return;

    // 内容元素不能每次重新找：包起来之后第一个子节点就是包裹层
    let wrap = host._fitWrap;
    if (!wrap || !wrap.isConnected) {
      const el = Array.prototype.find.call(host.children, (c) => c.tagName !== "STYLE");
      if (!el) return;
      wrap = document.createElement("div");
      wrap.style.position = "absolute";
      wrap.style.left = "50%";
      wrap.style.top = "50%";
      wrap.style.transformOrigin = "center center";
      host.insertBefore(wrap, el);
      wrap.appendChild(el);
      host._fitWrap = wrap;
    }

    const box = host.getBoundingClientRect();
    const el = wrap.firstElementChild;
    const w = el && el.offsetWidth;
    const h = el && el.offsetHeight;
    if (!w || !h || box.width < 40 || box.height < 40) return;

    const s = Math.min(maxScale || 1, box.width / w, box.height / h);
    if (!isFinite(s) || s <= 0.05) return;
    wrap.style.transform = "translate(-50%, -50%) scale(" + s.toFixed(4) + ")";
  }

  function metaOf(item) {
    const parts = [];
    if (item.cat) parts.push(item.cat);
    if (item.duration) parts.push(item.duration + "ms");
    return parts.join(" · ");
  }

  /* ================= 重特效拦截 =================
     手机 GPU / 内存撑不住逐帧粒子与物理求解，硬挂上去就是掉帧、发热、甚至白屏。
     这类条目在手机上只给一张说明卡，不创建帧循环；电脑端照常渲染。 */
  const HEAVY_FAM = { particle: 1, swarm: 1, physics: 1, ambient: 1, noise: 1 };
  function heavyItem(it) {
    if (!it) return false;
    if (it.group === "gl") return true;
    const eid = it.eid || "";
    return !!HEAVY_FAM[String(eid).split("-")[0]];
  }
  function liteHTML(it) {
    return '<div class="lite"><b>复杂动效</b><span>' + (it.zh || "") + " · 请到电脑端查看</span></div>";
  }

  /* ================= 组件库 ================= */

  function mountCard(host) {
    if (!host || host.dataset.done) return;
    const item = lib.byUid[host.dataset.pv];
    if (!item) return;
    host.dataset.done = "1";
    lib.ensure(item).then(() => {
      if (!host.isConnected) return;
      if (heavyItem(item)) { host.innerHTML = liteHTML(item); return; }
      try {
        lib.mount(host, item, true);
        fit(host, 1);
        requestAnimationFrame(() => fit(host, 1));
      } catch (e) { delete host.dataset.done; }
    });
  }

  /* 点过哪一项，才在那项后面补上条数；没点过的不显示，界面更干净 */
  function fillScopeCount(key) {
    const el = document.querySelector('[data-scope-n="' + key + '"]');
    if (!el || el.textContent) return;
    el.textContent = lib.items.filter((i) => i.group === key).length;
  }

  /* 换形态、换分类都滚到同一个位置：列表条刚好贴在头部下面。
     两排按钮行为一致，用户不用猜哪一排会跳。 */
  function scrollToList() {
    const bar = $(".libbar");
    if (bar) {
      const y = bar.getBoundingClientRect().top + window.scrollY - 63;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function setScope(next) {
    if (next === scope) return;
    scope = next;
    shown = PAGE;
    activeCat = "全部";
    catCounts = {};          // 换形态后条数不一样，之前记的作废
    items = lib.items.filter((i) => i.group === scope);
    $$("[data-scope-btn]").forEach((b) => b.classList.toggle("on", b.dataset.scopeBtn === scope));
    paintChips();
    swapGrid(paintGrid);
    scrollToList();
  }

  function paintChips() {
    const cats = ["全部"].concat(Array.from(new Set(items.map((i) => i.cat).filter(Boolean))));
    chips.innerHTML = cats
      .map((c) => {
        const n = catCounts[c];
        return '<button class="chip' + (c === activeCat ? " on" : "") + '" type="button" data-cat="' + c + '">' +
          c + (n ? '<b class="chip__n">' + n + "</b>" : "") + "</button>";
      })
      .join("");
  }

  function list() {
    return activeCat === "全部" ? items : items.filter((i) => i.cat === activeCat);
  }

  function cardHTML(it, i) {
    // 角标放在文字区，不能放进预览区——预览区的 innerHTML 会被 mount 整个替换掉
    const flag = it.tier === "flagship" ? '<i class="card__flag">旗舰</i>' : "";
    return '<button class="card" type="button" data-open="' + it.uid + '">' +
      '<span class="card__pv" data-pv="' + it.uid + '" style="--fxd:-' + ((i * 173) % 2600) + 'ms"></span>' +
      '<span class="card__b"><span class="card__t"><span class="card__n">' + it.zh + "</span>" + flag + "</span>" +
      '<span class="card__m">' + (it.scene || it.cat || "") + "</span></span></button>";
  }

  /* 切换形态 / 分类时先给一层遮罩，避免列表重建那一瞬间的空窗。
     遮罩里的节奏取自组件库「呼吸强调」，文案里也标了出处。 */
  let veilTimer = 0;
  // 切换时老内容上让一步、新内容逐项浮回，节奏取自组件库「逐项错峰」
  let swapAnim = null;
  function swapGrid(fn) {
    const g = grid;
    if (!g || typeof g.animate !== "function" || document.hidden) { fn(); return; }
    if (swapAnim) { try { swapAnim.cancel(); } catch (e) { /* noop */ } swapAnim = null; }

    let swapped = false;
    function swapNow() {
      if (swapped) return;
      swapped = true;
      fn();
      Array.prototype.slice.call(g.children, 0, 10).forEach(function (el, i) {
        el.animate(
          [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }],
          { duration: 380, delay: i * 16, easing: "cubic-bezier(.22,.61,.36,1)", fill: "backwards" }
        );
      });
      const settle = g.animate(
        [{ opacity: .45, transform: "translateY(-6px)" }, { opacity: 1, transform: "none" }],
        { duration: 280, easing: "cubic-bezier(.22,.61,.36,1)", fill: "both" }
      );
      function clear() {
        try { lift.cancel(); settle.cancel(); } catch (e) { /* noop */ }
        swapAnim = null;
      }
      settle.onfinish = clear;
      setTimeout(clear, 800);
    }

    const lift = g.animate(
      [{ opacity: 1, transform: "none" }, { opacity: .45, transform: "translateY(-6px)" }],
      { duration: 100, easing: "cubic-bezier(.4,0,1,1)", fill: "both" }
    );
    swapAnim = lift;
    lift.onfinish = swapNow;
    setTimeout(swapNow, 200);
  }

  function paintGrid() {
    const all = list();
    const slice = all.slice(0, shown);
    grid.innerHTML =
      slice.map((it, i) => cardHTML(it, i)).join("") +
      (all.length > shown
        ? '<button class="more" type="button" data-more>再加载 ' + Math.min(PAGE, all.length - shown) + " 个</button>"
        : "");
    const first = grid.querySelector(".card");
    if (first) first.classList.add("card--wide");

    const allLabel = scope === "phone" ? "全部组件" : "全部" + (SCOPE_LABEL[scope] || "");
    if (secTitle) secTitle.textContent = activeCat === "全部" ? allLabel : activeCat;
    if (secCount) secCount.textContent = all.length + " 个";

    mountVisible();
  }

  /* 视口扫描（不依赖 IntersectionObserver） */
  let sweepHosts = [];
  let sweepTimer = 0;
  let sweepLast = 0;
  let pulse = 0;
  let pulseIdle = 0;

  function viewportH() {
    return document.documentElement.clientHeight || window.innerHeight || 800;
  }

  function sweep() {
    const vh = viewportH();
    const left = [];
    for (let i = 0; i < sweepHosts.length; i += 1) {
      const h = sweepHosts[i];
      if (!h.isConnected || h.dataset.done) continue;
      const r = h.getBoundingClientRect();
      if (r.top < vh + 400 && r.bottom > -400) mountCard(h);
      else left.push(h);
    }
    sweepHosts = left;
  }

  function startPulse() {
    if (pulse || !sweepHosts.length) return;
    pulse = setInterval(() => {
      const before = sweepHosts.length;
      sweep();
      if (!sweepHosts.length) { clearInterval(pulse); pulse = 0; return; }
      if (sweepHosts.length === before) {
        pulseIdle += 1;
        if (pulseIdle >= 3) { clearInterval(pulse); pulse = 0; }
      } else {
        pulseIdle = 0;
      }
    }, 400);
  }

  function schedule() {
    if (sweepTimer) return;
    const wait = Math.max(0, 80 - (Date.now() - sweepLast));
    sweepTimer = setTimeout(() => {
      sweepTimer = 0;
      sweepLast = Date.now();
      sweep();
      pulseIdle = 0;
      startPulse();
    }, wait);
  }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  // 横竖屏切换 / 分屏改变宽度后，已挂载的卡片要重新算缩放
  window.addEventListener("resize", () => {
    $$("[data-pv]").forEach((h) => { if (h._fitWrap) fit(h, 1); });
  }, { passive: true });

  function mountVisible() {
    const pvs = $$("[data-pv]", grid);
    if (!pvs.length) return;
    pvs.slice(0, EAGER).forEach(mountCard);
    sweepHosts = pvs.slice(EAGER).filter((h) => !h.dataset.done);
    sweep();
    startPulse();
  }

  /* ================= 视图切换 ================= */

  function go(name, smooth) {
    view = name;
    $$(".view").forEach((v) => v.classList.toggle("on", v.dataset.view === name));
    $$(".tab").forEach((t) => t.classList.toggle("on", t.dataset.go === name));
    // 切视图时柔和回到顶部：直接跳会闪
    if (smooth) window.scrollTo({ top: 0, behavior: "smooth" });
    else window.scrollTo(0, 0);
    if (name === "guide") paintGuide();
  }

  /* ================= 详情 ================= */

  const detail = $("[data-detail]");
  const dStage = $("[data-d-stage]");
  if (dStage) dStage.setAttribute("data-loop", "1");   // 详情页保留循环，列表才收口
  const dBody = $("[data-d-body]");

  const EASE_MAP = (window.LIB && window.LIB.EASE_MAP) || {
    out: "cubic-bezier(0.16,1,0.3,1)",
    outc: "cubic-bezier(0.33,1,0.68,1)",
    inout: "cubic-bezier(0.76,0,0.24,1)",
    spring: "cubic-bezier(0.34,1.56,0.64,1)",
    linear: "linear"
  };
  const EASE_LABEL = { out: "减速", outc: "缓减速", inout: "对称", spring: "回弹", linear: "匀速" };

  let curItem = null;
  let curVals = null;
  let curParams = [];
  let curTab = "params";

  function rootOf() {
    return dStage.querySelector('[class^="fx-"]') || dStage.querySelector("div > div");
  }

  function applyVals() {
    const root = rootOf();
    if (!root || !curVals) return;
    root.style.setProperty("--fx-dur", curVals.dur + "ms");
    root.style.setProperty("--fx-ease", EASE_MAP[curVals.ease] || EASE_MAP.out);
    root.style.setProperty("--fx-amp", String(curVals.amp));
    root.style.setProperty("--fx-gap", curVals.gap + "ms");
  }

  function remount() {
    dStage.innerHTML = "";
    delete dStage.dataset.fitted;
    if (!curItem) return;
    if (heavyItem(curItem)) { dStage.innerHTML = liteHTML(curItem); return; }
    try {
      lib.mount(dStage, curItem, true);
      applyVals();
      fit(dStage, 1.4);
    } catch (e) { /* noop */ }
  }

  function valText(p) {
    if (p.k === "ease") return EASE_LABEL[curVals.ease] || curVals.ease;
    if (p.k === "amp") return (Math.round(curVals.amp * 100) / 100).toFixed(2) + "×";
    return curVals[p.k] + "ms";
  }

  function bodyHTML() {
    if (!curItem) return "";

    if (curTab === "params") {
      return curParams.map((p) => {
        if (p.k === "ease") {
          return '<div class="trow"><div class="trow__h"><span>' + p.label + "</span>" +
            '<b data-out="ease">' + valText(p) + "</b></div>" +
            '<div class="tseg">' + (p.options || []).map((o) =>
              '<button type="button" data-ease="' + o.k + '" class="' + (o.k === curVals.ease ? "on" : "") + '">' +
              o.label + "</button>").join("") + "</div></div>";
        }
        return '<div class="trow"><div class="trow__h"><span>' + p.label + "</span>" +
          '<b data-out="' + p.k + '">' + valText(p) + "</b></div>" +
          '<input type="range" data-tune="' + p.k + '" min="' + p.min + '" max="' + p.max +
          '" step="' + p.step + '" value="' + curVals[p.k] + '"></div>';
      }).join("") +
        '<p class="pathintro">改完点下面的「接入 AI」，提示词和代码会带上这组参数。改乱了点「恢复默认」。</p>';
    }

    if (curTab === "prompt") {
      curItem._vals = curVals;
      const text = lib.promptFor(curItem) || "";
      const cn = (window.TZP && window.TZP.AI_TARGETS_CN) || [];
      const intl = (window.TZP && window.TZP.AI_TARGETS_INTL) || [];
      const own = window.TZAI ? window.TZAI.custom() : [];
      const btn = (t) =>
        '<button type="button" data-ai="' + t.key + '">' + t.label +
        (t.custom ? '<i class="ai-x" data-ai-del="' + t.key + '">×</i>' : "") + "</button>";
      const tpl = window.TZAI ? window.TZAI.template() : {};
      const tplFields = (window.TZAI ? window.TZAI.TPL_FIELDS : []).map((f) =>
        '<label class="ai-f"><span>' + f.label + "</span>" +
        '<input data-ai-tpl-field="' + f.k + '" placeholder="' + f.ph + '" value="' +
        escapeHtml(tpl[f.k] || "") + '"></label>').join("");
      const html = window.TZP ? window.TZP.codeForPath(curItem, "html") : (curItem.html || "");
      const css = lib.cssWithParams(curItem.css, curItem.id, curVals);
      return '<div class="ai-block">' +
        '<p class="pathintro" style="padding:0">点一个，确认后由系统分享面板把提示词、HTML、CSS 一起发出去，发给哪个应用由你决定。</p>' +
        '<div class="ai-grid">' + cn.map(btn).join("") + "</div>" +
        '<div class="ai-grid" style="margin-top:8px">' +
        '<button type="button" data-ai-more>海外 ' + intl.length + " 个 ▾</button>" +
        '<button type="button" data-ai-custom-add>+ 自定义</button>' +
        '<button type="button" data-ai-tpl-toggle>模板</button></div>' +
        '<div class="ai-grid" data-ai-intl hidden>' + intl.map(btn).join("") + "</div>" +
        '<div class="ai-grid" data-ai-own' + (own.length ? "" : " hidden") + ">" + own.map(btn).join("") + "</div>" +
        '<div class="ai-panel" data-ai-custom-panel hidden>' +
          '<input data-ai-name placeholder="名称，如「本地 Ollama」">' +
          '<input data-ai-url placeholder="网址，可含 {q} 占位">' +
          '<div class="ai-acts"><button type="button" class="ai-ok" data-ai-save>保存</button>' +
          '<button type="button" data-ai-cancel>取消</button></div>' +
          '<p class="ai-hint" data-ai-msg>只存本机；没有 {q} 就只复制并打开站点。</p>' +
        "</div>" +
        '<div class="ai-panel" data-ai-tpl-panel hidden>' + tplFields +
          '<div class="ai-acts"><button type="button" class="ai-ok" data-ai-tpl-save>保存模板</button></div>' +
          '<p class="ai-hint">保存后，每次发给 AI 都会自动附上这些约束。</p>' +
        "</div>" +
        "</div>" +
        '<pre class="code">' + escapeHtml(text) + "</pre>" +
        '<h4 class="codes__h">HTML <button type="button" class="codes__copy" data-copy-code="html">复制</button></h4>' +
        '<pre class="code">' + escapeHtml(html) + "</pre>" +
        '<h4 class="codes__h">CSS <button type="button" class="codes__copy" data-copy-code="css">复制</button></h4>' +
        '<pre class="code">' + escapeHtml(css) + "</pre>";
    }

    return "";
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function paintBody() {
    if (!dBody) return;
    dBody.innerHTML = bodyHTML();
    dBody.scrollTop = 0;
    $$("[data-d-tab]").forEach((b) => b.classList.toggle("on", b.dataset.dTab === curTab));
  }

  function currentPromptText() {
    if (!curItem) return "";
    curItem._vals = curVals;
    return lib.promptFor(curItem) || "";
  }

  // 交给 AI 的完整材料：提示词 + HTML + CSS（带当前参数）
  function currentBundle() {
    if (!curItem) return "";
    const html = window.TZP ? window.TZP.codeForPath(curItem, "html") : (curItem.html || "");
    const css = lib.cssWithParams(curItem.css, curItem.id, curVals);
    return [
      window.TZAI ? window.TZAI.composeFrom(currentPromptText()) : currentPromptText(),
      "",
      "HTML", "```html", html, "```",
      "",
      "CSS", "```css", css, "```"
    ].join("\n");
  }

  function currentText() {
    return currentBundle();
  }

  function openDetail(uid) {
    const item = lib && lib.byUid[uid];
    if (!item) return;
    curItem = item;
    curVals = lib.defaultVals(item);
    curParams = lib.paramList(item);
    curTab = "params";

    $("[data-d-name]").textContent = item.zh;
    $("[data-d-meta]").textContent = metaOf(item);

    detail.classList.add("on");
    dStage.innerHTML = "";
    delete dStage.dataset.fitted;
    paintBody();

    lib.ensure(item).then(() => {
      if (curItem !== item) return;
      remount();
    });
  }

  function closeDetail() {
    detail.classList.remove("on");
    curItem = null;
    setTimeout(() => { dStage.innerHTML = ""; delete dStage.dataset.fitted; }, 300);
  }

  /* ================= 接入 ================= */

  let guidePath = "html";

  function pickedUid() {
    try { return localStorage.getItem(PICK_KEY) || ""; } catch (e) { return ""; }
  }

  function paintGuide() {
    const empty = $("[data-guide-empty]");
    const pin = $("[data-guide-pin]");
    const uid = pickedUid();
    const item = uid && lib ? lib.byUid[uid] : null;

    if (!item) {
      empty.hidden = false;
      pin.hidden = true;
      return;
    }
    empty.hidden = true;
    pin.hidden = false;

    $("[data-guide-name]").textContent = item.zh;
    $("[data-guide-meta]").textContent = metaOf(item);

    const paths = (window.TZP && window.TZP.DEV_PATHS) || [];
    $("[data-guide-paths]").innerHTML = paths
      .map((p) => '<button class="path' + (p.key === guidePath ? " on" : "") + '" type="button" data-path="' + p.key + '">' + p.label + "</button>")
      .join("");

    const cur = paths.find((p) => p.key === guidePath) || paths[0];
    $("[data-guide-intro]").textContent = cur ? cur.intro : "";

    const stage = $("[data-guide-stage]");
    if (!stage.dataset.uid || stage.dataset.uid !== item.uid) {
      stage.dataset.uid = item.uid;
      stage.innerHTML = "";
      delete stage.dataset.fitted;
      lib.ensure(item).then(() => {
        if (heavyItem(item)) { stage.innerHTML = liteHTML(item); return; }
        try {
          lib.mount(stage, item, true);
          fit(stage, 1);
        } catch (e) { /* noop */ }
      });
    }

    lib.ensure(item).then(() => {
      const code = window.TZP ? window.TZP.codeForPath(item, guidePath) : "";
      $("[data-guide-code]").textContent = code;
    });
  }

  /* ================= 设置 ================= */

  // 「跟随系统」以原生为准：WebView 里的 prefers-color-scheme 跟的是应用主题，
  // 不是手机设置，直接用它会出现「手机是浅色、应用变深色」。
  function systemDarkNow() {
    try {
      if (window.ZingdexHost && typeof window.ZingdexHost.systemDark === "function") {
        return !!window.ZingdexHost.systemDark();
      }
    } catch (e) { /* 往下兜 */ }
    try { return matchMedia("(prefers-color-scheme: dark)").matches; } catch (e) { return false; }
  }

  function resolveTheme(s) {
    const t = (s && s.theme) || "light";
    if (t !== "auto") return t;
    return systemDarkNow() ? "dark" : "light";
  }

  function applySettingsToDom() {
    const s = window.TRSettings.get();
    const h = document.documentElement;
    const t = resolveTheme(s);
    h.dataset.theme = t;
    h.dataset.skin = s.skin || "none";
    h.dataset.fs = s.fs || "m";
    h.dataset.lh = s.lh || "normal";
    if (s.cardAnim) h.dataset.cardAnim = s.cardAnim;
    if (window.ZingdexHost && window.ZingdexHost.setTheme) {
      try { window.ZingdexHost.setTheme(t); } catch (e) { /* noop */ }
    }
  }

  // 系统切深浅色时，如果选的是「跟随」，立刻跟着变
  try {
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      const s = window.TRSettings.get();
      if (s.theme === "auto") applySettingsToDom();
    });
  } catch (e) { /* 老内核忽略 */ }

  // 原生在系统主题变化时通知一次
  window.TZThemeSync = function () { applySettingsToDom(); };

  // 切后台就暂停卡片动画，回来接着放：省电，也避免后台空转
  document.addEventListener("visibilitychange", () => {
    document.documentElement.dataset.pageHidden = document.hidden ? "1" : "0";
  });

  function paintSettings() {
    const s = window.TRSettings.get();
    $$("[data-set]").forEach((box) => {
      const key = box.dataset.set;
      box.querySelectorAll("button").forEach((b) => {
        b.classList.toggle("on", String(s[key]) === b.dataset.v);
      });
    });
  }

  $$("[data-set]").forEach((box) => {
    box.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-v]");
      if (!b) return;
      window.TRSettings.set({ [box.dataset.set]: b.dataset.v });
      applySettingsToDom();
      paintSettings();
    });
  });

  /* ================= 事件 ================= */

  document.addEventListener("click", async (e) => {
    const goBtn = e.target.closest("[data-go]");
    if (goBtn) { go(goBtn.dataset.go); return; }

    // 详情
    if (e.target.closest("[data-d-close]")) { closeDetail(); return; }
    if (e.target.closest("[data-d-replay]")) { remount(); return; }

    const dtab = e.target.closest("[data-d-tab]");
    if (dtab) {
      curTab = dtab.dataset.dTab;
      paintBody();
      return;
    }

    if (e.target.closest("[data-d-pin]")) {
      if (!curItem) return;
      try { localStorage.setItem(PICK_KEY, curItem.uid); } catch (err) { /* noop */ }
      closeDetail();
      go("guide");
      toast("已放入接入");
      return;
    }

    // 恢复默认参数
    if (e.target.closest("[data-d-reset]")) {
      if (!curItem) return;
      curVals = lib.defaultVals(curItem);
      paintBody();
      remount();
      toast("已恢复默认参数");
      return;
    }

    // AI 提示词页里单独复制 HTML / CSS
    const codeBtn = e.target.closest("[data-copy-code]");
    if (codeBtn && curItem) {
      const kind = codeBtn.dataset.copyCode;
      const text = kind === "html"
        ? (window.TZP ? window.TZP.codeForPath(curItem, "html") : curItem.html)
        : lib.cssWithParams(curItem.css, curItem.id, curVals);
      if (text) copyText(text);
      return;
    }

    // AI：先复制提示词，再打开对应网站 / App
    const aiMore = e.target.closest("[data-ai-more]");
    if (aiMore) {
      const intl = $("[data-ai-intl]", dBody);
      if (intl) {
        const open = intl.hidden;
        intl.hidden = !open;
        aiMore.textContent = open ? "收起 ▴" : "海外 " + ((window.TZP && window.TZP.AI_TARGETS_INTL) || []).length + " 个 ▾";
      }
      return;
    }

    // 自定义 AI：增删与模板，只存本机
    const cAdd = e.target.closest("[data-ai-custom-add]");
    if (cAdd) {
      const p = $("[data-ai-custom-panel]", dBody);
      if (p) p.hidden = !p.hidden;
      return;
    }
    const cCancel = e.target.closest("[data-ai-cancel]");
    if (cCancel) {
      const p = $("[data-ai-custom-panel]", dBody);
      if (p) p.hidden = true;
      return;
    }
    const cSave = e.target.closest("[data-ai-save]");
    if (cSave && window.TZAI) {
      const name = $("[data-ai-name]", dBody);
      const url = $("[data-ai-url]", dBody);
      const msg = $("[data-ai-msg]", dBody);
      const n = (name && name.value || "").trim();
      const u = (url && url.value || "").trim();
      if (!n || !u) { if (msg) msg.textContent = "名称和网址都要填。"; return; }
      const list = window.TZAI.addCustom(n, u);
      const own = $("[data-ai-own]", dBody);
      if (own) {
        own.hidden = false;
        own.innerHTML = list.map(function (t) {
          return '<button type="button" data-ai="' + t.key + '">' + t.label +
            '<i class="ai-x" data-ai-del="' + t.key + '">×</i></button>';
        }).join("");
      }
      const p = $("[data-ai-custom-panel]", dBody);
      if (p) p.hidden = true;
      if (name) name.value = "";
      if (url) url.value = "";
      toast("已添加「" + n + "」");
      return;
    }
    const cDel = e.target.closest("[data-ai-del]");
    if (cDel && window.TZAI) {
      const list = window.TZAI.removeCustom(cDel.dataset.aiDel);
      const own = $("[data-ai-own]", dBody);
      if (own) {
        own.innerHTML = list.map(function (t) {
          return '<button type="button" data-ai="' + t.key + '">' + t.label +
            '<i class="ai-x" data-ai-del="' + t.key + '">×</i></button>';
        }).join("");
        own.hidden = !list.length;
      }
      return;
    }
    const tplToggle = e.target.closest("[data-ai-tpl-toggle]");
    if (tplToggle) {
      const p = $("[data-ai-tpl-panel]", dBody);
      if (p) p.hidden = !p.hidden;
      return;
    }
    const tplSave = e.target.closest("[data-ai-tpl-save]");
    if (tplSave && window.TZAI) {
      const vals = {};
      $$("[data-ai-tpl-field]", dBody).forEach((el) => { vals[el.dataset.aiTplField] = el.value; });
      window.TZAI.saveTemplate(vals);
      toast("模板已保存");
      return;
    }

    const aiBtn = e.target.closest("[data-ai]");
    if (aiBtn) {
      const list = (window.TZAI ? window.TZAI.all() : ((window.TZP && window.TZP.AI_TARGETS) || []));
      const target = list.find((t) => t.key === aiBtn.dataset.ai);
      if (!target) return;
      showDialog("是否接入 " + target.label + "？",
        "确定后会用系统分享面板发出「提示词 + HTML + CSS」，发到哪个应用由你决定。", () => {
          const text = currentBundle();
          if (!text) return;
          // 分享面板是主路径；同时写一份到剪贴板，万一没有可分享的应用也不至于丢
          nativeCopy(text);
          if (!nativeShare(curItem ? curItem.zh + " · 动效规格" : "动效规格", text)) {
            toast("已复制，请手动粘贴到目标应用");
          }
        });
      return;
    }

    if (e.target.closest("[data-dialog-cancel]")) {
      closeDialog();
      return;
    }
    if (e.target.closest("[data-dialog-ok]")) {
      const fn = dialogAction;
      closeDialog();
      if (fn) fn();
      return;
    }

    // 参数交互
    const easeBtn = e.target.closest("[data-ease]");
    if (easeBtn && curVals) {
      curVals.ease = easeBtn.dataset.ease;
      $$("[data-ease]", dBody).forEach((b) => b.classList.toggle("on", b === easeBtn));
      applyVals();
      const out = $('[data-out="ease"]', dBody);
      if (out) out.textContent = EASE_LABEL[curVals.ease] || curVals.ease;
      setTimeout(remount, 0);
      return;
    }

    // 接入
    const pathBtn = e.target.closest("[data-path]");
    if (pathBtn) {
      guidePath = pathBtn.dataset.path;
      paintGuide();
      return;
    }
    if (e.target.closest("[data-guide-copy]")) {
      const code = $("[data-guide-code]").textContent || "";
      if (code) copyText(code);
      return;
    }
    if (e.target.closest("[data-guide-open]")) {
      const uid = pickedUid();
      if (uid) openDetail(uid);
      return;
    }

    // 列表
    const more = e.target.closest("[data-more]");
    if (more) { shown += PAGE; paintGrid(); return; }

    const sbtn = e.target.closest("[data-scope-btn]");
    if (sbtn) {
      fillScopeCount(sbtn.dataset.scopeBtn);
      setScope(sbtn.dataset.scopeBtn);
      return;
    }

    const chip = e.target.closest("[data-cat]");
    if (chip) {
      const c = chip.dataset.cat;
      if (!(c in catCounts)) {
        catCounts[c] = c === "全部" ? items.length : items.filter((i) => i.cat === c).length;
      }
      activeCat = c;
      shown = PAGE;
      paintChips();
      swapGrid(paintGrid);
      scrollToList();
      return;
    }

    const card = e.target.closest("[data-open]");
    if (card) { openDetail(card.dataset.open); return; }

    // 保存二维码到相册：交给原生直接读资源文件，避免 file:// 下 fetch 被拦
    if (e.target.closest("[data-qr-save]")) {
      const msg = $("[data-qr-msg]");
      if (msg) { msg.textContent = "正在保存…"; msg.className = "msg"; }
      if (window.ZingdexHost && typeof window.ZingdexHost.saveQr === "function") {
        try { window.ZingdexHost.saveQr(); } catch (err) { /* noop */ }
        if (msg) { msg.textContent = "已保存到相册。若该二维码失效，请打开使用说明，查阅其他联系方式。"; msg.className = "msg ok"; }
      } else {
        const a = document.createElement("a");
        a.href = "mailto:2083825368@qq.com";
        a.download = "Zingdex-联系二维码.png";
        a.click();
        if (msg) { msg.textContent = "已保存到相册。若该二维码失效，请打开使用说明，查阅其他联系方式。"; msg.className = "msg ok"; }
      }
      return;
    }

  });

  dBody.addEventListener("input", (e) => {
    const el = e.target.closest("input[data-tune]");
    if (!el || !curVals) return;
    curVals[el.dataset.tune] = Number(el.value);
    applyVals();
    const out = $('[data-out="' + el.dataset.tune + '"]', dBody);
    if (out) {
      const p = curParams.find((x) => x.k === el.dataset.tune) || { k: el.dataset.tune };
      out.textContent = valText(p);
    }
  });


  /* ================= 返回键（防误触，永不退出） ================= */
  // 链条：关弹窗 → 关详情 → 回组件视图 → 滚回最顶 → 提示「已在首页」
  // 退出应用只能靠系统手势上滑或主界面按键，不靠返回键。
  window.TZBack = {
    handle: function () {
      try {
        if (dialogEl && !dialogEl.hidden) { closeDialog(); return; }
        if (detail && detail.classList.contains("on")) { closeDetail(); return; }
        if (view !== "lib") { go("lib", true); return; }
        // 回到顶部要柔和过渡，不要闪一下
        if (window.scrollY > 8) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
        toast("已在首页");
      } catch (e) { /* noop */ }
    }
  };

  /* ================= 启动 ================= */

  function boot() {
    // 版本号从原生读，避免写死后和安装包对不上
    const verEl = document.querySelector("[data-app-ver]");
    if (verEl) {
      if (window.ZingdexHost && typeof window.ZingdexHost.version === "function") {
        try { verEl.textContent = window.ZingdexHost.version(); } catch (e) { /* noop */ }
      } else {
        verEl.textContent = window.TR_VER || "—";
      }
    }

    if (!lib) {
      grid.innerHTML = '<div class="more">组件数据未加载</div>';
      return;
    }
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    if (dialogEl) dialogEl.hidden = true;
    // 分片挂载会改变页面高度，滚回顶部要多兜几次
    const backTop = () => window.scrollTo(0, 0);
    backTop();
    setTimeout(backTop, 60);
    setTimeout(backTop, 400);

    items = lib.items.filter((i) => i.group === scope);
    $$("[data-scope-btn]").forEach((b) => b.classList.toggle("on", b.dataset.scopeBtn === scope));

    // 页面上的数字按库里真实条目算，和电脑端同源，不写死
    (function paintCounts() {
      const all = lib.items;
      const put = (k, v) =>
        document.querySelectorAll('[data-count="' + k + '"]').forEach((el) => { el.textContent = v; });
      const phone = all.filter((i) => i.group === "phone").length;
      put("total", all.length);
      put("phone", phone);
      put("device", all.length - phone);
      put("forms", new Set(all.map((i) => i.group).filter(Boolean)).size);
      put("cats", new Set(all.map((i) => i.cat).filter(Boolean)).size);
    })();

    paintChips();
    paintGrid();
    paintSettings();
    applySettingsToDom();

  }

  /* 顶栏那个按钮：直接切深浅色，不再跳设置 */
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-theme-toggle]");
    if (!btn) return;
    const html = document.documentElement;
    const next = html.dataset.theme === "dark" ? "light" : "dark";
    try {
      if (window.TRSettings && window.TRSettings.set) window.TRSettings.set({ theme: next });
      else html.dataset.theme = next;
    } catch (err) {
      html.dataset.theme = next;
    }
    try {
      if (window.ZingdexHost && window.ZingdexHost.setTheme) window.ZingdexHost.setTheme(next);
    } catch (err) { /* noop */ }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
