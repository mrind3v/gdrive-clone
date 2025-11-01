import React from 'react';
import { Home, Clock, Star, Users, Trash2, HardDrive, Settings, HelpCircle, Plus } from 'lucide-react';
import { Button } from './ui/button';

const Sidebar = ({ currentView, onViewChange, onNewClick, storageUsed, storageTotal }) => {
  const menuItems = [
    { id: 'drive', label: 'My Drive', icon: Home },
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'starred', label: 'Starred', icon: Star },
    { id: 'shared', label: 'Shared with me', icon: Users },
    { id: 'trash', label: 'Trash', icon: Trash2 },
  ];

  const storagePercentage = (storageUsed / storageTotal) * 100;

  return (
    <div className="w-64 h-full bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4">
        <Button
          onClick={onNewClick}
          className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm rounded-full flex items-center justify-start gap-3 h-14 px-6 transition-all hover:shadow-md"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">New</span>
        </Button>
      </div>

      <nav className="flex-1 px-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-600 hover:text-gray-900 cursor-pointer">
            <HardDrive className="w-4 h-4" />
            <span className="text-sm">Storage</span>
          </div>
          <div className="space-y-1">
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${storagePercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-600">
              {((storageUsed / 1024 / 1024 / 1024).toFixed(1))} GB of{' '}
              {((storageTotal / 1024 / 1024 / 1024).toFixed(0))} GB used
            </p>
          </div>
          <button className="text-xs text-blue-600 hover:underline">
            Buy storage
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
