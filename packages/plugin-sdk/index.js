"use strict";
/**
 * @zingdex/plugin-sdk —— 给 Zingdex 加自己的动效，不动核心数据。
 *
 * 用法：
 *   const { definePlugin, createRegistry } = require("@zingdex/plugin-sdk");
 *
 *   const myPlugin = definePlugin({
 *     name: "my-brand-motion",
 *     version: "1.0.0",
 *     effects: [
 *       {
 *         id: "x-brand-rise",
 *         zh: "品牌色上浮",
 *         html: "<div class='x-brand-rise'>…</div>",
 *         css: ".x-brand-rise{animation:x-brand-rise-in .32s ease-out both}…",
 *         tags: ["入场", "品牌"],
 *         device: ["phone", "desktop"]
 *       }
 *     ]
 *   });
 *
 *   const reg = createRegistry({ plugins: [myPlugin] });
 *   reg.get("x-brand-rise", { device: "phone" });
 *
 * 规则（强制的）：
 *   · 第三方编号必须以 `x-` 开头，避免与内置的 20,000 条冲突
 *   · html 与 css 必须同时给，只给一个会直接报错
 *   · 关键帧名必须带自己的前缀，不要叫 `fadeIn` 这类通用名
 */
let core;
try {
  core = require("@zingdex/core");
} catch (e) {
  // 未安装 workspace 依赖时退回同级目录，便于在仓库内直接运行
  core = require("../core");
}

const ID_RE = /^x-[a-z0-9]+(?:-[a-z0-9]+)*$/;

function fail(msg) {
  const e = new Error(msg);
  e.code = "ZINGDEX_PLUGIN_INVALID";
  throw e;
}

function validateEffect(e, where) {
  const at = `${where} 第 ${(e && e.id) || "?"} 条`;
  if (!e || typeof e !== "object") fail(`${at} 不是对象`);
  if (!e.id) fail(`${at} 缺少 id`);
  if (!ID_RE.test(e.id)) {
    fail(`${at}：id 必须以 x- 开头（第三方保留前缀），实际是 "${e.id}"`);
  }
  if (!e.zh) fail(`${at} 缺少中文名 zh`);
  if (!e.html && !e.css) fail(`${at} 必须同时提供 html 与 css`);
  if (e.html && !e.css) fail(`${at} 有 html 但没有 css —— 只给结构不会动`);
  if (e.css && !e.html) fail(`${at} 有 css 但没有 html —— 只给样式没有可动的元素`);
  if (e.device && !Array.isArray(e.device)) fail(`${at} device 必须是数组`);
  if (e.tags && !Array.isArray(e.tags)) fail(`${at} tags 必须是数组`);
  return {
    id: e.id,
    zh: String(e.zh),
    en: e.en ? String(e.en) : "",
    html: String(e.html || ""),
    css: String(e.css || ""),
    js: e.js ? String(e.js) : null,
    tags: e.tags || [],
    device: e.device || null,
    source: where,
  };
}

/** 定义一个插件；只做校验与冻结，不产生副作用 */
function definePlugin(spec) {
  if (!spec || typeof spec !== "object") fail("插件定义必须是对象");
  if (!spec.name) fail("插件缺少 name");
  if (!Array.isArray(spec.effects)) fail("插件缺少 effects 数组");

  const seen = new Set();
  const effects = spec.effects.map((e, i) => {
    const v = validateEffect(e, spec.name);
    if (seen.has(v.id)) fail(`${spec.name}：id 重复 "${v.id}"`);
    seen.add(v.id);
    return v;
  });

  if (!effects.length) fail(`${spec.name}：effects 不能为空`);

  return Object.freeze({
    name: String(spec.name),
    version: String(spec.version || "0.0.0"),
    description: spec.description ? String(spec.description) : "",
    effects: Object.freeze(effects),
  });
}

/** 合并内置库与插件，提供统一查询 */
function createRegistry(opts = {}) {
  const plugins = (opts.plugins || []).map(definePlugin);
  const byId = new Map();

  for (const p of plugins) {
    for (const e of p.effects) byId.set(e.id, e);
  }

  function get(id, o = {}) {
    if (byId.has(id)) {
      const e = byId.get(id);
      const dev = core.resolveDevice(o.device);
      return {
        id: e.id,
        source: e.source,
        device: dev.name,
        scaled: false,
        html: e.html,
        css: e.css,
        js: e.js,
        warn: [],
        note: "插件动效不参与自动设备缩放，请自行按需调整",
      };
    }
    return core.get(id, o);
  }

  function find(keyword, o = {}) {
    const q = String(keyword || "").toLowerCase();
    const hits = [];
    for (const p of plugins) {
      for (const e of p.effects) {
        const hay = `${e.zh} ${e.en} ${e.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) continue;
        if (o.device && e.device && !e.device.includes(o.device)) continue;
        hits.push({ id: e.id, zh: e.zh, ms: null, mc: (e.tags[0] || "插件"), fx: e.id, plugin: p.name });
      }
    }
    return hits;
  }

  function list() {
    const out = {};
    for (const p of plugins) out[p.name] = p.effects.map((e) => e.id);
    return out;
  }

  return { get, find, list, plugins };
}

module.exports = { definePlugin, createRegistry, ID_RE };
