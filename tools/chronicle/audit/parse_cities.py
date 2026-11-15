#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""解析 cities_v2.ts 取 cityId/name/lat/lng/isPort。"""
import json, re, os

ROOT = r"C:\MAPWARSJ"
SRC = os.path.join(ROOT, r"src\data\cities_v2.ts")
OUT = os.path.join(ROOT, r"tools\chronicle\audit\cities_parsed.json")

src = open(SRC, encoding="utf-8").read()
# 逐对象扫描：以 "id: 'city_" 为锚，截到下一个 "\n    }," 或 "}," 结束
pat = re.compile(r"\{\s*(?:[^{}]*?)\bid:\s*'(city_[^']+)'(?:[^{}]*?)\}", re.S)
cities = {}
bad = 0
for m in pat.finditer(src):
    block = m.group(0)
    cid = m.group(1)
    nm = re.search(r"name:\s*'([^']*)'", block)
    lat = re.search(r"lat:\s*(-?[\d.]+)", block)
    lng = re.search(r"lng:\s*(-?[\d.]+)", block)
    if not (nm and lat and lng):
        bad += 1
        continue
    cities[cid] = {
        "name": nm.group(1),
        "lat": float(lat.group(1)),
        "lng": float(lng.group(1)),
        "isPort": bool(re.search(r"isPort:\s*true", block)),
    }
print("cities parsed:", len(cities), "bad:", bad)
json.dump(cities, open(OUT, "w", encoding="utf-8"), ensure_ascii=False)
