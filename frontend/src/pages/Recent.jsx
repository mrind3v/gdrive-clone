import React from 'react';
import FileGrid from '../components/FileGrid';
import { Clock } from 'lucide-react';

const Recent = ({ files, folders, viewMode, searchQuery, onItemClick, onItemAction }) => {
  // Get all non-trashed files with lastOpened date
  const recentFiles = files
    .filter(f => !f.trashed && f.lastOpened)
    .sort((a, b) => new Date(b.lastOpened) - new Date(a.lastOpened))
    .slice(0, 20); // Show last 20 files

  // Apply search filter
  const filteredFiles = searchQuery
    ? recentFiles.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : recentFiles;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-medium text-gray-900">Recent</h2>
        <p className="text-sm text-gray-600 mt-1">Files you've opened recently</p>
      </div>

      {filteredFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <Clock className="w-16 h-16 mb-4 text-gray-300" />
          <p className="text-lg font-medium">No recent files</p>
          <p className="text-sm">Files you open will appear here</p>
        </div>
      ) : (
        <>
          {searchQuery && (
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Found {filteredFiles.length} result{filteredFiles.length !== 1 ? 's' : ''} for "{searchQuery}"
              </p>
            </div>
          )}
          <FileGrid
            items={filteredFiles}
            viewMode={viewMode}
            onItemClick={onItemClick}
            onItemAction={onItemAction}
          />
        </>
      )}
    </div>
  );
};

export default Recent;
