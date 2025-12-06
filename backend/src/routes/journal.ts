import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppType } from "../index";
import { db } from "../db";
import { computePersonalityProfile } from "../utils/personality";

const journalRouter = new Hono<AppType>();

// Get journal entries for user's Blipkin
journalRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ message: "Unauthorized" }, 401);

  try {
    const entries = await db.blipkinJournalEntry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30, // Last 30 entries
    });

    return c.json({
      entries: entries.map((e) => ({
        id: e.id,
        title: e.title,
        body: e.body,
        moodTag: e.moodTag,
        createdAt: e.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    return c.json({ message: "Failed to fetch entries" }, 500);
  }
});

// Generate AI journal entry for today
journalRouter.post("/generate", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ message: "Unauthorized" }, 401);

  try {
    // Get user's Blipkin
    const blipkin = await db.blipkin.findUnique({
      where: { userId: user.id },
    });

    if (!blipkin) {
      return c.json({ message: "No Blipkin found" }, 404);
    }

    // Check if entry already exists for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingEntry = await db.blipkinJournalEntry.findFirst({
      where: {
        userId: user.id,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (existingEntry) {
      return c.json({
        message: "Journal entry already generated for today",
        entry: {
          id: existingEntry.id,
          title: existingEntry.title,
          body: existingEntry.body,
          moodTag: existingEntry.moodTag,
          createdAt: existingEntry.createdAt.toISOString(),
        },
      });
    }

    // Compute personality
    const personality = computePersonalityProfile(blipkin);

    // Count today's interactions
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Get action counts from care history (approximate daily actions)
    const dailyFeeds = Math.floor(blipkin.totalFeeds / Math.max(1, blipkin.daysAlive));
    const dailyPlays = Math.floor(blipkin.totalPlays / Math.max(1, blipkin.daysAlive));
    const dailyChats = Math.floor(blipkin.totalChats / Math.max(1, blipkin.daysAlive));

    // Generate journal entry using AI
    const apiKey = process.env.CODEX_API_KEY;
    if (!apiKey) {
      return c.json({ message: "AI service not configured" }, 500);
    }

    const prompt = `You are ${blipkin.name}, a ${blipkin.evolutionStage} Blipkin AI creature.

PERSONALITY TRAITS:
- Energy: ${personality.energy}/100 ${personality.energy > 70 ? "(very energetic)" : personality.energy < 30 ? "(calm and relaxed)" : "(balanced)"}
- Sociability: ${personality.sociability}/100 ${personality.sociability > 70 ? "(very social)" : personality.sociability < 30 ? "(introverted)" : "(friendly)"}
- Curiosity: ${personality.curiosity}/100 ${personality.curiosity > 70 ? "(very curious)" : "(content)"}
- Affection: ${personality.affection}/100 ${personality.affection > 70 ? "(very loving)" : "(independent)"}
- Core Trait: ${personality.coreTrait}

TODAY'S ACTIVITIES:
- Fed ${dailyFeeds} times
- Played ${dailyPlays} times
- Chatted ${dailyChats} times
- Current mood: ${blipkin.mood}
- Evolution stage: ${blipkin.evolutionStage}
- Level: ${blipkin.level}

Write a SHORT journal entry (2-3 sentences) about your day from your perspective.
Match your personality traits and evolution stage.
Be cute, playful, and authentic to who you are.
Use ${personality.dialogueStyle} dialogue style.

Format:
Title: [Short catchy title, 3-5 words]
Body: [2-3 sentence journal entry from Blipkin's perspective]`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a cute AI creature writing a personal journal entry. Be authentic, playful, and match the personality traits provided.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.9,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", await response.text());
      return c.json({ message: "Failed to generate journal entry" }, 500);
    }

    const data = await response.json();
    const journalText = data.choices[0]?.message?.content || "";

    // Parse title and body
    const lines = journalText.trim().split("\n");
    let title = "My Day";
    let body = journalText;

    if (lines[0]?.startsWith("Title:")) {
      title = lines[0].replace("Title:", "").trim();
      body = lines.slice(1).join("\n").replace("Body:", "").trim();
    }

    // Determine mood tag
    const moodTags = ["HAPPY", "EXCITED", "CALM", "TIRED", "PLAYFUL", "CONTENT"];
    let moodTag = "HAPPY";

    if (blipkin.mood === "Sleepy" || blipkin.mood === "Content") moodTag = "CALM";
    else if (blipkin.mood === "Excited" || blipkin.mood === "Joyful") moodTag = "EXCITED";
    else if (blipkin.mood === "Playful") moodTag = "PLAYFUL";
    else if (personality.energy < 40) moodTag = "TIRED";

    // Save entry
    const entry = await db.blipkinJournalEntry.create({
      data: {
        userId: user.id,
        blipkinId: blipkin.id,
        title,
        body,
        moodTag,
      },
    });

    return c.json({
      success: true,
      entry: {
        id: entry.id,
        title: entry.title,
        body: entry.body,
        moodTag: entry.moodTag,
        createdAt: entry.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error generating journal entry:", error);
    return c.json({ message: "Failed to generate entry" }, 500);
  }
});

// Delete a journal entry
journalRouter.delete("/:entryId", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ message: "Unauthorized" }, 401);

  const entryId = c.req.param("entryId");

  try {
    // Verify ownership
    const entry = await db.blipkinJournalEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      return c.json({ message: "Entry not found" }, 404);
    }

    if (entry.userId !== user.id) {
      return c.json({ message: "Not your journal entry" }, 403);
    }

    await db.blipkinJournalEntry.delete({
      where: { id: entryId },
    });

    return c.json({ success: true, message: "Entry deleted" });
  } catch (error) {
    console.error("Error deleting journal entry:", error);
    return c.json({ message: "Failed to delete entry" }, 500);
  }
});

export { journalRouter };
