// Zingdex 跃索 —— Electron 桌面外壳
// 原生窗口，加载内置站点，不联网、不打开浏览器。

const { app, BrowserWindow, ipcMain, clipboard, dialog, shell, Menu, session, safeStorage } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { execFileSync } = require("child_process");
const update = require("./update");

const APP_NAME = "Zingdex 跃索 · 动效组件库";
const SITE = path.join(__dirname, "site");

// 数据和程序放在一起：拷走文件夹就带走数据，删掉目录就等于清干净。
// 写不进去（例如装在只读目录）就退回系统默认位置，不让启动失败。
try {
  const dataDir = path.join(path.dirname(app.getPath("exe")), "data");
  fs.mkdirSync(dataDir, { recursive: true });
  fs.accessSync(dataDir, fs.constants.W_OK);
  app.setPath("userData", dataDir);
} catch (e) {
  /* 保持 Electron 默认的 userData */
}
const STATE = path.join(app.getPath("userData"), "window.json");
const PREFS = path.join(app.getPath("userData"), "prefs.json");

let win = null;
let tray = null;
let quitting = false;

/* 关窗口收进托盘：这样「关闭窗口」不等于「退出应用」，
   管理员模式这种只在本次运行内有效的状态才不会因为顺手关个窗口就丢掉。
   托盘建不起来（比如缺少图标）就退回原来的行为，直接退出，免得窗口藏没了找不回来。 */
function ensureTray() {
  if (tray) return true;
  try {
    const { Tray, Menu } = require("electron");
    tray = new Tray(path.join(__dirname, "icon.ico"));
    tray.setToolTip(APP_NAME);
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: "打开主界面", click: () => { if (win && !win.isDestroyed()) { win.show(); win.focus(); } } },
      { type: "separator" },
      { label: "退出应用", click: () => { quitting = true; app.quit(); } }
    ]));
    tray.on("double-click", () => { if (win && !win.isDestroyed()) { win.show(); win.focus(); } });
    return true;
  } catch (e) {
    tray = null;
    return false;
  }
}

function loadState() {
  try {
    const s = JSON.parse(fs.readFileSync(STATE, "utf8"));
    return {
      width: Math.max(1024, s.width || 1440),
      height: Math.max(680, s.height || 920)
    };
  } catch (e) {
    return { width: 1440, height: 920 };
  }
}

function loadPrefs() {
  try {
    const p = JSON.parse(fs.readFileSync(PREFS, "utf8"));
    return { fullscreen: p.fullscreen !== false };
  } catch (e) {
    return { fullscreen: true };
  }
}

function savePrefs(patch) {
  try {
    const next = Object.assign(loadPrefs(), patch || {});
    fs.mkdirSync(path.dirname(PREFS), { recursive: true });
    fs.writeFileSync(PREFS, JSON.stringify(next));
    return next;
  } catch (e) {
    return loadPrefs();
  }
}

function saveState() {
  if (!win) return;
  try {
    fs.mkdirSync(path.dirname(STATE), { recursive: true });
    fs.writeFileSync(STATE, JSON.stringify(win.getBounds()));
  } catch (e) {
    /* 忽略 */
  }
}

