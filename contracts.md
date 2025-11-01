# Google Drive Clone - API Contracts & Implementation Plan

## 1. MOCKED DATA TO REPLACE WITH REAL DATA

### Frontend Mock Files
- `/app/frontend/src/mock/mockData.js` - Contains all mock data including:
  - `mockUsers` - User accounts with credentials
  - `mockFolders` - Folder hierarchy with nested structure
  - `mockFiles` - Files with metadata (name, type, size, timestamps, thumbnails)
  - `mockShares` - File/folder sharing with permissions
  - `mockActivities` - Activity feed
  - `mockComments` - File comments
  - `mockStorageInfo` - Storage usage statistics

### State Management in Drive.jsx
- Files, folders, shares, and comments are stored in React state
- All CRUD operations currently update local state only
- Upload simulation with progress tracking
- Real-time updates simulated via local state changes

## 2. API CONTRACTS

### Base URL: `${BACKEND_URL}/api`

### Authentication Endpoints

#### POST /api/auth/register
**Request:**
```json
{
  "email": "user@example.com",
  "name": "User Name",
  "password": "password123"
}
```
**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name"
  },
  "token": "jwt-token"
}
```

#### POST /api/auth/login
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name"
  },
  "token": "jwt-token"
}
```

#### GET /api/auth/me
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "User Name"
}
```

### File & Folder Endpoints

#### GET /api/drive/items
**Query Params:** `folderId`, `view` (drive/recent/starred/shared/trash), `search`
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "folders": [...],
  "files": [...]
}
```

#### POST /api/folders
**Request:**
```json
{
  "name": "Folder Name",
  "parentId": "uuid or null"
}
```
**Response:**
```json
{
  "id": "uuid",
  "name": "Folder Name",
  "parentId": "uuid or null",
  "ownerId": "user-id",
  "created": "ISO-8601",
  "modified": "ISO-8601",
  "starred": false,
  "trashed": false
}
```

#### POST /api/files/upload
**Request:** `multipart/form-data`
- file: File
- folderId: string (optional)
**Response:**
```json
{
  "id": "uuid",
  "name": "file.pdf",
  "type": "application/pdf",
  "size": 12345,
  "folderId": "uuid or null",
  "ownerId": "user-id",
  "created": "ISO-8601",
  "modified": "ISO-8601",
  "starred": false,
  "trashed": false,
  "url": "/api/files/:id/download"
}
```

#### GET /api/files/:id/download
**Headers:** `Authorization: Bearer <token>`
**Response:** File stream

#### GET /api/files/:id/preview
**Headers:** `Authorization: Bearer <token>`
**Response:** File preview data (for images/PDFs)

#### PATCH /api/items/:id
**Request:**
```json
{
  "name": "New Name",
  "starred": true,
  "parentId": "new-folder-id"
}
```
**Response:** Updated item

#### DELETE /api/items/:id
**Query Params:** `permanent=true` (for permanent delete from trash)
**Response:**
```json
{
  "success": true,
  "message": "Item moved to trash" or "Item deleted permanently"
}
```

#### POST /api/items/:id/restore
**Response:** Restored item

### Sharing Endpoints

#### POST /api/shares
**Request:**
```json
{
  "itemId": "file-or-folder-id",
  "email": "user@example.com",
  "permission": "viewer|commenter|editor"
}
```
**Response:**
```json
{
  "id": "share-id",
  "itemId": "item-id",
  "userId": "user-id",
  "permission": "viewer",
  "sharedBy": "owner-id",
  "sharedAt": "ISO-8601"
}
```

#### GET /api/shares/:itemId
**Response:**
```json
[
  {
    "id": "share-id",
    "user": {
      "id": "user-id",
      "name": "User Name",
      "email": "user@example.com"
    },
    "permission": "viewer",
    "sharedAt": "ISO-8601"
  }
]
```

#### DELETE /api/shares/:shareId
**Response:** Success message

### Comment Endpoints

#### POST /api/comments
**Request:**
```json
{
  "fileId": "file-id",
  "text": "Comment text"
}
```
**Response:**
```json
{
  "id": "comment-id",
  "fileId": "file-id",
  "userId": "user-id",
  "userName": "User Name",
  "text": "Comment text",
  "timestamp": "ISO-8601"
}
```

#### GET /api/comments/:fileId
**Response:** Array of comments

### Activity Endpoints

#### GET /api/activities
**Query Params:** `limit`, `offset`
**Response:**
```json
[
  {
    "id": "activity-id",
    "type": "upload|share|edit|delete|star",
    "userId": "user-id",
    "fileId": "file-id",
    "description": "Uploaded Contract.pdf",
    "timestamp": "ISO-8601"
  }
]
```

### Storage Endpoints

#### GET /api/storage
**Response:**
```json
{
  "used": 67234567890,
  "total": 107374182400,
  "breakdown": {
    "documents": 12345678,
    "images": 23456789,
    "videos": 45678901,
    "other": 5678901
  }
}
```

### WebSocket Events

#### Connection: `ws://${BACKEND_URL}/ws?token=<jwt>`

**Events to emit:**
- `file:uploaded` - When file is uploaded
- `file:modified` - When file is renamed/moved
- `file:deleted` - When file is trashed
- `file:restored` - When file is restored
- `file:shared` - When file is shared
- `share:revoked` - When access is revoked
- `comment:added` - When comment is added

## 3. BACKEND IMPLEMENTATION PLAN

### Database Models (MongoDB)

