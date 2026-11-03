"use strict";
/**
 * @zingdex/data —— 动效数据的 Node 读取接口。
 *
 * 数据本体在 apps/web/assets/，这里不复制一份，避免漂移。
 * 用法：
 *   const data = require("@zingdex/data");
 *   const scenes = data.scenes();          // 201 个场景
 *   const entry  = data.entry("fx-s001-07");// { html, css, js }
 *   const fx     = data.effects();          // 500 个基础特效
 *   const stats  = data.stats();            // { scenes, entries, effects }
 *
 * 许可：数据 CC BY 4.0（见仓库根 LICENSE-DATA）。
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

// 数据目录解析顺序：
//   1. ZINGDEX_ASSETS 环境变量
//   2. 仓库内的 apps/web/assets（源码树开发时走这条，永远是最新的）
//   3. 包内自带的 assets/（npm 安装后走这条）
const BUNDLED = path.join(__dirname, "assets");
const IN_REPO = path.resolve(__dirname, "..", "..", "apps", "web", "assets");

function resolveAssets() {
  if (process.env.ZINGDEX_ASSETS) return path.resolve(process.env.ZINGDEX_ASSETS);
  if (fs.existsSync(path.join(IN_REPO, "data.js"))) return IN_REPO;
  if (fs.existsSync(path.join(BUNDLED, "data.js"))) return BUNDLED;
  return null;
}

let cache = null;

function loadFile(file) {
  const code = fs.readFileSync(file, "utf8");
  const sandbox = {
    window: {},
    document: undefined,
    console,
    setTimeout,
    clearTimeout,
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: () => {},
    addEventListener: () => {},
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: file });
  return sandbox.window;
}

function load() {
  if (cache) return cache;

  const assets = resolveAssets();
  if (!assets) {
    throw new Error(
      "找不到动效数据。请在 Zingdex 仓库内使用，或用 ZINGDEX_ASSETS 指向包含 data.js 的目录。"
    );
  }

  // 场景分两处声明：data.js 120 个，engine.js 追加 81 个，合计 201
  const win = loadFile(path.join(assets, "data.js"));
  const engineWin = loadFile(path.join(assets, "engine.js"));
  const scenes = (win.SCENES || []).concat(
    (engineWin.SCENES || []).filter((s) => !(win.SCENES || []).some((x) => x.id === s.id))
  );

  const libPay = {};
  const shardDir = path.join(assets, "lib");
  if (fs.existsSync(shardDir)) {
    for (const f of fs.readdirSync(shardDir).sort()) {
      if (!f.endsWith(".js")) continue;
      const w = loadFile(path.join(shardDir, f));
      Object.assign(libPay, w.LIB_PAY || {});
    }
  }

  const effWin = loadFile(path.join(assets, "effects.js"));
  const glWin = loadFile(path.join(assets, "lib-gl.js"));
  const components = (effWin.Zingdex && effWin.Zingdex.EFFECTS) || effWin.EFFECTS || {};

  // 500 个基础特效：结构在 ENGINE_HTML，样式在 ENGINE_CSS，脚本在 ENGINE_JS
  const eh = loadFile(path.join(assets, "engine_html.js"));
  const ec = loadFile(path.join(assets, "engine_css.js"));
  const ej = loadFile(path.join(assets, "engine_js.js"));
  const base = {};
  for (const id of new Set([
    ...Object.keys(eh.ENGINE_HTML || {}),
    ...Object.keys(ec.ENGINE_CSS || {}),
  ])) {
    base[id] = {
      html: (eh.ENGINE_HTML || {})[id] || "",
      css: (ec.ENGINE_CSS || {})[id] || "",
      js: (ej.ENGINE_JS || {})[id] || null,
    };
  }

  cache = {
    scenes,
    libPay,
    components,
    base,
    canvasEffects: glWin.LIB_GL || [],
  };
  return cache;
}

/** 全部场景：{ id, zh, domain, devices, cats[] } */
function scenes() {
  return load().scenes;
}

/** 全部条目，键为 fx 编号：{ "fx-s001-07": { h, c, j } } */
function entries() {
  return load().libPay;
}

/** 按编号取一条：返回 { html, css, js }，不存在时返回 null */
function entry(id) {
  const hit = load().libPay[id];
  if (!hit) return null;
  return { html: hit.h || "", css: hit.c || "", js: hit.j || "" };
}

/** 500 个基础特效：{ "enter-01": { html, css, js } } */
function baseEffects() {
  return load().base;
}

/** 18 个成品组件（可调参数、可整段复制） */
function components() {
  return load().components;
}

/** 24 条 Canvas / WebGL 特效 */
function canvasEffects() {
  return load().canvasEffects;
}

/** 规模统计 */
function stats() {
  const d = load();
  return {
    scenes: d.scenes.length,
    entries: Object.keys(d.libPay).length,
    baseEffects: Object.keys(d.base).length,
    components: d.components.length,
    canvasEffects: d.canvasEffects.length,
  };
}

module.exports = {
  scenes,
  entries,
  entry,
  baseEffects,
  components,
  canvasEffects,
  stats,
};
