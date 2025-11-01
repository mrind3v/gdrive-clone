import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MyDrive from './MyDrive';
import Recent from './Recent';
import Starred from './Starred';
import Shared from './Shared';
import Trash from './Trash';
import NewItemModal from '../components/NewItemModal';
import ShareModal from '../components/ShareModal';
import FilePreviewModal from '../components/FilePreviewModal';
import { useToast } from '../hooks/use-toast';
import { drive, folders, files, items, shares as sharesApi, comments as commentsApi, storage as storageApi } from '../api/client';

const Drive = ({ currentUser, onLogout }) => {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [shares, setShares] = useState([]);
  const [comments, setComments] = useState([]);
  const [storageInfo, setStorageInfo] = useState({ used: 0, total: 107374182400, breakdown: {} });
  const [currentView, setCurrentView] = useState('drive');
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolder, setCurrentFolder] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch data on mount and when view/folder changes
  useEffect(() => {
    fetchData();
    fetchStorage();
  }, [currentView, currentFolder, searchQuery]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await drive.getItems({
        view: currentView,
        folderId: currentFolder,
        search: searchQuery,
      });
      setFiles(response.data.files);
      setFolders(response.data.folders);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch items',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStorage = async () => {
    try {
      const response = await storageApi.get();
      setStorageInfo(response.data);
    } catch (error) {
      console.error('Error fetching storage:', error);
    }
  };

  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/' || path === '/drive') setCurrentView('drive');
    else if (path === '/recent') setCurrentView('recent');
    else if (path === '/starred') setCurrentView('starred');
    else if (path === '/shared') setCurrentView('shared');
    else if (path === '/trash') setCurrentView('trash');
  }, []);

  const handleViewChange = (view) => {
    setCurrentView(view);
    navigate(`/${view === 'drive' ? '' : view}`);
    setCurrentFolder(null);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleCreateFolder = (name) => {
    const newFolder = {
      id: uuidv4(),
      name,
      parentId: currentFolder,
      ownerId: currentUser.id,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      starred: false,
      trashed: false,
    };
    setFolders([...folders, newFolder]);
  };

  const handleUploadFile = (fileList) => {
    const newFiles = Array.from(fileList).map((file) => ({
      id: uuidv4(),
      name: file.name,
      type: file.type,
      size: file.size,
      folderId: currentFolder,
      ownerId: currentUser.id,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      starred: false,
      trashed: false,
      thumbnail: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      lastOpened: null,
    }));

    // Simulate upload with progress
    newFiles.forEach((file, index) => {
      setUploadingFiles(prev => [...prev, { ...file, progress: 0 }]);
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        if (progress >= 100) {
          clearInterval(interval);
          setUploadingFiles(prev => prev.filter(f => f.id !== file.id));
          setFiles(prev => [...prev, file]);
        } else {
          setUploadingFiles(prev => prev.map(f => f.id === file.id ? { ...f, progress } : f));
        }
      }, 200);
    });
  };

  const handleItemAction = (action, item) => {
    switch (action) {
      case 'star':
        if (item.type) {
          setFiles(files.map(f => f.id === item.id ? { ...f, starred: !f.starred } : f));
        } else {
          setFolders(folders.map(f => f.id === item.id ? { ...f, starred: !f.starred } : f));
        }
        toast({
          title: item.starred ? 'Removed from starred' : 'Added to starred',
          description: `${item.name} ${item.starred ? 'unstarred' : 'starred'}`,
        });
        break;
      case 'trash':
        if (item.trashed) {
          // Permanent delete
          if (item.type) {
            setFiles(files.filter(f => f.id !== item.id));
          } else {
            setFolders(folders.filter(f => f.id !== item.id));
          }
          toast({
            title: 'Deleted permanently',
            description: `${item.name} has been deleted forever`,
          });
        } else {
          // Move to trash
          if (item.type) {
            setFiles(files.map(f => f.id === item.id ? { ...f, trashed: true } : f));
          } else {
            setFolders(folders.map(f => f.id === item.id ? { ...f, trashed: true } : f));
          }
          toast({
            title: 'Moved to trash',
            description: `${item.name} moved to trash`,
          });
        }
        break;
      case 'restore':
        if (item.type) {
          setFiles(files.map(f => f.id === item.id ? { ...f, trashed: false } : f));
        } else {
          setFolders(folders.map(f => f.id === item.id ? { ...f, trashed: false } : f));
        }
        toast({
          title: 'Restored',
          description: `${item.name} has been restored`,
        });
        break;
      case 'share':
        setSelectedItem(item);
        setShowShareModal(true);
        break;
      case 'download':
        toast({
          title: 'Download started',
          description: `Downloading ${item.name}`,
        });
        break;
      case 'rename':
        const newName = prompt('Enter new name:', item.name);
        if (newName && newName.trim()) {
          if (item.type) {
            setFiles(files.map(f => f.id === item.id ? { ...f, name: newName } : f));
          } else {
            setFolders(folders.map(f => f.id === item.id ? { ...f, name: newName } : f));
          }
          toast({
            title: 'Renamed',
            description: `Renamed to ${newName}`,
          });
        }
        break;
      default:
        break;
    }
  };

  const handleItemClick = (item) => {
    if (item.type) {
      // It's a file, open preview
      setSelectedItem(item);
      setShowPreviewModal(true);
    } else {
      // It's a folder, navigate into it
      setCurrentFolder(item.id);
    }
  };

  const handleShare = (itemId, email, permission) => {
    const user = mockUsers.find(u => u.email === email);
    if (user) {
      const newShare = {
        id: uuidv4(),
        fileId: itemId,
        userId: user.id,
        permission,
        sharedBy: currentUser.id,
        sharedAt: new Date().toISOString(),
      };
      setShares([...shares, newShare]);
    }
  };

  const handleRevokeAccess = (itemId, userId) => {
    setShares(shares.filter(s => !(s.fileId === itemId && s.userId === userId)));
  };

  const handleAddComment = (fileId, text) => {
    const newComment = {
      id: uuidv4(),
      fileId,
      userId: currentUser.id,
      userName: currentUser.name,
      text,
      timestamp: new Date().toISOString(),
    };
    setComments([...comments, newComment]);
  };

  const getSharedUsers = (itemId) => {
    return shares
      .filter(s => s.fileId === itemId)
      .map(s => {
        const user = mockUsers.find(u => u.id === s.userId);
        return { ...user, permission: s.permission };
      });
  };

  const getFileComments = (fileId) => {
    return comments.filter(c => c.fileId === fileId);
  };

  const commonProps = {
    files,
    folders,
    viewMode,
    searchQuery,
    currentFolder,
    onItemClick: handleItemClick,
    onItemAction: handleItemAction,
    onFolderChange: setCurrentFolder,
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header
        onSearch={handleSearch}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        currentUser={currentUser}
        onLogout={onLogout}
      />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentView={currentView}
          onViewChange={handleViewChange}
          onNewClick={() => setShowNewModal(true)}
          storageUsed={mockStorageInfo.used}
          storageTotal={mockStorageInfo.total}
        />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<MyDrive {...commonProps} />} />
            <Route path="/drive" element={<MyDrive {...commonProps} />} />
            <Route path="/recent" element={<Recent {...commonProps} />} />
            <Route path="/starred" element={<Starred {...commonProps} />} />
            <Route path="/shared" element={<Shared {...commonProps} shares={shares} users={mockUsers} />} />
            <Route path="/trash" element={<Trash {...commonProps} />} />
          </Routes>
        </main>
      </div>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-lg border p-4 space-y-2">
          <h4 className="font-medium text-sm">Uploading files...</h4>
          {uploadingFiles.map(file => (
            <div key={file.id} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="truncate">{file.name}</span>
                <span>{file.progress}%</span>
              </div>
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${file.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <NewItemModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreateFolder={handleCreateFolder}
        onUploadFile={handleUploadFile}
      />
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        item={selectedItem}
        sharedUsers={selectedItem ? getSharedUsers(selectedItem.id) : []}
        onShare={handleShare}
        onRevokeAccess={handleRevokeAccess}
      />
      <FilePreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        file={selectedItem}
        comments={selectedItem ? getFileComments(selectedItem.id) : []}
        onAddComment={handleAddComment}
        onAction={handleItemAction}
      />
    </div>
  );
};

export default Drive;
