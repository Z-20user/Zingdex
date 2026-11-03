/* Zingdex — 10 条常见开发路径
   ------------------------------------------------------------------
   电脑端「接入指南」和手机端「接入」用的是同一份生成逻辑，
   只渲染不同的外壳，避免两端代码各写一套后走样。

   依赖：window.LIB（组件库索引）、可选 window.Zingdex（基础组件引擎）
*/
(function (global) {
  "use strict";

  const DEV_PATHS = [
    { key: "html", label: "原生 HTML", lang: "html", intro: "一个 style 标签 + 一段结构，粘进任何页面就能跑。最省事的一条路。" },
    { key: "js", label: "原生 JS", lang: "javascript", intro: "用 ES Module 包成函数，结构、样式、初始化一起返回，适合放进现有工程。" },
    { key: "react", label: "React", lang: "jsx", intro: "函数组件 + useEffect 初始化。样式用同名的 css 文件引入。" },
    { key: "vue", label: "Vue 3", lang: "vue", intro: "单文件组件，template / style / script 三块，ref 挂载后跑初始化。" },
    { key: "svelte", label: "Svelte", lang: "svelte", intro: "onMount 里初始化，style 自动作用域化，不用手动隔离类名。" },
    { key: "angular", label: "Angular", lang: "typescript", intro: "独立组件（standalone），模板放 HTML，样式放件内。" },
    { key: "wc", label: "Web Component", lang: "javascript", intro: "自定义元素 + Shadow DOM，样式天然隔离，任何框架里都能用。" },
    { key: "wx", label: "微信小程序", lang: "html", intro: "wxml + wxss，div 换 view、span 换 text，事件用 bindtap。" },
    { key: "uniapp", label: "uni-app", lang: "vue", intro: "一套 Vue 语法出小程序 / App / H5，结构与 Vue 版一致。" },
    { key: "taro", label: "Taro", lang: "jsx", intro: "React 语法跨端，className 与样式与 Web 版一致。" }
  ];

  /* 国内 AI 常驻显示；海外默认折叠。电脑端和手机端共用这一份名单。
     url 里的 {q} 会被替换成编码后的提示词——支持的站点能直接带问题打开，
     不支持的站点只做「复制 + 打开」，不会出错。 */
  const AI_TARGETS_CN = [
    { key: "deepseek", label: "DeepSeek", url: "https://chat.deepseek.com/" },
    { key: "kimi", label: "Kimi", url: "https://www.kimi.com/" },
    { key: "doubao", label: "豆包", url: "https://www.doubao.com/chat/" },
    { key: "qwen", label: "通义千问", url: "https://tongyi.aliyun.com/qianwen/" },
    { key: "zhipu", label: "智谱清言", url: "https://chatglm.cn/" },
    { key: "yuanbao", label: "腾讯元宝", url: "https://yuanbao.tencent.com/chat/" },
    { key: "wenxin", label: "文心一言", url: "https://yiyan.baidu.com/" },
    { key: "hailuo", label: "海螺 AI", url: "https://hailuoai.com/" },
    { key: "minimax", label: "MiniMax", url: "https://chat.minimaxi.com/" },
    { key: "stepfun", label: "阶跃星辰", url: "https://yuewen.cn/" },
    { key: "lingyi", label: "零一万物", url: "https://platform.lingyiwanwu.com/" },
    { key: "spark", label: "讯飞星火", url: "https://xinghuo.xfyun.cn/desk" },
    { key: "tiangong", label: "天工", url: "https://www.tiangong.cn/" },
    { key: "sensetime", label: "商汤日日新", url: "https://chat.sensetime.com/" }
  ];

  const AI_TARGETS_INTL = [
    { key: "chatgpt", label: "ChatGPT", url: "https://chatgpt.com/?q={q}" },
    { key: "claude", label: "Claude", url: "https://claude.ai/new?q={q}" },
    { key: "gemini", label: "Gemini", url: "https://gemini.google.com/app" },
    { key: "grok", label: "Grok", url: "https://grok.com/?q={q}" },
    { key: "copilot", label: "Copilot", url: "https://copilot.microsoft.com/?q={q}" },
    { key: "perplexity", label: "Perplexity", url: "https://www.perplexity.ai/?q={q}" },
    { key: "mistral", label: "Le Chat", url: "https://chat.mistral.ai/chat" },
    { key: "poe", label: "Poe", url: "https://poe.com/" },
    { key: "meta", label: "Meta AI", url: "https://www.meta.ai/" },
    { key: "hf", label: "HF Chat", url: "https://huggingface.co/chat/" },
    { key: "you", label: "You.com", url: "https://you.com/" },
    { key: "phind", label: "Phind", url: "https://www.phind.com/" }
  ];

  const AI_TARGETS = AI_TARGETS_CN.concat(AI_TARGETS_INTL);

  function escAttr(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* 取一条组件在某个框架下的可运行代码 */
  function codeForPath(item, key) {
    if (!item) return "";
    const LIB = global.LIB;
    const T = global.Zingdex;
    const cls = item.id || "component";
    const isBase = item.group === "base" && T;

    let html;
    let css;
    let js;
    let prompt;

    if (isBase) {
      const c = T.build(item.effect, {});
      html = c.html;
      css = c.css;
      js = c.jsBody ? T.jsSource(item.effect, c) : "";
      prompt = T.code.prompt(item.effect, c);
    } else {
      const vals = item._vals || (LIB && LIB.defaultVals ? LIB.defaultVals(item) : null);
      if (vals) item._vals = vals;
      html = item.html;
      css = LIB && LIB.cssWithParams ? LIB.cssWithParams(item.css, cls, vals) : item.css;
      js = item.js || "";
      prompt = LIB && LIB.promptFor ? LIB.promptFor(item) : "";
    }

    const init = js.trim() ?
      "var root = document.querySelector(\"." + cls + "\");\n" + js.trim() : "";
    const indent = (n) => js.trim().split("\n").map((l) => new Array(n + 1).join(" ") + l).join("\n");
    const jsOrNote = (n) => js.trim() ? indent(n) : new Array(n + 1).join(" ") + "// 这个组件不需要 JavaScript";
    const bt = "`";

    switch (key) {
      case "html":
        return [
          "<!-- 1. 样式放进 <head> 里的 <style> -->",
          "<style>",
          css,
          "</style>",
          "",
          "<!-- 2. 结构放到页面里 -->",
          html,
          js.trim() ? "\n<!-- 3. 这个组件带初始化脚本，放到 </body> 前 -->" : "",
          js.trim() ? "<script>\n(function () {\n" + init + "\n})();\n</" + "script>" : ""
        ].filter(Boolean).join("\n");

      case "js":
        return [
          "// shared/" + cls + ".js",
          "export const css = " + bt + css.replace(/`/g, "\\`") + bt + ";",
          "",
          "export const html = " + bt + html.replace(/`/g, "\\`") + bt + ";",
          "",
          "export function mount(root) {",
          jsOrNote(2),
          "}",
          "",
          "// 用法：",
          "// import { css, html, mount } from './shared/" + cls + ".js';",
          "// const style = document.createElement('style'); style.textContent = css;",
          "// document.head.appendChild(style);",
          "// host.innerHTML = html; mount(host);"
        ].join("\n");

      case "react":
        return [
          "import { useEffect, useRef } from 'react';",
          "import './" + cls + ".css';",
          "",
          "export default function Demo() {",
          "  const ref = useRef(null);",
          "",
          "  useEffect(() => {",
          "    if (!ref.current) return;",
          jsOrNote(4),
          "  }, []);",
          "",
          "  return <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;",
          "}",
          "",
          "// html 用「复制 HTML」拿到的那段，或改用 JSX 直接写：",
          "export const html = " + bt + html.replace(/`/g, "\\`") + bt + ";"
        ].join("\n");

      case "vue":
        return [
          "<template>",
          "  <div ref=\"host\" v-html=\"html\" />",
          "</template>",
          "",
          "<script setup>",
          "import { onMounted, ref } from 'vue';",
          "import html from './" + cls + ".html?raw';",
          "",
          "const host = ref(null);",
          "onMounted(() => {",
          "  if (!host.value) return;",
          jsOrNote(2),
          "});",
          "<" + "/script>",
          "",
          "<style src=\"./" + cls + ".css\"></style>"
        ].join("\n");

      case "svelte":
        return [
          "<script>",
          "  import { onMount } from 'svelte';",
          "  import html from './" + cls + ".html?raw';",
          "  let host;",
          "  onMount(() => {",
          "    if (!host) return;",
          jsOrNote(4),
          "  });",
          "<" + "/script>",
          "",
          "<div bind:this={host}>{@html html}</div>",
          "",
          "<style src=\"./" + cls + ".css\"></style>"
        ].join("\n");

      case "angular":
        return [
          "// demo.component.ts",
          "import { Component, ElementRef, AfterViewInit, ViewChild } from '@angular/core';",
          "",
          "@Component({",
          "  selector: 'app-demo',",
          "  templateUrl: './demo.component.html',",
          "  styleUrls: ['./" + cls + ".css'],",
          "  standalone: true",
          "})",
          "export class DemoComponent implements AfterViewInit {",
          "  @ViewChild('host', { static: true }) host!: ElementRef<HTMLElement>;",
          "",
          "  ngAfterViewInit() {",
          "    const root = this.host.nativeElement;",
          jsOrNote(4),
          "  }",
          "}",
          "",
          "<!-- demo.component.html -->",
          "<div #host>" + escAttr(html) + "</div>"
        ].join("\n");

      case "wc":
        return [
          "import styles from './" + cls + ".css?inline';",
          "",
          "const HTML = " + bt + html.replace(/`/g, "\\`") + bt + ";",
          "",
          "class DemoElement extends HTMLElement {",
          "  connectedCallback() {",
          "    if (this.shadowRoot) return;",
          "    const root = this.attachShadow({ mode: 'open' });",
          "    const style = document.createElement('style');",
          "    style.textContent = styles;",
          "    root.appendChild(style);",
          "    const host = document.createElement('div');",
          "    host.innerHTML = HTML;",
          "    root.appendChild(host);",
          jsOrNote(4),
          "  }",
          "}",
          "",
          "customElements.define('tz-demo', DemoElement);"
        ].join("\n");

      case "wx":
        return [
          "<!-- demo.wxml -->",
          "<view class=\"" + cls + "\">",
          "  <!-- 把上面的 HTML 结构转成 wxml：div→view、span→text、img→image -->",
          "</view>",
          "",
          "<!-- demo.wxss：把组件 CSS 整段贴进来，rpx 可按 750 设计稿换算 -->",
          "",
          "// demo.json",
          "{ \"component\": true }",
          "",
          "// demo.js",
          "Component({",
          "  lifetimes: {",
          "    attached() {",
          jsOrNote(6),
          "    }",
          "  }",
          "});"
        ].join("\n");

      case "uniapp":
        return [
          "<template>",
          "  <view :class=\"'pin-root " + cls + "'\">",
          "    <!-- 结构同 Vue 版，标签换成 view / text -->",
          "  </view>",
          "</template>",
          "",
          "<script>",
          "export default {",
          "  mounted() {",
          jsOrNote(4),
          "  }",
          "};",
          "<" + "/script>",
          "",
          "<style>",
          css,
          "</style>"
        ].join("\n");

      case "taro":
        return [
          "import { View } from '@tarojs/components';",
          "import { useEffect, useRef } from 'react';",
          "import './" + cls + ".scss';",
          "",
          "export default function Demo() {",
          "  const ref = useRef(null);",
          "  useEffect(() => {",
          "    if (!ref.current) return;",
          jsOrNote(4),
          "  }, []);",
          "",
          "  return <View ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;",
          "}",
          "",
          "const html = " + bt + html.replace(/`/g, "\\`") + bt + ";"
        ].join("\n");

      default:
        return prompt;
    }
  }

  global.TZP = { DEV_PATHS, codeForPath, escAttr, AI_TARGETS, AI_TARGETS_CN, AI_TARGETS_INTL };
})(window);
