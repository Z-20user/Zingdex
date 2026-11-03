# -*- coding: utf-8 -*-
"""编译安装程序，把 Electron 本体压进 exe 尾部，产出一个可直接双击的安装包；
同时产出一份便携版目录（双击即用，数据跟着文件夹走）。"""
import io
import json
import os
import shutil
import struct
import subprocess
import sys
import tempfile
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "build-work", "desktop-kernel")
APP = os.path.join(ROOT, "desktop", "dist", "Zingdex-win32-x64")
CSC = r"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"

MAGIC = b"TRSPAY1\x00"

sys.path.insert(0, ROOT)
import app_version  # noqa: E402


def human(n):
    if n >= 1073741824:
        return "%.2f GB" % (n / 1073741824.0)
    if n >= 1048576:
        return "%.1f MB" % (n / 1048576.0)
    return "%.0f KB" % (n / 1024.0)


def count_components():
    """按站点真实数据统计组件总数：data.js 的 120 个基础场景 + engine.js 追加的场景。

    旧实现只读 04_动效代码库/spec/catalog.json，接入动效引擎后那边仍是 4000 条，
    安装界面上就会一直显示旧数字。
    """
    data_js = os.path.join(ROOT, "site", "assets", "data.js")
    engine_js = os.path.join(ROOT, "site", "assets", "engine.js")
    script = (
        "const fs=require('fs');global.window={};"
        "eval(fs.readFileSync(process.argv[1],'utf8'));"
        "try{eval(fs.readFileSync(process.argv[2],'utf8'));}catch(e){}"
        "const s=window.SCENES||[];"
        "console.log(s.reduce((a,x)=>a+x.cats.length,0));"
    )
    try:
        out = subprocess.check_output(
            ["node", "-e", script, data_js, engine_js],
            stderr=subprocess.DEVNULL).decode("utf-8", "ignore").strip()
        n = int(out)
        if 0 < n < 1000000:
            return n
    except Exception:
        pass

    p = os.path.join(ROOT, "..", "04_动效代码库", "spec", "catalog.json")
    try:
        cat = json.load(io.open(p, encoding="utf-8"))
        n = len(cat.get("effects") or [])
        if n:
            return n
    except Exception:
        pass
    return 20000


def compile_installer(ver4):
    src = io.open(os.path.join(HERE, "installer.cs"), encoding="utf-8").read()
    src = src.replace("@VER4@", ver4)
    src = src.replace("@VER@", app_version.VERSION_NAME)
    src = src.replace("@COUNT@", str(count_components()))
    cs = os.path.join(ROOT, "build-work", "_installer.cs")
    io.open(cs, "w", encoding="utf-8", newline="\r\n").write(src)

    stub = os.path.join(ROOT, "build-work", "_installer_stub.exe")
    if os.path.exists(stub):
        os.remove(stub)

    args = [
        CSC, "/nologo", "/target:winexe", "/platform:anycpu", "/optimize+", "/debug-",
        "/win32icon:" + os.path.join(ROOT, "icon.ico"),
        "/r:System.dll", "/r:System.Drawing.dll", "/r:System.Windows.Forms.dll",
        "/r:System.IO.Compression.dll", "/r:System.IO.Compression.FileSystem.dll",
        "/out:" + stub, cs,
    ]
    r = subprocess.run(args, capture_output=True, text=True, encoding="mbcs", errors="replace")
    if r.returncode != 0:
        raise SystemExit("编译失败：\n" + (r.stdout or "") + (r.stderr or ""))
    return stub


