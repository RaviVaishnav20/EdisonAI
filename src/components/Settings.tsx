import React, { useState, useEffect } from 'react';
import { X, Settings as SettingsIcon, Key, Brain, MessageSquare, Database } from 'lucide-react';
import type { AppSettings } from '../types';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Status indicators */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-white font-medium mb-3">Configuration Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  localSettings.supabaseUrl && localSettings.supabaseAnonKey ? 'bg-green-400' : 'bg-red-400'
                }`} />
                <span className="text-gray-300">
                  Supabase: {localSettings.supabaseUrl && localSettings.supabaseAnonKey ? 'Connected' : 'Not configured'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  localSettings.llmProvider.apiKey ? 'bg-green-400' : 'bg-red-400'
                }`} />
                <span className="text-gray-300">
                  LLM Provider: {localSettings.llmProvider.apiKey ? 'Configured' : 'API key required'}
                </span>
              </div>
            </div>
            {!localSettings.llmProvider.apiKey && (
              <div className="mt-3 p-3 bg-yellow-900 bg-opacity-50 rounded border border-yellow-600">
                <p className="text-yellow-200 text-sm">
                  ⚠️ LLM API key is required to send messages. Configure it below to start chatting.
                </p>
              </div>
            )}
            {!localSettings.supabaseUrl && (
              <div className="mt-3 p-3 bg-blue-900 bg-opacity-50 rounded border border-blue-600">
                <p className="text-blue-200 text-sm">
                  💡 Without Supabase, conversations will only be stored locally and won't persist between sessions.
                </p>
              </div>
            )}
          </div>

          {/* Supabase Configuration */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <Database className="h-5 w-5 text-green-400" />
              <h3 className="text-lg font-medium">Supabase Configuration</h3>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Supabase URL
              </label>
              <input
                type="text"
                value={localSettings.supabaseUrl}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  supabaseUrl: e.target.value
                })}
                placeholder="https://your-project.supabase.co"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Supabase Anon Key
              </label>
              <input
                type="password"
                value={localSettings.supabaseAnonKey}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  supabaseAnonKey: e.target.value
                })}
                placeholder="Your anon key"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* LLM Configuration */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <Brain className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-medium">LLM Configuration</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Provider
              </label>
              <select
                value={localSettings.llmProvider.name}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  llmProvider: {
                    ...localSettings.llmProvider,
                    name: e.target.value as 'groq' | 'gemini'
                  }
                })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="groq">Groq</option>
                <option value="gemini">Gemini</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Model Name
              </label>
              <input
                type="text"
                value={localSettings.llmProvider.model}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  llmProvider: {
                    ...localSettings.llmProvider,
                    model: e.target.value
                  }
                })}
                placeholder={localSettings.llmProvider.name === 'groq' ? 'llama-3.3-70b-versatile' : 'gemini-2.0-flash-exp'}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={localSettings.llmProvider.apiKey}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  llmProvider: {
                    ...localSettings.llmProvider,
                    apiKey: e.target.value
                  }
                })}
                placeholder="Your API key"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* System Prompt */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <MessageSquare className="h-5 w-5 text-orange-400" />
              <h3 className="text-lg font-medium">System Prompt</h3>
            </div>
            
            <div>
              <textarea
                value={localSettings.systemPrompt}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  systemPrompt: e.target.value
                })}
                placeholder="You are a helpful AI assistant..."
                rows={4}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};