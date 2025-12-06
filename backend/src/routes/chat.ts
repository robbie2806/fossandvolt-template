import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  type GetChatHistoryResponse,
  sendChatMessageRequestSchema,
  type SendChatMessageResponse,
} from "@/shared/contracts";
import { db } from "../db";
import { type AppType } from "../types";
import { generateAIResponse, generateBlipkinResponse } from "../utils/ai";

const chatRouter = new Hono<AppType>();

// ============================================
// GET /api/chat - Get chat history
// ============================================
chatRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const messages = await db.chatMessage.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    take: 100, // Last 100 messages
  });

  return c.json({
    messages: messages.map((msg) => ({
      id: msg.id,
      role: msg.role as "user" | "assistant",
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
    })),
  } satisfies GetChatHistoryResponse);
});

// ============================================
// POST /api/chat - Send message and get AI response
// ============================================
chatRouter.post("/", zValidator("json", sendChatMessageRequestSchema), async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const { message, mode = "companion" } = c.req.valid("json");

  // Get companion and settings
  const companion = await db.aICompanion.findUnique({
    where: { userId: user.id },
  });

  if (!companion) {
    return c.json({ message: "AI companion not found. Complete onboarding first." }, 404);
  }

  const settings = await db.userSettings.findUnique({
    where: { userId: user.id },
  });

  // Save user message
  const userMessage = await db.chatMessage.create({
    data: {
      userId: user.id,
      role: "user",
      content: message,
    },
  });

  // Get chat history for context (last 10 messages)
  const recentMessages = settings?.allowMemory
    ? await db.chatMessage.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
    : [];

  // Generate AI response based on mode
  let aiResponseText: string;

  if (mode === "blipkin") {
    // Get Blipkin for Blipkin chat mode
    const blipkin = await db.blipkin.findUnique({
      where: { userId: user.id },
    });

    if (!blipkin) {
      return c.json({ message: "Blipkin not found. Complete PixieVolt onboarding first." }, 404);
    }

    // Generate Blipkin response
    aiResponseText = await generateBlipkinResponse({
      blipkinName: blipkin.name,
      blipkinLevel: blipkin.level,
      blipkinMood: blipkin.mood,
      blipkinBond: blipkin.bond,
      blipkinEnergy: blipkin.energy,
      blipkinHunger: blipkin.hunger,
      userMessage: message,
      chatHistory: recentMessages.reverse().map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    });

    // Award XP and bond to Blipkin for chatting
    // Chat gives the MOST XP to encourage using our AI over ChatGPT!
    const xpGained = 10; // Highest XP reward!
    const bondGained = 3;
    const newXP = blipkin.xp + xpGained;
    let newLevel = blipkin.level;
    let xpAfterLevel = newXP;

    // Check for level up
    while (xpAfterLevel >= newLevel * 100) {
      xpAfterLevel -= newLevel * 100;
      newLevel++;
    }

    // Update Blipkin
    await db.blipkin.update({
      where: { userId: user.id },
      data: {
        xp: xpAfterLevel,
        level: newLevel,
        bond: Math.min(100, blipkin.bond + bondGained),
        totalChats: blipkin.totalChats + 1,
        lastSeenAt: new Date(),
      },
    });

    // Award coins for chatting with Blipkin (more than other actions!)
    await db.currencyWallet.upsert({
      where: { userId: user.id },
      update: { coins: { increment: 10 } },
      create: { userId: user.id, coins: 10, voltGems: 0 },
    });
  } else {
    // Generate regular companion response
    aiResponseText = await generateAIResponse({
      companionName: companion.name,
      companionVibe: companion.vibe,
      bondLevel: companion.bondLevel,
      userMessage: message,
      chatHistory: recentMessages.reverse().map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    });
  }


  // Save AI message
  const aiMessage = await db.chatMessage.create({
    data: {
      userId: user.id,
      role: "assistant",
      content: aiResponseText,
    },
  });

  // Award XP for chatting (2 XP per message)
  const xpAwarded = 2;
  const xpForNextLevel = companion.bondLevel * 100;
  const newXP = companion.bondXP + xpAwarded;
  const levelUp = newXP >= xpForNextLevel;

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
      actionType: "chat",
      content: null,
      xpAwarded,
    },
  });

  return c.json({
    userMessage: {
      id: userMessage.id,
      role: "user" as const,
      content: userMessage.content,
      createdAt: userMessage.createdAt.toISOString(),
    },
    assistantMessage: {
      id: aiMessage.id,
      role: "assistant" as const,
      content: aiMessage.content,
      createdAt: aiMessage.createdAt.toISOString(),
    },
    bondXPAwarded: xpAwarded,
    newBondLevel: levelUp ? updatedCompanion.bondLevel : undefined,
  } satisfies SendChatMessageResponse);
});

export { chatRouter };
