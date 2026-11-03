# 使用手册 / Manual

Zingdex · 跃索 3.1.1 · 安卓 APK + Windows 便携版 + 网页版

---

## 一、安装

**安卓**

1. 下载 `Zingdex-3.1.1-android.apk`
2. 点击安装；提示「未知来源」时允许一次
3. 要求 Android 6.0 及以上；不申请网络权限，装完离线可用

**Windows**

1. 下载 `Zingdex-3.1.1-windows-portable.zip`
2. 解压到任意目录，双击 `Zingdex.exe`
3. 依赖系统自带的 Edge / Chromium 内核（Win10、Win11 均有）

**网页**

用浏览器打开 `apps/web/index.html` 即可，不需要服务器。

---

## 二、找动效

| 方式 | 怎么做 |
|---|---|
| 搜索 | 首页搜索框输入「商品列表」「加载」「卡片」 |
| 筛选 | 按领域 / 设备 / 类别组合筛选 |
| 浏览 | 直接翻场景列表，点开看实时预览 |

搜不到时：换更短的词 → 去掉筛选条件 → 用命令行 `--list` 看实际编号。

---

## 三、取代码

每条动效的详情页有「复制」按钮，复制的是 **HTML + CSS + JS** 三件套。
也可以走命令行：

```bash
node skill/tools/extract-motion.js fx-s001-07          # 人读格式
node skill/tools/extract-motion.js fx-s001-07 --json   # 机器读格式
```

---

## 四、换设备

同一动效在不同设备上的时长与位移不同：

| 设备 | 时长系数 | 位移系数 |
|---|---|---|
| 手表 | ×0.62 | ×0.55 |
| 车机 | ×0.75 | ×0.70 |
| 手机 | ×0.82 | ×0.72 |
| 手机（大屏） | ×0.88 | ×0.80 |
| 平板 | ×1.00 | ×1.00 |
| 桌面 | ×1.00 | ×1.00 |
| 桌面（超宽） | ×1.08 | ×1.18 |
| 自助机 | ×1.00 | ×1.10 |

命令行会自动换算：

```bash
node packages/cli/bin/zingdex.js get fx-s001-07 --device watch
```

---

## 五、常见问题

**Q：复制了 CSS，元素不动？**
A：少了 HTML 结构或关键帧定义。三件套要一起取。

**Q：动效一闪就没了？**
A：入场动画默认只播一次。需要循环请显式改 `animation-iteration-count`，
但同屏循环不要超过 2 个。

**Q：手表上卡顿？**
A：手表禁用 canvas、blur、无限循环。换 CSS 实现。

**Q：能商用吗？**
A：能。数据与文档是 CC BY 4.0，署名即可，详见 `LICENSE-DATA`。

**Q：能改名换皮发布吗？**
A：能，但不要用「Zingdex」「跃索」当你的产品名，也不要沿用官方图标。
详见 `TRADEMARK.md`。

**Q：为什么包名是 `com.transientlab.motion`？**
A：历史原因。改名不改包名，是为了让老用户能覆盖升级、不丢数据。

---

## 六、卸载

**安卓**：长按图标 → 卸载。不残留数据。
**Windows**：直接删掉解压出来的文件夹。便携版不写注册表、不装服务。

---

## 七、反馈

邮箱：2083825368@qq.com
问题与建议：[GitHub Issues](https://github.com/Z-20user/Zingdex/issues)
