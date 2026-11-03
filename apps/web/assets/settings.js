/* Zingdex — 偏好设置
   ------------------------------------------------------------
   全部存在 localStorage 的 tr-settings 里，纯本地，不上传。
   页面在 <head> 里有一段同样的内联脚本先跑一遍，避免闪烁；
   这里是完整版，负责读写、校验、应用与广播。
*/
(function (global) {
  "use strict";

  const KEY = "tr-settings";

  const DEFAULTS = {
    theme: "light",      // light | dark | auto
    skin: "none",        // none | aurora | star | glass | paper | mist
    density: "comfort",  // comfort | compact
    fs: "m",             // xs | s | m | l | xl
    lh: "normal",        // tight | normal | loose
    motion: "full",      // full | reduced
    cardAnim: "on",      // on | off
    fullscreen: "on",    // on | off（仅桌面）
    libGroup: "specs",   // specs | gl | base
    libDevice: "all",
    libShown: 60,
    libSort: "default",  // default | name | dur
    cardSize: "m",       // s | m | l
    codeFont: "m",        // s | m | l
    exitKey: ""           // 退出全屏的组合键，空 = 只用内置的 Esc / F11 / 右键
  };

  const ALLOWED = {
    theme: ["light", "dark", "auto"],
    skin: ["none", "aurora", "star", "glass", "paper", "mist"],
    density: ["comfort", "compact"],
    fs: ["xs", "s", "m", "l", "xl"],
    lh: ["tight", "normal", "loose"],
    motion: ["full", "reduced"],
    cardAnim: ["on", "off"],
    fullscreen: ["on", "off"],
    libGroup: ["specs", "gl", "base"],
    libDevice: ["all", "phone", "tablet", "laptop", "desktop", "kiosk", "car", "tv", "watch", "ar", "eink", "hmi"],
    libShown: [30, 60, 120],
    libSort: ["default", "name", "dur"],
    cardSize: ["s", "m", "l"],
    codeFont: ["s", "m", "l"]
  };

  function read() {
    const out = Object.assign({}, DEFAULTS);
    let raw = null;
    try {
      raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    } catch (e) {
      raw = {};
    }
    Object.keys(DEFAULTS).forEach((k) => {
      if (raw[k] !== undefined && ALLOWED[k] && ALLOWED[k].indexOf(raw[k]) >= 0) {
        out[k] = raw[k];
      } else if (k === "libShown" && typeof raw[k] === "number") {
        out[k] = ALLOWED.libShown.indexOf(raw[k]) >= 0 ? raw[k] : DEFAULTS[k];
      } else if (k === "exitKey" && typeof raw[k] === "string") {
        // 自定义的退出全屏组合键：自由字符串，只做长度兜底
        out[k] = raw[k].slice(0, 40);
      }
    });
    return out;
  }

  function write(patch) {
    const next = Object.assign(read(), patch || {});
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch (e) {
      /* 隐私模式忽略 */
    }
    return next;
  }

  function resolvedTheme(s) {
    if (s.theme === "auto") {
      try {
        if (global.ZingdexHost && typeof global.ZingdexHost.systemDark === "function") {
          try { return global.ZingdexHost.systemDark() ? "dark" : "light"; } catch (e) { /* 往下兜 */ }
        }
        return global.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      } catch (e) {
        return "light";
      }
    }
    return s.theme;
  }

  function apply(s) {
    const html = document.documentElement;
    html.dataset.theme = resolvedTheme(s);
    html.dataset.skin = s.skin || "none";
    html.dataset.density = s.density;
    html.dataset.fs = s.fs;
    html.dataset.lh = s.lh;
    html.dataset.motionPref = s.motion;
    // 这是动效库：系统开了「减少动态效果」时，只把本应用降级才对，
    // 但默认设置是 full —— 那时要强制播放，否则所有卡片只剩 1ms 淡入，
    // 看起来就是一张静止的黑卡。用户在设置里选「减弱」才真正降级。
    if (s.motion === "reduced") html.removeAttribute("data-force-motion");
    else html.setAttribute("data-force-motion", "");
    html.dataset.cardAnim = s.cardAnim;
    html.dataset.cardSize = s.cardSize;
    html.dataset.codeFont = s.codeFont;
    try {
      localStorage.setItem("tr-theme", html.dataset.theme);
    } catch (e) {
      /* noop */
    }
    if (global.ZingdexHost && typeof global.ZingdexHost.setTheme === "function") {
      try { global.ZingdexHost.setTheme(html.dataset.theme); } catch (e) { /* noop */ }
    }
    document.dispatchEvent(new CustomEvent("zingdex:settings", { detail: s }));
  }

  function set(patch) {
    const next = write(patch);
    apply(next);
    return next;
  }

  function reset() {
    try { localStorage.removeItem(KEY); } catch (e) { /* noop */ }
    const d = Object.assign({}, DEFAULTS);
    apply(d);
    return d;
  }


  /* ---------------- 授权令牌（离线验签） ----------------
     桌面版交给主进程校验（含文件指纹）；
     安卓版在网页层用 WebCrypto 的 Ed25519 验签，
     文件完整性由 APK 签名保证，不再重复算哈希。
  ------------------------------------------------------ */

  const LIC_PUB_SPKI = "MCowBQYDK2VwAyEAx13W6auI23J6DqUIW539qJxVgCZsn5BA+fsThOXJrzU=";
  const LIC_GROUP = "Zingdex-A";
  const LIC_SEATS = Array.from({ length: 100 }, (_, i) => "S" + String(i + 1).padStart(2, "0"));

  function licAlphabet() {
    const out = [];
    const used = new Set();
    let cp = 0x4e00;
    while (out.length < 64) {
      const ch = String.fromCodePoint(cp);
      if (!used.has(ch)) { used.add(ch); out.push(ch); }
      cp += 13;
    }
    return out.join("");
  }

  function licDecode(str) {
    const std = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    const A = licAlphabet();
    let b64 = "";
    for (const ch of String(str)) {
      const i = A.indexOf(ch);
      b64 += i < 0 ? ch : std[i];
    }
    const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
    const raw = atob(b64 + pad);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
    return out;
  }

  function fromB64(str) {
    const raw = atob(str);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
    return out;
  }

  async function verifyTokenWeb(token) {
    const parts = String(token || "").trim().split(".");
    if (parts.length !== 2) return { state: "invalid", label: "令牌损坏", reason: "格式不对" };

    let body, sig;
    try {
      body = licDecode(parts[0]);
      sig = licDecode(parts[1]);
    } catch (e) {
      return { state: "invalid", label: "令牌无法解码", reason: "" };
    }

    if (!(global.crypto && global.crypto.subtle && global.crypto.subtle.importKey)) {
      return { state: "unknown", label: "无法校验", reason: "当前环境不支持 WebCrypto" };
    }

    let key;
    try {
      key = await global.crypto.subtle.importKey(
        "spki", fromB64(LIC_PUB_SPKI), { name: "Ed25519" }, false, ["verify"]
      );
      const ok = await global.crypto.subtle.verify({ name: "Ed25519" }, key, sig, body);
      if (!ok) return { state: "invalid", label: "签名无效", reason: "令牌不是本应用签发的" };
    } catch (e) {
      return { state: "unknown", label: "无法校验", reason: "当前 WebView 不支持 Ed25519" };
    }

    let payload;
    try {
      payload = JSON.parse(new TextDecoder().decode(body));
    } catch (e) {
      return { state: "invalid", label: "令牌损坏", reason: "内容无法解析" };
    }

    if (payload.app !== "zingdex") return { state: "invalid", label: "签名无效", reason: "不是本应用的令牌" };
    if (payload.group !== LIC_GROUP) return { state: "invalid", label: "分组不符", reason: "不属于 " + LIC_GROUP, payload };
    if (LIC_SEATS.indexOf(payload.seat) < 0) return { state: "invalid", label: "席位无效", reason: payload.seat, payload };

    const today = new Date().toISOString().slice(0, 10);
    if (payload.expires && payload.expires < today) {
      return { state: "expired", label: "已过期", reason: "有效期至 " + payload.expires, payload };
    }

    return { state: "ok", label: "官方签名", reason: "签名有效 · 文件完整性由 APK 签名保证", payload };
  }

  async function licenseStatus() {
    if (global.zingdex && typeof global.zingdex.license === "function") {
      try {
        return await global.zingdex.license();
      } catch (e) {
        /* 落到下面 */
      }
    }
    if (global.ZingdexHost && typeof global.ZingdexHost.licenseToken === "function") {
      let token = "";
      try {
        token = global.ZingdexHost.licenseToken() || "";
      } catch (e) {
        token = "";
      }
      if (!token) return { state: "unsigned", label: "未签名副本", reason: "没有找到授权令牌" };
      return verifyTokenWeb(token);
    }
    return { state: "unknown", label: "未运行在应用内", reason: "浏览器里没有令牌" };
  }

  const S = read();
  apply(S);

  // 首屏就按已保存的偏好应用一次（含 force-motion）
  try { apply(read()); } catch (e) { /* noop */ }

  global.TRSettings = {
    DEFAULTS,
    get: read,
    set,
    reset,
    apply,
    current: () => read(),
    licenseStatus,
    verifyTokenWeb
  };

  // 跟随系统主题时，系统切换要跟着变
  try {
    global.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (read().theme === "auto") apply(read());
    });
  } catch (e) {
    /* 老内核没有 addEventListener 版本，忽略 */
  }
})(window);
