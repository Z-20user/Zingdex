#!/usr/bin/env node
/**
 * build-index.js —— 把散在 201 个 lib 文件里的数据压成一个 index.json
 *
 * 用法：
 *   node build-index.js <库目录> [--out index.json]
 *
 * 生成后 find-motion.js 会优先读它，检索从「加载 2 MB JS」变成「读 1 MB JSON」。
 * 数据变了要重新生成。
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

let lib = process.argv[2];
if (!lib || lib.startsWith("--")) {
  const cfg = path.join(__dirname, "..", "library-path.txt");
  if (process.env.TRANSIENT_LIB) lib = process.env.TRANSIENT_LIB;
  else if (fs.existsSync(cfg)) lib = fs.readFileSync(cfg, "utf8").trim();
}
if (!lib) { console.log("用法: node build-index.js [<库目录>] [--out index.json]"); process.exit(1); }
const outIdx = process.argv.indexOf("--out");
const out = outIdx > 0 ? process.argv[outIdx + 1] : path.join(__dirname, "..", "index.json");

const sb = { window: {}, document: {}, console };
vm.createContext(sb);
const A = path.join(lib, "assets");
for (const f of ["data.js", "engine.js"]) {
  const p = path.join(A, f);
  if (fs.existsSync(p)) { try { vm.runInContext(fs.readFileSync(p, "utf8"), sb, { filename: f }); } catch (e) { } }
}
const libDir = path.join(A, "lib");
let fileCount = 0;
if (fs.existsSync(libDir)) {
  for (const f of fs.readdirSync(libDir).filter((x) => x.endsWith(".js"))) {
    try { vm.runInContext(fs.readFileSync(path.join(libDir, f), "utf8"), sb, { filename: f }); fileCount++; } catch (e) { }
  }
}
const scenes = sb.window.SCENES || [];
const pay = sb.window.LIB_PAY || {};

const s = scenes.map((sc) => ({
  id: sc.id, zh: sc.zh, en: sc.en || "", desc: sc.desc || "",
  domain: sc.domain || sc.g || "", f: sc.f || "", devices: sc.devices || [],
  cats: (sc.cats || []).map((c) => ({
    zh: c.zh, ms: c.ms, mc: c.mc, fx: c.fx, fq: c.fq || 0, ease: c.ease || "",
    e: (pay[c.fx] && pay[c.fx].e) || "",
  })),
}));

const index = {
  built: new Date().toISOString().slice(0, 10),
  scenes: s.length,
  entries: Object.keys(pay).length,
  libFiles: fileCount,
  s,
};
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(index), "utf8");
console.log("索引已生成：" + out);
console.log("场景 " + index.scenes + " · 条目 " + index.entries + " · 源文件 " + fileCount + " · " + (fs.statSync(out).size / 1048576).toFixed(1) + " MB");
