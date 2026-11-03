#!/usr/bin/env node
"use strict";
/**
 * 数据自检：规模、编号格式、条目可解析率。
 * 供 CI 与发布前使用；任一项不符即退出码 1。
 */
const data = require("../packages/data");

const EXPECT = {
  scenes: 201,
  entries: 20000,
  baseEffects: 500,
  canvasEffects: 24,
};

const SCENE_ID = /^[a-z][0-9]{2,3}$/;
const FX_ID = /^fx-[a-z][0-9]{2,3}-[0-9]{2,3}$/;

const problems = [];

const stats = data.stats();
for (const [k, want] of Object.entries(EXPECT)) {
  const got = stats[k];
  if (got !== want) problems.push(`规模不符：${k} 期望 ${want}，实际 ${got}`);
}

for (const s of data.scenes()) {
  if (!SCENE_ID.test(s.id)) problems.push(`场景编号不合规：${s.id}`);
  if (!s.zh) problems.push(`场景 ${s.id} 缺少中文名`);
  for (const c of s.cats || []) {
    if (!FX_ID.test(c.fx)) problems.push(`条目编号不合规：${c.fx}`);
    if (!data.entry(c.fx)) problems.push(`条目无法解析：${c.fx}（场景 ${s.id}）`);
  }
}

const base = data.baseEffects();
for (const id of Object.keys(base)) {
  if (!base[id].html && !base[id].css) problems.push(`基础特效为空：${id}`);
}

if (problems.length) {
  console.error(`数据自检失败，${problems.length} 项问题：`);
  for (const p of problems.slice(0, 40)) console.error("  - " + p);
  process.exit(1);
}

console.log("数据自检通过");
console.log(
  `  场景 ${stats.scenes} · 条目 ${stats.entries} · 基础特效 ${stats.baseEffects} · ` +
    `组件 ${stats.components} · Canvas ${stats.canvasEffects}`
);
