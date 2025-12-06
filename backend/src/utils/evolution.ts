import type { Blipkin } from "../generated/prisma";

/**
 * Evolution stages and their requirements
 */
export const EVOLUTION_STAGES = {
  baby: {
    name: "Baby Blipkin",
    minLevel: 1,
    maxLevel: 5,
    description: "Your Blipkin has just hatched!",
  },
  child: {
    name: "Child Blipkin",
    minLevel: 6,
    maxLevel: 15,
    description: "Your Blipkin is learning and growing!",
  },
  teen: {
    name: "Teen Blipkin",
    minLevel: 16,
    maxLevel: 30,
    description: "Your Blipkin is full of energy!",
  },
  adult: {
    name: "Adult Blipkin",
    minLevel: 31,
    maxLevel: 50,
    description: "Your Blipkin has fully matured!",
  },
  mega: {
    name: "Mega Blipkin",
    minLevel: 51,
    maxLevel: 99,
    description: "Your Blipkin has evolved to its ultimate form!",
  },
  elder: {
    name: "Elder Blipkin",
    minLevel: 100,
    maxLevel: 999,
    description: "Your Blipkin has achieved legendary status!",
  },
} as const;

/**
 * Mega forms and their care style requirements
 */
export const MEGA_FORMS = {
  nurturer: {
    name: "Nurturer",
    description: "Born from love and care",
    requiredRatio: {
      feeds: 0.35, // 35%+ of all actions are feeds
      plays: 0.25,
      cleans: 0.25,
      rests: 0.15,
    },
    color: "#FF6EC7", // Pink
  },
  explorer: {
    name: "Explorer",
    description: "Always seeking new experiences",
    requiredRatio: {
      plays: 0.50, // 50%+ of all actions are plays
      feeds: 0.20,
      cleans: 0.15,
      rests: 0.15,
    },
    color: "#FFD93D", // Yellow/Orange
  },
  chaos: {
    name: "Chaos",
    description: "Unpredictable and wild",
    requiredRatio: {
      plays: 0.40,
      feeds: 0.30,
      cleans: 0.10, // Low cleaning = chaos
      rests: 0.20,
    },
    color: "#A855F7", // Purple
  },
  calm: {
    name: "Calm",
    description: "Zen and balanced",
    requiredRatio: {
      rests: 0.35, // 35%+ rests
      cleans: 0.30, // High cleanliness
      feeds: 0.20,
      plays: 0.15,
    },
    color: "#00D9FF", // Cyan
  },
} as const;

/**
 * Calculate which evolution stage the Blipkin should be at
 */
export function calculateEvolutionStage(level: number): keyof typeof EVOLUTION_STAGES {
  if (level >= EVOLUTION_STAGES.elder.minLevel) return "elder";
  if (level >= EVOLUTION_STAGES.mega.minLevel) return "mega";
  if (level >= EVOLUTION_STAGES.adult.minLevel) return "adult";
  if (level >= EVOLUTION_STAGES.teen.minLevel) return "teen";
  if (level >= EVOLUTION_STAGES.child.minLevel) return "child";
  return "baby";
}

/**
 * Calculate which mega form the Blipkin should evolve into
 * Based on care history ratios
 */
export function calculateMegaForm(blipkin: Pick<Blipkin, "totalFeeds" | "totalPlays" | "totalCleans" | "totalRests">): keyof typeof MEGA_FORMS {
  const total = blipkin.totalFeeds + blipkin.totalPlays + blipkin.totalCleans + blipkin.totalRests;

  if (total === 0) return "nurturer"; // Default

  const ratios = {
    feeds: blipkin.totalFeeds / total,
    plays: blipkin.totalPlays / total,
    cleans: blipkin.totalCleans / total,
    rests: blipkin.totalRests / total,
  };

  // Calculate scores for each form
  const scores = {
    nurturer: 0,
    explorer: 0,
    chaos: 0,
    calm: 0,
  };

  // Nurturer: High feeds, balanced care
  scores.nurturer = ratios.feeds * 2 + ratios.cleans + ratios.rests;

  // Explorer: Very high plays
  scores.explorer = ratios.plays * 3 + ratios.feeds * 0.5;

  // Chaos: High plays, low cleans
  scores.chaos = ratios.plays * 2 + ratios.feeds * 1.5 + (1 - ratios.cleans) * 2;

  // Calm: High rests and cleans, balanced
  scores.calm = ratios.rests * 2.5 + ratios.cleans * 2;

  // Return the form with highest score
  return Object.entries(scores).reduce((a, b) => (b[1] > a[1] ? b : a))[0] as keyof typeof MEGA_FORMS;
}

