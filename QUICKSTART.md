# Google Drive Clone - Quick Start

## Prerequisites
- Docker (20.10+)
- Docker Compose (2.0+)

Install on Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install docker.io docker-compose-plugin
sudo systemctl start docker
```

## Run the App

```bash
# Clone repo
git clone <your-repo-url>
cd google-drive-clone

# Start everything
docker compose up -d
```

Wait 5-10 minutes for first build, then open: **http://localhost:3000**

## Basic Commands

```bash
# Check status
docker compose ps

# View logs
docker compose logs -f

# Stop
docker compose down

# Restart
docker compose restart

# Fresh start (removes data)
docker compose down -v && docker compose up -d --build
```

## Troubleshooting

### Build fails with "craco: not found"
Your `frontend/Dockerfile` is outdated. See [SIMPLE_DOCKERFILE_FIX.md](./SIMPLE_DOCKERFILE_FIX.md)

### Port already in use
Change ports in `docker-compose.yml`:
```yaml
ports:
  - "8080:3000"  # Frontend on port 8080 instead of 3000
```

### Backend can't connect to MongoDB
```bash
docker compose restart mongodb backend
docker compose logs backend
```

### Can't access http://localhost:3000
```bash
# Check if frontend is running
docker compose ps frontend

# Check frontend logs
docker compose logs frontend

# Try rebuilding
docker compose up -d --build frontend
```

## Data Persistence

MongoDB data is stored in a Docker volume. Your files/folders persist even when you stop containers.

To backup:
```bash
docker exec google-drive-mongodb mongodump --out /backup
docker cp google-drive-mongodb:/backup ./mongodb-backup
```

## Need More Help?

- Full docs: [README.md](./README.md)
- Docker details: [DOCKER.md](./DOCKER.md)
- Troubleshooting: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