function createWindow() {
  const size = loadState();
  const prefs = loadPrefs();
  const selftest = process.argv.includes("--selftest");

  win = new BrowserWindow({
    width: size.width,
    height: size.height,
    // 自检时不要抢占全屏，避免构建过程中打断使用者
    fullscreen: selftest ? false : prefs.fullscreen,
    minWidth: 1024,
    minHeight: 680,
    title: APP_NAME,
    backgroundColor: "#0A0B0D",
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false,
      // 把 V8 编译结果缓存到磁盘：第二次启动省掉重新编译 700 KB 脚本
      v8CacheOptions: "code",
      enableWebSQL: false,
      backgroundThrottling: true,
      // 窗口还没显示前不渲染，配合 ready-to-show 让首屏更快
      paintWhenInitiallyHidden: false
    }
  });

  Menu.setApplicationMenu(null);
  win.loadFile(path.join(SITE, "index.html"));

  win.once("ready-to-show", () => {
    if (selftest) return;           // 自检不弹窗，后台跑完就退出
    win.show();
    if (prefs.fullscreen) win.setFullScreen(true);
  });

  // F11 切换全屏；全屏时 Esc 退出（不拦窗口模式下其它 Esc 用途）
  win.webContents.on("before-input-event", (event, input) => {
    if (input.type !== "keyDown") return;

    // 反调试：屏蔽 F12 与 Ctrl/Cmd+Shift+I/J/C，生产构建不提供开发者工具入口
    const k = String(input.key || "").toLowerCase();
    const mod = input.control || input.meta;
    if (k === "f12" || (mod && input.shift && (k === "i" || k === "j" || k === "c"))) {
      event.preventDefault();
      return;
    }

    if (input.key === "F11") {
      event.preventDefault();
      win.setFullScreen(!win.isFullScreen());
    } else if (input.key === "Escape" && win.isFullScreen()) {
      event.preventDefault();
      win.setFullScreen(false);
    }
  });

  // 万一开发者工具被其它途径打开，立刻关掉
  win.webContents.on("devtools-opened", () => {
    try { win.webContents.closeDevTools(); } catch (e) { /* noop */ }
  });

  const notifyFs = () => {
    if (!win || win.isDestroyed()) return;
    try {
      win.webContents.send("fullscreen-change", win.isFullScreen());
    } catch (e) {
      /* 页面还没加载完，忽略 */
    }
  };
  win.on("enter-full-screen", notifyFs);
  win.on("leave-full-screen", notifyFs);

  // 站内跳转留在应用里，站外一律交给系统浏览器
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("file://")) {
      event.preventDefault();
      if (/^https?:/i.test(url)) shell.openExternal(url);
    }
  });

  if (process.argv.includes("--selftest")) runSelftest();

  win.on("resize", saveState);
  win.on("close", (e) => {
    saveState();
    // 关窗口不等于退出应用：收进托盘继续跑，管理员模式这类「本次运行内有效」的状态才保得住
    if (!quitting && ensureTray()) {
      e.preventDefault();
      win.hide();
    }
  });
  win.on("closed", () => { win = null; });
}

/* ---------------- 自检 ---------------- */