/**
 * Check if Blipkin should evolve and return evolution data
 */
export function checkForEvolution(blipkin: Blipkin): {
  shouldEvolve: boolean;
  newStage?: keyof typeof EVOLUTION_STAGES;
  newMegaForm?: keyof typeof MEGA_FORMS;
  message?: string;
} {
  const currentStageKey = blipkin.evolutionStage as keyof typeof EVOLUTION_STAGES;
  const targetStage = calculateEvolutionStage(blipkin.level);

  // Check if already at target stage
  if (currentStageKey === targetStage) {
    return { shouldEvolve: false };
  }

  // Special case: Evolving to mega form
  if (targetStage === "mega" && currentStageKey !== "mega") {
    const megaForm = calculateMegaForm(blipkin);
    return {
      shouldEvolve: true,
      newStage: "mega",
      newMegaForm: megaForm,
      message: `${blipkin.name} is evolving into Mega Blipkin - ${MEGA_FORMS[megaForm].name} Form!`,
    };
  }

  // Normal evolution
  return {
    shouldEvolve: true,
    newStage: targetStage,
    message: `${blipkin.name} is evolving into ${EVOLUTION_STAGES[targetStage].name}!`,
  };
}

/**
 * Calculate mood based on stats
 */
export function calculateMood(blipkin: Pick<Blipkin, "hunger" | "energy" | "cleanliness" | "bond">): string {
  // Sick: Any stat critically low
  if (blipkin.hunger > 90 || blipkin.energy < 10 || blipkin.cleanliness < 10) {
    return "Sick";
  }

  // Hungry: High hunger
  if (blipkin.hunger > 70) {
    return "Hungry";
  }

  // Sleepy: Low energy
  if (blipkin.energy < 30) {
    return "Sleepy";
  }

  // Frustrated: Low cleanliness
  if (blipkin.cleanliness < 30) {
    return "Frustrated";
  }

  // Lonely: Low bond
  if (blipkin.bond < 30) {
    return "Lonely";
  }

  // Happy states based on high stats
  if (blipkin.bond >= 80 && blipkin.energy >= 70) {
    return "Joyful";
  }

  if (blipkin.bond >= 60 && blipkin.energy >= 50) {
    return "Excited";
  }

  if (blipkin.energy >= 80) {
    return "Playful";
  }

  // Default content state
  return "Happy";
}

/**
 * Calculate animation based on mood
 */
export function calculateAnimation(mood: string): string {
  const moodToAnimation: Record<string, string> = {
    Happy: "idle",
    Joyful: "happy",
    Excited: "excited",
    Playful: "happy",
    Hungry: "hungry",
    Sleepy: "sleep",
    Sick: "sick",
    Frustrated: "sad",
    Lonely: "sad",
  };

  return moodToAnimation[mood] || "idle";
}

/**
 * Degrade stats over time (called periodically)
 * Returns the stat changes
 */
export function degradeStats(blipkin: Pick<Blipkin, "hunger" | "energy" | "cleanliness">, hoursElapsed: number): {
  hunger: number;
  energy: number;
  cleanliness: number;
} {
  // Stats degrade based on time passed
  const hungerIncrease = Math.min(100, hoursElapsed * 5); // +5 hunger per hour
  const energyDecrease = Math.min(100, hoursElapsed * 3); // -3 energy per hour
  const cleanlinessDecrease = Math.min(100, hoursElapsed * 2); // -2 cleanliness per hour

  return {
    hunger: Math.min(100, blipkin.hunger + hungerIncrease),
    energy: Math.max(0, blipkin.energy - energyDecrease),
    cleanliness: Math.max(0, blipkin.cleanliness - cleanlinessDecrease),
  };
}

/**
 * Calculate XP required for next level
 */
export function xpForNextLevel(currentLevel: number): number {
  return currentLevel * 100;
}

/**
 * Check if level up occurred and return new level
 */
export function calculateLevelUp(currentLevel: number, currentXP: number): {
  didLevelUp: boolean;
  newLevel: number;
  remainingXP: number;
} {
  let level = currentLevel;
  let xp = currentXP;
  let didLevelUp = false;

  // Handle multiple level ups
  while (xp >= xpForNextLevel(level)) {
    xp -= xpForNextLevel(level);
    level++;
    didLevelUp = true;
  }

  return {
    didLevelUp,
    newLevel: level,
    remainingXP: xp,
  };
}
