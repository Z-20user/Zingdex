#!/usr/bin/env node
"use strict";
/**
 * 生成 PWA 预缓存清单 apps/web/assets/precache.json。
 * Service Worker 在 install 阶段读这份清单，把整个站点塞进缓存，之后完全离线可用。
 *
 * 用法：node tools/gen-precache.js
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const WEB = path.resolve(__dirname, "..", "apps", "web");
const OUT = path.join(WEB, "assets", "precache.json");

const SKIP_DIRS = new Set(["node_modules", ".git"]);
const SKIP_FILES = new Set(["sw.js", "assets/precache.json"]);

const files = [];

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      walk(full);
      continue;
    }
    const rel = path.relative(WEB, full).replace(/\\/g, "/");
    if (SKIP_FILES.has(rel)) continue;
    files.push(rel);
  }
}

walk(WEB);
files.sort();

// 版本号取所有文件内容的合并哈希：内容一变，SW 就换缓存
// 换行统一按 LF 计算，保证 Windows / Linux / macOS 上得出同一个版本号
const h = crypto.createHash("sha256");
for (const rel of files) {
  h.update(rel);
  const buf = fs.readFileSync(path.join(WEB, rel));
  const isText = !buf.includes(0) && !/\.(png|jpe?g|gif|webp|ico|woff2?|ttf|pdf)$/i.test(rel);
  h.update(isText ? Buffer.from(buf.toString("utf8").replace(/\r\n/g, "\n"), "utf8") : buf);
}
const version = h.digest("hex").slice(0, 12);

const payload = { version, count: files.length, files };

const checkOnly = process.argv.includes("--check");

if (checkOnly) {
  const cur = JSON.parse(fs.readFileSync(OUT, "utf8"));
  if (cur.version !== version) {
    console.error(
      `precache.json 已过期（记录 ${cur.version}，实际 ${version}）。` +
        "请运行：node tools/gen-precache.js"
    );
    process.exit(1);
  }
  console.log(`precache.json 与当前文件一致（${files.length} 个文件 · 版本 ${version}）`);
  process.exit(0);
}

fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n", "utf8");

const bytes = files.reduce((n, rel) => n + fs.statSync(path.join(WEB, rel)).size, 0);
console.log(
  `precache.json 已生成：${files.length} 个文件 · ${(bytes / 1024 / 1024).toFixed(1)} MB · 版本 ${version}`
);
