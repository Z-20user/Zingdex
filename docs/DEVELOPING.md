# 开发者指引 / Developing

从零到跑起来，大约 3 分钟。

---

## 一、最快路径（只读代码 / 改网页）

需要：Node.js 18+、任意浏览器。**不需要装依赖。**

```bash
git clone https://github.com/Z-20user/Zingdex.git
cd Zingdex
npm test            # 三道自检，确认数据完好
```

打开网页：

```bash
# 任选其一
python -m http.server 8910 --directory apps/web
npx serve apps/web
```

然后访问 `http://localhost:8910`。

> 直接双击 `apps/web/index.html` 也能看，但 PWA 与部分相对路径行为会不同，
> 调试请用本地服务器。

---

## 二、用命令行取动效

```bash
node packages/cli/bin/zingdex.js stats
node packages/cli/bin/zingdex.js find "商品列表" --device phone
node packages/cli/bin/zingdex.js get fx-s001-07 --device watch
node packages/cli/bin/zingdex.js list light
```

---

## 三、在代码里用

```js
const core = require("./packages/core");
const r = core.get("fx-s001-07", { device: "phone" });
console.log(r.html, r.css);
```

加自己的动效：见 [`packages/plugin-sdk/README.md`](../packages/plugin-sdk/README.md)。

---

## 四、构建桌面版

```bash
cd apps/desktop
npm install
cd ../..
bash build_desktop.sh
```

产物：`apps/desktop/dist/Zingdex-win32-x64/Zingdex.exe`
首次会下载 Electron 运行时（约 200 MB），之后走缓存。

**常见问题**

| 现象 | 原因 / 处理 |
|---|---|
| `缺少运行时，正在通过 npmmirror 下载…` | 正常，首次构建 |
| 下载卡住 | 换镜像：`ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/` |
| `Electron 运行时缺失` | `node apps/desktop/node_modules/electron/install.js` |

---

## 五、构建安卓版

需要 JDK 17+ 与 Android build-tools（脚本会检查）。

```bash
cd apps/android
bash prepare_toolchain.sh      # 首次：检查 / 拉取工具链
export KS_PATH="$(pwd)/keystore/local.jks"
export KS_PASS_FILE="$(pwd)/keystore/ks.pass"
bash build_apk.sh
```

产物：`apps/android/dist/Zingdex-<版本>.apk`

**没有密钥库怎么办**：自己生成一个即可，仅供本地测试：

```bash
keytool -genkeypair -v -keystore keystore/local.jks -alias zingdex \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass "$(cat keystore/ks.pass)"
```

> 这个自签证书**不能**用于发布 —— 和官方签名不同，用户装了会变成两个应用。

---

## 六、改数据的正确姿势

**不要直接改 `apps/web/assets/lib/*.js`。** 那些文件头写着「自动生成」。

| 想改什么 | 改哪里 |
|---|---|
| 场景条目、时长、类别 | `tools/gen_site_data.js` 的输入，然后重跑 |
| 500 个基础特效 | `assets/effects.js` 与 `engine_*.js` 的生成源 |
| 设备系数 | `packages/core/index.js` 的 `DEVICES` |
| 校验规则 | `packages/schema/*.schema.json` |

改完跑：

```bash
npm test
node tools/gen-precache.js   # 改了 apps/web 就必须重跑
```

---

## 七、提交前

```bash
npm test
git add -A
git commit -s -m "fix(core): 修正手表端时长缩放"
```

`-s` 是 DCO 签名，必须带。

**会被 CI 打回的常见情况**

- `check-data.js` 报「条目无法解析」→ 加了条目但没生成对应的 `LIB_PAY`
- `check-secrets.js` 报 `local-path` → 文档或脚本里有 `C:\Users\...`
- gitleaks 报 `generic-api-key` → 有像密钥的随机字符串（换成变量名或加注释说明）

---

## 八、目录速查

| 路径 | 是什么 |
|---|---|
| `apps/web/` | 网页版，改这里最多 |
| `apps/desktop/` | Electron 主进程 |
| `apps/android/` | 安卓壳与构建链 |
| `packages/data/` | 数据读取 API |
| `packages/core/` | 设备缩放与编译 |
| `packages/cli/` | 命令行 |
| `packages/plugin-sdk/` | 第三方插件 |
| `packages/schema/` | JSON Schema |
| `tools/` | 生成、打包、自检脚本 |
| `skill/` | 给 AI 助手用的说明 |
| `docs/` | 手册、架构、版本史 |
| `legacy/` | 不再使用的旧实现 |

---

## 九、还卡住？

- 先看 [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) 的「哪些改动会让你踩坑」
- 再看 [`docs/FAQ.md`](FAQ.md)
- 还没有答案就开 [Discussion](https://github.com/Z-20user/Zingdex/discussions)
