import React from 'react';
import FileGrid from '../components/FileGrid';
import { Star } from 'lucide-react';

const Starred = ({ files, folders, viewMode, searchQuery, onItemClick, onItemAction }) => {
  // Get all starred items that are not trashed
  const starredFolders = folders.filter(f => f.starred && !f.trashed);
  const starredFiles = files.filter(f => f.starred && !f.trashed);
  const allStarredItems = [...starredFolders, ...starredFiles].sort((a, b) => 
    new Date(b.modified) - new Date(a.modified)
  );

  // Apply search filter
  const filteredItems = searchQuery
    ? allStarredItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : allStarredItems;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-medium text-gray-900">Starred</h2>
        <p className="text-sm text-gray-600 mt-1">Files and folders you've starred</p>
      </div>

      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <Star className="w-16 h-16 mb-4 text-gray-300" />
          <p className="text-lg font-medium">No starred items</p>
          <p className="text-sm">Star important files and folders to find them easily</p>
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

export default Starred;
