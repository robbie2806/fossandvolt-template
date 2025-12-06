import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  createBlipkinRequestSchema,
  type CreateBlipkinResponse,
  type GetBlipkinResponse,
  updateBlipkinRequestSchema,
  type UpdateBlipkinResponse,
  type FeedBlipkinResponse,
  type PlayBlipkinResponse,
  type CleanBlipkinResponse,
  type RestBlipkinResponse,
} from "@/shared/contracts";
import { db } from "../db";
import { type AppType } from "../types";
import {
  calculateMood,
  calculateAnimation,
  degradeStats,
  calculateLevelUp,
  checkForEvolution,
} from "../utils/evolution";

const blipkinRouter = new Hono<AppType>();

// Helper to update stat degradation based on time passed
async function applyStatDegradation(blipkinId: string, userId: string) {
  const blipkin = await db.blipkin.findUnique({ where: { userId } });
  if (!blipkin) return null;

  const now = new Date();
  const lastUpdate = new Date(blipkin.lastStatUpdate);
  const hoursElapsed = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

  // Only degrade if more than 1 hour passed
  if (hoursElapsed < 1) return blipkin;

  const degradedStats = degradeStats(blipkin, hoursElapsed);

  // Check if feed count needs to be reset
  const lastFeedReset = new Date(blipkin.lastFeedReset);
  const hoursSinceReset = (now.getTime() - lastFeedReset.getTime()) / (1000 * 60 * 60);

  let feedCount = blipkin.feedCount;
  let lastFeedResetDate = blipkin.lastFeedReset;
  let energyPenalty = 0;

  if (hoursSinceReset >= 24) {
    // New day - check if they fed 3 times yesterday
    if (feedCount < 3) {
      // Penalty: Drain energy faster for missing feeds
      energyPenalty = (3 - feedCount) * 20; // -20 energy per missed feed
    }
    feedCount = 0;
    lastFeedResetDate = now;
  }

  const newEnergy = Math.max(0, degradedStats.energy - energyPenalty);
  const newMood = calculateMood({
    ...blipkin,
    ...degradedStats,
    energy: newEnergy,
  });
  const newAnimation = calculateAnimation(newMood);

  return await db.blipkin.update({
    where: { userId },
    data: {
      hunger: degradedStats.hunger,
      energy: newEnergy,
      cleanliness: degradedStats.cleanliness,
      mood: newMood,
      currentAnimation: newAnimation,
      lastStatUpdate: now,
      feedCount,
      lastFeedReset: lastFeedResetDate,
    },
  });
}

// ============================================
// GET /api/blipkin - Get user's Blipkin
// ============================================
blipkinRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  let blipkin = await db.blipkin.findUnique({
    where: { userId: user.id },
  });

  if (!blipkin) {
    return c.json({ message: "Blipkin not found" }, 404);
  }

  // Apply stat degradation
  blipkin = await applyStatDegradation(blipkin.id, user.id) || blipkin;

  // Update lastSeenAt
  const updatedBlipkin = await db.blipkin.update({
    where: { userId: user.id },
    data: { lastSeenAt: new Date() },
  });

  // Check if they missed the Blipkin (24+ hours)
  const hoursSinceLastSeen = (new Date().getTime() - blipkin.lastSeenAt.getTime()) / (1000 * 60 * 60);
  const missedYou = hoursSinceLastSeen >= 24;

  // Check for evolution
  const evolutionCheck = checkForEvolution(updatedBlipkin);

  return c.json({
    id: updatedBlipkin.id,
    name: updatedBlipkin.name,
    level: updatedBlipkin.level,
    xp: updatedBlipkin.xp,
    evolutionStage: updatedBlipkin.evolutionStage,
    megaForm: updatedBlipkin.megaForm,
    mood: updatedBlipkin.mood,
    energy: updatedBlipkin.energy,
    hunger: updatedBlipkin.hunger,
    cleanliness: updatedBlipkin.cleanliness,
    bond: updatedBlipkin.bond,
    currentAnimation: updatedBlipkin.currentAnimation,
    theme: updatedBlipkin.theme,
    lastSeenAt: updatedBlipkin.lastSeenAt.toISOString(),
    createdAt: updatedBlipkin.createdAt.toISOString(),
    updatedAt: updatedBlipkin.updatedAt.toISOString(),
    missedYou,
    canEvolve: evolutionCheck.shouldEvolve,
  } satisfies GetBlipkinResponse);
});

