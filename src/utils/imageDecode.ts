/**
 * 图片下载完先在后台解码，解完（或解码失败）再回调。
 *
 * 🔴 [2026-11-09 查战略地图单帧尖峰] `img.onload` 只代表字节到了，**像素还没解码**：
 *    第一次 `drawImage` 会在主线程同步解码整张图。项目里的树/建筑/兵种都是横向长条雪碧图
 *    （最宽 24012px），无头 Edge 实测据点民生层一次 drawHuntingTree 就 222ms。
 *    `HTMLImageElement.decode()` 在解码线程做完再 resolve，之后首画只是贴图。
 *    失败（坏图、浏览器不支持）也照常回调，调用方的「出错也算加载结束」逻辑不变。
 */
export function decodeThen(img: HTMLImageElement, cb: () => void): void {
    if (typeof img.decode !== 'function') { cb(); return; }
    img.decode().then(cb, cb);
}
