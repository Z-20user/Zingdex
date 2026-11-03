// 从 spec/catalog.json 生成站点用的 data.js（场景 + 分类索引）
// 用法：node tools/gen_site_data.js [源目录] [输出文件]
//
// 约束：data.js 是「索引」，不是「负载」。
// 只放列表页/搜索/筛选需要的最小字段；html / css / 说明文本一律进 lib/*.js 分片。
//
// 4000 条之后的两处瘦身：
//   1. 每个动效写成定长数组 [名称, 英文名, 时长, 缓动, 动效族, 是否旗舰]，
//      不用对象键名，比对象写法省一半字节。
//   2. 根类名 fx-s001-07 由「场景号 + 在该场景内的序号」推出来，不再每条都存。
//      动效族 → 触发方式 / 使用频率 查 FAM 表，也不重复存。
const fs = require("fs");
const path = require("path");

const SRC = process.argv[2] || path.join(__dirname, "..", "..", "04_动效代码库");
const OUT = process.argv[3] || path.join(__dirname, "..", "site", "assets", "data.js");

const cat = JSON.parse(fs.readFileSync(path.join(SRC, "spec", "catalog.json"), "utf8"));

const CTX_DESC = {
  list: "信息密度最高的位置。动效只做两件事：交代顺序，交代层级。",
  detail: "细节页的动效负责补充上下文，不抢主内容。",
  form: "反馈要贴着输入框，不让视线离开手指。",
  progress: "等待本身就是内容。可预测的循环比花哨更让人安心。",
  feedback: "提示的分寸在于克制：三秒内被理解，三秒后自动消失。",
  settings: "设置项的动作要小而确定，一次点击只改变一件事。",
  notification: "通知从边缘进入，不打断手上的事。",
  media: "媒体动效服务于播放状态，而不是装饰。",
  data: "数据不需要跳舞，它需要被读出来：顺序与量级。",
  map: "地图上的动效交代方向与距离，不能只做位移。",
  game: "游戏界面允许更强的反馈，但仍要服从可读性。",
  onboarding: "第一次见面，动效负责建立空间感与节奏。",
  empty: "空状态不是错误，是下一次操作的入口。"
};

/* 动效族 → [触发方式, 使用频率 1–5] */
const FAM = {};
const FLAGSHIP = new Set(cat.scope.flagship || []);
cat.effects.forEach((e) => {
  if (!FAM[e.fam]) FAM[e.fam] = [e.mcat || e.trigger || "场景", e.freq || 1];
});

const byScene = {};
cat.effects.forEach((e) => {
  const sid = String(e.id).split("-")[0];
  (byScene[sid] = byScene[sid] || []).push(e);
});

const SCENES = cat.scenes.filter((s) => (byScene[s.sid] || []).length).map((s, i) => {
  const list = byScene[s.sid];
  const g = list[0].group || "组件";
  list.forEach((e) => {
    if ((e.group || "组件") !== g) {
      throw new Error("场景 " + s.sid + " 内出现多个分类：" + g + " / " + e.group);
    }
  });
  return {
    id: s.sid,
    idx: String(i + 1).padStart(3, "0"),
    zh: s.name,
    en: s.nameEn,
    domain: s.domain,
    ctx: s.ctx,
    desc: CTX_DESC[s.ctx] || "动效服务于内容，不抢注意力。",
    g,
    k: s.kind === "device" ? 1 : 0,
    f: s.form || "phone",
    // [名称, 英文名, 时长, 缓动, 动效族, 是否旗舰]
    cats: list.map((e) => [
      e.name, e.nameEn, e.dur, e.ease, e.fam, FLAGSHIP.has(e.fam) ? 1 : 0
    ])
  };
});

const phoneN = cat.effects.filter((e) => e.kind === "phone").length;
const deviceN = cat.effects.length - phoneN;

const out =
  "/* Zingdex — 索引：" + SCENES.length + " 个场景 / " +
  cat.effects.length + " 条动效（手机向 " + phoneN + " · 设备向 " + deviceN + "）\n" +
  "   由 04_动效代码库/spec/catalog.json 生成，与代码库严格同源。\n" +
  "   只含索引字段；html / css / 说明在 assets/lib/sNNN.js 分片里按需加载。\n*/\n\n" +
  "const SCENES=" + JSON.stringify(SCENES) + ";\n" +
  "const FAM=" + JSON.stringify(FAM) + ";\n" +
  'const MOTIFS=["dock","shimmer","ring","bars","particles","curve","mask","tilt","wave","ripple"];\n' +
  'const TINTS=["tint-a","tint-b","tint-c","tint-d"];\n' +
  "const EASES=" + JSON.stringify(cat.tokens && cat.tokens.easing ? cat.tokens.easing : {}) + ";\n\n" +
  // 定长数组还原成对象：根类名、触发方式、频率都在这里补齐
  "SCENES.forEach(function(s){s.kind=s.k?'device':'phone';s.cats=s.cats.map(function(c,i){\n" +
  "  var n=('0'+(i+1)).slice(-2);\n" +
  "  return {zh:c[0],en:c[1],ms:c[2],ease:c[3],fam:c[4],t:c[5],\n" +
  "    fx:'fx-'+s.id+'-'+n,mc:(FAM[c[4]]||['场景',1])[0],fq:(FAM[c[4]]||['场景',1])[1]};\n" +
  "});delete s.k;});\n\n" +
  "window.SCENES=SCENES;window.MOTIFS=MOTIFS;\n" +
  "window.TINTS=TINTS;window.EASES=EASES;\n";

fs.writeFileSync(OUT, out, "utf8");
console.log("data.js ->", OUT);
console.log("  scenes:", SCENES.length, " effects:", cat.effects.length,
  " size:", (fs.statSync(OUT).size / 1024).toFixed(0), "KB");