// ============================================
// POST /api/blipkin - Create Blipkin
// ============================================
blipkinRouter.post("/", zValidator("json", createBlipkinRequestSchema), async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { name } = c.req.valid("json");

  // Check if Blipkin already exists
  const existing = await db.blipkin.findUnique({
    where: { userId: user.id },
  });

  if (existing) {
    return c.json({ message: "Blipkin already exists" }, 400);
  }

  // Create Blipkin with default values
  const blipkin = await db.blipkin.create({
    data: {
      userId: user.id,
      name,
      level: 1,
      xp: 0,
      evolutionStage: "baby",
      mood: "Happy",
      energy: 80,
      hunger: 30,
      cleanliness: 100,
      bond: 50,
      currentAnimation: "idle",
      theme: "classic",
      lastSeenAt: new Date(),
      lastStatUpdate: new Date(),
    },
  });

  return c.json({
    id: blipkin.id,
    name: blipkin.name,
    level: blipkin.level,
    xp: blipkin.xp,
    evolutionStage: blipkin.evolutionStage,
    megaForm: blipkin.megaForm,
    mood: blipkin.mood,
    energy: blipkin.energy,
    hunger: blipkin.hunger,
    cleanliness: blipkin.cleanliness,
    bond: blipkin.bond,
    currentAnimation: blipkin.currentAnimation,
    theme: blipkin.theme,
    lastSeenAt: blipkin.lastSeenAt.toISOString(),
    createdAt: blipkin.createdAt.toISOString(),
    updatedAt: blipkin.updatedAt.toISOString(),
  } satisfies CreateBlipkinResponse);
});

// ============================================
// PUT /api/blipkin - Update Blipkin (rename)
// ============================================
blipkinRouter.put("/", zValidator("json", updateBlipkinRequestSchema), async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const data = c.req.valid("json");

  const blipkin = await db.blipkin.update({
    where: { userId: user.id },
    data,
  });

  return c.json({
    id: blipkin.id,
    name: blipkin.name,
    level: blipkin.level,
    xp: blipkin.xp,
    evolutionStage: blipkin.evolutionStage,
    megaForm: blipkin.megaForm,
    mood: blipkin.mood,
    energy: blipkin.energy,
    hunger: blipkin.hunger,
    cleanliness: blipkin.cleanliness,
    bond: blipkin.bond,
    currentAnimation: blipkin.currentAnimation,
    theme: blipkin.theme,
    lastSeenAt: blipkin.lastSeenAt.toISOString(),
    createdAt: blipkin.createdAt.toISOString(),
    updatedAt: blipkin.updatedAt.toISOString(),
  } satisfies UpdateBlipkinResponse);
});

