> # 🔴 铁律 · 兵种只认素材样貌，不认兵名
>
> 判断一个兵种能不能进某支军团，**只看 `public/SUCAI/` 里的素材长什么样**——甲胄形制、武器、马匹、旗号。
>
> 兵种 id 里的民族词（女真 / 波兰 / 越南 / 图皮 / 库曼…）、中文兵名、`age` 时代标签，**全都不算数**。
> 那是《帝国时代 2 DE》的出处标签，不是本作里这个兵属于谁。
>
> 反面教材（都被主人当场抓过）：
> - 「契丹军团用女真铁浮屠精锐 = 乱炖」→ **错**。契丹有铁林军重甲骑兵，那副具装甲骑的样貌本来就对。
> - 「库曼钦察弓骑不该给东北民族」→ **错**。那个素材的样貌和东北人本来就像。
> - 「捷克军团 4 档是波兰奥布奇战锤兵 = 乱炖」→ **错**。胡斯军本来就用连枷 / 战锤。
>
> **没裁图看过素材，就不许下「不符合历史 / 跨国乱炖 / 时代不对」的结论。**
> 裁图工具：`scratch/tools_sprite_sheet.py`。判据优先级：**样貌 → 兵种类型 → 时代 → 名字**。

---
title: MAPWAR 开发指南
summary: 提供本地开发、构建、调试及常见问题的操作说明。
owner: GAKU
status: active
last_updated: 2025-10-31
phase: production
---
# MAPWAR 开发指南

## 🚀 快速开始

### 启动开发服务器
```bash
npm run dev
```
服务器将在 `http://localhost:3000` 启动，并自动打开浏览器。

### 构建生产版本
```bash
npm run build
```
构建结果将输出到 `dist/` 目录。

### 预览生产版本
```bash
npm run preview
```

## 📁 项目结构

```
MAPWAR/
├── src/                        # 源代码
│   ├── main.js                 # 入口文件
│   ├── core/                   # 核心系统（待重构）
│   ├── renderer/               # 渲染层（待重构）
│   ├── systems/                # 游戏系统（待重构）
│   ├── entities/               # 游戏实体
│   ├── ui/                     # UI系统（待重构）
│   ├── data/                   # 游戏数据
│   │   ├── gameData.js         # 游戏配置数据
│   │   ├── historicalEvents.js # 历史事件
│   │   └── cities.json         # 城市数据
│   ├── terrain/                # 地形系统（待重构）
│   └── utils/                  # 工具类
├── public/                     # 静态资源
│   └── allmapsoft/             # 地图图片资源
├── game.js                     # 主游戏逻辑（待拆分）
├── game.backup.js              # 原始备份
├── terrain-map.js              # 地形地图类（待模块化）
├── index.html                  # HTML入口
├── style.css                   # 样式文件
├── vite.config.js              # Vite配置
└── package.json                # 项目配置
```

## 🔥 Vite 开发特性

### 热模块替换 (HMR)
- 修改代码后自动刷新浏览器
- 保持应用状态（大部分情况）
- 快速反馈

### 开发工具
- 浏览器控制台查看日志
- Vue DevTools / React DevTools（如需要）
- 源代码映射（Source Maps）

## 📝 当前状态

### ✅ 已完成
- [x] Vite 开发环境搭建
- [x] 静态资源迁移到 public/
- [x] 基础模块化入口
- [x] 热重载功能

### 🚧 进行中
- [ ] 代码模块化重构
- [ ] 渲染层分离
- [ ] 性能优化

### 📋 待完成
- [ ] TypeScript 迁移（可选）
- [ ] 单元测试
- [ ] 战斗系统开发

## 🐛 调试技巧

### 查看控制台日志
打开浏览器开发者工具（F12），查看 Console 标签。

### 性能分析
使用 Chrome DevTools 的 Performance 标签进行性能分析。

### 网络请求
查看 Network 标签，确认资源加载情况。

## 📚 常用命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview

# 清理 node_modules
rm -rf node_modules
npm install
```

## ⚠️ 注意事项

### 资源路径
- 静态资源放在 `public/` 目录
- 在代码中使用绝对路径引用：`/allmapsoft/...`
- Vite 会自动处理路径

### 模块导入
- 使用 ES6 模块语法：`import` / `export`
- 避免使用全局变量（逐步迁移中）

### 浏览器兼容性
- 开发环境：现代浏览器
- 生产环境：Vite 会自动处理兼容性

## 🔧 配置文件

### vite.config.js
Vite 的主配置文件，包含：
- 开发服务器配置
- 构建选项
- 插件配置

### package.json
项目依赖和脚本配置。

## 📖 学习资源

- [Vite 官方文档](https://vitejs.dev/)
- [ES6 模块](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Modules)
- [Canvas API](https://developer.mozilla.org/zh-CN/docs/Web/API/Canvas_API)

## 🎯 下一步计划

1. **模块化重构**：将 `game.js` 拆分为多个模块
2. **渲染优化**：实现离屏 Canvas 和脏矩形检测
3. **性能提升**：对象池、视口裁剪等
4. **战斗系统**：为未来的战斗场景做准备

---

*最后更新：2025-10-31*
