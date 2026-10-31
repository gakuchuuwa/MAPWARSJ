#!/usr/bin/env python3
"""Build the historical land-use mask from HYDE 3.3 (baseline scenario).

Source: Klein Goldewijk, K., Beusen, A., Doelman, J., Stehfest, E. (2017, updated 2024),
        History Database of the Global Environment 3.3, Utrecht University / PBL.
        https://doi.org/10.24416/UU01-94FNH0
License: CC BY 4.0 (cite the source above).

Input: HYDE zip files <year>_lu.zip (hyde33_c7_base_mrt2023/zip/), each holding
       cropland<year>.asc / pasture<year>.asc in km^2 per 5' cell (ESRI ASCII grid, 4320x2160).

Output (public/world/land-use-hyde.png, 1440x720, 0.25 deg per pixel, plate carree, north up):
  R = 1000 BC, G = 1000 AD, B = 1500 AD
  value = (cropland + pasture) / cell area, 0..1 scaled to 0..255.
  Natural rangeland grazing is excluded: it is not forest clearing.
"""

from __future__ import annotations

import argparse
import io
import math
import zipfile
from pathlib import Path

import numpy as np
from PIL import Image

YEARS = (('1000BC', 'R'), ('1000AD', 'G'), ('1500AD', 'B'))
NCOLS, NROWS = 4320, 2160
BLOCK = 3                      # 5' -> 15' (0.25 deg)
EARTH_R_KM = 6371.0088


def read_asc(z: zipfile.ZipFile, name: str) -> np.ndarray:
    with z.open(name) as f:
        text = io.TextIOWrapper(f, encoding='ascii')
        for _ in range(6):
            text.readline()
        grid = np.loadtxt(text, dtype=np.float32)
    grid[grid < 0] = 0
    return grid


def cell_area_km2() -> np.ndarray:
    """Area of each 5' row (km^2), rows ordered north to south like the grid."""
    step = math.radians(1 / 12)
    lat_top = np.radians(90 - np.arange(NROWS) / 12)
    lat_bot = lat_top - step
    return (EARTH_R_KM ** 2 * step * (np.sin(lat_top) - np.sin(lat_bot))).astype(np.float32)


def land_use_fraction(zip_path: Path, year: str) -> np.ndarray:
    with zipfile.ZipFile(zip_path) as z:
        used = read_asc(z, f'cropland{year}.asc') + read_asc(z, f'pasture{year}.asc')
    area = np.repeat(cell_area_km2()[:, None], NCOLS, axis=1)
    used_b = used.reshape(NROWS // BLOCK, BLOCK, NCOLS // BLOCK, BLOCK).sum(axis=(1, 3))
    area_b = area.reshape(NROWS // BLOCK, BLOCK, NCOLS // BLOCK, BLOCK).sum(axis=(1, 3))
    return np.clip(used_b / area_b, 0, 1)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--src', type=Path, required=True, help='folder holding <year>_lu.zip')
    parser.add_argument('--output', type=Path, default=Path('public/world/land-use-hyde.png'))
    args = parser.parse_args()
    channels = []
    for year, ch in YEARS:
        frac = land_use_fraction(args.src / f'{year}_lu.zip', year)
        print(f'{year} ({ch}): mean {frac.mean():.4f}, max {frac.max():.3f}')
        channels.append(np.round(frac * 255).astype(np.uint8))
    Image.fromarray(np.stack(channels, axis=2), 'RGB').save(args.output, optimize=True)
    print('wrote', args.output, args.output.stat().st_size, 'bytes')


if __name__ == '__main__':
    main()
