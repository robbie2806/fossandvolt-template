import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  createCompanionRequestSchema,
  type CreateCompanionResponse,
  type GetCompanionResponse,
  updateCompanionRequestSchema,
  type UpdateCompanionResponse,
} from "@/shared/contracts";
import { db } from "../db";
import { type AppType } from "../types";

const companionRouter = new Hono<AppType>();

// ============================================
// GET /api/companion - Get user's AI companion
// ============================================
companionRouter.get("/", async (c) => {
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

  return c.json({
    id: companion.id,
    name: companion.name,
    vibe: companion.vibe,
    bondLevel: companion.bondLevel,
    bondXP: companion.bondXP,
    createdAt: companion.createdAt.toISOString(),
    updatedAt: companion.updatedAt.toISOString(),
  } satisfies GetCompanionResponse);
});

// ============================================
// POST /api/companion - Create AI companion
// ============================================
companionRouter.post("/", zValidator("json", createCompanionRequestSchema), async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { name, vibe } = c.req.valid("json");

  // Check if companion already exists
  const existing = await db.aICompanion.findUnique({
    where: { userId: user.id },
  });

  if (existing) {
    return c.json({ message: "AI companion already exists" }, 400);
  }

  // Create companion
  const companion = await db.aICompanion.create({
    data: {
      userId: user.id,
      name,
      vibe,
      bondLevel: 1,
      bondXP: 0,
    },
  });

  // Also create default settings
  await db.userSettings.create({
    data: {
      userId: user.id,
      allowMemory: true,
      dailyReminderEnabled: true,
      reminderTime: "09:00",
    },
  });

  return c.json({
    id: companion.id,
    name: companion.name,
    vibe: companion.vibe,
    bondLevel: companion.bondLevel,
    bondXP: companion.bondXP,
    createdAt: companion.createdAt.toISOString(),
    updatedAt: companion.updatedAt.toISOString(),
  } satisfies CreateCompanionResponse);
});

// ============================================
// PUT /api/companion - Update AI companion
// ============================================
companionRouter.put("/", zValidator("json", updateCompanionRequestSchema), async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const data = c.req.valid("json");

  const companion = await db.aICompanion.update({
    where: { userId: user.id },
    data,
  });

  return c.json({
    id: companion.id,
    name: companion.name,
    vibe: companion.vibe,
    bondLevel: companion.bondLevel,
    bondXP: companion.bondXP,
    createdAt: companion.createdAt.toISOString(),
    updatedAt: companion.updatedAt.toISOString(),
  } satisfies UpdateCompanionResponse);
});

export { companionRouter };
