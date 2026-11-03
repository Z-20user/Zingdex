# @zingdex/core

把一条动效编译成能直接用的代码，并按设备系数缩放。

```bash
npm i @zingdex/core
```

```js
const core = require("@zingdex/core");

const r = core.get("fx-s001-07", { device: "watch" });
// { id, source, device, scaled, html, css, js, warn[] }

core.get("enter-01", { device: "desktop" });     // 也能取基础特效
core.standalone("fx-s001-07", { device: "phone" }); // 一整页可独立打开的 HTML
```

## 设备系数

| 设备 | 时长 | 位移 |
|---|---|---|
| `watch` | ×0.62 | ×0.55 |
| `car` | ×0.75 | ×0.70 |
| `phone` | ×0.82 | ×0.72 |
| `phone_lg` | ×0.88 | ×0.80 |
| `tablet` / `desktop` | ×1.00 | ×1.00 |
| `desktop_xl` | ×1.08 | ×1.18 |
| `kiosk` | ×1.00 | ×1.10 |

缩放只改数值，**不动关键帧名** —— 改了名下游的引用会全部断掉。

手表与车机另有禁用项，命中会在 `warn` 里提示：

- 手表：禁 canvas、禁 blur、禁无限循环
- 车机：禁无限循环、禁高饱和闪烁、禁视差

## 许可

代码 Apache-2.0，数据 CC BY 4.0。
