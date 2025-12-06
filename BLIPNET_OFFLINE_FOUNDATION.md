# BlipNet V1 - Offline Foundation
## Implementation Summary & Status

**Date:** December 6, 2025
**Status:** Backend Foundation Complete, Frontend In Progress

---

## ✅ COMPLETED

### 1. Database Schema (Prisma)
**File:** `backend/prisma/schema.prisma`

All BlipNet tables added and pushed to database:

- ✅ **BlipnetPresence** - Tracks Blipkin position and action in lobby
- ✅ **CurrencyWallet** - Coins and VoltGems per user
- ✅ **ShopItem** - Catalog of purchasable items
- ✅ **InventoryItem** - User's owned items
- ✅ **BlipkinRoom** - Personal room with wallpaper/floor
- ✅ **RoomFurniture** - Furniture placement in rooms
- ✅ **MiniGameResult** - Game scores and rewards
- ✅ **BlipkinJournalEntry** - AI-generated journal entries
- ✅ **GlobalEventState** - Active events with multipliers

**Database Command:**
```bash
cd /home/user/workspace/backend && bunx prisma db push
```
✅ Successfully applied!

### 2. TypeScript Contracts
**File:** `shared/blipnet-contracts.ts`

All DTOs and request/response schemas created:

- BlipNet lobby state
- Shop catalog and purchase
- Room layout
- Mini-game results
- Journal entries
- Global events
- Personality profiles

### 3. Personality Engine
**File:** `backend/src/utils/personality.ts`

✅ `computePersonalityProfile()` - Calculates 5 personality traits from care history
✅ `getPreferredActivities()` - Returns activity preferences based on personality

**Personality Traits:**
- Energy (0-100)
- Curiosity (0-100)
- Sociability (0-100)
- Carefulness (0-100)
- Affection (0-100)

**Core Traits:**
- NURTURING
- EXPLORER
- CHAOS
- CALM

---

## 🚧 TODO: Backend Routes

### Priority 1: Essential Routes

#### `/api/blipnet`
**File to create:** `backend/src/routes/blipnet.ts`

```typescript
// GET /api/blipnet/lobby
// Returns current user's Blipkin + other active Blipkins

// POST /api/blipnet/presence
// Updates user's position/action in lobby

// POST /api/blipnet/emote
// Sends an emote (heart, happy, etc)
```

#### `/api/shop`
**File to create:** `backend/src/routes/shop.ts`

```typescript
// GET /api/shop/catalog
// Returns all shop items + user wallet + inventory

// POST /api/shop/buy
// Purchases item with coins or gems
// Deducts currency, adds to inventory
```

#### `/api/wallet` (Helper route)
**File to create:** `backend/src/routes/wallet.ts`

```typescript
// GET /api/wallet
// Returns user's currency wallet

// POST /api/wallet/grant
// Internal use: grants coins/gems from actions
```

### Priority 2: Game Features

#### `/api/room`
**File to create:** `backend/src/routes/room.ts`

```typescript
// GET /api/room
// Returns user's room + furniture

// POST /api/room/update-layout
// Updates furniture positions
```

#### `/api/minigames`
**File to create:** `backend/src/routes/minigames.ts`

```typescript
// POST /api/minigames/result
// Submits game score
// Calculates rewards (coins, XP)
// Awards to wallet
// Awards XP to Blipkin
```

#### `/api/journal`
**File to create:** `backend/src/routes/journal.ts`

```typescript
// GET /api/journal
// Returns recent journal entries

// POST /api/journal/auto-entry
// Generates AI journal entry for today
// Uses personality + daily stats
```

#### `/api/events`
**File to create:** `backend/src/routes/events.ts`

```typescript
// GET /api/events/active
// Returns active global events
// Returns XP/coin multipliers
```

### Route Registration

**File:** `backend/src/index.ts`

