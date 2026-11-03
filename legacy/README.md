# 历史实现 / Legacy

这里放的是**当前版本不再使用**、但保留下来供参考的实现。

## pyinstaller-windows/

早期 Windows 桌面版的打包方式：PyInstaller onefile + pywebview + 系统 WebView2。

| 文件 | 作用 |
|---|---|
| `main.py` | 应用入口，创建 pywebview 原生窗口 |
| `build_exe.sh` / `build_exe.bat` | PyInstaller 打包脚本 |
| `requirements.txt` | 当时的 Python 依赖 |

**为什么不再用**：WebView2 单文件包在冷启动时要解压站点资源，
首屏明显慢于 Electron 方案；且 pywebview 对窗口尺寸、DPI、原生菜单的控制不如 Electron。

**现在用什么**：`apps/desktop/`，Electron 打包，见 `build_desktop.sh`。

**还能用吗**：理论上可以，但未随 3.1 之后的版本验证。如果你需要更小的体积
（约 113 MB 单文件 vs Electron 解压后约 293 MB），值得一试——欢迎回报结果。

---

## 关于授权机制的代码

`LICENSING-LEGACY.md` 记录了 v0.0.1–v2.1.3 的授权界面现状。
授权相关代码已在 3.0 移除，不再随仓库提供。
