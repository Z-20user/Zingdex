# 五分钟上手

给第一次用这套动效库的人（或 AI）。三步走完，能拿到能跑的代码。

---

## 第 1 步：先看看有什么

打开应用（安卓 APK 或 Windows 版），首页就是组件库：

- 顶部搜索：输入「商品列表」「加载」「卡片」这类词
- 分类筛选：按领域 / 形态 / 设备
- 点任意一条 → 详情页 → **能看到它真的在动**，并且有「复制代码」

不想开应用？用命令行也行：

```bash
node skill/tools/find-motion.js <库目录> "商品列表" --device phone
```

输出长这样：

```
● 商品列表 [s001] 电商零售
   · 入场 上滑入场 380ms out fx-s001-07
   · 列表 逐项错峰 420ms out fx-s001-09
```

---

## 第 2 步：拿到代码

**方式 A：应用里直接复制**（推荐给非程序员）

详情页 → 右上角「复制」→ 得到 HTML + CSS（有的还有 JS）。

**方式 B：命令行按特效 id 取**

```bash
node skill/tools/extract-motion.js <库目录> enter-01
```

会打印三件套：

```
/* ===== enter-01 · HTML ===== */
<div class="fx-enter-01"> ... </div>

/* ===== enter-01 · CSS ===== */
.fx-enter-01{ ... }
```

先不知道用哪个 id？列出来看：

```bash
node skill/tools/extract-motion.js <库目录> --list
node skill/tools/extract-motion.js <库目录> --list enter
```

---

## 第 3 步：放进你的项目

1. HTML 粘到你的页面结构里
2. CSS 粘到样式表里
3. 有 JS 的话，把那一段放到 DOM 之后执行
4. **改节奏**：CSS 里用的是 `var(--fx-dur)` 和 `var(--fx-ease)`，
   在你自己的容器上设置这两个变量即可，不用改关键帧：

```css
.my-card{
  --fx-dur: 420ms;
  --fx-ease: cubic-bezier(.22,.61,.36,1);
}
```

---

## 三条最常踩的坑

| 现象 | 原因 | 修 |
|---|---|---|
| 完全不动 | 只拿了 CSS，没拿 HTML 结构 | 两件一起拿，结构里的 class 要对得上 |
| 动一下就停 | 缺 `animation-fill-mode` | 加 `forwards` |
| 一直循环停不住 | 用了 `infinite` | 入场/退场改成单次；循环留给「加载」「呼吸」这类 |

---

## 想要不同设备的效果

同一套动效在手机、大屏、车机、手表、终端上**节奏和幅度不一样**，
这是库里的设计，不是 bug。规则见 `SKILL.md` 的「设备适配硬约束」。

---

## 还是找不到

- 换更短的词：「列表」比「电商商品列表滚动」更容易命中
- 去掉 `--device` / `--cat` 限制
- 用 `--list` 直接看 500 个基础特效的 id