async function runSelftest() {
  const out = path.join(app.getPath("userData"), "selftest.json");
  const stageFile = path.join(app.getPath("userData"), "selftest-stage.txt");
  const stage = (name) => {
    try { fs.writeFileSync(stageFile, name + " " + new Date().toISOString() + "\n", { flag: "a" }); } catch (e) { /* noop */ }
  };
  try { fs.writeFileSync(stageFile, ""); } catch (e) { /* noop */ }
  try {
    stage("load-library");
    await win.loadFile(path.join(SITE, "library.html"));
    await new Promise((r) => setTimeout(r, 1600));

    stage("renderer");
    const result = await win.webContents.executeJavaScript(`(async () => {
      const out = {};
      try {
      out.title = document.title;
      out.api = !!(window.zingdex && window.zingdex.copy);
      out.tabs = [...document.querySelectorAll('.libtab')].map(t => t.dataset.group);
      out.baseMounted = document.querySelectorAll('[data-mount] > *').length;
      out.items = window.LIB ? window.LIB.items.length : 0;
      out.groups = window.LIB ? window.LIB.groups.map(g => g.key + ':' + g.count).join(' ') : '';
      const specTab = [...document.querySelectorAll('.libtab')].find(t => t.dataset.group === 'specs');
      if (specTab) { specTab.click(); await new Promise(r => setTimeout(r, 900)); }
      out.specCards = document.querySelectorAll('.lib-card').length;
      out.specMounted = document.querySelectorAll('[data-mounted]').length;
      out.chunks = performance.getEntriesByType('resource').filter(r => r.name.indexOf('/lib/s') >= 0).length;
      const res = await window.zingdex.copy('selftest-clip');
      out.copy = res;
      out.fullscreenAtStart = await window.zingdex.isFullscreen();
      await window.zingdex.setFullscreen(false);
      await new Promise(r => setTimeout(r, 400));
      out.afterEsc = await window.zingdex.isFullscreen();
      await window.zingdex.setFullscreen(true);
      out.url = location.pathname.split('/').pop();
      } catch (e) { out.error = String((e && e.stack) || e); }
      return out;
    })()`, true);

    // 顺带验证 printToPDF 可用（正式导出走 IPC + 保存对话框）
    stage("pdf");
    try {
      const pdf = await win.webContents.printToPDF({ printBackground: true, pageSize: "A4" });
      result.pdfBytes = pdf.length;
    } catch (e) {
      result.pdfBytes = 0;
    }

    // 再导一份带封面的文档页，落盘供人工核对排版
    stage("doc-pdf");
    try {
      await win.loadFile(path.join(SITE, "license.html"));
      await new Promise((r) => setTimeout(r, 900));
      result.bgProbe = await win.webContents.executeJavaScript(
        'document.documentElement.style.background="#fff";' +
        'document.body.style.background="#fff";' +
        'document.documentElement.style.colorScheme="light";' +
        'buildPrintFront("许可协议","2026-11-01 14:43:17","1.6.6");' +
        'getComputedStyle(document.documentElement).backgroundColor', true);
      win.setBackgroundColor("#FFFFFF");
      const doc = await win.webContents.printToPDF({
        printBackground: true,
        pageSize: "A4",
        displayHeaderFooter: true,
        headerTemplate: "<div></div>",
        footerTemplate: '<div style="width:100%;padding:0 14mm;font-size:8px;color:#7A7F72;' +
          'display:flex;justify-content:space-between;"><span>Zingdex · 许可协议</span>' +
          '<span>导出时间 2026-11-01 14:43:17</span>' +
          '<span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
        margins: { top: 0.55, bottom: 0.62, left: 0.5, right: 0.5 }
      });
      fs.writeFileSync(path.join(app.getPath("userData"), "selftest-doc.pdf"), doc);
      result.docPdfBytes = doc.length;
      win.setBackgroundColor("#0A0B0D");
    } catch (e) {
      result.docPdfBytes = 0;
    }

    stage("write");
    fs.writeFileSync(out, JSON.stringify(result, null, 2));
  } catch (err) {
    try { fs.writeFileSync(out, JSON.stringify({ error: String(err), stage: fs.readFileSync(stageFile, "utf8") }, null, 2)); } catch (e) { /* noop */ }
  }
  app.quit();
}

/* ---------------- 给页面的接口 ---------------- */

ipcMain.handle("copy", (_e, text) => {
  try {
    clipboard.writeText(String(text));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
});

ipcMain.handle("save-text", async (_e, filename, text) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: "保存组件代码",
      defaultPath: filename || "zingdex.html",
      filters: [
        { name: "HTML", extensions: ["html"] },
        { name: "文本", extensions: ["txt", "css", "js"] },
        { name: "全部", extensions: ["*"] }
      ]
    });
    if (canceled || !filePath) return { ok: false, cancelled: true };
    fs.writeFileSync(filePath, String(text), "utf8");
    return { ok: true, path: filePath };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
});

ipcMain.handle("info", () => ({ name: APP_NAME, version: app.getVersion(), platform: process.platform }));

/* ---------------- 机密存取（偏好设置） ----------------
   优先用系统级加密：Windows 上是 DPAPI，只在这台机器的这个账户下能解。
   拷走文件到别的电脑 = 解不开。
--------------------------------------------------------- */

function secretFile(name) {
  return path.join(app.getPath("userData"), "secret-" + String(name).replace(/[^a-z0-9_-]/gi, "") + ".bin");
}

