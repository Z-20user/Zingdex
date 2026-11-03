# -*- coding: utf-8 -*-
"""
Zingdex 跃索 —— 应用元信息（单一数据源）

launcher.py / make_splash.py / build_exe.* / build_apk.sh / version.txt
全部从这里取版本号，避免各处写死后对不上。
升级版本时只改这个文件 + version.txt 里的四段数字。
"""

APP_NAME = "Zingdex"                 # 英文名 / 目录名 / 进程名
DISPLAY_NAME = "跃索"                   # 中文显示名
FULL_NAME = "Zingdex 跃索 · 动效组件库"
VERSION_NAME = "3.1.6"                 # 三段式版本（Android versionName / 界面显示）
VERSION_CODE = 88                       # Android versionCode，每次构建 +1
FILE_VERSION = (3, 1, 6, 0)            # Windows 四段文件版本

PACKAGE = "com.transientlab.motion"    # Android 包名
KEYSTORE_ALIAS = "zingdex"

# 极简配色，与站内设计令牌保持一致
COLOR_BG = "#0A0B0D"
COLOR_BG_2 = "#101318"
COLOR_LINE = "#1E222A"
COLOR_INK = "#F3F2ED"
COLOR_INK_2 = "#A6ACB6"
COLOR_INK_3 = "#6C7280"
COLOR_INK_4 = "#4E5460"
COLOR_ACC = "#C6F24C"
