import { z } from "zod";

// ============================================
// BlipNet Contracts
// ============================================

// BlipNet Presence
export const blipnetPresenceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  blipkinId: z.string(),
  lastLocationX: z.number(),
  lastLocationY: z.number(),
  lastDirection: z.string(),
  lastAction: z.string(),
  lastSeenAt: z.string(),
});
export type BlipnetPresence = z.infer<typeof blipnetPresenceSchema>;

// Blipkin in lobby view
export const blipnetBlipkinViewSchema = z.object({
  userId: z.string(),
  blipkinId: z.string(),
  name: z.string(),
  evolutionStage: z.string(),
  megaForm: z.string().nullable(),
  level: z.number(),
  mood: z.string(),
  currentAnimation: z.string(),
  x: z.number(),
  y: z.number(),
  direction: z.string(),
  lastAction: z.string(),
});
export type BlipnetBlipkinView = z.infer<typeof blipnetBlipkinViewSchema>;

// GET /api/blipnet/lobby
export const blipnetLobbyResponseSchema = z.object({
  myBlipkin: blipnetBlipkinViewSchema,
  otherBlipkins: z.array(blipnetBlipkinViewSchema),
  activeCount: z.number(),
});
export type BlipnetLobbyResponse = z.infer<typeof blipnetLobbyResponseSchema>;

// POST /api/blipnet/presence
export const updatePresenceRequestSchema = z.object({
  x: z.number(),
  y: z.number(),
  direction: z.string(),
  action: z.string(),
});
export type UpdatePresenceRequest = z.infer<typeof updatePresenceRequestSchema>;

// POST /api/blipnet/emote
export const sendEmoteRequestSchema = z.object({
  emoteType: z.string(), // "heart", "happy", "sad", "angry", "confused", "sparkle"
});
export type SendEmoteRequest = z.infer<typeof sendEmoteRequestSchema>;

// ============================================
// Shop & Currency Contracts
// ============================================

export const currencyWalletSchema = z.object({
  coins: z.number(),
  voltGems: z.number(),
});
export type CurrencyWallet = z.infer<typeof currencyWalletSchema>;

export const shopItemSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  priceCoins: z.number(),
  priceVoltGems: z.number().nullable(),
  iconKey: z.string(),
  effectType: z.string(),
  effectValue: z.number(),
});
export type ShopItem = z.infer<typeof shopItemSchema>;

export const inventoryItemSchema = z.object({
  id: z.string(),
  shopItemId: z.string(),
  shopItem: shopItemSchema,
  quantity: z.number(),
  obtainedAt: z.string(),
});
export type InventoryItem = z.infer<typeof inventoryItemSchema>;

// GET /api/shop/catalog
export const shopCatalogResponseSchema = z.object({
  wallet: currencyWalletSchema,
  items: z.array(shopItemSchema),
  inventory: z.array(inventoryItemSchema),
});
export type ShopCatalogResponse = z.infer<typeof shopCatalogResponseSchema>;

// POST /api/shop/buy
export const purchaseItemRequestSchema = z.object({
  shopItemId: z.string(),
  currency: z.enum(["COINS", "VOLT_GEMS"]),
});
export type PurchaseItemRequest = z.infer<typeof purchaseItemRequestSchema>;

export const purchaseItemResponseSchema = z.object({
  success: z.boolean(),
  wallet: currencyWalletSchema,
  newItem: inventoryItemSchema.nullable(),
  message: z.string(),
});
export type PurchaseItemResponse = z.infer<typeof purchaseItemResponseSchema>;

// ============================================
// Room Contracts
// ============================================

export const roomFurnitureSchema = z.object({
  id: z.string(),
  shopItemId: z.string(),
  shopItem: shopItemSchema,
  posX: z.number(),
  posY: z.number(),
  rotation: z.number(),
});
export type RoomFurniture = z.infer<typeof roomFurnitureSchema>;

export const blipkinRoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  wallpaperKey: z.string(),
  floorKey: z.string(),
  furniture: z.array(roomFurnitureSchema),
});
export type BlipkinRoom = z.infer<typeof blipkinRoomSchema>;

// GET /api/room
export const getRoomResponseSchema = blipkinRoomSchema;
export type GetRoomResponse = z.infer<typeof getRoomResponseSchema>;

// POST /api/room/update-layout
export const updateRoomLayoutRequestSchema = z.object({
  furniture: z.array(
    z.object({
      shopItemId: z.string(),
      posX: z.number(),
      posY: z.number(),
      rotation: z.number().optional(),
    })
  ),
});
export type UpdateRoomLayoutRequest = z.infer<typeof updateRoomLayoutRequestSchema>;

// ============================================
// Mini-Games Contracts
// ============================================

export const miniGameResultSchema = z.object({
  id: z.string(),
  gameType: z.string(),
  score: z.number(),
  coinsEarned: z.number(),
  xpEarned: z.number(),
  createdAt: z.string(),
});
export type MiniGameResult = z.infer<typeof miniGameResultSchema>;

// POST /api/minigames/result
export const submitGameResultRequestSchema = z.object({
  gameType: z.string(),
  score: z.number(),
});
export type SubmitGameResultRequest = z.infer<typeof submitGameResultRequestSchema>;

export const submitGameResultResponseSchema = z.object({
  success: z.boolean(),
  coinsEarned: z.number(),
  xpEarned: z.number(),
  wallet: currencyWalletSchema,
  message: z.string(),
});
export type SubmitGameResultResponse = z.infer<typeof submitGameResultResponseSchema>;

// ============================================
// Journal Contracts
// ============================================

export const journalEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  moodTag: z.string(),
  createdAt: z.string(),
});
export type JournalEntry = z.infer<typeof journalEntrySchema>;

// GET /api/journal
export const getJournalResponseSchema = z.object({
  entries: z.array(journalEntrySchema),
});
export type GetJournalResponse = z.infer<typeof getJournalResponseSchema>;

// ============================================
// Events Contracts
// ============================================

export const globalEventSchema = z.object({
  id: z.string(),
  eventKey: z.string(),
  isActive: z.boolean(),
  startsAt: z.string(),
  endsAt: z.string(),
});
export type GlobalEvent = z.infer<typeof globalEventSchema>;

// GET /api/events/active
export const getActiveEventsResponseSchema = z.object({
  events: z.array(globalEventSchema),
  multipliers: z.object({
    xp: z.number(),
    coins: z.number(),
    bond: z.number(),
  }),
});
export type GetActiveEventsResponse = z.infer<typeof getActiveEventsResponseSchema>;

// ============================================
// Personality Contracts
// ============================================

export const personalityProfileSchema = z.object({
  energy: z.number(), // 0-100
  curiosity: z.number(), // 0-100
  sociability: z.number(), // 0-100
  carefulness: z.number(), // 0-100
  affection: z.number(), // 0-100
  coreTrait: z.string(), // "NURTURING", "EXPLORER", "CHAOS", "CALM"
  moodBias: z.string(), // "HAPPY", "TIRED", "CHAOTIC", "SHY", "BOLD"
  dialogueStyle: z.string(), // "short_cute", "rambling", "wise", "playful"
});
export type PersonalityProfile = z.infer<typeof personalityProfileSchema>;
