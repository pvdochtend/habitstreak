# Getting Started with HabitStreak

This guide will help you get HabitStreak running locally in under 5 minutes.

## Prerequisites

Before you begin, make sure you have:
- **Node.js 20+** installed ([Download](https://nodejs.org/))
- **Docker Desktop** installed ([Download](https://www.docker.com/products/docker-desktop))
- A code editor (VS Code recommended)

## Quick Start (5 Steps)

### 1. Install Dependencies
```bash
npm install
```

This installs all required packages (~2 minutes).

### 2. Start PostgreSQL
```bash
docker-compose up -d
```

This starts a PostgreSQL database in the background.

**Verify it's running:**
```bash
docker ps
# You should see "habitstreak-db" in the list
```

### 3. Set Up Database
```bash
npm run db:migrate
```

When prompted for a migration name, enter: `init`

This creates the database tables (users, tasks, check_ins).

### 4. Start Development Server
```bash
npm run dev
```

The app will be available at: **http://localhost:3000**

### 5. Create Your First Account
1. Open http://localhost:3000
2. Click "Registreer je hier"
3. Enter email and password (min 8 characters)
4. You're in! 🎉

## What to Do Next

### Create Your First Task
1. Click **"Taken"** in the bottom navigation
2. Click **"Nieuwe taak"** button
3. Enter a task name (e.g., "Meditatie")
4. Choose a schedule (e.g., "Elke dag")
5. Click **"Aanmaken"**

### Check In Today
1. Go to **"Vandaag"** tab
2. Tap the task to check it off
3. Watch the checkmark animate!
4. See your progress bar fill up

### View Your Insights
1. Click **"Inzichten"** tab
2. See your 1-day streak 🔥
3. Check the 7-day chart
4. Watch your streak grow each day!

## Development Workflow

### Daily Development
```bash
# Start everything
docker-compose up -d  # Start database
npm run dev           # Start app

# When done
docker-compose down   # Stop database
```

### Database Management
```bash
# View database in GUI
npm run db:studio
# Opens http://localhost:5555

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Testing
```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e
```

## Project Structure

```
habitstreak/
├── src/
│   ├── app/              # Pages and API routes
│   │   ├── (auth)/       # Login/Signup
│   │   ├── (main)/       # App pages (protected)
│   │   └── api/          # Backend API
│   ├── components/       # React components
│   │   ├── ui/           # Base UI components
│   │   ├── tasks/        # Task-related components
│   │   └── insights/     # Chart components
│   ├── lib/              # Business logic
│   └── types/            # TypeScript types
├── prisma/              # Database schema
└── tests/               # Unit and E2E tests
```

## Key Features to Explore

### 1. Task Scheduling
- **Elke dag**: All 7 days
- **Werkdagen (ma-vr)**: Monday-Friday
- **Weekend (za-zo)**: Saturday-Sunday

### 2. Daily Target
- Go to **Instellingen** → Adjust "Dagelijks doel"
- Default is 1 task per day
- Change to match your goals

### 3. Streak System
- Complete your daily target = successful day
- Consecutive successful days = streak
- Miss a day = streak resets to 0

### 4. Insights Chart
- Shows last 7 days
- Red line = your daily target
- Bars = completed tasks

## Troubleshooting

### Database Won't Start
```bash
# Check if port 5432 is in use
lsof -i :5432  # macOS/Linux
netstat -ano | findstr :5432  # Windows

# If something else is using it, stop that service or change port in docker-compose.yml
```

### "Module not found" Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Prisma Client Out of Sync
```bash
npm run db:generate
```

### App Won't Start
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

## Tips & Tricks

### Fast Database Reset
```bash
npx prisma migrate reset --skip-seed
```

### Generate Production Secret
```bash
openssl rand -base64 32
```

### View Database Queries (Debug Mode)
Add to `.env.local`:
```env
DEBUG=prisma:query
```

### Keyboard Shortcuts in Prisma Studio
- `Ctrl+K` (Windows/Linux) or `Cmd+K` (macOS) - Command palette
- `Ctrl+/` or `Cmd+/` - Add filter

## Next Steps

Once you're comfortable with the basics:

1. **Read CLAUDE.md** - Architecture and development guidelines
2. **Explore the code** - Start with `src/app/(main)/vandaag/page.tsx`
3. **Run tests** - See how testing works
4. **Check the API** - Try Prisma Studio to see data
5. **Deploy** - Follow DEPLOYMENT.md to go live

## Getting Help

If you're stuck:

1. Check the **error message** in the terminal
2. Look at **browser console** (F12)
3. Review **CLAUDE.md** for architecture details
4. Check **README.md** for command reference

## Common Questions

**Q: Can I use a different database?**
A: Yes, Prisma supports MySQL, SQLite, etc. Update `schema.prisma` and `DATABASE_URL`.

**Q: How do I add dark mode?**
A: CSS variables are ready in `globals.css`. Add a theme toggle and `dark:` classes.

**Q: Can I deploy for free?**
A: Yes! Vercel (hosting) + Neon (database) both have free tiers.

**Q: Where is user data stored?**
A: PostgreSQL database (local in Docker for dev, cloud for production).

**Q: Is this production-ready?**
A: Yes! Follow DEPLOYMENT.md to deploy. Add monitoring and backups.

---

**You're all set!** Start the app and build your first streak. 🔥

Questions? Check CLAUDE.md for detailed architecture documentation.
