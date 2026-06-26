/// <reference types="vite/client" />

/** 立绘清单虚拟模块：构建/启动时由 vite.config.ts 的 portrait-manifest 插件
 *  扫描 public/assets 生成纯路径数组（`/assets/.../x.png`），不打包图片字节。 */
declare module 'virtual:portrait-manifest' {
    const portraitPaths: string[];
    export default portraitPaths;
}
