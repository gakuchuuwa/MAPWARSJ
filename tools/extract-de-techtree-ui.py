#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从本机 AoE2 DE 目录抽取科技树界面的官方高清素材：
- 左侧卷轴背景 (techtree_panel.png)
- 桌面背景 (techtree_left, techtree_middle, techtree_right DDS -> PNG)
- 标题花纹 (header_ornaments.png)
- 四时代徽章 (techtree_dark age.png 等)
- 图例图标 (techtree_key_*.png)
- 框饰 (boxstyle3_*.png)
- 按钮 (button_red_4k_*.png, collapse_button_*.png)
- 节点覆盖物 (notavailable_cross_overlay_normal.png 等)
"""

import os
import shutil
from pathlib import Path
from PIL import Image

PROGRAM_DIR = Path(r"C:\Program Files (x86)\Steam\steamapps\common\AoE2DE")
DEST_DIR = Path(r"C:\MAPWARSJ\public\de-techtree\ui")

DEST_DIR.mkdir(parents=True, exist_ok=True)

# 1. 复制 PNG 素材
COPY_LIST = [
    # 背景卷轴
    (PROGRAM_DIR / "widgetui/textures/backgrounds/techtree_panel.png", "techtree_panel.png"),
    # 标题花饰
    (PROGRAM_DIR / "widgetui/textures/menu/decoration/header_ornaments.png", "header_ornaments.png"),
    (PROGRAM_DIR / "widgetui/textures/menu/decoration/header_ornaments_plain.png", "header_ornaments_plain.png"),
    # 红色按钮
    (PROGRAM_DIR / "widgetui/textures/menu/buttons/button_red_4k_normal.png", "button_red_normal.png"),
    (PROGRAM_DIR / "widgetui/textures/menu/buttons/button_red_4k_hover.png", "button_red_hover.png"),
    (PROGRAM_DIR / "widgetui/textures/menu/buttons/button_red_4k_active.png", "button_red_active.png"),
    # 折叠箭头按钮
    (PROGRAM_DIR / "widgetui/textures/ingame/panels/collapse_button_normal_full.png", "collapse_button_normal.png"),
    (PROGRAM_DIR / "widgetui/textures/ingame/panels/collapse_button_hover_full.png", "collapse_button_hover.png"),
    (PROGRAM_DIR / "widgetui/textures/ingame/panels/collapse_button_active_full.png", "collapse_button_active.png"),
    # 节点木叉与未研发遮罩
    (PROGRAM_DIR / "widgetui/textures/menu/techtree/normal/notavailable_cross_overlay_normal.png", "notavailable_cross.png"),
    (PROGRAM_DIR / "widgetui/textures/menu/techtree/normal/not_researched_overlay_normal.png", "not_researched.png"),
]

# 装饰边框 boxstyle3
for name in [
    "boxstyle3_angle_topleft.png", "boxstyle3_angle_topright.png",
    "boxstyle3_angle_bottomleft.png", "boxstyle3_angle_bottomright.png",
    "boxstyle3_edge_top.png", "boxstyle3_edge_bottom.png",
    "boxstyle3_edge_left.png", "boxstyle3_edge_right.png",
    "boxstyle3_inlay.png",
]:
    p = PROGRAM_DIR / f"widgetui/textures/menu/decoration/{name}"
    if p.exists():
        COPY_LIST.append((p, name))

# 四时代徽章
for age in ["dark age", "feudal age", "castle age", "imperial age", "archaic_age", "classical_age", "civic_age", "ant_imperial_age"]:
    p = PROGRAM_DIR / f"widgetui/textures/menu/techtree/techtree_{age}.png"
    if p.exists():
        safe_name = f"age_{age.replace(' ', '_')}.png"
        COPY_LIST.append((p, safe_name))

# 图例 icons
for key_p in (PROGRAM_DIR / "widgetui/textures/menu/techtree").glob("techtree_key_*.png"):
    COPY_LIST.append((key_p, key_p.name))

for src, dst_name in COPY_LIST:
    if src.exists():
        shutil.copy2(src, DEST_DIR / dst_name)
        print(f"Copied: {dst_name}")
    else:
        print(f"Missing: {src}")

# 2. 转换 DDS 背景为 PNG
DDS_LIST = [
    ("techtree_left.dds", "bg_wood_left.png"),
    ("techtree_middle.dds", "bg_wood_middle.png"),
    ("techtree_right.dds", "bg_wood_right.png"),
]

for src_name, dst_name in DDS_LIST:
    src_p = PROGRAM_DIR / f"widgetui/textures/backgrounds/{src_name}"
    dst_p = DEST_DIR / dst_name
    if src_p.exists():
        im = Image.open(src_p)
        im.save(dst_p, "PNG")
        print(f"Converted DDS -> {dst_name} ({im.size})")

print("Done extracting UI assets!")
