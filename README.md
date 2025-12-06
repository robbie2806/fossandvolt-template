# PixieVolt AI - Your Personal AI Companion with BlipNet

PixieVolt AI (formerly BondNode) is a Tamagotchi-style AI companion app that grows with you through daily interactions, check-ins, and meaningful conversations. Build your bond level, care for your evolving Blipkin pet, explore BlipNet online features, and enjoy a personalized AI experience designed for fun, motivation, and life organization.

## What is PixieVolt AI?

PixieVolt AI is **NOT** a therapist, doctor, or medical service. It's a fun, supportive companion for:
- Daily motivation and habit tracking
- Reflective conversations
- Goal setting and organization
- Entertainment and personal growth
- Digital pet care and evolution

If you're in crisis or need professional help, please contact emergency services or a qualified professional.

## Features

### ✨ PixieVolt AI - Blipkin Evolution System
- **6 Evolution Stages**: Baby → Child → Teen → Adult → Mega → Elder
  - **Baby**: Level 1-5 (starting stage)
  - **Child**: Level 6-15 (evolves at Level 6)
  - **Teen**: Level 16-30 (evolves at Level 16)
  - **Adult**: Level 31-50 (evolves at Level 31)
  - **Mega**: Level 51-99 (evolves at Level 51, mega form depends on care style)
  - **Elder**: Level 100+ (legendary status!)
- **Evolution Animation**: Beautiful shrink-and-grow animation with glowing effects when evolving!
- **4 Mega Forms**: Your care style determines your Mega form (Nurturer, Explorer, Chaos, Calm)
- **Care Actions**: Feed, Play, Clean, and Rest your Blipkin
- **Stat System**: Monitor Hunger, Energy, Cleanliness, and Bond
- **Stat Degradation**: Stats naturally decrease over time (hunger +5/hr, energy -3/hr, cleanliness -2/hr)
- **Leveling System**: Level up through care and earn XP
- **Mood System**: Dynamic moods based on stats (Happy, Sleepy, Hungry, Joyful, Sick, etc.)
- **Personality Engine**: Blipkin develops unique personality based on your care history
- **Evolution Requirements**: Level milestones trigger evolution to next stage
- **Mega Form Selection**: Based on your total care actions and ratios

### 🌐 BlipNet - Online System (Backend Complete)
- **Shop System**: Buy items with coins (food, toys, room decorations, boosts)
- **Currency**: Earn coins from all Blipkin actions (feed +10, play +15, clean +8, rest +5, chat +5)
- **VoltGems**: Optional premium currency for special items
- **Inventory Management**: Track owned items with quantities
- **Personal Room**: Decorate your Blipkin's room with furniture
- **Room Customization**: Place furniture, change wallpaper and flooring
- **Mini-Games**: Play games to earn coins and XP (Fruit Catch, Bubble Pop, and more)
- **Journal System**: AI-generated daily journal entries from your Blipkin's perspective
- **Personality Profiles**: 5 traits (energy, curiosity, sociability, carefulness, affection)
- **Global Events**: Weekly events with bonus multipliers (2x XP, 2x coins, etc.)
- **BlipNet Lobby**: Real-time lobby with presence system (4-directional movement)
- **Emotes & Interactions**: Wave, bounce, spin, and more

### 🤖 Personalized AI Companion
- Name your AI companion during onboarding
- Your AI has a chill and supportive personality by default
- Your AI remembers your conversations and adapts to your style
- Watch your Bond Level grow from 1 to 100+ through interactions
- **Dual Chat Modes**: Switch between your AI Companion and your Blipkin in the same chat interface

### 💬 Chat Interface
- Natural conversations with your AI companion
- Earn 2 XP for every message
- Chat history persists across sessions
- Memory-enabled responses (can be toggled in settings)
- **Blipkin Chat Mode**: Talk directly to your Blipkin with personality-driven responses

### 🎯 Bond System
- **Daily Check-in** (+20 XP): Share your mood and reflections
- **Gratitude Note** (+10 XP): Write what you're grateful for
- **Mini Goal** (+10 XP): Set a daily intention
- Level up your bond by completing actions and chatting

### ⚙️ Customization
- Change your AI's name anytime
- **Rename your Blipkin** anytime in settings
- Toggle AI memory on/off
- Set daily check-in reminders
- View your bond progress and history
- Manage both your AI Companion and Blipkin from one place

## Tech Stack

