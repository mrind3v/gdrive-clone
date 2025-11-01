import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Share2, Link2, Copy, Mail, X } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

const ShareModal = ({ isOpen, onClose, item, sharedUsers = [], onShare, onRevokeAccess }) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('viewer');
  const { toast } = useToast();

  const handleShare = () => {
    if (email.trim()) {
      onShare(item.id, email, permission);
      setEmail('');
      toast({
        title: 'Shared successfully',
        description: `${item.name} has been shared with ${email}`,
      });
    }
  };

  const handleCopyLink = () => {
    const link = `https://drive.example.com/file/${item.id}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Link copied',
      description: 'Shareable link has been copied to clipboard',
    });
  };

  const handleRevoke = (userId) => {
    onRevokeAccess(item.id, userId);
    toast({
      title: 'Access revoked',
      description: 'User access has been removed',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share "{item?.name}"</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="people" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="people">Share with people</TabsTrigger>
            <TabsTrigger value="link">Get link</TabsTrigger>
          </TabsList>
          <TabsContent value="people" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="email"
                    placeholder="Add people by email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleShare()}
                  />
                </div>
                <Select value={permission} onValueChange={setPermission}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="commenter">Commenter</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleShare} disabled={!email.trim()}>
                  Share
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">People with access</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {sharedUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-600 text-white text-xs">
                            {user.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 capitalize">{user.permission}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRevoke(user.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {sharedUsers.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No one has access yet</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-medium text-blue-900">Anyone with the link can view</p>
                </div>
                <p className="text-xs text-blue-700">Anyone with this link can view this file</p>
              </div>
              <div className="flex gap-2">
                <Input
                  value={`https://drive.example.com/file/${item?.id}`}
                  readOnly
                  className="flex-1"
                />
                <Button onClick={handleCopyLink}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
