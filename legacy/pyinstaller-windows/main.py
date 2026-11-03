# -*- coding: utf-8 -*-
"""
Zingdex 跃索 · 动效组件库 —— Windows 桌面应用

原生窗口（pywebview + WebView2），不打开浏览器，不访问网络。
所有页面、字体、图标、组件代码都在本地，断网可用。

提供给页面的接口（window.pywebview.api.*）
    copy(text)                 复制文本到系统剪贴板
    save_text(name, text)      另存为文本文件（原生保存对话框）
    export_bundle()            把全部组件导出成 zip（HTML/CSS/JS/提示词）
    open_folder(which)         打开数据目录 / 站点目录
    info()                     应用信息
"""

import ctypes
import json
import os
import sys
import traceback
import threading
import time
import zipfile
from ctypes import wintypes

import webview

from app_version import APP_NAME, DISPLAY_NAME, FULL_NAME, VERSION_NAME

WINDOW_SIZE = (1360, 900)


# --------------------------------------------------------------------------
# 路径
# --------------------------------------------------------------------------

def resource_root():
    return getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))


def site_dir():
    return os.path.join(resource_root(), "site")


def data_dir():
    base = os.environ.get("APPDATA") or os.path.expanduser("~")
    path = os.path.join(base, APP_NAME)
    os.makedirs(path, exist_ok=True)
    return path


def state_path():
    return os.path.join(data_dir(), "window.json")


def app_log_path():
    return os.path.join(data_dir(), "app.log")


def log(message):
    try:
        with open(app_log_path(), "a", encoding="utf-8") as fh:
            fh.write(time.strftime("%Y-%m-%d %H:%M:%S") + "  " + str(message) + "\n")
    except Exception:  # noqa: BLE001
        pass


def fatal(message):
    log("FATAL " + str(message).replace("\n", " | "))
    try:
        ctypes.windll.user32.MessageBoxW(0, message, "Zingdex 启动失败", 0x10)
    except Exception:  # noqa: BLE001
        pass

# --------------------------------------------------------------------------
# 剪贴板（ctypes，无第三方依赖）
# --------------------------------------------------------------------------

def set_clipboard(text):
    CF_UNICODETEXT = 13
    GMEM_MOVEABLE = 0x0002
    user32 = ctypes.windll.user32
    kernel32 = ctypes.windll.kernel32

    # 64 位必须声明返回类型，否则句柄被截断成 32 位，GlobalLock 会失败
    kernel32.GlobalAlloc.restype = ctypes.c_void_p
    kernel32.GlobalAlloc.argtypes = [wintypes.UINT, ctypes.c_size_t]
    kernel32.GlobalLock.restype = ctypes.c_void_p
    kernel32.GlobalLock.argtypes = [ctypes.c_void_p]
    kernel32.GlobalUnlock.argtypes = [ctypes.c_void_p]
    kernel32.GlobalFree.argtypes = [ctypes.c_void_p]
    user32.SetClipboardData.restype = ctypes.c_void_p
    user32.SetClipboardData.argtypes = [wintypes.UINT, ctypes.c_void_p]

    data = str(text).encode("utf-16-le") + b"\x00\x00"

    opened = False
    for _ in range(6):
        if user32.OpenClipboard(None):
            opened = True
            break
        time.sleep(0.02)
    if not opened:
        return False

    try:
        user32.EmptyClipboard()
        handle = kernel32.GlobalAlloc(GMEM_MOVEABLE, len(data))
        if not handle:
            return False
        ptr = kernel32.GlobalLock(handle)
        if not ptr:
            kernel32.GlobalFree(handle)
            return False
        ctypes.memmove(ptr, data, len(data))
        kernel32.GlobalUnlock(handle)
        user32.SetClipboardData(CF_UNICODETEXT, handle)
        return True
    finally:
        user32.CloseClipboard()


# --------------------------------------------------------------------------
# 原生保存对话框（GetSaveFileNameW）
# --------------------------------------------------------------------------

class OPENFILENAMEW(ctypes.Structure):
    _fields_ = [
        ("lStructSize", wintypes.DWORD),
        ("hwndOwner", wintypes.HWND),
        ("hInstance", wintypes.HINSTANCE),
        ("lpstrFilter", wintypes.LPCWSTR),
        ("lpstrCustomFilter", wintypes.LPWSTR),
        ("nMaxCustFilter", wintypes.DWORD),
        ("nFilterIndex", wintypes.DWORD),
        ("lpstrFile", wintypes.LPWSTR),
        ("nMaxFile", wintypes.DWORD),
        ("lpstrFileTitle", wintypes.LPWSTR),
        ("nMaxFileTitle", wintypes.DWORD),
        ("lpstrInitialDir", wintypes.LPCWSTR),
        ("lpstrTitle", wintypes.LPCWSTR),
        ("Flags", wintypes.DWORD),
        ("nFileOffset", wintypes.WORD),
        ("nFileExtension", wintypes.WORD),
        ("lpstrDefExt", wintypes.LPCWSTR),
        ("lCustData", wintypes.LPARAM),
        ("lpfnHook", wintypes.LPARAM),
        ("lpTemplateName", wintypes.LPCWSTR),
    ]


