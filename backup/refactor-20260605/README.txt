GameApp 模块化拆分前备份（2026-06-05）

包含：
- app/GameApp.ts（拆分前完整版）
- app/GameAppLoop.ts
- app/GameAppExpose.ts
- FactionEditor.ts
- CityEditor.ts

恢复：将上述文件复制回 src/ 对应路径，并删除 src/data/StartingCapitals.ts 与 src/app/boot/ 目录。
