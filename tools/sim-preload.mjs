/**
 * 模拟器预加载 hook：把 Vite 专用虚拟模块 `virtual:portrait-manifest`
 * 桩成空数组，使命令行 tsx 能加载 src/data（其间接 import portrait_defaults）。
 * 仅命令行模拟器使用；不影响 vite 构建（构建时由 vite 插件提供真实清单）。
 */
import { registerHooks } from 'node:module';

const VIRTUAL_ID = 'virtual:portrait-manifest';

registerHooks({
    resolve(specifier, context, nextResolve) {
        if (specifier === VIRTUAL_ID) {
            return { url: VIRTUAL_ID, shortCircuit: true };
        }
        return nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
        if (url === VIRTUAL_ID) {
            return { format: 'module', source: 'export default [];', shortCircuit: true };
        }
        return nextLoad(url, context);
    },
});
