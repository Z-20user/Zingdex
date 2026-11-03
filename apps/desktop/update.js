// Zingdex —— 更新检查（纯 Node，不依赖 Electron，可单独测试）
//
// 页面层所有网络请求都被主进程屏蔽，所以检查必须走主进程的 https。
// 设计原则：
//   · 只读 release.json，不带任何设备标识
//   · 4 秒超时，失败静默，绝不阻塞启动
//   · 只提示，不自动下载、不自动安装

const https = require("https");
const { URL } = require("url");

const FEED = "https://far-asp-d3gm7xr8m95bb7397-1516680698.tcloudbaseapp.com/release.json";

function cmpVersion(a, b) {
  const pa = String(a || "0").split(".").map((x) => parseInt(x, 10) || 0);
  const pb = String(b || "0").split(".").map((x) => parseInt(x, 10) || 0);
  const n = Math.max(pa.length, pb.length, 3);
  for (let i = 0; i < n; i++) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
}

function fetchJson(url, timeoutMs, redirectsLeft) {
  timeoutMs = timeoutMs || 4000;
  redirectsLeft = redirectsLeft == null ? 3 : redirectsLeft;

  return new Promise((resolve, reject) => {
    let u;
    try {
      u = new URL(url);
    } catch (e) {
      return reject(e);
    }
    if (u.protocol !== "https:") return reject(new Error("only https"));

    const req = https.get(
      u,
      {
        timeout: timeoutMs,
        headers: {
          "User-Agent": "Zingdex-UpdateCheck/1",
          Accept: "application/json"
        }
      },
      (res) => {
        const status = res.statusCode || 0;

        if (status >= 300 && status < 400 && res.headers.location && redirectsLeft > 0) {
          res.resume();
          const next = new URL(res.headers.location, u).toString();
          return fetchJson(next, timeoutMs, redirectsLeft - 1).then(resolve, reject);
        }
        if (status !== 200) {
          res.resume();
          return reject(new Error("HTTP " + status));
        }

        let body = "";
        res.setEncoding("utf8");
        res.on("data", (d) => {
          body += d;
          if (body.length > 512 * 1024) {
            req.destroy(new Error("response too large"));
          }
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      }
    );

    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
  });
}

async function check(opts) {
  opts = opts || {};
  const feed = opts.feed || FEED;
  const channel = opts.channel || "win-installer";
  const current = String(opts.current || "0");

  const data = await fetchJson(feed, opts.timeout || 4000);
  const ch = data && data.channels && data.channels[channel];
  if (!ch || !ch.version) {
    return { update: false, reason: "NO_CHANNEL", current };
  }

  const newer = cmpVersion(ch.version, current) > 0;
  return {
    update: newer,
    current,
    latest: ch.version,
    url: ch.url || "",
    notes: ch.notes || "",
    size: ch.size || 0
  };
}

module.exports = { FEED, cmpVersion, fetchJson, check };

/* 命令行自测：
   node update.js --current 1.12.35
   node update.js --current 1.12.36
*/
if (require.main === module) {
  const args = process.argv.slice(2);
  const i = args.indexOf("--current");
  const current = i >= 0 ? args[i + 1] : "0";
  check({ current })
    .then((r) => {
      console.log(JSON.stringify(r, null, 2));
      process.exit(0);
    })
    .catch((e) => {
      console.error("check failed:", e.message);
      process.exit(1);
    });
}
