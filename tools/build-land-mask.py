"""
从 Natural Earth 1:10m 陆地 + 湖泊 烘出全球海陆掩膜 public/world/land-mask-ne10m.png。

🔴 [2026-10-13 主人问「为什么道路编辑器中有的海路会横穿陆地」] 海路编辑器与批量海路脚本的穿陆判据。
   world-base.png 每格 ≈18.5km，会把濑户内海、马尔马拉海、里海、珠江口当成陆地 —— 不能用来判海路。
   本掩膜 0.03°/格（≈3.3km），1 位 PNG：1 = 陆地，0 = 海/湖。
   仍然偏粗的地方：博斯普鲁斯（宽 <1km）会被判成陆地 —— 所以用它的地方一律「穿陆加代价」，不删边。

数据：Natural Earth（公共领域）ne_10m_land + ne_10m_lakes，下载自 naciscdn.org，不随项目保存。
跑法：py tools/build-land-mask.py <ne_10m_land.shp> <ne_10m_lakes.shp>
"""
import sys

import shapefile
from PIL import Image, ImageDraw

OUT = 'public/world/land-mask-ne10m.png'
RES = 0.03   # 度/格


def main():
    land_shp, lakes_shp = sys.argv[1], sys.argv[2]
    W, H = int(360 / RES), int(180 / RES)
    im = Image.new('1', (W, H), 0)
    dr = ImageDraw.Draw(im)

    def draw(shp, val):
        for s in shapefile.Reader(shp).shapes():
            parts = list(s.parts) + [len(s.points)]
            for i in range(len(parts) - 1):
                ring = s.points[parts[i]:parts[i + 1]]
                if len(ring) < 3:
                    continue
                # shapefile 约定：外环顺时针（实体），内环逆时针（洞）
                area2 = sum(ring[j][0] * ring[j + 1][1] - ring[j + 1][0] * ring[j][1] for j in range(len(ring) - 1))
                dr.polygon([((x + 180) / RES, (90 - y) / RES) for x, y in ring],
                           fill=val if area2 < 0 else 1 - val)

    draw(land_shp, 1)
    draw(lakes_shp, 0)
    im.save(OUT, optimize=True)
    print(f'{OUT}: {W}x{H}')


if __name__ == '__main__':
    main()
