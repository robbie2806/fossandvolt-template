import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  type GetSettingsResponse,
  updateSettingsRequestSchema,
  type UpdateSettingsResponse,
} from "@/shared/contracts";
import { db } from "../db";
import { type AppType } from "../types";

const settingsRouter = new Hono<AppType>();

// ============================================
// GET /api/settings - Get user settings
// ============================================
settingsRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  let settings = await db.userSettings.findUnique({
    where: { userId: user.id },
  });

  // Create default settings if they don't exist
  if (!settings) {
    settings = await db.userSettings.create({
      data: {
        userId: user.id,
        allowMemory: true,
        dailyReminderEnabled: true,
        reminderTime: "09:00",
      },
    });
  }

  return c.json({
    allowMemory: settings.allowMemory,
    dailyReminderEnabled: settings.dailyReminderEnabled,
    reminderTime: settings.reminderTime,
  } satisfies GetSettingsResponse);
});

// ============================================
// PUT /api/settings - Update user settings
// ============================================
settingsRouter.put("/", zValidator("json", updateSettingsRequestSchema), async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const data = c.req.valid("json");

  const settings = await db.userSettings.upsert({
    where: { userId: user.id },
    update: data,
    create: {
      userId: user.id,
      allowMemory: data.allowMemory ?? true,
      dailyReminderEnabled: data.dailyReminderEnabled ?? true,
      reminderTime: data.reminderTime ?? "09:00",
    },
  });

  return c.json({
    allowMemory: settings.allowMemory,
    dailyReminderEnabled: settings.dailyReminderEnabled,
    reminderTime: settings.reminderTime,
  } satisfies UpdateSettingsResponse);
});

export { settingsRouter };
