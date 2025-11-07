# Google Drive Clone

A fully functional Google Drive clone built with React, FastAPI, and MongoDB. Features include file management, folder hierarchy, sharing, comments, and storage analytics.

## 🚀 Quick Start

```bash
git clone <your-repo-url>
cd google-drive-clone
docker compose up -d
```

**Access the app:** http://localhost:3000

> First build takes 5-10 minutes. Subsequent starts are instant.

## Features

- **Authentication**: JWT-based auth with bcrypt password hashing
- **File Management**: Upload, download, rename, delete, move files
- **Folder Hierarchy**: Create nested folders with breadcrumb navigation
- **Multiple Views**: My Drive, Recent, Starred, Shared with me, Trash
- **File Sharing**: Granular permissions (Viewer, Commenter, Editor)
- **File Preview**: Inline preview for images, PDFs, and text files
- **Comments**: Add and view comments on files
- **Search**: Global search across files and folders
- **Storage Analytics**: Track usage by file type
- **Trash & Restore**: Soft deletion with restore capability
- **Responsive UI**: Google Drive-inspired design

## Architecture

### Tech Stack

**Frontend:**
- React 19 with React Router 7
- Tailwind CSS + Shadcn UI
- Axios for API calls

**Backend:**
- FastAPI (Python)
- MongoDB with Motor (async driver)
- JWT authentication
- Bcrypt password hashing

**Infrastructure:**
- Docker + Docker Compose
- MongoDB 6.0
- Node 20 (frontend)
- Python 3.11 (backend)

### System Design

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   React Client  │  HTTP   │  FastAPI Server │  Async  │    MongoDB      │
│   (Port 3000)   │◄───────►│   (Port 8001)   │◄───────►│   (Port 27017)  │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

## Docker Commands

```bash
# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f

# Stop services
docker compose down

# Restart services
docker compose restart

# Clean rebuild (removes all data)
docker compose down -v
docker compose up -d --build
```

## Database Schema

### Collections

**users**
- Email (unique), name, password hash
- Storage used tracking
- Created timestamp

**files**
- Name, type, size, owner
- Parent folder reference
- Metadata (storage data for small files)
- Starred, trashed flags
- Last opened timestamp

**folders**
- Name, owner, parent folder
- Nested hierarchy support
- Starred, trashed flags

**shares**
- Item (file/folder) references
- User permissions (viewer, commenter, editor)
- Shared by user reference

**comments**
- File reference, user, text
- Timestamp

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Files & Folders
- `POST /api/folders` - Create folder
- `POST /api/files/upload` - Upload file
- `GET /api/files/{id}/download` - Download file
- `GET /api/files/{id}/preview` - Preview file
- `GET /api/drive/items` - List items

### Operations
- `PUT /api/items/{id}` - Rename/move item
- `DELETE /api/items/{id}` - Move to trash
- `POST /api/items/{id}/restore` - Restore from trash
- `POST /api/items/{id}/star` - Star/unstar item

### Sharing & Comments
- `POST /api/shares` - Share item
- `GET /api/shares/with-me` - Get shared items
- `POST /api/comments` - Add comment
- `GET /api/comments/{file_id}` - Get comments

### Storage
- `GET /api/storage` - Get storage info
- `GET /api/activities` - Get activity feed

**API Documentation:** http://localhost:8001/docs

## Development

### Local Setup (Without Docker)

**Prerequisites:**
- Python 3.11+
- Node.js 20+
- MongoDB 4.5+
- Yarn

**Backend:**
```bash
cd backend
pip install -r requirements.txt

# Create .env file
echo 'MONGO_URL=mongodb://localhost:27017' > .env
echo 'DB_NAME=google_drive_clone' >> .env
echo 'SECRET_KEY=your-secret-key' >> .env

uvicorn server:app --reload --port 8001
```

