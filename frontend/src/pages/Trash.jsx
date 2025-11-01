import React from 'react';
import FileGrid from '../components/FileGrid';
import { Trash2, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';

const Trash = ({ files, folders, viewMode, searchQuery, onItemClick, onItemAction }) => {
  // Get all trashed items
  const trashedFolders = folders.filter(f => f.trashed);
  const trashedFiles = files.filter(f => f.trashed);
  const allTrashedItems = [...trashedFolders, ...trashedFiles].sort((a, b) => 
    new Date(b.modified) - new Date(a.modified)
  );

  // Apply search filter
  const filteredItems = searchQuery
    ? allTrashedItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : allTrashedItems;

  const handleEmptyTrash = () => {
    if (window.confirm('Are you sure you want to permanently delete all items in trash? This action cannot be undone.')) {
      allTrashedItems.forEach(item => {
        onItemAction('trash', item);
      });
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-medium text-gray-900">Trash</h2>
            <p className="text-sm text-gray-600 mt-1">Items in trash will be deleted forever after 30 days</p>
          </div>
          {filteredItems.length > 0 && (
            <Button variant="outline" onClick={handleEmptyTrash} className="text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4 mr-2" />
              Empty trash
            </Button>
          )}
        </div>
      </div>

      {filteredItems.length > 0 && (
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <AlertDescription className="text-sm text-amber-800">
            Items in trash can be restored or permanently deleted. Items are automatically deleted after 30 days.
          </AlertDescription>
        </Alert>
      )}

      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <Trash2 className="w-16 h-16 mb-4 text-gray-300" />
          <p className="text-lg font-medium">Trash is empty</p>
          <p className="text-sm">Items you delete will appear here</p>
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

export default Trash;
