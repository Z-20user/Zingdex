---
name: transient-motion
description: 从 TRANSIENT 瞬态动效库检索并取用动效代码。当用户要做列表入场、加载进度、卡片抬起、页面转场、状态反馈等界面动效，或说「用这套动效库 / 按这个动效做」时使用。
---

# TRANSIENT 瞬态 · 动效取用技能

一套离线动效库：**20,000 条场景化动效**，覆盖手机 / 大屏 / 车机 / 手表 / 终端。
每条都是「真实界面 + 作用其上的动效」，可直接取代码，不依赖任何外部资源。

## 一、先看数据长什么样

动效数据由**场景**和**条目**两层组成：

```js
SCENES = [{
  id: "n001",  ctx: "ecommerce-list",
  zh: "商品列表", en: "Ecommerce List",
  desc: "快速扫视，找东西；快、利落，不能拖",
  domain: "电商", g: "电商",
  f: "phone", kind: "phone", devices: ["phone"],
  cats: [{
    zh: "进度跳变", en: "Progress Jump",
    ms: 420,          // 时长（毫秒）
    ease: "out",      // 缓动
    fam: "m01",       // 母版编号
    t: 0,             // 变体偏移
    fx: "fx-n001-01", // 特效 id（唯一）
    mc: "入场",        // 动效类别：入场/列表/循环/文字/状态…
    fq: 5             // 使用频率（越大越常用）
  }, ...]
}]
```

| 字段 | 含义 | 用途 |
|---|---|---|
| `id` | 场景 id | 定位场景 |
| `zh` / `en` | 场景名 | 用户口头描述匹配 |
| `desc` | 一句话场景说明 | 判断是否匹配需求 |
| `domain` / `g` | 领域 / 分组 | 粗筛 |
| `devices` | 适用设备 | 适配判断 |
| `cats[].fx` | 特效 id | **取代码的钥匙** |
| `cats[].ms` | 时长 | 直接可用的参数 |
| `cats[].mc` | 动效类别 | 选择动效类型 |
| `cats[].fq` | 频率 | 排序优先级 |

## 二、三步取用

### 第 1 步：找场景

按用户描述找最接近的场景（不要一次给 20 个选项，选 1–3 个）。

```bash
node skill/tools/find-motion.js <库目录> "商品列表"
```

### 第 2 步：挑条目

同一场景下有 30–50 条，按 `mc`（类别）和 `fq`（频率）挑：

- 用户要「进去」→ `mc=入场`
- 用户要「一直转」→ `mc=循环`
- 用户要「加载百分比」→ `mc=进度` / `mc=数值`
- 用户没说 → 选 `fq` 最高的那条

### 第 3 步：取代码

代码分三份，同一条 `fx` 在三个文件里：

| 文件 | 内容 |
|---|---|
| `assets/engine_html.js` | 结构 HTML |
| `assets/engine_css.js` | 关键帧 CSS |
| `assets/engine_js.js` | 需要脚本驱动的那部分（粒子 / 物理 / 画布） |

取用时**三件一起拿**，缺一件就会「不动」或「错位」。

### 两种编号要分清

| 编号 | 形如 | 在哪 |
|---|---|---|
| 场景条目编号 `fx` | `fx-n001-01` | 场景数据里，用来定位「哪个场景的哪一条」 |
| 特效基础编号 | `enter-01` / `light-07` | 代码文件里，`ENGINE_HTML/CSS/JS` 的键 |

应用里通过 `fx → 去前缀 → lib.byId` 解析成基础编号。
命令行工具直接用基础编号取代码。

### 命令行工具

```bash
# 1) 找场景与条目（返回 fx）
node skill/tools/find-motion.js <库目录> "商品列表" --device phone

# 2) 按基础编号取三件套代码
node skill/tools/extract-motion.js <库目录> enter-01

# 3) 列全部基础编号（按族）
node skill/tools/extract-motion.js <库目录> --list
node skill/tools/extract-motion.js <库目录> --list light
```

### 特效族（共 500 条）

| 族 | 数量 | 用途 |
|---|---|---|
| enter | 50 | 入场 |
| exit | 32 | 退场 |
| state | 53 | 状态切换 |
| light | 43 | 光效、扫光 |
| morph | 43 | 形变 |
| space | 35 | 空间 / 3D 位移 |
| particle | 35 | 粒子（有脚本） |
| physics | 33 | 物理回弹（有脚本） |
| accent | 30 | 强调、点缀 |
| ambient | 25 | 环境氛围 |
| type | 25 | 字体排版动效 |
| swarm | 25 | 群体运动（有脚本） |
| beam | 18 | 光束 |
| text | 18 | 文字特效 |
| data | 15 | 数据可视化 |
| chart | 12 | 图表 |
| noise | 4 | 噪波 |
| svg | 4 | SVG 路径 |