def save_dialog(default_name, title="保存文件", filter_text="所有文件\0*.*\0", ext="txt"):
    OFN_OVERWRITEPROMPT = 0x00000002
    OFN_PATHMUSTEXIST = 0x00000800
    OFN_EXPLORER = 0x00080000
    OFN_NOCHANGEDIR = 0x00000008

    buf = ctypes.create_unicode_buffer(1024)
    buf.value = default_name

    ofn = OPENFILENAMEW()
    ofn.lStructSize = ctypes.sizeof(OPENFILENAMEW)
    ofn.lpstrFilter = filter_text
    ofn.lpstrFile = ctypes.cast(buf, wintypes.LPWSTR)
    ofn.nMaxFile = 1024
    ofn.lpstrTitle = title
    ofn.lpstrDefExt = ext
    ofn.Flags = OFN_OVERWRITEPROMPT | OFN_PATHMUSTEXIST | OFN_EXPLORER | OFN_NOCHANGEDIR

    if ctypes.windll.comdlg32.GetSaveFileNameW(ctypes.byref(ofn)):
        return buf.value
    return None


# --------------------------------------------------------------------------
# 暴露给页面的接口
# --------------------------------------------------------------------------

class Api:
    def __init__(self):
        self.window = None

    def bind(self, window):
        self.window = window

    # -- 剪贴板 ------------------------------------------------------------
    def copy(self, text):
        try:
            ok = set_clipboard(text)
            if not ok:
                raise OSError("clipboard busy")
            return {"ok": True}
        except Exception as exc:  # noqa: BLE001
            return {"ok": False, "error": str(exc)}

    # -- 另存为 ------------------------------------------------------------
    def save_text(self, filename, text):
        try:
            path = save_dialog(
                filename or "zingdex.txt",
                title="保存组件代码",
                filter_text="HTML 文件\0*.html\0文本文件\0*.txt\0所有文件\0*.*\0",
                ext="html",
            )
            if not path:
                return {"ok": False, "cancelled": True}
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(text)
            return {"ok": True, "path": path}
        except Exception as exc:  # noqa: BLE001
            return {"ok": False, "error": str(exc)}

    # -- 导出全部组件 ------------------------------------------------------
    def export_bundle(self):
        try:
            if not self.window:
                return {"ok": False, "error": "window not ready"}

            payload = self.window.evaluate_js(
                "JSON.stringify(Zingdex.EFFECTS.map(function(e){"
                "  var c = Zingdex.build(e, {});"
                "  return {id:e.id, zh:e.zh, en:e.en, scene:e.scene, desc:e.desc,"
                "          duration:e.duration, easing:e.easing,"
                "          html:c.html, css:c.css, js:c.js,"
                "          prompt:Zingdex.code.prompt(e,c),"
                "          full:Zingdex.code.full(e,c),"
                "          react:Zingdex.code.react(e,c),"
                "          vue:Zingdex.code.vue(e,c),"
                "          wx:Zingdex.code.wx(e,c)};"
                "}))"
            )
            items = json.loads(payload or "[]")
            if not items:
                return {"ok": False, "error": "no components"}

            path = save_dialog(
                "Zingdex-%s-components.zip" % VERSION_NAME,
                title="导出全部组件",
                filter_text="ZIP 压缩包\0*.zip\0",
                ext="zip",
            )
            if not path:
                return {"ok": False, "cancelled": True}

            with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
                index = ["# Zingdex 组件包 · v%s" % VERSION_NAME, ""]
                index.append("共 %d 个组件，每个目录下包含：" % len(items))
                index.append("- index.html：可直接双击运行")
                index.append("- styles.css / script.js：拆开接进项目")
                index.append("- prompt.md：AI 提示词")
                index.append("- react.jsx / vue.vue / mini-program.txt：框架用法")
                index.append("")
                for item in items:
                    base = "components/%s-%s" % (item["id"], item["scene"])
                    z.writestr(base + "/index.html", item.get("full", ""))
                    z.writestr(base + "/styles.css", item.get("css", ""))
                    z.writestr(base + "/script.js", item.get("js", "") or "/* 无需 JavaScript */")
                    z.writestr(base + "/prompt.md", item.get("prompt", ""))
                    z.writestr(base + "/react.jsx", item.get("react", ""))
                    z.writestr(base + "/vue.vue", item.get("vue", ""))
                    z.writestr(base + "/mini-program.txt", item.get("wx", ""))
                    index.append("- %s  %s / %s  (%sms)" % (item["id"], item["zh"], item["scene"], item["duration"]))
                z.writestr("README.md", "\n".join(index))

            return {"ok": True, "path": path, "count": len(items)}
        except Exception as exc:  # noqa: BLE001
            return {"ok": False, "error": str(exc)}

    # -- 目录 --------------------------------------------------------------
    def open_folder(self, which="site"):
        try:
            target = data_dir() if which == "data" else site_dir()
            os.startfile(target)  # noqa: S606
            return {"ok": True}
        except Exception as exc:  # noqa: BLE001
            return {"ok": False, "error": str(exc)}

    def info(self):
        return {
            "name": FULL_NAME,
            "version": VERSION_NAME,
            "platform": sys.platform,
            "offline": True,
        }