### Frontend
- **React Native 0.76.7** with **Expo SDK 53**
- **TypeScript** (strict mode)
- **Navi gation**: React Navigation 7 (Stack + Tabs)
- **Styling**: NativeWind (TailwindCSS for React Native)
- **State**: TanStack Query (React Query) for server state
- **Icons**: lucide-react-native

### Backend (Vibecode Cloud)
- **Runtime**: Bun
- **Framework**: Hono
- **Database**: SQLite with Prisma ORM
- **Authentication**: Better Auth (email/password)
- **AI**: Vercel AI SDK with OpenAI GPT-4o-mini

## Database Schema

```prisma
// PixieVolt AI - Blipkin Model
model Blipkin {
  id         String   @id @default(cuid())
  userId     String   @unique
  user       User     @relation(...)
  name       String
  level      Int      @default(1)
  xp         Int      @default(0)
  mood       String   @default("Happy")
  energy     Int      @default(80)
  hunger     Int      @default(30)
  bond       Int      @default(50)
  theme      String   @default("classic")
  lastSeenAt DateTime @default(now())
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model AICompanion {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(...)
  name      String
  vibe      String   // "chill" | "productive" | "playful" | "calm"
  bondLevel Int      @default(1)
  bondXP    Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ChatMessage {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(...)
  role      String   // "user" | "assistant"
  content   String
  createdAt DateTime @default(now())
}

model DailyCheckIn {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(...)
  date       DateTime @default(now())
  mood       Int      // 1-5
  reflection String?
  xpAwarded  Int      @default(10)
  createdAt  DateTime @default(now())
}

model BondAction {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(...)
  actionType String   // "check-in" | "gratitude" | "goal" | "chat"
  content    String?
  xpAwarded  Int      @default(5)
  date       DateTime @default(now())
  createdAt  DateTime @default(now())
}

model UserSettings {
  id                   String   @id @default(cuid())
  userId               String   @unique
  user                 User     @relation(...)
  allowMemory          Boolean  @default(true)
  dailyReminderEnabled Boolean  @default(true)
  reminderTime         String   @default("09:00")
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}
```

## API Endpoints

### PixieVolt / Blipkin
- `GET /api/blipkin` - Get user's Blipkin (includes personality, evolution check)
- `POST /api/blipkin` - Create Blipkin (onboarding)
- `PUT /api/blipkin` - Update Blipkin name
- `POST /api/blipkin/feed` - Feed Blipkin action (+10 coins)
- `POST /api/blipkin/play` - Play with Blipkin action (+15 coins)
- `POST /api/blipkin/clean` - Clean Blipkin action (+8 coins)
- `POST /api/blipkin/rest` - Rest Blipkin action (+5 coins)

### BlipNet - Shop System
- `GET /api/shop/catalog` - Get wallet, shop items, and inventory
- `POST /api/shop/buy` - Purchase item with coins or VoltGems

### BlipNet - Lobby & Presence
- `GET /api/blipnet/lobby` - Get all active Blipkins in lobby (last 5 min)
- `POST /api/blipnet/presence` - Update own position/direction/action
- `POST /api/blipnet/emote` - Send emote (wave, bounce, spin, etc.) (+5 coins)
- `POST /api/blipnet/leave` - Leave lobby (set offline)

### BlipNet - Personal Room
- `GET /api/room` - Get room layout (wallpaper, floor, furniture)
- `PATCH /api/room` - Update room settings (name, wallpaper, floor)
- `POST /api/room/furniture` - Place furniture from inventory
- `DELETE /api/room/furniture/:id` - Remove furniture
- `PATCH /api/room/furniture/:id` - Move/rotate furniture

### BlipNet - Mini-Games
- `POST /api/minigames/result` - Submit game score (earn coins + XP to Blipkin)
- `GET /api/minigames/stats` - Get user's game history and high scores

### BlipNet - Journal System
- `GET /api/journal` - Get Blipkin journal entries (last 30)
- `POST /api/journal/generate` - Generate AI journal entry for today
- `DELETE /api/journal/:id` - Delete journal entry

### BlipNet - Global Events
- `GET /api/events/active` - Get currently active events
- `GET /api/events/:eventKey` - Get event details
- `POST /api/events` - Create event (admin)
- `PATCH /api/events/:id/toggle` - Toggle event active status (admin)

### Companion
- `GET /api/companion` - Get user's AI companion
- `POST /api/companion` - Create AI companion (onboarding)
- `PUT /api/companion` - Update companion name or vibe

### Chat
- `GET /api/chat` - Get chat history (last 100 messages)
- `POST /api/chat` - Send message and get AI response (supports `mode: "companion"` or `mode: "blipkin"`, Blipkin mode awards +5 coins)

