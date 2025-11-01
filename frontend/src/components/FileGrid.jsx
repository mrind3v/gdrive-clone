import React from 'react';
import { FileText, Folder, MoreVertical, Star, Trash2, Share2, Download, Edit } from 'lucide-react';
import { formatFileSize, formatDate } from '../utils/helpers';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';

const FileGrid = ({ items, viewMode, onItemClick, onItemAction, itemType = 'mixed' }) => {
  const getFileTypeIcon = (type) => {
    if (!type) return Folder;
    if (type.startsWith('image/')) return FileText;
    if (type.startsWith('video/')) return FileText;
    if (type === 'application/pdf') return FileText;
    if (type.includes('word')) return FileText;
    if (type.includes('sheet')) return FileText;
    if (type.includes('presentation')) return FileText;
    return FileText;
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-200 text-sm font-medium text-gray-600">
          <div className="col-span-5">Name</div>
          <div className="col-span-2">Owner</div>
          <div className="col-span-2">Last modified</div>
          <div className="col-span-2">File size</div>
          <div className="col-span-1"></div>
        </div>
        <div className="divide-y divide-gray-100">
          {items.map((item) => {
            const Icon = item.type ? getFileTypeIcon(item.type) : Folder;
            const isFolder = !item.type;
            return (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors items-center"
                onClick={() => onItemClick(item)}
              >
                <div className="col-span-5 flex items-center gap-3">
                  {isFolder ? (
                    <Folder className="w-5 h-5 text-gray-400" />
                  ) : item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.name} className="w-8 h-8 object-cover rounded" />
                  ) : (
                    <Icon className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-900 truncate">{item.name}</span>
                  {item.starred && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                </div>
                <div className="col-span-2 text-sm text-gray-600">me</div>
                <div className="col-span-2 text-sm text-gray-600">{formatDate(item.modified)}</div>
                <div className="col-span-2 text-sm text-gray-600">
                  {isFolder ? '—' : formatFileSize(item.size)}
                </div>
                <div className="col-span-1 flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onItemAction('share', item); }}>
                        <Share2 className="w-4 h-4 mr-2" /> Share
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onItemAction('download', item); }}>
                        <Download className="w-4 h-4 mr-2" /> Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onItemAction('rename', item); }}>
                        <Edit className="w-4 h-4 mr-2" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onItemAction('star', item); }}>
                        <Star className="w-4 h-4 mr-2" /> {item.starred ? 'Unstar' : 'Star'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); onItemAction('trash', item); }}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> {item.trashed ? 'Delete forever' : 'Move to trash'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {items.map((item) => {
        const Icon = item.type ? getFileTypeIcon(item.type) : Folder;
        const isFolder = !item.type;
        return (
          <div
            key={item.id}
            className="group relative bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
            onClick={() => onItemClick(item)}
          >
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 bg-white">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onItemAction('share', item); }}>
                    <Share2 className="w-4 h-4 mr-2" /> Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onItemAction('download', item); }}>
                    <Download className="w-4 h-4 mr-2" /> Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onItemAction('rename', item); }}>
                    <Edit className="w-4 h-4 mr-2" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onItemAction('star', item); }}>
                    <Star className="w-4 h-4 mr-2" /> {item.starred ? 'Unstar' : 'Star'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); onItemAction('trash', item); }}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> {item.trashed ? 'Delete forever' : 'Move to trash'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {item.starred && (
              <Star className="absolute top-2 left-2 w-4 h-4 text-yellow-500 fill-yellow-500" />
            )}

            <div className="flex flex-col items-center gap-3">
              {isFolder ? (
                <Folder className="w-16 h-16 text-gray-400" />
              ) : item.thumbnail ? (
                <img src={item.thumbnail} alt={item.name} className="w-full h-24 object-cover rounded" />
              ) : (
                <Icon className="w-16 h-16 text-gray-400" />
              )}
              <div className="w-full text-center">
                <p className="text-sm text-gray-900 truncate" title={item.name}>{item.name}</p>
                {!isFolder && (
                  <p className="text-xs text-gray-500 mt-1">{formatFileSize(item.size)}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FileGrid;
