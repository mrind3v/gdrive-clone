from fastapi import FastAPI, APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import StreamingResponse, JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from datetime import datetime
from bson import ObjectId
from typing import Optional, List
import base64
import io

from models import *
from auth import hash_password, verify_password, create_access_token, get_current_user

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Helper functions
def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

def format_datetime(dt):
    if isinstance(dt, datetime):
        return dt.isoformat() + 'Z'
    return dt

# ============ AUTHENTICATION ROUTES ============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_doc = {
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hash_password(user_data.password),
        "created_at": datetime.utcnow(),
        "storage_used": 0
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # Create token
    token = create_access_token({"sub": user_id})
    
    return TokenResponse(
        user=UserResponse(id=user_id, email=user_data.email, name=user_data.name),
        token=token
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_id = str(user["_id"])
    token = create_access_token({"sub": user_id})
    
    return TokenResponse(
        user=UserResponse(id=user_id, email=user["email"], name=user["name"]),
        token=token
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(id=str(user["_id"]), email=user["email"], name=user["name"])

# ============ FOLDER ROUTES ============

@api_router.post("/folders", response_model=FolderResponse)
async def create_folder(folder_data: FolderCreate, user_id: str = Depends(get_current_user)):
    folder_doc = {
        "name": folder_data.name,
        "parent_id": ObjectId(folder_data.parentId) if folder_data.parentId else None,
        "owner_id": ObjectId(user_id),
        "created_at": datetime.utcnow(),
        "modified_at": datetime.utcnow(),
        "starred": False,
        "trashed": False
    }
    result = await db.folders.insert_one(folder_doc)
    
    # Log activity
    await log_activity(user_id, "upload", str(result.inserted_id), f"Created folder {folder_data.name}")
    
    return FolderResponse(
        id=str(result.inserted_id),
        name=folder_data.name,
        parentId=folder_data.parentId,
        ownerId=user_id,
        created=format_datetime(folder_doc["created_at"]),
        modified=format_datetime(folder_doc["modified_at"]),
        starred=False,
        trashed=False
    )

# ============ FILE ROUTES ============

@api_router.post("/files/upload", response_model=FileResponse)
async def upload_file(
    file: UploadFile = File(...),
    folderId: Optional[str] = Form(None),
    user_id: str = Depends(get_current_user)
):
    # Read file content
    content = await file.read()
    file_size = len(content)
    
    # For simulation, store small files as base64, larger files as metadata only
    storage_data = None
    if file_size < 1024 * 1024:  # 1MB
        storage_data = base64.b64encode(content).decode('utf-8')
    
    file_doc = {
        "name": file.filename,
        "type": file.content_type,
        "size": file_size,
        "folder_id": ObjectId(folderId) if folderId else None,
        "owner_id": ObjectId(user_id),
        "created_at": datetime.utcnow(),
        "modified_at": datetime.utcnow(),
        "last_opened": None,
        "starred": False,
        "trashed": False,
        "metadata": {
            "original_filename": file.filename,
            "storage_data": storage_data,
            "thumbnail_url": None
        }
    }
    
    result = await db.files.insert_one(file_doc)
    file_id = str(result.inserted_id)
    
    # Update user storage
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$inc": {"storage_used": file_size}}
    )
    
    # Log activity
    await log_activity(user_id, "upload", file_id, f"Uploaded {file.filename}")
    
    return FileResponse(
        id=file_id,
        name=file.filename,
        type=file.content_type,
        size=file_size,
        folderId=folderId,
        ownerId=user_id,
        created=format_datetime(file_doc["created_at"]),
        modified=format_datetime(file_doc["modified_at"]),
        starred=False,
        trashed=False,
        thumbnail=None,
        lastOpened=None,
        url=f"/api/files/{file_id}/download"
    )

@api_router.get("/files/{file_id}/download")
async def download_file(file_id: str, user_id: str = Depends(get_current_user)):
    file_doc = await db.files.find_one({"_id": ObjectId(file_id)})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check permissions
    if str(file_doc["owner_id"]) != user_id:
        share = await db.shares.find_one({"item_id": ObjectId(file_id), "user_id": ObjectId(user_id)})
        if not share:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Update last opened
    await db.files.update_one(
        {"_id": ObjectId(file_id)},
        {"$set": {"last_opened": datetime.utcnow()}}
    )
    
    # Return simulated content
    storage_data = file_doc["metadata"].get("storage_data")
    if storage_data:
        content = base64.b64decode(storage_data)
    else:
        # Generate mock content for larger files
        content = f"Simulated content for {file_doc['name']}\nSize: {file_doc['size']} bytes\nThis is a mock file in the training environment.".encode('utf-8')
    
    return StreamingResponse(
        io.BytesIO(content),
        media_type=file_doc["type"],
        headers={"Content-Disposition": f"attachment; filename={file_doc['name']}"}
    )

@api_router.get("/files/{file_id}/preview")
async def preview_file(file_id: str, user_id: str = Depends(get_current_user)):
    file_doc = await db.files.find_one({"_id": ObjectId(file_id)})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Return preview data
    storage_data = file_doc["metadata"].get("storage_data")
    if storage_data and file_doc["type"].startswith("image/"):
        return {"preview": f"data:{file_doc['type']};base64,{storage_data}"}
    elif file_doc["type"].startswith("text/"):
        if storage_data:
            content = base64.b64decode(storage_data).decode('utf-8')
        else:
            content = "Preview not available for this file."
        return {"preview": content, "type": "text"}
    else:
        return {"preview": None, "message": "Preview not available"}

# ============ DRIVE ITEMS ROUTES ============

@api_router.get("/drive/items", response_model=DriveItemsResponse)
async def get_drive_items(
    view: str = Query("drive"),
    folderId: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    user_id: str = Depends(get_current_user)
):
    folder_query = {"owner_id": ObjectId(user_id)}
    file_query = {"owner_id": ObjectId(user_id)}
    
    # Apply view filters
    if view == "recent":
        file_query["last_opened"] = {"$ne": None}
        file_query["trashed"] = False
        files_cursor = db.files.find(file_query).sort("last_opened", -1).limit(20)
        folders = []
    elif view == "starred":
        folder_query["starred"] = True
        folder_query["trashed"] = False
        file_query["starred"] = True
        file_query["trashed"] = False
        folders_cursor = db.folders.find(folder_query)
        files_cursor = db.files.find(file_query)
    elif view == "shared":
        # Get shared items
        shares = await db.shares.find({"user_id": ObjectId(user_id)}).to_list(1000)
        shared_ids = [s["item_id"] for s in shares]
        folder_query = {"_id": {"$in": shared_ids}, "trashed": False}
        file_query = {"_id": {"$in": shared_ids}, "trashed": False}
        folders_cursor = db.folders.find(folder_query)
        files_cursor = db.files.find(file_query)
    elif view == "trash":
        folder_query["trashed"] = True
        file_query["trashed"] = True
        folders_cursor = db.folders.find(folder_query)
        files_cursor = db.files.find(file_query)
    else:  # drive
        folder_query["trashed"] = False
        file_query["trashed"] = False
        folder_query["parent_id"] = ObjectId(folderId) if folderId else None
        file_query["folder_id"] = ObjectId(folderId) if folderId else None
        folders_cursor = db.folders.find(folder_query)
        files_cursor = db.files.find(file_query)
    
    # Apply search
    if search:
        folder_query["name"] = {"$regex": search, "$options": "i"}
        file_query["name"] = {"$regex": search, "$options": "i"}
        folders_cursor = db.folders.find(folder_query)
        files_cursor = db.files.find(file_query)
    
    if view == "recent":
        folders = []
    else:
        folders = await folders_cursor.to_list(1000)
    files = await files_cursor.to_list(1000)
    
    # Format responses
    folder_responses = []
    for folder in folders:
        folder_responses.append(FolderResponse(
            id=str(folder["_id"]),
            name=folder["name"],
            parentId=str(folder["parent_id"]) if folder.get("parent_id") else None,
            ownerId=str(folder["owner_id"]),
            created=format_datetime(folder["created_at"]),
            modified=format_datetime(folder["modified_at"]),
            starred=folder.get("starred", False),
            trashed=folder.get("trashed", False)
        ))
    
    file_responses = []
    for file in files:
        file_responses.append(FileResponse(
            id=str(file["_id"]),
            name=file["name"],
            type=file["type"],
            size=file["size"],
            folderId=str(file["folder_id"]) if file.get("folder_id") else None,
            ownerId=str(file["owner_id"]),
            created=format_datetime(file["created_at"]),
            modified=format_datetime(file["modified_at"]),
            starred=file.get("starred", False),
            trashed=file.get("trashed", False),
            thumbnail=file["metadata"].get("thumbnail_url"),
            lastOpened=format_datetime(file.get("last_opened")) if file.get("last_opened") else None,
            url=f"/api/files/{str(file['_id'])}/download"
        ))
    
    return DriveItemsResponse(folders=folder_responses, files=file_responses)

# ============ ITEM UPDATE ROUTES ============

@api_router.patch("/items/{item_id}")
async def update_item(item_id: str, update_data: ItemUpdate, user_id: str = Depends(get_current_user)):
    # Try to find as file first
    item = await db.files.find_one({"_id": ObjectId(item_id), "owner_id": ObjectId(user_id)})
    collection = "files"
    
    if not item:
        # Try folder
        item = await db.folders.find_one({"_id": ObjectId(item_id), "owner_id": ObjectId(user_id)})
        collection = "folders"
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Build update dict
    update_dict = {"modified_at": datetime.utcnow()}
    if update_data.name is not None:
        update_dict["name"] = update_data.name
    if update_data.starred is not None:
        update_dict["starred"] = update_data.starred
    if update_data.parentId is not None and collection == "folders":
        update_dict["parent_id"] = ObjectId(update_data.parentId) if update_data.parentId else None
    if update_data.folderId is not None and collection == "files":
        update_dict["folder_id"] = ObjectId(update_data.folderId) if update_data.folderId else None
    
    # Update
    if collection == "files":
        await db.files.update_one({"_id": ObjectId(item_id)}, {"$set": update_dict})
    else:
        await db.folders.update_one({"_id": ObjectId(item_id)}, {"$set": update_dict})
    
    # Log activity
    if update_data.starred is not None:
        action = "starred" if update_data.starred else "unstarred"
        await log_activity(user_id, "star", item_id, f"{action.capitalize()} {item['name']}")
    elif update_data.name is not None:
        await log_activity(user_id, "edit", item_id, f"Renamed to {update_data.name}")
    
    return {"success": True}

@api_router.delete("/items/{item_id}")
async def delete_item(item_id: str, permanent: bool = Query(False), user_id: str = Depends(get_current_user)):
    # Try to find as file first
    item = await db.files.find_one({"_id": ObjectId(item_id), "owner_id": ObjectId(user_id)})
    collection = "files"
    
    if not item:
        # Try folder
        item = await db.folders.find_one({"_id": ObjectId(item_id), "owner_id": ObjectId(user_id)})
        collection = "folders"
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if permanent:
        # Permanent delete
        if collection == "files":
            await db.files.delete_one({"_id": ObjectId(item_id)})
            # Update storage
            await db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$inc": {"storage_used": -item["size"]}}
            )
        else:
            await db.folders.delete_one({"_id": ObjectId(item_id)})
        
        await log_activity(user_id, "delete", item_id, f"Permanently deleted {item['name']}")
        return {"success": True, "message": "Item deleted permanently"}
    else:
        # Move to trash
        if collection == "files":
            await db.files.update_one({"_id": ObjectId(item_id)}, {"$set": {"trashed": True, "modified_at": datetime.utcnow()}})
        else:
            await db.folders.update_one({"_id": ObjectId(item_id)}, {"$set": {"trashed": True, "modified_at": datetime.utcnow()}})
        
        await log_activity(user_id, "delete", item_id, f"Moved {item['name']} to trash")
        return {"success": True, "message": "Item moved to trash"}

