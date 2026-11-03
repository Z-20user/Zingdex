// 一次性：按页面实际需要重排 <script> 顺序，并去掉不再存在的 library-data.js
// 用法：node tools/relink_pages.js
const fs = require("fs");
const path = require("path");

const SITE = path.join(__dirname, "..", "site");
const V = "2.2.0";

// 页面 → 需要加载的模块（顺序即依赖顺序）
const PLAN = {
  "index.html": ["settings", "keys", "license", "data", "effects", "library", "app"],
  "library.html": ["settings", "keys", "license", "data", "effects", "lib-gl", "library", "app"],
  "detail.html": ["settings", "keys", "license", "data", "effects", "lib-gl", "library", "paths", "app"],
  "guide.html": ["settings", "keys", "license", "data", "effects", "lib-gl", "library", "paths", "app"],
  "mobile.html": ["settings", "keys", "license", "data", "library", "paths", "mobile"],
  "motion.html": ["settings", "keys", "license", "data", "effects", "app"],
  "settings.html": ["settings", "keys", "license", "app"],
  "license.html": ["settings", "keys", "license", "app"],
  "usage.html": ["settings", "keys", "license", "app"],
  "resources.html": ["settings", "keys", "license", "app"]
};

Object.keys(PLAN).forEach((file) => {
  const p = path.join(SITE, file);
  let src = fs.readFileSync(p, "utf8");

  // 抹掉所有 <script src="assets/*.js..."> 行（保留内联脚本）
  src = src.replace(/^[ \t]*<script src="assets\/[a-z0-9-]+\.js[^"]*"><\/script>\s*$/gm, "");

  const block = PLAN[file]
    .map((m) => '<script src="assets/' + m + '.js?v=' + V + '"></script>')
    .join("\n");

  // 插在 </body> 前
  if (!/<\/body>/.test(src)) throw new Error(file + " 缺少 </body>");
  src = src.replace(/<\/body>/, block + "\n</body>");

  fs.writeFileSync(p, src, "utf8");
  console.log(file.padEnd(16), "->", PLAN[file].join(" "));
});
