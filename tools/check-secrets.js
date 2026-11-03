#!/usr/bin/env node
"use strict";
/**
 * 密钥与隐私扫描：遍历仓库文件，命中阻断项即退出码 1。
 * 与 gitleaks 互补 —— 这里只覆盖本项目最可能踩的几类。
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const SKIP_DIRS = new Set([".git", "node_modules", "__pycache__", "dist", "work", "build-work", ".cache"]);
const SKIP_EXT = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".woff2", ".woff",
  ".ttf", ".otf", ".zip", ".apk", ".exe", ".pdf", ".jks", ".keystore",
]);

const RULES = [
  ["private-key", /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/g, "block"],
  ["github-token", /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g, "block"],
  ["github-pat", /\bgithub_pat_[A-Za-z0-9_]{50,}\b/g, "block"],
  ["aws-access", /\bAKIA[0-9A-Z]{16}\b/g, "block"],
  ["google-key", /\bAIza[0-9A-Za-z_-]{35}\b/g, "block"],
  ["openai-key", /\bsk-[A-Za-z0-9]{32,}\b/g, "block"],
  ["anthropic-key", /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g, "block"],
  ["slack-token", /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, "block"],
  ["jwt", /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g, "block"],
  [
    "secret-assign",
    /\b(?:password|passwd|pwd|secret|api[_-]?key|apikey|access[_-]?token|client[_-]?secret|ks_pass|storepass|keypass)\b\s*[:=]\s*['"][^'"\s]{6,}['"]/gi,
    "block",
  ],
  ["local-path", /[A-Za-z]:\\\\?Users\\\\?[A-Za-z0-9_.-]+/g, "warn"],
];

const ALLOW_EMAIL_DOMAIN = new Set(["example.com", "users.noreply.github.com", "qq.com"]);
const EMAIL = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

const blocking = [];
const warning = [];

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full);
    else scan(full);
  }
}

function scan(file) {
  if (SKIP_EXT.has(path.extname(file).toLowerCase())) return;
  if (fs.statSync(file).size > 8 * 1024 * 1024) return;

  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch (e) {
    return;
  }

  const lines = text.split("\n");
  lines.forEach((line, i) => {
    const probe = line.length > 4000 ? "" : line;
    for (const [name, rx, level] of RULES) {
      rx.lastIndex = 0;
      const target = name === "secret-assign" ? probe : line;
      const m = rx.exec(target);
      if (!m) continue;
      // 文档里写「C:\Users\...」这种占位示例，不算泄漏
      if (name === "local-path" && /\.\.\.$/.test(m[0].trim())) continue;
      const rec = `${path.relative(ROOT, file)}:${i + 1}  ${name}  ${m[0].slice(0, 100).trim()}`;
      (level === "block" ? blocking : warning).push(rec);
    }
    EMAIL.lastIndex = 0;
    let em;
    while ((em = EMAIL.exec(line))) {
      const dom = em[0].split("@").pop().toLowerCase();
      if (ALLOW_EMAIL_DOMAIN.has(dom)) continue;
      warning.push(`${path.relative(ROOT, file)}:${i + 1}  email  ${em[0]}`);
      break;
    }
  });
}

walk(ROOT);

console.log(`密钥扫描：阻断 ${blocking.length} · 提示 ${warning.length}`);
for (const b of blocking) console.log("  [BLOCK] " + b);
for (const w of warning.slice(0, 20)) console.log("  [WARN ] " + w);

process.exit(blocking.length ? 1 : 0);
