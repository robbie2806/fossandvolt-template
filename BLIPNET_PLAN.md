# BlipNet Online System - Implementation Plan

## 🚨 CRITICAL DECISION REQUIRED

Building a full multiplayer online system requires choosing the right infrastructure. Here are the options:

### Option 1: Firebase Realtime Database + Firestore (RECOMMENDED)
**Pros:**
- Built-in real-time sync
- No WebSocket server management
- Cloud functions for game logic
- Authentication handled
- Scales automatically
- Perfect for React Native

**Cons:**
- Requires Firebase setup in Vibecode
- Additional service dependency
- Pricing at scale

### Option 2: Custom WebSocket Server (Complex)
**Pros:**
- Full control
- Can use existing backend

**Cons:**
- Need to manage connections
- Harder to scale
- More complex state management
- Requires deployment infrastructure

### Option 3: Supabase (Modern Alternative)
**Pros:**
- PostgreSQL + real-time
- Open source
- Good pricing
- Built-in auth

**Cons:**
- Another service to set up
- Less mobile-optimized than Firebase

## 🎯 RECOMMENDED APPROACH

**Use Firebase** for BlipNet multiplayer features because:
1. React Native has excellent Firebase support
2. Real-time database is perfect for live Blipkin positions
3. Cloud Firestore for persistent data (rooms, items, shop)
4. No server management needed
5. Built-in presence detection

---

## 📊 System Architecture

### Database Collections (Firebase Firestore)

```
/blipkins/{userId}
  - Current evolution, stats, personality
  - Online status, last seen
  - Position in BlipNet

/blipnet_lobby/
  /active_blipkins/{userId}
    - x, y position
    - animation state
    - direction
    - last_updated (for presence)

/rooms/{userId}
  - Room decoration data
  - Furniture positions
  - Wallpaper, floor
  - Visitors list

/inventory/{userId}
  /items/{itemId}
    - Item type, quantity
    - Obtained date

/shop/
  /items/{itemId}
    - Name, description, price
    - Currency type (coins/gems)
    - Category

/mini_games/
  /scores/{userId}/{gameType}
    - High score, plays, rewards

/events/
  /active/{eventId}
    - Event type, multiplier, duration

/journal/{userId}
  /entries/{date}
    - AI-generated journal entry
    - Mood, interactions, events
```

---

## 🎮 Feature Implementation Priority

### Phase 1: Foundation (MUST DO FIRST)
1. ✅ Set up Firebase in project
2. ✅ Cloud save sync (migrate existing SQLite data)
3. ✅ Real-time presence system
4. ✅ Basic BlipNet lobby (no movement yet)

### Phase 2: Core Multiplayer (Week 1)
1. BlipNet lobby with 4-directional movement
2. See other players' Blipkins in real-time
3. Name tags above each Blipkin
4. Basic idle/walk animations
5. Interaction system (wave, bounce)

### Phase 3: Items & Economy (Week 2)
1. Inventory system
2. Coin currency from actions
3. Basic item shop (5-10 items)
4. Item usage (feed, toys)

### Phase 4: Rooms & Customization (Week 2-3)
1. Personal room for each user
2. Room decoration placement
3. Invite friends to room
4. Blipkin idles in room when offline

### Phase 5: Mini-Games (Week 3-4)
1. Fruit Catch mini-game
2. Bubble Pop mini-game
3. Reward system (coins + XP)

### Phase 6: Advanced Features (Week 4+)
1. Personality engine
2. Global events system
3. AI journal generation
4. VoltGems premium currency
5. More mini-games

---

## 🔧 Technical Requirements

### Firebase Setup Needed
```bash
# Install Firebase
bun add firebase @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore @react-native-firebase/database

# Or use Firebase JS SDK (easier for Expo)
bun add firebase
```

### Backend Changes
- Keep existing SQLite for local offline mode
- Sync to Firebase when online
- Use Firebase as source of truth for multiplayer

### New Backend Routes
```
POST /api/blipnet/join - Join BlipNet lobby
POST /api/blipnet/leave - Leave lobby
POST /api/blipnet/move - Update position
POST /api/blipnet/interact - Send interaction
POST /api/shop/purchase - Buy item
POST /api/inventory/use - Use item
POST /api/room/decorate - Update room
POST /api/minigame/score - Submit game score
```

---

## 🎨 Asset Requirements (8-bit Pixel Art)

### Environment Sprites (64x64 tiles)
- [ ] Grass tile
- [ ] Stone path tile
- [ ] Flower decorations
- [ ] Trees
- [ ] Fountain
- [ ] Bench
- [ ] Sign post

### Blipkin Movement (32x32 per frame)
- [ ] Walk up (4 frames)
- [ ] Walk down (4 frames)
- [ ] Walk left (4 frames)
- [ ] Walk right (4 frames)

