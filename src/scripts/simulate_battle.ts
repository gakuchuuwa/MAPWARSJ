
// Simulation of CombatSystem.ts logic

const DAMAGE_COEFFICIENT = 5.8;
const DISADVANTAGE_FACTOR = 0.75;
const DELTA_TIME = 0.016; // 16ms steps (60fps)

function simulateBattle(initialTroops: number) {
    let attackerTroops = initialTroops;
    let defenderTroops = initialTroops;
    let time = 0;

    console.log(`Starting battle with ${initialTroops} troops each.`);

    while (attackerTroops > 0 && defenderTroops > 0) {
        time += DELTA_TIME;

        const baseAttackerDamage = Math.sqrt(attackerTroops) * DAMAGE_COEFFICIENT * DELTA_TIME;
        const baseDefenderDamage = Math.sqrt(defenderTroops) * DAMAGE_COEFFICIENT * DELTA_TIME;

        // No advantage
        const damageToDefender = baseAttackerDamage;
        const damageToAttacker = baseDefenderDamage;

        attackerTroops = Math.max(0, attackerTroops - damageToAttacker);
        defenderTroops = Math.max(0, defenderTroops - damageToDefender);
    }

    console.log(`Battle ended at ${time.toFixed(2)} seconds.`);
    return time;
}

simulateBattle(30000);
simulateBattle(10000);
simulateBattle(1000);
