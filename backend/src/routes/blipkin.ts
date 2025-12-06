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
  const newMood = calculateMood({
    ...blipkin,
    ...degradedStats,
  });
  const newAnimation = calculateAnimation(newMood);

  return await db.blipkin.update({
    where: { userId },
    data: {
      hunger: degradedStats.hunger,
      energy: degradedStats.energy,
      cleanliness: degradedStats.cleanliness,
      mood: newMood,
      currentAnimation: newAnimation,
      lastStatUpdate: now,
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

  // Calculate new stats
  const xpGained = 5;
  const bondGained = 3;
  const newHunger = Math.max(0, blipkin.hunger - 25);
  const newBond = Math.min(100, blipkin.bond + bondGained);
  const newXP = blipkin.xp + xpGained;

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
      lastSeenAt: new Date(),
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
  if (newHunger === 0) {
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
