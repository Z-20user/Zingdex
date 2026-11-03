/* Zingdex — 统一组件库索引（惰性加载版）
   ------------------------------------------------------------------
   索引与负载分离：
     data.js          索引，120 场景 / 4000 条，名称/分类/时长/设备，约 223 KB
     lib/sNNN.js      负载，每个场景一块 html + css + 说明，约 65–137 KB
     lib-gl.js        24 个 Canvas / 3D 重特效，约 25 KB
     effects.js       18 个带参数引擎的基础组件

   页面只加载首屏要用的分片；滚动到哪、点到哪，再补下那一块。
   条目对象对外形状不变：{ uid, zh, en, cat, html, css, duration, easing, params, mount }
   调用方仍可同步调用 mount()，内部会排队等分片到齐再挂。
*/

(function (global) {
  "use strict";

  const VER = "3.0.0";
  const T = global.Zingdex;
  const items = [];

  const FORM_KEYS = ["phone", "wide", "vehicle", "wear", "terminal"];

  function isSpec(item) {
    return !!item && FORM_KEYS.indexOf(item.group) >= 0;
  }

  /* ---------- 分片加载 ---------- */

  const sceneLoaded = {};
  const sceneWaiters = {};

  function sceneOf(uid) {
    // "fx-s001-09" -> "s001"
    const parts = String(uid).split("-");
    return parts.length > 1 ? parts[1] : "";
  }

  function loadScene(sid) {
    if (!sid || sceneLoaded[sid]) return Promise.resolve();
    if (sceneWaiters[sid]) return sceneWaiters[sid];
    const p = new Promise((resolve) => {
      const el = document.createElement("script");
      el.src = "assets/lib/" + sid + ".js?v=" + VER;
      el.async = true;
      const done = () => {
        sceneLoaded[sid] = true;
        delete sceneWaiters[sid];
        resolve();
      };
      el.onload = done;
      el.onerror = done;
      document.head.appendChild(el);
    });
    sceneWaiters[sid] = p;
    return p;
  }

  /* 负载到齐后把 html / css / 说明贴回条目对象 */
  function hydrate(item) {
    if (!item || item._loaded) return item;
    const pay = global.LIB_PAY && global.LIB_PAY[item.id];
    if (pay) {
      const eid = pay.e || "";
      const sharedCss = (global.ENGINE_CSS || {})[eid] || "";
      const sharedHtml = (global.ENGINE_HTML || {})[eid] || "";
      item.html = pay.h || sharedHtml || "";
      item.css = sharedCss ? sharedCss + (pay.c || "") : (pay.c || "");
      item.eid = eid;
      item.note = pay.nt || "";
      item._loaded = true;
    }
    return item;
  }

  function ensure(item) {
    if (!item) return Promise.resolve(null);
    if (!isSpec(item) || item._loaded) return Promise.resolve(hydrate(item));
    return loadScene(sceneOf(item.uid)).then(() => hydrate(item));
  }

  /* ---------- 索引：场景规格 ---------- */

  const SCENES = global.SCENES || [];

  SCENES.forEach((scene) => {
    const gkey = scene.f || "phone";
    scene.cats.forEach((c) => {
      items.push({
        uid: "spec:" + c.fx,
        id: c.fx,
        group: gkey,
        zh: c.zh,
        en: c.en,
        cat: scene.g || "组件",
        mcat: c.mc || "",
        scene: scene.zh,
        sceneEn: scene.en,
        domain: scene.domain,
        kind: scene.kind,
        form: scene.f || "phone",
        tier: c.t ? "flagship" : "core",
        freq: c.fq || 1,
        devices: c.dev || scene.devices || [],
        duration: c.ms,
        easing: c.ease,
        html: "",
        css: "",
        note: "",
        mount: "none",
        _loaded: false
      });
    });
  });

  /* ---------- 索引：Canvas / 3D 重特效 ---------- */

  (global.LIB_GL || []).forEach((g) => {
    items.push({
      uid: "gl:" + g.id,
      id: g.id,
      group: "gl",
      zh: g.zh,
      en: g.en,
      cat: g.tech || "特效",
      html: g.html,
      css: g.css,
      js: g.js,
      duration: 0,
      easing: "",
      mount: "el",
      _loaded: true
    });
  });

  /* ---------- 索引：基础组件 ---------- */

  (T ? T.EFFECTS : []).forEach((e) => {
    const c = T.build(e, {});
    items.push({
      uid: "base:" + e.id,
      id: e.id,
      group: "base",
      zh: e.zh,
      en: e.en,
      cat: "基础组件",
      tags: e.tags,
      html: c.html,
      css: c.css,
      js: "",
      jsBody: c.jsBody,
      duration: e.duration,
      easing: e.easing,
      note: e.desc,
      mount: "effect",
      effect: e,
      _loaded: true
    });
  });

  const byUid = {};
  items.forEach((it) => { byUid[it.uid] = it; });

  // 按屏幕形态分组：比「手机 / 设备」更能说明这东西给什么屏用
  const GROUPS = [
    { key: "phone", label: "竖屏", hint: "手机竖屏触控" },
    { key: "wide", label: "大屏", hint: "电视 / 桌面 / 分屏" },
    { key: "vehicle", label: "车机", hint: "导航与行车信息" },
    { key: "wear", label: "手表", hint: "圆屏与腕上列表" },
    { key: "terminal", label: "终端", hint: "自助机 / 工控 / 墨水屏 / AR" },
    { key: "gl", label: "特效", hint: "Canvas / 3D" },
    { key: "base", label: "基础", hint: "带参数与框架用法" }
  ];
  GROUPS.forEach((g) => {
    g.count = items.filter((it) => it.group === g.key).length;
  });

  /* ---------- 参数面板（由 ms / ease 推导，不占数据） ---------- */

  const DUR_PARAM = { k: "dur", label: "时长", v: 300, min: 120, max: 2600, step: 20, unit: "ms", cssVar: "--fx-dur" };
  const EASE_PARAM = {
    k: "ease", label: "缓动", v: "out", cssVar: "--fx-ease",
    options: [
      { k: "out", label: "减速" },
      { k: "outc", label: "缓减速" },
      { k: "inout", label: "对称" },
      { k: "spring", label: "回弹" },
      { k: "linear", label: "匀速" }
    ]
  };
  const AMP_PARAM = { k: "amp", label: "幅度", v: 1, min: 0.3, max: 2, step: 0.05, unit: "×", cssVar: "--fx-amp" };
  const GAP_PARAM = { k: "gap", label: "错峰", v: 70, min: 0, max: 240, step: 10, unit: "ms", cssVar: "--fx-gap" };

  function paramList(item) {
    const list = [
      Object.assign({}, DUR_PARAM, { v: item.duration || 300 }),
      Object.assign({}, EASE_PARAM, { v: item.easing || "out" }),
      Object.assign({}, AMP_PARAM)
    ];
    // gap 只在样式真的用 --fx-gap 时才给，避免调了个没反应的旋钮
    if (item.css && item.css.indexOf("--fx-gap") >= 0) list.push(Object.assign({}, GAP_PARAM));
    return list;
  }

  function defaultVals(item) {
    const out = { dur: item.duration || 300, ease: item.easing || "out", amp: 1, gap: 70 };
    return out;
  }

  /* ---------- 挂载 ---------- */

  /* 把组件等比缩到「填满但不溢出」。
     设备向组件宽 320，卡片只有 300 出头，缩一次不够——卡片尺寸一变化就必须重算，
     所以这里用 ResizeObserver 跟着宿主尺寸走，而不是只在挂载那一刻量一次。 */
  const FIT_OBS = typeof ResizeObserver !== "undefined"
    ? new ResizeObserver((entries) => {
        entries.forEach((en) => fitCard(en.target));
      })
    : null;

  function fitCard(host) {
    if (!host || !host.isConnected) return;
    let el = null;
    for (const c of host.children) {
      if (c.tagName !== "STYLE" && c !== host._trWrap) { el = c; break; }
    }
    if (!el) return;

    const box = host.getBoundingClientRect();
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (!w || !h || box.width < 40 || box.height < 40) return;

    // 绝对定位居中：transform 不改布局尺寸，留在文档流里会撑开父容器被裁掉
    let wrap = host._trWrap;
    if (!wrap || !wrap.isConnected) {
      wrap = document.createElement("div");
      wrap.style.position = "absolute";
      wrap.style.left = "50%";
      wrap.style.top = "50%";
      wrap.style.transformOrigin = "center center";
      host.insertBefore(wrap, el);
      wrap.appendChild(el);
      host._trWrap = wrap;
    }

    const s = Math.min(1, box.width / w, box.height / h);
    if (!isFinite(s) || s <= 0.05) return;
    wrap.style.transform = "translate(-50%, -50%) scale(" + s.toFixed(4) + ")";
  }

  function watchFit(host) {
    if (!FIT_OBS || !host) return;
    FIT_OBS.unobserve(host);
    FIT_OBS.observe(host);
  }

  /* 画布类特效在挂载那一刻如果处于隐藏容器里，clientWidth 是 0，
     画布就被建成 0×0，之后也不会自己重算——卡片看起来就是空的。
     挂载后统一补一次 resize，让这批重特效按真实尺寸重新铺一次。 */
  let nudgeTimer = 0;
  function canvasNudge() {
    if (nudgeTimer) return;
    nudgeTimer = requestAnimationFrame(() => {
      nudgeTimer = 0;
      try { window.dispatchEvent(new Event("resize")); } catch (e) { /* noop */ }
    });
  }

  /** innerHTML 插入的 <script> 不会执行，重新克隆一遍让它跑起来（粒子 / 物理引擎需要） */
  function execScripts(host) {
    const list = host.querySelectorAll("script");
    for (let i = 0; i < list.length; i++) {
      const old = list[i];
      const s = document.createElement("script");
      if (old.src) s.src = old.src;
      else s.textContent = old.textContent;
      old.parentNode.replaceChild(s, old);
    }
  }

  /* 预览里收口播放次数。
     500 个特效里有 305 个自带 infinite 循环（呼吸、扫光、粒子那种）。放在列表缩略图里
     就成了没完没了地闪，用户看到的不是「这个动效长什么样」，而是「一直在动」。
     规则：列表卡片播一次就停住；详情页（舞台带 data-loop）保持循环，可以看完整节奏。
     导出的代码仍然是特效原本的行为。 */
  function previewMotionRule(item, keepLoop) {
    if (!item || keepLoop) return "";
    // 只有入场 / 退场需要「播一次停住」；循环、状态、列表、加载本来就是循环，
    // 强行停一次反而会停在一个空的结束帧上（扫光扫完、只剩空框）。
    const once = item.mcat === "入场" || item.mcat === "退场" || !item.mcat;
    if (!once) return "";
    // 引擎条目的根类名是 fx-<eid>；旧 120 场景没有 eid，根类名就是 fx-s001-01 本身
    const base = rootSelector(item);
    if (!base) return "";
    const sel = base + "," + base + " *," + base + " *::before," + base + " *::after";
    // 播完回到作者写的静止态：不少「揭幕 / 擦拭」类结束帧是全透明的，
    // 用 both 停在结束态会直接变成一块黑，backwards 才是列表缩略图该有的样子。
    return "<style>" + sel + "{animation-iteration-count:1 !important;animation-fill-mode:backwards !important;}</style>";
  }

  function rootSelector(item) {
    if (!item) return "";
    return item.eid
      ? ".fx-" + item.eid
      : (item.id && String(item.id).indexOf("fx-") === 0 ? "." + item.id : "");
  }

  /* 有些特效的静止态本来就是空的（光带扫完就没了、只剩一个空框）。
     这类卡片停在一帧上等于「什么都没显示」。这里在挂载后把时间轴推到末帧量一次，
     看不清就把播放次数放开，让它继续跑——宁可它在动，也不要给一张空卡。 */
  function previewRestVisible(host, base) {
    const root = host.querySelector(base);
    if (!root) return true;
    const box = root.getBoundingClientRect();
    if (!box.width || !box.height) return true;
    let area = 0;
    let alpha = 0;
    let n = 0;
    const nodes = [root].concat(Array.prototype.slice.call(root.querySelectorAll("*")));
    for (const el of nodes) {
      const cs = getComputedStyle(el);
      const o = parseFloat(cs.opacity);
      const op = isNaN(o) ? 1 : o;
      alpha += op;
      n += 1;
      if (op > 0.08) {
        const r = el.getBoundingClientRect();
        if (r.width > 4 && r.height > 4) area += r.width * r.height;
      }
    }
    const cover = area / (box.width * box.height);
    return alpha / Math.max(1, n) > 0.05 && cover > 0.03;
  }

  function ensurePreviewShows(host, base) {
    if (!host || !base || !host.isConnected) return;
    if (host.querySelector("[data-pv-loop]")) return;
    const anims = host.getAnimations({ subtree: true });
    if (!anims.length) return;
    const saved = anims.map((a) => a.currentTime);
    anims.forEach((a) => {
      try {
        const d = Number(a.effect.getTiming().duration) || 600;
        a.currentTime = Math.min(d * 0.999, 1e6);
      } catch (e) { /* noop */ }
    });
    const ok = previewRestVisible(host, base);
    anims.forEach((a, i) => {
      try { a.currentTime = saved[i] == null ? 0 : saved[i]; } catch (e) { /* noop */ }
    });
    if (ok) return;
    const st = document.createElement("style");
    st.setAttribute("data-pv-loop", "1");
    st.textContent = base + "," + base + " *," + base + " *::before," + base + " *::after" +
      "{animation-iteration-count:infinite !important}";
    host.appendChild(st);
  }

  function mountNow(host, item, runJs) {
    const style = "<style>" + item.css + "</style>";
    // mount() 只用于页内预览；导出走 fullHtml()，所以这里无条件收口播放次数。
    const keepLoop = host.hasAttribute("data-loop") || !!host.closest("[data-loop]");
    const extra = previewMotionRule(item, keepLoop);

    if (item.mount === "el") {
      host.innerHTML = style + item.html + extra;
      if (runJs && item.js) {
        try { new Function("el", item.js)(host); } catch (e) { /* noop */ }
      }
      if (runJs) execScripts(host);
      return;
    }

    if (item.mount === "effect") {
      const code = T.build(item.effect, {});
      host.innerHTML = "<style>" + code.css + "</style>" + code.html;
      if (runJs) {
        if (code.jsBody) {
          try { new Function("root", code.jsBody)(host); } catch (e) { /* noop */ }
        }
        try { item.effect.demo(host, code.params); } catch (e) { /* noop */ }
      }
      return;
    }

    host.innerHTML = style + item.html + extra;
    if (runJs) execScripts(host);
    if (runJs && item.eid && global.ENGINE_JS && global.ENGINE_JS[item.eid]) {
      try { global.ENGINE_JS[item.eid](host.querySelector(".fx-" + item.eid)); }
      catch (e) { /* noop */ }
    }
    if (runJs && host.querySelector("canvas")) canvasNudge();
    // 停住的静止态如果是空的（扫光扫完、只剩空框），放开循环，别给一张空卡
    if (!keepLoop) {
      const base = rootSelector(item);
      requestAnimationFrame(() => { try { ensurePreviewShows(host, base); } catch (e) { /* noop */ } });
    }
    if (host.classList.contains("pv-live")) {
      // 先量一次（隐藏标签页里 rAF 不跑）；下一帧再量一次，之后交给 ResizeObserver
      fitCard(host);
      requestAnimationFrame(() => fitCard(host));
      watchFit(host);
    }
  }

  /* 同步调用，规格条目会先排队等分片 */
  function mount(host, item, runJs) {
    if (!host || !item) return;
    if (!isSpec(item) || item._loaded) {
      mountNow(host, item, runJs);
      return;
    }
    // 同一张卡被重复调用时取消旧的
    mount._seq = (mount._seq || 0) + 1;
    const token = mount._seq;
    host._trToken = token;
    loadScene(sceneOf(item.uid)).then(() => {
      if (host._trToken !== token) return;
      if (!host.isConnected) return;
      hydrate(item);
      try { mountNow(host, item, runJs); } catch (e) { /* noop */ }
      host.dispatchEvent(new CustomEvent("zingdex:mounted", { bubbles: true }));
    });
  }

  /* ---------- 导出用 ---------- */

  function fullHtml(item) {
    const js = item.js || "";
    return '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      "<title>" + item.zh + " · Zingdex</title>\n<style>\n" +
      'body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0a0b0d;color:#f3f2ed;' +
      'font-family:"Geist","Segoe UI","Microsoft YaHei",sans-serif}\n' +
      item.css + "\n</style>\n</head>\n<body>\n" + item.html + "\n" +
      (js ? "<script>\n" + js + "\n<\/script>\n" : "") +
      "</body>\n</html>";
  }

  const DEV_ZH = {
    phone: "手机", tablet: "平板", laptop: "笔记本", desktop: "桌面", kiosk: "自助终端",
    car: "车机", tv: "电视", watch: "手表", ar: "AR / VR", eink: "墨水屏", hmi: "工业屏"
  };

  const EASE_MAP = {
    out: "cubic-bezier(0.16,1,0.3,1)",
    outc: "cubic-bezier(0.33,1,0.68,1)",
    inout: "cubic-bezier(0.76,0,0.24,1)",
    spring: "cubic-bezier(0.34,1.56,0.64,1)",
    linear: "linear"
  };

  const EASE_LABEL = {
    out: "减速", outc: "缓减速", inout: "对称", spring: "回弹", linear: "匀速"
  };

  function cssWithParams(css, cls, vals) {
    if (!css || !vals || !cls) return css;
    const decl = [
      "--fx-dur:" + vals.dur + "ms",
      "--fx-ease:" + (EASE_MAP[vals.ease] || EASE_MAP.out),
      "--fx-amp:" + vals.amp,
      "--fx-gap:" + vals.gap + "ms"
    ].join(";");
    const safe = cls.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp("\\." + safe + "\\s*\\{[^}]*--fx-dur[^}]*\\}");
    if (!re.test(css)) return css;
    return css.replace(re, "." + cls + " {\n  " + decl + "\n}");
  }

  /* 提示词不再把尺寸钉死。先让 AI 问清目标设备与场景，再按那台设备的
     物理特性给参数——同一段动效在手表和电视上不能用同一组数值。 */
  function deviceTable() {
    return [
      "- 手机竖屏（375–430 宽）：位移 16–32px，时长 260–420ms，缓动偏减速",
      "- 平板 / 横屏（768–1180 宽）：位移 24–48px，时长 300–480ms",
      "- 电脑网页（≥1280 宽）：位移收在 8–24px，时长 180–320ms，别做大幅度的整块滑动",
      "- 电视 / 大屏（1920 起，观看距离 2 米以上）：位移 40–80px，时长 400–700ms，节奏要慢",
      "- 车机（横向 1280–1920，驾驶中只能扫一眼）：位移 ≤ 24px，时长 ≤ 260ms，信息必须一眼可读",
      "- 手表（约 200×200 圆屏）：位移 6–16px，时长 200–320ms，注意圆角裁切",
      "- 自助终端 / 工控（触屏 1080–1920）：位移 16–40px，时长 220–380ms，按钮要够大"
    ];
  }

  /* 工程落地补充：交付形态、组件接口、构建链、设计源与验收。
     开源版对所有人生效，不再按身份开关。 */
  function devMode() {
    // 开源版：面向开发者的补充说明对所有人生效
    return true;
  }

  function devEnvBlock() {
    if (!devMode()) return [];
    return [
      "",
      "# 工程落地补充（默认附带）",
      "除了上面的通用要求，还要按当前工程的真实环境交付。先问清楚，再动手：",
      "1. 交付形态：单文件 HTML 演示 / React 组件（TSX）/ Vue 3 SFC / 原生 Web Component，四选一",
      "2. 样式方案：纯 CSS 变量 / Tailwind / CSS Modules / styled-components，别混用",
      "3. 工程约束：TypeScript 是否 strict、是否 SSR（Next / Nuxt）、是否需要 tree-shaking 友好",
      "4. 工具链：在 Claude Code / Cursor / VS Code 里用，还是接 Figma 变量、Storybook 故事、MCP 设计令牌",
      "5. 目标浏览器与打包器：Chrome/Edge 版本下限、Vite 还是 Webpack、是否需要降级到 CSS 变量兜底",
      "",
      "工程化硬要求：",
      "- 组件对外只暴露 props：duration / easing / amplitude / stagger，内部映射到 --fx-* 变量，不要让调用方写死 px",
      "- 所有参数给默认值，传 undefined 时行为与参考实现一致",
      "- SSR 场景：首帧不能依赖 window，动效在 useEffect / onMounted 里启动",
      "- 卸载时清理定时器、rAF、ResizeObserver，避免内存泄漏",
      "- 无障碍：prefers-reduced-motion 降级为透明度过渡，键盘焦点可见",
      "- 提供 1 个最小可运行示例 + 1 段接入说明（不超过 10 行）",
      "",
      "输出顺序：先问 3–5 个问题（形态 / 样式方案 / 框架版本 / 工具链 / 浏览器下限），",
      "拿到回答后再给可运行代码，不要一次抛三个版本让人挑。"
    ];
  }

  function specPrompt(item, vals) {
    const devs = (item.devices || []).map((d) => DEV_ZH[d] || d).join(" · ") || "通用";
    const cls = item.id || "fx-root";
    const v = vals || defaultVals(item);
    const easeCss = EASE_MAP[v.ease] || EASE_MAP.out;
    const ampNote = v.amp > 1 ? "（比默认更夸张）" : v.amp < 1 ? "（比默认更克制）" : "（默认）";
    const paramLines = [
      "- 参考时长：" + v.dur + "ms",
      "- 参考缓动：" + easeCss + "（" + (EASE_LABEL[v.ease] || v.ease) + "）",
      "- 参考幅度：基准量的 " + v.amp + " 倍" + ampNote
    ];
    if (item.css && item.css.indexOf("--fx-gap") >= 0) {
      paramLines.push("- 参考错峰：" + v.gap + "ms（子项依次延迟这么多）");
    }

    return [
      "# 角色",
      "你是资深界面动效设计师。下面给你一个可运行的参考实现，",
      "你的任务不是照抄，而是按对方的实际情况重新做一版。",
      "",
      "# 第一件事：先问，别急着写代码",
      "在输出任何代码之前，先一次问完 3–5 个问题。不要一条一条挤牙膏，也不要问完一个就动手。",
      "至少要问清楚：",
      "1. 目标设备是什么（手机 / 平板 / 电脑网页 / 电视大屏 / 车机 / 手表 / 自助终端 / 小程序 / AR），",
      "   以及屏幕的大致尺寸或视口宽度、横屏还是竖屏",
      "2. 这段动效出现在哪个界面、什么时候触发（首次进入 / 列表滚动 / 点击 / 状态变化 / 循环播放）",
      "3. 内容量有多大（几行、几个卡片、最长一行大约多少字）",
      "4. 有没有必须遵守的尺寸、配色或品牌规范",
      "5. 性能与无障碍要求（要不要照顾低端机、省电模式、prefers-reduced-motion）",
      "",
      "问完之后停下来等我回答，再输出代码。",
      "如果我在提问时已经把上面这些说清楚了，就不用重复问，直接做。",
      "",
      "# 设备适配参考（按答案挑一行用，不要死套）"
    ].concat(deviceTable()).concat([
      "",
      "上面这些是经验区间，不是硬指标。对方给了明确尺寸就以他的为准。",
      "",
      "# 这次要做的动效",
      "- 场景：" + (item.scene || "场景") + (item.domain ? "（" + item.domain + "）" : ""),
      "- 界面结构：" + (item.note || "按参考实现补齐所有元素"),
      "- 动效：" + (item.zh || "") + "（" + (item.cat || "动效") + "类）",
      "- 常见适用设备：" + devs,
      "- 根节点 class 建议：" + cls
    ]).concat(paramLines).concat([
      "",
      "# 可以改的",
      "尺寸、字号、间距、圆角、配色、文案——跟着对方的设计系统走，不用迁就参考实现。",
      "画布大小按目标设备定，不要为了对齐参考实现把内容压小。",
      "",
      "# 建议保留的（这是这个动效的「手感」所在）",
      "- 运动方式与节奏比例（怎么进场、在哪儿过冲、停留多久）",
      "- 元素的层级与先后顺序",
      "- 落位后内容必须完整可读，不裁切、不溢出",
      "",
      "# 硬约束（这几条别破）",
      "1. 只动 transform / opacity / filter；不要动画 width、height、top、left、margin，避免布局抖动。",
      "2. 零外部依赖：不引框架、图标库、字体、图片、任何网络请求。",
      "3. 加 @media (prefers-reduced-motion: reduce)：位移与缩放降级为透明度过渡，循环类停止。",
      "4. 所有选择器以根节点 class 开头，不污染全局样式。",
      "5. 接入时用 animation-fill-mode: both 播一次，不要留无限循环。",
      "",
      "# 输出格式",
      "等我回答完问题后，只输出 1 个 ```html 代码块，里面是完整单文件（<!doctype html> + 内联 <style>）。",
      "代码块之外最多写两行说明：你选了哪组设备参数、为什么。不要复述任务，不要问第二遍。",
      "",
      "# 参考实现（已可运行，看结构和节奏就行）",
      "```html",
      item.html,
      "```",
      "```css",
      cssWithParams(item.css, cls, v),
      "```"
    ]).concat(devEnvBlock()).join("\n");
  }

  /* Canvas / 3D 特效的提示词：没有时长和缓动，参数换成画布那一套 */
  function canvasPrompt(item) {
    const tech = /3d/i.test(item.cat || "") ? "CSS 3D" : "Canvas 2D";
    const devs = (item.devices || []).map((d) => DEV_ZH[d] || d).join(" · ") || "手机 · 平板 · 桌面";
    // 根节点 class 以参考实现里的为准，取不到再退回 gl-<id>
    const m = /class="([a-z0-9-]+)"/i.exec(item.html || "");
    const cls = (m && m[1]) || ("gl-" + (item.id || "root"));
    return [
      "# 任务",
      "复刻下面这一幅可运行的画布动效：它靠逐帧重绘做出来，不是 CSS 关键帧。",
      "",
      "# 输出格式（只做这一件事）",
      "只输出 1 个 ```html 代码块。里面是完整单文件（<!doctype html> + 内联 <style> + 内联 <script>）。",
      "不要写解释、不要写目录、不要复述任务、不要问问题。代码块之外最多一行说明。",
      "",
      "# 规格（严格照做）",
      "- 技术：**" + tech + "**",
      "- 动效：" + (item.zh || "") + "（" + (item.en || "") + "）",
      "- 适用设备：" + devs,
      "- 根节点 class：" + cls,
      "",
      "# 参数（这一组是调好的，按它做）",
      "- 画布尺寸：宽 236px × 高 165px，父容器居中",
      "- 像素密度：按 window.devicePixelRatio 放大画布，再用 ctx.scale 还原，保证高分屏不糊",
      "- 目标帧率：60 FPS；单帧绘制耗时控制在 8ms 以内",
      "- 循环方式：requestAnimationFrame 持续循环，不依赖用户操作",
      "- 配色：主色 #C6F24C · 次色 #4F6B00 · 背景 #0C0E12 · 前景字 #F3F2ED",
      "- 粒子 / 元素数量、速度、生命周期：与原实现保持一致，不要自行增删",
      "",
      "# 硬约束（违反任何一条都算失败）",
      "1. 零外部依赖：不引框架、不引图形库、不加载任何网络资源。",
      "2. 只用原生 " + tech + " API；不要用 canvas 截图冒充动画。",
      "3. 页面不可见时暂停（监听 visibilitychange），切回来再恢复，避免空转耗电。",
      "4. 必须处理 devicePixelRatio，否则高分屏会糊。",
      "5. 必须支持 @media (prefers-reduced-motion: reduce)：降级成一帧静态画面，不再逐帧绘制。",
      "6. 画布外层加 overflow:hidden，确保内容不溢出 236×165 的框。",
      "7. 代码可直接跑：不做构建、不留 TODO、不留占位数据。",
      "",
      "# 输出前自查（全部通过再输出）",
      "- [ ] 动画确实在逐帧变化，不是一张静止图",
      "- [ ] 实际宽高 = 236 × 165，没有溢出或裁切",
      "- [ ] 切换标签页后回来能继续跑，没有内存泄漏（帧循环只有一条）",
      "- [ ] 与参考实现的视觉与节奏一致",
      "",
      "# 参考实现（已可运行，以它为准）",
      "```html",
      item.html || "",
      "```",
      "```css",
      item.css || "/* 无额外样式 */",
      "```",
      "```js",
      item.js || "/* 无需脚本 */",
      "```"
    ].concat(devEnvBlock()).join("\n");
  }

  function promptFor(item) {
    if (item.group === "base" && T) {
      return T.code.prompt(item.effect, T.build(item.effect, {}));
    }
    if (isSpec(item)) return specPrompt(item, item._vals);
    if (item.group === "gl") return canvasPrompt(item);

    const dur = item.duration ? "\n- 时长：" + item.duration + "ms" : "";
    const ease = item.easing ? "\n- 缓动：" + item.easing : "";
    return ("你是资深前端动效工程师。请实现「" + item.zh + "」（" + item.en + "）。\n\n" +
      "【分类】" + item.cat + (item.domain ? " · " + item.domain : "") + "\n" +
      (item.note ? "【说明】" + item.note + "\n" : "") +
      "【参数】" + dur + ease + "\n\n" +
      "【硬性要求】\n" +
      "1. 只用 HTML / CSS / JavaScript，不引入框架与外部资源\n" +
      "2. 动画只改 transform 与 opacity，目标 60 FPS\n" +
      "3. 支持 prefers-reduced-motion，键盘可操作\n" +
      "4. 输出可直接运行的单文件 index.html，并附 React / Vue 用法\n\n" +
      "【参考实现】\n```html\n" + item.html + "\n```\n```css\n" + item.css + "\n```\n" +
      (item.js ? "```js\n" + item.js + "\n```\n" : "")) + devEnvBlock().join("\n");
  }

  global.LIB = {
    items, groups: GROUPS, byUid, mount, ensure, loadScene, sceneOf,
    fullHtml, promptFor, cssWithParams, defaultVals, paramList, EASE_MAP
  };
})(window);
