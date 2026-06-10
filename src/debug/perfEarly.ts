/**
 * 尽可能早启动性能监控（在 main.ts / GameApp 之前由 index.html 引入）
 * 面板默认关闭，按 F3 / Ctrl+Shift+M / Shift+` 或顶部「性能」按钮打开。
 */
import { PerformanceMonitor } from './PerformanceMonitor';

PerformanceMonitor.getInstance().initAtPageLoad();
