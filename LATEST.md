# 最新版 · TRANSIENT 瞬态 2.1.5

> 这份文件是**入口**：人和 AI 都先读它，再按下面对应的路径往下走。

---

## 一、这一版是什么

| 项 | 值 |
|---|---|
| 显示名 | 瞬态 |
| 版本 | **2.1.5** |
| Android versionCode | 82 |
| 包名 | `com.transientlab.motion` |
| 最低系统 | Android 6.0（API 23） |
| 目标系统 | Android 14（API 34） |
| 体积 | 2.5 MB（APK）· 293 MB（Windows 便携版） |
| 构建日期 | 2026-11-02 |
| 下载 | Releases → `v2.1.5` → `transient-2.1.5-android.apk` / `transient-2.1.5-win-portable.zip` |

**内容规模**

- 组件 **20,000** 条
- 特效基底 **500** 个（18 族）
- 场景 **201** 个
- 覆盖 **11** 类设备
- 完全离线，不申请网络权限

**2.0.0 → 2.1.5 没有逐版变更记录**（快速迭代期）。
已知的是：2.1.4 起桌面端合并为便携版，不再单独出安装包；要安装版请用 1.12.43。

---

## 二、如果你是 AI，按这四步走

### 第 1 步：读技能总纲

[`skill/SKILL.md`](skill/SKILL.md) —— 里面定义了数据模型、取用流程、交付标准。

### 第 2 步：按检索手册查

[`skill/references/02-retrieval.md`](skill/references/02-retrieval.md) —— 规定了检索顺序、
关键词写法、查不到时的逐级降级。**不要跳过这一步直接猜编号。**

### 第 3 步：用工具取数据

```bash
node skill/tools/find-motion.js  <库目录> "商品列表" --device phone
node skill/tools/extract-motion.js <库目录> enter-01
node skill/tools/extract-motion.js <库目录> --list
```

- `find-motion` → 给出场景与条目（`fx-...`）
- `extract-motion` → 按特效编号取 HTML / CSS / JS 三件套

### 第 4 步：按设备规则适配

[`skill/references/04-device-rules.md`](skill/references/04-device-rules.md) —— 每类设备的
时长系数、位移系数、并发上限与禁用项。**照搬手机参数到大屏或车机，等于没适配。**

---

## 三、如果你是人，按这三步用

1. **装**：下载 APK → 安装 → 允许一次「未知来源」
2. **找**：首页搜索框输入「商品列表」「加载」「卡片」这类词，或用分类与设备筛选
3. **取**：点开任意一条 → 看它真的在动 → 右上角「复制」拿代码

Windows 用户：下载 `v1.12.43` 的安装包，双击安装；便携版解压后整目录使用。

---

## 四、文档地图

| 文件 | 给谁 | 内容 |
|---|---|---|
| `LATEST.md`（本文） | 人 + AI | 最新版入口 |
| [`skill/SKILL.md`](skill/SKILL.md) | AI | 技能总纲：模型、流程、标准 |
| [`skill/QUICKSTART.md`](skill/QUICKSTART.md) | 人 | 五分钟上手 |
| [`skill/references/01-data-model.md`](skill/references/01-data-model.md) | AI | 三层数据结构 |
| [`skill/references/02-retrieval.md`](skill/references/02-retrieval.md) | AI | 检索手册与降级策略 |
| [`skill/references/03-layout-tokens.md`](skill/references/03-layout-tokens.md) | AI | 版面参数：时长、缓动、间距、配色 |
| [`skill/references/04-device-rules.md`](skill/references/04-device-rules.md) | AI | 11 类设备降级表 |
| [`skill/references/05-settings.md`](skill/references/05-settings.md) | AI | 应用内 14 项设置 |
| [`skill/references/06-build-release.md`](skill/references/06-build-release.md) | 人 + AI | 构建与发版记录 |
| [`skill/references/07-integration.md`](skill/references/07-integration.md) | AI | 三种接入方式与校验 |
| [`VERSIONS.md`](VERSIONS.md) | 人 | 46 个版本的完整版本史 |

---

## 五、边界

- 本库是**素材与规格**，不是框架；接入由使用方负责
- 特效代码可以改时长、缓动、颜色；**关键帧名不要改**，改了要同步改引用
- 手表 / 车机 / 终端的禁用项是硬约束，不是建议
- 2.x 的变更细节未记录，引用「变化」时以实际文件为准，不要以版本号推断
