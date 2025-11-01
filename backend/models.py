from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str

class TokenResponse(BaseModel):
    user: UserResponse
    token: str

class FolderCreate(BaseModel):
    name: str
    parentId: Optional[str] = None

class FolderResponse(BaseModel):
    id: str
    name: str
    parentId: Optional[str] = None
    ownerId: str
    created: str
    modified: str
    starred: bool = False
    trashed: bool = False

class FileResponse(BaseModel):
    id: str
    name: str
    type: str
    size: int
    folderId: Optional[str] = None
    ownerId: str
    created: str
    modified: str
    starred: bool = False
    trashed: bool = False
    thumbnail: Optional[str] = None
    lastOpened: Optional[str] = None
    url: Optional[str] = None

class ItemUpdate(BaseModel):
    name: Optional[str] = None
    starred: Optional[bool] = None
    parentId: Optional[str] = None
    folderId: Optional[str] = None

class ShareCreate(BaseModel):
    itemId: str
    email: str
    permission: str  # viewer, commenter, editor

class ShareResponse(BaseModel):
    id: str
    itemId: str
    userId: str
    permission: str
    sharedBy: str
    sharedAt: str

class ShareWithUser(BaseModel):
    id: str
    name: str
    email: str
    permission: str

class CommentCreate(BaseModel):
    fileId: str
    text: str

class CommentResponse(BaseModel):
    id: str
    fileId: str
    userId: str
    userName: str
    text: str
    timestamp: str

class ActivityResponse(BaseModel):
    id: str
    type: str
    userId: str
    fileId: Optional[str] = None
    description: str
    timestamp: str

class StorageResponse(BaseModel):
    used: int
    total: int
    breakdown: dict

class DriveItemsResponse(BaseModel):
    folders: List[FolderResponse]
    files: List[FileResponse]
