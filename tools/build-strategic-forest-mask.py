#!/usr/bin/env python3
"""Build the strategic forest mask from RESOLVE + Hansen tree cover.

Source: https://ecoregions.appspot.com/
Dataset: https://storage.googleapis.com/teow2016/Ecoregions2017.zip
License: CC BY 4.0

Tree cover: Hansen/UMD/Google/USGS/NASA Global Forest Change (year 2000)
Tile layer: https://api.resourcewatch.org/v1/layer/0cba3c4f-2d3b-4fb1-8c93-c951dc1da84b
License: CC BY 4.0

Output channels:
  R = RESOLVE BIOME_NUM (zero outside forest ecoregions)
  G = Hansen tree-canopy density, 0..100 percent
  B = reserved (zero)
"""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
import io
import math
from pathlib import Path
from urllib.request import Request, urlopen

import numpy as np
import shapefile
from PIL import Image, ImageDraw, ImageFilter


WIDTH = 2160
HEIGHT = 1080
FOREST_BIOMES = {1, 2, 3, 4, 5, 6, 12, 14}
HANSEN_ZOOM = 4
HANSEN_TILE_URL = (
    'https://earthengine.google.org/static/hansen_2014/'
    'gfw_loss_tree_year_10_2014/{z}/{x}/{y}.png'
)


def project(lng: float, lat: float) -> tuple[float, float]:
    return ((lng + 180.0) / 360.0 * WIDTH, (90.0 - lat) / 180.0 * HEIGHT)


def draw_ring(draw: ImageDraw.ImageDraw, ring: list[tuple[float, float]], value: int) -> None:
    if len(ring) < 3:
        return
    longitudes = [point[0] for point in ring]
    crosses_antimeridian = max(longitudes) - min(longitudes) > 180.0
    if not crosses_antimeridian:
        draw.polygon([project(lng, lat) for lng, lat in ring], fill=value)
        return

    shifted = [(lng + 360.0 if lng < 0 else lng, lat) for lng, lat in ring]
    projected = [project(lng, lat) for lng, lat in shifted]
    draw.polygon(projected, fill=value)
    draw.polygon([(x - WIDTH, y) for x, y in projected], fill=value)


def fetch_hansen_tile(x: int, y: int, cache: Path) -> tuple[int, int, Image.Image]:
    path = cache / str(HANSEN_ZOOM) / str(x) / f'{y}.png'
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        url = HANSEN_TILE_URL.format(z=HANSEN_ZOOM, x=x, y=y)
        request = Request(url, headers={'User-Agent': 'MAPWARSJ forest-mask builder'})
        with urlopen(request, timeout=45) as response:
            payload = response.read()
        Image.open(io.BytesIO(payload)).verify()
        path.write_bytes(payload)
    return x, y, Image.open(path).convert('RGB').getchannel('G')


def build_hansen_canopy(cache: Path) -> Image.Image:
    tile_count = 1 << HANSEN_ZOOM
    world_size = tile_count * 256
    mosaic = Image.new('L', (world_size, world_size), 0)
    coords = [(x, y) for y in range(tile_count) for x in range(tile_count)]
    with ThreadPoolExecutor(max_workers=12) as executor:
        for x, y, tile in executor.map(lambda p: fetch_hansen_tile(*p, cache), coords):
            mosaic.paste(tile, (x * 256, y * 256))

    mercator = np.asarray(mosaic, dtype=np.float32)
    lng_x = (np.arange(WIDTH, dtype=np.float32) + 0.5) / WIDTH * world_size - 0.5
    lat = 90.0 - (np.arange(HEIGHT, dtype=np.float32) + 0.5) / HEIGHT * 180.0
    safe_lat = np.clip(lat, -85.05112878, 85.05112878)
    merc_y = (
        1.0 - np.arcsinh(np.tan(np.radians(safe_lat))) / math.pi
    ) * 0.5 * world_size - 0.5
    xi = np.clip(np.rint(lng_x).astype(np.int32), 0, world_size - 1)
    yi = np.clip(np.rint(merc_y).astype(np.int32), 0, world_size - 1)
    canopy = mercator[yi[:, None], xi[None, :]] * (100.0 / 255.0)
    image = Image.fromarray(np.rint(canopy).astype(np.uint8), 'L')
    return image.filter(ImageFilter.GaussianBlur(radius=1.15))


def build(source: Path, output: Path, hansen_cache: Path) -> None:
    reader = shapefile.Reader(str(source), encoding='latin1')
    biome_image = Image.new('L', (WIDTH, HEIGHT), 0)
    draw = ImageDraw.Draw(biome_image)
    forest_features = 0

    for shape_record in reader.iterShapeRecords():
        biome = int(shape_record.record['BIOME_NUM'])
        if biome not in FOREST_BIOMES:
            continue
        forest_features += 1
        shape = shape_record.shape
        starts = list(shape.parts) + [len(shape.points)]
        for index in range(len(starts) - 1):
            draw_ring(draw, shape.points[starts[index]:starts[index + 1]], biome)

    canopy_image = build_hansen_canopy(hansen_cache)
    zero = Image.new('L', (WIDTH, HEIGHT), 0)
    image = Image.merge('RGB', (biome_image, canopy_image, zero))
    output.parent.mkdir(parents=True, exist_ok=True)
    image.save(output, optimize=True)
    covered = sum(count for count, value in (biome_image.getcolors(maxcolors=256) or []) if value > 0)
    canopy_pixels = np.asarray(canopy_image)
    print({
        'forest_features': forest_features,
        'size': [WIDTH, HEIGHT],
        'covered_pixels': covered,
        'covered_percent': round(covered / (WIDTH * HEIGHT) * 100, 2),
        'canopy_mean_on_globe': round(float(canopy_pixels.mean()), 2),
        'canopy_pixels_ge_30': int((canopy_pixels >= 30).sum()),
        'output': str(output),
    })


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--output', type=Path, default=Path('public/world/strategic-forest-mask.png'))
    parser.add_argument('--hansen-cache', type=Path, default=Path('.cache/hansen-treecover'))
    args = parser.parse_args()
    build(args.source, args.output, args.hansen_cache)


if __name__ == '__main__':
    main()
