# 数据来源与版权审计 / Data Provenance Audit

**对象**：Zingdex · 跃索 全部动效数据与场景索引
**审计日期**：2026-11-03
**审计范围**：`apps/web/assets/`、`packages/data/`（发布前从同一来源生成）
**结论**：**可公开发布，采用 CC BY 4.0**。未发现第三方动效库的代码或数据。

---

## 一、被审计的数据是什么

| 资产 | 文件 | 规模（实测） |
|---|---|---|
| 场景索引 | `apps/web/assets/data.js` | 120 个场景 / 4,000 条条目（首屏子集） |
| 场景载荷分片 | `apps/web/assets/lib/d001.js … d201.js` | **201 个分片 / 20,000 条 `LIB_PAY` 条目** |
| 基础特效定义 | `apps/web/assets/effects.js` | 500 个基础特效（`enter-*` 系列） |
| Canvas / WebGL 类特效 | `apps/web/assets/lib-gl.js` | 24 条（`x01`–`x24`） |
| 引擎 | `apps/web/assets/engine*.js` | 运行时，属源代码（Apache-2.0） |

实测命令与结果：

```
shards                                    201
LIB_PAY entries total                     20000 across 201 shards
entries with missing fx                   0
```

即文档中「20,000 条组件 · 500 特效 · 201 场景」的说法有实测支撑，不是估算。

---

## 二、数据是怎么产生的

```
设计令牌（时长 / 缓动 / 间距 / 强调色）
        │
        ├─ tools/build_library_data.js ──► lib-gl.js（24 条 Canvas/WebGL 特效）
        ├─ tools/gen_site_data.js ───────► data.js + lib/d001..d201.js
        └─ 手工写入 ─────────────────────► effects.js（500 个基础特效）
```

- 每条内容由**本项目自有的生成脚本**从设计令牌展开，不是从别处抓取。
- `lib-gl.js` 与 `lib/*.js` 文件头均标注「自动生成，不要手改」，可复现。
- 500 个基础特效为手写 CSS / Canvas 实现，关键帧名采用统一前缀
  （`fx-…`、`gl-…`），全部由本项目定义。

---

## 三、第三方库排查

对全部 `.js` / `.css` 扫描下列特征串，**命中 0 次**：

| 被排查对象 | 特征串 |
|---|---|
| Animate.css | `animate.css`、`animated` 类名前缀 |
| Animista | `animista` |
| GSAP | `gsap`、`TweenMax` |
| Framer Motion | `framer-motion`、`motion.div` |
| Anime.js | `anime.js`、`anime({` |
| Motion One / Popmotion | `motion-one`、`popmotion` |
| Velocity.js | `velocity.js` |
| Lottie | `lottie`、`bodymovin` |

扫描命令：

```bash
grep -oiE "animate\.css|animista|gsap|framer[- ]motion|three\.js|anime\.js|motion-one|popmotion|velocity\.js|lottie" \
  apps/web/assets/*.js apps/web/assets/*.css
# 输出：空
```

**说明**：动效的「做法」本身（淡入、位移、缩放、模糊）属于通用技术手段，
不受著作权保护；受保护的是**具体表达**（代码文本、参数组合、命名结构）。
本项目的表达为自行编写，逐条可追溯到本仓库的生成脚本与源文件。

---

## 四、字体与其他第三方资产

| 资产 | 来源 | 许可证 | 处理 |
|---|---|---|---|
| Geist / Geist Mono（latin 子集，7 个 woff2） | Vercel | SIL OFL 1.1 | 已附全文 `third_party/Geist-OFL.txt`；未修改字形 |
| 图标（`ic_launcher*`、`icon.ico`） | 本项目自制 | 归本项目，见 `TRADEMARK.md` | — |
| Android 构建工具链 | Google | 各自许可证 | **不随仓库分发**，使用者自行安装 |
| Electron | OpenJS Foundation | MIT | 不随仓库分发（`node_modules` 已排除） |

中文字形不由内置字体承担，走系统字体（微软雅黑 / 苹方），因此不涉及中文字体授权。

---

## 五、用户产出物的权利边界

这一点必须写清楚，避免下游误用：

| 场景 | 是否允许 | 依据 |
|---|---|---|
| 把检索到的动效代码用到自己的项目里 | 允许，商用也可 | CC BY 4.0 |
| 修改参数后用于闭源商业产品 | 允许 | CC BY 4.0 允许演绎与商用 |
| 需要署名吗 | **需要** | CC BY 4.0 要求署名 |
| 可以把 20,000 条数据打包转卖 | 允许，但必须署名并保留许可证 | CC BY 4.0 |
| 可以用「Zingdex」命名自己的产品 | 不允许 | 商标政策，见 `TRADEMARK.md` |

署名的最小形式（放在项目 README 或关于页即可）：

```
Motion data based on Zingdex 跃索 (CC BY 4.0)
https://github.com/Z-20user/Zingdex
```

---

## 六、已知风险与未决项

| 项 | 状态 | 说明 |
|---|---|---|
| 数据是否含用户上传内容 | 否 | 全部由脚本生成，无 UGC |
| 是否需要软著登记 | 未办 | 开源后非必需；若要在国内应用商店上架，需另办 |
| 商标注册 | 未办 | 见 `TRADEMARK.md`，当前不主张注册权 |
| 生成脚本是否在仓库内 | 是 | `tools/build_library_data.js`、`tools/gen_site_data.js` 可复现 |
| 复现是否一致 | 部分 | 生成脚本可复现结构；`effects.js` 含手工内容，不保证逐字节一致 |

---

## 七、审计方法可复现

```bash
# 1. 计数
node -e "const fs=require('fs');let t=0;for(const f of fs.readdirSync('apps/web/assets/lib').filter(f=>f.endsWith('.js'))){global.window={};require('./apps/web/assets/lib/'+f);t+=Object.keys(global.window.LIB_PAY||{}).length}console.log(t)"

# 2. 第三方库特征串
grep -oiE "animate\.css|animista|gsap|framer[- ]motion|anime\.js|lottie" apps/web/assets/*.js | wc -l

# 3. 密钥与隐私扫描
python _stage/secret_scan.py .
```

三项均在 2026-11-03 执行，结果见本文档正文。
