# Google Drive Clone - Docker Setup

This guide will help you run the Google Drive clone application using Docker.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

**Note:** The application uses Node 20 for the frontend, which is automatically handled by Docker.

### Installing Docker

**For Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
```

**For macOS:**
Download and install [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)

**For Windows:**
Download and install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)

**Verify Installation:**
```bash
docker --version
docker-compose --version
```

## Quick Start

### 1. Clone the Repository (if not already done)
```bash
git clone <repository-url>
cd google-drive-clone
```

### 2. Run the Automated Setup Script (Recommended)

The setup script handles everything for you:
```bash
chmod +x setup.sh
sudo ./setup.sh
```

**What it does:**
- ✅ Checks Docker installation
- ✅ Fixes Docker permissions
- ✅ Creates `.env` file with correct values
- ✅ Builds and starts all containers
- ✅ Verifies services are healthy

### 3. Validate the Deployment

After setup completes, run the validation script:
```bash
./validate-docker.sh
```

This performs 10 automated checks to ensure everything is working correctly.

**Manual start (Alternative):**
```bash
docker compose up -d
```

This single command will:
- Start MongoDB database
- Build and start the backend API
- Build and start the frontend application

### 3. Access the Application
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8001
- **API Documentation:** http://localhost:8001/docs

### 4. Create Your First Account
1. Navigate to http://localhost:3000
2. Click "Sign up"
3. Create a new account
4. Start using the application!

## Docker Commands

### View Running Containers
```bash
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Stop the Application
```bash
docker-compose down
```

### Stop and Remove All Data
```bash
docker-compose down -v
```
**Warning:** This will delete all data including user accounts and files!

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Rebuild After Code Changes
```bash
# Rebuild and restart
docker-compose up -d --build

# Rebuild specific service
docker-compose build backend
docker-compose up -d backend
```

## Environment Variables

### Backend Environment Variables
Edit `docker-compose.yml` to change:
- `MONGO_URL`: MongoDB connection string (default: mongodb://mongodb:27017)
- `DB_NAME`: Database name (default: google_drive_clone)
- `SECRET_KEY`: JWT secret key (change in production!)

### Frontend Environment Variables
Edit `docker-compose.yml` to change:
- `REACT_APP_BACKEND_URL`: Backend API URL (default: http://localhost:8001)

**For production deployment:**
```yaml
environment:
  - REACT_APP_BACKEND_URL=https://your-backend-domain.com
```

## Port Configuration

Default ports used:
- Frontend: `3000`
- Backend: `8001`
- MongoDB: `27017`

To change ports, edit the `ports` section in `docker-compose.yml`:
```yaml
ports:
  - "8080:3000"  # Maps host port 8080 to container port 3000
```

## Volumes and Data Persistence

MongoDB data is stored in a Docker volume named `mongodb_data`. This ensures your data persists even when containers are stopped.

### Backup Database
```bash
docker exec google-drive-mongodb mongodump --out /backup
docker cp google-drive-mongodb:/backup ./mongodb-backup
```

### Restore Database
```bash
docker cp ./mongodb-backup google-drive-mongodb:/backup
docker exec google-drive-mongodb mongorestore /backup
```

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Check container status
docker-compose ps
```

### Port Already in Use
If you get a port binding error:
1. Stop the service using the port
2. Or change the port in `docker-compose.yml`

### Database Connection Issues
```bash
# Check if MongoDB is healthy
docker exec google-drive-mongodb mongo --eval "db.adminCommand('ping')"

# Restart MongoDB
docker-compose restart mongodb
```

### Frontend Can't Connect to Backend
1. Ensure backend is running: `docker-compose ps`
2. Check backend logs: `docker-compose logs backend`
3. Verify `REACT_APP_BACKEND_URL` in docker-compose.yml
4. For production, use full URL: `https://your-domain.com`

### Clear All Data and Start Fresh
```bash
docker-compose down -v
docker system prune -a
docker-compose up -d --build
```

## Production Deployment

### 1. Update Environment Variables
Edit `docker-compose.yml`:
```yaml
environment:
  - MONGO_URL=mongodb://mongodb:27017
  - DB_NAME=google_drive_clone
  - SECRET_KEY=STRONG-RANDOM-SECRET-KEY-HERE  # Change this!
  - REACT_APP_BACKEND_URL=https://api.yourdomain.com
```

### 2. Use a Reverse Proxy (Recommended)
Use Nginx or Caddy to:
- Serve frontend on port 80/443
- Proxy API requests to backend
- Handle HTTPS/SSL certificates

Example Nginx configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
    }

    location /api {
        proxy_pass http://localhost:8001;
    }
}
```

### 3. Use Docker Compose Production File
Create `docker-compose.prod.yml`:
```yaml
version: '3.8'
services:
  backend:
    restart: always
    environment:
      - SECRET_KEY=${SECRET_KEY}
  frontend:
    restart: always
    environment:
      - REACT_APP_BACKEND_URL=${BACKEND_URL}
```

Run with:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 4. Set Up SSL/HTTPS
Use Let's Encrypt with Certbot:
```bash
sudo apt-get install certbot
sudo certbot --nginx -d yourdomain.com
```

## Building Individual Images

### Build Backend Image
```bash
cd backend
docker build -t google-drive-backend:latest .
```

### Build Frontend Image
```bash
cd frontend
docker build -t google-drive-frontend:latest \
  --build-arg REACT_APP_BACKEND_URL=http://localhost:8001 .
```

### Run Individual Containers
```bash
# MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:4.5

# Backend
docker run -d -p 8001:8001 \
  -e MONGO_URL=mongodb://mongodb:27017 \
  -e DB_NAME=google_drive_clone \
  --link mongodb \
  google-drive-backend:latest

# Frontend
docker run -d -p 3000:3000 \
  --link backend \
  google-drive-frontend:latest
```

## Docker Hub (Optional)

### Tag and Push to Docker Hub
```bash
# Login to Docker Hub
docker login

# Tag images
docker tag google-drive-backend:latest yourusername/google-drive-backend:latest
docker tag google-drive-frontend:latest yourusername/google-drive-frontend:latest

# Push to Docker Hub
docker push yourusername/google-drive-backend:latest
docker push yourusername/google-drive-frontend:latest
```

### Pull and Run from Docker Hub
```bash
docker pull yourusername/google-drive-backend:latest
docker pull yourusername/google-drive-frontend:latest
```

## Health Checks

The docker-compose configuration includes health checks:
- **MongoDB:** Pings the database every 10 seconds
- **Backend:** Checks API endpoint every 30 seconds

View health status:
```bash
docker-compose ps
```

Healthy containers will show `(healthy)` in the status column.

## Resource Limits

To prevent containers from consuming too many resources, add limits in `docker-compose.yml`:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## Useful Commands

```bash
# View container resource usage
docker stats

# Execute commands in container
docker exec -it google-drive-backend bash
docker exec -it google-drive-mongodb mongo

# Copy files from container
docker cp google-drive-backend:/app/logs ./backend-logs

# Remove unused images and containers
docker system prune -a

# View Docker disk usage
docker system df
```

## Support

For issues related to Docker setup:
1. Check logs: `docker-compose logs -f`
2. Verify all containers are running: `docker-compose ps`
3. Ensure ports are available: `netstat -tuln | grep 3000`
4. Check Docker daemon: `sudo systemctl status docker`

For application-specific issues, refer to the main [README.md](../README.md)

---

**Ready to deploy!** 🚀
