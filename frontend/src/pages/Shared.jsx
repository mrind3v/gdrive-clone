import React from 'react';
import FileGrid from '../components/FileGrid';
import { Users } from 'lucide-react';

const Shared = ({ files, folders, viewMode, searchQuery, onItemClick, onItemAction, shares, users }) => {
  // Get files that are shared with the current user or by the current user
  const getSharedItems = () => {
    const sharedFileIds = shares.map(s => s.fileId);
    const sharedFiles = files.filter(f => sharedFileIds.includes(f.id) && !f.trashed);
    const sharedFolders = folders.filter(f => sharedFileIds.includes(f.id) && !f.trashed);
    return [...sharedFolders, ...sharedFiles].sort((a, b) => 
      new Date(b.modified) - new Date(a.modified)
    );
  };

  const sharedItems = getSharedItems();

  // Apply search filter
  const filteredItems = searchQuery
    ? sharedItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : sharedItems;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-medium text-gray-900">Shared with me</h2>
        <p className="text-sm text-gray-600 mt-1">Files and folders others have shared with you</p>
      </div>

      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <Users className="w-16 h-16 mb-4 text-gray-300" />
          <p className="text-lg font-medium">No shared items</p>
          <p className="text-sm">Items shared with you will appear here</p>
        </div>
      ) : (
        <>
          {searchQuery && (
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Found {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} for "{searchQuery}"
              </p>
            </div>
          )}
          <FileGrid
            items={filteredItems}
            viewMode={viewMode}
            onItemClick={onItemClick}
            onItemAction={onItemAction}
          />
        </>
      )}
    </div>
  );
};

export default Shared;