// ============================================
// POST /api/blipkin/feed - Feed Blipkin
// ============================================
blipkinRouter.post("/feed", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  let blipkin = await db.blipkin.findUnique({
    where: { userId: user.id },
  });

  if (!blipkin) {
    return c.json({ message: "Blipkin not found" }, 404);
  }

  // Apply stat degradation first
  blipkin = await applyStatDegradation(blipkin.id, user.id) || blipkin;

  // Check if feed count needs to reset (new day)
  const now = new Date();
  const lastFeedReset = new Date(blipkin.lastFeedReset);
  const hoursSinceReset = (now.getTime() - lastFeedReset.getTime()) / (1000 * 60 * 60);

  let currentFeedCount = blipkin.feedCount;
  if (hoursSinceReset >= 24) {
    // Reset feed count for new day
    currentFeedCount = 0;
    await db.blipkin.update({
      where: { userId: user.id },
      data: { feedCount: 0, lastFeedReset: now },
    });
  }

  // Calculate new stats
  const xpGained = 5;
  const bondGained = 3;
  const newHunger = Math.max(0, blipkin.hunger - 25);
  const newBond = Math.min(100, blipkin.bond + bondGained);
  const newXP = blipkin.xp + xpGained;
  const newFeedCount = currentFeedCount + 1;

  // Check for level up
  const levelUpResult = calculateLevelUp(blipkin.level, newXP);

  // Recalculate mood and animation
  const newMood = calculateMood({ ...blipkin, hunger: newHunger, bond: newBond });
  const newAnimation = levelUpResult.didLevelUp ? "happy" : calculateAnimation(newMood);

  // Check for evolution
  let evolutionData: any = {};
  if (levelUpResult.didLevelUp) {
    const evolutionCheck = checkForEvolution({ ...blipkin, level: levelUpResult.newLevel });
    if (evolutionCheck.shouldEvolve) {
      evolutionData = {
        evolutionStage: evolutionCheck.newStage,
        megaForm: evolutionCheck.newMegaForm,
        currentAnimation: "evolving",
      };
    }
  }

  // Update database
  const updatedBlipkin = await db.blipkin.update({
    where: { userId: user.id },
    data: {
      hunger: newHunger,
      bond: newBond,
      xp: levelUpResult.remainingXP,
      level: levelUpResult.newLevel,
      mood: newMood,
      currentAnimation: newAnimation,
      totalFeeds: blipkin.totalFeeds + 1,
      feedCount: newFeedCount,
      lastSeenAt: now,
      ...evolutionData,
    },
  });

  // Award coins for feeding
  const coinsEarned = 10;
  await db.currencyWallet.upsert({
    where: { userId: user.id },
    update: { coins: { increment: coinsEarned } },
    create: { userId: user.id, coins: coinsEarned, voltGems: 0 },
  });

  // Generate message
  let message = "Yum! That was delicious!";
  if (newFeedCount < 3) {
    message = `Yum! That was delicious! (Fed ${newFeedCount}/3 times today)`;
  } else if (newFeedCount === 3) {
    message = "I've been fed 3 times today! I'm happy and healthy!";
  } else if (newHunger === 0) {
    message = "I'm so full now! Thank you!";
  } else if (newHunger < 20) {
    message = "Mmm, that hit the spot!";
  }

  return c.json({
    success: true,
    blipkin: {
      id: updatedBlipkin.id,
      name: updatedBlipkin.name,
      level: updatedBlipkin.level,
      xp: updatedBlipkin.xp,
      evolutionStage: updatedBlipkin.evolutionStage,
      megaForm: updatedBlipkin.megaForm,
      mood: updatedBlipkin.mood,
      energy: updatedBlipkin.energy,
      hunger: updatedBlipkin.hunger,
      cleanliness: updatedBlipkin.cleanliness,
      bond: updatedBlipkin.bond,
      currentAnimation: updatedBlipkin.currentAnimation,
      theme: updatedBlipkin.theme,
      lastSeenAt: updatedBlipkin.lastSeenAt.toISOString(),
      createdAt: updatedBlipkin.createdAt.toISOString(),
      updatedAt: updatedBlipkin.updatedAt.toISOString(),
    },
    xpGained,
    bondGained,
    coinsEarned,
    leveledUp: levelUpResult.didLevelUp,
    evolved: evolutionData.evolutionStage !== undefined,
    message,
  } satisfies FeedBlipkinResponse);
});

