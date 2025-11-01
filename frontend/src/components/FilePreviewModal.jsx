import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { Download, Share2, Star, Trash2, X, ZoomIn, ZoomOut, FileText } from 'lucide-react';
import { formatFileSize, formatDate } from '../mock/mockData';
import { useToast } from '../hooks/use-toast';

const FilePreviewModal = ({ isOpen, onClose, file, comments = [], onAddComment, onAction }) => {
  const [newComment, setNewComment] = useState('');
  const [zoom, setZoom] = useState(100);
  const { toast } = useToast();

  if (!file) return null;

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment(file.id, newComment);
      setNewComment('');
      toast({
        title: 'Comment added',
        description: 'Your comment has been posted',
      });
    }
  };

  const renderPreview = () => {
    if (file.type?.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-900 p-4">
          <img
            src={file.thumbnail || 'https://via.placeholder.com/800x600?text=Image+Preview'}
            alt={file.name}
            style={{ maxWidth: `${zoom}%`, maxHeight: '100%' }}
            className="object-contain"
          />
        </div>
      );
    }

    if (file.type?.startsWith('video/')) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-900">
          <div className="text-center text-white">
            <FileText className="w-16 h-16 mx-auto mb-4" />
            <p className="text-lg">Video preview</p>
            <p className="text-sm text-gray-400">Video player would be displayed here</p>
          </div>
        </div>
      );
    }

    if (file.type === 'application/pdf') {
      return (
        <div className="flex items-center justify-center h-full bg-gray-100">
          <div className="text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg text-gray-700">PDF preview</p>
            <p className="text-sm text-gray-500">PDF viewer would be displayed here</p>
          </div>
        </div>
      );
    }

    if (file.type?.startsWith('text/')) {
      return (
        <div className="h-full bg-white p-8 overflow-auto">
          <pre className="text-sm text-gray-700 font-mono">
            This is a preview of {file.name}
            
            File content would be displayed here...
          </pre>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg text-gray-700">No preview available</p>
          <p className="text-sm text-gray-500 mb-4">Download to view this file</p>
          <Button onClick={() => onAction('download', file)}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0">
        <div className="flex h-full">
          {/* Preview Area */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium truncate flex-1">{file.name}</h3>
              <div className="flex items-center gap-2">
                {file.type?.startsWith('image/') && (
                  <>
                    <Button variant="outline" size="icon" onClick={() => setZoom(Math.max(50, zoom - 25))}>
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-600 w-16 text-center">{zoom}%</span>
                    <Button variant="outline" size="icon" onClick={() => setZoom(Math.min(200, zoom + 25))}>
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </>
                )}
                <Button variant="outline" size="icon" onClick={() => onAction('download', file)}>
                  <Download className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => onAction('share', file)}>
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => onAction('star', file)}>
                  <Star className={`w-4 h-4 ${file.starred ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                </Button>
                <Button variant="outline" size="icon" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              {renderPreview()}
            </div>
          </div>

          {/* Details Sidebar */}
          <div className="w-80 border-l bg-gray-50">
            <Tabs defaultValue="details" className="h-full flex flex-col">
              <TabsList className="w-full grid grid-cols-2 rounded-none">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-4">
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 mb-1">Type</h4>
                      <p className="text-sm">{file.type || 'Folder'}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 mb-1">Size</h4>
                      <p className="text-sm">{formatFileSize(file.size)}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 mb-1">Owner</h4>
                      <p className="text-sm">me</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 mb-1">Modified</h4>
                      <p className="text-sm">{formatDate(file.modified)}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 mb-1">Created</h4>
                      <p className="text-sm">{formatDate(file.created)}</p>
                    </div>
                    {file.lastOpened && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 mb-1">Opened</h4>
                        <p className="text-sm">{formatDate(file.lastOpened)}</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="activity" className="flex-1 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-4">
                    <h4 className="text-sm font-medium">Comments</h4>
                    {comments.length === 0 ? (
                      <p className="text-sm text-gray-500">No comments yet</p>
                    ) : (
                      <div className="space-y-3">
                        {comments.map((comment) => (
                          <div key={comment.id} className="flex gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-blue-600 text-white text-xs">
                                {comment.userName?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="bg-white p-2 rounded-lg">
                                <p className="text-xs font-medium">{comment.userName}</p>
                                <p className="text-sm text-gray-700 mt-1">{comment.text}</p>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{formatDate(comment.timestamp)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t bg-white">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="mb-2"
                    rows={3}
                  />
                  <Button onClick={handleAddComment} disabled={!newComment.trim()} className="w-full">
                    Comment
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilePreviewModal;
