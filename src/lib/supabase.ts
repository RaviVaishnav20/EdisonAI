import { createClient } from '@supabase/supabase-js';
import type { Chat, Message } from '../types';

// Initialize with empty values - will be set from settings
let supabase: ReturnType<typeof createClient> | null = null;

export const initializeSupabase = (url: string, anonKey: string) => {
  supabase = createClient(url, anonKey);
  return supabase;
};

export const getSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase not initialized. Please configure your settings first.');
  }
  return supabase;
};

export const chatService = {
  async getChats(): Promise<Chat[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createChat(title: string): Promise<Chat> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('chats')
      .insert({ title })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateChatTitle(chatId: string, title: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('chats')
      .update({ title })
      .eq('id', chatId);
    
    if (error) throw error;
  },

  async deleteChat(chatId: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId);
    
    if (error) throw error;
  },

  async getMessages(chatId: string): Promise<Message[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async addMessage(chatId: string, role: Message['role'], content: string): Promise<Message> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('messages')
      .insert({ chat_id: chatId, role, content })
      .select()
      .single();
    
    if (error) throw error;

    // Update chat's updated_at timestamp
    await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chatId);
    
    return data;
  }
};