// ============================================
// POST /api/blipkin/play - Play with Blipkin
// ============================================
blipkinRouter.post("/play", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  let blipkin = await db.blipkin.findUnique({
    where: { userId: user.id },
  });

  if (!blipkin) {
    return c.json({ message: "Blipkin not found" }, 404);
  }

  // Apply stat degradation first
  blipkin = await applyStatDegradation(blipkin.id, user.id) || blipkin;

  // Check if energy is depleted
  if (blipkin.energy < 10) {
    // Check if 3 hours have passed since energy depletion
    const now = new Date();
    const lastRestore = new Date(blipkin.lastEnergyRestore);
    const hoursElapsed = (now.getTime() - lastRestore.getTime()) / (1000 * 60 * 60);

    if (blipkin.energyRestoring && hoursElapsed >= 3) {
      // Restore energy after 3 hours
      await db.blipkin.update({
        where: { userId: user.id },
        data: {
          energy: 100,
          energyRestoring: false,
          lastEnergyRestore: now,
        },
      });
      blipkin.energy = 100;
      blipkin.energyRestoring = false;
    } else if (!blipkin.energyRestoring) {
      // Start energy restoration
      await db.blipkin.update({
        where: { userId: user.id },
        data: {
          energyRestoring: true,
          lastEnergyRestore: now,
        },
      });
      return c.json({
        success: false,
        message: "Your Blipkin needs to rest! Energy will restore in 3 hours, or you can purchase energy to keep playing.",
        needsRest: true,
        timeUntilRestore: 3 * 60 * 60 * 1000, // 3 hours in milliseconds
      }, 400);
    } else {
      // Still restoring
      const timeLeft = (3 * 60 * 60 * 1000) - (now.getTime() - lastRestore.getTime());
      return c.json({
        success: false,
        message: "Your Blipkin is resting. Energy will be restored soon!",
        needsRest: true,
        timeUntilRestore: timeLeft,
      }, 400);
    }
  }

  // Calculate new stats
  const xpGained = 8;
  const bondGained = 5;
  const newEnergy = Math.max(0, blipkin.energy - 10);
  const newBond = Math.min(100, blipkin.bond + bondGained);
  const newXP = blipkin.xp + xpGained;
  const newCleanliness = Math.max(0, blipkin.cleanliness - 5); // Playing makes them dirty

  // Check for level up
  const levelUpResult = calculateLevelUp(blipkin.level, newXP);

  // Recalculate mood and animation
  const newMood = calculateMood({ ...blipkin, energy: newEnergy, bond: newBond, cleanliness: newCleanliness });
  const newAnimation = levelUpResult.didLevelUp ? "happy" : "excited";

  // Check for evolution
  let evolutionData: any = {};
  if (levelUpResult.didLevelUp) {
    const evolutionCheck = checkForEvolution({ ...blipkin, level: levelUpResult.newLevel });
    if (evolutionCheck.shouldEvolve) {
      evolutionData = {
        evolutionStage: evolutionCheck.newStage,
        megaForm: evolutionCheck.newMegaForm,
        currentAnimation: "evolving",
      };
    }
  }

  // Update database
  const updatedBlipkin = await db.blipkin.update({
    where: { userId: user.id },
    data: {
      energy: newEnergy,
      bond: newBond,
      cleanliness: newCleanliness,
      xp: levelUpResult.remainingXP,
      level: levelUpResult.newLevel,
      mood: newMood,
      currentAnimation: newAnimation,
      totalPlays: blipkin.totalPlays + 1,
      lastSeenAt: new Date(),
      ...evolutionData,
    },
  });

  // Award coins for playing
  const coinsEarned = 15;
  await db.currencyWallet.upsert({
    where: { userId: user.id },
    update: { coins: { increment: coinsEarned } },
    create: { userId: user.id, coins: coinsEarned, voltGems: 0 },
  });

  // Generate message
  let message = "That was so much fun!";
  if (newEnergy < 20) {
    message = "Whew! I'm getting tired now, but that was fun!";
  } else if (bondGained > 0) {
    message = "I love spending time with you!";
  }

  return c.json({
    success: true,
    blipkin: {
      id: updatedBlipkin.id,
      name: updatedBlipkin.name,
      level: updatedBlipkin.level,
      xp: updatedBlipkin.xp,
      evolutionStage: updatedBlipkin.evolutionStage,
      megaForm: updatedBlipkin.megaForm,
      mood: updatedBlipkin.mood,
      energy: updatedBlipkin.energy,
      hunger: updatedBlipkin.hunger,
      cleanliness: updatedBlipkin.cleanliness,
      bond: updatedBlipkin.bond,
      currentAnimation: updatedBlipkin.currentAnimation,
      theme: updatedBlipkin.theme,
      lastSeenAt: updatedBlipkin.lastSeenAt.toISOString(),
      createdAt: updatedBlipkin.createdAt.toISOString(),
      updatedAt: updatedBlipkin.updatedAt.toISOString(),
    },
    xpGained,
    bondGained,
    coinsEarned,
    leveledUp: levelUpResult.didLevelUp,
    evolved: evolutionData.evolutionStage !== undefined,
    message,
  } satisfies PlayBlipkinResponse);
});