## 三、三种接入方式

### 方式 A：直接复制（最省事）

把某条动效的 HTML + CSS + JS 拷进项目。CSS 里的时长、缓动可以改，
**关键帧名字不要改**，否则要同步改 HTML 里的引用。

### 方式 B：运行时（推荐）

库自带 8 KB 运行时，元素上加一个属性就能播放：

```html
<div data-motion="fx-n001-01">
  <!-- 你自己的内容 -->
</div>
<script src="runtime/index.js"></script>
```

适合一次要放很多条、或需要动态切换的场景。

### 方式 C：React / Vue 组件

`components/motion-data.js` 里是 `{ html, css }` 的成对数据，
可以直接渲染成组件（`export default {...}`，按 id 取）。

## 四、设备适配硬约束

不同的屏，不只是尺寸不同，**节奏和幅度也必须变**。库里的规则：

| 设备 | 时长上限 | 位移上限 | 额外限制 |
|---|---|---|---|
| 手机 | 600 ms | 24 px | — |
| 大屏 | 1600 ms | 48 px | 可用全部引擎 |
| 车机 | 400 ms | 16 px | 禁用大面积光效（防眩光） |
| 手表 | 320 ms | 10 px | 不用画布 / 粒子 |
| 终端 | 700 ms | 20 px | 粒子 ≤ 600 ms |

**照搬手机的参数到大屏，会显得又慢又小；照搬到车机，会晃眼。**

## 五、性能约束（踩过坑）

1. **粒子 / 物理类**必须「离屏暂停、元素移除即停」，否则列表翻页会泄漏帧循环
2. **循环动效**不要超过 2 个同时播放，中低端机会掉帧
3. 用 `prefers-reduced-motion` 兜底：用户关闭动效时，直接跳到终态
4. 入场动效 **只播一次**，不要 `infinite`；退场可以往复两次后停住

## 六、三个典型例子

### 例 1：列表逐项入场

```bash
node skill/tools/find-motion.js <库目录> "列表" --cat 列表 --device phone
```

取返回的 `fx` → 复制对应的 HTML/CSS → 给每行加 `animation-delay: calc(var(--i) * 60ms)`。

### 例 2：加载进度条

```bash
node skill/tools/find-motion.js <库目录> "进度"
```

优先选 `mc=进度`、`ms` 在 800–1500 之间的；数值型选 `mc=数值`。

### 例 3：卡片抬起 / 3D 抬卡

```bash
node skill/tools/find-motion.js <库目录> "卡片" --cat 入场 --device wide
```

大屏场景优先；`ms` 会自动比手机长 1.3 倍左右，这是设计，不是 bug。

## 七、交付前自查

- [ ] HTML / CSS / JS 三件齐全，没有只拿 CSS
- [ ] 关键帧名没改（或改了也同步了引用）
- [ ] 时长和位移符合目标设备的约束表
- [ ] 只用一次播放的动效没有写成 `infinite`
- [ ] 有 `prefers-reduced-motion` 兜底
- [ ] 粒子 / 物理类在元素移除时停止
- [ ] 循环动效同屏不超过 2 个

## 八、常见错误

| 现象 | 原因 | 修法 |
|---|---|---|
| 完全不动 | 结构与 CSS 不匹配（占位结构没换成真实元素） | 对照 HTML 与 CSS 的选择器 |
| 动一次就停 | `animation-fill-mode` 缺失 | 加 `forwards` |
| 一直循环停不下来 | 用了 `infinite` | 入场改成单次 |
| 动效溢出容器 | 没有 `overflow:hidden` | 给容器加裁切 |
| 手机上卡顿 | 同屏循环太多 / 用了粒子 | 降级到 CSS 关键帧 |

## 九、文件在哪

公开仓（本技能所在）只有文档；**数据与代码在应用源码里**：

```
site/assets/data.js          原始 120 个场景
site/assets/engine.js        追加的场景（500 特效 × 场景）
site/assets/engine_css.js    特效 CSS
site/assets/engine_html.js   特效 HTML
site/assets/engine_js.js     特效脚本
components/motion-data.js    React/Vue 用的 html+css 对
runtime/index.js             8 KB 运行时
```

目录结构可能随版本调整，**先 `ls` 确认再引用**。
