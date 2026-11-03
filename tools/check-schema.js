#!/usr/bin/env node
"use strict";
/**
 * Schema 自检：确认 schema 文件本身合法，且现有数据全部符合其中的关键约束。
 * 不引入 ajv，只校验 pattern / required / type 三类，够用且零依赖。
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SCHEMA_PATH = path.join(ROOT, "packages", "schema", "scene.schema.json");
const data = require(path.join(ROOT, "packages", "data"));

let schema;
try {
  schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
} catch (e) {
  console.error("schema 不是合法 JSON：" + e.message);
  process.exit(1);
}

const problems = [];

function check(props, obj, where) {
  for (const key of Object.keys(props)) {
    const rule = props[key];
    const val = obj[key];
    if (val === undefined) {
      if (rule.required) problems.push(`${where} 缺少字段 ${key}`);
      continue;
    }
    if (rule.type === "string" && typeof val !== "string") {
      problems.push(`${where}.${key} 应为 string`);
      continue;
    }
    if (rule.type === "number" && typeof val !== "number") {
      problems.push(`${where}.${key} 应为 number`);
      continue;
    }
    if (rule.pattern && typeof val === "string" && !new RegExp(rule.pattern).test(val)) {
      problems.push(`${where}.${key} 不符合 pattern ${rule.pattern}：${val}`);
    }
  }
}

const sceneProps = schema.properties;
const entryProps = schema.$defs.entry.properties;

for (const s of data.scenes()) {
  check(sceneProps, s, `scene ${s.id}`);
  for (const c of s.cats || []) {
    check(entryProps, c, `entry ${c.fx}`);
  }
}

const required = schema.required || [];
for (const s of data.scenes()) {
  for (const k of required) {
    if (s[k] === undefined) problems.push(`scene ${s.id} 缺少必填字段 ${k}`);
  }
}

if (problems.length) {
  console.error(`Schema 自检失败，${problems.length} 项问题：`);
  for (const p of problems.slice(0, 40)) console.error("  - " + p);
  process.exit(1);
}

console.log(`Schema 自检通过 · ${data.scenes().length} 个场景全部符合`);