// ============================================
// POST /api/blipkin/purchase-energy - Purchase Energy
// ============================================
blipkinRouter.post("/purchase-energy", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const body = await c.req.json();
  const { packageId, energyAmount } = body;

  if (!packageId || !energyAmount) {
    return c.json({ message: "Missing packageId or energyAmount" }, 400);
  }

  // Find Blipkin
  const blipkin = await db.blipkin.findUnique({
    where: { userId: user.id },
  });

  if (!blipkin) {
    return c.json({ message: "Blipkin not found" }, 404);
  }

  // Add energy to Blipkin
  const newEnergy = Math.min(100, blipkin.energy + energyAmount);

  const updatedBlipkin = await db.blipkin.update({
    where: { userId: user.id },
    data: {
      energy: newEnergy,
      energyRestoring: false, // Cancel any ongoing restoration
      lastEnergyRestore: new Date(),
    },
  });

  return c.json({
    success: true,
    blipkin: {
      id: updatedBlipkin.id,
      name: updatedBlipkin.name,
      level: updatedBlipkin.level,
      xp: updatedBlipkin.xp,
      evolutionStage: updatedBlipkin.evolutionStage,
      megaForm: updatedBlipkin.megaForm,
      mood: updatedBlipkin.mood,
      energy: updatedBlipkin.energy,
      hunger: updatedBlipkin.hunger,
      cleanliness: updatedBlipkin.cleanliness,
      bond: updatedBlipkin.bond,
      currentAnimation: updatedBlipkin.currentAnimation,
      theme: updatedBlipkin.theme,
      lastSeenAt: updatedBlipkin.lastSeenAt.toISOString(),
      createdAt: updatedBlipkin.createdAt.toISOString(),
      updatedAt: updatedBlipkin.updatedAt.toISOString(),
    },
    message: `Added ${energyAmount} energy!`,
  });
});

// ============================================
// POST /api/blipkin/clean - Clean Blipkin
// ============================================
blipkinRouter.post("/clean", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  let blipkin = await db.blipkin.findUnique({
    where: { userId: user.id },
  });

  if (!blipkin) {
    return c.json({ message: "Blipkin not found" }, 404);
  }

  // Apply stat degradation first
  blipkin = await applyStatDegradation(blipkin.id, user.id) || blipkin;

  // Calculate new stats
  const xpGained = 3;
  const bondGained = 2;
  const newCleanliness = Math.min(100, blipkin.cleanliness + 30);
  const newBond = Math.min(100, blipkin.bond + bondGained);
  const newXP = blipkin.xp + xpGained;

  // Check for level up
  const levelUpResult = calculateLevelUp(blipkin.level, newXP);

  // Recalculate mood and animation
  const newMood = calculateMood({ ...blipkin, cleanliness: newCleanliness, bond: newBond });
  const newAnimation = levelUpResult.didLevelUp ? "happy" : calculateAnimation(newMood);

  // Check for evolution
  let evolutionData: any = {};
  if (levelUpResult.didLevelUp) {
    const evolutionCheck = checkForEvolution({ ...blipkin, level: levelUpResult.newLevel });
    if (evolutionCheck.shouldEvolve) {
      evolutionData = {
        evolutionStage: evolutionCheck.newStage,
        megaForm: evolutionCheck.newMegaForm,
        currentAnimation: "evolving",
      };
    }
  }

  // Update database
  const updatedBlipkin = await db.blipkin.update({
    where: { userId: user.id },
    data: {
      cleanliness: newCleanliness,
      bond: newBond,
      xp: levelUpResult.remainingXP,
      level: levelUpResult.newLevel,
      mood: newMood,
      currentAnimation: newAnimation,
      totalCleans: blipkin.totalCleans + 1,
      lastSeenAt: new Date(),
      ...evolutionData,
    },
  });

  // Award coins for cleaning
  const coinsEarned = 8;
  await db.currencyWallet.upsert({
    where: { userId: user.id },
    update: { coins: { increment: coinsEarned } },
    create: { userId: user.id, coins: coinsEarned, voltGems: 0 },
  });

  // Generate message
  let message = "All sparkly clean! ✨";
  if (newCleanliness === 100) {
    message = "I feel so fresh and clean! Thank you!";
  } else if (blipkin.cleanliness < 30) {
    message = "Finally! I really needed that wash!";
  }

  return c.json({
    success: true,
    blipkin: {
      id: updatedBlipkin.id,
      name: updatedBlipkin.name,
      level: updatedBlipkin.level,
      xp: updatedBlipkin.xp,
      evolutionStage: updatedBlipkin.evolutionStage,
      megaForm: updatedBlipkin.megaForm,
      mood: updatedBlipkin.mood,
      energy: updatedBlipkin.energy,
      hunger: updatedBlipkin.hunger,
      cleanliness: updatedBlipkin.cleanliness,
      bond: updatedBlipkin.bond,
      currentAnimation: updatedBlipkin.currentAnimation,
      theme: updatedBlipkin.theme,
      lastSeenAt: updatedBlipkin.lastSeenAt.toISOString(),
      createdAt: updatedBlipkin.createdAt.toISOString(),
      updatedAt: updatedBlipkin.updatedAt.toISOString(),
    },
    xpGained,
    bondGained,
    coinsEarned,
    leveledUp: levelUpResult.didLevelUp,
    evolved: evolutionData.evolutionStage !== undefined,
    message,
  } satisfies CleanBlipkinResponse);
});