Add route imports and mounting:
```typescript
import { blipnetRouter } from "./routes/blipnet";
import { shopRouter } from "./routes/shop";
import { roomRouter } from "./routes/room";
import { minigamesRouter } from "./routes/minigames";
import { journalRouter } from "./routes/journal";
import { eventsRouter } from "./routes/events";
import { walletRouter } from "./routes/wallet";

// Mount routes
app.route("/api/blipnet", blipnetRouter);
app.route("/api/shop", shopRouter);
app.route("/api/room", roomRouter);
app.route("/api/minigames", minigamesRouter);
app.route("/api/journal", journalRouter);
app.route("/api/events", eventsRouter);
app.route("/api/wallet", walletRouter);
```

---

## 🚧 TODO: Shop Item Seeding

Create seed script to populate shop with items.

**File to create:** `backend/src/utils/seed-shop.ts`

```typescript
const SHOP_ITEMS = [
  // Food
  { key: "apple", name: "Apple", category: "FOOD", priceCoins: 50, effectType: "FEED", effectValue: 15, iconKey: "🍎" },
  { key: "banana", name: "Banana", category: "FOOD", priceCoins: 50, effectType: "FEED", effectValue: 15, iconKey: "🍌" },
  { key: "sushi", name: "Sushi", category: "FOOD", priceCoins: 150, effectType: "FEED", effectValue: 30, iconKey: "🍣" },

  // Toys
  { key: "ball", name: "Ball", category: "TOY", priceCoins: 100, effectType: "MOOD_BOOST", effectValue: 10, iconKey: "⚽" },
  { key: "puzzle", name: "Puzzle", category: "TOY", priceCoins: 200, effectType: "XP_BOOST", effectValue: 15, iconKey: "🧩" },

  // Room Decorations
  { key: "bed", name: "Cozy Bed", category: "ROOM_ITEM", priceCoins: 500, effectType: "ROOM_DECOR", effectValue: 0, iconKey: "🛏️" },
  { key: "chair", name: "Chair", category: "ROOM_ITEM", priceCoins: 300, effectType: "ROOM_DECOR", effectValue: 0, iconKey: "🪑" },
  { key: "lamp", name: "Lamp", category: "ROOM_ITEM", priceCoins: 200, effectType: "ROOM_DECOR", effectValue: 0, iconKey: "💡" },
  { key: "plant", name: "Plant", category: "ROOM_ITEM", priceCoins: 150, effectType: "ROOM_DECOR", effectValue: 0, iconKey: "🪴" },

  // Boosts (Optional VoltGems)
  { key: "xp_boost", name: "XP Boost (7 days)", category: "BOOST", priceCoins: 1000, priceVoltGems: 50, effectType: "XP_BOOST", effectValue: 10, iconKey: "⚡" },
];

// Run seed function
await seedShopItems(SHOP_ITEMS);
```

**Seed command:**
```bash
cd backend && bun run src/utils/seed-shop.ts
```

---

## 🚧 TODO: Frontend Screens

### Priority 1: Core UI

#### 1. BlipNet Lobby Screen
**File to create:** `src/screens/BlipNetLobbyScreen.tsx`

**Features:**
- Simple 10x10 grid background
- Render player's Blipkin at (x, y)
- Render other Blipkins from `/api/blipnet/lobby`
- 4-direction controls (on-screen d-pad or tap-to-move)
- Name tags above each Blipkin
- Interaction buttons: Wave, Bounce, Spin
- Emote buttons: ❤️ 😊 😢 😠 🤔 ✨

**Movement Logic:**
```typescript
const handleMove = async (direction: 'up' | 'down' | 'left' | 'right') => {
  const newX = direction === 'left' ? x - 1 : direction === 'right' ? x + 1 : x;
  const newY = direction === 'up' ? y - 1 : direction === 'down' ? y + 1 : y;

  // Clamp to grid bounds (0-9)
  const clampedX = Math.max(0, Math.min(9, newX));
  const clampedY = Math.max(0, Math.min(9, newY));

  await api.post('/api/blipnet/presence', {
    x: clampedX,
    y: clampedY,
    direction,
    action: 'walking'
  });

  // Refetch lobby state
  refetch();
};
```

#### 2. Shop Screen
**File to create:** `src/screens/ShopScreen.tsx`

