# HabitStreak Self-Hosting Guide

Deploy HabitStreak on your own server using Docker.

## Requirements

- Docker and Docker Compose
- 512MB RAM minimum (1GB recommended)
- 500MB disk space for application
- Additional disk space for PostgreSQL data

## Quick Start

### 1. Clone or Download

```bash
git clone https://github.com/yourusername/habitstreak.git
cd habitstreak
```

### 2. Configure Environment

```bash
cp .env.production.example .env.production
```

Edit `.env.production`:

```env
# Generate with: openssl rand -base64 32
POSTGRES_PASSWORD=your_secure_password_here

# Your server's URL
NEXTAUTH_URL=http://your-server-ip:3000

# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your_random_secret_here
```

### 3. Start Services

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Verify

```bash
# Check health
curl http://localhost:3000/api/health

# View logs
docker-compose -f docker-compose.prod.yml logs -f app
```

Visit http://your-server-ip:3000 to access the app.

## Synology NAS Deployment

### Prerequisites

- Synology NAS with Docker package installed
- SSH access to your NAS (optional but recommended)
- Container Manager (DSM 7.2+) or Docker (DSM 7.1 and earlier)

### Option A: Using Container Manager (Recommended for DSM 7.2+)

1. **Create Project Folder**
   - Open File Station
   - Navigate to `/docker/` (or your preferred location)
   - Create folder `habitstreak`

2. **Upload Files**

   Upload these files to `/docker/habitstreak/`:
   - All source files (or clone via SSH)
   - `.env.production` (configured with your secrets)

3. **Open Container Manager**
   - Go to "Project"
   - Click "Create"
   - Name: `habitstreak`
   - Path: Select `/docker/habitstreak`
   - Compose file: Select `docker-compose.prod.yml`

4. **Build and Start**
   - Click "Build"
   - Wait for images to build (may take 5-10 minutes first time)
   - Click "Start"

5. **Access the App**
   - Open http://your-nas-ip:3000
   - Create your account

### Option B: Using SSH (Advanced)

1. **SSH into your NAS**
   ```bash
   ssh admin@your-nas-ip
   ```

2. **Navigate to Docker folder**
   ```bash
   cd /volume1/docker
   mkdir habitstreak
   cd habitstreak
   ```

3. **Clone repository**
   ```bash
   git clone https://github.com/yourusername/habitstreak.git .
   ```

4. **Configure environment**
   ```bash
   cp .env.production.example .env.production
   vim .env.production  # Edit with your values
   ```

5. **Build and start**
   ```bash
   sudo docker-compose -f docker-compose.prod.yml up -d --build
   ```

## Updating

### Pull latest changes and rebuild:

```bash
git pull
docker-compose -f docker-compose.prod.yml up -d --build
```

Database migrations run automatically on startup.

## Backup

### Database backup:

```bash
docker exec habitstreak-db pg_dump -U habitstreak habitstreak > backup.sql
```

### Restore from backup:

```bash
docker exec -i habitstreak-db psql -U habitstreak habitstreak < backup.sql
```

## Troubleshooting

### Container won't start

Check logs:
```bash
docker-compose -f docker-compose.prod.yml logs app
```

Common issues:
- Missing `.env.production` file
- Invalid `NEXTAUTH_SECRET` (must be 32+ characters)
- Database connection failed (check `POSTGRES_PASSWORD` matches)

### Database connection errors

Ensure PostgreSQL is healthy:
```bash
docker-compose -f docker-compose.prod.yml ps
```

The app waits for PostgreSQL health check before starting.

### Port already in use

Edit `docker-compose.prod.yml` to use a different port:
```yaml
ports:
  - '3001:3000'  # Change 3001 to your preferred port
```

## Reverse Proxy (Optional)

For HTTPS with your own domain, set up a reverse proxy.

### Synology DSM Reverse Proxy

1. Control Panel → Login Portal → Advanced → Reverse Proxy
2. Create new rule:
   - Source: HTTPS, your domain, port 443
   - Destination: HTTP, localhost, port 3000
3. Update `NEXTAUTH_URL` in `.env.production` to your domain
4. Restart the app container

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_PASSWORD` | Yes | Database password |
| `NEXTAUTH_URL` | Yes | Public URL of your app |
| `NEXTAUTH_SECRET` | Yes | JWT signing secret (32+ chars) |
| `TZ` | No | Timezone (default: Europe/Amsterdam) |
