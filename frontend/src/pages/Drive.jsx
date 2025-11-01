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

  const handleCreateFolder = async (name) => {
    try {
      await folders.create({ name, parentId: currentFolder });
      toast({
        title: 'Folder created',
        description: `"${name}" has been created successfully.`,
      });
      fetchData();
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: 'Error',
        description: 'Failed to create folder',
        variant: 'destructive',
      });
    }
  };

  const handleUploadFile = async (fileList) => {
    for (const file of fileList) {
      const fileId = Date.now() + Math.random();
      setUploadingFiles(prev => [...prev, { id: fileId, name: file.name, progress: 0 }]);

      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadingFiles(prev => 
            prev.map(f => f.id === fileId && f.progress < 90 ? { ...f, progress: f.progress + 10 } : f)
          );
        }, 200);

        await files.upload(file, currentFolder);
        
        clearInterval(progressInterval);
        setUploadingFiles(prev => prev.map(f => f.id === fileId ? { ...f, progress: 100 } : f));
        
        setTimeout(() => {
          setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
          fetchData();
          fetchStorage();
        }, 500);
      } catch (error) {
        console.error('Error uploading file:', error);
        setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
        toast({
          title: 'Upload failed',
          description: `Failed to upload ${file.name}`,
          variant: 'destructive',
        });
      }
    }
  };

  const handleItemAction = async (action, item) => {
    try {
      switch (action) {
        case 'star':
          await items.update(item.id, { starred: !item.starred });
          toast({
            title: item.starred ? 'Removed from starred' : 'Added to starred',
            description: `${item.name} ${item.starred ? 'unstarred' : 'starred'}`,
          });
          fetchData();
          break;
        case 'trash':
          if (item.trashed) {
            // Permanent delete
            await items.delete(item.id, true);
            toast({
              title: 'Deleted permanently',
              description: `${item.name} has been deleted forever`,
            });
          } else {
            // Move to trash
            await items.delete(item.id, false);
            toast({
              title: 'Moved to trash',
              description: `${item.name} moved to trash`,
            });
          }
          fetchData();
          fetchStorage();
          break;
        case 'restore':
          await items.restore(item.id);
          toast({
            title: 'Restored',
            description: `${item.name} has been restored`,
          });
          fetchData();
          break;
        case 'share':
          setSelectedItem(item);
          setShowShareModal(true);
          break;
        case 'download':
          try {
            const response = await files.download(item.id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', item.name);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast({
              title: 'Download started',
              description: `Downloading ${item.name}`,
            });
          } catch (error) {
            toast({
              title: 'Download failed',
              description: 'Could not download file',
              variant: 'destructive',
            });
          }
          break;
        case 'rename':
          const newName = prompt('Enter new name:', item.name);
          if (newName && newName.trim()) {
            await items.update(item.id, { name: newName });
            toast({
              title: 'Renamed',
              description: `Renamed to ${newName}`,
            });
            fetchData();
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error performing action:', error);
      toast({
        title: 'Error',
        description: 'Action failed',
        variant: 'destructive',
      });
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

  const handleShare = async (itemId, email, permission) => {
    try {
      await sharesApi.create({ itemId, email, permission });
      toast({
        title: 'Shared successfully',
        description: `Shared with ${email}`,
      });
      // Refresh shares for this item
      if (selectedItem && selectedItem.id === itemId) {
        const response = await sharesApi.getShares(itemId);
        // Update local state if needed
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: 'Share failed',
        description: error.response?.data?.detail || 'Failed to share item',
        variant: 'destructive',
      });
    }
  };

  const handleRevokeAccess = async (itemId, shareId) => {
    try {
      await sharesApi.delete(shareId);
      toast({
        title: 'Access revoked',
        description: 'User access has been removed',
      });
    } catch (error) {
      console.error('Error revoking access:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke access',
        variant: 'destructive',
      });
    }
  };

  const handleAddComment = async (fileId, text) => {
    try {
      await commentsApi.create({ fileId, text });
      toast({
        title: 'Comment added',
        description: 'Your comment has been posted',
      });
      // Refresh comments
      const response = await commentsApi.getComments(fileId);
      setComments(response.data);
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive',
      });
    }
  };

  const getSharedUsers = async (itemId) => {
    try {
      const response = await sharesApi.getShares(itemId);
      return response.data;
    } catch (error) {
      console.error('Error fetching shared users:', error);
      return [];
    }
  };

  const getFileComments = async (fileId) => {
    try {
      const response = await commentsApi.getComments(fileId);
      return response.data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
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
          storageUsed={storageInfo.used}
          storageTotal={storageInfo.total}
        />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<MyDrive {...commonProps} />} />
            <Route path="/drive" element={<MyDrive {...commonProps} />} />
            <Route path="/recent" element={<Recent {...commonProps} />} />
            <Route path="/starred" element={<Starred {...commonProps} />} />
            <Route path="/shared" element={<Shared {...commonProps} shares={shares} />} />
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
        onShare={handleShare}
        onRevokeAccess={handleRevokeAccess}
        getSharedUsers={getSharedUsers}
      />
      <FilePreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        file={selectedItem}
        onAction={handleItemAction}
        onAddComment={handleAddComment}
        getComments={getFileComments}
      />
    </div>
  );
};

export default Drive;