ipcMain.handle("save-secret", (_e, name, value) => {
  try {
    const file = secretFile(name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    if (safeStorage && safeStorage.isEncryptionAvailable()) {
      fs.writeFileSync(file, safeStorage.encryptString(String(value)));
    } else {
      fs.writeFileSync(file, Buffer.from(String(value), "utf8"));
    }
    return true;
  } catch (err) {
    return false;
  }
});

ipcMain.handle("load-secret", (_e, name) => {
  try {
    const file = secretFile(name);
    if (!fs.existsSync(file)) return "";
    const buf = fs.readFileSync(file);
    if (safeStorage && safeStorage.isEncryptionAvailable()) {
      try {
        return safeStorage.decryptString(buf);
      } catch (e) {
        return "";
      }
    }
    return buf.toString("utf8");
  } catch (err) {
    return "";
  }
});

ipcMain.handle("clear-secret", (_e, name) => {
  try {
    const file = secretFile(name);
    if (fs.existsSync(file)) fs.unlinkSync(file);
    return true;
  } catch (err) {
    return false;
  }
});

/* 保存图片（二维码）：让用户选位置，写 PNG */
ipcMain.handle("save-png", async (_e, base64, filename) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: "保存二维码",
      defaultPath: filename || "qr.png",
      filters: [{ name: "PNG 图片", extensions: ["png"] }]
    });
    if (canceled || !filePath) return { ok: false, cancelled: true };
    const raw = String(base64 || "").replace(/^data:image\/\w+;base64,/, "");
    fs.writeFileSync(filePath, Buffer.from(raw, "base64"));
    return { ok: true, filePath };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
});

/* 保存二维码：直接复制站点里的 PNG，避免页面侧读 file:// 被拦 */
ipcMain.handle("save-qr", async () => {
  try {
    const src = path.join(SITE, "assets", "contact-qr.png");
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: "保存二维码",
      defaultPath: path.join(app.getPath("pictures"), "Zingdex-联系管理员.png"),
      filters: [{ name: "PNG 图片", extensions: ["png"] }]
    });
    if (canceled || !filePath) return { ok: false, cancelled: true };
    fs.copyFileSync(src, filePath);
    return { ok: true, filePath };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
});

/* 导出内置的使用须知 PDF：直接复制资源文件，保证两端内容一致 */
ipcMain.handle("save-doc", async () => {
  try {
    const src = path.join(SITE, "assets", "terms.pdf");
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: "导出使用须知",
      defaultPath: path.join(app.getPath("documents"), "Zingdex-使用须知.pdf"),
      filters: [{ name: "PDF 文档", extensions: ["pdf"] }]
    });
    if (canceled || !filePath) return { ok: false, cancelled: true };
    fs.copyFileSync(src, filePath);
    return { ok: true, filePath };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
});

ipcMain.handle("set-fullscreen", (_e, on) => {
  if (!win || win.isDestroyed()) return { ok: false };
  const want = !!on;
  win.setFullScreen(want);
  savePrefs({ fullscreen: want });
  return { ok: true, fullscreen: win.isFullScreen() };
});

ipcMain.handle("is-fullscreen", () => (win && !win.isDestroyed() ? win.isFullScreen() : false));

/* ---------- 开机自启动 ----------
   直接读写 HKCU 的 Run 项，不需要管理员权限，也不会弹 UAC。
   不用 Electron 的 setLoginItemSettings：它按应用名去删，Windows 上删不干净
   也不报错，界面会一直停在「已加入」。这里以注册表实际值为准。 */
const RUN_KEY = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run";
const RUN_NAME = "Zingdex";