@api_router.post("/items/{item_id}/restore")
async def restore_item(item_id: str, user_id: str = Depends(get_current_user)):
    # Try to find as file first
    item = await db.files.find_one({"_id": ObjectId(item_id), "owner_id": ObjectId(user_id)})
    collection = "files"
    
    if not item:
        item = await db.folders.find_one({"_id": ObjectId(item_id), "owner_id": ObjectId(user_id)})
        collection = "folders"
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if collection == "files":
        await db.files.update_one({"_id": ObjectId(item_id)}, {"$set": {"trashed": False, "modified_at": datetime.utcnow()}})
    else:
        await db.folders.update_one({"_id": ObjectId(item_id)}, {"$set": {"trashed": False, "modified_at": datetime.utcnow()}})
    
    await log_activity(user_id, "edit", item_id, f"Restored {item['name']}")
    return {"success": True}

# ============ SHARE ROUTES ============

@api_router.post("/shares", response_model=ShareResponse)
async def create_share(share_data: ShareCreate, user_id: str = Depends(get_current_user)):
    # Find user by email
    target_user = await db.users.find_one({"email": share_data.email})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already shared
    existing_share = await db.shares.find_one({
        "item_id": ObjectId(share_data.itemId),
        "user_id": target_user["_id"]
    })
    
    if existing_share:
        # Update permission
        await db.shares.update_one(
            {"_id": existing_share["_id"]},
            {"$set": {"permission": share_data.permission}}
        )
        share_id = str(existing_share["_id"])
    else:
        share_doc = {
            "item_id": ObjectId(share_data.itemId),
            "item_type": "file",  # Simplified for now
            "user_id": target_user["_id"],
            "shared_by": ObjectId(user_id),
            "permission": share_data.permission,
            "shared_at": datetime.utcnow()
        }
        result = await db.shares.insert_one(share_doc)
        share_id = str(result.inserted_id)
    
    await log_activity(user_id, "share", share_data.itemId, f"Shared with {share_data.email}")
    
    return ShareResponse(
        id=share_id,
        itemId=share_data.itemId,
        userId=str(target_user["_id"]),
        permission=share_data.permission,
        sharedBy=user_id,
        sharedAt=format_datetime(datetime.utcnow())
    )