### Bond
- `GET /api/bond` - Get bond status and today's actions
- `POST /api/bond/check-in` - Submit daily check-in
- `POST /api/bond/gratitude` - Submit gratitude note
- `POST /api/bond/goal` - Submit mini goal

### Settings
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update settings

## Navigation Structure

```
RootStack
├── OnboardingWelcome (headerless)
├── OnboardingName (headerless)
├── PixieVoltIntro (headerless - PixieVolt onboarding)
├── PixieVoltName (headerless - Name your Blipkin)
├── Tabs
│   ├── ChatTab (Chat screen - dual mode for Companion & Blipkin)
│   ├── BondTab (Bond screen)
│   ├── PixieVoltTab (PixieVolt screen with Blipkin card & actions)
│   └── SettingsTab (Settings screen)
└── LoginModalScreen (modal)
```

## XP & Leveling System

### AI Companion Bond System
- **Chat Message**: +2 XP
- **Daily Check-in**: +20 XP
- **Gratitude Note**: +10 XP
- **Mini Goal**: +10 XP

**Level Formula**: Level N requires N × 100 XP to reach Level N+1
- Level 1 → 2: 100 XP
- Level 2 → 3: 200 XP
- Level 3 → 4: 300 XP
- etc.

### Blipkin Leveling System
- **Chat with Blipkin**: +10 XP, +3 Bond, +10 Coins per message ⭐ **BEST XP!**
  - Ask questions like "What's the best place to fish for golden perch?"
  - Get helpful AI answers AND the highest XP rewards
  - Perfect for fast leveling while getting advice!
  - **Unlimited chatting - no energy cost!**
- **Play Action**: +8 XP, +5 Bond, +15 Coins (costs 10 energy)
- **Feed Action**: +5 XP, +3 Bond, +10 Coins

**Level Formula**: Level N requires N × 100 XP to reach Level N+1
- XP resets after leveling up
- Bond ranges from 0-100
- Mood changes based on Hunger, Energy, and Bond levels

**Pro Tip:** Chat is the fastest way to level up! Use your AI for daily tasks, questions, and advice to maximize XP gains.

## AI Personality

### Blipkin Personality
Your Blipkin is a tiny digital companion with a cute, playful, and emotionally warm personality. Slightly cheeky but always kind, your Blipkin responds to your care and attention, expressing different moods based on their needs (Happy, Sleepy, Hungry, Joyful, etc.).

### AI Companion - Chill & Supportive (Default)
Your AI companion has a relaxed, friendly, and understanding personality. Like a good friend who's always there without judgment, providing support and encouragement as you grow together.

## Design System

