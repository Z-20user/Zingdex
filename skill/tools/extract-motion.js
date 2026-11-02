#!/usr/bin/env node
/**
 * extract-motion.js —— 按特效 id 取出三件套代码（HTML / CSS / JS）
 *
 * 用法：
 *   node extract-motion.js <库目录> <特效id>           直接打印代码
 *   node extract-motion.js <库目录> <特效id> --json    输出 JSON
 *   node extract-motion.js <库目录> --list             列出全部特效 id（按族）
 *   node extract-motion.js <库目录> --list enter       只列某个族
 *
 * 特效 id 形如：enter-01 / exit-07 / state-12 / light-03 / particle-05
 * 族：enter exit state accent space ambient physics data type light morph swarm particle beam text chart noise svg
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function load(lib) {
  const sb = { window: {}, document: {}, console };
  vm.createContext(sb);
  for (const f of ["engine_html.js", "engine_css.js", "engine_js.js"]) {
    const p = path.join(lib, "assets", f);
    if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, "utf8"), sb, { filename: f });
  }
  return {
    html: sb.window.ENGINE_HTML || {},
    css: sb.window.ENGINE_CSS || {},
    js: sb.window.ENGINE_JS || {},
  };
}

function main() {
  const argv = process.argv.slice(2);
  const lib = argv[0];
  if (!lib) {
    console.log("用法: node extract-motion.js <库目录> <特效id> [--json] | --list [族]");
    process.exit(1);
  }
  const { html, css, js } = load(lib);

  if (argv.includes("--list")) {
    const famArg = argv[argv.indexOf("--list") + 1];
    const fam = famArg && !famArg.startsWith("--") ? famArg : "";
    const ids = Object.keys(html).filter((k) => !fam || k.startsWith(fam + "-")).sort();
    const groups = {};
    ids.forEach((k) => {
      const f = k.split("-")[0];
      (groups[f] = groups[f] || []).push(k);
    });
    for (const f of Object.keys(groups)) {
      console.log(f + " (" + groups[f].length + "): " + groups[f].join(" "));
    }
    console.log("\n合计 " + ids.length + " 条");
    return;
  }

  const id = argv[1];
  if (!id) {
    console.log("缺少特效 id，例如 enter-01");
    process.exit(1);
  }
  const H = html[id];
  const C = css[id];
  const J = js[id];
  if (!H && !C) {
    console.log("找不到 " + id + "。用 --list 看看可用的 id。");
    process.exit(2);
  }
  if (argv.includes("--json")) {
    console.log(JSON.stringify({ id, html: H || "", css: C || "", js: J ? J.toString() : "" }, null, 1));
    return;
  }
  console.log("/* ===== " + id + " · HTML ===== */");
  console.log(H || "（无）");
  console.log("\n/* ===== " + id + " · CSS ===== */");
  console.log(C || "（无）");
  console.log("\n/* ===== " + id + " · JS ===== */");
  console.log(J ? J.toString() : "（纯 CSS，无需脚本）");
  console.log("\n/* 提示：CSS 里用 var(--fx-dur)/var(--fx-ease) 控制时长与缓动；" +
    "把这两个变量设在你自己的容器上即可改节奏。 */");
}

main();
