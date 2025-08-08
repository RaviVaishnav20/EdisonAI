import React from 'react';
import { User, Bot, Settings } from 'lucide-react';
import type { Message as MessageType } from '../types';

interface MessageProps {
  message: MessageType;
}

export const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIcon = () => {
    if (isUser) return <User className="h-5 w-5" />;
    if (isSystem) return <Settings className="h-5 w-5" />;
    return <Bot className="h-5 w-5" />;
  };

  const getDisplayName = () => {
    if (isUser) return 'You';
    if (isSystem) return 'System';
    return 'Assistant';
  };

  return (
    <div className={`flex gap-4 p-6 ${isUser ? 'bg-gray-50' : 'bg-white'} ${isSystem ? 'opacity-75' : ''}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-blue-600 text-white' : 
        isSystem ? 'bg-gray-600 text-white' : 
        'bg-green-600 text-white'
      }`}>
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-gray-900">{getDisplayName()}</span>
          <span className="text-xs text-gray-500">{formatTime(message.created_at)}</span>
        </div>
        
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
        </div>
      </div>
    </div>
  );
};