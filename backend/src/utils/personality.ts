import type { Blipkin } from "../generated/prisma";
import type { PersonalityProfile } from "@/shared/blipnet-contracts";

/**
 * Compute personality profile based on Blipkin care history and stats
 * This determines dialogue style, mega form preference, and behavior
 */
export function computePersonalityProfile(blipkin: Blipkin): PersonalityProfile {
  // Base personality starts at 50 (neutral)
  let energy = 50;
  let curiosity = 50;
  let sociability = 50;
  let carefulness = 50;
  let affection = 50;

  // Total actions for ratio calculation
  const totalActions =
    blipkin.totalFeeds +
    blipkin.totalPlays +
    blipkin.totalCleans +
    blipkin.totalRests +
    blipkin.totalChats;

  if (totalActions > 0) {
    // Energy increases with play frequency
    const playRatio = blipkin.totalPlays / totalActions;
    energy = Math.min(100, 50 + playRatio * 100);

    // Curiosity increases with variety of actions
    const actionVariety = [
      blipkin.totalFeeds > 0,
      blipkin.totalPlays > 0,
      blipkin.totalCleans > 0,
      blipkin.totalRests > 0,
      blipkin.totalChats > 0,
    ].filter(Boolean).length;
    curiosity = Math.min(100, 30 + actionVariety * 15);

    // Sociability increases with chat frequency
    const chatRatio = blipkin.totalChats / totalActions;
    sociability = Math.min(100, 40 + chatRatio * 120);

    // Carefulness increases with clean frequency
    const cleanRatio = blipkin.totalCleans / totalActions;
    carefulness = Math.min(100, 40 + cleanRatio * 150);

    // Affection increases with feed + chat frequency
    const affectionRatio = (blipkin.totalFeeds + blipkin.totalChats) / totalActions;
    affection = Math.min(100, 40 + affectionRatio * 80);
  }

  // Current stats affect personality
  if (blipkin.energy > 80) energy += 10;
  if (blipkin.energy < 30) energy -= 10;
  if (blipkin.bond > 80) {
    affection += 15;
    sociability += 10;
  }
  if (blipkin.cleanliness > 80) carefulness += 10;

  // Clamp all values to 0-100
  energy = Math.max(0, Math.min(100, energy));
  curiosity = Math.max(0, Math.min(100, curiosity));
  sociability = Math.max(0, Math.min(100, sociability));
  carefulness = Math.max(0, Math.min(100, carefulness));
  affection = Math.max(0, Math.min(100, affection));

  // Determine core trait (matches mega form logic)
  const traitScores = {
    NURTURING: affection + carefulness,
    EXPLORER: curiosity + energy,
    CHAOS: energy + sociability - carefulness * 0.5,
    CALM: carefulness + (100 - energy) * 0.5,
  };

  const coreTrait = (Object.keys(traitScores) as Array<keyof typeof traitScores>).reduce(
    (a, b) => (traitScores[a] > traitScores[b] ? a : b)
  );

  // Determine mood bias from current stats
  let moodBias: "HAPPY" | "TIRED" | "CHAOTIC" | "SHY" | "BOLD" = "HAPPY";
  if (blipkin.energy < 30) moodBias = "TIRED";
  else if (energy > 80 && sociability < 40) moodBias = "CHAOTIC";
  else if (sociability < 30) moodBias = "SHY";
  else if (sociability > 70 && affection > 70) moodBias = "BOLD";

  // Determine dialogue style
  let dialogueStyle: "short_cute" | "rambling" | "wise" | "playful" = "short_cute";
  if (blipkin.evolutionStage === "elder") dialogueStyle = "wise";
  else if (blipkin.evolutionStage === "teen" || energy > 70) dialogueStyle = "playful";
  else if (sociability > 70) dialogueStyle = "rambling";

  return {
    energy,
    curiosity,
    sociability,
    carefulness,
    affection,
    coreTrait,
    moodBias,
    dialogueStyle,
  };
}

/**
 * Get preferred activities based on personality
 */
export function getPreferredActivities(personality: PersonalityProfile): string[] {
  const activities: string[] = [];

  if (personality.energy > 60) {
    activities.push("PLAY", "MINIGAME_DASH", "MINIGAME_BUBBLE");
  }

  if (personality.curiosity > 60) {
    activities.push("EXPLORE", "MINIGAME_FISHING", "MINIGAME_MEMORY");
  }

  if (personality.sociability > 60) {
    activities.push("CHAT", "BLIPNET_VISIT", "EMOTE");
  }

  if (personality.carefulness > 60) {
    activities.push("CLEAN", "REST", "DECORATE_ROOM");
  }

  if (personality.affection > 60) {
    activities.push("FEED", "CHAT", "CUDDLE");
  }

  return activities.length > 0 ? activities : ["PLAY", "FEED", "CHAT"];
}
