# -*- coding: utf-8 -*-
"""生成安卓图标资源（与 Windows 图标共用 make_icon 的绘制代码）。

产物
    app/res/mipmap-*/ic_launcher.png            传统方形图标（48–192）
    app/res/mipmap-*/ic_launcher_round.png      圆形图标
    app/res/drawable-*/ic_launcher_foreground.png  自适应图标前景（108dp 画布）
    app/res/drawable-*/splash_logo.png          启动页中央标记（88dp）

自适应图标的前景只留 61% 安全区，否则各厂商的圆形 / 方形遮罩会切边。
"""

import os
import sys

from PIL import Image, ImageDraw
from PIL.Image import Resampling

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))   # 复用上级目录的 make_icon.py

import make_icon  # noqa: E402
# 换应用时用环境变量指到别的工程
#   ICON_RES   目标 res 目录
#   ICON_THEME light（绿底黑墨，主应用）/ dark（黑底绿墨，密钥应用）
RES = os.environ.get("ICON_RES") or os.path.join(HERE, "app", "res")
THEME = os.environ.get("ICON_THEME", "light")

DENSITIES = {
    "mdpi": 1.0,
    "hdpi": 1.5,
    "xhdpi": 2.0,
    "xxhdpi": 3.0,
    "xxxhdpi": 4.0,
}

LAUNCHER_DP = 48
FOREGROUND_DP = 108
SPLASH_DP = 88


def circle_mask(size):
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, size - 1, size - 1], fill=255)
    return mask


def save(img, folder, name, size):
    out_dir = os.path.join(RES, folder)
    os.makedirs(out_dir, exist_ok=True)
    img.resize((size, size), Resampling.LANCZOS).save(os.path.join(out_dir, name))


def main():
    for density, mult in DENSITIES.items():
        px = int(round(LAUNCHER_DP * mult))
        full = make_icon.render(max(px * 4, 512), theme=THEME)

        # 方形（圆角）图标
        save(full, "mipmap-" + density, "ic_launcher.png", px)

        # 圆形图标
        rounded = make_icon.render(max(px * 4, 512), theme=THEME)
        rounded.putalpha(circle_mask(rounded.size[0]))
        save(rounded, "mipmap-" + density, "ic_launcher_round.png", px)

        # 自适应图标前景：透明底 + 缩到安全区
        fg_px = int(round(FOREGROUND_DP * mult))
        fg = make_icon.render(max(fg_px * 2, 320), background=False, scale=0.72, theme=THEME)
        save(fg, "drawable-" + density, "ic_launcher_foreground.png", fg_px)

        # 启动页标记
        sp_px = int(round(SPLASH_DP * mult))
        sp = make_icon.render(max(sp_px * 2, 320), background=False, scale=0.95, theme=THEME)
        save(sp, "drawable-" + density, "splash_logo.png", sp_px)

        # Android 13 主题图标（单色层）
        mono_px = int(round(FOREGROUND_DP * mult))
        mono = make_icon.render_monochrome(max(mono_px * 2, 320), scale=0.72)
        save(mono, "drawable-" + density, "ic_launcher_monochrome.png", mono_px)

        print("  %-8s launcher %dpx · foreground %dpx · splash %dpx"
              % (density, px, fg_px, sp_px))

    # 自适应图标描述（Android 8.0+）
    anydpi = os.path.join(RES, "mipmap-anydpi-v26")
    os.makedirs(anydpi, exist_ok=True)
    adaptive = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
    <monochrome android:drawable="@drawable/ic_launcher_monochrome"/>
</adaptive-icon>
"""
    for name in ("ic_launcher.xml", "ic_launcher_round.xml"):
        with open(os.path.join(anydpi, name), "w", encoding="utf-8") as fh:
            fh.write(adaptive)
    print("  adaptive icon xml -> mipmap-anydpi-v26/")


if __name__ == "__main__":
    main()
