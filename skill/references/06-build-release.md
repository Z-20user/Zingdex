# 06 · 构建与发版

四种形态，同一份内容。改一处，四处都要重出。

---

## 一、单点真相（改这几处）

| 东西 | 位置 | 注意 |
|---|---|---|
| 版本号 | `03_源代码/app_version.py` + `version.txt` | **两处必须同步** |
| 动效数据 | `04_动效代码库/tools/gen_v2.py` | 改了场景定义才需要跑 |
| 站点数据 | `site/assets/*.js` | 由脚本生成，不要手改 |
| 版权文档 | `03_源代码/docs/使用说明与版权声明.md` | 由 `build_terms.py` 生成 |
| 签名（动效） | `03_源代码/android/keystore/` | **换签名会导致覆盖安装失败** |

## 二、构建顺序

```bash
# 1) 动效数据（改场景才跑）
python tools/gen_v2.py

# 2) 站点数据
node tools/build_library_data.js
node tools/gen_site_data.js

# 3) 安卓
cd android && bash build_apk.sh

# 4) 桌面端（含自检）
bash build_desktop.sh

# 5) 安装包 + 便携版
cd tools && python pack_installer.py
```

任一步失败就停，不要跳步——后面的产物会引用上一步的输出。

## 三、四种形态

| 形态 | 产物 | 体积参考 | 依赖 |
|---|---|---|---|
| 安卓 | `TRANSIENT.apk` | 2.7 MB | 无 |
| Windows 安装版 | 单文件安装包 | 113 MB | 系统 Edge/Chromium |
| Windows 便携版 | 整个文件夹（可打 zip） | 290 MB（zip 112 MB） | 同上 |
| 网页 | 单文件站点 | 随源码 | 浏览器 |

## 四、构建自检（必须看）

`build_desktop.sh` 结束会打印自检结果，关键项：

| 项 | 期望 |
|---|---|
| `appMode` | `installed`（安装版）/ `portable`（便携版） |
| `adminUi.blockHidden` | 便携版为 `true` |
| `licInputVisible` | 安装版 `true`，便携版 `false` |
| 场景数 / 条目数 | 与数据源一致 |

自检不过就**不要发版**。

## 五、发版流程（GitHub）

```bash
gh release create vX.Y.Z --repo Z-20user/transient \
  --title "TRANSIENT 瞬态 vX.Y.Z" --notes "…"

gh release upload vX.Y.Z --repo Z-20user/transient \
  transient-X.Y.Z-android.apk
```

然后在 `VERSIONS.md` 顶部加一行（版本 / 日期 / 体积 / 是否有 Windows 包 / 主要变化）。

## 六、历史数据（截至 2026-11-02）

| 项 | 数值 |
|---|---|
| 收录版本 | 46 个（v0.0.1 → v2.1.3） |
| 首次构建 | 2026-11-01 15:10 |
| 单日版本数（11-01） | 24 个 |
| 归档构建产物 | 46 个 |
| 平均出包间隔 | 约 9 分钟 |
| 带 Windows 安装包的版本 | 18 个 |
| APK 体积变化 | 1.0 MB（1.7.1）→ 2.7 MB（2.1.3） |
| 安装包体积变化 | 111.5 MB → 117.2 MB |

## 七、维护要点

1. **每次发版都更新 `VERSIONS.md`**，否则下一版会不知道改了什么
2. **密钥 App 已停用**，不要再随包分发
3. 旧版本归档到 `06_旧版本备份`，每版一整份（注意：18 个安装包已占 2 GB，建议保留「最新 + 每 5 版一个节点」）
4. 2.0.0–2.1.3 的变更未记录，补记时以实际文件差异为准，不要凭版本号推断
