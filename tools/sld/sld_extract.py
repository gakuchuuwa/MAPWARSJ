#!/usr/bin/env python3
"""
AoE2 DE SLD/SLDX 格式解析器（纯标准库，依据 openage doc/media/sld-files.md）。

SLD 用 DXT1(BC1)/DXT4(BC4) GPU 纹理压缩，与 SLP 2.0N 完全不同的格式。
本脚本：解析 SLDX 头 + 帧头 + 各图层，解 DXT1 主图层 + DXT4 玩家色遮罩，
输出逐帧透明 PNG。

用法：
  python3 sld_extract.py <input.sld> <out_dir> [--probe]
  --probe 只打印帧结构（方向数/帧数/图层/尺寸），不输出 PNG。
"""
import struct, os, sys, zlib


# ── DXT1 (BC1) 解压：8 字节 → 16 个 (r,g,b,a) ──────────────────────────
def decode_dxt1_block(block: bytes):
    c0, c1, indices = struct.unpack('<HHI', block)
    r0 = (c0 >> 11) & 0x1F; g0 = (c0 >> 5) & 0x3F; b0 = c0 & 0x1F
    r1 = (c1 >> 11) & 0x1F; g1 = (c1 >> 5) & 0x3F; b1 = c1 & 0x1F
    colors = [(r0, g0, b0), (r1, g1, b1), None, None]
    if c0 > c1:
        colors[2] = ((2*r0 + r1)//3, (2*g0 + g1)//3, (2*b0 + b1)//3)
        colors[3] = ((r0 + 2*r1)//3, (g0 + 2*g1)//3, (b0 + 2*b1)//3)
    else:
        colors[2] = ((r0 + r1)//2, (g0 + g1)//2, (b0 + b1)//2)
        colors[3] = None  # 全透明
    px = []
    for i in range(16):
        idx = (indices >> (2*i)) & 0x3
        c = colors[idx]
        if c is None:
            px.append((0, 0, 0, 0))
        else:
            r, g, b = c
            px.append((r*255//31, g*255//63, b*255//31, 255))
    return px  # 16 像素，行主序


# ── DXT4 (BC4) 解压：8 字节 → 16 个单通道值 ─────────────────────────────
def decode_bc4_block(block: bytes):
    a0, a1 = block[0], block[1]
    indices = block[2:8]
    lookup = [0]*8
    lookup[0], lookup[1] = a0, a1
    if a0 > a1:
        for i in range(2, 8):
            lookup[i] = ((8 - i)*a0 + (i - 1)*a1) // 7
    else:
        for i in range(2, 6):
            lookup[i] = ((6 - i)*a0 + (i - 1)*a1) // 5
        lookup[6], lookup[7] = 0, 255
    idx0 = indices[0] | (indices[1] << 8) | (indices[2] << 16)
    idx1 = indices[3] | (indices[4] << 8) | (indices[5] << 16)
    vals = []
    for i in range(8):
        vals.append(lookup[(idx0 >> (3*i)) & 0x7])
    for i in range(8):
        vals.append(lookup[(idx1 >> (3*i)) & 0x7])
    return vals  # 16 值，行主序


# ── 命令数组：把 (skip, draw) 命令序列铺到 w×h 画布上 ──────────────────
def place_blocks(commands, block_array, decode_fn, w, h, copy_from=None, copy_w=0, copy_off=(0, 0)):
    bw = (w + 3) // 4
    canvas = bytearray(w * h * 4)   # 全透明 RGBA
    bi = 0       # 压缩块数组游标
    dp = 0       # 当前块线性位置
    for skip, draw in commands:
        if copy_from is not None:
            # 🔴 flag1 bit7（reuse previous frame）：skip 块 = 复制上一帧「同 canvas 坐标」块。
            #   上一帧图层 offset 可能与当前帧不同（attack/death 逐帧变），copy_off 对齐 canvas 坐标。
            dx, dy = copy_off
            for _ in range(skip):
                bx = dp % bw; by = dp // bw
                sbx = bx + dx; sby = by + dy
                for j in range(16):
                    x = bx*4 + (j % 4); y = by*4 + (j // 4)
                    sx = sbx*4 + (j % 4); sy = sby*4 + (j // 4)
                    if x < w and y < h and 0 <= sx < copy_w and 0 <= sy:
                        o = (y*w + x)*4
                        so = (sy*copy_w + sx)*4
                        if so + 4 <= len(copy_from):
                            canvas[o:o+4] = copy_from[so:so+4]
                dp += 1
        else:
            dp += skip
        for _ in range(draw):
            block = block_array[bi]; bi += 1
            bx = dp % bw; by = dp // bw
            vals = decode_fn(block)
            for j in range(16):
                x = bx*4 + (j % 4); y = by*4 + (j // 4)
                if x < w and y < h:
                    v = vals[j]
                    if isinstance(v, tuple):
                        canvas[(y*w+x)*4:(y*w+x)*4+4] = bytes(v)
                    else:
                        canvas[(y*w+x)*4:(y*w+x)*4+4] = bytes((v, v, v, 255))
            dp += 1
    return bytes(canvas)


# ── 图层读取：4 字节 content_length（含自身）+ 4 字节对齐 padding ──────
def read_layer(data, pos):
    content_length = struct.unpack('<I', data[pos:pos+4])[0]
    body = data[pos+4 : pos+content_length]
    actual = content_length + ((4 - content_length) % 4)
    return body, pos + actual


def parse_graphics_body(body):
    """主图层/阴影图层 body：<4H2B 头 + 命令数组 + 压缩块。返回 (x1,y1,x2,y2,w,h,flag1,commands,blocks)。"""
    x1, y1, x2, y2, flag1, unk = struct.unpack('<4H2B', body[:10])
    w = x2 - x1; h = y2 - y1
    p = 10
    cmd_len = struct.unpack('<H', body[p:p+2])[0]; p += 2
    commands = []
    for _ in range(cmd_len):
        commands.append((body[p], body[p+1])); p += 2
    blocks = body[p:]
    return x1, y1, x2, y2, w, h, flag1, commands, blocks


def render_main_to_canvas(layers, cw, ch):
    """把一帧主图层解码并铺到 canvas 尺寸画布（按 offset 定位），返回 RGBA bytes。"""
    if 'main' not in layers:
        return None
    x1, y1, x2, y2, w, h, flag1, commands, blocks = layers['main']
    block_list = [blocks[k*8:(k+1)*8] for k in range(len(blocks)//8)]
    sprite = place_blocks(commands, block_list, decode_dxt1_block, w, h)
    canvas = bytearray(cw * ch * 4)
    for y in range(h):
        if y1 + y >= ch:
            break
        src = y * w * 4
        dst = ((y1 + y) * cw + x1) * 4
        canvas[dst:dst + w*4] = sprite[src:src + w*4]
    return bytes(canvas)


def parse_mask_body(body):
    """损伤/玩家色遮罩 body：<2B 头 + 命令数组 + 压缩块。"""
    flag1, unk = body[0], body[1]
    p = 2
    cmd_len = struct.unpack('<H', body[p:p+2])[0]; p += 2
    commands = []
    for _ in range(cmd_len):
        commands.append((body[p], body[p+1])); p += 2
    blocks = body[p:]
    return flag1, commands, blocks


def parse_sld(path):
    with open(path, 'rb') as f:
        data = f.read()
    magic, version, num_frames, unk1, header_len, unk3 = struct.unpack('<4s4HI', data[:16])
    assert magic == b'SLDX', f'bad magic {magic!r}'
    # 🔴 [2026-08-19 修] 头长不是固定 16！offset 8-10 那个字段就是**帧数据起点**，实测取值 16 或 14。
    #   原来硬编码 pos=16，14 字节头的文件会从第 2 帧起整段错位 →
    #   `struct.error: unpack requires a buffer of 4 bytes`。
    #   全库 7372 个 SLD 里 226 个是 14 字节头（其中 84 个是单位精灵：楼船 walk、桡桨船 walk、
    #   独木舟 walk、投石船 attack，以及陆战的精锐热那亚弩手/套索骑兵/精锐胡斯卡尔 idle 等）。
    #   按本字段取起点后，223 个船 SLD 全部解析通过、0 失败。
    pos = header_len if header_len in (14, 16) else 16
    frames = []
    for i in range(num_frames):
        cw, ch, hx, hy, ftype, unk, fidx = struct.unpack('<4H2BH', data[pos:pos+12])
        pos += 12
        # 🔴 ftype 位序是 LSB 起：bit0=主图层 bit1=阴影 bit2=??? bit3=损伤 bit4=玩家色
        # （openage 文档的 bit 表写反了，但它的例子 0x17=主+阴影+???+玩家色 才是对的，与 martondobos 一致）
        layers = {}
        if ftype & 0x01:  # 主图层
            body, pos = read_layer(data, pos)
            layers['main'] = parse_graphics_body(body)
        if ftype & 0x02:  # 阴影图层
            body, pos = read_layer(data, pos)
            layers['shadow'] = parse_graphics_body(body)
        if ftype & 0x04:  # ??? 图层（未文档化，跳过）
            body, pos = read_layer(data, pos)
            layers['unknown'] = body
        if ftype & 0x08:  # 损伤遮罩
            body, pos = read_layer(data, pos)
            layers['damage'] = parse_mask_body(body)
        if ftype & 0x10:  # 玩家色遮罩
            body, pos = read_layer(data, pos)
            layers['playercolor'] = parse_mask_body(body)
        frames.append((cw, ch, hx, hy, ftype, fidx, layers))
    return version, frames


def save_png(path, px, w, h):
    def chunk(tag, content):
        c = tag + content
        return struct.pack('>I', len(content)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    raw = b''.join(b'\x00' + px[y*w*4:(y+1)*w*4] for y in range(h))
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(raw, 9))
    png += chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(png)


if __name__ == '__main__':
    path = sys.argv[1]
    out_dir = sys.argv[2] if len(sys.argv) > 2 else 'frames'
    probe = '--probe' in sys.argv
    version, frames = parse_sld(path)
    print(f'version={version}  num_frames={len(frames)}')
    if probe:
        # 统计帧头结构
        from collections import Counter
        types = Counter(f[4] for f in frames)
        idxs = [f[5] for f in frames]
        dims = Counter((f[0], f[1]) for f in frames)
        print('frame_type 分布:', dict(types))
        print('frame_index 范围:', min(idxs), '..', max(idxs), '去重数', len(set(idxs)))
        print('canvas 尺寸分布:', dict(dims))
        # 第一帧图层详情
        cw, ch, hx, hy, ftype, fidx, layers = frames[0]
        print(f'首帧: canvas {cw}x{ch} hotspot({hx},{hy}) ftype={ftype:#x} fidx={fidx}')
        for k, v in layers.items():
            if k in ('main', 'shadow'):
                x1, y1, x2, y2, w, hh, flag1, cmds, blocks = v
                total_draw = sum(d for _, d in cmds)
                print(f'  {k}: offset({x1},{y1})-({x2},{y2}) {w}x{hh} flag1={flag1:#x} 命令数={len(cmds)} 总draw块={total_draw} 块字节={len(blocks)} (应={total_draw*8})')
            elif k in ('damage', 'playercolor'):
                flag1, cmds, blocks = v
                total_draw = sum(d for _, d in cmds)
                print(f'  {k}: flag1={flag1:#x} 命令数={len(cmds)} 总draw块={total_draw} 块字节={len(blocks)}')
            else:
                print(f'  {k}: {len(v)} bytes')
        sys.exit(0)
    os.makedirs(out_dir, exist_ok=True)
    # 输出每帧主图层 PNG（玩家色遮罩先跳过，先验证主图层）
    for i, (cw, ch, hx, hy, ftype, fidx, layers) in enumerate(frames):
        if 'main' not in layers:
            print(f'frame {i} fidx={fidx} 无主图层，跳过'); continue
        x1, y1, x2, y2, w, h, flag1, commands, blocks = layers['main']
        # 块数组按 8 字节切
        block_list = [blocks[k*8:(k+1)*8] for k in range(len(blocks)//8)]
        px = place_blocks(commands, block_list, decode_dxt1_block, w, h)
        save_png(os.path.join(out_dir, f'f{fidx:04d}.png'), px, w, h)
    print(f'输出 {len(frames)} 帧到 {out_dir}')
