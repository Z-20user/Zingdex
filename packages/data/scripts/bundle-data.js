#!/usr/bin/env node
"use strict";
/**
 * 打包前把数据复制进 packages/data/assets/，让这个 npm 包自包含。
 *
 * 仓库里不保留这份副本（.gitignore 已排除），只在 `npm pack` / `npm publish`
 * 前由 prepack 生成，因此源码树里数据仍然只有一份。
 */
const fs = require("fs");
const path = require("path");

const PKG = path.resolve(__dirname, "..");
const SRC = path.resolve(PKG, "..", "..", "apps", "web", "assets");
const DST = path.join(PKG, "assets");

if (!fs.existsSync(SRC)) {
  console.error(`找不到源数据目录：${SRC}`);
  console.error("这个脚本只能在 Zingdex 仓库内运行。");
  process.exit(1);
}

const FILES = [
  "data.js",
  "engine.js",
  "engine_html.js",
  "engine_css.js",
  "engine_js.js",
  "effects.js",
  "lib-gl.js",
];

fs.rmSync(DST, { recursive: true, force: true });
fs.mkdirSync(path.join(DST, "lib"), { recursive: true });

let n = 0;
let bytes = 0;

for (const f of FILES) {
  const s = path.join(SRC, f);
  if (!fs.existsSync(s)) {
    console.warn(`  跳过（不存在）：${f}`);
    continue;
  }
  fs.copyFileSync(s, path.join(DST, f));
  bytes += fs.statSync(s).size;
  n++;
}

const libDir = path.join(SRC, "lib");
for (const f of fs.readdirSync(libDir)) {
  if (!f.endsWith(".js")) continue;
  fs.copyFileSync(path.join(libDir, f), path.join(DST, "lib", f));
  bytes += fs.statSync(path.join(libDir, f)).size;
  n++;
}

console.log(
  `已打包数据：${n} 个文件 · ${(bytes / 1024 / 1024).toFixed(1)} MB → packages/data/assets/`
);
