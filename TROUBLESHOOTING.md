# Quick Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: "permission denied while trying to connect to the Docker daemon socket"

**Error:**
```
permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock
```

**Solution:**

**Option A: Add user to docker group (Recommended)**
```bash
# Add your user to docker group
sudo usermod -aG docker $USER

# Apply the changes (log out and log back in)
# Or run this to apply immediately
newgrp docker

# Verify it worked
groups $USER | grep docker
```

**Option B: Use sudo (Quick fix)**
```bash
sudo docker compose up -d
```

**Option C: Use the automated setup script**
```bash
chmod +x setup.sh
./setup.sh
```

---

### Issue 2: "manifest for mongo:4.5 not found"

**Error:**
```
Error response from daemon: manifest for mongo:4.5 not found: manifest unknown
```

**Solution:**
This has been fixed! The docker-compose.yml now uses `mongo:6.0` instead.

Make sure you have the latest version from the repository:
```bash
git pull origin main
docker compose up -d --build
```

---

### Issue 3: "the attribute `version` is obsolete"

**Warning:**
```
WARN: the attribute `version` is obsolete, it will be ignored
```

**Solution:**
This is just a warning and can be ignored. The version field has been removed from docker-compose.yml in the latest version.

Update your files:
```bash
git pull origin main
```

---

### Issue 4: Services won't start

**Check logs:**
```bash
# View all logs
docker compose logs

# View specific service
docker compose logs mongodb
docker compose logs backend
docker compose logs frontend
```

**Check if ports are in use:**
```bash
# Check if port 3000 is available
sudo lsof -i :3000

# Check if port 8001 is available
sudo lsof -i :8001

# Check if port 27017 is available
sudo lsof -i :27017
```

**Stop conflicting services:**
```bash
# If you have a local MongoDB running
sudo systemctl stop mongodb

# If you have other services on these ports
sudo lsof -ti:3000 | xargs kill -9
```

---

### Issue 5: Can't connect to backend from frontend

**Check if backend is running:**
```bash
docker compose ps
curl http://localhost:8001/api/
```

**Check backend logs:**
```bash
docker compose logs backend
```

**Rebuild if needed:**
```bash
docker compose down
docker compose up -d --build
```

---

### Issue 6: Database connection errors

**Reset the database:**
```bash
# Stop and remove all containers and volumes
docker compose down -v

# Start fresh
docker compose up -d
```

**Check MongoDB logs:**
```bash
docker compose logs mongodb
```

---

### Issue 7: Out of disk space

**Clean up Docker:**
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove everything unused
docker system prune -a --volumes
```

---

### Complete Reset

If nothing works, do a complete reset:

```bash
# Stop everything
docker compose down -v

# Remove all images
docker rmi $(docker images -q google-drive-*)

# Clean system
docker system prune -a --volumes

# Rebuild from scratch
docker compose up -d --build

# Wait for services to start
docker compose logs -f
```

---

## Verification Steps

After starting, verify everything is working:

```bash
# 1. Check all services are running
docker compose ps

# All services should show "Up" and "healthy"

# 2. Check logs for errors
docker compose logs --tail=50

# 3. Test backend API
curl http://localhost:8001/api/

# Should return: {"message":"Hello World"}

# 4. Test MongoDB
docker exec google-drive-mongodb mongosh --eval "db.adminCommand('ping')"

# Should return: { ok: 1 }

# 5. Open frontend
# Navigate to http://localhost:3000 in your browser
```

---

## Quick Commands Reference

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Rebuild and restart
docker compose up -d --build

# Check status
docker compose ps

# Execute command in container
docker exec -it google-drive-backend bash

# View resource usage
docker stats

# Complete cleanup
docker compose down -v
docker system prune -a
```

---

## Still Having Issues?

1. Make sure Docker is installed and running:
   ```bash
   docker --version
   docker info
   ```

2. Make sure docker-compose is installed:
   ```bash
   docker compose version
   ```

3. Make sure you're in the project directory:
   ```bash
   pwd  # Should show path to google-drive-clone
   ls   # Should show docker-compose.yml
   ```

4. Check the logs for specific errors:
   ```bash
   docker compose logs backend | tail -100
   ```

5. Try the automated setup script:
   ```bash
   ./setup.sh
   ```
