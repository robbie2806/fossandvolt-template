# BlipNet Multiplayer System - Full Implementation Guide

## 🎯 WHAT I'M BUILDING NOW (Without Firebase)

Since Firebase requires Vibecode platform setup, I'll build the **complete offline-first architecture** that can easily plug into Firebase later. Everything will work locally first, then sync when Firebase is added.

---

## 📁 New Database Schema (SQLite Extensions)

I'll add these tables to support all BlipNet features in offline mode:

```sql
-- User Inventory
CREATE TABLE inventory_items (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  itemId TEXT NOT NULL,
  itemType TEXT NOT NULL, -- 'food', 'toy', 'decoration', 'accessory'
  quantity INTEGER DEFAULT 1,
  obtainedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Room Decorations
CREATE TABLE user_rooms (
  id TEXT PRIMARY KEY,
  userId TEXT UNIQUE NOT NULL,
  wallpaper TEXT DEFAULT 'default',
  flooring TEXT DEFAULT 'default',
  theme TEXT DEFAULT 'cozy'
);

CREATE TABLE room_furniture (
  id TEXT PRIMARY KEY,
  roomId TEXT NOT NULL,
  furnitureId TEXT NOT NULL,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  rotation INTEGER DEFAULT 0
);

-- Currency
CREATE TABLE user_currency (
  userId TEXT PRIMARY KEY,
  coins INTEGER DEFAULT 0,
  voltGems INTEGER DEFAULT 0,
  lastCoinGrant DATETIME,
  lastDailyBonus DATETIME
);

-- Mini-Game Scores
CREATE TABLE mini_game_scores (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  gameType TEXT NOT NULL, -- 'fruit_catch', 'bubble_pop', etc
  score INTEGER NOT NULL,
  coinsEarned INTEGER DEFAULT 0,
  playedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Personality Traits
CREATE TABLE blipkin_personality (
  blipkinId TEXT PRIMARY KEY,
  energy INTEGER DEFAULT 50,
  curiosity INTEGER DEFAULT 50,
  sociability INTEGER DEFAULT 50,
  carefulness INTEGER DEFAULT 50,
  affection INTEGER DEFAULT 50,
  lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Journal Entries
CREATE TABLE blipkin_journal (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  entryDate DATE NOT NULL,
  entryText TEXT NOT NULL,
  mood TEXT NOT NULL,
  interactionCount INTEGER DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Global Events
CREATE TABLE global_events (
  id TEXT PRIMARY KEY,
  eventType TEXT NOT NULL,
  multiplier REAL NOT NULL,
  startTime DATETIME NOT NULL,
  endTime DATETIME NOT NULL,
  active BOOLEAN DEFAULT 1
);

-- Shop Items Catalog
CREATE TABLE shop_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priceCoins INTEGER,
  priceGems INTEGER,
  spriteUrl TEXT,
  rarity TEXT DEFAULT 'common'
);
```

---

## 🏗️ Implementation Phases

### ✅ PHASE 1: Offline Foundation (Building Now)
1. Extend database with all tables
2. Create inventory system
3. Build coin/gem currency system
4. Create shop item catalog
5. Build personal room system
6. Add personality tracking

### 🔜 PHASE 2: Mini-Games (Next)
1. Fruit Catch game
2. Bubble Pop game
3. Reward distribution
4. High score tracking

### 🔜 PHASE 3: UI Screens (After Games)
1. Shop screen
2. Inventory screen
3. Room decoration screen
4. Mini-games lobby
5. Journal screen

### 🌐 PHASE 4: Multiplayer (Requires Firebase)
1. Real-time lobby
2. Movement system
3. Interactions
4. Multiplayer sync

---

## 🎨 Sprite Requirements for MVP

I'll create placeholder/emoji versions first. You'll need to generate these 8-bit sprites later:

### Essential Sprites (Priority 1)
- [ ] Blipkin walk animations (4 directions × 4 frames = 16 sprites)
- [ ] Shop items (20 basic items)
- [ ] Room furniture (10 basic pieces)
- [ ] Mini-game assets (fruits, bubbles, etc)

