import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppType } from "../index";
import { db } from "../db";

const eventsRouter = new Hono<AppType>();

// Get currently active events
eventsRouter.get("/active", async (c) => {
  try {
    const now = new Date();

    const activeEvents = await db.globalEventState.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
    });

    return c.json({
      events: activeEvents.map((e) => ({
        id: e.id,
        eventKey: e.eventKey,
        startsAt: e.startsAt.toISOString(),
        endsAt: e.endsAt.toISOString(),
        isActive: e.isActive,
      })),
      count: activeEvents.length,
    });
  } catch (error) {
    console.error("Error fetching active events:", error);
    return c.json({ message: "Failed to fetch events" }, 500);
  }
});

// Get event details
eventsRouter.get("/:eventKey", async (c) => {
  const eventKey = c.req.param("eventKey");

  try {
    const event = await db.globalEventState.findUnique({
      where: { eventKey },
    });

    if (!event) {
      return c.json({ message: "Event not found" }, 404);
    }

    // Get event metadata
    const eventMetadata = getEventMetadata(eventKey);

    return c.json({
      id: event.id,
      eventKey: event.eventKey,
      isActive: event.isActive,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt.toISOString(),
      ...eventMetadata,
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    return c.json({ message: "Failed to fetch event" }, 500);
  }
});

// Helper function to get event metadata
function getEventMetadata(eventKey: string) {
  const eventMap: Record<string, any> = {
    MOTIVATION_MONDAY: {
      name: "Motivation Monday",
      description: "Double XP from all actions!",
      multiplier: 2.0,
      bonusType: "XP",
      iconKey: "⚡",
    },
    FEEDING_FRENZY: {
      name: "Feeding Frenzy",
      description: "1.5x bonus when feeding your Blipkin",
      multiplier: 1.5,
      bonusType: "FEED",
      iconKey: "🍎",
    },
    FUN_FRIDAY: {
      name: "Fun Friday",
      description: "Double coins from all activities!",
      multiplier: 2.0,
      bonusType: "COINS",
      iconKey: "🪙",
    },
    CHILL_SUNDAY: {
      name: "Chill Sunday",
      description: "Double rest effectiveness",
      multiplier: 2.0,
      bonusType: "REST",
      iconKey: "😴",
    },
    HAPPINESS_WEEK: {
      name: "Happiness Week",
      description: "Double bond gain from all interactions",
      multiplier: 2.0,
      bonusType: "BOND",
      iconKey: "💖",
    },
    EVOLUTION_SURGE: {
      name: "Evolution Surge",
      description: "50% less XP needed to level up",
      multiplier: 0.5,
      bonusType: "XP_REQUIREMENT",
      iconKey: "🌟",
    },
    BLIPKIN_PARTY: {
      name: "BlipNet Party",
      description: "Extra coins for BlipNet interactions",
      multiplier: 3.0,
      bonusType: "BLIPNET_COINS",
      iconKey: "🎉",
    },
  };

  return (
    eventMap[eventKey] || {
      name: eventKey,
      description: "Special event",
      multiplier: 1.0,
      bonusType: "UNKNOWN",
      iconKey: "🎪",
    }
  );
}

// Admin: Create a new event (TODO: Add admin auth middleware)
const createEventSchema = z.object({
  eventKey: z.string(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  isActive: z.boolean().default(true),
});

eventsRouter.post("/", zValidator("json", createEventSchema), async (c) => {
  // TODO: Add admin authentication check
  // const user = c.get("user");
  // if (!user || !user.isAdmin) return c.json({ message: "Unauthorized" }, 401);

  const body = c.req.valid("json");

  try {
    const event = await db.globalEventState.create({
      data: {
        eventKey: body.eventKey,
        startsAt: new Date(body.startsAt),
        endsAt: new Date(body.endsAt),
        isActive: body.isActive,
      },
    });

    return c.json({
      success: true,
      event: {
        id: event.id,
        eventKey: event.eventKey,
        startsAt: event.startsAt.toISOString(),
        endsAt: event.endsAt.toISOString(),
        isActive: event.isActive,
      },
    });
  } catch (error) {
    console.error("Error creating event:", error);
    return c.json({ message: "Failed to create event" }, 500);
  }
});

// Admin: Toggle event active status
eventsRouter.patch("/:eventId/toggle", async (c) => {
  // TODO: Add admin authentication check
  const eventId = c.req.param("eventId");

  try {
    const event = await db.globalEventState.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return c.json({ message: "Event not found" }, 404);
    }

    const updated = await db.globalEventState.update({
      where: { id: eventId },
      data: { isActive: !event.isActive },
    });

    return c.json({
      success: true,
      event: {
        id: updated.id,
        eventKey: updated.eventKey,
        isActive: updated.isActive,
      },
    });
  } catch (error) {
    console.error("Error toggling event:", error);
    return c.json({ message: "Failed to toggle event" }, 500);
  }
});

export { eventsRouter };
