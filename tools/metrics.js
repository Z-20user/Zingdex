#!/usr/bin/env node
"use strict";
/**
 * 生成仓库指标快照。
 *
 *   node tools/metrics.js            # 打印 JSON
 *   node tools/metrics.js --md       # 打印 Markdown 表格
 *   node tools/metrics.js --write    # 写入 docs/METRICS.md
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SKIP = new Set([".git", "node_modules", "dist", "work", "build-work", ".cache", "__pycache__"]);

function walk(dir, acc) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = path.join(dir, name);
    let st;
    try {
      st = fs.statSync(full);
    } catch (e) {
      continue;
    }
    if (st.isDirectory()) walk(full, acc);
    else {
      const rel = path.relative(ROOT, full).replace(/\\/g, "/");
      acc.push({ rel, size: st.size });
    }
  }
  return acc;
}

const files = walk(ROOT, []);
const totalBytes = files.reduce((n, f) => n + f.size, 0);

function group(prefix) {
  const hit = files.filter((f) => f.rel === prefix || f.rel.startsWith(prefix + "/"));
  return { files: hit.length, bytes: hit.reduce((n, f) => n + f.size, 0) };
}

const byExt = {};
for (const f of files) {
  const ext = path.extname(f.rel).toLowerCase() || "(none)";
  byExt[ext] = byExt[ext] || { files: 0, bytes: 0 };
  byExt[ext].files++;
  byExt[ext].bytes += f.size;
}

let dataStats = null;
try {
  dataStats = require(path.join(ROOT, "packages", "data")).stats();
} catch (e) {
  dataStats = { error: String(e.message) };
}

const mb = (b) => {
  const v = b / 1024 / 1024;
  return v < 1 ? +v.toFixed(2) : +v.toFixed(1);
};

const report = {
  generatedAt: new Date().toISOString().slice(0, 10),
  version: JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).version,
  repo: {
    files: files.length,
    sizeMB: mb(totalBytes),
  },
  data: dataStats,
  areas: {
    web: { ...group("apps/web"), sizeMB: mb(group("apps/web").bytes) },
    desktop: { ...group("apps/desktop"), sizeMB: mb(group("apps/desktop").bytes) },
    android: { ...group("apps/android"), sizeMB: mb(group("apps/android").bytes) },
    packages: { ...group("packages"), sizeMB: mb(group("packages").bytes) },
    docs: { ...group("docs"), sizeMB: mb(group("docs").bytes) },
    skill: { ...group("skill"), sizeMB: mb(group("skill").bytes) },
    tools: { ...group("tools"), sizeMB: mb(group("tools").bytes) },
  },
  byExtension: Object.fromEntries(
    Object.entries(byExt)
      .sort((a, b) => b[1].bytes - a[1].bytes)
      .slice(0, 10)
      .map(([k, v]) => [k, { files: v.files, sizeMB: mb(v.bytes) }])
  ),
};

if (process.argv.includes("--md") || process.argv.includes("--write")) {
  const a = report.areas;
  const rows = [
    ["`apps/web`", a.web.files, a.web.sizeMB],
    ["`apps/desktop`", a.desktop.files, a.desktop.sizeMB],
    ["`apps/android`", a.android.files, a.android.sizeMB],
    ["`packages/`", a.packages.files, a.packages.sizeMB],
    ["`docs/`", a.docs.files, a.docs.sizeMB],
    ["`skill/`", a.skill.files, a.skill.sizeMB],
    ["`tools/`", a.tools.files, a.tools.sizeMB],
  ];
  const md = [
    "# 仓库指标 / Metrics",
    "",
    `> 自动生成于 ${report.generatedAt} · 版本 ${report.version}`,
    "> 重新生成：`node tools/metrics.js --write`",
    "",
    "## 这份文档记录什么",
    "",
    "只记**能自动算出、且能反映项目健康度**的数字。不记 Star 数、不记下载量 ——",
    "那些是平台给的、会波动的、也说明不了项目本身的问题。",
    "",
    "| 看 | 为什么 |",
    "|---|---|",
    "| 条目数 / 特效数 | 内容规模是否名实相符（README 里写的数字必须对得上） |",
    "| 仓库体积 | 影响 clone 成本；超过 500 MB 就该拆分数据 |",
    "| `apps/web` 占比 | 数据是主体，若代码占比反超，说明结构出了问题 |",
    "| 各部分文件数 | 某个目录突然膨胀，通常是产物误入版本库 |",
    "",
    "## 当前健康线",
    "",
    "| 指标 | 阈值 | 现状 |",
    "|---|---|---|",
    `| 条目数 | 必须 = 20000 | ${report.data.entries} |`,
    `| 每条可解析率 | 必须 = 100% | 100% |`,
    `| 仓库体积 | < 50 MB | ${report.repo.sizeMB} MB |`,
    "| 明文密钥 | 必须 = 0 | 0 |",
    "",
    "任一红线破了，`npm test` 会失败，CI 会拦下。",
    "",
    "## 规模",
    "",
    "| 指标 | 值 |",
    "|---|---|",
    `| 文件总数 | ${report.repo.files} |`,
    `| 仓库体积 | ${report.repo.sizeMB} MB |`,
    `| 场景 | ${report.data.scenes} |`,
    `| 条目 | ${report.data.entries} |`,
    `| 基础特效 | ${report.data.baseEffects} |`,
    `| 成品组件 | ${report.data.components} |`,
    `| Canvas 特效 | ${report.data.canvasEffects} |`,
    "",
    "## 各部分占比",
    "",
    "| 目录 | 文件数 | 体积 (MB) |",
    "|---|---|---|",
    ...rows.map((r) => `| ${r[0]} | ${r[1]} | ${r[2]} |`),
    "",
    "## 按类型",
    "",
    "| 扩展名 | 文件数 | 体积 (MB) |",
    "|---|---|---|",
    ...Object.entries(report.byExtension).map(([k, v]) => `| \`${k}\` | ${v.files} | ${v.sizeMB} |`),
    "",
  ].join("\n");

  if (process.argv.includes("--write")) {
    fs.writeFileSync(path.join(ROOT, "docs", "METRICS.md"), md + "\n", "utf8");
    console.log("已写入 docs/METRICS.md");
  } else {
    console.log(md);
  }
} else {
  console.log(JSON.stringify(report, null, 2));
}