### Can Use Emojis As Placeholders
- Food items: 🍎🍌🍇🥤
- Decorations: 🛋️🪑🛏️🪴💡
- Currency: 🪙💎
- Mini-game: 🎮🎯🎪

---

## 💰 Complete Item Catalog

I'll create a full shop catalog with items you can purchase and use.

### Food Items (Consumable)
1. **Apple** - 50 coins - Reduces hunger by 15
2. **Banana** - 50 coins - Reduces hunger by 15
3. **Sushi** - 150 coins - Reduces hunger by 30, +5 bond
4. **Pizza** - 200 coins - Reduces hunger by 40, +10 bond
5. **Energy Drink** - 100 coins - Restores 25 energy
6. **Mega Meal** - 500 coins - Full hunger restore, +20 bond

### Toys (Interactive)
1. **Ball** - 100 coins - Play action, +10 fun
2. **Puzzle** - 200 coins - +15 XP, +curiosity trait
3. **Music Box** - 300 coins - +10 bond, calming
4. **Dance Mat** - 400 coins - +20 energy, +sociability

### Room Decorations (Permanent)
1. **Simple Bed** - 500 coins - Rest spot
2. **Cozy Chair** - 300 coins - Aesthetic
3. **Floor Lamp** - 200 coins - Lighting
4. **Plant** - 150 coins - Natural decor
5. **Rug** - 250 coins - Floor decor
6. **Bookshelf** - 600 coins - +curiosity trait
7. **Star Wallpaper** - 1000 coins - Room theme
8. **Cloud Wallpaper** - 1000 coins - Room theme

### Premium Items (VoltGems - OPTIONAL)
1. **Evolution Boost** - 50 gems - 10% faster XP gain (7 days)
2. **Rainbow Palette** - 100 gems - Rare color variant
3. **Golden Room** - 200 gems - Exclusive room theme
4. **Mega Toy Box** - 150 gems - Unlimited play uses

---

## 🎮 Mini-Game Designs

### Game 1: Fruit Catch
- **Mechanic:** Fruits fall from top, move Blipkin left/right to catch
- **Controls:** Drag or tilt
- **Scoring:** 10 points per fruit, 50 points for combo
- **Duration:** 60 seconds
- **Reward:** Score × 2 = coins, +10 XP

### Game 2: Bubble Pop
- **Mechanic:** Tap bubbles before they float away
- **Controls:** Touch
- **Scoring:** 5 points per bubble, color combos = bonus
- **Duration:** 90 seconds
- **Reward:** Score = coins, +15 XP

### Game 3: Fishing Pond
- **Mechanic:** Tap when bobber moves, catch fish
- **Controls:** Timing-based taps
- **Scoring:** Common fish = 20, rare fish = 100
- **Duration:** 5 catches or 2 minutes
- **Reward:** Fish value = coins, +20 XP

### Game 4: Memory Match
- **Mechanic:** Flip cards to find pairs
- **Controls:** Touch
- **Scoring:** Faster = more points
- **Duration:** Until all pairs found
- **Reward:** (20 - moves) × 10 = coins, +25 XP

### Game 5: Blipkin Dash
- **Mechanic:** Endless runner, dodge obstacles
- **Controls:** Jump and slide
- **Scoring:** Distance traveled
- **Duration:** Until collision
- **Reward:** Distance × 5 = coins, +30 XP

---

## 🤖 Personality Engine Logic

