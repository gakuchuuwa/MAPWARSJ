import { LatLng } from '../types/core';

/**
 * Unified Orientation System
 * Handles all facing direction logic for game entities (Player, AI, City, NPC).
 * 
 * Rules:
 * 1. Immobile Entities (City, NPC):
 *    - Longitude > 100 (East): Face West (Left)
 *    - Longitude < 100 (West): Face East (Right)
 * 
 * 2. Mobile Entities (Player, AI Army):
 *    - Moving: Face direction of movement.
 *    - Combat: Face the opponent.
 *    - Siege Combat: Attacker faces the city (adhering to city's "front").
 */
export class OrientationSystem {
    // Threshold longitude for East/West division
    private static readonly LONGITUDE_THRESHOLD = 100;

    /**
     * Determines if an entity should face LEFT (West) based on its longitude.
     * Used for Immobile entities (Cities, NPCs) and Siege Defenders.
     * 
     * @param longitude Current longitude
     * @returns true if should face Left, false if Right
     */
    public static getImmobileFacing(longitude: number): boolean {
        // East of 100 (>100) -> Face West (Left) -> true
        // West of 100 (<100) -> Face East (Right) -> false
        return longitude > this.LONGITUDE_THRESHOLD;
    }

    /**
     * Determines facing based on movement.
     * 
     * @param currentLng Current longitude
     * @param lastLng Previous longitude
     * @returns true if moving Left (West), false if Right (East), null if no significant movement
     */
    public static getMovementFacing(currentLng: number, lastLng: number): boolean | null {
        const diff = currentLng - lastLng;
        if (Math.abs(diff) > 0.000001) {
            return diff < 0; // Moving West -> Face Left
        }
        return null; // No change
    }

    /**
     * Determines facing for an attacker in combat.
     * Attacker should face the target.
     * 
     * @param attackerPos Attacker's position
     * @param targetPos Target's position
     * @returns true if attacker should face Left (target is to the West)
     */
    public static getCombatFacing(attackerPos: LatLng, targetPos: LatLng): boolean {
        return targetPos.lng < attackerPos.lng;
    }

    /**
     * Calculates the 8-way direction index (0-7) from a source to a target.
     * 0: South (Down)
     * 1: Southwest
     * 2: West (Left)
     * 3: Northwest
     * 4: North (Up)
     * 5: Northeast
     * 6: East (Right)
     * 7: Southeast
     * 
     * @param from Source position
     * @param to Target position
     */
    /**
     * 🔴 [2026-09-01] Web Mercator 屏幕位移。
     * 战略地图是 Web Mercator：屏幕上纵向被 1/cos(lat) 拉伸，纬度越高拉得越狠。
     * 用原始经纬度差算出来的角度 ≠ 屏幕上看到的行进角度（lat 45° 差 ~10°，lat 60° 差 ~19.5°），
     * 8 向量化后会整档打偏，观感就是「军团侧着走」。所有朝向一律先换到屏幕轴再算角。
     */
    private static mercatorY(latDeg: number): number {
        const lat = Math.max(-85.0511, Math.min(85.0511, latDeg)) * Math.PI / 180;
        return Math.log(Math.tan(Math.PI / 4 + lat / 2));
    }

    /** 经纬度位移 → 屏幕轴位移（dx 向东为正，dy 向北为正；单位任意，只用比值） */
    public static screenDelta(from: LatLng, to: LatLng): { dx: number; dy: number } {
        return {
            dx: (to.lng - from.lng) * Math.PI / 180,
            dy: this.mercatorY(to.lat) - this.mercatorY(from.lat),
        };
    }

    /** 屏幕角（数学制：0=东，逆时针为正），供 get8DirectionFromAngle 用 */
    public static getScreenAngleDeg(from: LatLng, to: LatLng): number {
        const d = this.screenDelta(from, to);
        return Math.atan2(d.dy, d.dx) * (180 / Math.PI);
    }

    /** 屏幕罗盘角（0=北，顺时针为正），供船 16 向 / 平滑转向用 */
    public static getScreenCompassDeg(from: LatLng, to: LatLng): number {
        const d = this.screenDelta(from, to);
        return Math.atan2(d.dx, d.dy) * (180 / Math.PI);
    }

    /** 罗盘角（0=北 CW） → 数学角（0=东 CCW） */
    public static compassToMathDeg(compassDeg: number): number {
        return 90 - compassDeg;
    }

    public static get8DirectionIndex(from: LatLng, to: LatLng): number {
        // 🔴 走 Mercator 屏幕轴，不用原始经纬度差（见 screenDelta 注释）
        const { dx, dy } = this.screenDelta(from, to);

        // Atan2 returns angle in radians from -PI to PI
        // 0 is East (Right), -PI/2 is North (Up), PI/2 is South (Down), PI/-PI is West (Left)
        // Leaflet coords: lat increases UP (North), lng increases RIGHT (East)
        // So dy > 0 is North, dx > 0 is East

        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        return this.get8DirectionFromAngle(angle);
    }

    /**
     * Converts an angle (degrees) to 0-7 sprite index.
     * Sprite order is CLOCKWISE starting from Northeast:
     * 0: Northeast (Right-Up)  ← 484
     * 1: East (Right)          ← 485
     * 2: Southeast (Right-Down)← 486
     * 3: South (Down)          ← 487
     * 4: Southwest (Left-Down) ← 488
     * 5: West (Left)           ← 489
     * 6: Northwest (Left-Up)   ← 490
     * 7: North (Up)            ← 491
     */
    public static get8DirectionFromAngle(angleDeg: number): number {
        // Normalize to 0-360
        let angle = ((angleDeg % 360) + 360) % 360;

        // Add offset to center sectors (22.5° per half-sector)
        angle = (angle + 22.5) % 360;

        // Calculate sector (0 = East-ish, going counterclockwise in Cartesian)
        const sector = Math.floor(angle / 45);

        // Sprites are ordered CLOCKWISE from Northeast
        // Cartesian sector 0 = East → sprite 1
        // Cartesian sector 1 = NE → sprite 0
        // So: sprite = (9 - sector) % 8
        return (9 - sector) % 8;
    }

    /**
     * 带迟滞的 8 方向量化（2026-09-01 主人报「军团/商队频繁更换朝向」）：
     * 移动方向停在扇区边界（±22.5°）附近时，微小角度波动会让朝向贴图在相邻 index 来回跳。
     * 加死区：角度必须越过「当前扇区边界 + deadZoneDeg」才切换，边界抖动被死区吸收。
     */
    public static get8DirectionWithHysteresis(
        currentIndex: number,
        angleDeg: number,
        deadZoneDeg: number = 10,
    ): number {
        const candidate = this.get8DirectionFromAngle(angleDeg);
        if (candidate === currentIndex) return currentIndex;
        // 当前 index 的扇区中心角（逆推 get8DirectionFromAngle：sector=(9-index)%8，中心=45°×sector）
        const sector = (9 - currentIndex) % 8;
        const centerDeg = sector * 45;
        let diff = ((angleDeg - centerDeg) % 360 + 360) % 360;
        if (diff > 180) diff -= 360;
        // 半扇区 22.5° + 死区：角度还没越出当前扇区（含死区）→ 保持不切换
        if (Math.abs(diff) <= 22.5 + deadZoneDeg) return currentIndex;
        return candidate;
    }

    public static getCityImageTransform(longitude: number): string {
        return 'none';
    }
}
