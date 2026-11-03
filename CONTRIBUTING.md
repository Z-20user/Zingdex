# 参与贡献 / Contributing

感谢你愿意花时间。这个项目由一个人维护，所以流程尽量短。

---

## 一、报告问题

开 [Issue](https://github.com/Z-20user/Zingdex/issues) 前先搜一下有没有重复。

请写清楚：

- 你用的版本（关于页或 `package.json` 里的版本号）
- 平台与版本（Android 版本 / Windows 版本 / 浏览器）
- 复现步骤：点了什么、期望是什么、实际是什么
- 截图或录屏（动效问题里，这一条最有价值）

**不要在 Issue 里贴密钥、口令、身份证号、手机号、住址。**
需要贴日志时，先把路径里的用户名和密钥值替换掉。

---

## 二、提交代码

### 流程

1. Fork → 新建分支（`fix/xxx`、`feat/xxx`）
2. 改代码，跑自检：`npm test`
3. 提交时用 `-s` 签名，表示你同意 [DCO](DCO)：
   ```bash
   git commit -s -m "fix: 修正手表端时长缩放"
   ```
4. 开 Pull Request，说明「改了什么 / 为什么改 / 怎么验证的」

### 提交信息

用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)：

```
feat(cli): 增加 --json 输出
fix(core): 修正 translateX 未按设备系数缩放
docs: 补充数据来源说明
```

### 会被拒绝的情况

- 改了 `apps/web/assets/lib/*.js` 或 `data.js` 却没有对应的生成脚本改动
- 提交里带了签名密钥、口令文件、`.env`
- 未经说明就重命名关键帧（`@keyframes` 名被下游引用）
- 把第三方动效库的代码贴进来却不标注来源与许可证

---

## 三、贡献数据

新增一个动效条目时：

1. 编号必须落在已有场景下，格式 `fx-<场景id>-<序号>`
2. `zh` 名称、`ms` 时长、`mc` 类别必须填
3. 跑 `npm run check:data` 必须通过
4. 在 PR 里说明这个动效适合什么场景、为什么这个时长

新增一个场景时，把场景加进 `data.js` 的 `SCENES`，并补一个
`apps/web/assets/lib/dNNN.js` 分片。

---

## 四、贡献文档

文档与数据同为 CC BY 4.0。改文档不需要签 DCO，但仍然接受同样的审查。

---

## 五、许可

提交即表示你同意：

- 代码贡献按 [Apache-2.0](LICENSE) 授权
- 数据与文档贡献按 [CC BY 4.0](LICENSE-DATA) 授权

并确认你有权这么做（见 [DCO](DCO)）。

---

## 六、响应时间

个人维护，通常周末处理。涉及安全的问题优先，见 [SECURITY.md](SECURITY.md)。
