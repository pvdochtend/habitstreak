# Deployment Checklist

Use this checklist when deploying HabitStreak to production.

## Pre-Deployment

### 1. Code Preparation
- [ ] All tests passing (`npm test` and `npm run test:e2e`)
- [ ] No TypeScript errors (`npm run build`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Code committed to Git
- [ ] Code pushed to GitHub

### 2. Environment Setup
- [ ] Production PostgreSQL database provisioned
- [ ] Database connection string obtained
- [ ] Production domain name (optional, can use Vercel subdomain)

### 3. Generate Secrets
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```
- [ ] `NEXTAUTH_SECRET` generated (min 32 characters)
- [ ] Secrets stored securely (not in code!)

### 4. PWA Assets
- [ ] PWA icons generated (see `/public/icons/README.md`)
- [ ] All 8 icon sizes created (72x72 to 512x512)
- [ ] Icons uploaded to `/public/icons/`
- [ ] Favicon present at `/public/favicon.svg`

## Deployment Steps (Vercel)

### 1. Create Vercel Project
- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Click "Add New" → "Project"
- [ ] Import GitHub repository
- [ ] Framework detected: Next.js ✓

### 2. Configure Environment Variables
Add the following in Vercel dashboard (Settings → Environment Variables):

- [ ] `DATABASE_URL` = `postgresql://user:password@host:5432/database`
- [ ] `NEXTAUTH_URL` = `https://your-domain.vercel.app`
- [ ] `NEXTAUTH_SECRET` = `[generated secret from step 3]`
- [ ] `TZ` = `Europe/Amsterdam`

### 3. Deploy
- [ ] Click "Deploy"
- [ ] Wait for build to complete (2-3 minutes)
- [ ] Check for build errors in logs

### 4. Run Database Migration
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link to project
vercel link

# Pull environment variables
vercel env pull .env.production

# Run migration
npx prisma migrate deploy
```

- [ ] Migration completed successfully
- [ ] Database tables created

## Post-Deployment Verification

### 1. Smoke Tests
- [ ] Visit production URL
- [ ] Homepage loads (redirects to /login)
- [ ] **Signup flow:**
  - [ ] Create account with test email
  - [ ] Redirects to /vandaag
  - [ ] No errors in console
- [ ] **Login flow:**
  - [ ] Logout
  - [ ] Login with test account
  - [ ] Redirects to /vandaag
- [ ] **Task creation:**
  - [ ] Navigate to "Taken"
  - [ ] Click "Nieuwe taak"
  - [ ] Create task "Test Task"
  - [ ] Task appears in list
- [ ] **Check-in:**
  - [ ] Navigate to "Vandaag"
  - [ ] Check off "Test Task"
  - [ ] Checkmark animates
  - [ ] Progress bar updates
  - [ ] "Behaald!" message shows
- [ ] **Insights:**
  - [ ] Navigate to "Inzichten"
  - [ ] Chart displays
  - [ ] Streak shows 1 day
  - [ ] Summary stats correct

### 2. Mobile Testing
- [ ] Test on iOS Safari (PWA installation)
- [ ] Test on Android Chrome (PWA installation)
- [ ] Touch targets work correctly
- [ ] Bottom navigation accessible
- [ ] No layout issues

### 3. PWA Installation
- [ ] iOS: "Add to Home Screen" works
- [ ] Android: "Install app" prompt appears
- [ ] Desktop: Install icon in address bar
- [ ] Installed app launches correctly
- [ ] App name displays correctly

### 4. Performance Checks
- [ ] Lighthouse score run (aim for 90+ Performance, 100 Accessibility)
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s
- [ ] No console errors
- [ ] No console warnings (except third-party)

### 5. Security Checks
- [ ] HTTPS enforced
- [ ] Security headers present (check with securityheaders.com)
- [ ] Session cookies are httpOnly
- [ ] No sensitive data in client-side code
- [ ] API routes require authentication

## Monitoring Setup

### 1. Vercel Analytics (Free)
- [ ] Enable Vercel Analytics in project settings
- [ ] Verify events are being tracked

### 2. Error Tracking (Optional - Sentry)
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```
- [ ] Sentry installed
- [ ] DSN configured
- [ ] Test error sent and received

### 3. Uptime Monitoring (Optional - UptimeRobot)
- [ ] Create UptimeRobot account
- [ ] Add HTTP(S) monitor for production URL
- [ ] Set check interval (5 minutes)
- [ ] Configure email alerts

## Database Backup

### Vercel Postgres
- [ ] Automatic backups enabled (check dashboard)
- [ ] Backup retention period confirmed

### Neon / Supabase
- [ ] Automatic backups enabled in project settings
- [ ] Point-in-time recovery available
- [ ] Download manual backup for safety

## Production Secrets Checklist

Never commit these to Git:
- [ ] `.env.local` in `.gitignore`
- [ ] `.env.production` in `.gitignore`
- [ ] `NEXTAUTH_SECRET` only in Vercel environment variables
- [ ] `DATABASE_URL` only in Vercel environment variables

## Rollback Plan

If deployment fails:
1. Check Vercel deployment logs
2. Fix errors locally
3. Redeploy OR rollback in Vercel dashboard
4. For database issues: restore from backup

## Post-Launch

### Week 1
- [ ] Monitor error rates
- [ ] Check user signup conversion
- [ ] Review performance metrics
- [ ] Fix any critical bugs

### Week 2
- [ ] Analyze user behavior
- [ ] Collect feedback
- [ ] Plan next iteration

## Notes

- Deployment date: _______________
- Production URL: _______________
- Database provider: _______________
- Deployed by: _______________