# --------------------------------------------------------------------------
# 窗口
# --------------------------------------------------------------------------

def dark_titlebar(window):
    """Windows 10/11 深色标题栏（按窗口标题找 HWND，兼容 19044 LTSC）。"""
    try:
        hwnd = ctypes.windll.user32.FindWindowW(None, window.title)
        if not hwnd:
            return
        value = ctypes.c_int(1)
        for attr in (20, 19):  # DWMWA_USE_IMMERSIVE_DARK_MODE 及其旧编号
            ctypes.windll.dwmapi.DwmSetWindowAttribute(
                hwnd, attr, ctypes.byref(value), ctypes.sizeof(value)
            )
    except Exception:  # noqa: BLE001
        pass


def load_state():
    try:
        with open(state_path(), "r", encoding="utf-8") as fh:
            data = json.load(fh)
        w = int(data.get("width", WINDOW_SIZE[0]))
        h = int(data.get("height", WINDOW_SIZE[1]))
        return max(960, w), max(640, h)
    except Exception:  # noqa: BLE001
        return WINDOW_SIZE


def save_state(window):
    try:
        with open(state_path(), "w", encoding="utf-8") as fh:
            json.dump({"width": window.width, "height": window.height}, fh)
    except Exception:  # noqa: BLE001
        pass


def run_selftest(window, api):
    """无头自检：打开组件详情页，抓关键 DOM 与接口结果后退出。"""
    time.sleep(3.5)
    result = {}
    try:
        result["title"] = window.evaluate_js("document.querySelector('[data-title]').textContent")
        result["tabs"] = window.evaluate_js("document.querySelectorAll('.codetab').length")
        result["stage_len"] = window.evaluate_js("(document.querySelector('[data-stage]')||{}).innerHTML ? document.querySelector('[data-stage]').innerHTML.length : 0")
        result["api"] = bool(window.evaluate_js("!!(window.pywebview && window.pywebview.api)"))
        result["copy"] = api.copy("selftest")
        result["effects"] = window.evaluate_js("Zingdex.EFFECTS.length")
    except Exception as exc:  # noqa: BLE001
        result["error"] = repr(exc)
        log("selftest error: " + traceback.format_exc())
    try:
        with open(os.path.join(data_dir(), "selftest.json"), "w", encoding="utf-8") as fh:
            json.dump(result, fh, ensure_ascii=False, indent=2)
    except Exception:  # noqa: BLE001
        pass
    log("selftest done: " + json.dumps(result, ensure_ascii=False))
    # 直接退出，避免 pythonnet 在非主线程销毁窗口时卡住
    time.sleep(0.3)
    os._exit(0)


def main():
    log("boot v%s exe=%s" % (VERSION_NAME, sys.executable))
    api = Api()
    width, height = load_state()

    selftest = "--selftest" in sys.argv
    start_page = "detail.html?id=glass-panel" if selftest else "index.html"

    window = webview.create_window(
        FULL_NAME,
        url=os.path.join(site_dir(), start_page),
        js_api=api,
        width=width,
        height=height,
        min_size=(980, 660),
        background_color="#0A0B0D",
        text_select=True,
    )
    api.bind(window)

    def on_loaded():
        dark_titlebar(window)

    window.events.loaded += on_loaded
    window.events.closing += lambda: save_state(window)

    if selftest:
        threading.Thread(target=run_selftest, args=(window, api), daemon=True).start()

    webview.start(debug="--debug" in sys.argv, gui="edgechromium")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        fatal(traceback.format_exc()[-1600:])
