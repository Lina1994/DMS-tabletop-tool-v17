// src/utils/difficultyCalculator.js

const XP_THRESHOLDS_PER_LEVEL = {
    1: { easy: 25, medium: 50, difficult: 75, deadly: 100 },
    2: { easy: 50, medium: 100, difficult: 150, deadly: 200 },
    3: { easy: 75, medium: 150, difficult: 225, deadly: 400 },
    4: { easy: 125, medium: 250, difficult: 375, deadly: 500 },
    5: { easy: 250, medium: 500, difficult: 750, deadly: 1100 },
    6: { easy: 300, medium: 600, difficult: 900, deadly: 1400 },
    7: { easy: 350, medium: 750, difficult: 1100, deadly: 1700 },
    8: { easy: 450, medium: 900, difficult: 1400, deadly: 2100 },
    9: { easy: 550, medium: 1100, difficult: 1600, deadly: 2400 },
    10: { easy: 600, medium: 1200, difficult: 1900, deadly: 2800 },
    11: { easy: 800, medium: 1600, difficult: 2400, deadly: 3600 },
    12: { easy: 1000, medium: 2000, difficult: 3000, deadly: 4500 },
    13: { easy: 1100, medium: 2200, difficult: 3400, deadly: 5100 },
    14: { easy: 1250, medium: 2500, difficult: 3800, deadly: 5700 },
    15: { easy: 1400, medium: 2800, difficult: 4300, deadly: 6400 },
    16: { easy: 1600, medium: 3200, difficult: 4800, deadly: 7200 },
    17: { easy: 2000, medium: 3900, difficult: 5900, deadly: 8800 },
    18: { easy: 2100, medium: 4200, difficult: 6300, deadly: 9500 },
    19: { easy: 2400, medium: 4900, difficult: 7300, deadly: 10900 },
    20: { easy: 2800, medium: 5700, difficult: 8500, deadly: 12700 },
};

const ENCOUNTER_MULTIPLIERS = [
    { count: 1, multiplier: 1 },
    { count: 2, multiplier: 1.5 },
    { count: 3, multiplier: 2 },
    { count: 7, multiplier: 2.5 },
    { count: 11, multiplier: 3 },
    { count: 15, multiplier: 4 },
];

function getMultiplier(numMonsters, numCharacters) {
    let baseMultiplier = 1;
    let multiplierExplanation = `Base: ${numMonsters} rival(es) -> `; // Added explanation

    if (numMonsters === 0) {
        multiplierExplanation += `0 (no hay monstruos)`;
        return { multiplier: 0, explanation: multiplierExplanation };
    }

    let foundRule = false;
    for (let i = ENCOUNTER_MULTIPLIERS.length - 1; i >= 0; i--) {
        if (numMonsters >= ENCOUNTER_MULTIPLIERS[i].count) {
            baseMultiplier = ENCOUNTER_MULTIPLIERS[i].multiplier;
            multiplierExplanation += `${baseMultiplier} (regla: ${ENCOUNTER_MULTIPLIERS[i].count} o más rivales)`;
            foundRule = true;
            break;
        }
    }
    if (!foundRule) {
        multiplierExplanation += `${baseMultiplier} (regla: 1 rival)`;
    }

    let finalMultiplier = baseMultiplier;
    let partySizeAdjustment = "";

    // Adjust for party size
    if (numCharacters < 3) {
        // If less than 3 characters, use the next higher multiplier
        const currentIndex = ENCOUNTER_MULTIPLIERS.findIndex(m => m.multiplier === baseMultiplier);
        if (currentIndex < ENCOUNTER_MULTIPLIERS.length - 1) {
            finalMultiplier = ENCOUNTER_MULTIPLIERS[currentIndex + 1].multiplier;
            partySizeAdjustment = ` (ajuste por tamaño de grupo < 3: se usa el siguiente multiplicador, ahora ${finalMultiplier})`;
        }
    } else if (numCharacters >= 6) {
        // If 6 or more characters, use the next lower multiplier
        const currentIndex = ENCOUNTER_MULTIPLIERS.findIndex(m => m.multiplier === baseMultiplier);
        if (currentIndex > 0) {
            finalMultiplier = ENCOUNTER_MULTIPLIERS[currentIndex - 1].multiplier;
            partySizeAdjustment = ` (ajuste por tamaño de grupo >= 6: se usa el multiplicador anterior, ahora ${finalMultiplier})`;
        }
    }

    return { multiplier: finalMultiplier, explanation: multiplierExplanation + partySizeAdjustment };
}