### Room Items (32x32 or 64x64)
- [ ] Bed
- [ ] Table
- [ ] Chair
- [ ] Lamp
- [ ] Rug
- [ ] Plant
- [ ] Toy box
- [ ] Food bowl

### Mini-Game Assets
- [ ] Fruits (apple, banana, orange)
- [ ] Bubbles (various colors)
- [ ] Fish (small, medium, large)
- [ ] Memory cards
- [ ] Runner obstacles

### UI Elements
- [ ] Coin icon
- [ ] VoltGem icon
- [ ] Shop button
- [ ] Inventory button
- [ ] Mini-game icons

---

## 💰 Economy Design

### Coin Sources (Free Currency)
- Feed Blipkin: +10 coins
- Play with Blipkin: +15 coins
- Mini-game completion: +50-200 coins
- Daily login: +100 coins
- Evolution milestone: +500 coins
- Interactions in BlipNet: +5 coins per interaction

### VoltGem Sources (Premium, Optional)
- In-app purchase (NOT REQUIRED)
- Weekly challenge completion: +5 gems
- Evolution to Mega/Elder: +25 gems
- Rare event participation: +10 gems

### Shop Items Pricing
**Food (Coins)**
- Basic snack: 50 coins
- Gourmet meal: 150 coins
- Energy drink: 100 coins

**Decorations (Coins)**
- Simple furniture: 200-500 coins
- Premium furniture: 1000-2000 coins
- Rare decorations: 3000+ coins

**Premium (VoltGems, OPTIONAL)**
- Evolution boost (10% faster): 50 gems
- Rare color palette: 100 gems
- Exclusive room theme: 150 gems

---

## 🌐 Real-Time Movement System

### Position Update Flow
```typescript
// Client side
const updatePosition = async (x: number, y: number, direction: string) => {
  await firebaseDatabase.ref(`blipnet_lobby/active_blipkins/${userId}`).update({
    x,
    y,
    direction,
    animation: 'walk',
    lastUpdated: Date.now()
  });
};

// Listen to other players
firebaseDatabase.ref('blipnet_lobby/active_blipkins').on('value', (snapshot) => {
  const players = snapshot.val();
  // Update UI with all player positions
});
```

---

## 🤖 Personality Engine

### Personality Traits (0-100 scale)
- **Energy:** Based on play frequency
- **Curiosity:** Based on exploration (room visits, mini-games)
- **Sociability:** Based on BlipNet interactions
- **Carefulness:** Based on cleanliness maintenance
- **Affection:** Based on feeding and chat frequency

### Personality Affects
1. **Dialogue:** High sociability = more talkative
2. **Animations:** High energy = more bouncy idles
3. **Evolution:** Personality influences mega form
4. **AI Responses:** Personality adjusts tone

---

## 📝 AI Journal Generation

### Journal Entry Prompt Template
```typescript
const generateJournalEntry = async (blipkin: Blipkin, interactions: Interaction[]) => {
  const prompt = `You are ${blipkin.name}, a ${blipkin.evolutionStage} Blipkin.

  Today you:
  - Were fed ${dailyFeeds} times
  - Played ${dailyPlays} times
  - Chatted with ${interactionCount} other Blipkins
  - Current mood: ${blipkin.mood}

  Write a short, cute journal entry (2-3 sentences) about your day from your perspective.
  Be playful and match your ${blipkin.evolutionStage} personality.`;

  return await generateAIText(prompt);
};
```

---

## 🎪 Global Events System

### Event Types
1. **Feeding Frenzy:** 2x XP from feeding (24 hours)
2. **Happiness Week:** 2x bond gain (7 days)
3. **Evolution Surge:** 50% less XP needed (48 hours)
4. **Blipkin Party:** Extra coins in BlipNet (6 hours)
5. **Double XP Weekend:** 2x XP from all actions (48 hours)

### Event Scheduling
```typescript
// Check active events
const activeEvents = await firestore.collection('events/active').get();
const eventMultipliers = {
  xp: 1,
  bond: 1,
  coins: 1
};

activeEvents.forEach(event => {
  if (event.type === 'double_xp') eventMultipliers.xp = 2;
  // Apply multipliers to rewards
});
```

---

## 🚀 IMMEDIATE NEXT STEPS

1. **DECISION:** Confirm Firebase as multiplayer backend
2. **SETUP:** Add Firebase to Vibecode project
3. **MIGRATE:** Create cloud sync for existing Blipkin data
4. **BUILD:** Basic BlipNet lobby (static, no movement)
5. **TEST:** See multiple Blipkins in same lobby

**WAITING FOR YOUR CONFIRMATION:**
Should I proceed with Firebase integration for the multiplayer system?