**Features:**
- Display wallet (coins 🪙, gems 💎)
- Tabs: All | Food | Toys | Room | Boosts
- Grid of items with icon, name, price
- Tap item → shows details modal
- Buy with Coins or VoltGems (if available)
- Shows "Owned: X" for inventory items

#### 3. Room Screen
**File to create:** `src/screens/BlipkinRoomScreen.tsx`

**Features:**
- Shows 8x8 grid room
- Wallpaper background
- Floor tiles
- Placed furniture from `furniture[]`
- Edit mode: tap inventory item → tap grid to place
- Drag furniture to reposition
- Blipkin idles/sleeps in room

#### 4. Mini-Game Hub
**File to create:** `src/screens/MiniGameHubScreen.tsx`

**Features:**
- List of 5 mini-games with icons
- Tap to launch game
- Shows high score

#### 5. Fruit Catch Mini-Game
**File to create:** `src/minigames/FruitCatchGame.tsx`

**Mechanics:**
- 60 second timer
- Fruits fall from top (random X position)
- Blipkin at bottom, drag left/right to catch
- +10 points per fruit
- +50 for 5-catch combo
- Submit score on end

#### 6. Bubble Pop Mini-Game
**File to create:** `src/minigames/BubblePopGame.tsx`

**Mechanics:**
- 90 second timer
- Bubbles float up from bottom
- Tap bubble to pop (+5 points)
- Color combos = bonus
- Submit score on end

#### 7. Journal Screen
**File to create:** `src/screens/JournalScreen.tsx`

**Features:**
- Scrollable list of journal entries
- Shows date, mood tag, preview
- Tap to expand full entry
- "Generate Today's Entry" button

### Priority 2: Navigation

**File to update:** `src/navigation/RootNavigator.tsx`

Add new screens to navigation:
```typescript
<Tab.Screen name="BlipNetTab" component={BlipNetLobbyScreen} />
<Tab.Screen name="ShopTab" component={ShopScreen} />
<Tab.Screen name="RoomTab" component={BlipkinRoomScreen} />
<Tab.Screen name="GamesTab" component={MiniGameHubScreen} />
<Tab.Screen name="JournalTab" component={JournalScreen} />
```

---

## 🎨 UI Assets & Placeholders

For MVP, use emoji placeholders:

**Currency:**
- Coins: 🪙
- VoltGems: 💎

**Food:**
- Apple: 🍎
- Banana: 🍌
- Sushi: 🍣
- Pizza: 🍕

**Toys:**
- Ball: ⚽
- Puzzle: 🧩
- Dice: 🎲

**Room Items:**
- Bed: 🛏️
- Chair: 🪑
- Lamp: 💡
- Plant: 🪴
- Rug: 🟫

**Emotes:**
- Heart: ❤️
- Happy: 😊
- Sad: 😢
- Angry: 😠
- Confused: 🤔
- Sparkle: ✨

**Mini-Games:**
- Fruit: 🍎🍌🍇🍊
- Bubbles: 🫧💙💚💛💜
- Fish: 🐟🐠🐡

---

## 📊 Coin Economy

### Earning Coins
- Feed Blipkin: +10 coins
- Play with Blipkin: +15 coins
- Clean Blipkin: +8 coins
- Rest Blipkin: +5 coins
- Chat with Blipkin: +5 coins
- Mini-game completion: +50-200 coins (score-based)
- Daily login: +100 coins
- Evolution milestone: +500 coins

### Coin Prices
- Food: 50-200 coins
- Toys: 100-400 coins
- Room items: 150-600 coins
- Rare items: 1000+ coins

### VoltGems (Optional)
- Weekly challenge: +5 gems
- Evolution to Mega: +25 gems
- Rare event: +10 gems
- OR in-app purchase (NOT REQUIRED)

---

## 🌐 Real-Time Multiplayer (Phase 2)

**NOT IMPLEMENTED YET - Requires Firebase/Supabase**

Current offline system is **ready for real-time sync**:

### What Works Offline:
- BlipNet lobby (shows other Blipkins from DB)
- All shop/inventory/room features
- Mini-games
- Journal

