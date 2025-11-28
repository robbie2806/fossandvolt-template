# BondNode - Your Personal AI Companion

BondNode is a Tamagotchi-style AI companion app that grows with you through daily interactions, check-ins, and meaningful conversations. Build your bond level, set goals, and enjoy a personalized AI experience designed for fun, motivation, and life organization.

## What is BondNode?

BondNode is **NOT** a therapist, doctor, or medical service. It's a fun, supportive companion for:
- Daily motivation and habit tracking
- Reflective conversations
- Goal setting and organization
- Entertainment and personal growth

If you're in crisis or need professional help, please contact emergency services or a qualified professional.

## Features

### 🤖 Personalized AI Companion
- Name your AI companion during onboarding
- Your AI has a chill and supportive personality by default
- Your AI remembers your conversations and adapts to your style
- Watch your Bond Level grow from 1 to 100+ through interactions

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
- Toggle AI memory on/off
- Set daily check-in reminders
- View your bond progress and history

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

### Companion
- `GET /api/companion` - Get user's AI companion
- `POST /api/companion` - Create AI companion (onboarding)
- `PUT /api/companion` - Update companion name or vibe

### Chat
- `GET /api/chat` - Get chat history (last 100 messages)
- `POST /api/chat` - Send message and get AI response

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
├── Tabs
│   ├── ChatTab (Chat screen)
│   ├── BondTab (Bond screen)
│   └── SettingsTab (Settings screen)
└── LoginModalScreen (modal)
```

## XP & Leveling System

- **Chat Message**: +2 XP
- **Daily Check-in**: +20 XP
- **Gratitude Note**: +10 XP
- **Mini Goal**: +10 XP

**Level Formula**: Level N requires N × 100 XP to reach Level N+1
- Level 1 → 2: 100 XP
- Level 2 → 3: 200 XP
- Level 3 → 4: 300 XP
- etc.

## AI Personality

### Chill & Supportive (Default)
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
