// Mock data for Google Drive clone
import { v4 as uuidv4 } from 'uuid';

// Mock users
export const mockUsers = [
  { id: '1', email: 'john@example.com', name: 'John Doe', password: 'password123' },
  { id: '2', email: 'jane@example.com', name: 'Jane Smith', password: 'password123' },
  { id: '3', email: 'bob@example.com', name: 'Bob Johnson', password: 'password123' },
];

// Mock folders
export const mockFolders = [
  { id: 'f1', name: 'Work Documents', parentId: null, ownerId: '1', created: '2024-01-15T10:00:00Z', modified: '2024-01-20T15:30:00Z', starred: false, trashed: false },
  { id: 'f2', name: 'Personal', parentId: null, ownerId: '1', created: '2024-01-10T09:00:00Z', modified: '2024-01-25T11:00:00Z', starred: true, trashed: false },
  { id: 'f3', name: 'Projects', parentId: 'f1', ownerId: '1', created: '2024-01-16T14:00:00Z', modified: '2024-01-22T16:00:00Z', starred: false, trashed: false },
  { id: 'f4', name: 'Photos', parentId: 'f2', ownerId: '1', created: '2024-01-12T08:00:00Z', modified: '2024-01-24T10:00:00Z', starred: false, trashed: false },
  { id: 'f5', name: 'Archive', parentId: null, ownerId: '1', created: '2024-01-05T12:00:00Z', modified: '2024-01-18T14:00:00Z', starred: false, trashed: true },
];

// Mock files with various types
export const mockFiles = [
  { id: 'file1', name: 'Project Proposal.pdf', type: 'application/pdf', size: 2458624, folderId: 'f1', ownerId: '1', created: '2024-01-15T10:30:00Z', modified: '2024-01-20T15:45:00Z', starred: false, trashed: false, thumbnail: null, lastOpened: '2024-01-26T09:00:00Z' },
  { id: 'file2', name: 'Budget 2024.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 156789, folderId: 'f1', ownerId: '1', created: '2024-01-16T11:00:00Z', modified: '2024-01-21T10:00:00Z', starred: true, trashed: false, thumbnail: null, lastOpened: '2024-01-25T14:00:00Z' },
  { id: 'file3', name: 'Meeting Notes.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 45678, folderId: 'f3', ownerId: '1', created: '2024-01-17T09:00:00Z', modified: '2024-01-22T16:30:00Z', starred: false, trashed: false, thumbnail: null, lastOpened: '2024-01-27T08:00:00Z' },
  { id: 'file4', name: 'Vacation.jpg', type: 'image/jpeg', size: 3456789, folderId: 'f4', ownerId: '1', created: '2024-01-12T14:00:00Z', modified: '2024-01-12T14:00:00Z', starred: true, trashed: false, thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400', lastOpened: '2024-01-24T12:00:00Z' },
  { id: 'file5', name: 'Presentation.pptx', type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', size: 8901234, folderId: 'f3', ownerId: '1', created: '2024-01-18T10:00:00Z', modified: '2024-01-23T11:00:00Z', starred: false, trashed: false, thumbnail: null, lastOpened: '2024-01-26T16:00:00Z' },
  { id: 'file6', name: 'Tutorial.mp4', type: 'video/mp4', size: 45678901, folderId: null, ownerId: '1', created: '2024-01-14T13:00:00Z', modified: '2024-01-14T13:00:00Z', starred: false, trashed: false, thumbnail: null, lastOpened: '2024-01-23T10:00:00Z' },
  { id: 'file7', name: 'Contract.pdf', type: 'application/pdf', size: 567890, folderId: 'f1', ownerId: '1', created: '2024-01-19T15:00:00Z', modified: '2024-01-24T09:00:00Z', starred: false, trashed: false, thumbnail: null, lastOpened: '2024-01-27T11:00:00Z' },
  { id: 'file8', name: 'Logo.png', type: 'image/png', size: 234567, folderId: 'f2', ownerId: '1', created: '2024-01-11T12:00:00Z', modified: '2024-01-11T12:00:00Z', starred: false, trashed: false, thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400', lastOpened: '2024-01-25T15:00:00Z' },
  { id: 'file9', name: 'Old Report.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 123456, folderId: 'f5', ownerId: '1', created: '2024-01-05T14:00:00Z', modified: '2024-01-05T14:00:00Z', starred: false, trashed: true, thumbnail: null, lastOpened: null },
  { id: 'file10', name: 'README.txt', type: 'text/plain', size: 5678, folderId: null, ownerId: '1', created: '2024-01-20T08:00:00Z', modified: '2024-01-20T08:00:00Z', starred: false, trashed: false, thumbnail: null, lastOpened: '2024-01-26T10:00:00Z' },
];

// Mock shares
export const mockShares = [
  { id: 's1', fileId: 'file1', userId: '2', permission: 'viewer', sharedBy: '1', sharedAt: '2024-01-21T10:00:00Z' },
  { id: 's2', fileId: 'file2', userId: '3', permission: 'editor', sharedBy: '1', sharedAt: '2024-01-22T11:00:00Z' },
  { id: 's3', folderId: 'f3', userId: '2', permission: 'commenter', sharedBy: '1', sharedAt: '2024-01-23T09:00:00Z' },
];

// Mock activities
export const mockActivities = [
  { id: 'a1', type: 'upload', userId: '1', fileId: 'file7', timestamp: '2024-01-27T11:00:00Z', description: 'Uploaded Contract.pdf' },
  { id: 'a2', type: 'share', userId: '1', fileId: 'file1', sharedWith: '2', timestamp: '2024-01-27T10:30:00Z', description: 'Shared Project Proposal.pdf with Jane Smith' },
  { id: 'a3', type: 'edit', userId: '1', fileId: 'file3', timestamp: '2024-01-27T09:45:00Z', description: 'Modified Meeting Notes.docx' },
  { id: 'a4', type: 'delete', userId: '1', fileId: 'file9', timestamp: '2024-01-27T09:00:00Z', description: 'Moved Old Report.docx to trash' },
  { id: 'a5', type: 'star', userId: '1', fileId: 'file2', timestamp: '2024-01-26T16:00:00Z', description: 'Starred Budget 2024.xlsx' },
];

// Mock comments
export const mockComments = [
  { id: 'c1', fileId: 'file1', userId: '2', userName: 'Jane Smith', text: 'Looks great! Just a few suggestions...', timestamp: '2024-01-26T14:00:00Z' },
  { id: 'c2', fileId: 'file1', userId: '1', userName: 'John Doe', text: 'Thanks for the feedback!', timestamp: '2024-01-26T15:00:00Z' },
];

// Storage info
export const mockStorageInfo = {
  used: 67234567890, // bytes
  total: 107374182400, // 100 GB
  breakdown: {
    documents: 12345678,
    images: 23456789,
    videos: 45678901,
    other: 5678901,
  }
};

// Helper functions
export const getFileIcon = (type) => {
  if (type.startsWith('image/')) return '🖼️';
  if (type.startsWith('video/')) return '🎥';
  if (type === 'application/pdf') return '📄';
  if (type.includes('word')) return '📝';
  if (type.includes('sheet') || type.includes('excel')) return '📊';
  if (type.includes('presentation') || type.includes('powerpoint')) return '📽️';
  if (type.startsWith('text/')) return '📃';
  return '📎';
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return date.toLocaleDateString();
};
