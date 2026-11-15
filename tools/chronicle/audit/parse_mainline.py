#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""解析 ChronicleMainline.generated.ts -> JSON 便于审核。"""
import json, re, sys, os, collections

ROOT = r"C:\MAPWARSJ"
GEN = os.path.join(ROOT, r"src\data\chronicle\ChronicleMainline.generated.ts")
OUT = os.path.join(ROOT, r"tools\chronicle\audit\mainline_parsed.json")

src = open(GEN, encoding="utf-8").read()
start = src.index("= [") + 2
end = src.rindex("];") + 1
data = json.loads(src[start:end])
print("events:", len(data))
keys = collections.Counter()
bkeys = collections.Counter()
for e in data:
    keys.update(e.keys())
    bkeys.update(e.get("battle", {}).keys())
print("top keys:", dict(keys))
print("battle keys:", dict(bkeys))
json.dump(data, open(OUT, "w", encoding="utf-8"), ensure_ascii=False)
print("wrote", OUT)
# battleType 取值
print("battleType:", collections.Counter(e.get("battle", {}).get("battleType") for e in data))
print("role:", collections.Counter(e.get("battle", {}).get("role") for e in data))
print("kind:", collections.Counter(e.get("kind") for e in data))
print("troops:", collections.Counter(e.get("battle", {}).get("myTroops") for e in data).most_common(20))
