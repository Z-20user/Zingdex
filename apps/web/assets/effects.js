/* Zingdex — 真实组件库（v2：动效自演示 + 代码即所见）
   ------------------------------------------------------------------
   每条动效包含：
     html(p) / css(p) / initBody(p)   预览与复制共用同一份代码
     demo(root, p)                    预览用自动演示：进入视野就真的动起来
     React / Vue / 小程序 / AI 提示词  由同一份代码生成
   全部离线，无任何外部资源。
*/

(function (global) {
  "use strict";

  const DUR = "{{dur}}";
  const EASE = "{{ease}}";

  function render(tpl, ctx) {
    return String(tpl).replace(/\{\{(\w+)\}\}/g, (m, k) =>
      Object.prototype.hasOwnProperty.call(ctx, k) ? ctx[k] : m
    );
  }

  /* 演示循环：只在元素可见时执行，元素移除后自动停 */
  function every(root, ms, fn, delay) {
    if (!root) return null;
    const tick = () => {
      if (!root.isConnected) {
        clearInterval(timer);
        return;
      }
      const r = root.getBoundingClientRect();
      const visible = r.width > 0 && r.bottom > -120 && r.top < window.innerHeight + 120;
      if (visible) fn();
    };
    const timer = setInterval(tick, ms);
    setTimeout(tick, delay || 260);
    return timer;
  }

  /* ================================================================
     01 · Dock 放大
     ================================================================ */
  const dockZoom = {
    id: "dock-zoom",
    zh: "Dock 放大",
    en: "Dock Zoom",
    scene: "nav",
    tags: ["hover", "scale", "dock"],
    desc: "指针悬停时图标放大，离开回落。只用 transform，不触发重排；放大锚点在底部，图标像从底座长出来。",
    duration: 240,
    easeName: "ease-out-expo",
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    params: [
      { key: "scale", label: "放大倍数", min: 1.1, max: 1.8, step: 0.05, value: 1.35 },
      { key: "size", label: "图标尺寸", min: 36, max: 64, step: 2, value: 46, unit: "px" },
      { key: "gap", label: "间距", min: 4, max: 20, step: 1, value: 10, unit: "px" }
    ],
    html: () => `<nav class="tz-dock" aria-label="快捷导航">
  <button class="tz-dock__item" type="button" aria-label="首页"><svg viewBox="0 0 24 24" fill="none"><path d="M4 11.2 12 4l8 7.2V20h-5.4v-5.6h-5.2V20H4z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg></button>
  <button class="tz-dock__item" type="button" aria-label="搜索"><svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6.2" stroke="currentColor" stroke-width="1.7"/><path d="m15.7 15.7 4.1 4.1" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg></button>
  <button class="tz-dock__item" type="button" aria-label="播放"><svg viewBox="0 0 24 24" fill="none"><path d="M8 5.6v12.8L19 12z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg></button>
  <button class="tz-dock__item" type="button" aria-label="收藏"><svg viewBox="0 0 24 24" fill="none"><path d="M12 4.6 14.3 9.4l5.2.7-3.8 3.7.9 5.2-4.6-2.5-4.6 2.5.9-5.2-3.8-3.7 5.2-.7z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg></button>
  <button class="tz-dock__item" type="button" aria-label="设置"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="1.7"/><path d="M12 3.6v2M12 18.4v2M3.6 12h2M18.4 12h2M6.1 6.1l1.4 1.4M16.5 16.5l1.4 1.4M17.9 6.1l-1.4 1.4M7.5 16.5l-1.4 1.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg></button>
</nav>`,
    css: (p) => `.tz-dock { display: inline-flex; gap: ${p.gap}px; padding: ${Math.round(p.gap + 2)}px; border-radius: 20px; background: #12161c; border: 1px solid #232833; }
.tz-dock__item {
  width: ${p.size}px; height: ${p.size}px; display: grid; place-items: center;
  border: 0; border-radius: 14px; background: #1b2028; color: #cfd5df; cursor: pointer;
  transform-origin: center bottom;
  transition: transform ${DUR}ms ${EASE}, background-color ${DUR}ms ${EASE}, color ${DUR}ms ${EASE};
}
.tz-dock__item svg { width: 55%; height: 55%; }
.tz-dock__item:hover, .tz-dock__item:focus-visible, .tz-dock__item.is-demo {
  transform: scale(${p.scale}); background: #c6f24c; color: #0a0b0d; outline: none;
}
@media (prefers-reduced-motion: reduce) { html:not([data-motion-pref="full"]) .tz-dock__item { transition: none; } }`,
    initBody: () => "",
    demo(root) {
      const items = Array.from(root.querySelectorAll(".tz-dock__item"));
      let i = -1;
      every(root, 760, () => {
        items.forEach((el) => el.classList.remove("is-demo"));
        i = (i + 1) % items.length;
        items[i].classList.add("is-demo");
      });
    }
  };

  /* ================================================================
     02 · 磁吸按钮
     ================================================================ */
  const magneticButton = {
    id: "magnetic-button",
    zh: "磁吸按钮",
    en: "Magnetic Button",
    scene: "nav",
    tags: ["pointer", "translate", "磁吸"],
    desc: "指针进入按钮周围的「磁场」就开始吸附：离得越近偏移越大，有上限；离开磁场后缓动回正。事件绑在不动的那层上，按钮被吸走时不会抖。",
    duration: 260,
    easeName: "ease-out-expo",
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    params: [
      { key: "strength", label: "跟随强度", min: 0.1, max: 0.8, step: 0.05, value: 0.35 },
      { key: "max", label: "最大位移", min: 6, max: 30, step: 1, value: 18, unit: "px" }
    ],
    html: () => `<div class="tz-magnet-wrap">
  <button class="tz-magnet" type="button">磁吸按钮</button>
  <i class="tz-magnet__cursor" aria-hidden="true"></i>
</div>`,
    css: () => `.tz-magnet-wrap {
  position: relative; display: grid; place-items: center;
  padding: 56px 78px; border-radius: 18px; overflow: hidden;
  background: radial-gradient(circle at 50% 50%, rgba(198,242,76,0.10), transparent 62%), #0b0e12;
  cursor: none;
}
.tz-magnet-wrap::before {
  content: ""; position: absolute; width: 190px; height: 190px; border-radius: 50%;
  border: 1px dashed rgba(198,242,76,0.16); pointer-events: none;
}
.tz-magnet {
  --mx: 0px; --my: 0px; --pull: 0;
  padding: 15px 32px; border: 0; border-radius: 999px;
  background: #c6f24c; color: #0a0b0d;
  font: 600 15px/1 "Geist", "Segoe UI", "Microsoft YaHei", sans-serif;
  cursor: none; will-change: transform;
  transform: translate3d(var(--mx), var(--my), 0) scale(calc(1 + 0.04 * var(--pull)));
  transition: transform ${DUR}ms ${EASE}, box-shadow ${DUR}ms ${EASE};
  box-shadow: 0 calc(8px + 10px * var(--pull)) calc(18px + 16px * var(--pull)) rgba(198,242,76,calc(0.10 + 0.22 * var(--pull)));
}
.tz-magnet__cursor {
  position: absolute; left: 50%; top: 50%; width: 10px; height: 10px; margin: -5px;
  border-radius: 50%; background: #fff; opacity: 0; pointer-events: none;
  box-shadow: 0 0 0 6px rgba(255,255,255,0.12);
  transition: opacity 200ms linear;
}
.tz-magnet-wrap.is-demo .tz-magnet__cursor { opacity: 1; }
@media (prefers-reduced-motion: reduce) {
  html:not([data-motion-pref="full"]) .tz-magnet { transition: none; }
}`,
    initBody: (p) => `  var wrap = root.querySelector(".tz-magnet-wrap");
  var el = root.querySelector(".tz-magnet");
  if (!wrap || !el) return;
  var strength = ${p.strength};
  var max = ${p.max};

  /* 事件绑在不动的那层上：按钮被吸走时不会触发「离开」，也就不会抖 */
  function move(e) {
    var r = wrap.getBoundingClientRect();
    var dx = e.clientX - (r.left + r.width / 2);
    var dy = e.clientY - (r.top + r.height / 2);
    var dist = Math.hypot(dx, dy);
    var field = Math.min(r.width, r.height) / 2;
    var near = Math.max(0, 1 - dist / field);
    var k = strength * near;
    el.style.setProperty("--mx", Math.max(-max, Math.min(max, dx * k)).toFixed(1) + "px");
    el.style.setProperty("--my", Math.max(-max, Math.min(max, dy * k)).toFixed(1) + "px");
    el.style.setProperty("--pull", near.toFixed(3));
  }
  function reset() {
    el.style.setProperty("--mx", "0px");
    el.style.setProperty("--my", "0px");
    el.style.setProperty("--pull", "0");
  }
  wrap.addEventListener("pointermove", move);
  wrap.addEventListener("pointerleave", reset);
  el.addEventListener("blur", reset);`,
    demo(root) {
      const wrap = root.querySelector(".tz-magnet-wrap");
      const el = root.querySelector(".tz-magnet");
      const dot = root.querySelector(".tz-magnet__cursor");
      if (!wrap || !el) return;
      wrap.classList.add("is-demo");
      const max = 18;
      let t0 = 0;
      every(root, 4200, () => {
        t0 = performance.now();
        (function step(now) {
          if (!el.isConnected) return;
          const k = Math.min(1, (now - t0) / 3400);
          const ang = -Math.PI / 2 + k * Math.PI * 2;
          const radius = 34 + 46 * Math.sin(k * Math.PI);
          const px = Math.cos(ang) * radius;
          const py = Math.sin(ang) * radius;
          if (dot) {
            dot.style.left = "calc(50% + " + px.toFixed(1) + "px)";
            dot.style.top = "calc(50% + " + py.toFixed(1) + "px)";
          }
          el.style.setProperty("--mx", (px * 0.4).toFixed(1) + "px");
          el.style.setProperty("--my", (py * 0.4).toFixed(1) + "px");
          el.style.setProperty("--pull", (0.45 + 0.55 * Math.sin(k * Math.PI)).toFixed(3));
          if (k < 1) requestAnimationFrame(step);
          else {
            el.style.setProperty("--mx", "0px");
            el.style.setProperty("--my", "0px");
            el.style.setProperty("--pull", "0");
          }
        })(t0);
      }, 900);
    }
  };

  const tabIndicator = {
    id: "tab-indicator",
    zh: "标签滑动指示器",
    en: "Sliding Tab Indicator",
    scene: "nav",
    tags: ["tabs", "indicator", "滑动"],
    desc: "指示块在标签之间滑动，宽度跟着文字宽度走。用 transform 与 width 同时过渡，视线能一直跟着它。",
    duration: 260,
    easeName: "ease-in-out-quart",
    easing: "cubic-bezier(0.76, 0, 0.24, 1)",
    params: [{ key: "radius", label: "圆角", min: 0, max: 24, step: 1, value: 12, unit: "px" }],
    html: () => `<div class="tz-tabs" role="tablist" aria-label="示例标签">
  <span class="tz-tabs__ink" aria-hidden="true"></span>
  <button class="tz-tabs__tab is-on" role="tab" aria-selected="true" type="button">全部</button>
  <button class="tz-tabs__tab" role="tab" aria-selected="false" type="button">设计</button>
  <button class="tz-tabs__tab" role="tab" aria-selected="false" type="button">开发</button>
  <button class="tz-tabs__tab" role="tab" aria-selected="false" type="button">动效</button>
</div>`,
    css: (p) => `.tz-tabs {
  position: relative; display: inline-flex; padding: 4px; gap: 4px;
  border-radius: ${p.radius}px; background: #12161c; border: 1px solid #232833;
}
.tz-tabs__ink {
  position: absolute; top: 4px; left: 4px; height: calc(100% - 8px); width: 0;
  border-radius: ${p.radius}px; background: #c6f24c;
  transition: transform ${DUR}ms ${EASE}, width ${DUR}ms ${EASE};
  will-change: transform, width;
}
.tz-tabs__tab {
  position: relative; z-index: 1; padding: 9px 17px; border: 0; border-radius: ${p.radius}px;
  background: none; color: #9aa1ad;
  font: 500 13px/1 "Geist", "Segoe UI", "Microsoft YaHei", sans-serif;
  cursor: pointer; transition: color ${DUR}ms ${EASE};
}
.tz-tabs__tab.is-on { color: #0a0b0d; }`,
    initBody: () => `  var box = root.querySelector(".tz-tabs");
  if (!box) return;
  var ink = box.querySelector(".tz-tabs__ink");
  var tabs = Array.prototype.slice.call(box.querySelectorAll(".tz-tabs__tab"));

  function place(tab) {
    ink.style.width = tab.offsetWidth + "px";
    ink.style.transform = "translateX(" + (tab.offsetLeft - 4) + "px)";
  }
  function select(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.classList.toggle("is-on", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    place(tab);
  }
  tabs.forEach(function (t) { t.addEventListener("click", function () { select(t); }); });
  box.addEventListener("keydown", function (e) {
    var i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    if (e.key === "ArrowRight") select(tabs[(i + 1) % tabs.length]).focus();
    if (e.key === "ArrowLeft") select(tabs[(i - 1 + tabs.length) % tabs.length]).focus();
  });
  requestAnimationFrame(function () { place(tabs[0]); });
  window.addEventListener("resize", function () {
    place(box.querySelector(".tz-tabs__tab.is-on") || tabs[0]);
  });`,
    demo(root) {
      const tabs = root.querySelectorAll(".tz-tabs__tab");
      let i = 0;
      every(root, 1800, () => {
        i = (i + 1) % tabs.length;
        tabs[i].click();
      });
    }
  };

  /* ================================================================
     04 · 灵动岛
     ================================================================ */
  const dynamicIsland = {
    id: "dynamic-island",
    zh: "灵动岛",
    en: "Dynamic Island",
    scene: "nav",
    tags: ["expand", "island", "展开"],
    desc: "胶囊从紧凑态展开成卡片，宽高与圆角同时过渡，内容分层淡入，看起来像同一个物体在变形。",
    duration: 420,
    easeName: "spring-soft",
    easing: "cubic-bezier(0.22, 1.24, 0.36, 1)",
    params: [{ key: "maxW", label: "展开宽度", min: 240, max: 380, step: 10, value: 320, unit: "px" }],
    html: () => `<div class="tz-island" role="button" tabindex="0" aria-expanded="false" aria-label="展开播放器">
  <div class="tz-island__compact">
    <span class="tz-island__dot"></span>
    <span class="tz-island__label">正在播放</span>
    <span class="tz-island__eq" aria-hidden="true"><i></i><i></i><i></i></span>
  </div>
  <div class="tz-island__expanded">
    <div class="tz-island__art"></div>
    <div class="tz-island__meta"><strong>Zingdex</strong><span>Motion Library</span></div>
    <div class="tz-island__bars" aria-hidden="true">
      <i style="--h:38%"></i><i style="--h:72%"></i><i style="--h:54%"></i>
      <i style="--h:88%"></i><i style="--h:46%"></i><i style="--h:64%"></i>
    </div>
  </div>
</div>`,
    css: (p) => `.tz-island {
  width: 172px; max-width: ${p.maxW}px; padding: 10px 15px;
  border-radius: 999px; background: #050608; color: #f3f2ed; cursor: pointer;
  overflow: hidden;
  transition: width ${DUR}ms ${EASE}, border-radius ${DUR}ms ${EASE}, padding ${DUR}ms ${EASE};
  outline: none;
}
.tz-island:focus-visible { box-shadow: 0 0 0 2px #c6f24c; }
.tz-island.is-open { width: ${p.maxW}px; border-radius: 24px; padding: 14px 16px; }
.tz-island__compact {
  display: flex; align-items: center; gap: 8px; height: 20px; opacity: 1;
  transition: opacity 140ms linear; white-space: nowrap;
}
.tz-island.is-open .tz-island__compact { opacity: 0; height: 0; }
.tz-island__dot { width: 7px; height: 7px; border-radius: 50%; background: #c6f24c; }
.tz-island__label { font: 500 11px/1 "Geist", "Segoe UI", sans-serif; color: #cfd5df; }
.tz-island__eq { display: flex; align-items: flex-end; gap: 2px; margin-left: auto; height: 12px; }
.tz-island__eq i { width: 2px; background: #c6f24c; border-radius: 2px; animation: tz-eq 900ms ease-in-out infinite; }
.tz-island__eq i:nth-child(1) { height: 40%; animation-delay: -200ms; }
.tz-island__eq i:nth-child(2) { height: 90%; animation-delay: -420ms; }
.tz-island__eq i:nth-child(3) { height: 60%; animation-delay: -80ms; }
@keyframes tz-eq { 0%, 100% { transform: scaleY(0.45); } 50% { transform: scaleY(1); } }
.tz-island__expanded {
  display: flex; align-items: center; gap: 12px; height: 0; opacity: 0; overflow: hidden;
  transition: opacity 180ms linear, height ${DUR}ms ${EASE};
}
.tz-island.is-open .tz-island__expanded { height: 66px; opacity: 1; }
.tz-island__art { width: 48px; height: 48px; border-radius: 14px; flex: none;
  background: radial-gradient(120% 120% at 25% 20%, #d7ff6a 0%, #8bbf1f 42%, #1c2a08 100%); }
.tz-island__meta { display: grid; gap: 3px; min-width: 0; }
.tz-island__meta strong { font: 600 13px/1.2 "Geist", "Segoe UI", sans-serif; }
.tz-island__meta span { font-size: 10.5px; color: #8b93a0; }
.tz-island__bars { display: flex; align-items: flex-end; gap: 3px; margin-left: auto; height: 30px; }
.tz-island__bars i { width: 3px; height: var(--h); border-radius: 2px; background: #c6f24c; opacity: 0.75; }`,
    initBody: () => `  var el = root.querySelector(".tz-island");
  if (!el) return;
  function toggle() {
    var open = el.classList.toggle("is-open");
    el.setAttribute("aria-expanded", open ? "true" : "false");
  }
  el.addEventListener("click", toggle);
  el.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
  });`,
    demo(root) {
      const el = root.querySelector(".tz-island");
      if (!el) return;
      let open = true;
      every(root, 2800, () => {
        open = !open;
        el.classList.toggle("is-open", open);
        el.setAttribute("aria-expanded", open ? "true" : "false");
      }, 900);
    }
  };

  /* ================================================================
     05 · 侧栏抽屉
     ================================================================ */
  const drawerPanel = {
    id: "drawer-panel",
    zh: "侧栏抽屉",
    en: "Drawer Panel",
    scene: "nav",
    tags: ["drawer", "panel", "抽屉"],
    desc: "面板从右侧滑入，遮罩同步淡入。只用 transform 与 opacity，动画期间不触发布局。",
    duration: 320,
    easeName: "ease-out-expo",
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    params: [{ key: "width", label: "面板宽度", min: 220, max: 420, step: 10, value: 300, unit: "px" }],
    html: () => `<div class="tz-drawer">
  <button class="tz-drawer__btn" type="button" data-drawer-open>打开侧栏</button>
  <div class="tz-drawer__scrim" data-drawer-close></div>
  <aside class="tz-drawer__panel" role="dialog" aria-label="侧栏" aria-modal="true">
    <div class="tz-drawer__head">
      <strong>场景导航</strong>
      <button class="tz-drawer__close" type="button" data-drawer-close aria-label="关闭">×</button>
    </div>
    <nav class="tz-drawer__nav">
      <a href="#">导航与菜单</a><a href="#">加载与等待</a>
      <a href="#">卡片与容器</a><a href="#">反馈与提示</a>
    </nav>
  </aside>
</div>`,
    css: (p) => `.tz-drawer { position: relative; min-height: 300px; display: grid; place-items: start center; padding-top: 18px; }
.tz-drawer__btn {
  padding: 11px 20px; border: 1px solid #2a303a; border-radius: 10px;
  background: #171c23; color: #e9ebee;
  font: 500 13px/1 "Geist", "Segoe UI", "Microsoft YaHei", sans-serif; cursor: pointer;
}
.tz-drawer__scrim {
  position: absolute; inset: 0; background: rgba(4, 6, 9, 0.62);
  opacity: 0; pointer-events: none; transition: opacity ${DUR}ms ${EASE}; border-radius: 14px;
}
.tz-drawer__panel {
  position: absolute; top: 0; right: 0; height: 100%; width: ${p.width}px; max-width: 88%;
  padding: 16px; background: #101318; border-left: 1px solid #232833;
  border-radius: 14px 0 0 14px; transform: translateX(102%);
  transition: transform ${DUR}ms ${EASE}; will-change: transform;
}
.tz-drawer.is-open .tz-drawer__scrim { opacity: 1; pointer-events: auto; }
.tz-drawer.is-open .tz-drawer__panel { transform: translateX(0); }
.tz-drawer__head { display: flex; align-items: center; justify-content: space-between; color: #f3f2ed; font-size: 13px; }
.tz-drawer__close { border: 0; background: none; color: #8b93a0; font-size: 22px; line-height: 1; cursor: pointer; }
.tz-drawer__nav { display: grid; gap: 2px; margin-top: 14px; }
.tz-drawer__nav a { padding: 11px 10px; border-radius: 9px; color: #b7bdc7; text-decoration: none; font-size: 13px; }
.tz-drawer__nav a:hover { background: #171c23; color: #c6f24c; }`,
    initBody: () => `  var panel = root.querySelector(".tz-drawer__panel");
  var lastFocus = null;
  function open() {
    lastFocus = document.activeElement;
    root.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
  }
  function close() {
    root.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  root.querySelectorAll("[data-drawer-open]").forEach(function (b) {
    b.addEventListener("click", open);
  });
  root.querySelectorAll("[data-drawer-close]").forEach(function (b) {
    b.addEventListener("click", close);
  });
  root.addEventListener("keydown", function (e) {
    if (e.key === "Escape") close();
  });
  panel.setAttribute("aria-hidden", "true");`,
    demo(root) {
      let open = false;
      every(root, 3200, () => {
        open = !open;
        root.classList.toggle("is-open", open);
      }, 900);
    }
  };

  /* ================================================================
     06 · 骨架微光
     ================================================================ */
  const skeletonShimmer = {
    id: "skeleton-shimmer",
    zh: "骨架微光",
    en: "Skeleton Shimmer",
    scene: "loading",
    tags: ["loading", "skeleton", "微光"],
    desc: "在占位块上扫过一道高光，告诉用户内容正在来。只动背景位置，不触发布局。",
    duration: 1600,
    easeName: "linear",
    easing: "linear",
    params: [{ key: "rows", label: "占位行数", min: 2, max: 5, step: 1, value: 3 }],
    html: (p) => {
      let rows = "";
      for (let i = 0; i < p.rows; i++) {
        rows += `  <div class="tz-sk__line" style="width:${[92, 78, 62, 84, 70][i % 5]}%"></div>\n`;
      }
      return `<div class="tz-sk" aria-busy="true" aria-label="内容加载中">
  <div class="tz-sk__head"><div class="tz-sk__avatar"></div><div class="tz-sk__title"></div></div>
${rows}</div>`;
    },
    css: () => `.tz-sk { width: min(420px, 100%); padding: 18px; border-radius: 16px; background: #101318; border: 1px solid #1e222a; }
.tz-sk__head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.tz-sk__avatar, .tz-sk__title, .tz-sk__line {
  border-radius: 8px; background: #1a1f27;
  background-image: linear-gradient(100deg, rgba(255,255,255,0) 20%, rgba(198,242,76,0.18) 45%, rgba(255,255,255,0) 70%);
  background-size: 220% 100%; background-repeat: no-repeat;
  animation: tz-sk-shimmer ${DUR}ms ${EASE} infinite;
}
.tz-sk__avatar { width: 42px; height: 42px; border-radius: 50%; flex: none; }
.tz-sk__title { height: 14px; width: 46%; }
.tz-sk__line { height: 12px; margin-top: 12px; }
@keyframes tz-sk-shimmer { from { background-position: 180% 0; } to { background-position: -60% 0; } }
@media (prefers-reduced-motion: reduce) { html:not([data-motion-pref="full"]) .tz-sk__avatar, html:not([data-motion-pref="full"]) .tz-sk__title, html:not([data-motion-pref="full"]) .tz-sk__line { animation: none; } }`,
    initBody: () => "",
    demo() {}
  };

  /* ================================================================
     07 · 环形进度
     ================================================================ */
  const ringProgress = {
    id: "ring-progress",
    zh: "环形进度",
    en: "Ring Progress",
    scene: "loading",
    tags: ["progress", "svg", "进度"],
    desc: "用 stroke-dashoffset 控制圆周完成度，数字与圆环共用同一个进度变量，从 0 走到目标值。",
    duration: 900,
    easeName: "ease-out-quad",
    easing: "cubic-bezier(0.5, 1, 0.89, 1)",
    params: [
      { key: "value", label: "进度", min: 10, max: 100, step: 1, value: 72, unit: "%" },
      { key: "size", label: "尺寸", min: 80, max: 180, step: 4, value: 120, unit: "px" },
      { key: "stroke", label: "线宽", min: 4, max: 16, step: 1, value: 9, unit: "px" }
    ],
    html: (p) => {
      const r = (p.size - p.stroke) / 2;
      const c = 2 * Math.PI * r;
      return `<div class="tz-ring" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
  <svg width="${p.size}" height="${p.size}" viewBox="0 0 ${p.size} ${p.size}" aria-hidden="true">
    <circle class="tz-ring__track" cx="${p.size / 2}" cy="${p.size / 2}" r="${r}" fill="none" stroke-width="${p.stroke}"/>
    <circle class="tz-ring__bar" cx="${p.size / 2}" cy="${p.size / 2}" r="${r}" fill="none" stroke-width="${p.stroke}"
      stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${c.toFixed(2)}"
      transform="rotate(-90 ${p.size / 2} ${p.size / 2})"/>
  </svg>
  <span class="tz-ring__num">0%</span>
</div>`;
    },
    css: () => `.tz-ring { position: relative; display: inline-grid; place-items: center; }
.tz-ring__track { stroke: #1c212a; }
.tz-ring__bar { stroke: #c6f24c; stroke-linecap: round; transition: stroke-dashoffset ${DUR}ms ${EASE}; }
.tz-ring__num { position: absolute; font: 600 22px/1 "Geist Mono", "Cascadia Mono", Consolas, monospace; color: #f3f2ed; font-variant-numeric: tabular-nums; }`,
    initBody: (p) => `  var ring = root.querySelector(".tz-ring");
  if (!ring) return;
  var bar = ring.querySelector(".tz-ring__bar");
  var num = ring.querySelector(".tz-ring__num");
  var total = parseFloat(bar.getAttribute("stroke-dasharray"));
  var target = ${p.value};

  function run() {
    bar.style.strokeDashoffset = total.toFixed(2);
    num.textContent = "0%";
    ring.setAttribute("aria-valuenow", "0");
    requestAnimationFrame(function () {
      bar.style.strokeDashoffset = (total * (1 - target / 100)).toFixed(2);
      var t0 = performance.now();
      (function step(t) {
        var k = Math.max(0, Math.min(1, (t - t0) / ${DUR}));
        var v = Math.round(target * k);
        num.textContent = v + "%";
        ring.setAttribute("aria-valuenow", String(v));
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    });
  }
  run();
  ring.addEventListener("click", run);`,
    demo(root) {
      const ring = root.querySelector(".tz-ring");
      if (!ring) return;
      every(root, 3200, () => ring.click());
    }
  };

  /* ================================================================
     08 · 数字滚动
     ================================================================ */
  const countUp = {
    id: "count-up",
    zh: "数字滚动",
    en: "Count Up",
    scene: "data",
    tags: ["number", "counter", "计数"],
    desc: "用 requestAnimationFrame 逐帧插值，而不是 setInterval。等宽字形避免位数变化时左右跳动。",
    duration: 900,
    easeName: "ease-out-quart",
    easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    params: [
      { key: "to", label: "目标值", min: 100, max: 99999, step: 1, value: 1286 },
      { key: "decimals", label: "小数位", min: 0, max: 2, step: 1, value: 0 }
    ],
    html: (p) => `<div class="tz-count" aria-label="${p.to}">
  <span class="tz-count__num">0</span>
  <span class="tz-count__unit">个组件</span>
</div>`,
    css: () => `.tz-count { display: inline-flex; align-items: baseline; gap: 8px; color: #f3f2ed; }
.tz-count__num { font: 600 54px/1 "Geist Mono", "Cascadia Mono", Consolas, monospace; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
.tz-count__unit { font-size: 13px; color: #8b93a0; }`,
    initBody: (p) => `  var el = root.querySelector(".tz-count__num");
  if (!el) return;
  var to = ${p.to};
  var dec = ${p.decimals};

  function ease(t) { return 1 - Math.pow(1 - t, 4); }
  function run() {
    var t0 = performance.now();
    (function step(now) {
      var k = Math.max(0, Math.min(1, (now - t0) / ${DUR}));
      el.textContent = (to * ease(k)).toFixed(dec);
      if (k < 1) requestAnimationFrame(step);
      else el.textContent = to.toFixed(dec);
    })(t0);
  }
  run();
  el.parentElement.addEventListener("click", run);`,
    demo(root) {
      const el = root.querySelector(".tz-count__num");
      if (!el) return;
      every(root, 3000, () => el.parentElement.click());
    }
  };

  /* ================================================================
     09 · 柱状生长
     ================================================================ */
  const barGrow = {
    id: "bar-grow",
    zh: "柱状生长",
    en: "Bar Grow",
    scene: "data",
    tags: ["chart", "bar", "错开"],
    desc: "柱子从基线按顺序长出，每根错开 60ms。用 scaleY 而不是 height，不触发每帧布局。",
    duration: 700,
    easeName: "ease-out-back",
    easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    params: [{ key: "stagger", label: "错开间隔", min: 20, max: 140, step: 10, value: 60, unit: "ms" }],
    html: () => `<div class="tz-bars">
  <ul class="tz-bars__list">
${[42, 68, 55, 86, 62, 94, 74]
  .map((v, i) => `    <li class="tz-bars__item"><i style="--v:${v}%;--i:${i}"></i><span>${["一", "二", "三", "四", "五", "六", "日"][i]}</span></li>`)
  .join("\n")}
  </ul>
  <button class="tz-bars__replay" type="button">重播</button>
</div>`,
    css: (p) => `.tz-bars { display: grid; gap: 14px; justify-items: center; }
.tz-bars__list { display: flex; align-items: flex-end; gap: 10px; height: 150px; margin: 0; padding: 0 6px; list-style: none; border-bottom: 1px solid #232833; }
.tz-bars__item { display: grid; justify-items: center; gap: 8px; }
.tz-bars__item i {
  display: block; width: 22px; height: var(--v); border-radius: 6px 6px 2px 2px;
  background: linear-gradient(180deg, #d7ff6a, #8bbf1f);
  transform-origin: bottom; transform: scaleY(0);
  animation: tz-bar-grow ${DUR}ms ${EASE} forwards;
  animation-delay: calc(var(--i) * ${p.stagger}ms);
}
.tz-bars__item span { font-size: 10px; color: #6c7280; }
.tz-bars__replay { padding: 7px 14px; border: 1px solid #2a303a; border-radius: 8px; background: #151a21; color: #b7bdc7; font-size: 12px; cursor: pointer; }
@keyframes tz-bar-grow { to { transform: scaleY(1); } }`,
    initBody: () => `  var btn = root.querySelector(".tz-bars__replay");
  if (btn) {
    btn.addEventListener("click", function () {
      root.querySelectorAll(".tz-bars__item i").forEach(function (el) {
        el.style.animation = "none";
        void el.offsetWidth;
        el.style.animation = "";
      });
    });
  }`,
    demo(root) {
      const btn = root.querySelector(".tz-bars__replay");
      if (!btn) return;
      every(root, 3000, () => btn.click());
    }
  };

  /* ================================================================
     10 · 路径描边
     ================================================================ */
  const lineDraw = {
    id: "line-draw",
    zh: "路径描边",
    en: "Line Draw",
    scene: "data",
    tags: ["svg", "stroke", "描边"],
    desc: "把路径长度写进 stroke-dasharray，再用 dashoffset 从全长收到 0，得到一笔画完的效果，任何 SVG 路径都适用。",
    duration: 1200,
    easeName: "ease-out-cubic",
    easing: "cubic-bezier(0.33, 1, 0.68, 1)",
    params: [{ key: "stroke", label: "线宽", min: 1, max: 6, step: 0.5, value: 2.5, unit: "px" }],
    html: () => `<div class="tz-draw">
  <svg viewBox="0 0 240 120" role="img" aria-label="上升趋势曲线">
    <path class="tz-draw__grid" d="M16 16v88h208M16 44h208M16 72h208M68 16v88M120 16v88M172 16v88"/>
    <path class="tz-draw__line" d="M16 96C52 96 64 74 92 74s38 20 64 -14S196 28 224 24" fill="none" stroke-linecap="round"/>
  </svg>
  <button class="tz-draw__replay" type="button">重播</button>
</div>`,
    css: (p) => `.tz-draw { display: grid; gap: 12px; justify-items: center; }
.tz-draw svg { width: min(420px, 100%); height: auto; }
.tz-draw__grid { fill: none; stroke: #1e232c; stroke-width: 1; }
.tz-draw__line {
  stroke: #c6f24c; stroke-width: ${p.stroke}; stroke-dasharray: 340; stroke-dashoffset: 340;
  animation: tz-draw ${DUR}ms ${EASE} forwards;
  filter: drop-shadow(0 0 6px rgba(198, 242, 76, 0.35));
}
@keyframes tz-draw { to { stroke-dashoffset: 0; } }
.tz-draw__replay { padding: 7px 14px; border: 1px solid #2a303a; border-radius: 8px; background: #151a21; color: #b7bdc7; font-size: 12px; cursor: pointer; }`,
    initBody: () => `  var btn = root.querySelector(".tz-draw__replay");
  if (btn) {
    btn.addEventListener("click", function () {
      var line = root.querySelector(".tz-draw__line");
      line.style.animation = "none";
      void line.getBoundingClientRect();
      line.style.animation = "";
    });
  }`,
    demo(root) {
      const btn = root.querySelector(".tz-draw__replay");
      if (!btn) return;
      every(root, 3400, () => btn.click());
    }
  };

  /* ================================================================
     11 · 3D 倾斜卡片
     ================================================================ */
  const tiltCard = {
    id: "tilt-card",
    zh: "3D 倾斜卡片",
    en: "Parallax Tilt",
    scene: "cards",
    tags: ["3d", "tilt", "倾斜"],
    desc: "指针位置映射到 rotateX / rotateY，卡片以中心为轴倾斜，高光跟着指针走。perspective 放在父层，角度控制在 12° 以内。",
    duration: 200,
    easeName: "ease-out-cubic",
    easing: "cubic-bezier(0.33, 1, 0.68, 1)",
    params: [{ key: "max", label: "最大角度", min: 4, max: 20, step: 1, value: 12, unit: "°" }],
    html: () => `<div class="tz-tilt">
  <div class="tz-tilt__card">
    <span class="tz-tilt__tag">Motion Card</span>
    <h3 class="tz-tilt__title">视差倾斜</h3>
    <p class="tz-tilt__text">指针划过时，卡片朝指针方向轻微倾斜。</p>
    <span class="tz-tilt__glare" aria-hidden="true"></span>
  </div>
</div>`,
    css: () => `.tz-tilt { perspective: 900px; display: grid; place-items: center; padding: 26px; }
.tz-tilt__card {
  position: relative; width: min(300px, 100%); padding: 24px; border-radius: 20px;
  background: linear-gradient(150deg, #171d25 0%, #0e1116 100%);
  border: 1px solid #242a34; color: #f3f2ed;
  transform-style: preserve-3d;
  transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
  transition: transform ${DUR}ms ${EASE};
  will-change: transform; overflow: hidden;
}
.tz-tilt__tag { display: inline-block; padding: 4px 9px; border-radius: 999px; background: rgba(198,242,76,0.12); color: #c6f24c; font: 500 9.5px/1 "Geist Mono", Consolas, monospace; letter-spacing: 0.14em; text-transform: uppercase; }
.tz-tilt__title { margin: 14px 0 8px; font-size: 22px; letter-spacing: -0.01em; }
.tz-tilt__text { margin: 0; font-size: 13px; line-height: 1.6; color: #9aa1ad; }
.tz-tilt__glare {
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none; opacity: 0;
  background: radial-gradient(circle at var(--gx, 50%) var(--gy, 50%), rgba(255,255,255,0.16), transparent 55%);
  transition: opacity ${DUR}ms ${EASE};
}
.tz-tilt__card:hover .tz-tilt__glare, .tz-tilt.is-demo .tz-tilt__glare { opacity: 1; }`,
    initBody: (p) => `  var card = root.querySelector(".tz-tilt__card");
  if (!card) return;
  var box = root.querySelector(".tz-tilt");
  var max = ${p.max};

  box.addEventListener("pointermove", function (e) {
    var r = card.getBoundingClientRect();
    var px = (e.clientX - r.left) / r.width;
    var py = (e.clientY - r.top) / r.height;
    card.style.setProperty("--ry", ((px - 0.5) * max * 2).toFixed(2) + "deg");
    card.style.setProperty("--rx", ((0.5 - py) * max * 2).toFixed(2) + "deg");
    card.style.setProperty("--gx", (px * 100).toFixed(1) + "%");
    card.style.setProperty("--gy", (py * 100).toFixed(1) + "%");
  });
  box.addEventListener("pointerleave", function () {
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
  });`,
    demo(root) {
      const card = root.querySelector(".tz-tilt__card");
      const box = root.querySelector(".tz-tilt");
      if (!card || !box) return;
      const max = parseFloat((card.dataset.max || "").trim()) || 12;
      box.classList.add("is-demo");
      let phase = 0;
      every(root, 2400, () => {
        const start = performance.now();
        const p0 = (phase += 1.4);
        (function step(now) {
          if (!card.isConnected) return;
          const k = Math.min(1, (now - start) / 1700);
          const amp = Math.sin(k * Math.PI);
          card.style.setProperty("--ry", (Math.cos(p0 + k * 2.6) * max * amp).toFixed(2) + "deg");
          card.style.setProperty("--rx", (Math.sin(p0 + k * 2.6) * max * 0.6 * amp).toFixed(2) + "deg");
          card.style.setProperty("--gx", (50 + Math.cos(p0 + k * 2.6) * 34).toFixed(1) + "%");
          card.style.setProperty("--gy", (50 + Math.sin(p0 + k * 2.6) * 30).toFixed(1) + "%");
          if (k < 1) requestAnimationFrame(step);
          else {
            card.style.setProperty("--rx", "0deg");
            card.style.setProperty("--ry", "0deg");
          }
        })(start);
      }, 700);
    }
  };

  /* ================================================================
     12 · 聚光卡片
     ================================================================ */
  const spotlightCard = {
    id: "spotlight-card",
    zh: "聚光卡片",
    en: "Spotlight Card",
    scene: "cards",
    tags: ["glow", "pointer", "聚光"],
    desc: "指针位置写进 CSS 变量，径向渐变跟着走，形成一束打在卡片上的光；边框用同位置的渐变描边强化质感。",
    duration: 180,
    easeName: "ease-out-sine",
    easing: "cubic-bezier(0.61, 1, 0.88, 1)",
    params: [{ key: "size", label: "光斑直径", min: 160, max: 380, step: 10, value: 260, unit: "px" }],
    html: () => `<div class="tz-spot">
  <span class="tz-spot__glow" aria-hidden="true"></span>
  <div class="tz-spot__body">
    <span class="tz-spot__kicker">Spotlight</span>
    <h3>聚光边框</h3>
    <p>把指针位置交给 CSS，光会跟着你走。</p>
  </div>
</div>`,
    css: (p) => `.tz-spot { position: relative; width: min(330px, 100%); padding: 26px; border-radius: 18px; background: #0f1319; border: 1px solid #20262f; overflow: hidden; isolation: isolate; }
.tz-spot__glow {
  position: absolute; inset: 0; z-index: -1; opacity: 0; transition: opacity ${DUR}ms ${EASE};
  background: radial-gradient(${p.size}px circle at var(--mx, 50%) var(--my, 50%), rgba(198,242,76,0.18), transparent 62%);
}
.tz-spot:hover .tz-spot__glow, .tz-spot.is-demo .tz-spot__glow { opacity: 1; }
.tz-spot::after {
  content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1px; pointer-events: none;
  background: radial-gradient(${p.size}px circle at var(--mx, 50%) var(--my, 50%), rgba(198,242,76,0.7), transparent 60%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  opacity: 0; transition: opacity ${DUR}ms ${EASE};
}
.tz-spot:hover::after, .tz-spot.is-demo::after { opacity: 1; }
.tz-spot__kicker { font: 500 9.5px/1 "Geist Mono", Consolas, monospace; letter-spacing: 0.16em; text-transform: uppercase; color: #c6f24c; }
.tz-spot__body h3 { margin: 12px 0 6px; font-size: 21px; color: #f3f2ed; }
.tz-spot__body p { margin: 0; font-size: 13px; color: #98a0ac; }`,
    initBody: () => `  var el = root.querySelector(".tz-spot");
  if (!el) return;
  el.addEventListener("pointermove", function (e) {
    var r = el.getBoundingClientRect();
    el.style.setProperty("--mx", (e.clientX - r.left).toFixed(1) + "px");
    el.style.setProperty("--my", (e.clientY - r.top).toFixed(1) + "px");
  });`,
    demo(root) {
      const el = root.querySelector(".tz-spot");
      if (!el) return;
      el.classList.add("is-demo");
      let t = 0;
      every(root, 60, () => {
        t += 0.035;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", (r.width * (0.5 + 0.38 * Math.cos(t))).toFixed(1) + "px");
        el.style.setProperty("--my", (r.height * (0.5 + 0.34 * Math.sin(t * 1.4))).toFixed(1) + "px");
      });
    }
  };

  /* ================================================================
     13 · 玻璃面板
     ================================================================ */
  const glassPanel = {
    id: "glass-panel",
    zh: "玻璃面板",
    en: "Glass Panel",
    scene: "cards",
    tags: ["glass", "blur", "玻璃"],
    desc: "背后铺一层高饱和、带细节的底（渐变网格 + 点阵 + 光斑），再用背景模糊、饱和度提升、细高光边和跟随指针的反光叠出厚度。模糊半径调大调小，玻璃的「厚度」立刻能看出来。",
    duration: 6000,
    easeName: "linear",
    easing: "linear",
    params: [
      { key: "blur", label: "模糊半径", min: 2, max: 32, step: 1, value: 18, unit: "px" },
      { key: "tint", label: "底色浓度", min: 2, max: 40, step: 1, value: 10, unit: "%" }
    ],
    html: () => `<div class="tz-glass-wrap">
  <span class="tz-glass-wrap__blob tz-glass-wrap__blob--a" aria-hidden="true"></span>
  <span class="tz-glass-wrap__blob tz-glass-wrap__blob--b" aria-hidden="true"></span>
  <span class="tz-glass-wrap__stripes" aria-hidden="true"></span>
  <div class="tz-glass">
    <div class="tz-glass__shine" aria-hidden="true"></div>
    <div class="tz-glass__glare" aria-hidden="true"></div>
    <span class="tz-glass__kicker">Liquid Glass</span>
    <h3 class="tz-glass__title">玻璃面板</h3>
    <p class="tz-glass__text">背后的色彩和网格隔着玻璃被揉开，边缘一道高光收住厚度。</p>
    <button class="tz-glass__btn" type="button">了解更多</button>
  </div>
</div>`,
    css: (p) => `.tz-glass-wrap {
  position: relative; display: grid; place-items: center;
  padding: 40px; border-radius: 18px; overflow: hidden;
  background:
    radial-gradient(circle at 22% 18%, #6d3bff 0%, transparent 46%),
    radial-gradient(circle at 82% 28%, #00c2a8 0%, transparent 44%),
    radial-gradient(circle at 66% 88%, #ff4d8d 0%, transparent 48%),
    linear-gradient(140deg, #101a3a, #0a0d12 70%);
}
.tz-glass-wrap__stripes {
  position: absolute; inset: 0; opacity: 0.5; pointer-events: none;
  background-image:
    repeating-linear-gradient(90deg, rgba(255,255,255,0.16) 0 1px, transparent 1px 22px),
    repeating-linear-gradient(0deg, rgba(255,255,255,0.10) 0 1px, transparent 1px 22px);
}
.tz-glass-wrap__blob {
  position: absolute; border-radius: 50%; filter: blur(26px); opacity: 0.9;
  animation: tz-blob 9s ease-in-out infinite alternate;
}
.tz-glass-wrap__blob--a { width: 190px; height: 190px; left: 40px; top: 26px; background: #c6f24c; }
.tz-glass-wrap__blob--b { width: 170px; height: 170px; right: 46px; bottom: 30px; background: #3b6cff; opacity: 0.7; animation-delay: -4s; }
@keyframes tz-blob { from { transform: translate3d(-14px, -10px, 0) scale(1); } to { transform: translate3d(26px, 22px, 0) scale(1.16); } }

.tz-glass {
  position: relative; width: min(320px, 100%); padding: 26px; border-radius: 22px; color: #f7f8f6;
  background:
    linear-gradient(180deg, rgba(12, 16, 24, 0.34), rgba(12, 16, 24, 0.56)),
    rgba(255, 255, 255, ${p.tint / 100});
  -webkit-backdrop-filter: blur(${p.blur}px) saturate(180%);
  backdrop-filter: blur(${p.blur}px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.28);
  box-shadow: 0 1px 0 rgba(255,255,255,0.45) inset, 0 -1px 0 rgba(255,255,255,0.08) inset, 0 24px 60px rgba(0,0,0,0.45);
  overflow: hidden;
  cursor: crosshair;
}
.tz-glass__shine {
  position: absolute; inset: -40% -10% auto -10%; height: 70%;
  background: linear-gradient(180deg, rgba(255,255,255,0.55), transparent);
  opacity: 0.5; transform: rotate(-8deg);
  animation: tz-shine ${DUR}ms ${EASE} infinite alternate;
  pointer-events: none;
}
@keyframes tz-shine { from { transform: translateX(-18%) rotate(-8deg); } to { transform: translateX(18%) rotate(-8deg); } }
.tz-glass__glare {
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  background: radial-gradient(circle at var(--gx, 30%) var(--gy, 20%), rgba(255,255,255,0.34), transparent 52%);
  transition: opacity 300ms linear; opacity: 0.7;
}
.tz-glass__kicker { position: relative; font: 500 9.5px/1 "Geist Mono", Consolas, monospace; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.88); text-shadow: 0 1px 2px rgba(0,0,0,0.4); }
.tz-glass__title { position: relative; margin: 12px 0 8px; font-size: 23px; letter-spacing: -0.01em; text-shadow: 0 1px 3px rgba(0,0,0,0.45); }
.tz-glass__text { position: relative; margin: 0 0 18px; font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.94); text-shadow: 0 1px 2px rgba(0,0,0,0.4); }
.tz-glass__btn { position: relative; padding: 9px 16px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.4); background: rgba(255,255,255,0.18); color: #fff; font-size: 12.5px; cursor: pointer; transition: background ${DUR}ms ${EASE}, transform ${DUR}ms ${EASE}; }
.tz-glass__btn:hover { background: rgba(255,255,255,0.3); }
.tz-glass__btn:active { transform: scale(0.97); }
@media (prefers-reduced-motion: reduce) {
  html:not([data-motion-pref="full"]) .tz-glass__shine,
  html:not([data-motion-pref="full"]) .tz-glass-wrap__blob { animation: none; }
}`,
    initBody: () => `  var card = root.querySelector(".tz-glass");
  var glare = root.querySelector(".tz-glass__glare");
  if (!card || !glare) return;
  card.addEventListener("pointermove", function (e) {
    var r = card.getBoundingClientRect();
    glare.style.setProperty("--gx", (((e.clientX - r.left) / r.width) * 100).toFixed(1) + "%");
    glare.style.setProperty("--gy", (((e.clientY - r.top) / r.height) * 100).toFixed(1) + "%");
  });
  card.addEventListener("pointerleave", function () {
    glare.style.setProperty("--gx", "30%");
    glare.style.setProperty("--gy", "20%");
  });`,
    demo(root) {
      const glare = root.querySelector(".tz-glass__glare");
      const card = root.querySelector(".tz-glass");
      if (!glare || !card) return;
      let t0 = 0;
      every(root, 6000, () => {
        t0 = performance.now();
        (function step(now) {
          if (!glare.isConnected) return;
          const k = Math.min(1, (now - t0) / 5200);
          glare.style.setProperty("--gx", (30 + Math.cos(k * Math.PI * 2) * 34).toFixed(1) + "%");
          glare.style.setProperty("--gy", (24 + Math.sin(k * Math.PI * 2) * 30).toFixed(1) + "%");
          if (k < 1) requestAnimationFrame(step);
        })(t0);
      }, 500);
    }
  };

  const accordion = {
    id: "accordion",
    zh: "手风琴",
    en: "Accordion",
    scene: "cards",
    tags: ["collapse", "grid", "展开"],
    desc: "用 grid-template-rows: 0fr → 1fr 做高度过渡，不需要写死高度，也不需要测量 scrollHeight，换任意内容都不会跳。",
    duration: 300,
    easeName: "ease-out-quart",
    easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    params: [{ key: "radius", label: "圆角", min: 8, max: 24, step: 1, value: 14, unit: "px" }],
    html: () => `<div class="tz-acc">
  <div class="tz-acc__item is-open">
    <button class="tz-acc__head" type="button" aria-expanded="true"><span>动效为什么重要</span><i aria-hidden="true"></i></button>
    <div class="tz-acc__wrap"><div class="tz-acc__body">动效负责交代因果：谁触发了什么、东西从哪里来、下一步可以往哪走。</div></div>
  </div>
  <div class="tz-acc__item">
    <button class="tz-acc__head" type="button" aria-expanded="false"><span>时长怎么定</span><i aria-hidden="true"></i></button>
    <div class="tz-acc__wrap"><div class="tz-acc__body">小元素 150–250ms，面板 250–400ms，页面转场 400–600ms。超过 600ms 必须有进度反馈。</div></div>
  </div>
  <div class="tz-acc__item">
    <button class="tz-acc__head" type="button" aria-expanded="false"><span>怎么保证 60 帧</span><i aria-hidden="true"></i></button>
    <div class="tz-acc__wrap"><div class="tz-acc__body">只动 transform 与 opacity；避免 width / height / top / left；给动画元素加 will-change。</div></div>
  </div>
</div>`,
    css: (p) => `.tz-acc { width: min(420px, 100%); display: grid; gap: 8px; }
.tz-acc__item { border-radius: ${p.radius}px; background: #0f1319; border: 1px solid #20262f; overflow: hidden; }
.tz-acc__head { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 15px 16px; border: 0; background: none; color: #e8ebef; font: 500 13.5px/1.3 "Geist", "Segoe UI", "Microsoft YaHei", sans-serif; text-align: left; cursor: pointer; }
.tz-acc__head i { width: 8px; height: 8px; border-right: 1.6px solid #6c7280; border-bottom: 1.6px solid #6c7280; transform: rotate(45deg); transition: transform ${DUR}ms ${EASE}; flex: none; }
.tz-acc__item.is-open .tz-acc__head i { transform: rotate(-135deg); }
.tz-acc__wrap { display: grid; grid-template-rows: 0fr; transition: grid-template-rows ${DUR}ms ${EASE}; }
.tz-acc__item.is-open .tz-acc__wrap { grid-template-rows: 1fr; }
.tz-acc__body { overflow: hidden; padding: 0 16px; font-size: 12.5px; line-height: 1.7; color: #98a0ac; }
.tz-acc__item.is-open .tz-acc__body { padding-bottom: 15px; }`,
    initBody: () => `  root.querySelectorAll(".tz-acc__head").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.parentElement;
      var open = item.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });`,
    demo(root) {
      const heads = root.querySelectorAll(".tz-acc__head");
      let i = 0;
      every(root, 2600, () => {
        heads[i % heads.length].click();
        i++;
      }, 900);
    }
  };

  /* ================================================================
     15 · 交错入场
     ================================================================ */
  const staggerList = {
    id: "stagger-list",
    zh: "交错入场",
    en: "Stagger In",
    scene: "cards",
    tags: ["stagger", "entrance", "入场"],
    desc: "列表项按索引逐个进场，延迟用 calc(var(--i) * 60ms) 计算，新增行只要写 --i，不用改 CSS。",
    duration: 520,
    easeName: "ease-out-expo",
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    params: [
      { key: "stagger", label: "错开间隔", min: 20, max: 140, step: 10, value: 60, unit: "ms" },
      { key: "distance", label: "位移距离", min: 0, max: 40, step: 2, value: 18, unit: "px" }
    ],
    html: () => `<div class="tz-stagger">
  <ul class="tz-stagger__list">
${["导航与菜单", "加载与等待", "卡片与容器", "数据可视化", "表单与输入", "反馈与提示"]
  .map((t, i) => `    <li style="--i:${i}"><b>${String(i + 1).padStart(2, "0")}</b>${t}</li>`)
  .join("\n")}
  </ul>
  <button class="tz-stagger__replay" type="button">重播</button>
</div>`,
    css: (p) => `.tz-stagger { display: grid; gap: 12px; }
.tz-stagger__list { width: min(360px, 100%); margin: 0; padding: 0; list-style: none; display: grid; gap: 6px; }
.tz-stagger__list li {
  display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 10px;
  background: #0f1319; border: 1px solid #20262f; color: #d6dae1; font-size: 13px;
  opacity: 0; transform: translateY(${p.distance}px);
  animation: tz-stagger-in ${DUR}ms ${EASE} forwards;
  animation-delay: calc(var(--i) * ${p.stagger}ms);
}
.tz-stagger__list b { font: 500 10px/1 "Geist Mono", Consolas, monospace; color: #c6f24c; letter-spacing: 0.08em; }
@keyframes tz-stagger-in { to { opacity: 1; transform: translateY(0); } }
.tz-stagger__replay { justify-self: start; padding: 7px 14px; border: 1px solid #2a303a; border-radius: 8px; background: #151a21; color: #b7bdc7; font-size: 12px; cursor: pointer; }
@media (prefers-reduced-motion: reduce) { html:not([data-motion-pref="full"]) .tz-stagger__list li { animation: none; opacity: 1; transform: none; } }`,
    initBody: () => `  var btn = root.querySelector(".tz-stagger__replay");
  if (btn) {
    btn.addEventListener("click", function () {
      root.querySelectorAll(".tz-stagger__list li").forEach(function (el) {
        el.style.animation = "none";
        void el.offsetWidth;
        el.style.animation = "";
      });
    });
  }`,
    demo(root) {
      const btn = root.querySelector(".tz-stagger__replay");
      if (!btn) return;
      every(root, 3000, () => btn.click());
    }
  };

  /* ================================================================
     16 · 涟漪点击
     ================================================================ */
  const rippleButton = {
    id: "ripple-button",
    zh: "涟漪点击",
    en: "Ripple Click",
    scene: "feedback",
    tags: ["ripple", "click", "点击"],
    desc: "点击位置生成一个圆，从 0 放大到覆盖整个按钮并淡出。圆用 transform 放大，动画结束后自动移除节点。",
    duration: 600,
    easeName: "ease-out-quad",
    easing: "cubic-bezier(0.5, 1, 0.89, 1)",
    params: [{ key: "opacity", label: "涟漪强度", min: 0.1, max: 0.6, step: 0.05, value: 0.32 }],
    html: () => `<div class="tz-ripple-wrap">
  <button class="tz-ripple" type="button">点我试试</button>
</div>`,
    css: (p) => `.tz-ripple-wrap { display: grid; place-items: center; padding: 26px; }
.tz-ripple {
  position: relative; overflow: hidden; padding: 15px 32px; border: 0; border-radius: 12px;
  background: #171d25; color: #eef1f4;
  font: 500 14px/1 "Geist", "Segoe UI", "Microsoft YaHei", sans-serif;
  cursor: pointer; isolation: isolate;
}
.tz-ripple::after { content: ""; position: absolute; inset: 0; border-radius: inherit; box-shadow: 0 0 0 0 rgba(198,242,76,0.5); transition: box-shadow ${DUR}ms ${EASE}; }
.tz-ripple:active::after { box-shadow: 0 0 0 6px rgba(198,242,76,0); }
.tz-ripple__wave {
  position: absolute; border-radius: 50%; background: rgba(198,242,76, ${p.opacity});
  transform: translate(-50%, -50%) scale(0);
  animation: tz-ripple ${DUR}ms ${EASE} forwards; pointer-events: none; z-index: -1;
}
@keyframes tz-ripple { to { transform: translate(-50%, -50%) scale(1); opacity: 0; } }`,
    initBody: () => `  root.querySelectorAll(".tz-ripple").forEach(function (btn) {
    btn.addEventListener("pointerdown", function (e) {
      var r = btn.getBoundingClientRect();
      var size = Math.max(r.width, r.height) * 2.2;
      var wave = document.createElement("span");
      wave.className = "tz-ripple__wave";
      wave.style.width = wave.style.height = size + "px";
      wave.style.left = (e.clientX - r.left) + "px";
      wave.style.top = (e.clientY - r.top) + "px";
      btn.appendChild(wave);
      wave.addEventListener("animationend", function () { wave.remove(); });
    });
  });`,
    demo(root) {
      const btn = root.querySelector(".tz-ripple");
      if (!btn) return;
      every(root, 1500, () => {
        const r = btn.getBoundingClientRect();
        const size = Math.max(r.width, r.height) * 2.2;
        const wave = document.createElement("span");
        wave.className = "tz-ripple__wave";
        wave.style.width = wave.style.height = size + "px";
        wave.style.left = r.width * 0.35 + "px";
        wave.style.top = r.height * 0.5 + "px";
        btn.appendChild(wave);
        wave.addEventListener("animationend", () => wave.remove());
      }, 600);
    }
  };

  /* ================================================================
     17 · 轻提示 Toast
     ================================================================ */
  const toastSlide = {
    id: "toast-slide",
    zh: "轻提示",
    en: "Toast Slide",
    scene: "feedback",
    tags: ["toast", "notification", "提示"],
    desc: "提示从底部滑入并淡入，停留 2.4 秒后自动收起。动画与计时器分开，连点只重置计时，不会堆出一摞提示。",
    duration: 260,
    easeName: "ease-out-expo",
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    params: [{ key: "hold", label: "停留时长", min: 1200, max: 5000, step: 200, value: 2400, unit: "ms" }],
    html: () => `<div class="tz-toast-wrap">
  <button class="tz-toast__btn" type="button">显示提示</button>
  <div class="tz-toast" role="status" aria-live="polite">
    <span class="tz-toast__dot" aria-hidden="true"></span>
    <span class="tz-toast__text">已复制到剪贴板</span>
  </div>
</div>`,
    css: () => `.tz-toast-wrap { position: relative; display: grid; place-items: center; padding: 30px 20px 72px; }
.tz-toast__btn { padding: 11px 20px; border: 1px solid #2a303a; border-radius: 10px; background: #171c23; color: #e9ebee; font-size: 13px; cursor: pointer; }
.tz-toast {
  position: absolute; left: 50%; bottom: 12px;
  display: flex; align-items: center; gap: 9px; padding: 11px 16px; border-radius: 999px;
  background: rgba(20,24,30,0.97); border: 1px solid #2a303a; color: #e8ebef; font-size: 12.5px; white-space: nowrap;
  opacity: 0; transform: translate(-50%, 14px);
  transition: opacity ${DUR}ms ${EASE}, transform ${DUR}ms ${EASE};
  pointer-events: none;
}
.tz-toast.is-on { opacity: 1; transform: translate(-50%, 0); }
.tz-toast__dot { width: 7px; height: 7px; border-radius: 50%; background: #c6f24c; }`,
    initBody: (p) => `  var btn = root.querySelector(".tz-toast__btn");
  var toast = root.querySelector(".tz-toast");
  if (!btn || !toast) return;
  var timer = null;
  btn.addEventListener("click", function () {
    toast.classList.add("is-on");
    clearTimeout(timer);
    timer = setTimeout(function () { toast.classList.remove("is-on"); }, ${p.hold});
  });`,
    demo(root) {
      const btn = root.querySelector(".tz-toast__btn");
      if (!btn) return;
      every(root, 3200, () => btn.click(), 900);
    }
  };

  /* ================================================================
     18 · 字符解码
     ================================================================ */
  const textScramble = {
    id: "text-scramble",
    zh: "字符解码",
    en: "Text Scramble",
    scene: "type",
    tags: ["text", "scramble", "解码"],
    desc: "先用随机字符占位，再从左到右逐位锁定成目标文字。每帧只改 textContent，等宽字体避免宽度抖动。",
    duration: 900,
    easeName: "ease-out-quart",
    easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    params: [{ key: "target", label: "目标文字", type: "text", value: "MOTION LIBRARY" }],
    html: () => `<div class="tz-scramble">
  <span class="tz-scramble__text" aria-live="off">MOTION LIBRARY</span>
  <button class="tz-scramble__btn" type="button">重播</button>
</div>`,
    css: () => `.tz-scramble { display: grid; gap: 14px; justify-items: start; }
.tz-scramble__text { font: 600 26px/1.2 "Geist Mono", "Cascadia Mono", Consolas, monospace; letter-spacing: 0.06em; color: #c6f24c; white-space: pre; }
.tz-scramble__btn { padding: 7px 14px; border: 1px solid #2a303a; border-radius: 8px; background: #151a21; color: #b7bdc7; font-size: 12px; cursor: pointer; }`,
    initBody: (p) => `  var el = root.querySelector(".tz-scramble__text");
  if (!el) return;
  var target = ${JSON.stringify(p.target)};
  var glyphs = "01<>/\\\\_[]{}=+*#";
  el.textContent = target;

  function run() {
    var t0 = performance.now();
    (function step(now) {
      var k = Math.max(0, Math.min(1, (now - t0) / ${DUR}));
      var solved = Math.floor(target.length * k);
      var out = "";
      for (var i = 0; i < target.length; i++) {
        if (i < solved || target[i] === " ") out += target[i];
        else out += glyphs[Math.floor(Math.random() * glyphs.length)];
      }
      el.textContent = out;
      if (k < 1) requestAnimationFrame(step);
      else el.textContent = target;
    })(t0);
  }
  run();
  root.querySelector(".tz-scramble__btn").addEventListener("click", run);`,
    demo(root) {
      const btn = root.querySelector(".tz-scramble__btn");
      if (!btn) return;
      every(root, 3000, () => btn.click());
    }
  };

  /* ================================================================
     注册与代码生成
     ================================================================ */
  const EFFECTS = [
    dockZoom, magneticButton, tabIndicator, dynamicIsland, drawerPanel,
    skeletonShimmer, ringProgress, countUp, barGrow, lineDraw,
    tiltCard, spotlightCard, glassPanel, accordion, staggerList,
    rippleButton, toastSlide, textScramble
  ];

  const byId = {};
  EFFECTS.forEach((e) => { byId[e.id] = e; });

  const CATALOG = {
    "nav:Dock Zoom": "dock-zoom",
    "nav:Magnetic Button": "magnetic-button",
    "nav:Dynamic Island": "dynamic-island",
    "nav:Sidebar Reveal": "drawer-panel",
    "nav:Tab Slide": "tab-indicator",
    "loading:Skeleton Shimmer": "skeleton-shimmer",
    "loading:Ring Progress": "ring-progress",
    "loading:Number Ticker": "count-up",
    "cards:Parallax Tilt": "tilt-card",
    "cards:Spotlight Border": "spotlight-card",
    "cards:Glass Panel": "glass-panel",
    "cards:Accordion": "accordion",
    "cards:Stagger In": "stagger-list",
    "data:Number Ticker": "count-up",
    "data:Count Up": "count-up",
    "data:Bar Grow": "bar-grow",
    "data:Line Draw": "line-draw",
    "data:Sparkline": "line-draw",
    "feedback:Toast Slide": "toast-slide",
    "feedback:Notification Stack": "toast-slide",
    "feedback:Ripple Click": "ripple-button",
    "type:Text Scramble": "text-scramble",
    "scroll:Path Draw": "line-draw",
    "icons:Icon Draw": "line-draw"
  };

  function settingsFor(effect, settings) {
    const p = {};
    (effect.params || []).forEach((param) => {
      p[param.key] = settings && settings[param.key] !== undefined ? settings[param.key] : param.value;
    });
    return p;
  }

  function build(effect, settings) {
    const p = settingsFor(effect, settings);
    const dur = settings && settings.duration ? settings.duration : effect.duration;
    const easy = settings && settings.easing ? settings.easing : effect.easing;
    const ctx = Object.assign({}, p, { dur, ease: easy });
    const fix = (s) => render(s, ctx);

    return {
      id: effect.id,
      params: p,
      duration: dur,
      easing: easy,
      html: fix(effect.html(p)),
      css: fix(effect.css(p)),
      jsBody: fix(effect.initBody(p) || "")
    };
  }

  function selectorFor(effect) {
    const match = /class="([a-z0-9-]+)"/i.exec(effect.html(settingsFor(effect)));
    return match ? "." + match[1] : null;
  }

  /* 导出用 JS：包成可直接粘贴的 IIFE，root 指向组件根节点 */
  function jsSource(effect, code) {
    if (!code.jsBody) return "";
    const sel = selectorFor(effect) || "body";
    return "(function () {\n  var root = document.querySelector(\"" + sel + "\");\n  if (!root) return;\n" +
      code.jsBody + "\n})();";
  }

  function indent(text, n) {
    const pad = " ".repeat(n);
    return text.split("\n").map((l) => (l ? pad + l : l)).join("\n");
  }

  function pascal(s) {
    return s.replace(/[^a-zA-Z0-9]+(.)/g, (m, c) => c.toUpperCase()).replace(/^./, (c) => c.toUpperCase()).replace(/\s+/g, "");
  }

  const code = {
    react(effect, c) {
      const js = jsSource(effect, c);
      return `import { useEffect } from "react";

export default function ${pascal(effect.en)}() {
  useEffect(() => {
${indent(js || "// 纯 CSS 组件，无需 JavaScript", 4)}
  }, []);

  return (
${indent(c.html, 4)}
  );
}

/* styles.css */
${c.css}`;
    },
    vue(effect, c) {
      const js = jsSource(effect, c);
      return `<template>
${indent(c.html, 2)}
</template>

<script setup>
import { onMounted } from "vue";

onMounted(() => {
${indent(js || "// 纯 CSS 组件，无需 JavaScript", 2)}
});
</script>

<style scoped>
${c.css}
</style>`;
    },
    wx(effect, c) {
      const svgNote = c.html.indexOf("<svg") >= 0
        ? "<!-- 注意：小程序不支持内联 SVG，图标请换成 image 或 icon 组件 -->\n"
        : "";
      const wxml = c.html
        .replace(/<svg[\s\S]*?<\/svg>/g, "<image src=\"/assets/icon.png\" class=\"icon\"/>")
        .replace(/<button/g, "<view").replace(/<\/button>/g, "</view>")
        .replace(/<nav/g, "<view").replace(/<\/nav>/g, "</view>")
        .replace(/<aside/g, "<view").replace(/<\/aside>/g, "</view>")
        .replace(/<span/g, "<text").replace(/<\/span>/g, "</text>")
        .replace(/<h3/g, "<view").replace(/<\/h3>/g, "</view>")
        .replace(/<p/g, "<view").replace(/<\/p>/g, "</view>");
      return `<!-- ${effect.zh} · 微信小程序 -->
${svgNote}
<!-- WXML -->
${wxml}

<!-- WXSS -->
${c.css}

<!-- JS：小程序没有 DOM 查询，把 root.querySelector 换成
     this.selectComponent('#id')，事件用 bindtap 写在 WXML 上 -->`;
    },
    prompt(effect, c) {
      const params = (effect.params || [])
        .map((x) => `- ${x.label}：${c.params[x.key]}${x.unit || ""}`)
        .join("\n");
      return `你是资深前端动效工程师。请实现一个「${effect.zh}」（${effect.en}）组件。

# 输出格式（只做这一件事）
只输出 1 个 \`\`\`html 代码块。里面是完整单文件（<!doctype html> + 内联 <style> + 内联 <script>）。
不要写解释、不要写目录、不要复述任务、不要问问题。代码块之外最多一行说明。

【效果描述】
${effect.desc}

【参数】（这一组是调好的，按它做）
- 时长：${c.duration}ms
- 缓动：${c.easing}
${params}
- 画布：宽 236px × 高 165px，整体居中
- 根节点 class：fx-root

【设计令牌】
主色 #C6F24C · 深色字 #4F6B00 · 描边 #E7E4DA · 主字 #14160F · 次字 #7B8072 · 表面 #FFFFFF
字体 -apple-system,"Segoe UI","Microsoft YaHei",system-ui,sans-serif

【硬性要求】
1. 只用 HTML / CSS / JavaScript，不引入框架与外部资源
2. 动画只改 transform 与 opacity，目标 60 FPS，不触发布局重排
3. 所有选择器以 .fx-root 开头，不得污染全局
4. 支持 prefers-reduced-motion，键盘可操作，带 aria 语义
5. 输出一个可直接双击运行的单文件 index.html，并附 React / Vue 用法

【输出前自查】
- [ ] 动画确实在跑，不是静态图
- [ ] 实际宽高 ≤ 236 × 165，没有溢出
- [ ] 时长与缓动与上面参数一致

【参考实现】（可改写、优化、扩展，但请保留动效特征）
\`\`\`html
${c.html}
\`\`\`
\`\`\`css
${c.css}
\`\`\`
${c.jsBody ? "```js\n" + jsSource(effect, c) + "\n```" : ""}`;
    },
    full(effect, c) {
      const js = jsSource(effect, c);
      return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${effect.zh} · Zingdex</title>
<style>
body {
  margin: 0; min-height: 100vh; display: grid; place-items: center;
  background: #0a0b0d; color: #f3f2ed;
  font-family: "Geist", "Segoe UI", "Microsoft YaHei", sans-serif;
}
${c.css}
</style>
</head>
<body>
${c.html}
${js ? "<script>\n" + js + "\n<\/script>" : ""}
</body>
</html>`;
    }
  };

  global.Zingdex = {
    EFFECTS,
    byId,
    CATALOG,
    build,
    code,
    jsSource,
    settingsFor,
    every
  };
})(window);
