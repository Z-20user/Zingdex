#!/usr/bin/env node
"use strict";
/**
 * zingdex —— 动效库命令行。
 *
 *   zingdex find "商品列表" --device phone
 *   zingdex get fx-s001-07 --device watch --json
 *   zingdex list [family]
 *   zingdex stats
 *
 * 许可：代码 Apache-2.0，数据 CC BY 4.0。
 */
let data, core;
try {
  data = require("zingdex-data");
  core = require("zingdex-core");
} catch (e) {
  // 未安装 workspace 依赖时退回同级目录，便于在仓库内直接运行
  data = require("../../data");
  core = require("../../core");
}

const argv = process.argv.slice(2);
const cmd = argv[0];

function flag(name, def) {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
}
function has(name) {
  return argv.includes(name);
}

function out(s) {
  process.stdout.write(s + "\n");
}

function cmdFind(keyword) {
  if (!keyword) {
    out('用法：zingdex find "<关键词>" [--device phone] [--cat 入场] [--max 600]');
    process.exit(2);
  }
  const device = flag("--device");
  const cat = flag("--cat");
  const max = flag("--max") ? Number(flag("--max")) : null;

  const hits = [];
  for (const s of data.scenes()) {
    const text = `${s.zh} ${s.en || ""} ${s.domain || ""} ${s.desc || ""}`;
    if (!text.includes(keyword) && !text.toLowerCase().includes(keyword.toLowerCase())) continue;
    if (device && s.devices && !s.devices.includes(device)) continue;

    const cats = (s.cats || []).filter((c) => {
      if (cat && c.mc !== cat) return false;
      if (max !== null && typeof c.ms === "number" && c.ms > max) return false;
      return true;
    });
    if (!cats.length) continue;
    hits.push({ scene: s, cats });
    if (hits.length >= 8) break;
  }

  if (has("--json")) {
    out(JSON.stringify(hits.map((h) => ({
      id: h.scene.id,
      zh: h.scene.zh,
      en: h.scene.en,
      domain: h.scene.domain,
      cats: h.cats.map((c) => ({ zh: c.zh, ms: c.ms, mc: c.mc, fx: c.fx })),
    })), null, 2));
    return;
  }

  if (!hits.length) {
    out(`没有命中「${keyword}」。换个词，或先运行 zingdex list 看基础特效编号。`);
    process.exit(1);
  }
  out(`命中 ${hits.length} 个场景\n`);
  for (const { scene, cats } of hits) {
    out(`● ${scene.zh}  [${scene.id}]  ${scene.domain || ""}${device ? "  " + device : ""}`);
    if (scene.desc) out(`  ${scene.desc}`);
    for (const c of cats.slice(0, 6)) {
      out(`   · ${c.mc}  ${c.zh}  ${c.ms}ms  ${c.fx}`);
    }
    out("");
  }
}

function cmdGet(id) {
  if (!id) {
    out("用法：zingdex get <fx-id|effect-id> [--device phone] [--json]");
    process.exit(2);
  }
  const device = flag("--device", "tablet");
  let r;
  try {
    r = core.get(id, { device });
  } catch (e) {
    out(e.message);
    process.exit(2);
  }
  if (has("--json")) {
    out(JSON.stringify(r, null, 2));
    return;
  }
  out(`/* ===== ${r.id} · ${r.device} · 来源 ${r.source} ===== */`);
  for (const w of r.warn) out(`/* 注意：${w} */`);
  out("\n/* --- HTML --- */\n" + r.html);
  out("\n/* --- CSS --- */\n" + r.css);
  if (r.js) out("\n/* --- JS --- */\n" + r.js);
}

function cmdList(family) {
  const keys = Object.keys(data.baseEffects()).sort();
  const groups = {};
  for (const k of keys) {
    const fam = k.split("-")[0];
    if (family && fam !== family) continue;
    (groups[fam] = groups[fam] || []).push(k);
  }
  const names = Object.keys(groups).sort();
  if (!names.length) {
    out(`没有族 ${family}。可用：${[...new Set(keys.map((k) => k.split("-")[0]))].join(", ")}`);
    process.exit(1);
  }
  for (const n of names) out(`${n} (${groups[n].length}): ${groups[n].join(" ")}`);
}

function cmdStats() {
  const s = data.stats();
  out(JSON.stringify(s, null, 2));
}

switch (cmd) {
  case "find":
    cmdFind(argv[1] && !argv[1].startsWith("--") ? argv[1] : null);
    break;
  case "get":
    cmdGet(argv[1] && !argv[1].startsWith("--") ? argv[1] : null);
    break;
  case "list":
    cmdList(argv[1] && !argv[1].startsWith("--") ? argv[1] : null);
    break;
  case "stats":
    cmdStats();
    break;
  default:
    out(`zingdex —— Zingdex 动效库命令行

  zingdex find "<关键词>" [--device <设备>] [--cat <类别>] [--max <毫秒>] [--json]
  zingdex get <fx-id|effect-id> [--device <设备>] [--json]
  zingdex list [族]
  zingdex stats

设备：phone phone_lg tablet desktop desktop_xl watch car kiosk`);
    process.exit(cmd ? 2 : 0);
}