export function calculateEncounterDifficulty(characters, monsters) {
    const result = {
        difficulty: "",
        adjustedXP: 0,
        totalMonsterXP: 0,
        multiplier: 0,
        multiplierExplanation: "", // Added
        currentThreshold: { lower: 0, upper: 0 },
        allThresholds: { easy: 0, medium: 0, difficult: 0, deadly: 0 },
        playerThresholdDetails: [] // Added
    };

    if (!characters || characters.length === 0) {
        result.difficulty = "No hay personajes para calcular la dificultad.";
        return result;
    }
    if (!monsters || monsters.length === 0) {
        result.difficulty = "No hay monstruos en el encuentro.";
        return result;
    }

    // 1. Determine group XP thresholds and player details
    const groupThresholds = { easy: 0, medium: 0, difficult: 0, deadly: 0 };
    const playerThresholdDetails = [];

    for (const char of characters) {
        const level = char.level || 1; // Default to level 1 if not specified
        const thresholds = XP_THRESHOLDS_PER_LEVEL[level];
        if (thresholds) {
            groupThresholds.easy += thresholds.easy;
            groupThresholds.medium += thresholds.medium;
            groupThresholds.difficult += thresholds.difficult;
            groupThresholds.deadly += thresholds.deadly;
            playerThresholdDetails.push({
                name: char.name,
                level: level,
                thresholds: thresholds
            });
        }
    }
    result.allThresholds = groupThresholds;
    result.playerThresholdDetails = playerThresholdDetails;

    // 2. Determine total monster XP
    let totalMonsterXP = 0;
    for (const monster of monsters) {
        // Ensure px is a number, default to 0 if not valid
        totalMonsterXP += parseInt(monster.px) || 0;
    }
    result.totalMonsterXP = totalMonsterXP; 

    // 3. Modify total XP based on number of monsters and party size
    const numMonsters = monsters.length;
    const numCharacters = characters.length;
    const { multiplier, explanation } = getMultiplier(numMonsters, numCharacters);
    result.multiplier = multiplier; 
    result.multiplierExplanation = explanation; // Set the multiplier explanation

    const adjustedMonsterXP = totalMonsterXP * multiplier;
    result.adjustedXP = adjustedMonsterXP;

    // 4. Compare adjusted XP with group thresholds
    if (adjustedMonsterXP === 0) {
        result.difficulty = "Sin dificultad (0 PX ajustados)";
        result.currentThreshold = { lower: 0, upper: groupThresholds.easy };
    } else if (adjustedMonsterXP < groupThresholds.easy) {
        result.difficulty = "Fácil";
        result.currentThreshold = { lower: 0, upper: groupThresholds.easy };
    } else if (adjustedMonsterXP < groupThresholds.medium) {
        result.difficulty = "Media"; // Changed from "Dificultad media"
        result.currentThreshold = { lower: groupThresholds.easy, upper: groupThresholds.medium };
    } else if (adjustedMonsterXP < groupThresholds.difficult) {
        result.difficulty = "Difícil";
        result.currentThreshold = { lower: groupThresholds.medium, upper: groupThresholds.difficult };
    } else if (adjustedMonsterXP < groupThresholds.deadly) {
        result.difficulty = "Mortal";
        result.currentThreshold = { lower: groupThresholds.difficult, upper: groupThresholds.deadly };
    } else {
        result.difficulty = "Extremo"; // Changed from "Mortal (Extremo)"
        result.currentThreshold = { lower: groupThresholds.deadly, upper: adjustedMonsterXP }; // Upper bound is current XP for extreme
    }

    return result;
}