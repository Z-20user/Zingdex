#!/usr/bin/env node
/**
 * extract-motion.js —— 按编号取动效代码
 *
 * 支持两种编号：
 *   1) 条目编号  fx-s001-07   ← 场景数据里的 fx，从 LIB_PAY 取（推荐）
 *   2) 特效编号  enter-01     ← 500 个基础特效，从 ENGINE_* 取
 *
 * 用法：
 *   node extract-motion.js <库目录> fx-s001-07
 *   node extract-motion.js <库目录> enter-01
 *   node extract-motion.js <库目录> fx-s001-07 --json
 *   node extract-motion.js <库目录> --list            列出基础特效（按族）
 *   node extract-motion.js <库目录> --list light
 *   node extract-motion.js <库目录> --scenes          列出场景与条目编号
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function load(lib) {
  const sb = { window: {}, document: {}, console };
  vm.createContext(sb);
  const A = path.join(lib, "assets");
  for (const f of ["data.js", "engine.js", "engine_html.js", "engine_css.js", "engine_js.js"]) {
    const p = path.join(A, f);
    if (fs.existsSync(p)) {
      try { vm.runInContext(fs.readFileSync(p, "utf8"), sb, { filename: f }); } catch (e) { /* 单文件失败不致命 */ }
    }
  }
  const libDir = path.join(A, "lib");
  if (fs.existsSync(libDir)) {
    for (const f of fs.readdirSync(libDir).filter((x) => x.endsWith(".js"))) {
      try { vm.runInContext(fs.readFileSync(path.join(libDir, f), "utf8"), sb, { filename: f }); } catch (e) { }
    }
  }
  return {
    pay: sb.window.LIB_PAY || {},
    html: sb.window.ENGINE_HTML || {},
    css: sb.window.ENGINE_CSS || {},
    js: sb.window.ENGINE_JS || {},
    scenes: sb.window.SCENES || [],
  };
}

/* 默认库目录：环境变量 TRANSIENT_LIB > skill/library-path.txt（安装后写死） */
function defaultLib() {
  if (process.env.TRANSIENT_LIB) return process.env.TRANSIENT_LIB;
  const cfg = path.join(__dirname, "..", "library-path.txt");
  try { if (fs.existsSync(cfg)) return fs.readFileSync(cfg, "utf8").trim(); } catch (e) { }
  return "";
}

function main() {
  const argv = process.argv.slice(2);
  let lib = "";
  let args = argv;
  if (argv[0] && !argv[0].startsWith("--") && fs.existsSync(argv[0])) {
    lib = argv[0]; args = argv.slice(1);
  } else {
    lib = defaultLib();
  }
  if (!lib) {
    console.log("用法: node extract-motion.js [<库目录>] <fx-id|effect-id> [--json] | --list [族] | --scenes");
    console.log("（省略 <库目录> 时读 skill/library-path.txt 或环境变量 TRANSIENT_LIB）");
    process.exit(1);
  }
  const L = load(lib);

  if (args.includes("--list")) {
    const fam = args[args.indexOf("--list") + 1];
    const ids = Object.keys(L.html).filter((k) => !fam || fam.startsWith("--") || k.startsWith(fam + "-")).sort();
    const g = {};
    ids.forEach((k) => (g[k.split("-")[0]] = g[k.split("-")[0]] || []).push(k));
    for (const f of Object.keys(g)) console.log(f + " (" + g[f].length + "): " + g[f].join(" "));
    console.log("\n合计 " + ids.length + " 条基础特效");
    return;
  }

  if (args.includes("--scenes")) {
    L.scenes.forEach((s) => {
      console.log("[" + s.id + "] " + s.zh + "  " + (s.devices || []).join("/") + "  共 " + (s.cats || []).length + " 条");
      (s.cats || []).slice(0, 4).forEach((c) => console.log("    · " + c.mc + " " + c.zh + " " + c.ms + "ms  " + c.fx));
    });
    console.log("\n场景 " + L.scenes.length + " 个，条目 " + Object.keys(L.pay).length + " 条");
    return;
  }

  const id = args[0];
  if (!id) { console.log("缺少编号，例如 fx-s001-07 或 enter-01"); process.exit(1); }

  let out = null;
  if (id.startsWith("fx-")) {
    const e = L.pay[id];
    if (!e) { console.log("LIB_PAY 里没有 " + id + "。用 --scenes 看实际编号。"); process.exit(2); }
    // n/r/t/v/w/z 类条目只存 e（基底特效编号）+ 覆盖式 CSS，
    // 结构和基础样式在 ENGINE_HTML / ENGINE_CSS 里，必须按 library.js hydrate() 的规则合并。
    const eid = e.e || "";
    const baseHtml = eid ? (L.html[eid] || "") : "";
    const baseCss = eid ? (L.css[eid] || "") : "";
    const baseJs = eid && L.js[eid] ? L.js[eid].toString() : "";
    out = {
      id,
      source: eid ? "LIB_PAY + ENGINE(" + eid + ")" : "LIB_PAY（特写条目）",
      html: e.h || baseHtml,
      css: (baseCss + (e.c || "")).trim(),
      js: baseJs,
      note: e.nt || "",
    };
  } else {
    const H = L.html[id], C = L.css[id], J = L.js[id];
    if (!H && !C) { console.log("找不到 " + id + "。用 --list 看基础特效编号。"); process.exit(2); }
    out = { id, source: "ENGINE", html: H || "", css: C || "", js: J ? J.toString() : "", note: "" };
  }

  if (args.includes("--json")) { console.log(JSON.stringify(out, null, 1)); return; }

  console.log("/* ===== " + out.id + " · HTML（来源 " + out.source + "） ===== */");
  console.log(out.html || "（无）");
  console.log("\n/* ===== " + out.id + " · CSS ===== */");
  console.log(out.css || "（无）");
  console.log("\n/* ===== " + out.id + " · JS ===== */");
  console.log(out.js ? out.js : "（纯 CSS，无需脚本）");
  if (out.note) console.log("\n/* 备注：" + out.note + " */");
  console.log("\n/* 改节奏：在容器上设 --fx-dur / --fx-ease，不要改关键帧 */");
}

main();
