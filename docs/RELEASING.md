# 发布流程 / Releasing

三件事：发 npm 包、发 GitHub Release、发版本号。按顺序来，每步都可验证。

---

## 一、发 npm 包

### 前置

```bash
# 1) 必须有 npm 账号，且账号下已创建 @zingdex 这个 scope（免费，在 npm 网站里建组织即可）
npm login                      # 浏览器授权，会写入本机 ~/.npmrc

# 2) 确认当前登录的是谁
npm whoami

# 3) 发布必须走官方源（国内镜像只能装不能发）
npm config get registry         # 若是 npmmirror，下面的 publishConfig 会自动覆盖
```

四个包的 `package.json` 里都写了：

```json
"publishConfig": { "registry": "https://registry.npmjs.org/", "access": "public" }
```

所以即使本机默认源是镜像，`npm publish` 也会打到官方源。

### 发布顺序（有依赖，不能乱）

```bash
# 1. 数据包（其余三个都依赖它）
cd packages/data && npm publish

# 2. 核心
cd ../core && npm publish

# 3. 命令行 + 插件 SDK（互相不依赖，顺序随意）
cd ../cli && npm publish
cd ../plugin-sdk && npm publish
```

**为什么先发 data**：`core` / `cli` / `plugin-sdk` 的 `dependencies` 里写死了
`"@zingdex/data": "3.1.1"`。npm 上还没有这个版本时，后三个发不出去。

### `prepack` 做了什么

`packages/data` 发布前会自动跑 `node scripts/bundle-data.js`，
把 `apps/web/assets/` 里的数据复制进 `packages/data/assets/`，
让装到别人电脑上的包是自包含的。

这份副本**不入库**（`.gitignore` 已排除），所以仓库里数据仍然只有一份，不会漂移。

### 发布后验证

```bash
npm view @zingdex/data version
mkdir /tmp/zx && cd /tmp/zx && npm init -y
npm i @zingdex/cli
npx zingdex stats        # 应输出 scenes:201 entries:20000 ...
```

---

## 二、发 GitHub Release

1. 更新 `app_version.py` 的 `VERSION_NAME` 与 `VERSION_CODE`（+1）
2. 更新 `CHANGELOG.md`、`docs/VERSIONS.md`
3. 构建两端产物（见 `docs/DEVELOPING.md`）
4. 创建 Release，**上传 APK 与 Windows 便携版 zip**
5. **不删除上一个版本的产物** —— 从 3.0 起每个版本都保留

```bash
gh release create v3.1.2 \
  "Zingdex-3.1.2-android.apk" \
  "Zingdex-3.1.2-windows-portable.zip" \
  --title "Zingdex / 跃索 v3.1.2" \
  --notes-file notes.md
```

---

## 三、版本号规则

| 改了什么 | 升哪一位 |
|---|---|
| 破坏性改动（数据结构、编号规则、命令参数） | MAJOR |
| 新增动效 / 设备 / 命令 | MINOR |
| 修 Bug、改文案、调样式 | PATCH |

**npm 包版本与应用版本保持一致**，四个包同号发布 —— 避免「装到的数据和看到的界面不是一版」。

---

## 四、发不出去的常见原因

| 报错 | 原因 | 处理 |
|---|---|---|
| `ENEEDAUTH` | 没登录 | `npm login` |
| `403 Forbidden — you do not have permission` | 账号没有 `@zingdex` scope | 去 npm 网站建组织，或改包名 |
| `404 Not Found — PUT` | 发到了镜像源 | 检查 `publishConfig`，或用 `npm publish --registry=https://registry.npmjs.org/` |
| `E409 Conflict` | 版本号已存在 | 升版本，npm 不允许覆盖已发布版本 |
| `EPUBLISHCONFLICT` | 同名包属于别人 | 换 scope |
| 包体积异常 | `assets/` 没被排除或没被包含 | `npm pack --dry-run` 看清单 |

**npm 的发版是不可撤销的**：一旦发布，那个版本号永久占用，只能 `npm deprecate` 标记废弃，不能删除重发。
所以发布前一定先 `npm pack --dry-run` 看一眼内容。