function runValue() {
  try {
    // reg.exe 按系统代码页输出，路径里有中文时按 UTF-8 解会乱码，
    // 乱码后就和 execPath 比不上，界面会误报「指向旧位置」。
    const buf = execFileSync("reg", ["query", RUN_KEY, "/v", RUN_NAME], {
      windowsHide: true, stdio: ["ignore", "pipe", "ignore"]
    });
    let out = "";
    try { out = new TextDecoder("gbk").decode(buf); }
    catch (e) { out = buf.toString("utf8"); }
    const m = /REG_\w+\s+(.+)/.exec(out);
    return m ? m[1].trim() : "";
  } catch (e) {
    return ""; // 查不到就是不存在的项
  }
}

function runState() {
  const v = runValue();
  if (!v) return { on: false, path: "", stale: false };
  const norm = (s) => s.replace(/^"|"$/g, "").trim().toLowerCase();
  const same = norm(v) === norm(process.execPath) || norm(v).indexOf(norm(process.execPath)) >= 0;
  return { on: same, path: v, stale: !same };
}

ipcMain.handle("startup-get", () => {
  try {
    return Object.assign({ ok: true }, runState());
  } catch (e) {
    return { ok: false, on: false, reason: String((e && e.message) || e) };
  }
});

ipcMain.handle("startup-set", (_e, on) => {
  try {
    if (on) {
      execFileSync("reg", ["add", RUN_KEY, "/v", RUN_NAME, "/t", "REG_SZ",
        "/d", '"' + process.execPath + '"', "/f"],
        { windowsHide: true, stdio: "ignore" });
    } else {
      execFileSync("reg", ["delete", RUN_KEY, "/v", RUN_NAME, "/f"],
        { windowsHide: true, stdio: "ignore" });
    }
    return Object.assign({ ok: true }, runState());
  } catch (e) {
    return Object.assign({ ok: false, reason: String((e && e.message) || e) }, runState());
  }
});

/* ---------- 卸载 / 一键清除 ----------
   安装版旁边有 Uninstall.exe，便携版旁边有「清除便携版数据.bat」。
   两个都是先让用户确认，再执行；执行前把本进程关掉，免得文件被占用删不掉。 */

function appMode() {
  const dir = path.dirname(app.getPath("exe"));
  return fs.existsSync(path.join(dir, "Uninstall.exe")) ? "installed" : "portable";
}

ipcMain.handle("app-mode", () => appMode());
ipcMain.on("app-mode-sync", (e) => { e.returnValue = appMode(); });

ipcMain.handle("app-action", async (_e, kind) => {
  const { spawn } = require("child_process");
  const dir = path.dirname(app.getPath("exe"));
  try {
    if (kind === "uninstall") {
      const uni = path.join(dir, "Uninstall.exe");
      if (!fs.existsSync(uni)) return { ok: false, error: "这个位置没有 Uninstall.exe，请手动删除程序文件夹。" };
      spawn(uni, [], { detached: true, stdio: "ignore" }).unref();
      setTimeout(() => app.quit(), 200);
      return { ok: true };
    }
    if (kind === "clear-data") {
      const bat = path.join(dir, "清除便携版数据.bat");
      if (!fs.existsSync(bat)) {
        // 没带脚本就自己删（数据目录不在程序文件夹里，可以直接删）
        const roaming = path.join(app.getPath("appData"), "Zingdex");
        const local = path.join(app.getPath("userData"));
        try { fs.rmSync(roaming, { recursive: true, force: true }); } catch (e) { /* 忽略 */ }
        setTimeout(() => {
          try { fs.rmSync(local, { recursive: true, force: true }); } catch (e) { /* 忽略 */ }
          app.quit();
        }, 200);
        return { ok: true };
      }
      // 用 cmd 起脚本，脚本自己会等本进程退出再删
      spawn("cmd.exe", ["/c", "start", "\"\"", bat], { detached: true, stdio: "ignore", windowsVerbatimArguments: true }).unref();
      setTimeout(() => app.quit(), 400);
      return { ok: true };
    }
    return { ok: false, error: "未知操作：" + kind };
  } catch (e) {
    return { ok: false, error: String((e && e.message) || e) };
  }
});

