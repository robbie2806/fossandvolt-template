# Railway Quick Start

## Current Status
✅ Railway deployment configured
✅ PostgreSQL support added
✅ Build scripts ready
✅ Migration files created
✅ Environment variables configured

## What You Need to Do

### 1. Push to GitHub
```bash
git add .
git commit -m "Configure Railway production deployment"
git push origin main
```

### 2. Deploy on Railway
1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select your repo
4. Add PostgreSQL database (+ New → Database → PostgreSQL)

### 3. Set Environment Variables
In Railway Variables tab:
```
NODE_ENV=production
PORT=3000
BETTER_AUTH_SECRET=vVluXQeh2SX7OuvZr3soq6afdjhiz7l4
BACKEND_URL=${{RAILWAY_PUBLIC_DOMAIN}}
OPENAI_BASE_URL=https://api.openai.com.proxy.vibecodeapp.com/v1
CODEX_API_KEY=your_key_here
```

### 4. Generate Public Domain
Settings → Networking → Generate Domain

### 5. Update Vibecode ENV
In Vibecode app ENV tab:
```
EXPO_PUBLIC_VIBECODE_BACKEND_URL=https://your-railway-domain.up.railway.app
```

### 6. Rebuild TestFlight
Submit new build with production URL

## Files Created
- ✅ `railway.json` - Railway config
- ✅ `nixpacks.toml` - Build config
- ✅ `.railwayignore` - Ignore rules
- ✅ `backend/prisma/schema.production.prisma` - PostgreSQL schema
- ✅ `backend/prisma/migrations/production_init/` - Initial migration
- ✅ `RAILWAY_SETUP.md` - Full documentation

## Test Deployment
```bash
curl https://your-domain.up.railway.app/health
```

Should return: `{"status":"ok"}`

---

**Full documentation:** See `RAILWAY_SETUP.md`