**Frontend:**
```bash
cd frontend
yarn install

# Create .env file
echo 'REACT_APP_BACKEND_URL=http://localhost:8001' > .env

yarn start
```

### Project Structure

```
/app
├── backend/
│   ├── server.py          # FastAPI application
│   ├── models.py          # Pydantic models
│   ├── auth.py            # Authentication utilities
│   ├── requirements.txt   # Python dependencies
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/         # Route components
│   │   ├── components/    # Reusable components
│   │   ├── api/           # API client
│   │   └── utils/         # Helper functions
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```

## File Storage

**Small files (<1MB):** Stored as base64 in MongoDB  
**Large files (≥1MB):** Metadata only, simulated content

> For production, integrate with AWS S3, Google Cloud Storage, or similar.

## Security

**Implemented:**
- Password hashing with bcrypt
- JWT token authentication
- CORS configuration
- Authorization checks on all endpoints

**Production Recommendations:**
- Use HTTPS/TLS
- Implement rate limiting
- Add input sanitization
- Set up file upload validation
- Configure security headers
- Regular security audits

## Testing

### Quick Verification

```bash
# Check containers
docker compose ps

# Test backend
curl http://localhost:8001/api/
# Expected: {"status":"ok","message":"Google Drive Clone API is running"}

# Access frontend
# Open http://localhost:3000 in browser
```

### Manual Testing Flow

1. Open http://localhost:3000
2. Click "Sign up" → Create account
3. Login with credentials
4. Create a new folder
5. Upload a file
6. Test search, star, trash, restore
7. Share file with another user (create second account)
8. Add comments to files

## Troubleshooting

**Containers won't start:**
```bash
docker compose down -v
docker compose up -d --build
```

**Port already in use:**
```bash
# Change ports in docker-compose.yml
ports:
  - "8080:3000"  # Use 8080 instead of 3000
```

**Backend health check fails:**
Ensure `/api/` route exists in `backend/server.py`:
```python
@api_router.get("/")
async def health_check():
    return {"status": "ok", "message": "Google Drive Clone API is running"}
```

**Frontend build fails ("craco not found"):**
In `frontend/Dockerfile`, ensure `NODE_ENV=production` is set AFTER `yarn install`, not before.

**View logs:**
```bash
docker compose logs backend
docker compose logs frontend
docker compose logs mongodb
```

## Production Deployment

### Environment Variables

Create `.env` file in project root:

```env
# Backend
SECRET_KEY=your-strong-random-secret-key
MONGO_URL=mongodb://mongodb:27017
DB_NAME=google_drive_clone

# Frontend
REACT_APP_BACKEND_URL=https://api.yourdomain.com
```

### Using Docker Compose

```bash
# Update docker-compose.yml with production URLs
docker compose -f docker-compose.yml up -d
```

### Reverse Proxy (Nginx)

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

### Data Backup

```bash
# Backup MongoDB
docker exec google-drive-mongodb mongodump --out /backup
docker cp google-drive-mongodb:/backup ./mongodb-backup

# Restore MongoDB
docker cp ./mongodb-backup google-drive-mongodb:/backup
docker exec google-drive-mongodb mongorestore /backup
```

## Future Enhancements

- Real cloud storage integration (S3, GCS)
- File versioning with history
- Real-time collaboration with WebSockets
- Public sharing with expiration
- Mobile application (React Native)
- Desktop sync client (Electron)
- Advanced file preview (Office files, CAD)
- Semantic search with AI
- Auto-tagging with OCR and ML
- Audit logging and compliance features

## License

MIT License - feel free to use this project for learning or building your own applications.

## Screenshots

Login Page  
![Login](./images/google-drive-login.png)

Main Drive  
![Main Drive](./images/google-drive-main.png)

File Upload  
![Upload](./images/upload-and-creation.png)

File Sharing  
![Sharing](./images/share.png)

File Preview  
![Preview](./images/preview.png)

---

**Built as an AI Agent Training Environment** 🤖
