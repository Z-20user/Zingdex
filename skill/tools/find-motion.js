#!/usr/bin/env node
/**
 * find-motion.js —— 找场景与条目，输出可直接取代码的 fx 编号
 *
 * 优先读 index.json（由 build-index.js 生成），没有再回退到解析源码。
 *
 * 用法：
 *   node find-motion.js <库目录> [关键词] [选项]
 * 选项：
 *   --device phone|wide|vehicle|wear|terminal|tv|kiosk|car  只看该设备
 *   --cat 入场|列表|循环|进度|数值|文字|状态                只看该类别
 *   --max 600                                               时长上限（ms）
 *   --limit 6                                               每场景最多几条
 *   --scenes 5                                              最多几个场景
 *   --json                                                  输出 JSON
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

/* 库目录解析顺序：
     1. 环境变量 ZINGDEX_LIB（旧名 TRANSIENT_LIB 仍兼容）
     2. skill/library-path.txt（安装后写入的固定路径）
     3. 仓库内 apps/web（源码树直接可用）
   仓库根目录下无需任何配置即可运行。 */
function defaultLib() {
  const env = process.env.ZINGDEX_LIB || process.env.TRANSIENT_LIB;
  if (env) return env;
  const cfg = path.join(__dirname, "..", "library-path.txt");
  try { if (fs.existsSync(cfg)) return fs.readFileSync(cfg, "utf8").trim(); } catch (e) { }
  const repo = path.resolve(__dirname, "..", "..", "apps", "web");
  if (fs.existsSync(path.join(repo, "assets"))) return repo;
  return "";
}

function parse(argv) {
  const first = argv[2];
  let lib = "", rest = argv.slice(2);
  if (first && !first.startsWith("--") && fs.existsSync(first)) { lib = first; rest = argv.slice(3); }
  else lib = defaultLib();
  if (!lib) {
    console.log("用法: node find-motion.js [<库目录>] [关键词] [--device x] [--cat x] [--max ms]");
    console.log("（省略 <库目录> 时读 skill/library-path.txt 或环境变量 TRANSIENT_LIB）");
    process.exit(1);
  }
  const o = { keyword: "", device: "", cat: "", max: 0, limit: 6, scenes: 5, json: false };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === "--device") o.device = rest[++i] || "";
    else if (a === "--cat") o.cat = rest[++i] || "";
    else if (a === "--max") o.max = Number(rest[++i]) || 0;
    else if (a === "--limit") o.limit = Number(rest[++i]) || 6;
    else if (a === "--scenes") o.scenes = Number(rest[++i]) || 5;
    else if (a === "--json") o.json = true;
    else if (!a.startsWith("--")) o.keyword = a;
  }
  return { lib, o };
}

function loadIndex(lib) {
  const cands = [path.join(lib, "index.json"), path.join(__dirname, "..", "index.json")];
  for (const p of cands) {
    if (fs.existsSync(p)) {
      try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch (e) { }
    }
  }
  return null;
}

/* 11 类设备名 → 库里实际的 5 个表单分组（sc.f） */
const DEVICE_ALIAS = {
  phone: "phone", mobile: "phone", 手机: "phone",
  tablet: "wide", laptop: "wide", desktop: "wide", "desktop-xl": "wide",
  tv: "wide", kiosk: "wide", 平板: "wide", 桌面: "wide", 电视: "wide", 终端机: "wide",
  car: "vehicle", vehicle: "vehicle", 车机: "vehicle",
  watch: "wear", wear: "wear", 手表: "wear",
  terminal: "terminal", 终端: "terminal",
};

/* 常用叫法 → 库里的 7 个条目类别（mc） */
const CAT_ALIAS = { 进度: "加载", 转场: "退场", 出现: "入场", 消失: "退场", 反馈: "状态" };

function loadFromSource(lib) {
  const sb = { window: {}, document: {}, console };
  vm.createContext(sb);
  const A = path.join(lib, "assets");
  for (const f of ["data.js", "engine.js"]) {
    const p = path.join(A, f);
    if (fs.existsSync(p)) { try { vm.runInContext(fs.readFileSync(p, "utf8"), sb, { filename: f }); } catch (e) { } }
  }
  return { s: (sb.window.SCENES || []).map((sc) => ({ id: sc.id, zh: sc.zh, en: sc.en || "", desc: sc.desc || "", domain: sc.domain || sc.g || "", f: sc.f || "", devices: sc.devices || [], cats: sc.cats || [] })) };
}

function pick(data, o) {
  const kw = (o.keyword || "").toLowerCase();
  const dev = DEVICE_ALIAS[o.device] || o.device;
  const cat = CAT_ALIAS[o.cat] || o.cat;
  const res = [];
  for (const sc of data.s) {
    const hay = [sc.zh, sc.en, sc.desc, sc.domain, sc.id].join(" ").toLowerCase();
    const catHit = (sc.cats || []).some((c) => (c.zh || "").toLowerCase().includes(kw));
    if (kw && !hay.includes(kw) && !catHit) continue;
    // devices[] 只有 81/201 个场景有；其余用 sc.f（5 个表单分组）兜底，否则 --device 会漏掉 s/d 场景。
    const devs = Array.isArray(sc.devices) && sc.devices.length ? sc.devices : (sc.f ? [sc.f] : null);
    if (dev && devs && !devs.includes(dev)) continue;
    let cats = (sc.cats || []).slice();
    if (cat) cats = cats.filter((c) => (c.mc || "").includes(cat));
    if (o.max) cats = cats.filter((c) => (c.ms || 0) <= o.max);
    if (!cats.length) continue;
    cats.sort((a, b) => (b.fq || 0) - (a.fq || 0));
    res.push({ id: sc.id, zh: sc.zh, desc: sc.desc, domain: sc.domain, f: sc.f, devices: devs || [], cats: cats.slice(0, o.limit), total: (sc.cats || []).length });
  }
  res.sort((a, b) => ((b.cats[0] && b.cats[0].fq) || 0) - ((a.cats[0] && a.cats[0].fq) || 0));
  return res.slice(0, o.scenes);
}

function main() {
  const { lib, o } = parse(process.argv);
  const idx = loadIndex(lib);
  const data = idx || loadFromSource(lib);
  if (!data.s || !data.s.length) { console.error("没读到场景数据：确认 <库目录>/assets 存在，或先跑 build-index.js"); process.exit(2); }
  const res = pick(data, o);
  if (o.json) { console.log(JSON.stringify(res, null, 1)); return; }
  if (!res.length) {
    console.log("没有匹配。换个更短的词，或去掉 --device / --cat / --max；也可用 --list 看全部基础特效。");
    return;
  }
  console.log("数据源 " + (idx ? "index.json" : "源码") + " · 场景 " + data.s.length + " 个 · 命中 " + res.length + "\n");
  for (const s of res) {
    console.log("● " + s.zh + "  [" + s.id + "]  " + (s.domain || "") + "  " + (s.devices || []).join("/"));
    if (s.desc) console.log("  " + s.desc);
    for (const c of s.cats) console.log("   · " + (c.mc || "") + "  " + c.zh + "  " + c.ms + "ms  " + c.fx + (c.e ? "  → " + c.e : ""));
    console.log("");
  }
  console.log("取代码：node extract-motion.js <库目录> " + (res[0].cats[0] ? res[0].cats[0].fx : "fx-…"));
}

main();
