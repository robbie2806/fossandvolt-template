# Railway Deployment Guide for PixieVolt AI

Your backend is now fully configured for production deployment on Railway with PostgreSQL.

---

## 🚀 Quick Setup Steps

### 1. **Push Your Code to GitHub**
```bash
git add .
git commit -m "Configure Railway deployment"
git push origin main
```

### 2. **Create Railway Project**
1. Go to https://railway.app and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. Railway will automatically detect the configuration

### 3. **Add PostgreSQL Database**
1. In your Railway project dashboard, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway automatically creates and links the `DATABASE_URL` variable

### 4. **Configure Environment Variables**
Click on your backend service, go to **Variables** tab, and add:

```env
NODE_ENV=production
PORT=3000
BETTER_AUTH_SECRET=vVluXQeh2SX7OuvZr3soq6afdjhiz7l4
BACKEND_URL=${{RAILWAY_PUBLIC_DOMAIN}}
OPENAI_BASE_URL=https://api.openai.com.proxy.vibecodeapp.com/v1
CODEX_API_KEY=your_codex_api_key_here
```

**Note:** `DATABASE_URL` is automatically set by the PostgreSQL service.

### 5. **Get Your Production URL**
1. After deployment completes, go to your service **Settings**
2. Scroll to **Networking** → **Public Networking**
3. Click **"Generate Domain"**
4. Copy the URL (e.g., `https://pixievolt-production.up.railway.app`)

### 6. **Update App Configuration**
In your Vibecode app, go to the **ENV** tab and update:
```env
EXPO_PUBLIC_VIBECODE_BACKEND_URL=https://your-railway-url.up.railway.app
```

Then rebuild your TestFlight app with the production backend URL.

---

## 📋 What Was Configured

### ✅ Database Migration
- Development: SQLite (`backend/prisma/dev.db`)
- Production: PostgreSQL (managed by Railway)
- Automatic schema switching on deployment

### ✅ Deployment Files Created
- `railway.json` - Railway service configuration
- `nixpacks.toml` - Build process and commands
- `.railwayignore` - Files excluded from deployment
- `backend/prisma/schema.production.prisma` - PostgreSQL schema
- `backend/prisma/migrations/production_init/` - Initial migration

### ✅ Build Process
1. Copy PostgreSQL schema to replace SQLite schema
2. Install dependencies with Bun
3. Build backend TypeScript
4. Generate Prisma client
5. Run database migrations automatically

---

## 🔍 Monitoring & Debugging

### View Logs
In Railway dashboard:
- Click your backend service
- Go to **"Deployments"** tab
- Click latest deployment to see build/runtime logs

### Health Check
Test your deployment:
```bash
curl https://your-railway-url.up.railway.app/health
```

Should return: `{"status":"ok"}`

### Database Access
Railway provides a PostgreSQL connection string in the Variables tab.
You can connect with any PostgreSQL client to inspect data.

---

## ⚠️ Common Issues & Solutions

### Issue: Build fails with "DATABASE_URL must start with postgresql://"
**Solution:** Make sure PostgreSQL database is added to your Railway project and linked to your service.

### Issue: Migrations fail on deployment
**Solution:** Check Railway logs for specific migration errors. The migration file is at `backend/prisma/migrations/production_init/migration.sql`

### Issue: "Better Auth Secret" validation error
**Solution:** Ensure `BETTER_AUTH_SECRET` is set in Railway variables and is at least 32 characters long.

### Issue: CORS errors from mobile app
**Solution:** Verify `BACKEND_URL` in Railway matches your public domain exactly (no trailing slash).

### Issue: TestFlight app can't connect to backend
**Solution:**
1. Verify Railway service is running (check dashboard)
2. Ensure you generated a public domain in Railway networking settings
3. Update `EXPO_PUBLIC_VIBECODE_BACKEND_URL` in your Vibecode ENV tab
4. Rebuild and resubmit to TestFlight

---

## 🔄 Redeployment

Any push to your GitHub main branch will automatically trigger a new deployment on Railway.

Manual redeploy:
1. Go to Railway dashboard
2. Click your service
3. Click **"Deploy"** → **"Redeploy"**

---

## 💰 Railway Pricing

- **Starter Plan:** $5/month credit (enough for small apps)
- **Developer Plan:** $20/month credit
- Includes: PostgreSQL database, automatic deployments, custom domains

Monitor usage in Railway dashboard to avoid overages.

---

## 🎯 Next Steps

1. ✅ Push code to GitHub
2. ✅ Create Railway project and add PostgreSQL
3. ✅ Configure environment variables
4. ✅ Generate public domain
5. ✅ Update Vibecode ENV with production URL
6. ✅ Rebuild and submit to TestFlight
7. ✅ Test production backend with TestFlight build

Your PixieVolt AI backend is now production-ready! 🚀