### What Needs Real-Time (Future):
- **Live position updates** (currently polls `/api/blipnet/lobby`)
- **Real-time emotes** (currently HTTP POST)
- **Chat bubbles** (not implemented)
- **Presence detection** (currently based on `lastSeenAt`)

### How to Add Real-Time:

1. **Add Firebase:**
```bash
bun add firebase
```

2. **Replace HTTP polling with Firebase listeners:**
```typescript
// Instead of:
useQuery({ queryKey: ['lobby'], queryFn: () => api.get('/api/blipnet/lobby') })

// Use:
const lobbyRef = firebase.database().ref('blipnet/lobby');
lobbyRef.on('value', (snapshot) => {
  setBlipkins(snapshot.val());
});
```

3. **Sync database to Firebase on actions:**
```typescript
// After updating BlipnetPresence in SQLite:
await firebase.database().ref(`blipnet/lobby/${userId}`).set({
  x, y, direction, action, timestamp: Date.now()
});
```

---

## ✅ Integration with Existing Evolution System

The BlipNet system **extends** the existing Blipkin evolution without breaking anything:

### Coin Rewards from Existing Actions
Update existing `blipkin.ts` routes to grant coins:

```typescript
// In /api/blipkin/feed
await db.currencyWallet.upsert({
  where: { userId },
  update: { coins: { increment: 10 } },
  create: { userId, coins: 10, voltGems: 0 }
});

// Same for play (+15), clean (+8), rest (+5)
```

### Mini-Game XP Awards Blipkin
```typescript
// In /api/minigames/result
const xpEarned = Math.floor(score / 10);
const blipkin = await db.blipkin.findUnique({ where: { userId } });

// Use existing evolution utilities
const levelUpResult = calculateLevelUp(blipkin.level, blipkin.xp + xpEarned);

await db.blipkin.update({
  where: { userId },
  data: {
    xp: levelUpResult.remainingXP,
    level: levelUpResult.newLevel
  }
});
```

### Personality Affects Evolution
```typescript
// When checking for mega form evolution
import { computePersonalityProfile } from './utils/personality';

const personality = computePersonalityProfile(blipkin);

// Use personality.coreTrait to influence mega form
// (Already done in evolution.ts mega form calculation)
```

---

## 🧪 Testing Checklist

Once routes and screens are built:

### Backend
- [ ] Create user → auto-creates CurrencyWallet with 0 coins
- [ ] Create Blipkin → auto-creates BlipnetPresence at (5, 5)
- [ ] Create Blipkin → auto-creates BlipkinRoom with default wallpaper
- [ ] Seed shop items
- [ ] Buy item with coins → deducts from wallet, adds to inventory
- [ ] Submit mini-game result → grants coins + XP
- [ ] Generate journal entry

### Frontend
- [ ] BlipNet lobby shows my Blipkin
- [ ] Can move Blipkin with d-pad
- [ ] Can see other Blipkins (seed some test presences)
- [ ] Can send emote
- [ ] Shop shows items and wallet
- [ ] Can purchase item
- [ ] Room shows furniture
- [ ] Can place furniture
- [ ] Can play Fruit Catch mini-game
- [ ] Can play Bubble Pop mini-game
- [ ] Can view journal entries

---

## 📝 Next Steps

1. **Build backend routes** (blipnet, shop, room, minigames, journal, events, wallet)
2. **Seed shop items**
3. **Build frontend screens** (lobby, shop, room, games hub, journal)
4. **Build 2 mini-games** (Fruit Catch, Bubble Pop)
5. **Test integration** with existing evolution system
6. **Add coin rewards** to existing Blipkin actions
7. **Document** real-time multiplayer requirements for Phase 2

---

## 🚀 Deployment Notes

**Current Status:** Offline-first foundation ready
**Database:** SQLite with all tables created
**Backend:** Hono + Prisma (no external dependencies)
**Frontend:** React Native + Expo (no Firebase yet)

**For Real-Time Multiplayer:**
- Requires Firebase or Supabase setup
- Requires Vibecode platform integration
- Est. 1-2 weeks additional development

---

**Last Updated:** December 6, 2025
**Built By:** Claude (Sonnet 4.5)
