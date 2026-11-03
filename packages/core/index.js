"use strict";
/**
 * zingdex-core —— 把一条动效编译成可直接使用的代码。
 *
 * 用法：
 *   const core = require("zingdex-core");
 *   const out = core.get("fx-s001-07", { device: "watch" });
 *   // -> { html, css, js, note, device, scaled: true }
 *
 *   core.standalone("fx-s001-07", { device: "phone" });
 *   // -> 一整页可独立打开的 HTML 字符串
 *
 * 许可：代码 Apache-2.0，数据 CC BY 4.0。
 */
let data;
try {
  data = require("zingdex-data");
} catch (e) {
  // 未安装 workspace 依赖时退回同级目录，便于在仓库内直接运行
  data = require("../data");
}

/** 设备系数：时长倍率 / 距离倍率 */
const DEVICES = {
  phone: { dur: 0.82, dist: 0.72 },
  phone_lg: { dur: 0.88, dist: 0.8 },
  tablet: { dur: 1.0, dist: 1.0 },
  desktop: { dur: 1.0, dist: 1.0 },
  desktop_xl: { dur: 1.08, dist: 1.18 },
  watch: { dur: 0.62, dist: 0.55 },
  car: { dur: 0.75, dist: 0.7 },
  kiosk: { dur: 1.0, dist: 1.1 },
};

/** 该设备上禁止的做法 */
const BANNED = {
  watch: ["canvas", "blur", "loop"],
  car: ["loop", "flicker", "parallax"],
};

function resolveDevice(name) {
  const key = String(name || "tablet").toLowerCase().replace(/-/g, "_");
  if (!DEVICES[key]) {
    throw new Error(
      `未知设备 ${name}。可用：${Object.keys(DEVICES).join(", ")}`
    );
  }
  return { name: key, ...DEVICES[key] };
}

/** 把 CSS 里的时长与位移按设备系数缩放。只改数值，不改关键帧名。 */
function scaleCss(css, k) {
  if (!css || (!k.dur || !k.dist)) return css;
  return css
    .replace(/(-?\d*\.?\d+)ms\b/g, (m, n) => {
      const v = parseFloat(n) * k.dur;
      return `${Math.round(v * 10) / 10}ms`;
    })
    .replace(/(-?\d*\.?\d+)s\b(?!\w)/g, (m, n) => {
      const v = parseFloat(n) * k.dur;
      return `${Math.round(v * 100) / 100}s`;
    })
    .replace(/translate([XY])\(\s*(-?\d*\.?\d+)px/g, (m, axis, n) => {
      const v = parseFloat(n) * k.dist;
      return `translate${axis}(${Math.round(v * 100) / 100}px`;
    });
}

/** 取一条动效，按设备缩放后返回 */
function get(id, opts = {}) {
  const dev = resolveDevice(opts.device);

  let hit = data.entry(id);
  let os = "LIB_PAY";

  if (!hit) {
    const b = data.baseEffects()[id];
    if (b) {
      hit = { html: b.html, css: b.css, js: b.js };
      os = "ENGINE";
    }
  }
  if (!hit) {
    throw new Error(`找不到动效 ${id}。用 extract-motion.js --list 查可用编号。`);
  }

  const banned = BANNED[dev.name] || [];
  const css = String(hit.css || "");
  const warn = [];
  if (banned.includes("canvas") && /<canvas/i.test(hit.html || "")) {
    warn.push(`${dev.name} 上禁用 canvas，建议换 CSS 实现`);
  }
  if (banned.includes("blur") && /blur\(/i.test(css)) {
    warn.push(`${dev.name} 上禁用 blur，性能开销过大`);
  }
  if (banned.includes("loop") && /infinite/i.test(css)) {
    warn.push(`${dev.name} 上禁用无限循环，请改为播放一次`);
  }

  return {
    id,
    source: os,
    device: dev.name,
    scaled: dev.dur !== 1 || dev.dist !== 1,
    html: hit.html || "",
    css: scaleCss(css, dev),
    js: hit.js || null,
    warn,
  };
}

/** 包成一页可独立打开的 HTML，用于本地预览或截图 */
function standalone(id, opts = {}) {
  const r = get(id, opts);
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${id} · Zingdex</title>
<style>
  body{margin:0;display:grid;place-items:center;min-height:100vh;background:#0A0D11}
  .zingdex-stage{width:min(92vw,420px);height:min(70vh,340px);display:grid;place-items:center}
  ${r.css}
</style>
</head>
<body>
<div class="zingdex-stage">
${r.html}
</div>
${r.js ? `<script>\n${r.js}\n<\/script>` : ""}
</body>
</html>`;
}

module.exports = { get, standalone, resolveDevice, DEVICES, BANNED };
