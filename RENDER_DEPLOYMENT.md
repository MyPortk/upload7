# Render Deployment Guide

## Step-by-Step Deployment

### 1. **Prepare Your Project**
```bash
# Install dependencies locally
npm install

# Build the project
npm run build

# Verify build is successful
ls -la dist/
```

### 2. **Push to Git Repository**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/inventory-system.git
git branch -M main
git push -u origin main
```

### 3. **Create Render Account & Database**
1. Go to [render.com](https://render.com)
2. Sign in with GitHub
3. Click **New +** → **PostgreSQL**
4. Choose region (recommended: Singapore or EU)
5. Create database
6. Copy connection details

### 4. **Deploy Application on Render**
1. Go to Render Dashboard
2. Click **New +** → **Web Service**
3. Select your GitHub repository
4. Configure:
   - **Name**: `inventory-system`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build && npm run db:push`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or Starter+)

### 5. **Set Environment Variables**
In Render Dashboard → Your Service → **Environment**:

```
DATABASE_URL=postgresql://user:password@host:5432/database
PGHOST=host-from-database
PGPORT=5432
PGDATABASE=database-name
PGUSER=user-from-database
PGPASSWORD=password-from-database
SESSION_SECRET=[generate: openssl rand -hex 32]
NODE_ENV=production
```

### 6. **Enable Auto-Deploy**
- Service Settings → Auto-Deploy: **Yes**
- Any push to main branch auto-deploys

### 7. **Access Your App**
Your app will be live at: `https://your-service-name.onrender.com`

## Troubleshooting

**Build Fails:**
- Check logs: Service → Logs
- Ensure DATABASE_URL is set in Environment
- Run `npm run db:push` manually if needed

**Connection Timeout:**
- Verify DATABASE_URL in Environment
- Check Postgres database is active
- Render may have firewall - use connection pooling

**Session Not Persisting:**
- Ensure SESSION_SECRET is set
- PostgreSQL session table should auto-create
- Check database logs

## Key Files
- `render.yaml` - Render configuration
- `package.json` - Build & start scripts
- `server/index.ts` - Express server setup
- `.env.example` - Reference for environment variables

## Database Migrations
Migrations run automatically in build command via `npm run db:push`. If you need to migrate manually:
```bash
npm run db:push
```
