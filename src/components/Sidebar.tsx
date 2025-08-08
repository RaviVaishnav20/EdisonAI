import React from 'react';
import { Plus, MessageSquare, Trash2, Settings as SettingsIcon } from 'lucide-react';
import type { Chat } from '../types';

interface SidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onOpenSettings: () => void;
  isLoading: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chats,
  currentChatId,
  onChatSelect,
  onNewChat,
  onDeleteChat,
  isLoading
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const truncateTitle = (title: string, maxLength: number = 25) => {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  };

  return (
    <div className="w-80 bg-gray-900 border-r border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-center mb-4">
          <img src="/logo.png" alt="EdisonAI Logo" className="h-8 w-8 mr-2" />
          <h1 className="text-xl font-bold text-white">EdisonAI</h1>
        </div>
        <button
          onClick={onNewChat}
          disabled={isLoading}
          className="w-full flex items-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <Plus className="h-5 w-5 text-white" />
          <span className="text-white font-medium">New Chat</span>
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-gray-400 text-center">
            Loading chats...
          </div>
        ) : chats.length === 0 ? (
          <div className="p-4 text-gray-400 text-center">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No conversations yet</p>
            <p className="text-sm">Start a new chat to begin</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                  currentChatId === chat.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
                onClick={() => onChatSelect(chat.id)}
              >
                <MessageSquare className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {truncateTitle(chat.title)}
                  </p>
                  <p className="text-xs opacity-70">
                    {formatDate(chat.updated_at)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};