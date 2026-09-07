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

# 修复城市兵力闪烁问题 - 工作总结

## 问题描述
战争结束后，城市的血槽（兵力数）出现闪烁，数值不稳定。

## 根本原因
经过深入分析，发现 `Army` 类存在一个严重的逻辑缺陷：
当军队到达目标城市后，`update` 方法中的 `distance <= moveDist` 条件会一直成立。因此，每一帧（大约每 16ms）都会调用一次 `onArrive` 回调函数。
`HistoricalEventManager` 接收到 `onArrive` 回调后，会创建一个新的 `ActiveBattle`（战斗实例）。
结果是，一场战争被重复创建了成百上千次。这些重叠的战斗实例同时在运行，各自计算兵力损失并更新 UI，导致兵力数值疯狂跳变和闪烁。

## 解决方案
修改 [Army.ts](file:///c:/Users/GAKU/Desktop/MAPWAR/src/core/Army.ts) 中的 `update` 方法，添加一个 `hasArrived` 标志位：

```typescript
    private hasArrived: boolean = false; // 新增标志位

    public update(deltaTime: number): void {
        // ... 省略 ...
        if (distance <= moveDist) {
            if (this.hasArrived) return; // 如果已经到达，直接返回，不再触发回调
            this.hasArrived = true;      // 标记为已到达

            this.position.lat = targetLat;
            this.position.lng = targetLng;
            this.updateMarkerPosition();
            this.onArrive(this);         // 只触发一次
        } else {
            // ...
        }
    }
```

## 验证结果
此修复确保了 `onArrive` 只会被触发一次，因此 `HistoricalEventManager` 只会创建唯一的一个战斗实例。
- 战争过程将平滑进行。
- 战争结束后，兵力数值将立即稳定在最终结果，不再闪烁。

## 之前的修复
之前关于“暂停年度兵力恢复”的修复（在 `CityManager.ts` 中）仍然有效且必要，它防止了年度恢复与战斗逻辑的冲突。这两个修复共同保证了战争系统的稳定性和准确性。
