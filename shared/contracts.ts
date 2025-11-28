// contracts.ts
// BondNode API Contracts
// Shared schemas and types for the BondNode AI companion app

import { z } from "zod";

// ============================================
// AI Companion Endpoints
// ============================================

// GET /api/companion - Get user's AI companion
export const getCompanionResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  vibe: z.string(),
  bondLevel: z.number(),
  bondXP: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type GetCompanionResponse = z.infer<typeof getCompanionResponseSchema>;

// POST /api/companion - Create AI companion (during onboarding)
export const createCompanionRequestSchema = z.object({
  name: z.string().min(1, "AI name is required"),
  vibe: z.enum(["chill", "productive", "playful", "calm"]),
});
export type CreateCompanionRequest = z.infer<typeof createCompanionRequestSchema>;
export const createCompanionResponseSchema = getCompanionResponseSchema;
export type CreateCompanionResponse = z.infer<typeof createCompanionResponseSchema>;

// PUT /api/companion - Update AI companion (name or vibe)
export const updateCompanionRequestSchema = z.object({
  name: z.string().optional(),
  vibe: z.enum(["chill", "productive", "playful", "calm"]).optional(),
});
export type UpdateCompanionRequest = z.infer<typeof updateCompanionRequestSchema>;
export const updateCompanionResponseSchema = getCompanionResponseSchema;
export type UpdateCompanionResponse = z.infer<typeof updateCompanionResponseSchema>;

// ============================================
// Chat Endpoints
// ============================================

// GET /api/chat - Get chat history
export const getChatHistoryResponseSchema = z.object({
  messages: z.array(
    z.object({
      id: z.string(),
      role: z.enum(["user", "assistant"]),
      content: z.string(),
      createdAt: z.string(),
    }),
  ),
});
export type GetChatHistoryResponse = z.infer<typeof getChatHistoryResponseSchema>;

// POST /api/chat - Send message and get AI response
export const sendChatMessageRequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
});
export type SendChatMessageRequest = z.infer<typeof sendChatMessageRequestSchema>;
export const sendChatMessageResponseSchema = z.object({
  userMessage: z.object({
    id: z.string(),
    role: z.literal("user"),
    content: z.string(),
    createdAt: z.string(),
  }),
  assistantMessage: z.object({
    id: z.string(),
    role: z.literal("assistant"),
    content: z.string(),
    createdAt: z.string(),
  }),
  bondXPAwarded: z.number(),
  newBondLevel: z.number().optional(), // Only if level increased
});
export type SendChatMessageResponse = z.infer<typeof sendChatMessageResponseSchema>;

// ============================================
// Bond Action Endpoints
// ============================================

// GET /api/bond - Get bond status and today's actions
export const getBondStatusResponseSchema = z.object({
  bondLevel: z.number(),
  bondXP: z.number(),
  xpForNextLevel: z.number(),
  todayActions: z.object({
    hasCheckedIn: z.boolean(),
    hasGratitude: z.boolean(),
    hasGoal: z.boolean(),
  }),
  recentActions: z.array(
    z.object({
      id: z.string(),
      actionType: z.string(),
      content: z.string().nullable(),
      xpAwarded: z.number(),
      date: z.string(),
    }),
  ),
});
export type GetBondStatusResponse = z.infer<typeof getBondStatusResponseSchema>;

// POST /api/bond/check-in - Submit daily check-in
export const submitCheckInRequestSchema = z.object({
  mood: z.number().min(1).max(5),
  reflection: z.string().optional(),
});
export type SubmitCheckInRequest = z.infer<typeof submitCheckInRequestSchema>;
export const submitCheckInResponseSchema = z.object({
  success: z.boolean(),
  xpAwarded: z.number(),
  newBondLevel: z.number(),
  aiResponse: z.string(),
});
export type SubmitCheckInResponse = z.infer<typeof submitCheckInResponseSchema>;

// POST /api/bond/gratitude - Submit gratitude note
export const submitGratitudeRequestSchema = z.object({
  content: z.string().min(1, "Gratitude note cannot be empty"),
});
export type SubmitGratitudeRequest = z.infer<typeof submitGratitudeRequestSchema>;
export const submitGratitudeResponseSchema = z.object({
  success: z.boolean(),
  xpAwarded: z.number(),
  newBondLevel: z.number(),
});
export type SubmitGratitudeResponse = z.infer<typeof submitGratitudeResponseSchema>;

// POST /api/bond/goal - Submit or update mini goal
export const submitGoalRequestSchema = z.object({
  content: z.string().min(1, "Goal cannot be empty"),
});
export type SubmitGoalRequest = z.infer<typeof submitGoalRequestSchema>;
export const submitGoalResponseSchema = z.object({
  success: z.boolean(),
  xpAwarded: z.number(),
  newBondLevel: z.number(),
});
export type SubmitGoalResponse = z.infer<typeof submitGoalResponseSchema>;

// ============================================
// Settings Endpoints
// ============================================

// GET /api/settings - Get user settings
export const getSettingsResponseSchema = z.object({
  allowMemory: z.boolean(),
  dailyReminderEnabled: z.boolean(),
  reminderTime: z.string(),
});
export type GetSettingsResponse = z.infer<typeof getSettingsResponseSchema>;

// PUT /api/settings - Update user settings
export const updateSettingsRequestSchema = z.object({
  allowMemory: z.boolean().optional(),
  dailyReminderEnabled: z.boolean().optional(),
  reminderTime: z.string().optional(),
});
export type UpdateSettingsRequest = z.infer<typeof updateSettingsRequestSchema>;
export const updateSettingsResponseSchema = getSettingsResponseSchema;
export type UpdateSettingsResponse = z.infer<typeof updateSettingsResponseSchema>;
