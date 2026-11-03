# 架构说明 / Architecture

写给要改这个仓库的人。看完这份，你应该知道「东西在哪、为什么这样分、改哪里会炸」。

---

## 一、全局图

```
                 ┌─────────────────────────────┐
                 │  packages/data（数据读取）    │
                 │  读 apps/web/assets/*        │
                 └──────────┬──────────────────┘
                            │
                 ┌──────────▼──────────────────┐
                 │  packages/core（编译与缩放）  │
                 └──────┬───────────────┬──────┘
                        │               │
              ┌─────────▼─────┐  ┌──────▼──────────┐
              │ packages/cli  │  │ packages/plugin │
              └───────────────┘  └─────────────────┘

  同一个数据源，喂三种外壳：
     apps/web      纯静态，浏览器直接打开
     apps/desktop  Electron 壳，加载 apps/web 的副本
     apps/android  WebView 壳，加载 apps/web 的副本
```

**关键约束：数据只有一份（`apps/web/assets/`）。**
桌面端与安卓端在构建时把那批文件拷进去，不各自维护一套。
`packages/*` 只是读取与封装，不复制数据。

---

## 二、数据长什么样

```
SCENES[]                    201 个场景
  └─ cats[]                 每个场景下的条目，共 20,000 条
       └─ fx: "fx-s001-07"
            └─ LIB_PAY["fx-s001-07"] = { h: html, c: css, j?: js }
```

`LIB_PAY` 分散在 201 个分片里：

| 文件 | 内容 | 规模 |
|---|---|---|
| `assets/data.js` | 120 个场景的索引 | 185 KB |
| `assets/engine.js` | 81 个场景的索引 + 运行时 | 1.9 MB |
| `assets/lib/d001…d201.js` | 场景载荷分片，每片一个场景的 `LIB_PAY` | 16 MB |
| `assets/engine_html.js` | 500 个基础特效的结构 | 71 KB |
| `assets/engine_css.js` | 500 个基础特效的样式 | 446 KB |
| `assets/engine_js.js` | 500 个基础特效的脚本 | 690 KB |
| `assets/effects.js` | 18 个可调参数的成品组件 | 62 KB |
| `assets/lib-gl.js` | 24 条 Canvas / WebGL 特效 | 25 KB |

**为什么分片**：一次性加载 16 MB 会让首屏卡住。分片后按需加载，
首屏只拉 `data.js`，点进某个场景才拉对应的 `dNNN.js`。

**为什么两个文件都有 `SCENES`**：历史原因 —— 先有 `data.js`，后来扩容时
新场景写进了 `engine.js`。读的时候要合并去重，见 `packages/data/index.js`。
这算技术债，但拆它风险大于收益，先留着。

---

## 三、网页端

```
apps/web/
├── *.html            12 个页面，多页应用，无框架
├── assets/
│   ├── app.js        主应用逻辑（110 KB）
│   ├── library.js    组件库页
│   ├── mobile.js     移动端页
│   ├── settings.js   设置页
│   ├── ai.js         AI 提示词页
│   ├── style.css     主样式（112 KB）
│   ├── theme.css     主题变量
│   ├── paths.js      页面路径表
│   ├── data.js / lib/ / engine*.js   数据（见上）
│   └── fonts/        Geist 字体（SIL OFL 1.1）
├── manifest.webmanifest   PWA 清单
├── sw.js                  Service Worker
└── sw 的用户可见行为：首次访问后整站进缓存，断网可用
```

**没有构建步骤**。改完刷新即可，这是刻意的选择 —— 一个人维护，
不值得为省钱引入打包器带来的复杂度。

**PWA**：`tools/gen-precache.js` 扫描整个目录生成 `assets/precache.json`
（含内容哈希作为缓存版本），SW 在 install 时按清单全量缓存。
改了任何文件都要重跑一次 `node tools/gen-precache.js`，否则 SW 会发缓存旧版本。

---

## 四、桌面端

```
apps/desktop/
├── main.js       Electron 主进程：窗口、菜单、文件、更新
├── preload.js    暴露给页面的受限 API
├── update.js     更新检查（不联网时静默跳过）
├── patch-exe.js  改 exe 的版本资源与图标
└── site/         构建时从 apps/web 拷贝进来（不入库）
```

构建：`bash build_desktop.sh` → `apps/desktop/dist/Zingdex-win32-x64/`。

**为什么要 Electron 而不是更小的方案**：试过 PyInstaller + pywebview，
冷启动要解压站点资源，明显更慢；窗口控制与 DPI 处理也更差。
代价是体积（解压后约 293 MB）。这个取舍记在 `legacy/README.md`。

---

## 五、安卓端

没有 Gradle，手工链路：

```
aapt2 compile/ link  →  javac  →  d8  →  zip  →  zipalign  →  apksigner
```

| 文件 | 作用 |
|---|---|
| `prepare_toolchain.sh` | 检查 / 下载 build-tools 与 JDK |
| `build_apk.sh` | 主构建脚本，8 个步骤，每步都有断言 |
| `app/java/.../MainActivity.java` | WebView 壳，加载本地资源 |
| `app/java/.../DocProvider.java` | 导出文件用 ContentProvider |
| `app/assets/site/` | 构建时从 apps/web 拷贝（不入库） |

**签名密钥不在仓库里。** 必须从外部提供：

```bash
export KS_PATH=/path/to/key.jks
export KS_PASS_FILE=/path/to/pass.txt   # 只含一行口令
```

缺任一项，脚本直接失败退出 —— 这是刻意的，避免误用弱口令签出正式包。

**包名 `com.transientlab.motion` 不改**：改了老用户无法覆盖升级，数据会丢。
名字可以换，包名不能。

---

## 六、哪些改动会让你踩坑

| 改动 | 后果 |
|---|---|
| 重命名 `@keyframes` | 下游复制过代码的人全部失效 |
| 改 `fx-*` 编号 | 已发布的数据引用全断，且违反「编号永不复用」承诺 |
| 改 `LIB_PAY` 的结构 | `packages/data`、桌面、安卓三处都要跟着改 |
| 新增场景却不加分片 | 场景能搜到但取不到码（`check-data.js` 会拦） |
| 改了 `apps/web` 却忘了重跑 `gen-precache.js` | PWA 发旧缓存 |
| 改了 `apps/web` 却没同步 `apps/desktop/site` | 桌面版还是旧页面（构建时会重新拷，一般不会） |
| 在仓库里放密钥 | CI 会拦，但要在推送前就发现 |

---

## 七、自检体系

```bash
npm test
# = node tools/check-data.js && node tools/check-secrets.js && node tools/check-schema.js
```

| 脚本 | 查什么 |
|---|---|
| `check-data.js` | 规模是否为 201/20000/500/24；每条 `fx` 是否可解析 |
| `check-schema.js` | 201 个场景是否都符合 `scene.schema.json` |
| `check-secrets.js` | 私钥、各类 token、弱口令赋值、本机路径 |

CI 另有两道：gitleaks（历史扫描）与 CodeQL（JS + Java 静态分析）。
