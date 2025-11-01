import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Upload, Folder, FileText } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const NewItemModal = ({ isOpen, onClose, onCreateFolder, onUploadFile }) => {
  const [folderName, setFolderName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleCreateFolder = () => {
    if (folderName.trim()) {
      onCreateFolder(folderName);
      setFolderName('');
      onClose();
      toast({
        title: 'Folder created',
        description: `"${folderName}" has been created successfully.`,
      });
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      onUploadFile(files);
      onClose();
      toast({
        title: 'Upload started',
        description: `Uploading ${files.length} file(s)...`,
      });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onUploadFile(files);
      onClose();
      toast({
        title: 'Upload started',
        description: `Uploading ${files.length} file(s)...`,
      });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create new</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload file</TabsTrigger>
            <TabsTrigger value="folder">New folder</TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="space-y-4 mt-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-2">Drag and drop files here</p>
              <p className="text-xs text-gray-500 mb-4">or</p>
              <label htmlFor="file-upload">
                <Button type="button" onClick={() => document.getElementById('file-upload').click()}>
                  Select files
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          </TabsContent>
          <TabsContent value="folder" className="space-y-4 mt-4">
            <div className="flex flex-col items-center gap-4 py-4">
              <Folder className="w-16 h-16 text-gray-400" />
              <div className="w-full space-y-2">
                <Label htmlFor="folder-name">Folder name</Label>
                <Input
                  id="folder-name"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Untitled folder"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                />
              </div>
              <Button onClick={handleCreateFolder} className="w-full" disabled={!folderName.trim()}>
                Create folder
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default NewItemModal;
