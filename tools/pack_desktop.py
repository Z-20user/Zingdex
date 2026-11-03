# -*- coding: utf-8 -*-
"""把静态站点打成两个 Windows 单文件程序：便携版 + 安装版。

不带 Electron，用系统自带的 Edge 渲染，所以整个包只有几 MB 而不是 300 MB。

用法：python tools/pack_desktop.py
产物：build-work/desktop/Zingdex-便携版.exe
      build-work/desktop/Zingdex-安装版.exe
"""
import hashlib
import io
import os
import subprocess
import sys
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SITE = os.path.join(ROOT, "site")
OUTDIR = os.path.join(ROOT, "build-work", "desktop")
WORK = os.path.join(ROOT, "build-work", "_pack")

sys.path.insert(0, ROOT)
import app_version  # noqa: E402

CSC = r"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"

SKIP_EXT = {".map"}


def make_zip(dst):
    """把 site 目录压成 zip，条目直接落在根上（index.html 在顶层）。"""
    n = 0
    with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for base, dirs, files in os.walk(SITE):
            dirs.sort()
            for f in sorted(files):
                if f.startswith("_") or f.endswith(".map") or f in SKIP_EXT:
                    continue
                full = os.path.join(base, f)
                rel = os.path.relpath(full, SITE).replace("\\", "/")
                z.write(full, rel)
                n += 1
    return n


def compile_exe(src, out, zip_path, icon, installer):
    args = [
        CSC, "/nologo", "/target:winexe", "/platform:anycpu", "/optimize+", "/debug-",
        "/win32icon:" + icon,
        "/resource:" + zip_path + ",site.zip",
        "/r:System.dll",
        "/r:System.Core.dll",
        "/r:System.IO.Compression.dll",
        "/r:System.IO.Compression.FileSystem.dll",
        "/r:System.Windows.Forms.dll",
        "/out:" + out,
    ]
    if installer:
        args.append("/define:INSTALLER")
    args.append(src)
    r = subprocess.run(args, capture_output=True, text=True)
    if r.returncode != 0 or not os.path.exists(out):
        raise SystemExit("编译失败：\n" + (r.stdout or "") + (r.stderr or ""))


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main():
    if not os.path.exists(CSC):
        raise SystemExit("找不到 csc.exe：" + CSC)

    ver = app_version.VERSION_NAME
    ver4 = ".".join(str(x) for x in app_version.FILE_VERSION)
    for d in (OUTDIR, WORK):
        os.makedirs(d, exist_ok=True)

    zpath = os.path.join(WORK, "site.zip")
    n = make_zip(zpath)
    zsize = os.path.getsize(zpath)
    print("站点文件：%d 个 → site.zip %.2f MB" % (n, zsize / 1048576))

    src = io.open(os.path.join(HERE, "launcher.cs"), encoding="utf-8").read()
    src = src.replace("@VER4@", ver4).replace("@VER@", ver)
    csrc = os.path.join(WORK, "launcher.cs")
    io.open(csrc, "w", encoding="utf-8").write(src)

    icon = os.path.join(ROOT, "icon.ico")

    targets = [
        ("Zingdex-便携版.exe", False),
        ("Zingdex-安装版.exe", True),
    ]
    print()
    for name, inst in targets:
        out = os.path.join(OUTDIR, name)
        if os.path.exists(out):
            os.remove(out)
        compile_exe(csrc, out, zpath, icon, inst)
        print("%-22s %6.2f MB   sha256 %s" % (name, os.path.getsize(out) / 1048576, sha256(out)[:16]))

    print("\n产物目录：", OUTDIR)


if __name__ == "__main__":
    main()
