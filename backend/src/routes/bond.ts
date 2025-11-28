import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  type GetBondStatusResponse,
  submitCheckInRequestSchema,
  type SubmitCheckInResponse,
  submitGratitudeRequestSchema,
  type SubmitGratitudeResponse,
  submitGoalRequestSchema,
  type SubmitGoalResponse,
} from "@/shared/contracts";
import { db } from "../db";
import { type AppType } from "../types";
import { generateCheckInResponse } from "../utils/ai";

const bondRouter = new Hono<AppType>();

// ============================================
// GET /api/bond - Get bond status and today's actions
// ============================================
bondRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const companion = await db.aICompanion.findUnique({
    where: { userId: user.id },
  });

  if (!companion) {
    return c.json({ message: "AI companion not found" }, 404);
  }

  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Check today's actions
  const [checkIn, gratitude, goal] = await Promise.all([
    db.dailyCheckIn.findFirst({
      where: {
        userId: user.id,
        date: { gte: today, lt: tomorrow },
      },
    }),
    db.bondAction.findFirst({
      where: {
        userId: user.id,
        actionType: "gratitude",
        date: { gte: today, lt: tomorrow },
      },
    }),
    db.bondAction.findFirst({
      where: {
        userId: user.id,
        actionType: "goal",
        date: { gte: today, lt: tomorrow },
      },
    }),
  ]);

  // Get recent actions (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentActions = await db.bondAction.findMany({
    where: {
      userId: user.id,
      date: { gte: sevenDaysAgo },
    },
    orderBy: { date: "desc" },
    take: 20,
  });

  // Calculate XP for next level
  const xpForNextLevel = companion.bondLevel * 100;

  return c.json({
    bondLevel: companion.bondLevel,
    bondXP: companion.bondXP,
    xpForNextLevel,
    todayActions: {
      hasCheckedIn: !!checkIn,
      hasGratitude: !!gratitude,
      hasGoal: !!goal,
    },
    recentActions: recentActions.map((action) => ({
      id: action.id,
      actionType: action.actionType,
      content: action.content,
      xpAwarded: action.xpAwarded,
      date: action.date.toISOString(),
    })),
  } satisfies GetBondStatusResponse);
});

// ============================================
// POST /api/bond/check-in - Submit daily check-in
// ============================================
bondRouter.post("/check-in", zValidator("json", submitCheckInRequestSchema), async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { mood, reflection } = c.req.valid("json");

  const companion = await db.aICompanion.findUnique({
    where: { userId: user.id },
  });

  if (!companion) {
    return c.json({ message: "AI companion not found" }, 404);
  }

  // Check if already checked in today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existingCheckIn = await db.dailyCheckIn.findFirst({
    where: {
      userId: user.id,
      date: { gte: today, lt: tomorrow },
    },
  });

  if (existingCheckIn) {
    return c.json({ message: "You've already checked in today!" }, 400);
  }

  // Award XP
  const xpAwarded = 20;
  const xpForNextLevel = companion.bondLevel * 100;
  const newXP = companion.bondXP + xpAwarded;
  const levelUp = newXP >= xpForNextLevel;

  // Save check-in
  await db.dailyCheckIn.create({
    data: {
      userId: user.id,
      mood,
      reflection: reflection || null,
      xpAwarded,
    },
  });

  // Update companion
  const updatedCompanion = await db.aICompanion.update({
    where: { userId: user.id },
    data: {
      bondXP: levelUp ? newXP - xpForNextLevel : newXP,
      bondLevel: levelUp ? companion.bondLevel + 1 : companion.bondLevel,
    },
  });

  // Record bond action
  await db.bondAction.create({
    data: {
      userId: user.id,
      actionType: "check-in",
      content: reflection || null,
      xpAwarded,
    },
  });

  // Generate AI response
  const aiResponse = await generateCheckInResponse({
    companionName: companion.name,
    companionVibe: companion.vibe,
    mood,
    reflection,
  });

  return c.json({
    success: true,
    xpAwarded,
    newBondLevel: updatedCompanion.bondLevel,
    aiResponse,
  } satisfies SubmitCheckInResponse);
});

// ============================================
// POST /api/bond/gratitude - Submit gratitude note
// ============================================
bondRouter.post("/gratitude", zValidator("json", submitGratitudeRequestSchema), async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { content } = c.req.valid("json");

  const companion = await db.aICompanion.findUnique({
    where: { userId: user.id },
  });

  if (!companion) {
    return c.json({ message: "AI companion not found" }, 404);
  }

  // Check if already submitted gratitude today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existingGratitude = await db.bondAction.findFirst({
    where: {
      userId: user.id,
      actionType: "gratitude",
      date: { gte: today, lt: tomorrow },
    },
  });

  if (existingGratitude) {
    return c.json({ message: "You've already submitted gratitude today!" }, 400);
  }

  // Award XP
  const xpAwarded = 10;
  const xpForNextLevel = companion.bondLevel * 100;
  const newXP = companion.bondXP + xpAwarded;
  const levelUp = newXP >= xpForNextLevel;

  // Update companion
  const updatedCompanion = await db.aICompanion.update({
    where: { userId: user.id },
    data: {
      bondXP: levelUp ? newXP - xpForNextLevel : newXP,
      bondLevel: levelUp ? companion.bondLevel + 1 : companion.bondLevel,
    },
  });

  // Record bond action
  await db.bondAction.create({
    data: {
      userId: user.id,
      actionType: "gratitude",
      content,
      xpAwarded,
    },
  });

  return c.json({
    success: true,
    xpAwarded,
    newBondLevel: updatedCompanion.bondLevel,
  } satisfies SubmitGratitudeResponse);
});

// ============================================
// POST /api/bond/goal - Submit or update mini goal
// ============================================
bondRouter.post("/goal", zValidator("json", submitGoalRequestSchema), async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { content } = c.req.valid("json");

  const companion = await db.aICompanion.findUnique({
    where: { userId: user.id },
  });

  if (!companion) {
    return c.json({ message: "AI companion not found" }, 404);
  }

  // Check if already set goal today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existingGoal = await db.bondAction.findFirst({
    where: {
      userId: user.id,
      actionType: "goal",
      date: { gte: today, lt: tomorrow },
    },
  });

  if (existingGoal) {
    return c.json({ message: "You've already set a goal today!" }, 400);
  }

  // Award XP
  const xpAwarded = 10;
  const xpForNextLevel = companion.bondLevel * 100;
  const newXP = companion.bondXP + xpAwarded;
  const levelUp = newXP >= xpForNextLevel;

  // Update companion
  const updatedCompanion = await db.aICompanion.update({
    where: { userId: user.id },
    data: {
      bondXP: levelUp ? newXP - xpForNextLevel : newXP,
      bondLevel: levelUp ? companion.bondLevel + 1 : companion.bondLevel,
    },
  });

  // Record bond action
  await db.bondAction.create({
    data: {
      userId: user.id,
      actionType: "goal",
      content,
      xpAwarded,
    },
  });

  return c.json({
    success: true,
    xpAwarded,
    newBondLevel: updatedCompanion.bondLevel,
  } satisfies SubmitGoalResponse);
});

export { bondRouter };
