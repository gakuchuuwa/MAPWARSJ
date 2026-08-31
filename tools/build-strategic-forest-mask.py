#!/usr/bin/env python3
"""Build the strategic forest-biome mask from RESOLVE Ecoregions 2017.

Source: https://ecoregions.appspot.com/
Dataset: https://storage.googleapis.com/teow2016/Ecoregions2017.zip
License: CC BY 4.0

The output pixel value is the RESOLVE BIOME_NUM. Only forest biomes are
rasterized; zero means that the location is outside a forest ecoregion.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import shapefile
from PIL import Image, ImageDraw


WIDTH = 2160
HEIGHT = 1080
FOREST_BIOMES = {1, 2, 3, 4, 5, 6, 12, 14}


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


def build(source: Path, output: Path) -> None:
    reader = shapefile.Reader(str(source), encoding='latin1')
    image = Image.new('L', (WIDTH, HEIGHT), 0)
    draw = ImageDraw.Draw(image)
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

    output.parent.mkdir(parents=True, exist_ok=True)
    image.save(output, optimize=True)
    covered = sum(count for count, value in (image.getcolors(maxcolors=256) or []) if value > 0)
    print({
        'forest_features': forest_features,
        'size': [WIDTH, HEIGHT],
        'covered_pixels': covered,
        'covered_percent': round(covered / (WIDTH * HEIGHT) * 100, 2),
        'output': str(output),
    })


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--output', type=Path, default=Path('public/world/strategic-forest-mask.png'))
    args = parser.parse_args()
    build(args.source, args.output)


if __name__ == '__main__':
    main()
