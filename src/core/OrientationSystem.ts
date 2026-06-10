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
    public static get8DirectionIndex(from: LatLng, to: LatLng): number {
        const dx = to.lng - from.lng;
        const dy = to.lat - from.lat;

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

    public static getCityImageTransform(longitude: number): string {
        return 'none';
    }
}