// ============================================
// POST /api/blipkin/rest - Rest Blipkin
// ============================================
blipkinRouter.post("/rest", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  let blipkin = await db.blipkin.findUnique({
    where: { userId: user.id },
  });

  if (!blipkin) {
    return c.json({ message: "Blipkin not found" }, 404);
  }

  // Apply stat degradation first
  blipkin = await applyStatDegradation(blipkin.id, user.id) || blipkin;

  // Calculate new stats
  const xpGained = 3;
  const bondGained = 2;
  const newEnergy = Math.min(100, blipkin.energy + 30);
  const newBond = Math.min(100, blipkin.bond + bondGained);
  const newXP = blipkin.xp + xpGained;

  // Check for level up
  const levelUpResult = calculateLevelUp(blipkin.level, newXP);

  // Recalculate mood and animation
  const newMood = calculateMood({ ...blipkin, energy: newEnergy, bond: newBond });
  const newAnimation = "sleep";

  // Check for evolution
  let evolutionData: any = {};
  if (levelUpResult.didLevelUp) {
    const evolutionCheck = checkForEvolution({ ...blipkin, level: levelUpResult.newLevel });
    if (evolutionCheck.shouldEvolve) {
      evolutionData = {
        evolutionStage: evolutionCheck.newStage,
        megaForm: evolutionCheck.newMegaForm,
        currentAnimation: "evolving",
      };
    }
  }

  // Update database
  const updatedBlipkin = await db.blipkin.update({
    where: { userId: user.id },
    data: {
      energy: newEnergy,
      bond: newBond,
      xp: levelUpResult.remainingXP,
      level: levelUpResult.newLevel,
      mood: newMood,
      currentAnimation: newAnimation,
      totalRests: blipkin.totalRests + 1,
      lastSeenAt: new Date(),
      ...evolutionData,
    },
  });

  // Award coins for resting
  const coinsEarned = 5;
  await db.currencyWallet.upsert({
    where: { userId: user.id },
    update: { coins: { increment: coinsEarned } },
    create: { userId: user.id, coins: coinsEarned, voltGems: 0 },
  });

  // Generate message
  let message = "Zzz... that was a nice nap!";
  if (newEnergy === 100) {
    message = "I'm fully recharged! Let's go!";
  } else if (blipkin.energy < 20) {
    message = "Finally... I can rest... zzz";
  }

  return c.json({
    success: true,
    blipkin: {
      id: updatedBlipkin.id,
      name: updatedBlipkin.name,
      level: updatedBlipkin.level,
      xp: updatedBlipkin.xp,
      evolutionStage: updatedBlipkin.evolutionStage,
      megaForm: updatedBlipkin.megaForm,
      mood: updatedBlipkin.mood,
      energy: updatedBlipkin.energy,
      hunger: updatedBlipkin.hunger,
      cleanliness: updatedBlipkin.cleanliness,
      bond: updatedBlipkin.bond,
      currentAnimation: updatedBlipkin.currentAnimation,
      theme: updatedBlipkin.theme,
      lastSeenAt: updatedBlipkin.lastSeenAt.toISOString(),
      createdAt: updatedBlipkin.createdAt.toISOString(),
      updatedAt: updatedBlipkin.updatedAt.toISOString(),
    },
    xpGained,
    bondGained,
    coinsEarned,
    leveledUp: levelUpResult.didLevelUp,
    evolved: evolutionData.evolutionStage !== undefined,
    message,
  } satisfies RestBlipkinResponse);
});

export { blipkinRouter };