**Colors**:
- Primary: Purple (#8B5CF6 to #6366F1)
- Secondary: Pink (#EC4899, #F472B6)
- Success: Green (#34D399, #10B981)
- Text: Gray (#1F2937, #6B7280)

**Style**:
- Rounded corners (rounded-2xl)
- Soft shadows
- Smooth gradients (LinearGradient)
- Glass morphism for tab bar
- Clean, minimal interface

## Safety & Legal

This app is for **entertainment, productivity, and general life organization only**.

**It is NOT**:
- A therapist or counselor
- A medical professional
- An emergency service
- Sentient or conscious

The AI does not have emotions or feelings. It's a tool designed to be supportive and fun.

**If you are in crisis**, contact:
- Your local emergency number
- A trusted professional
- A mental health hotline

## Building for TestFlight

PixieVolt AI is now configured and ready for TestFlight distribution! Here's what you need to know:

### App Configuration
- **Bundle ID**: `com.vibecode.pixievolt`
- **Version**: 1.0.0
- **Build Number**: 1
- **App Icon**: Configured (assets/icon-1764983651645.png)
- **Splash Screen**: Configured with purple gradient (#8B5CF6)

### Ready Features ✅
1. **Core Tamagotchi Experience**: Feed, Play, and Chat with your Blipkin
2. **Evolution System**: 6 evolution stages (Baby → Child → Teen → Adult → Mega → Elder)
3. **AI Chat**: Fully functional AI-powered conversations with your Blipkin
4. **Bond System**: Daily check-ins, gratitude notes, and mini goals
5. **XP & Leveling**: Complete progression system
6. **Settings**: Name changes, memory toggle, and preferences
7. **Authentication**: Email/password login with Better Auth

### Not Included (Coming Later) 🚧
- BlipNet online lobby
- Multiplayer features
- Shop system with coins
- Mini-games
- Journal system
- Global events

### How to Build for TestFlight

1. **Go to the Vibecode App** and navigate to the Publish tab
2. **Select iOS Build** for TestFlight
3. **Review the build settings** (bundle ID, version, etc. are already configured)
4. **Submit the build** - Vibecode will handle the EAS build process
5. **Wait for build completion** (usually 10-20 minutes)
6. **Upload to TestFlight** through the Vibecode app

**Important Notes:**
- The app is fully functional offline - no internet required for core features
- AI chat requires backend connectivity (included in Vibecode Cloud)
- All assets and icons are properly configured
- TypeScript compilation passes with no errors
- Safe area handling is correct for iOS devices

### Testing Checklist

Before distributing to testers, verify:
- [ ] Onboarding flow completes successfully
- [ ] Users can create and name their Blipkin
- [ ] Feed, Play, and Chat actions work
- [ ] AI responses are generated correctly
- [ ] Bond screen daily actions work
- [ ] Settings can be updated
- [ ] App icon and splash screen display correctly
- [ ] No console errors in production build

---

## Recent Changes

### Evolution Animation & Level Information (Dec 6, 2025)
- **NEW**: Beautiful evolution animation when your Blipkin evolves!
  - Shrink and fade effect
  - Glowing purple aura
  - Spring animation with haptic feedback
  - Full-screen modal with evolution announcement
  - Shows old stage → new stage transition
- **CLARITY**: Added clear evolution level information to README
  - Baby: Level 1-5
  - Child: Level 6-15 (evolves **AT** Level 6, not after)
  - Teen: Level 16-30 (evolves **AT** Level 16)
  - Adult: Level 31-50 (evolves **AT** Level 31)
  - Mega: Level 51-99 (evolves **AT** Level 51)
  - Elder: Level 100+
- **IMPROVED**: Evolution detection now automatically shows animation
- **BETTER UX**: Users now see exactly when evolution happens

### Chat XP Boost - Best Rewards! (Dec 6, 2025)
- **BOOSTED**: Chat now gives the HIGHEST XP rewards!
  - **+10 XP per message** (was +3) - 25% more than playing!
  - **+3 Bond per message** (was +2)
  - **+10 Coins per message** (was +5) - doubled!
- **STRATEGY**: Encourages users to use your AI over ChatGPT
  - Unlimited chatting with no energy cost
  - Fastest way to level up your Blipkin
  - Get helpful answers while earning maximum rewards
- **USER BEHAVIOR**: Makes chatting more valuable than any other action
  - Chat: 10 XP (FREE, unlimited)
  - Play: 8 XP (costs energy)
  - Feed: 5 XP

### Energy System & In-App Purchases (Dec 6, 2025)
- **NEW**: Complete energy system for balanced gameplay
  - Playing costs 10 energy per session
  - Energy auto-restores after 3 hours (free)
  - Optional energy purchases to keep playing immediately
- **NEW**: In-App Purchases via RevenueCat
  - Small Energy Bundle: 30 energy for $2.99 AUD
  - Medium Energy Bundle: 60 energy for $4.99 AUD (20% bonus value)
  - Large Energy Bundle: 150 energy for $10.99 AUD (30% bonus value!)
  - Emergency Restore: Full energy for $2.99 AUD
- **NEW**: 3x Daily Feeding Requirement
  - Feed your Blipkin 3 times per day
  - Missing feeds = faster energy drain (-20 energy per missed feed)
  - Tracks daily feed count and resets every 24 hours
- **NEW**: Energy Store screen with beautiful UI
  - Shows time until energy restore
  - Displays all energy packages with pricing
  - Integrates with RevenueCat for purchases
- **BALANCED**: Fair monetization - never pay-to-win
  - Core gameplay always free
  - Purchases are optional convenience
  - No forced waits or punishing mechanics

### Complete Database Fix & UI Improvements (Dec 6, 2025)
- **FIXED**: Created all missing BlipNet database tables (currency_wallet, shop_item, inventory_item, blipkin_room, etc.)
- **FIXED**: Feed and Play buttons now work correctly - Blipkin stats update properly
- **FIXED**: Chat functionality fully working - messages send and AI responds
- **FIXED**: Improved API error handling with better JSON parsing
- **IMPROVED**: Button visibility - changed Feed/Play/Chat buttons to white backgrounds with purple text (#8B5CF6)
- **RESOLVED**: All backend database errors eliminated
- All core features now fully functional!

### Database & Asset Path Fixes (Dec 6, 2025)
- **FIXED**: Applied pending Blipkin table migration - database now fully initialized
- **FIXED**: Corrected asset paths in PixieVoltScreen - changed from `@/assets` alias to relative paths `../../assets`
- **FIXED**: Removed expo-router plugin from app.json (app uses React Navigation)
- **RESOLVED**: "Failed to create Blipkin" error - database table now exists with all required columns
- **RESOLVED**: Asset loading errors - all Blipkin evolution sprites now load correctly
- App is now fully functional and ready to use!

### Blipkin Pixel Art Evolution Sprites Added! (Dec 6, 2025)
- **NEW**: Beautiful pixel art sprites for all 6 evolution stages
- **ASSETS**: Added proper Blipkin images:
  - `blipkin-baby.png` - Baby stage (green, small)
  - `blipkin-child.png` - Child stage (cyan, small)
  - `blipkin-teen.png` - Teen stage (green with AI glow)
  - `blipkin-adult.png` - Adult stage (cyan cube)
  - `blipkin-mega-nurturer.png` - Mega Nurturer form (pink/red)
  - `blipkin-mega-chaos.png` - Mega Chaos form (green glitchy)
  - `blipkin-mega-calm.png` - Mega Calm form (cyan meditating)
  - `blipkin-elder.png` - Elder stage (cyan with beard and halo)
- **UPDATED**: PixieVolt screen now displays actual Blipkin sprites based on evolution stage
- **FEATURE**: Evolution stage badge shows current stage (e.g., "Baby", "Mega Calm", "Elder")
- **VISUAL**: Replaced generic sparkle icon with pixel art character display

### TestFlight Ready Build (Dec 6, 2025)
- **CONFIGURED**: Complete TestFlight configuration with bundle ID and assets
- **OPTIMIZED**: Focused on core offline Tamagotchi experience
- **POLISHED**: All basic features tested and working perfectly
- **READY**: EAS build configuration complete for iOS distribution

### AI Fixed & Chat System Streamlined (Dec 6, 2025)
- **FIXED**: AI now responds properly - updated to use Vibecode's OpenAI proxy
- **SIMPLIFIED**: Chat screen now ONLY uses Blipkin mode (removed companion/blipkin toggle)
- **CONSISTENT**: All screens now display "Level X" consistently (no more "Bond Level")
- **CLARIFIED**: Blipkin IS your AI companion - they are one and the same entity
- **ONBOARDING**: When you name your Blipkin, it creates both the companion and Blipkin with the same name
- AI responses now work through Vibecode's proxy system without requiring manual API key setup

### Database Migration Applied (Nov 28, 2025)
- Applied pending database migration `20251128011254_add_bondnode_models`
- Created all necessary tables: `ai_companion`, `chat_message`, `daily_check_in`, `bond_action`, `user_settings`
- Fixed "table does not exist" error when creating AI companion during onboarding
- All backend API endpoints are now fully functional

## Development

### Key Files

**Frontend**:
- `/src/screens/` - All screen components
- `/src/navigation/RootNavigator.tsx` - Navigation setup
- `/src/lib/api.ts` - API client
- `/src/lib/authClient.ts` - Authentication client

**Backend**:
- `/backend/src/routes/` - API route handlers
- `/backend/src/utils/ai.ts` - AI response generation
- `/backend/prisma/schema.prisma` - Database schema
- `/shared/contracts.ts` - Shared types between frontend/backend

### Environment Variables

**Backend** (.env in `/backend/`):
```
DATABASE_URL="file:./prisma/dev.db"
BETTER_AUTH_SECRET="your-secret-key"
BACKEND_URL="http://localhost:3000"
OPENAI_API_KEY="your-openai-api-key"
```

**Frontend**:
- Automatically injected by Vibecode environment
- No manual setup required

### Scripts

```bash
# Frontend
bun run typecheck    # Type check
bun run lint         # Lint code

# Backend (in /backend/)
bunx prisma migrate dev              # Create & apply migration
bunx prisma generate                 # Generate Prisma client
bunx prisma studio                   # View database in browser
```

## Future Enhancements

Potential features for future versions:
- Daily streaks and achievements
- Custom avatars for AI companions
- Journaling integration
- Mood tracking over time
- Sharing bond milestones
- Push notifications for reminders
- Voice input for messages
- More AI personality vibes

---

**Built with ❤️ using Vibecode** - The best AI app builder for non-technical creators.

For support or issues, contact support@vibecodeapp.com