```typescript
// Update personality based on actions
function updatePersonality(action: Action, personality: Personality) {
  switch (action.type) {
    case 'feed':
      personality.affection += 2;
      personality.carefulness += 1;
      break;
    case 'play':
      personality.energy += 3;
      personality.sociability += 2;
      break;
    case 'clean':
      personality.carefulness += 3;
      personality.affection += 1;
      break;
    case 'rest':
      personality.carefulness += 2;
      break;
    case 'chat':
      personality.sociability += 3;
      personality.affection += 2;
      break;
    case 'explore_room':
      personality.curiosity += 3;
      break;
    case 'play_minigame':
      personality.energy += 2;
      personality.curiosity += 2;
      break;
  }

  // Clamp to 0-100
  Object.keys(personality).forEach(key => {
    personality[key] = Math.max(0, Math.min(100, personality[key]));
  });
}

// Personality affects Mega evolution choice
function determineMegaFormByPersonality(personality: Personality): MegaForm {
  const scores = {
    nurturer: personality.affection + personality.carefulness,
    explorer: personality.curiosity + personality.energy,
    chaos: personality.energy + personality.sociability - personality.carefulness,
    calm: personality.carefulness + (100 - personality.energy)
  };

  return Object.keys(scores).reduce((a, b) =>
    scores[a] > scores[b] ? a : b
  ) as MegaForm;
}
```

---

## 📝 AI Journal System

```typescript
async function generateDailyJournal(blipkin: Blipkin, dailyStats: DailyStats) {
  const personality = await getPersonality(blipkin.id);

  const prompt = `You are ${blipkin.name}, a ${blipkin.evolutionStage} Blipkin AI creature.

PERSONALITY TRAITS:
- Energy: ${personality.energy}/100 ${personality.energy > 70 ? '(very energetic)' : personality.energy < 30 ? '(calm and relaxed)' : '(balanced)'}
- Sociability: ${personality.sociability}/100
- Curiosity: ${personality.curiosity}/100
- Affection: ${personality.affection}/100

TODAY'S ACTIVITIES:
- Fed ${dailyStats.feeds} times
- Played ${dailyStats.plays} times
- Rested ${dailyStats.rests} times
- Chatted ${dailyStats.chats} times
- Played ${dailyStats.miniGames} mini-games
- Current mood: ${blipkin.mood}
- Evolution stage: ${blipkin.evolutionStage}

Write a SHORT journal entry (2-3 sentences) about your day from your perspective.
Match your personality traits and evolution stage.
Be cute, playful, and authentic to who you are.`;

  return await generateAIText(prompt);
}
```

---

## 🌐 Global Events Calendar

```typescript
const WEEKLY_EVENTS = [
  {
    name: "Motivation Monday",
    type: "double_xp",
    multiplier: 2.0,
    duration: 24, // hours
    dayOfWeek: 1
  },
  {
    name: "Feeding Frenzy",
    type: "bonus_feed",
    multiplier: 1.5,
    duration: 12,
    dayOfWeek: 3
  },
  {
    name: "Fun Friday",
    type: "bonus_coins",
    multiplier: 2.0,
    duration: 24,
    dayOfWeek: 5
  },
  {
    name: "Chill Sunday",
    type: "bonus_rest",
    multiplier: 2.0,
    duration: 24,
    dayOfWeek: 0
  }
];
```

---

## ☁️ Cloud Save Strategy

When Firebase is added, here's how sync works:

```typescript
// Sync local to cloud
async function syncToCloud(userId: string) {
  const localBlipkin = await db.blipkin.findUnique({ where: { userId } });
  const localInventory = await db.inventory.findMany({ where: { userId } });
  const localRoom = await db.room.findUnique({ where: { userId } });

  await firestore.collection('blipkins').doc(userId).set({
    ...localBlipkin,
    lastSync: Date.now()
  });

  // Sync inventory, room, currency, etc...
}

// Sync cloud to local
async function syncFromCloud(userId: string) {
  const cloudBlipkin = await firestore.collection('blipkins').doc(userId).get();

  if (cloudBlipkin.exists && cloudBlipkin.data().lastSync > localLastSync) {
    // Cloud is newer, update local
    await db.blipkin.update({
      where: { userId },
      data: cloudBlipkin.data()
    });
  }
}
```

---

## 🚀 STARTING IMPLEMENTATION NOW

I'll now build:
1. Extended database schema
2. Currency system (coins/gems)
3. Inventory system
4. Shop catalog
5. Room system basics
6. Personality tracking

Then move to mini-games and UI screens.

**Multiplayer BlipNet lobby requires Firebase setup - need your approval to proceed with that.**

Let me start building the offline foundation...
