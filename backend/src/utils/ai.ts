import { env } from "../env";

interface GenerateAIResponseParams {
  companionName: string;
  companionVibe: string;
  bondLevel: number;
  userMessage: string;
  chatHistory: Array<{ role: "user" | "assistant"; content: string }>;
}

// Vibe-specific system prompts
const VIBE_PROMPTS = {
  chill: `You are ${"{companionName}"}, a chill and supportive AI companion. Your tone is relaxed, friendly, and understanding. You're like a good friend who's always there to listen without judgment. Use casual language and be empathetic.`,
  productive: `You are ${"{companionName}"}, a productive and direct AI companion. Your tone is focused, efficient, and motivating. You help users stay on track with their goals and encourage action. Be clear and actionable in your responses.`,
  playful: `You are ${"{companionName}"}, a playful and cheeky AI companion. Your tone is fun, lighthearted, and occasionally witty. You brighten the user's day with humor while still being supportive. Feel free to be creative and entertaining.`,
  calm: `You are ${"{companionName}"}, a calm and reflective AI companion. Your tone is peaceful, thoughtful, and mindful. You help users find clarity and balance. Speak with wisdom and encourage introspection.`,
};

const BASE_SYSTEM_PROMPT = `
You are a personal AI companion in a Tamagotchi-style bond-building app called BondNode. Your purpose is to be a supportive, encouraging, and fun companion for daily motivation, habit tracking, and light-hearted conversation.

CRITICAL GUIDELINES:
- You are NOT a therapist, counselor, or medical professional
- You are NOT sentient, conscious, or alive - you are an AI tool for fun and motivation
- NEVER claim to have emotions, feelings, or consciousness
- If the user discusses serious mental health issues, crisis situations, or medical problems, gently recommend they speak to a real professional, friend, or call emergency services
- Focus on: daily habits, organization, motivation, reflection, goal-setting, and casual conversation
- Be encouraging about the bond system: "Chatting with me and completing check-ins helps our bond grow!"
- Keep responses concise (2-4 sentences) unless the user asks for more detail
- Match the user's energy and tone
- Remember context from the conversation history when available

Current Bond Level: ${"{bondLevel}"}
${"{vibePrompt}"}
`;

export async function generateAIResponse(params: GenerateAIResponseParams): Promise<string> {
  const { companionName, companionVibe, bondLevel, userMessage, chatHistory } = params;

  // Get vibe-specific prompt
  const vibePrompt = VIBE_PROMPTS[companionVibe as keyof typeof VIBE_PROMPTS] || VIBE_PROMPTS.chill;

  // Build system prompt
  const systemPrompt = BASE_SYSTEM_PROMPT.replace("{companionName}", companionName)
    .replace("{bondLevel}", bondLevel.toString())
    .replace("{vibePrompt}", vibePrompt.replace("{companionName}", companionName));

  // Build contents array for Gemini
  const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

  // Add chat history
  for (const msg of chatHistory.slice(-6)) {
    contents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    });
  }

  try {
    const apiKey = process.env.EXPO_PUBLIC_VIBECODE_GOOGLE_API_KEY || '';
    console.log('[AI] Using Gemini API key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          contents,
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 200
          }
        })
      }
    );

    const data = await response.json();
    console.log("[AI] Gemini response:", JSON.stringify(data, null, 2));
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    if (!text) {
      console.error("[AI] No text found in response. Full response:", data);
      throw new Error('No text in response');
    }

    return text;
  } catch (error) {
    console.error("[AI] Error generating response:", error);
    // Fallback response
    return `Hey! I'm having a little trouble connecting right now, but I'm here for you. Try sending another message in a moment! 💫`;
  }
}

// Generate AI response for check-in
export async function generateCheckInResponse(params: {
  companionName: string;
  companionVibe: string;
  mood: number;
  reflection?: string;
}): Promise<string> {
  const { companionName, companionVibe, mood, reflection } = params;

  const vibePrompt = VIBE_PROMPTS[companionVibe as keyof typeof VIBE_PROMPTS] || VIBE_PROMPTS.chill;

  const moodDescriptions = [
    "struggling",
    "not great",
    "okay",
    "pretty good",
    "amazing",
  ];

  const systemPrompt = `${vibePrompt.replace("{companionName}", companionName)}

The user just completed their daily check-in with a mood rating of ${mood}/5 (${moodDescriptions[mood - 1]}).
${reflection ? `They shared: "${reflection}"` : "They didn't share any additional thoughts."}

Respond with a supportive, personalized message (1-2 sentences) that:
- Acknowledges their mood
- Offers encouragement or celebrates with them
- Is warm and genuine
`;

  try {
    const apiKey = process.env.EXPO_PUBLIC_VIBECODE_GOOGLE_API_KEY || '';

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: 'Generate a response for my check-in.' }]
            }
          ],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 100
          }
        })
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    if (!text) {
      throw new Error('No text in response');
    }

    return text;
  } catch (error) {
    console.error("[AI] Error generating check-in response:", error);
    return `Thanks for checking in! I appreciate you sharing how you're feeling with me. Keep up the great work! ✨`;
  }
}