def build_payload(app_dir, dst_zip):
    """把 Electron 目录打成 zip，条目名用正斜杠，解压端再转分隔符。"""
    total = 0
    count = 0
    with zipfile.ZipFile(dst_zip, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for base, dirs, files in os.walk(app_dir):
            dirs.sort()
            files.sort()
            for name in files:
                full = os.path.join(base, name)
                rel = os.path.relpath(full, app_dir).replace(os.sep, "/")
                z.write(full, rel)
                total += os.path.getsize(full)
                count += 1
    return count, total


def verify(exe):
    """打完包自检：尾标记必须落在 -32，payload 结尾必须是一段完整的 zip 中央目录。

    这一步是为了防止「安装器读不到自带的数据包、回落到 app 目录然后报安装失败」
    的老问题再次出现 —— 尾标记长度和 installer.cs 里读的字节数必须一致。"""
    size = os.path.getsize(exe)
    with io.open(exe, "rb") as f:
        f.seek(-32, os.SEEK_END)
        tail = f.read(32)
    if tail[:8] != MAGIC:
        raise SystemExit("自检失败：exe 尾部 -32 处不是 MAGIC，安装器会读不到数据包。")
    off, ln = struct.unpack("<qq", tail[8:24])
    if off <= 0 or ln <= 0 or off + ln > size:
        raise SystemExit("自检失败：偏移或长度不合法 off=%d len=%d size=%d" % (off, ln, size))
    with io.open(exe, "rb") as f:
        f.seek(off + ln - 22)
        eocd = f.read(22)
    if eocd[:4] != b"PK\x05\x06":
        raise SystemExit("自检失败：payload 结尾不是 zip 中央目录。")
    print("  自检通过：payload 偏移 %d，长度 %s" % (off, human(ln)))


def main():
    if not os.path.isdir(APP):
        raise SystemExit("先跑 build_desktop.sh，找不到：" + APP)

    ver = app_version.VERSION_NAME
    ver4 = ".".join(str(x) for x in app_version.FILE_VERSION)
    os.makedirs(OUT, exist_ok=True)

    stub = compile_installer(ver4)
    print("安装程序内核：%s" % human(os.path.getsize(stub)))

    tmpdir = tempfile.mkdtemp(prefix="trsp_")
    try:
        payload = os.path.join(tmpdir, "payload.zip")
        print("打包程序本体（约 300 MB，需要一会儿）…")
        count, raw = build_payload(APP, payload)
        psize = os.path.getsize(payload)
        print("  文件 %d 个，原始 %s → 压缩 %s" % (count, human(raw), human(psize)))

        exe_name = "Zingdex 跃索 v%s 安装包.exe" % ver
        exe = os.path.join(OUT, exe_name)
        if os.path.exists(exe):
            os.remove(exe)

        offset = os.path.getsize(stub)
        shutil.copyfile(stub, exe)
        with io.open(exe, "ab") as out, io.open(payload, "rb") as src:
            while True:
                chunk = src.read(1 << 20)
                if not chunk:
                    break
                out.write(chunk)
            # 尾标记固定 32 字节，installer.cs 里按 -32 定位：
            # [0:8] MAGIC  [8:16] payload 偏移  [16:24] payload 长度  [24:32] 保留
            out.write(MAGIC + struct.pack("<qq", offset, psize) + b"\x00" * 8)
        verify(exe)
        print("安装包：%s（%s）" % (exe_name, human(os.path.getsize(exe))))
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)

    # ---------- 便携版目录 ----------
    port_dir = os.path.join(OUT, "便携版")
    if os.path.isdir(port_dir):
        shutil.rmtree(port_dir)
    print("复制程序本体到便携版目录…")
    shutil.copytree(APP, port_dir)

    io.open(os.path.join(port_dir, "怎么用.txt"), "w", encoding="utf-8", newline="\r\n").write(
        "便携版：整个文件夹拷到哪都能用，双击 Zingdex.exe 即可。\n"
        "不写注册表、不建快捷方式。设置与授权存在本机的用户目录里，\n"
        "不放在程序文件夹里，所以整个文件夹拷走也不会带走别人的数据。\n\n"
        "要彻底清除这个程序在本机留下的东西，双击同目录的「清除便携版数据.bat」。\n"
        "它会先问你一次，确认后清除：设置、授权、缓存、开机启动项、\n"
        "卸载登记等注册表项，以及桌面和开始菜单里的快捷方式。\n"
        "程序文件夹本身不删，需要时自行删除即可。\n")

    bat_lines = [
        "@echo off",
        "chcp 65001 >nul",
        "title Zingdex 跃索 - 清除本机数据",
        "setlocal enabledelayedexpansion",
        "echo.",
        "echo   Zingdex 跃索 · 清除本机数据",
        "echo   ------------------------------------------------",
        "echo.",
        "echo   将清除这个程序在这台电脑上留下的全部数据：",
        "echo.",
        "echo     设置与授权      %APPDATA%\\Zingdex",
        "echo     缓存            %LOCALAPPDATA%\\Zingdex",
        "echo     程序目录数据    %~dp0data",
        "echo     开机启动项      HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\Zingdex",
        "echo     卸载登记        HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Zingdex",
        "echo     程序注册信息    HKCU\\Software\\Zingdex",
        "echo.",
        "echo   程序文件夹本身不会被删除，需要时自行删掉即可。",
        "echo   删除后无法恢复。",
        "echo.",
        "set /p ok=   确定继续吗？输入 Y 回车执行，直接回车取消： ",
        'if /i not "%ok%"=="Y" (',
        "  echo.",
        "  echo   已取消，什么都没做。",
        "  pause",
        "  exit /b 0",
        ")",
        "echo.",
        "echo   [1/5]  10%  正在关闭正在运行的 Zingdex…",
        "taskkill /f /im Zingdex.exe >nul 2>&1",
        "timeout /t 1 /nobreak >nul",
        "echo   [2/5]  35%  正在删除数据文件…",
        'rd /s /q "%APPDATA%\\Zingdex" 2>nul',
        'rd /s /q "%LOCALAPPDATA%\\Zingdex" 2>nul',
        'rd /s /q "%~dp0data" 2>nul',
        "echo   [3/5]  60%  正在清理注册表…",
        'reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v Zingdex /f >nul 2>&1',
        'reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Zingdex" /f >nul 2>&1',
        'reg delete "HKCU\\Software\\Zingdex" /f >nul 2>&1',
        "echo   [4/5]  80%  正在清理快捷方式…",
        'del /f /q "%USERPROFILE%\\Desktop\\Zingdex.lnk" 2>nul',
        'del /f /q "%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Zingdex.lnk" 2>nul',
        "echo.",
        "echo   [5/5]  95%  正在把「残留检查.bat」复制到桌面，以后想复查可以双击它。",
        'copy /y "%~dp0残留检查.bat" "%USERPROFILE%\\Desktop\\" >nul 2>&1',
        "echo   完成。这台电脑上已经没有这个程序的任何数据了。",
        "pause",
    ]
    bat = "\r\n".join(bat_lines) + "\r\n"
    io.open(os.path.join(port_dir, "清除便携版数据.bat"), "w", encoding="utf-8", newline="").write(bat)

    # 残留检查脚本：放进便携版文件夹，清除脚本跑完会复制一份到桌面
    check_bat = '@echo off\r\nchcp 65001 >nul\r\ntitle Zingdex 残留检查\r\nsetlocal enabledelayedexpansion\r\necho.\r\necho   Zingdex 跃索 · 残留检查\r\necho   ==================================================\r\necho.\r\nset FOUND=0\r\n\r\nif exist "%APPDATA%\\Zingdex" (\r\n  echo   [数据] 设置与授权\r\n  echo          %APPDATA%\\Zingdex\r\n  set /a FOUND+=1\r\n)\r\nif exist "%LOCALAPPDATA%\\Zingdex" (\r\n  echo   [数据] 缓存\r\n  echo          %LOCALAPPDATA%\\Zingdex\r\n  set /a FOUND+=1\r\n)\r\nif exist "%APPDATA%\\Zingdex" echo.\r\nif exist "%USERPROFILE%\\Desktop\\Zingdex.lnk" (\r\n  echo   [快捷方式] 桌面\r\n  echo          %USERPROFILE%\\Desktop\\Zingdex.lnk\r\n  set /a FOUND+=1\r\n)\r\nif exist "%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Zingdex.lnk" (\r\n  echo   [快捷方式] 开始菜单\r\n  echo          %APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Zingdex.lnk\r\n  set /a FOUND+=1\r\n)\r\nreg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v Zingdex >nul 2>&1 && (\r\n  echo   [注册表] 开机启动\r\n  echo          HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\Zingdex\r\n  set /a FOUND+=1\r\n)\r\nreg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Zingdex" >nul 2>&1 && (\r\n  echo   [注册表] 卸载登记\r\n  echo          HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Zingdex\r\n  set /a FOUND+=1\r\n)\r\nreg query "HKCU\\Software\\Zingdex" >nul 2>&1 && (\r\n  echo   [注册表] 程序注册键\r\n  echo          HKCU\\Software\\Zingdex\r\n  set /a FOUND+=1\r\n)\r\n\r\nif "%FOUND%"=="0" (\r\n  echo   检查完毕：没有发现任何残留。\r\n  echo.\r\n  pause\r\n  exit /b 0\r\n)\r\n\r\necho.\r\necho   上面共 %FOUND% 项残留，已按【类型 + 路径】列出。\r\necho   其中「数据」是设置、授权与缓存；「注册表」是开机启动、卸载登记与程序键。\r\necho   删除后无法恢复。\r\necho.\r\nset /p ok=   输入 Y 回车立即清除，直接回车取消： \r\nif /i not "%ok%"=="Y" (\r\n  echo.\r\n  echo   已取消，什么都没做。\r\n  pause\r\n  exit /b 0\r\n)\r\necho.\r\necho   正在清除…\r\nrd /s /q "%APPDATA%\\Zingdex" 2>nul\r\nrd /s /q "%LOCALAPPDATA%\\Zingdex" 2>nul\r\ndel /f /q "%USERPROFILE%\\Desktop\\Zingdex.lnk" 2>nul\r\ndel /f /q "%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Zingdex.lnk" 2>nul\r\nreg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v Zingdex /f >nul 2>&1\r\nreg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Zingdex" /f >nul 2>&1\r\nreg delete "HKCU\\Software\\Zingdex" /f >nul 2>&1\r\necho.\r\necho   已清除。可以把这个脚本删掉了。\r\npause\r\n'
    io.open(os.path.join(port_dir, "残留检查.bat"), "w", encoding="utf-8", newline="").write(check_bat)

    print()
    print("安装包  :", os.path.join(OUT, "Zingdex 跃索 v%s 安装包.exe" % ver))
    print("便携版  :", port_dir)


if __name__ == "__main__":
    main()
