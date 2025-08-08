import React, { useState, useEffect, useCallback } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { Settings } from './components/Settings';
import { chatService, initializeSupabase } from './lib/supabase';
import { llmService } from './lib/llm';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { Chat, Message, AppSettings } from './types';

const defaultSettings: AppSettings = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  llmProvider: {
    name: 'groq',
    model: 'llama-3.3-70b-versatile',
    apiKey: import.meta.env.VITE_GROQ_API_KEY || ''
  },
  systemPrompt: 'You are a helpful AI assistant. Provide accurate, helpful, and detailed responses.'
};

function App() {
  const [settings, setSettings] = useLocalStorage<AppSettings>('app-settings', defaultSettings);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [localChatTitle, setLocalChatTitle] = useState<string>('');

  // Initialize services when settings change
  useEffect(() => {
    // Validate Supabase URL format before initialization
    const isValidUrl = (url: string) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    if (settings.supabaseUrl && 
        settings.supabaseAnonKey && 
        settings.supabaseUrl.trim() !== '' && 
        settings.supabaseAnonKey.trim() !== '' &&
        isValidUrl(settings.supabaseUrl.trim())) {
      try {
        initializeSupabase(settings.supabaseUrl, settings.supabaseAnonKey);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        setIsInitialized(false);
      }
    } else {
      setIsInitialized(false);
    }

    // Initialize LLM providers
    const groqApiKey = settings.llmProvider.name === 'groq' ? settings.llmProvider.apiKey : import.meta.env.VITE_GROQ_API_KEY;
    const geminiApiKey = settings.llmProvider.name === 'gemini' ? settings.llmProvider.apiKey : import.meta.env.VITE_GEMINI_API_KEY;
    
    if (groqApiKey || geminiApiKey) {
      llmService.initializeProviders(groqApiKey, geminiApiKey);
    }
  }, [settings]);

  // Load chats when initialized
  useEffect(() => {
    if (isInitialized) {
      loadChats();
    }
  }, [isInitialized]);

  const loadChats = async () => {
    if (!isInitialized) {
      setChats([]);
      return;
    }
    
    try {
      setIsLoadingChats(true);
      const loadedChats = await chatService.getChats();
      setChats(loadedChats);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setIsLoadingChats(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    if (!isInitialized) return;
    
    try {
      setIsLoading(true);
      const loadedMessages = await chatService.getMessages(chatId);
      setMessages(loadedMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    if (!isInitialized) {
      // Start local chat
      setCurrentChatId('local');
      setMessages([]);
      setLocalMessages([]);
      setLocalChatTitle('New Conversation');
      return;
    }

    try {
      const newChat = await chatService.createChat('New Conversation');
      setChats(prev => [newChat, ...prev]);
      setCurrentChatId(newChat.id);
      setMessages([]);
    } catch (error) {
      console.error('Failed to create new chat:', error);
    }
  };

  const handleChatSelect = (chatId: string) => {
    if (chatId === 'local') {
      setCurrentChatId('local');
      setMessages(localMessages);
      return;
    }
    
    setCurrentChatId(chatId);
    loadMessages(chatId);
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!isInitialized) return;

    try {
      await chatService.deleteChat(chatId);
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  const updateChatTitle = async (chatId: string, firstMessage: string) => {
    const title = firstMessage.length > 50 
      ? firstMessage.substring(0, 50) + '...'
      : firstMessage;
    
    try {
      await chatService.updateChatTitle(chatId, title);
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, title } : chat
      ));
    } catch (error) {
      console.error('Failed to update chat title:', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    // Check if LLM is configured
    if (!settings.llmProvider.apiKey || settings.llmProvider.apiKey.trim() === '') {
      setIsSettingsOpen(true);
      return;
    }

    if (!currentChatId) return;

    setIsLoading(true);

    try {
      let userMessage: Message;
      
      if (currentChatId === 'local' || !isInitialized) {
        // Handle local chat
        userMessage = {
          id: Date.now().toString(),
          chat_id: 'local',
          role: 'user',
          content,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMessage]);
        setLocalMessages(prev => [...prev, userMessage]);
        
        // Update local chat title if this is the first message
        if (localMessages.length === 0) {
          const title = content.length > 50 ? content.substring(0, 50) + '...' : content;
          setLocalChatTitle(title);
        }
      } else {
        // Handle Supabase chat
        userMessage = await chatService.addMessage(currentChatId, 'user', content);
        setMessages(prev => [...prev, userMessage]);
        
        // Update chat title if this is the first message
        if (messages.length === 0) {
          await updateChatTitle(currentChatId, content);
        }
      }

      // Generate AI response using full conversation context
      const conversationContext = [...messages, userMessage];
      const response = await llmService.generateResponse(
        settings.llmProvider,
        conversationContext,
        settings.systemPrompt
      );

      let assistantMessage: Message;
      
      if (currentChatId === 'local' || !isInitialized) {
        // Handle local chat
        assistantMessage = {
          id: (Date.now() + 1).toString(),
          chat_id: 'local',
          role: 'assistant',
          content: response,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMessage]);
        setLocalMessages(prev => [...prev, assistantMessage]);
      } else {
        // Handle Supabase chat
        assistantMessage = await chatService.addMessage(currentChatId, 'assistant', response);
        setMessages(prev => [...prev, assistantMessage]);
        
        // Update chat timestamp
        await loadChats();
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      // Could add error message to chat here
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsChange = (newSettings: AppSettings) => {
    setSettings(newSettings);
  };

  const currentChat = chats.find(chat => chat.id === currentChatId);
  const displayTitle = currentChatId === 'local' ? localChatTitle : currentChat?.title;

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isLoading={isLoadingChats}
      />
      
      <div className="flex-1 flex flex-col">
        {/* Top bar with settings */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center">
          <h1 className="text-lg font-semibold text-gray-800">
            {displayTitle || 'Chat Assistant'}
          </h1>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Settings"
          >
            <SettingsIcon className="h-5 w-5" />
          </button>
        </div>
        
        <ChatArea
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          currentChatTitle={displayTitle}
        />
      </div>

      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  );
}

export default App;