/* 导出当前页面为 PDF（A4，含背景） */
ipcMain.handle("export-pdf", async (_e, opts) => {
  try {
    if (!win || win.isDestroyed()) return { ok: false, error: "no-window" };
    const o = typeof opts === "string" ? { filename: opts } : (opts || {});
    const name = String(o.filename || "Zingdex.pdf");
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: "导出 PDF",
      defaultPath: name,
      filters: [{ name: "PDF", extensions: ["pdf"] }]
    });
    if (canceled || !filePath) return { ok: false, cancelled: true };

    const footer = o.footer
      ? '<div style="width:100%;padding:0 14mm;font-family:Helvetica,Arial,sans-serif;' +
        'font-size:8px;color:#7A7F72;display:flex;justify-content:space-between;">' +
        '<span>' + o.footer.left + '</span>' +
        '<span style="margin-left:auto">' + o.footer.right + '</span>' +
        '<span style="margin-left:18px"><span class="pageNumber"></span> / <span class="totalPages"></span></span>' +
        '</div>'
      : "";

    win.setBackgroundColor("#FFFFFF");
    const data = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: "A4",
      displayHeaderFooter: !!footer,
      headerTemplate: "<div></div>",
      footerTemplate: footer,
      margins: footer
        ? { top: 0.55, bottom: 0.62, left: 0.5, right: 0.5 }
        : { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 }
    });
    fs.writeFileSync(filePath, data);
    win.setBackgroundColor("#0A0B0D");
    return { ok: true, path: filePath };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
});

/* 只允许 http/https 外链走系统默认浏览器 */
ipcMain.handle("open-external", async (_e, url) => {
  try {
    const u = String(url || "");
    if (!/^https?:\/\//i.test(u)) return { ok: false, error: "blocked" };
    await shell.openExternal(u);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
});


/* ---------------- 更新检查 ---------------- */

/* 只提示、不自动下载。页面层的网络请求被屏蔽，这里走主进程的 Node https。
   离线、超时、DNS 失败一律静默，不阻塞启动。 */
async function checkForUpdate() {
  if (!app.isPackaged) return;
  if (process.argv.includes("--selftest") || process.argv.includes("--no-update-check")) return;

  try {
    const r = await update.check({ current: app.getVersion() });
    if (!r.update || !r.url) return;

    const opts = {
      type: "info",
      title: "发现新版本",
      message: `Zingdex ${r.latest} 可用`,
      detail: `当前版本 ${r.current}。${r.notes ? "\n\n" + r.notes : ""}\n\n下载后覆盖安装即可，授权与设置会保留。`,
      buttons: ["去下载", "稍后"],
      defaultId: 0,
      cancelId: 1,
      noLink: true
    };

    const res = win && !win.isDestroyed()
      ? await dialog.showMessageBox(win, opts)
      : await dialog.showMessageBox(opts);
    if (res.response === 0) await shell.openExternal(r.url);
  } catch (e) {
    /* 离线场景下这是常态，不提示 */
  }
}

/* ---------------- 生命周期 ---------------- */

app.whenReady().then(() => {
  app.setAppUserModelId("com.zingdex.motion.desktop");

  // 纯离线应用不需要任何浏览器权限：一律拒绝，少一条被利用的路径
  try {
    session.defaultSession.setPermissionRequestHandler((wc, permission, callback) => callback(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    session.defaultSession.webRequest.onBeforeRequest({ urls: ["http://*/*", "https://*/*", "ws://*/*", "wss://*/*"] }, (details, cb) => {
      cb({ cancel: true });
    });
  } catch (e) {
    /* 旧版 Electron 没有这些 API，忽略 */
  }

  createWindow();
  setTimeout(checkForUpdate, 3000);
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("before-quit", () => { quitting = true; });
app.on("window-all-closed", () => { if (quitting) app.quit(); });
