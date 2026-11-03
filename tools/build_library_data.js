// 把 04_动效代码库 的负载拆成按场景分片，替代原来 3 MB 的 library-data.js
//
// 用法：node tools/build_library_data.js [源目录] [输出基础目录]
//
// 产物：
//   assets/lib/sNNN.js   × 40   每个场景 25 条规格的 html / css / 说明
//   assets/lib-gl.js            24 个 Canvas / 3D 重特效（1000 组件覆盖不到的能力）
//
// 不写进分片的东西（都能从 data.js 推出来）：
//   n 名称 / d 时长 / e 缓动 / sc 场景 / g 分类 / mc 触发 / dm 领域 / dev 设备
//   p 参数面板 —— 1000 条只有 2 种形状，值全部由 ms / ease 推导，见 library.js paramList()
const fs = require("fs");
const path = require("path");

const SRC = process.argv[2] || path.join(__dirname, "..", "..", "04_动效代码库");
const OUT = process.argv[3] || path.join(__dirname, "..", "site", "assets");

global.window = global;
eval(fs.readFileSync(path.join(SRC, "assets", "gl-effects.js"), "utf8"));

const catalog = JSON.parse(fs.readFileSync(path.join(SRC, "spec", "catalog.json"), "utf8"));

/* ---------- 按场景分组 ---------- */
const byScene = {};
catalog.effects.forEach((e) => {
  const sid = String(e.id).split("-")[0];
  (byScene[sid] = byScene[sid] || []).push(e);
});

const libDir = path.join(OUT, "lib");
fs.mkdirSync(libDir, { recursive: true });

// 清掉上一版分片，避免场景数量变化后残留孤儿文件
fs.readdirSync(libDir)
  .filter((f) => /^s\d+\.js$/.test(f))
  .forEach((f) => fs.unlinkSync(path.join(libDir, f)));

let totalBytes = 0;
const sizes = [];
Object.keys(byScene).sort().forEach((sid) => {
  const pay = {};
  byScene[sid].forEach((e) => {
    pay["fx-" + e.id] = {
      h: (e.code && e.code.html) || "",
      c: (e.code && e.code.css) || "",
      nt: e.note || ""
    };
  });
  const body =
    "window.LIB_PAY=window.LIB_PAY||{};Object.assign(window.LIB_PAY," +
    JSON.stringify(pay) + ");\n";
  const file = path.join(libDir, sid + ".js");
  fs.writeFileSync(file, body, "utf8");
  const n = fs.statSync(file).size;
  totalBytes += n;
  sizes.push({ sid, kb: n / 1024 });
});

/* ---------- Canvas / 3D 重特效 ---------- */
const gl = GL_EFFECTS.map((x) => ({
  id: x.id, zh: x.name, en: x.en, tech: x.tech || "canvas",
  html: x.html, css: x.css || "", js: x.js || ""
}));
fs.writeFileSync(
  path.join(OUT, "lib-gl.js"),
  "/* 自动生成：node tools/build_library_data.js（不要手改） */\n" +
    "window.LIB_GL=" + JSON.stringify(gl) + ";\n",
  "utf8"
);
const glBytes = fs.statSync(path.join(OUT, "lib-gl.js")).size;

/* ---------- 报告 ---------- */
sizes.sort((a, b) => b.kb - a.kb);
console.log("分片目录 ->", libDir);
console.log("  场景数:", sizes.length, " 分片合计:", (totalBytes / 1048576).toFixed(2), "MB");
console.log("  最大分片:", sizes[0].sid, sizes[0].kb.toFixed(0), "KB",
  " 最小分片:", sizes[sizes.length - 1].sid, sizes[sizes.length - 1].kb.toFixed(0), "KB");
console.log("  lib-gl.js:", gl.length, "个特效", (glBytes / 1024).toFixed(0), "KB");
