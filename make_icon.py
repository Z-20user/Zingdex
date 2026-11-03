# -*- coding: utf-8 -*-
"""图标生成 —— 「动点」标记（Windows .ico + 安卓各密度共用同一套绘制代码）。

设计说明
    · 荧幕绿底：从 #CFF95E 到 #A9D82F 的极轻竖向渐变，圆角 23.5%——
      桌面和手机都是圆角图标，绿底在深色/浅色任务栏上都立得住。
    · 图形只有一个母题：一个正在移动的点，和它甩出来的尾巴。
      头是实心圆，尾巴沿一条贝塞尔曲线向左下拖细、拖淡。
    · 全图只有两种颜色：品牌绿 + 近黑 #0F1408。没有环、没有字、没有装饰线。
    · 4× 超采样后缩小，保证 16px 下仍然是一个清晰的「点 + 尾」。

产物
    icon.ico            多尺寸 Windows 图标（16–256）
    icon-preview.png    1024px 预览图
    icon-256.png        256px 单图（安卓图标脚本会用到同款绘制函数）
"""

import os

from PIL import Image, ImageDraw
from PIL.Image import Resampling

OUT_DIR = os.path.dirname(os.path.abspath(__file__))
ICO = os.path.join(OUT_DIR, "icon.ico")
PREVIEW = os.path.join(OUT_DIR, "icon-preview.png")
PNG256 = os.path.join(OUT_DIR, "icon-256.png")

BG_TOP = (207, 249, 94)
BG_BOTTOM = (169, 216, 47)
GLYPH = (15, 20, 8)

# 两个应用要一眼分得开：
#   light —— 主应用「跃索」：绿底、黑墨
#   dark  —— 密钥应用「跃索密钥」：黑底、绿墨
THEMES = {
    "light": {"top": (207, 249, 94), "bottom": (169, 216, 47), "glyph": (15, 20, 8)},
    "dark": {"top": (22, 26, 33), "bottom": (8, 9, 12), "glyph": (198, 242, 76)},
}

# 尾巴的贝塞尔控制点（0–1，左上为原点）
P_HEAD = (0.648, 0.362)
P_CTRL = (0.452, 0.398)
P_TAIL = (0.302, 0.678)
HEAD_R = 0.152


def _gradient(size, top=None, bottom=None):
    top = top or BG_TOP
    bottom = bottom or BG_BOTTOM
    strip = Image.new("RGB", (1, size))
    px = strip.load()
    for y in range(size):
        t = y / (size - 1)
        px[0, y] = tuple(round(a + (b - a) * t) for a, b in zip(top, bottom))
    return strip.resize((size, size))


def _bezier(t):
    a = (1 - t) ** 2
    b = 2 * (1 - t) * t
    c = t * t
    return (
        a * P_HEAD[0] + b * P_CTRL[0] + c * P_TAIL[0],
        a * P_HEAD[1] + b * P_CTRL[1] + c * P_TAIL[1],
    )


def _draw_mark(img, scale, offset=(0, 0), mono=False, glyph=None):
    """在一张透明图上画「动点」；mono=True 时整枚改纯白（安卓主题图标用）。"""
    S = img.size[0]
    ox, oy = offset

    def X(v):
        return ox + v * S * scale + (S - S * scale) / 2

    def Y(v):
        return oy + v * S * scale + (S - S * scale) / 2

    color = (255, 255, 255) if mono else (glyph or GLYPH)
    head = S * scale * HEAD_R
    d = ImageDraw.Draw(img)

    # 尾巴：沿曲线铺一串逐渐变细、变淡的圆
    steps = 26
    for i in range(steps, 0, -1):
        t = i / steps
        cx, cy = _bezier(t)
        r = head * (1 - 0.82 * t)
        if r < 1:
            continue
        a = int(255 * (1 - 0.80 * t) ** 1.3)
        px, py = X(cx), Y(cy)
        d.ellipse([px - r, py - r, px + r, py + r], fill=color + (a,))

    # 头：实心圆
    hx, hy = X(P_HEAD[0]), Y(P_HEAD[1])
    d.ellipse([hx - head, hy - head, hx + head, hy + head], fill=color + (255,))


def render_monochrome(size=512, scale=0.72):
    """纯白剪影版本，供 Android 13 主题图标（monochrome 层）使用。"""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    _draw_mark(img, scale, mono=True)
    return img


def render(size=1024, rounded=True, scale=1.0, background=True, theme="light"):
    """渲染完整图标。rounded=False 时输出满版方形（安卓自适应图标前景用）。
    theme: light = 绿底黑墨（主应用）；dark = 黑底绿墨（密钥应用）。"""
    S = size
    t = THEMES.get(theme, THEMES["light"])
    if background:
        img = _gradient(S, t["top"], t["bottom"]).convert("RGBA")
        if rounded:
            mask = Image.new("L", (S, S), 0)
            ImageDraw.Draw(mask).rounded_rectangle(
                [0, 0, S - 1, S - 1], radius=int(S * 0.235), fill=255
            )
            img.putalpha(mask)
            edge = Image.new("RGBA", (S, S), (0, 0, 0, 0))
            ImageDraw.Draw(edge).rounded_rectangle(
                [2, 2, S - 3, S - 3], radius=int(S * 0.232),
                outline=(255, 255, 255, 26), width=max(2, int(S * 0.002)),
            )
            img.alpha_composite(edge)
    else:
        img = Image.new("RGBA", (S, S), (0, 0, 0, 0))

    _draw_mark(img, scale, glyph=t["glyph"])
    return img


if __name__ == "__main__":
    big = render(2048)
    big.resize((1024, 1024), Resampling.LANCZOS).save(PREVIEW)
    big.resize((256, 256), Resampling.LANCZOS).save(PNG256)
    big.save(
        ICO,
        format="ICO",
        sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )
    print("icon written:", ICO)
    print("preview   :", PREVIEW)
