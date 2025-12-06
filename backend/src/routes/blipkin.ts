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
} from "@/shared/contracts";
import { db } from "../db";
import { type AppType } from "../types";

const blipkinRouter = new Hono<AppType>();

// Helper function to calculate mood based on stats
function calculateMood(hunger: number, energy: number, bond: number): string {
  if (hunger > 70) return "Hungry";
  if (energy < 30) return "Sleepy";
  if (bond < 30) return "Lonely";
  if (bond > 80) return "Joyful";
  if (energy > 80 && bond > 60) return "Excited";
  return "Content";
}

// Helper function to calculate XP needed for level
function xpForLevel(level: number): number {
  return level * 100;
}

// ============================================
// GET /api/blipkin - Get user's Blipkin
// ============================================
blipkinRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const blipkin = await db.blipkin.findUnique({
    where: { userId: user.id },
  });

  if (!blipkin) {
    return c.json({ message: "Blipkin not found" }, 404);
  }

  // Update lastSeenAt
  const updatedBlipkin = await db.blipkin.update({
    where: { userId: user.id },
    data: { lastSeenAt: new Date() },
  });

  // Check if they missed the Blipkin (24+ hours)
  const hoursSinceLastSeen = (new Date().getTime() - blipkin.lastSeenAt.getTime()) / (1000 * 60 * 60);
  const missedYou = hoursSinceLastSeen >= 24;

  return c.json({
    id: updatedBlipkin.id,
    name: updatedBlipkin.name,
    level: updatedBlipkin.level,
    xp: updatedBlipkin.xp,
    mood: updatedBlipkin.mood,
    energy: updatedBlipkin.energy,
    hunger: updatedBlipkin.hunger,
    bond: updatedBlipkin.bond,
    theme: updatedBlipkin.theme,
    lastSeenAt: updatedBlipkin.lastSeenAt.toISOString(),
    createdAt: updatedBlipkin.createdAt.toISOString(),
    updatedAt: updatedBlipkin.updatedAt.toISOString(),
    missedYou,
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
      mood: "Happy",
      energy: 80,
      hunger: 30,
      bond: 50,
      theme: "classic",
      lastSeenAt: new Date(),
    },
  });

  return c.json({
    id: blipkin.id,
    name: blipkin.name,
    level: blipkin.level,
    xp: blipkin.xp,
    mood: blipkin.mood,
    energy: blipkin.energy,
    hunger: blipkin.hunger,
    bond: blipkin.bond,
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
    mood: blipkin.mood,
    energy: blipkin.energy,
    hunger: blipkin.hunger,
    bond: blipkin.bond,
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

  const blipkin = await db.blipkin.findUnique({
    where: { userId: user.id },
  });

  if (!blipkin) {
    return c.json({ message: "Blipkin not found" }, 404);
  }

  // Calculate new stats
  const xpGained = 5;
  const bondGained = 3;
  const newHunger = Math.max(0, blipkin.hunger - 25);
  const newBond = Math.min(100, blipkin.bond + bondGained);
  const newXP = blipkin.xp + xpGained;

  // Check for level up
  let newLevel = blipkin.level;
  let leveledUp = false;
  let xpAfterLevel = newXP;

  while (xpAfterLevel >= xpForLevel(newLevel)) {
    xpAfterLevel -= xpForLevel(newLevel);
    newLevel++;
    leveledUp = true;
  }

  // Recalculate mood
  const newMood = calculateMood(newHunger, blipkin.energy, newBond);

  // Update database
  const updatedBlipkin = await db.blipkin.update({
    where: { userId: user.id },
    data: {
      hunger: newHunger,
      bond: newBond,
      xp: xpAfterLevel,
      level: newLevel,
      mood: newMood,
      lastSeenAt: new Date(),
    },
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
      mood: updatedBlipkin.mood,
      energy: updatedBlipkin.energy,
      hunger: updatedBlipkin.hunger,
      bond: updatedBlipkin.bond,
      theme: updatedBlipkin.theme,
      lastSeenAt: updatedBlipkin.lastSeenAt.toISOString(),
      createdAt: updatedBlipkin.createdAt.toISOString(),
      updatedAt: updatedBlipkin.updatedAt.toISOString(),
    },
    xpGained,
    bondGained,
    leveledUp,
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

  const blipkin = await db.blipkin.findUnique({
    where: { userId: user.id },
  });

  if (!blipkin) {
    return c.json({ message: "Blipkin not found" }, 404);
  }

  // Calculate new stats
  const xpGained = 8;
  const bondGained = 5;
  const newEnergy = Math.max(0, blipkin.energy - 10);
  const newBond = Math.min(100, blipkin.bond + bondGained);
  const newXP = blipkin.xp + xpGained;

  // Check for level up
  let newLevel = blipkin.level;
  let leveledUp = false;
  let xpAfterLevel = newXP;

  while (xpAfterLevel >= xpForLevel(newLevel)) {
    xpAfterLevel -= xpForLevel(newLevel);
    newLevel++;
    leveledUp = true;
  }

  // Recalculate mood
  const newMood = calculateMood(blipkin.hunger, newEnergy, newBond);

  // Update database
  const updatedBlipkin = await db.blipkin.update({
    where: { userId: user.id },
    data: {
      energy: newEnergy,
      bond: newBond,
      xp: xpAfterLevel,
      level: newLevel,
      mood: newMood,
      lastSeenAt: new Date(),
    },
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
      mood: updatedBlipkin.mood,
      energy: updatedBlipkin.energy,
      hunger: updatedBlipkin.hunger,
      bond: updatedBlipkin.bond,
      theme: updatedBlipkin.theme,
      lastSeenAt: updatedBlipkin.lastSeenAt.toISOString(),
      createdAt: updatedBlipkin.createdAt.toISOString(),
      updatedAt: updatedBlipkin.updatedAt.toISOString(),
    },
    xpGained,
    bondGained,
    leveledUp,
    message,
  } satisfies PlayBlipkinResponse);
});

export { blipkinRouter };
