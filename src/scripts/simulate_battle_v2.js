
// Simulation of CombatSystem.ts logic (Dual Mode)

const DELTA_TIME = 0.016; // 16ms steps (60fps)

function simulateBattle(initialTroops, type) {
    const DAMAGE_COEFFICIENT = type === 'field' ? 11.6 : 5.8;

    let attackerTroops = initialTroops;
    let defenderTroops = initialTroops;
    let time = 0;

    console.log(`Starting ${type.toUpperCase()} battle with ${initialTroops} troops each (Coeff: ${DAMAGE_COEFFICIENT}).`);

    while (attackerTroops > 0 && defenderTroops > 0) {
        time += DELTA_TIME;

        const baseAttackerDamage = Math.sqrt(attackerTroops) * DAMAGE_COEFFICIENT * DELTA_TIME;
        const baseDefenderDamage = Math.sqrt(defenderTroops) * DAMAGE_COEFFICIENT * DELTA_TIME;

        // No advantage simulated here
        const damageToDefender = baseAttackerDamage;
        const damageToAttacker = baseDefenderDamage;

        attackerTroops = Math.max(0, attackerTroops - damageToAttacker);
        defenderTroops = Math.max(0, defenderTroops - damageToDefender);
    }

    console.log(`Battle ended at ${time.toFixed(2)} seconds.`);
    return time;
}

console.log('--- Field Battles (Fast) ---');
simulateBattle(30000, 'field');
simulateBattle(10000, 'field');

console.log('\n--- Siege Battles (Slow) ---');
simulateBattle(30000, 'siege');
simulateBattle(10000, 'siege');
