# -*- coding: utf-8 -*-
"""
全库立绘按「含盔头高」批量对齐（2026-08-03 主人定稿：战斗面板两人头一样大）。

对 public/assets 下全部在用 PNG：
  · 检测成功 + 头/脸比 ∈ [1.5, 4.5]（metric=head）→ scale = TARGET_HEAD / 头高，落盘
  · 检测失败 / 剪影异常 / 头脸比越界（metric=face 兜底）→ 保留原值不动
  · 从没调过的图（无原值）→ 检测成功的直接新增，失败的不写

用法:
  py tools/lib/portrait_head_align_all.py --dry-run   # 只统计，不写盘
  py tools/lib/portrait_head_align_all.py --apply     # 备份 + 写盘
"""
import os
import re
import sys
import json
import shutil
import datetime

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'PortraitAlign'))
from align_one import align  # noqa: E402   # 复用 tuner 同一判据

ADJ = os.path.join(ROOT, 'src', 'data', 'portrait_adjust.ts')
ASSETS = os.path.join(ROOT, 'public', 'assets')
BACKUP_DIR = os.path.join(ROOT, 'src', 'data', 'portrait_adjust_backups')
SKIP_DIRS = {'avg', 'chongfu', 'inbox', 'bgm_backup'}

DRY = '--dry-run' in sys.argv

IMAGES_OPEN = '    "images": {'


def parse_images(text):
    open_idx = text.index(IMAGES_OPEN)
    body_start = open_idx + len(IMAGES_OPEN)
    depth, i = 1, body_start
    while i < len(text):
        c = text[i]
        if c == '"':
            i += 1
            while i < len(text) and text[i] != '"':
                if text[i] == '\\':
                    i += 1
                i += 1
        elif c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0:
                break
        i += 1
    body = text[body_start:i]
    entries = {}
    re_entry = re.compile(r'"((?:[^"\\]|\\.)*)":\s*\{\s*"scale":\s*(-?[\d.]+),\s*"offsetX":\s*(-?[\d.]+),\s*"offsetY":\s*(-?[\d.]+)\s*\}')
    for m in re_entry.finditer(body):
        entries[json.loads(f'"{m.group(1)}"')] = {'scale': m.group(2), 'offsetX': m.group(3), 'offsetY': m.group(4)}
    return {'head': text[:body_start], 'entries': entries, 'tail': text[i:]}


def serialize_images(head, entries, tail):
    lines = []
    for k, v in entries.items():
        lines.append(
            f'        {json.dumps(k)}: {{\n'
            f'            "scale": {v["scale"]},\n'
            f'            "offsetX": {v["offsetX"]},\n'
            f'            "offsetY": {v["offsetY"]}\n'
            f'        }}'
        )
    return f'{head}\n' + ',\n'.join(lines) + f'\n    {tail}'


def list_pngs():
    out = []
    for d in sorted(os.listdir(ASSETS)):
        if d in SKIP_DIRS:
            continue
        p = os.path.join(ASSETS, d)
        if not os.path.isdir(p):
            continue
        for f in sorted(os.listdir(p)):
            if f.lower().endswith('.png'):
                out.append(f'/assets/{d}/{f}')
    return out


def main():
    text = open(ADJ, encoding='utf-8').read()
    parsed = parse_images(text)
    entries = parsed['entries']
    print(f'当前调校条目: {len(entries)}')

    pngs = list_pngs()
    print(f'磁盘在用 PNG: {len(pngs)}')

    stats = {'head_new': 0, 'face_fallback': 0, 'fail': 0, 'no_orig_kept': 0, 'changed': 0, 'kept': 0}
    updates = {}   # key -> 新值（仅 metric=head 的）
    failed_keys = set()

    for idx, web in enumerate(pngs):
        if (idx + 1) % 200 == 0 or idx == len(pngs) - 1:
            print(f'  进度 {idx + 1}/{len(pngs)} ...')
        abs_p = os.path.join(ROOT, 'public', web.lstrip('/'))
        if not os.path.exists(abs_p):
            continue
        try:
            res = align(abs_p)
        except Exception:
            res = {'ok': False, 'reason': '异常'}
        if not res.get('ok'):
            stats['fail'] += 1
            failed_keys.add(web)
            continue
        if res.get('metric') != 'head':
            stats['face_fallback'] += 1
            failed_keys.add(web)   # 兜底不算数，保留原值
            continue
        new_val = {'scale': str(res['scale']), 'offsetX': str(res['offsetX']), 'offsetY': str(res['offsetY'])}
        old = entries.get(web)
        if old is None:
            stats['head_new'] += 1
            stats['no_orig_kept'] += 1
        elif old != new_val:
            stats['changed'] += 1
        else:
            stats['kept'] += 1
        updates[web] = new_val

    print(f'\n===== 统计 =====')
    print(f'按头对齐（metric=head）: {stats["head_new"] + stats["changed"] + stats["kept"]} 张')
    print(f'  其中新增（从没调过）: {stats["head_new"]}')
    print(f'  覆盖旧值（值变化）: {stats["changed"]}')
    print(f'  与旧值相同: {stats["kept"]}')
    print(f'按脸兜底/检测失败（保留原值）: {stats["face_fallback"] + stats["fail"]} 张（face_fallback={stats["face_fallback"]}, fail={stats["fail"]}）')

    if DRY:
        print('\n(--dry-run 未写盘)')
        return

    # 备份
    os.makedirs(BACKUP_DIR, exist_ok=True)
    ts = datetime.datetime.now().strftime('%Y%m%d%H%M')
    bf = os.path.join(BACKUP_DIR, f'portrait_adjust_{ts}.ts')
    if not os.path.exists(bf):
        shutil.copy2(ADJ, bf)
        print(f'备份 → {bf}')

    # 合并：保留失败键的原值，更新成功的
    for k, v in updates.items():
        entries[k] = v
    open(ADJ, 'w', encoding='utf-8').write(serialize_images(parsed['head'], entries, parsed['tail']))
    print(f'✅ 已写盘：调校条目 {len(entries)} 条（新增 {stats["head_new"]}，更新 {stats["changed"]}）')


if __name__ == '__main__':
    main()
