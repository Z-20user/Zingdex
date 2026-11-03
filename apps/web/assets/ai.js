/* Zingdex — AI 接入
   ------------------------------------------------------------------
   三端共用：内置 AI 名单、自定义 AI、提示词模板、一键发送。

   发送策略按运行环境自动选：
     桌面原生 → 复制到剪贴板 + 用系统浏览器打开
     手机原生 → 优先调系统分享（可直接选到任意 AI App），失败再复制 + 打开
     纯网页   → 复制 + 新标签页

   自定义项与模板都只存本机，不联网。
*/
(function (global) {
  "use strict";

  const KEY_CUSTOM = "tr-ai-custom";
  const KEY_TPL = "tr-ai-template";

  function builtin() {
    const P = global.TZP || {};
    return (P.AI_TARGETS_CN || []).concat(P.AI_TARGETS_INTL || []);
  }

  function readJSON(key, dft) {
    try {
      const raw = global.localStorage && global.localStorage.getItem(key);
      if (!raw) return dft;
      const v = JSON.parse(raw);
      return v == null ? dft : v;
    } catch (e) {
      return dft;
    }
  }

  function writeJSON(key, v) {
    try { global.localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* noop */ }
  }

  /* ---------- 自定义 AI ---------- */

  function custom() {
    const list = readJSON(KEY_CUSTOM, []);
    return Array.isArray(list) ? list.filter((x) => x && x.label && x.url) : [];
  }

  function saveCustom(list) {
    const clean = (Array.isArray(list) ? list : [])
      .filter((x) => x && String(x.label).trim() && String(x.url).trim())
      .map((x, i) => ({
        key: "custom-" + i + "-" + String(x.label).replace(/\s+/g, "").slice(0, 12),
        label: String(x.label).trim().slice(0, 24),
        url: String(x.url).trim(),
        custom: true
      }));
    writeJSON(KEY_CUSTOM, clean);
    return clean;
  }

  function addCustom(label, url) {
    const list = custom().concat([{ label, url }]);
    return saveCustom(list);
  }

  function removeCustom(key) {
    return saveCustom(custom().filter((x) => x.key !== key));
  }

  function all() {
    return builtin().concat(custom());
  }

  /* ---------- 提示词模板（自定义项） ---------- */

  const TPL_FIELDS = [
    { k: "form", label: "交付形态", ph: "单文件 HTML / React 组件 / Vue SFC / Web Component" },
    { k: "style", label: "样式方案", ph: "纯 CSS 变量 / Tailwind / CSS Modules / styled-components" },
    { k: "lang", label: "语言与校验", ph: "TypeScript strict / 纯 JS，不需要构建" },
    { k: "browser", label: "浏览器下限", ph: "Chrome 100+ / 兼容 iOS 15" },
    { k: "extra", label: "附加要求", ph: "例如：不要圆角、跟随暗色主题、单文件小于 20KB" }
  ];

  function template() {
    const t = readJSON(KEY_TPL, {});
    const out = {};
    TPL_FIELDS.forEach((f) => { out[f.k] = (t && t[f.k]) || ""; });
    return out;
  }

  function saveTemplate(t) {
    const clean = {};
    TPL_FIELDS.forEach((f) => { clean[f.k] = String((t && t[f.k]) || "").slice(0, 300); });
    writeJSON(KEY_TPL, clean);
    return clean;
  }

  function templateBlock() {
    const t = template();
    const lines = TPL_FIELDS
      .filter((f) => String(t[f.k] || "").trim())
      .map((f) => "- " + f.label + "：" + String(t[f.k]).trim());
    if (!lines.length) return "";
    return "\n\n# 我的工程约束（自定义，优先级高于上面的通用建议）\n" + lines.join("\n");
  }

  /* 组件条目 → 完整提示词（含自定义约束） */
  function composePrompt(item) {
    let base = "";
    try {
      if (global.LIB && global.LIB.promptFor) base = global.LIB.promptFor(item) || "";
    } catch (e) { /* noop */ }
    if (!base && item) base = "请按参考实现复刻这个动效：" + (item.zh || "");
    return composeFrom(base);
  }

  /* 已经有提示词文本时，只补自定义约束那一段 */
  function composeFrom(base) {
    return String(base || "") + templateBlock();
  }

  /* ---------- 复制 / 打开 ---------- */

  function copy(text) {
    const t = String(text || "");
    if (global.zingdex && typeof global.zingdex.copy === "function") {
      try {
        return Promise.resolve(global.zingdex.copy(t)).then(() => true).catch(() => legacyCopy(t));
      } catch (e) {
        return Promise.resolve(legacyCopy(t));
      }
    }
    if (global.navigator && global.navigator.clipboard && global.navigator.clipboard.writeText) {
      return global.navigator.clipboard.writeText(t).then(() => true).catch(() => legacyCopy(t));
    }
    return Promise.resolve(legacyCopy(t));
  }

  function legacyCopy(text) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch (e) {
      return false;
    }
  }

  function openUrl(url) {
    if (global.zingdex && typeof global.zingdex.openExternal === "function") {
      global.zingdex.openExternal(url);
      return;
    }
    if (global.ZingdexHost && typeof global.ZingdexHost.openUrl === "function") {
      try { if (global.ZingdexHost.openUrl(url)) return; } catch (e) { /* noop */ }
    }
    global.open(url, "_blank", "noopener");
  }

  /* 手机优先走系统分享：可以直接把提示词丢进任意 AI App */
  function shareText(text) {
    const H = global.ZingdexHost;
    if (H && typeof H.share === "function") {
      try {
        if (H.share("交给 AI", text)) return true;
      } catch (e) { /* noop */ }
    }
    return false;
  }

  /** 发到某个 AI：复制提示词，再打开/分享。返回 Promise<{copied, shared}> */
  function send(target, prompt) {
    const url = String((target && target.url) || "");
    const text = String(prompt || "");
    // URL 里带 {q} 的，直接把提示词拼进去（少数站点支持）
    const finalUrl = url.indexOf("{q}") >= 0
      ? url.split("{q}").join(encodeURIComponent(text.slice(0, 1200)))
      : url;
    return copy(text).then((copied) => {
      const shared = shareText(text);
      if (!shared && finalUrl) openUrl(finalUrl);
      return { copied: copied !== false, shared };
    });
  }

  global.TZAI = {
    builtin, custom, all, addCustom, removeCustom, saveCustom,
    template, saveTemplate, TPL_FIELDS,
    composePrompt, composeFrom, copy, openUrl, send
  };
})(window);
