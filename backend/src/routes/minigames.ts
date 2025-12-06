import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppType } from "../index";
import { db } from "../db";

const minigamesRouter = new Hono<AppType>();

// Submit mini-game score
const submitScoreSchema = z.object({
  gameType: z.enum(["FRUIT_CATCH", "BUBBLE_POP", "FISHING", "MEMORY", "DASH"]),
  score: z.number().int().min(0),
});

minigamesRouter.post("/result", zValidator("json", submitScoreSchema), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ message: "Unauthorized" }, 401);

  const { gameType, score } = c.req.valid("json");

  try {
    // Get user's Blipkin
    const blipkin = await db.blipkin.findUnique({
      where: { userId: user.id },
    });

    if (!blipkin) {
      return c.json({ message: "No Blipkin found" }, 404);
    }

    // Calculate rewards based on game type
    let coinsEarned = 0;
    let xpEarned = 0;

    switch (gameType) {
      case "FRUIT_CATCH":
        coinsEarned = Math.floor(score * 2); // Score × 2 = coins
        xpEarned = 10;
        break;
      case "BUBBLE_POP":
        coinsEarned = score; // Score = coins
        xpEarned = 15;
        break;
      case "FISHING":
        coinsEarned = score; // Fish value = coins
        xpEarned = 20;
        break;
      case "MEMORY":
        coinsEarned = Math.max(0, (20 - score) * 10); // Fewer moves = more coins
        xpEarned = 25;
        break;
      case "DASH":
        coinsEarned = Math.floor(score * 5); // Distance × 5 = coins
        xpEarned = 30;
        break;
    }

    // Check for active events (bonus multipliers)
    const activeEvents = await db.globalEventState.findMany({
      where: {
        isActive: true,
        startsAt: { lte: new Date() },
        endsAt: { gte: new Date() },
      },
    });

    let coinMultiplier = 1;
    let xpMultiplier = 1;

    for (const event of activeEvents) {
      if (event.eventKey === "BONUS_COINS" || event.eventKey === "FUN_FRIDAY") {
        coinMultiplier = 2;
      }
      if (event.eventKey === "DOUBLE_XP" || event.eventKey === "MOTIVATION_MONDAY") {
        xpMultiplier = 2;
      }
    }

    coinsEarned = Math.floor(coinsEarned * coinMultiplier);
    xpEarned = Math.floor(xpEarned * xpMultiplier);

    // Save game result
    const result = await db.miniGameResult.create({
      data: {
        userId: user.id,
        blipkinId: blipkin.id,
        gameType,
        score,
        coinsEarned,
        xpEarned,
      },
    });

    // Award coins to wallet
    await db.currencyWallet.upsert({
      where: { userId: user.id },
      update: { coins: { increment: coinsEarned } },
      create: { userId: user.id, coins: coinsEarned, voltGems: 0 },
    });

    // Award XP to Blipkin (with level-up check)
    const newXP = blipkin.xp + xpEarned;
    const xpNeeded = blipkin.level * 100;
    let newLevel = blipkin.level;
    let remainingXP = newXP;

    if (newXP >= xpNeeded) {
      newLevel += 1;
      remainingXP = newXP - xpNeeded;
    }

    await db.blipkin.update({
      where: { id: blipkin.id },
      data: {
        xp: remainingXP,
        level: newLevel,
      },
    });

    const leveledUp = newLevel > blipkin.level;

    return c.json({
      success: true,
      result: {
        id: result.id,
        gameType,
        score,
        coinsEarned,
        xpEarned,
        leveledUp,
        newLevel,
      },
    });
  } catch (error) {
    console.error("Error submitting mini-game result:", error);
    return c.json({ message: "Failed to submit result" }, 500);
  }
});

// Get user's mini-game stats
minigamesRouter.get("/stats", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ message: "Unauthorized" }, 401);

  try {
    const results = await db.miniGameResult.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Calculate stats per game type
    const statsByGame: Record<string, any> = {};

    results.forEach((result) => {
      if (!statsByGame[result.gameType]) {
        statsByGame[result.gameType] = {
          gameType: result.gameType,
          plays: 0,
          highScore: 0,
          totalCoins: 0,
          totalXP: 0,
        };
      }

      const stats = statsByGame[result.gameType];
      stats.plays += 1;
      stats.highScore = Math.max(stats.highScore, result.score);
      stats.totalCoins += result.coinsEarned;
      stats.totalXP += result.xpEarned;
    });

    return c.json({
      recentGames: results.slice(0, 10).map((r) => ({
        id: r.id,
        gameType: r.gameType,
        score: r.score,
        coinsEarned: r.coinsEarned,
        xpEarned: r.xpEarned,
        playedAt: r.createdAt.toISOString(),
      })),
      statsByGame: Object.values(statsByGame),
    });
  } catch (error) {
    console.error("Error fetching mini-game stats:", error);
    return c.json({ message: "Failed to fetch stats" }, 500);
  }
});

export { minigamesRouter };
