"use strict";
/**
 * 示例插件：给品牌加两条自有动效。
 *
 * 运行：node packages/plugin-sdk/example/brand-motion.js
 */
const path = require("path");
const { definePlugin, createRegistry } = require(path.join(__dirname, "..", "index.js"));

const brandMotion = definePlugin({
  name: "demo-brand-motion",
  version: "1.0.0",
  description: "演示用：一条上浮入场、一条品牌色描边",
  effects: [
    {
      id: "x-demo-rise",
      zh: "品牌色上浮",
      en: "Brand Rise",
      tags: ["入场", "品牌"],
      device: ["phone", "desktop"],
      html: '<div class="x-demo-rise">品牌内容</div>',
      css: [
        ".x-demo-rise{",
        "  padding:18px 24px;border-radius:12px;background:#0F1408;color:#C6F24C;",
        "  font:600 15px/1 system-ui,sans-serif;",
        "  animation:x-demo-rise-in 320ms cubic-bezier(.16,1,.3,1) both;",
        "}",
        "@keyframes x-demo-rise-in{",
        "  from{opacity:0;transform:translateY(16px)}",
        "  to{opacity:1;transform:translateY(0)}",
        "}",
      ].join("\n"),
    },
    {
      id: "x-demo-outline",
      zh: "描边生长",
      en: "Outline Grow",
      tags: ["强调", "状态"],
      html: '<div class="x-demo-outline">已同步</div>',
      css: [
        ".x-demo-outline{",
        "  position:relative;padding:10px 18px;border-radius:999px;",
        "  font:500 13px/1 system-ui,sans-serif;color:#0F1408;background:#EAF7C9;",
        "}",
        ".x-demo-outline::after{",
        "  content:'';position:absolute;inset:0;border-radius:inherit;",
        "  border:1.5px solid #C6F24C;transform:scale(.9);opacity:0;",
        "  animation:x-demo-outline-in 420ms ease-out both;",
        "}",
        "@keyframes x-demo-outline-in{",
        "  to{transform:scale(1.06);opacity:1}",
        "}",
      ].join("\n"),
    },
  ],
});

const reg = createRegistry({ plugins: [brandMotion] });

console.log("插件已加载：", Object.keys(reg.list()), reg.list());
console.log("\n检索「品牌」：");
for (const hit of reg.find("品牌")) console.log("  ", hit.fx, hit.zh, `(${hit.plugin})`);

const one = reg.get("x-demo-rise", { device: "phone" });
console.log("\n取码 x-demo-rise：");
console.log("  device:", one.device, "| source:", one.source, "| note:", one.note);
console.log("  css 长度:", one.css.length);