#### User
```python
{
  "_id": ObjectId,
  "email": str (unique),
  "name": str,
  "password_hash": str,
  "created_at": datetime,
  "storage_used": int (bytes)
}
```

#### File
```python
{
  "_id": ObjectId,
  "name": str,
  "type": str,  # MIME type
  "size": int,
  "folder_id": ObjectId or None,
  "owner_id": ObjectId,
  "created_at": datetime,
  "modified_at": datetime,
  "last_opened": datetime or None,
  "starred": bool,
  "trashed": bool,
  "metadata": {
    "original_filename": str,
    "storage_path": str,  # Simulated path
    "thumbnail_url": str or None
  }
}
```

#### Folder
```python
{
  "_id": ObjectId,
  "name": str,
  "parent_id": ObjectId or None,
  "owner_id": ObjectId,
  "created_at": datetime,
  "modified_at": datetime,
  "starred": bool,
  "trashed": bool
}
```

#### Share
```python
{
  "_id": ObjectId,
  "item_id": ObjectId,  # File or Folder
  "item_type": str,  # "file" or "folder"
  "user_id": ObjectId,
  "shared_by": ObjectId,
  "permission": str,  # "viewer", "commenter", "editor"
  "shared_at": datetime
}
```

#### Comment
```python
{
  "_id": ObjectId,
  "file_id": ObjectId,
  "user_id": ObjectId,
  "text": str,
  "created_at": datetime
}
```

#### Activity
```python
{
  "_id": ObjectId,
  "type": str,  # "upload", "share", "edit", "delete", "star"
  "user_id": ObjectId,
  "item_id": ObjectId,
  "description": str,
  "timestamp": datetime
}
```

### File Storage Simulation
- Store file metadata in MongoDB
- For simulated storage:
  - Save small files (< 1MB) as base64 in database
  - For larger files, generate mock content or store reference only
  - Return appropriate MIME type responses
- Support inline preview for:
  - Images: Return as data URL or generated placeholder
  - PDFs: Return mock PDF data
  - Text files: Return sample content
  - Videos: Return mock video metadata

### API Routes Implementation
- Use FastAPI with JWT authentication middleware
- Implement all endpoints as specified in contracts
- Add proper error handling and validation
- Use Pydantic models for request/response validation
- Implement WebSocket connection for real-time updates

### Authentication
- Use JWT tokens with 7-day expiration
- Hash passwords with bcrypt
- Implement middleware to verify JWT on protected routes

## 4. FRONTEND-BACKEND INTEGRATION

### Files to Modify

#### `/app/frontend/src/pages/Login.jsx`
- Replace mock authentication with API call to `/api/auth/login`
- Handle JWT token storage
- Handle error responses

#### `/app/frontend/src/pages/Drive.jsx`
- Replace all mock data fetching with API calls
- Implement WebSocket connection for real-time updates
- Replace local state mutations with API calls:
  - `handleCreateFolder` → POST /api/folders
  - `handleUploadFile` → POST /api/files/upload
  - `handleItemAction` → PATCH/DELETE /api/items/:id
  - `handleShare` → POST /api/shares
  - `handleAddComment` → POST /api/comments

#### New File: `/app/frontend/src/api/client.js`
```javascript
import axios from 'axios';

const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

const client = axios.create({
  baseURL: API_BASE,
});

// Add JWT token to requests
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
```

#### New File: `/app/frontend/src/hooks/useWebSocket.js`
```javascript
import { useEffect, useRef } from 'react';

export const useWebSocket = (onMessage) => {
  const ws = useRef(null);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const wsUrl = `${process.env.REACT_APP_BACKEND_URL.replace('http', 'ws')}/ws?token=${token}`;
    
    ws.current = new WebSocket(wsUrl);
    
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };
    
    return () => {
      ws.current?.close();
    };
  }, [onMessage]);
  
  return ws.current;
};
```

## 5. TESTING CHECKLIST

### Authentication
- [ ] Register new user
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Token persistence across page refresh
- [ ] Logout functionality

### File Management
- [ ] Create folder
- [ ] Upload file (single)
- [ ] Upload multiple files
- [ ] Rename file/folder
- [ ] Move file/folder to different folder
- [ ] Star/unstar file/folder
- [ ] Delete file/folder (move to trash)
- [ ] Restore from trash
- [ ] Permanently delete from trash

### Navigation
- [ ] Navigate into folders
- [ ] Breadcrumb navigation
- [ ] View Recent files
- [ ] View Starred items
- [ ] View Shared items
- [ ] View Trash

### Search & Filters
- [ ] Search files by name
- [ ] Search in different views
- [ ] Clear search

### Sharing
- [ ] Share file with user
- [ ] Set different permissions
- [ ] View shared users
- [ ] Revoke access
- [ ] Copy shareable link

### File Preview
- [ ] Preview images
- [ ] Preview PDFs
- [ ] Preview text files
- [ ] Download files
- [ ] Zoom in/out on images

### Comments
- [ ] Add comment to file
- [ ] View comments
- [ ] Real-time comment updates

### Real-time Updates
- [ ] File upload notification
- [ ] Shared item appears immediately
- [ ] File modifications reflect live

### Storage
- [ ] View storage usage
- [ ] Storage updates after upload/delete

## 6. EDGE CASES TO HANDLE

- Duplicate file names in same folder
- Moving folder into its own subfolder (circular reference)
- Deleting folder with nested items
- Sharing already shared items
- Invalid file types
- Large file uploads (chunk handling)
- Network errors during upload
- Concurrent modifications
- Token expiration
- Invalid permissions
