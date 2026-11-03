#!/usr/bin/env node
// 把打包产物里的 package.json 版本改成构建版本。
// app.getVersion() 读的是这个文件；不写会导致更新检查永远认为自己是旧版本。

const fs = require("fs");

const file = process.argv[2];
const version = process.argv[3];

if (!file || !version) {
  console.error("usage: node set_pkg_version.js <package.json> <version>");
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
pkg.version = version;
fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n");
console.log("package.json version -> " + version);
