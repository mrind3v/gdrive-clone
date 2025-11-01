import React from 'react';
import FileGrid from '../components/FileGrid';
import { ChevronRight, Home } from 'lucide-react';
import { Button } from '../components/ui/button';

const MyDrive = ({ files, folders, viewMode, searchQuery, currentFolder, onItemClick, onItemAction, onFolderChange }) => {
  // Get current folder path for breadcrumbs
  const getFolderPath = (folderId) => {
    const path = [];
    let current = folderId;
    while (current) {
      const folder = folders.find(f => f.id === current);
      if (folder) {
        path.unshift(folder);
        current = folder.parentId;
      } else {
        break;
      }
    }
    return path;
  };

  const folderPath = currentFolder ? getFolderPath(currentFolder) : [];

  // Filter items based on current folder and search
  const filterItems = (items, isFile = false) => {
    return items.filter(item => {
      // Must not be trashed
      if (item.trashed) return false;
      
      // Must be in current folder
      const itemFolder = isFile ? item.folderId : item.parentId;
      if (itemFolder !== currentFolder) return false;
      
      // Search filter
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  };

  const filteredFolders = filterItems(folders);
  const filteredFiles = filterItems(files, true);
  const allItems = [...filteredFolders, ...filteredFiles];

  return (
    <div className="p-8">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFolderChange(null)}
            className="h-8 px-2 text-gray-600 hover:text-gray-900"
          >
            <Home className="w-4 h-4 mr-1" />
            My Drive
          </Button>
          {folderPath.map((folder) => (
            <React.Fragment key={folder.id}>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFolderChange(folder.id)}
                className="h-8 px-2 text-gray-600 hover:text-gray-900"
              >
                {folder.name}
              </Button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content */}
      {allItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <Home className="w-16 h-16 mb-4 text-gray-300" />
          <p className="text-lg font-medium">This folder is empty</p>
          <p className="text-sm">Click "New" to add files or folders</p>
        </div>
      ) : (
        <>
          {searchQuery && (
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Found {allItems.length} result{allItems.length !== 1 ? 's' : ''} for "{searchQuery}"
              </p>
            </div>
          )}
          <FileGrid
            items={allItems}
            viewMode={viewMode}
            onItemClick={onItemClick}
            onItemAction={onItemAction}
          />
        </>
      )}
    </div>
  );
};

export default MyDrive;
