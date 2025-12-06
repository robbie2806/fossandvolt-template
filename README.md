# PixieVolt AI - Your Personal AI Companion

PixieVolt AI (formerly BondNode) is a Tamagotchi-style AI companion app that grows with you through daily interactions, check-ins, and meaningful conversations. Build your bond level, care for your Blipkin pet, set goals, and enjoy a personalized AI experience designed for fun, motivation, and life organization.

## What is PixieVolt AI?

PixieVolt AI is **NOT** a therapist, doctor, or medical service. It's a fun, supportive companion for:
- Daily motivation and habit tracking
- Reflective conversations
- Goal setting and organization
- Entertainment and personal growth

If you're in crisis or need professional help, please contact emergency services or a qualified professional.

## Features

### ✨ PixieVolt AI - Blipkin Pet System
- Name and care for your own digital companion called a Blipkin
- **Feed** your Blipkin to reduce hunger and increase bond
- **Play** with your Blipkin to earn XP and strengthen your connection
- **Chat** with your Blipkin in a special chat mode with unique personality
- Watch your Blipkin level up from 1 to ∞ through interactions
- Monitor Blipkin stats: Level, XP, Mood, Energy, Hunger, and Bond
- Mood system that responds to your Blipkin&apos;s needs (Happy, Sleepy, Hungry, Joyful, etc.)
- Miss-you notifications when you haven&apos;t visited in 24+ hours

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
- `GET /api/blipkin` - Get user's Blipkin
- `POST /api/blipkin` - Create Blipkin (onboarding)
- `PUT /api/blipkin` - Update Blipkin name
- `POST /api/blipkin/feed` - Feed Blipkin action
- `POST /api/blipkin/play` - Play with Blipkin action

### Companion
- `GET /api/companion` - Get user's AI companion
- `POST /api/companion` - Create AI companion (onboarding)
- `PUT /api/companion` - Update companion name or vibe

### Chat
- `GET /api/chat` - Get chat history (last 100 messages)
- `POST /api/chat` - Send message and get AI response (supports `mode: "companion"` or `mode: "blipkin"`)

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
- **Feed Action**: +5 XP, +3 Bond
- **Play Action**: +8 XP, +5 Bond
- **Chat with Blipkin**: +3 XP, +2 Bond per message

**Level Formula**: Level N requires N × 100 XP to reach Level N+1
- XP resets after leveling up
- Bond ranges from 0-100
- Mood changes based on Hunger, Energy, and Bond levels

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

## Recent Changes

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
