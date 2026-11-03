// 暴露给页面的原生能力。页面里用 window.zingdex 判断是否在桌面应用里。
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("zingdex", {
  isNative: true,
  platform: "windows",
  copy: (text) => ipcRenderer.invoke("copy", text),
  saveText: (filename, text) => ipcRenderer.invoke("save-text", filename, text),
  info: () => ipcRenderer.invoke("info"),
  saveSecret: (name, value) => ipcRenderer.invoke("save-secret", name, value),
  loadSecret: (name) => ipcRenderer.invoke("load-secret", name),
  clearSecret: (name) => ipcRenderer.invoke("clear-secret", name),
  openExternal: (url) => ipcRenderer.invoke("open-external", url),
  exportPdf: (opts) => ipcRenderer.invoke("export-pdf", opts),
  savePng: (b64, name) => ipcRenderer.invoke("save-png", b64, name),
  saveQr: () => ipcRenderer.invoke("save-qr"),
  saveDoc: () => ipcRenderer.invoke("save-doc"),
  setFullscreen: (on) => ipcRenderer.invoke("set-fullscreen", on),
  isFullscreen: () => ipcRenderer.invoke("is-fullscreen"),
  getStartup: () => ipcRenderer.invoke("startup-get"),
  setStartup: (on) => ipcRenderer.invoke("startup-set", on),
  mode: () => ipcRenderer.invoke("app-mode"),
  // 同步拿一次运行形态，页面加载时就要决定「有没有管理员模式」
  modeSync: ipcRenderer.sendSync("app-mode-sync"),
  appAction: (kind) => ipcRenderer.invoke("app-action", kind),
  onFullscreen: (cb) => {
    if (typeof cb !== "function") return;
    ipcRenderer.on("fullscreen-change", (_e, on) => cb(!!on));
  }
});
