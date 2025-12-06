import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppType } from "../index";
import { db } from "../db";

const blipnetRouter = new Hono<AppType>();

// Get current lobby state (all active Blipkins)
blipnetRouter.get("/lobby", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ message: "Unauthorized" }, 401);

  try {
    // Get all Blipkins with presence data
    const activeBlipkins = await db.blipnetPresence.findMany({
      include: {
        blipkin: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      where: {
        lastSeenAt: {
          // Only show Blipkins active in last 5 minutes
          gte: new Date(Date.now() - 5 * 60 * 1000),
        },
      },
    });

    // Transform to lobby DTO
    const lobbyState = activeBlipkins.map((presence) => ({
      userId: presence.userId,
      blipkinId: presence.blipkinId,
      blipkinName: presence.blipkin.name,
      ownerName: presence.blipkin.user.name || "Anonymous",
      evolutionStage: presence.blipkin.evolutionStage,
      megaForm: presence.blipkin.megaForm,
      x: presence.lastLocationX,
      y: presence.lastLocationY,
      direction: presence.lastDirection,
      action: presence.lastAction,
      lastSeenAt: presence.lastSeenAt.toISOString(),
    }));

    return c.json({ blipkins: lobbyState, count: lobbyState.length });
  } catch (error) {
    console.error("Error fetching lobby state:", error);
    return c.json({ message: "Failed to fetch lobby" }, 500);
  }
});

// Update own presence (position, action, direction)
const updatePresenceSchema = z.object({
  x: z.number().int().min(0).max(15).optional(),
  y: z.number().int().min(0).max(15).optional(),
  direction: z.enum(["up", "down", "left", "right"]).optional(),
  action: z
    .enum(["idle", "walking", "wave", "bounce", "spin", "emote_heart", "emote_sparkle", "emote_confused"])
    .optional(),
});

blipnetRouter.post("/presence", zValidator("json", updatePresenceSchema), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ message: "Unauthorized" }, 401);

  const body = c.req.valid("json");

  try {
    // Get user's Blipkin
    const blipkin = await db.blipkin.findUnique({
      where: { userId: user.id },
    });

    if (!blipkin) {
      return c.json({ message: "No Blipkin found" }, 404);
    }

    // Upsert presence
    const presence = await db.blipnetPresence.upsert({
      where: { userId: user.id },
      update: {
        ...(body.x !== undefined && { lastLocationX: body.x }),
        ...(body.y !== undefined && { lastLocationY: body.y }),
        ...(body.direction && { lastDirection: body.direction }),
        ...(body.action && { lastAction: body.action }),
        lastSeenAt: new Date(),
      },
      create: {
        userId: user.id,
        blipkinId: blipkin.id,
        lastLocationX: body.x ?? 5,
        lastLocationY: body.y ?? 5,
        lastDirection: body.direction ?? "down",
        lastAction: body.action ?? "idle",
        lastSeenAt: new Date(),
      },
    });

    return c.json({
      success: true,
      presence: {
        x: presence.lastLocationX,
        y: presence.lastLocationY,
        direction: presence.lastDirection,
        action: presence.lastAction,
      },
    });
  } catch (error) {
    console.error("Error updating presence:", error);
    return c.json({ message: "Failed to update presence" }, 500);
  }
});

// Send an emote/interaction
const emoteSchema = z.object({
  emoteType: z.enum(["wave", "bounce", "spin", "heart", "sparkle", "confused"]),
});

blipnetRouter.post("/emote", zValidator("json", emoteSchema), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ message: "Unauthorized" }, 401);

  const { emoteType } = c.req.valid("json");

  try {
    // Map emote to action string
    const actionMap: Record<string, string> = {
      wave: "wave",
      bounce: "bounce",
      spin: "spin",
      heart: "emote_heart",
      sparkle: "emote_sparkle",
      confused: "emote_confused",
    };

    // Update presence with emote action
    const presence = await db.blipnetPresence.updateMany({
      where: { userId: user.id },
      data: {
        lastAction: actionMap[emoteType] || "idle",
        lastSeenAt: new Date(),
      },
    });

    if (presence.count === 0) {
      return c.json({ message: "Not in lobby. Join first." }, 404);
    }

    // Grant small coin reward for interaction
    await db.currencyWallet.upsert({
      where: { userId: user.id },
      update: { coins: { increment: 5 } },
      create: { userId: user.id, coins: 5, voltGems: 0 },
    });

    return c.json({
      success: true,
      emote: emoteType,
      coinsEarned: 5,
    });
  } catch (error) {
    console.error("Error sending emote:", error);
    return c.json({ message: "Failed to send emote" }, 500);
  }
});

// Leave the lobby (set presence to stale)
blipnetRouter.post("/leave", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ message: "Unauthorized" }, 401);

  try {
    // Update lastSeenAt to far in past to mark as offline
    await db.blipnetPresence.updateMany({
      where: { userId: user.id },
      data: {
        lastSeenAt: new Date(0), // Unix epoch = definitely offline
        lastAction: "idle",
      },
    });

    return c.json({ success: true, message: "Left BlipNet lobby" });
  } catch (error) {
    console.error("Error leaving lobby:", error);
    return c.json({ message: "Failed to leave lobby" }, 500);
  }
});

export { blipnetRouter };
