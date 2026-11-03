// 给打包好的 Zingdex.exe 写入图标与版本信息（纯 JS，不需要 rcedit）
const fs = require("fs");
const ResEdit = require("resedit");

const exePath = process.argv[2];
const iconPath = process.argv[3];
const version = process.argv[4] || "1.2.0.0";

const data = fs.readFileSync(exePath);
const exe = ResEdit.NtExecutable.from(data, { ignoreCert: true });
const res = ResEdit.NtExecutableResource.from(exe);

if (iconPath && fs.existsSync(iconPath)) {
  const iconFile = ResEdit.Data.IconFile.from(fs.readFileSync(iconPath));
  ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
    res.entries, 1, 1033, iconFile.icons.map((i) => i.data)
  );
}

const viList = ResEdit.Resource.VersionInfo.fromEntries(res.entries);
if (viList.length) {
  const vi = viList[0];
  const lang = vi.getAllLanguagesForStringValues()[0] || { lang: 1033, codepage: 1200 };
  vi.setStringValues(lang, {
    CompanyName: "Zingdex",
    FileDescription: "Zingdex 跃索 · 动效组件库",
    ProductName: "Zingdex 跃索",
    FileVersion: version,
    ProductVersion: version,
    OriginalFilename: "Zingdex.exe",
    LegalCopyright: "2026 Zingdex · Motion Lab"
  });
  const parts = version.split(".").map((n) => parseInt(n, 10) || 0);
  vi.setFileVersion(parts[0], parts[1], parts[2], parts[3] || 0);
  vi.setProductVersion(parts[0], parts[1], parts[2], parts[3] || 0);
  vi.outputToResourceEntries(res.entries);
}

res.outputResource(exe);
fs.writeFileSync(exePath, Buffer.from(exe.generate()));
console.log("patched:", exePath);
