# HabitStreak

A mobile-first habit tracker web application built with Next.js, TypeScript, and PostgreSQL.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Auth**: NextAuth.js
- **Styling**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **Testing**: Vitest (unit) + Playwright (e2e)

## Prerequisites

- Node.js 20+ and npm
- Docker and Docker Compose

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Start PostgreSQL

```bash
docker-compose up -d
```

Verify the database is running:
```bash
docker ps
```

### 3. Set Up Environment Variables

Copy the example environment file:
```bash
cp .env.example .env.local
```

The default values work for local development. Update `NEXTAUTH_SECRET` for production.

### 4. Run Database Migrations

Initialize the database schema:
```bash
npm run db:migrate
```

This will:
- Create the initial migration
- Apply it to your database
- Generate the Prisma Client

### 5. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

### Development
- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database
- `npm run db:generate` - Generate Prisma Client
- `npm run db:migrate` - Create and apply migrations
- `npm run db:push` - Push schema changes (dev only)
- `npm run db:studio` - Open Prisma Studio (database GUI)

### Testing
- `npm test` - Run unit tests with Vitest
- `npm run test:e2e` - Run e2e tests with Playwright
- `npm run test:e2e:ui` - Run e2e tests in UI mode

## Project Structure

```
habitstreak/
├── prisma/              # Database schema and migrations
├── src/
│   ├── app/            # Next.js App Router pages and API routes
│   ├── components/     # React components
│   ├── lib/            # Business logic and utilities
│   └── types/          # TypeScript type definitions
├── tests/              # Unit and e2e tests
└── public/             # Static assets
```

## Database Schema

### Users
- Email/password authentication
- Configurable daily target (default: 1)
- Streak freezes (for future use)

### Tasks
- User-scoped task definitions
- Schedule presets: ALL_WEEK, WORKWEEK, WEEKEND, CUSTOM
- Soft delete via `isActive` flag

### CheckIns
- Daily completion tracking (Europe/Amsterdam timezone)
- Unique constraint per task per day
- Cascade delete on task/user deletion

## Development Guidelines

- All code, variables, and comments in **English**
- All user-facing text in **Dutch**
- Mobile-first design approach
- Timezone: Europe/Amsterdam (hardcoded)
- Use Server Components by default; Client Components only when needed

## Stopping the Database

```bash
docker-compose down
```

To remove the database volume (WARNING: deletes all data):
```bash
docker-compose down -v
```

## Deployment

### Prerequisites

- Node.js 20+
- PostgreSQL database (production)
- Domain name (optional, for custom domain)

### Environment Variables

Create a `.env` file with production values:

```env
# Database (use production PostgreSQL URL)
DATABASE_URL="postgresql://user:password@host:5432/database"

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="generate-a-secure-random-string-min-32-chars"

# Application
TZ="Europe/Amsterdam"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Deploy to Vercel (Recommended)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/habitstreak.git
   git push -u origin main
   ```

2. **Set up PostgreSQL:**
   - Use [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
   - OR use [Neon](https://neon.tech/) (free tier available)
   - OR use [Supabase](https://supabase.com/) (free tier available)

3. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables:
     - `DATABASE_URL`
     - `NEXTAUTH_URL`
     - `NEXTAUTH_SECRET`
   - Deploy

4. **Run Database Migrations:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Run migration
   vercel env pull .env.production
   npx prisma migrate deploy
   ```

### Deploy to Railway

1. **Create a new project on [Railway](https://railway.app)**

2. **Add PostgreSQL database:**
   - Click "New" → "Database" → "PostgreSQL"
   - Copy the connection string

3. **Deploy from GitHub:**
   - Click "New" → "GitHub Repo"
   - Select your repository
   - Add environment variables
   - Railway will auto-deploy

4. **Run migrations:**
   ```bash
   railway run npx prisma migrate deploy
   ```

### Deploy to Other Platforms

The app is a standard Next.js application and can be deployed to:
- **Netlify** (with PostgreSQL from Neon/Supabase)
- **AWS** (Amplify/EC2 + RDS)
- **Google Cloud** (Cloud Run + Cloud SQL)
- **DigitalOcean** (App Platform + Managed PostgreSQL)

### Post-Deployment

1. **Test the deployment:**
   - Sign up with a test account
   - Create a task
   - Check in a task
   - Verify insights page

2. **Set up monitoring:**
   - Vercel Analytics (automatic)
   - Error tracking (Sentry)
   - Uptime monitoring (UptimeRobot)

3. **Generate PWA icons:**
   - Follow instructions in `/public/icons/README.md`
   - Upload icons to production

## PWA Installation

### iOS (Safari)
1. Open the app in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"
4. Tap "Add"

### Android (Chrome)
1. Open the app in Chrome
2. Tap the menu (⋮)
3. Tap "Install app" or "Add to Home screen"
4. Tap "Install"

### Desktop (Chrome/Edge)
1. Look for the install icon in the address bar
2. Click "Install"

## License

Private project - all rights reserved