@api_router.get("/shares/{item_id}")
async def get_shares(item_id: str, user_id: str = Depends(get_current_user)):
    shares = await db.shares.find({"item_id": ObjectId(item_id)}).to_list(1000)
    
    result = []
    for share in shares:
        user = await db.users.find_one({"_id": share["user_id"]})
        if user:
            result.append(ShareWithUser(
                id=str(user["_id"]),
                name=user["name"],
                email=user["email"],
                permission=share["permission"]
            ))
    
    return result

@api_router.delete("/shares/{share_id}")
async def delete_share(share_id: str, user_id: str = Depends(get_current_user)):
    result = await db.shares.delete_one({"_id": ObjectId(share_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Share not found")
    
    return {"success": True}

# ============ COMMENT ROUTES ============

@api_router.post("/comments", response_model=CommentResponse)
async def create_comment(comment_data: CommentCreate, user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    comment_doc = {
        "file_id": ObjectId(comment_data.fileId),
        "user_id": ObjectId(user_id),
        "text": comment_data.text,
        "created_at": datetime.utcnow()
    }
    result = await db.comments.insert_one(comment_doc)
    
    return CommentResponse(
        id=str(result.inserted_id),
        fileId=comment_data.fileId,
        userId=user_id,
        userName=user["name"],
        text=comment_data.text,
        timestamp=format_datetime(comment_doc["created_at"])
    )

@api_router.get("/comments/{file_id}")
async def get_comments(file_id: str, user_id: str = Depends(get_current_user)):
    comments = await db.comments.find({"file_id": ObjectId(file_id)}).to_list(1000)
    
    result = []
    for comment in comments:
        user = await db.users.find_one({"_id": comment["user_id"]})
        result.append(CommentResponse(
            id=str(comment["_id"]),
            fileId=file_id,
            userId=str(comment["user_id"]),
            userName=user["name"] if user else "Unknown",
            text=comment["text"],
            timestamp=format_datetime(comment["created_at"])
        ))
    
    return result

# ============ ACTIVITY ROUTES ============

async def log_activity(user_id: str, activity_type: str, item_id: str, description: str):
    activity_doc = {
        "type": activity_type,
        "user_id": ObjectId(user_id),
        "item_id": ObjectId(item_id) if item_id else None,
        "description": description,
        "timestamp": datetime.utcnow()
    }
    await db.activities.insert_one(activity_doc)

@api_router.get("/activities")
async def get_activities(limit: int = Query(20), offset: int = Query(0), user_id: str = Depends(get_current_user)):
    activities = await db.activities.find({"user_id": ObjectId(user_id)}).sort("timestamp", -1).skip(offset).limit(limit).to_list(limit)
    
    result = []
    for activity in activities:
        result.append(ActivityResponse(
            id=str(activity["_id"]),
            type=activity["type"],
            userId=user_id,
            fileId=str(activity["item_id"]) if activity.get("item_id") else None,
            description=activity["description"],
            timestamp=format_datetime(activity["timestamp"])
        ))
    
    return result

# ============ STORAGE ROUTES ============

@api_router.get("/storage", response_model=StorageResponse)
async def get_storage(user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    # Calculate breakdown
    files = await db.files.find({"owner_id": ObjectId(user_id), "trashed": False}).to_list(10000)
    breakdown = {
        "documents": 0,
        "images": 0,
        "videos": 0,
        "other": 0
    }
    
    for file in files:
        file_type = file["type"]
        if "document" in file_type or "pdf" in file_type or "word" in file_type or "sheet" in file_type:
            breakdown["documents"] += file["size"]
        elif "image" in file_type:
            breakdown["images"] += file["size"]
        elif "video" in file_type:
            breakdown["videos"] += file["size"]
        else:
            breakdown["other"] += file["size"]
    
    return StorageResponse(
        used=user.get("storage_used", 0),
        total=107374182400,  # 100 GB
        breakdown=breakdown
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()