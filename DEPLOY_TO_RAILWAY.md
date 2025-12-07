# 🚀 Deploy PixieVolt AI to Railway (PostgreSQL)

Your app is **100% ready** for Railway deployment with PostgreSQL. Everything is configured!

---

## ✅ What's Already Done

- ✅ PostgreSQL schema created (`schema.production.prisma`)
- ✅ Database migrations ready
- ✅ Railway configuration files (`railway.json`, `nixpacks.toml`)
- ✅ Production build scripts configured
- ✅ All dependencies installed

---

## 📋 Step-by-Step Deployment

### Step 1: Create Railway Account
1. Go to **https://railway.app**
2. Sign up with GitHub (free account)

### Step 2: Push Code to GitHub
Your code is currently on Vibecode's internal git. You need to push it to GitHub:

```bash
# Create a new repo on GitHub first (github.com/new)
# Then run these commands:

git remote add github https://github.com/YOUR_USERNAME/pixievolt-ai.git
git push github main
```

### Step 3: Create Railway Project
1. In Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your `pixievolt-ai` repository
4. Railway will detect the configuration automatically

### Step 4: Add PostgreSQL Database
1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway automatically creates a `DATABASE_URL` environment variable

### Step 5: Configure Environment Variables
Click your backend service → **"Variables"** tab → Add these:

```env
NODE_ENV=production
PORT=3000
BETTER_AUTH_SECRET=vVluXQeh2SX7OuvZr3soq6afdjhiz7l4
BACKEND_URL=${{RAILWAY_PUBLIC_DOMAIN}}
OPENAI_BASE_URL=https://api.openai.com.proxy.vibecodeapp.com/v1
CODEX_API_KEY=<your_codex_api_key>
```

**Note:** `DATABASE_URL` is automatically set by PostgreSQL service.

### Step 6: Generate Public Domain
1. Go to your service **"Settings"**
2. Scroll to **"Networking"** → **"Public Networking"**
3. Click **"Generate Domain"**
4. Copy the URL (e.g., `https://pixievolt-production.up.railway.app`)

### Step 7: Test Your Deployment
```bash
curl https://your-railway-url.up.railway.app/health
```

Should return: `{"status":"ok"}`

### Step 8: Update Vibecode ENV
In Vibecode app → **ENV tab**, update:
```env
EXPO_PUBLIC_VIBECODE_BACKEND_URL=https://your-railway-url.up.railway.app
```

Then rebuild your TestFlight app with the production URL.

---

## 🎯 What Happens During Deployment

1. **Build Phase:**
   - Copies PostgreSQL schema to replace SQLite
   - Installs dependencies with Bun
   - Builds TypeScript backend
   - Generates Prisma client
   - Runs database migrations automatically

2. **Deploy Phase:**
   - Starts backend server on port 3000
   - Auto-restarts on failure (max 10 retries)
   - PostgreSQL database is connected via `DATABASE_URL`

---

## ⚠️ Common Issues

### "DATABASE_URL must start with postgresql://"
**Solution:** Make sure PostgreSQL database is added to Railway project.

### Build fails on migrations
**Solution:** Check Railway logs. Migration file is at `backend/prisma/migrations/production_init/migration.sql`

### TestFlight can't connect
**Solution:**
1. Verify Railway service is running
2. Check you generated a public domain
3. Update `EXPO_PUBLIC_VIBECODE_BACKEND_URL` in Vibecode ENV tab
4. Rebuild TestFlight app

---

## 💰 Railway Pricing

- **Starter:** $5/month credit (free trial available)
- **Developer:** $20/month credit
- Includes PostgreSQL database, auto-deployments, custom domains

---

## 🔄 Future Updates

Any push to your GitHub `main` branch automatically triggers Railway deployment!

---

## ✨ You're Ready!

Your PixieVolt AI backend is fully configured for PostgreSQL on Railway. Just follow the steps above to deploy! 🚀
