#!/usr/bin/env node
/**
 * find-motion.js —— 在 TRANSIENT 动效库里检索场景与条目
 *
 * 用法：
 *   node find-motion.js <库目录> [关键词] [选项]
 *
 * 选项：
 *   --device phone|wide|vehicle|wear|terminal   只看该设备
 *   --cat 入场|列表|循环|进度|数值|文字|状态      只看该动效类别
 *   --max 600                                    时长上限（毫秒）
 *   --limit 5                                    每个场景最多列几条（默认 6）
 *   --scenes 3                                   最多列几个场景（默认 5）
 *   --json                                       输出 JSON
 *
 * 例：
 *   node find-motion.js ../../03_源代码/site "商品列表"
 *   node find-motion.js ../../03_源代码/site "进度" --cat 进度 --max 1500
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

function parseArgs(argv) {
  const lib = argv[2];
  if (!lib) usage();
  const rest = argv.slice(3);
  const opt = { keyword: "", device: "", cat: "", max: 0, limit: 6, scenes: 5, json: false };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === "--device") opt.device = rest[++i] || "";
    else if (a === "--cat") opt.cat = rest[++i] || "";
    else if (a === "--max") opt.max = Number(rest[++i]) || 0;
    else if (a === "--limit") opt.limit = Number(rest[++i]) || 6;
    else if (a === "--scenes") opt.scenes = Number(rest[++i]) || 5;
    else if (a === "--json") opt.json = true;
    else if (!a.startsWith("--")) opt.keyword = a;
  }
  return { lib, opt };
}

function usage() {
  console.log("用法: node find-motion.js <库目录> [关键词] [--device x] [--cat x] [--max ms] [--limit n] [--json]");
  process.exit(1);
}

function loadScenes(lib) {
  const sandbox = { window: {}, document: {}, console: console };
  sandbox.window.document = sandbox.document;
  sandbox.window.console = console;
  vm.createContext(sandbox);
  for (const f of ["data.js", "engine.js"]) {
    const p = path.join(lib, "assets", f);
    if (!fs.existsSync(p)) continue;
    try {
      vm.runInContext(fs.readFileSync(p, "utf8"), sandbox, { filename: p });
    } catch (e) {
      console.error("读取失败 " + f + "：" + e.message);
    }
  }
  return sandbox.window.SCENES || [];
}

function pick(scenes, opt) {
  const kw = (opt.keyword || "").toLowerCase();
  const hits = [];
  for (const sc of scenes) {
    const hay = [sc.zh, sc.en, sc.desc, sc.domain, sc.g, sc.ctx].join(" ").toLowerCase();
    const catHit = (sc.cats || []).some((c) => (c.zh || "").toLowerCase().includes(kw));
    if (kw && !hay.includes(kw) && !catHit) continue;
    if (opt.device && !(sc.devices || []).includes(opt.device)) continue;

    let cats = (sc.cats || []).slice();
    if (opt.cat) cats = cats.filter((c) => (c.mc || "").includes(opt.cat));
    if (opt.max) cats = cats.filter((c) => (c.ms || 0) <= opt.max);
    if (!cats.length) continue;

    cats.sort((a, b) => (b.fq || 0) - (a.fq || 0));
    hits.push({
      id: sc.id, zh: sc.zh, en: sc.en, desc: sc.desc,
      domain: sc.domain, devices: sc.devices,
      cats: cats.slice(0, opt.limit),
      total: (sc.cats || []).length,
    });
  }
  hits.sort((a, b) => (b.cats[0] && b.cats[0].fq ? b.cats[0].fq : 0) - (a.cats[0] && a.cats[0].fq ? a.cats[0].fq : 0));
  return hits.slice(0, opt.scenes);
}

function main() {
  const { lib, opt } = parseArgs(process.argv);
  const scenes = loadScenes(lib);
  if (!scenes.length) {
    console.error("没读到场景数据，确认 <库目录> 下有 assets/data.js 或 assets/engine.js");
    process.exit(2);
  }
  const res = pick(scenes, opt);
  if (opt.json) {
    console.log(JSON.stringify(res, null, 1));
    return;
  }
  if (!res.length) {
    console.log("没有匹配结果。换个关键词，或去掉 --device / --cat 限制。");
    console.log("场景总数：" + scenes.length);
    return;
  }
  console.log("场景总数 " + scenes.length + "，命中 " + res.length + " 个：\n");
  for (const s of res) {
    console.log("● " + s.zh + "  [" + s.id + "]  " + (s.domain || "") + "  " + (s.devices || []).join("/"));
    if (s.desc) console.log("  " + s.desc);
    for (const c of s.cats) {
      console.log("   · " + (c.mc || "") + "  " + c.zh + "  " + c.ms + "ms  " + (c.ease || "") + "  " + c.fx);
    }
    console.log("");
  }
}

main();
