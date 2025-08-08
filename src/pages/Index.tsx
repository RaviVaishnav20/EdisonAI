import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/chat/Sidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import SettingsDialog from "@/components/chat/SettingsDialog";
import { loadSettings, hasLLMCreds, hasSupabaseCreds, type EdisonSettings, saveSettings } from "@/lib/settings";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { generateAssistantReply } from "@/lib/llm";
import type { ChatRow, LocalMessage, MessageRow } from "@/types/chat";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

const Index = () => {
  const [settings, setSettings] = useState<EdisonSettings>(() => loadSettings());
  const supabase = useMemo(() => getSupabaseClient(settings), [settings]);

  const [chats, setChats] = useState<ChatRow[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [loading, setLoading] = useState(false);

  // Local fallback storage when Supabase isn't configured
  const [localStore, setLocalStore] = useState<Record<string, LocalMessage[]>>({});

  // Load chats
  useEffect(() => {
    (async () => {
      if (!supabase) {
        setChats([]);
        setActiveId((prev) => prev ?? "local" + crypto.randomUUID());
        setMessages(localStore[activeId ?? ""] ?? []);
        return;
      }
      const { data, error } = await supabase.from("chats").select("id,title,created_at,updated_at").order("updated_at", { ascending: false });
      if (error) {
        console.error(error);
        toast({ title: "Supabase error", description: error.message });
        return;
      }
      setChats(data as ChatRow[]);
      if (data?.length && !activeId) {
        setActiveId(data[0].id);
      }
    })();
  }, [supabase]);

  // Load messages for active chat
  useEffect(() => {
    (async () => {
      if (!activeId) return;
      if (!supabase) {
        setMessages(localStore[activeId] ?? []);
        return;
      }
      const { data, error } = await supabase
        .from("messages")
        .select("id,chat_id,role,content,created_at")
        .eq("chat_id", activeId)
        .order("created_at", { ascending: true });
      if (error) {
        console.error(error);
        toast({ title: "Supabase error", description: error.message });
        return;
      }
      setMessages(
        (data as MessageRow[]).map((m) => ({ id: m.id, role: m.role, content: m.content }))
      );
    })();
  }, [activeId, supabase, localStore]);

  const refreshChats = async () => {
    if (!supabase) return;
    const { data } = await supabase.from("chats").select("id,title,created_at,updated_at").order("updated_at", { ascending: false });
    setChats((data as ChatRow[]) ?? []);
  };

  const handleSettingsChanged = (s: EdisonSettings) => {
    setSettings(s);
  };

  const newChat = async () => {
    // First check if the current active chat is empty
    if (activeId) {
      let isCurrentChatEmpty = false;
      
      if (!supabase) {
        // For local mode, check if current chat has no messages
        isCurrentChatEmpty = !localStore[activeId] || localStore[activeId].length === 0;
      } else {
        // For Supabase mode, check if current chat has no messages
        const { data: messages, error } = await supabase
          .from("messages")
          .select("id")
          .eq("chat_id", activeId)
          .limit(1);
        
        isCurrentChatEmpty = !error && (!messages || messages.length === 0);
      }
      
      if (isCurrentChatEmpty) {
        // Current chat is already empty, just ensure messages are cleared
        setMessages([]);
        return;
      }
    }

    // Check if there's already an empty chat among all chats
    let emptyChat: ChatRow | undefined;
    
    if (!supabase) {
      // For local mode, check if any chat has no messages
      emptyChat = chats.find(chat => !localStore[chat.id] || localStore[chat.id].length === 0);
    } else {
      // For Supabase mode, check for chats with "New Chat" title and no messages
      for (const chat of chats) {
        if (chat.title === "New Chat" || chat.title === "") {
          // Check if this chat has any messages
          const { data: messages, error } = await supabase
            .from("messages")
            .select("id")
            .eq("chat_id", chat.id)
            .limit(1);
          
          if (!error && (!messages || messages.length === 0)) {
            emptyChat = chat;
            break;
          }
        }
      }
    }

    if (emptyChat) {
      // Switch to the existing empty chat
      setActiveId(emptyChat.id);
      if (!supabase) {
        setMessages(localStore[emptyChat.id] ?? []);
      } else {
        setMessages([]);
      }
      return;
    }

    // Create a new chat only if no empty chat exists
    if (!supabase) {
      const id = "local" + crypto.randomUUID();
      setLocalStore((prev) => ({ ...prev, [id]: [] }));
      setActiveId(id);
      setMessages([]);
      return;
    }
    const { data, error } = await supabase.from("chats").insert({ title: "New Chat" }).select("id,title,updated_at,created_at").single();
    if (error) {
      toast({ title: "Supabase error", description: error.message });
      return;
    }
    setChats([data as any, ...chats]);
    setActiveId((data as any).id);
    setMessages([]);
  };

const send = async (text: string, options?: { editOfMessageId?: string }) => {
    if (!hasLLMCreds(settings)) {
      toast({ title: "LLM not configured", description: "Please open Settings and enter provider, API key, and model." });
      return;
    }

    // If editing, remove the latest assistant response
    let baseHistory = messages;
    const last = messages[messages.length - 1];
    if (options?.editOfMessageId && last?.role === "assistant") {
      baseHistory = messages.slice(0, -1);
      setMessages(baseHistory);
      try {
        if (supabase && last.id) {
          await supabase.from("messages").delete().eq("id", last.id);
        }
      } catch (e) {
        console.warn("Failed to delete previous assistant message:", e);
      }
    }

    const userMsg: LocalMessage = { id: crypto.randomUUID(), role: "user", content: text };
    const nextHistory = [...baseHistory, userMsg];
    setMessages(nextHistory);

    let supabaseChatId = activeId;
    try {
      if (supabase) {
        // Ensure chat exists
        if (!activeId || activeId.startsWith("local")) {
          const title = text.slice(0, 60) || "New Chat";
          const { data, error } = await supabase.from("chats").insert({ title }).select("id").single();
          if (error) throw error;
          supabaseChatId = data!.id;
          setActiveId(supabaseChatId);
        }
        const { data: insertedUser, error: iuError } = await supabase
          .from("messages")
          .insert({ chat_id: supabaseChatId!, role: "user", content: text })
          .select("id")
          .single();
        if (iuError) throw iuError;
        if (insertedUser?.id) {
          // Replace temp id with DB id
          setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 && m.role === "user" ? { ...m, id: insertedUser.id } : m)));
        }
      } else {
        // local
        setLocalStore((prev) => ({ ...prev, [activeId!]: nextHistory }));
      }

      setLoading(true);
      const assistantText = await generateAssistantReply(settings, toHistoryWithSystem(settings, nextHistory));
      const assistantMsg: LocalMessage = { id: crypto.randomUUID(), role: "assistant", content: assistantText };
      const finalHistory = [...nextHistory, assistantMsg];
      setMessages(finalHistory);
      if (supabase && supabaseChatId) {
        const { data: insertedAssistant, error: iaError } = await supabase
          .from("messages")
          .insert({ chat_id: supabaseChatId, role: "assistant", content: assistantText })
          .select("id")
          .single();
        if (iaError) throw iaError;
        if (insertedAssistant?.id) {
          setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 && m.role === "assistant" ? { ...m, id: insertedAssistant.id } : m)));
        }
        const title = text.slice(0, 60) || "New Chat";
        await supabase.from("chats").update({ title }).eq("id", supabaseChatId);
        await refreshChats();
      } else {
        setLocalStore((prev) => ({ ...prev, [activeId!]: finalHistory }));
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: "Chat error", description: e.message || String(e) });
    } finally {
      setLoading(false);
    }
  };

  const toHistoryWithSystem = (s: EdisonSettings, hist: LocalMessage[]): LocalMessage[] => {
    if (!s.systemPrompt) return hist;
    const firstIsSystem = hist[0]?.role === "system";
    if (firstIsSystem) return hist;
    return [{ id: "system", role: "system", content: s.systemPrompt }, ...hist];
  };

  const activeTitle = useMemo(() => {
    return chats.find((c) => c.id === activeId)?.title ?? "EdisonAI";
  }, [chats, activeId]);

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      // Find the index of the message being edited
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex === -1) return;

      // Update the message content
      const updatedMessages = messages.map(m => 
        m.id === messageId ? { ...m, content: newContent } : m
      );

      // Remove all messages after the edited message
      const finalMessages = updatedMessages.slice(0, messageIndex + 1);
      setMessages(finalMessages);

      // Update in database if using Supabase
      if (supabase && activeId && !activeId.startsWith("local")) {
        // Update the edited message
        await supabase
          .from("messages")
          .update({ content: newContent })
          .eq("id", messageId);

        // Delete all subsequent messages
        const messagesToDelete = messages.slice(messageIndex + 1);
        for (const msg of messagesToDelete) {
          if (msg.id && !msg.id.startsWith("local")) {
            await supabase.from("messages").delete().eq("id", msg.id);
          }
        }

        // Update chat title
        const title = newContent.slice(0, 60) || "New Chat";
        await supabase.from("chats").update({ title }).eq("id", activeId);
        await refreshChats();
      } else {
        // Update local storage
        setLocalStore((prev) => ({ ...prev, [activeId!]: finalMessages }));
      }

      // Generate AI response after editing
      setLoading(true);
      try {
        const assistantText = await generateAssistantReply(settings, toHistoryWithSystem(settings, finalMessages));
        const assistantMsg: LocalMessage = { id: crypto.randomUUID(), role: "assistant", content: assistantText };
        const finalHistory = [...finalMessages, assistantMsg];
        setMessages(finalHistory);
        
        if (supabase && activeId && !activeId.startsWith("local")) {
          const { data: insertedAssistant, error: iaError } = await supabase
            .from("messages")
            .insert({ chat_id: activeId, role: "assistant", content: assistantText })
            .select("id")
            .single();
          if (iaError) throw iaError;
          if (insertedAssistant?.id) {
            setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 && m.role === "assistant" ? { ...m, id: insertedAssistant.id } : m)));
          }
        } else {
          setLocalStore((prev) => ({ ...prev, [activeId!]: finalHistory }));
        }
      } catch (e: any) {
        console.error("Failed to generate AI response after edit:", e);
        toast({ title: "AI response failed", description: e.message || String(e) });
      } finally {
        setLoading(false);
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: "Edit failed", description: e.message || String(e) });
    }
  };

  return (
    <div className="min-h-screen grid" style={{ gridTemplateColumns: "18rem 1fr" }}>
      <Sidebar
        chats={chats}
        activeId={activeId}
        onSelect={(id) => setActiveId(id)}
        onNewChat={newChat}
        onDeleteChat={async (id) => {
          try {
            if (supabase) {
              await supabase.from("chats").delete().eq("id", id);
              await refreshChats();
              if (activeId === id) {
                const next = chats.find((c) => c.id !== id)?.id;
                setActiveId(next);
                setMessages([]);
              }
            } else {
              // Local mode: nothing persisted; just clear if current
              if (activeId === id) {
                setMessages([]);
              }
            }
          } catch (e: any) {
            toast({ title: "Delete failed", description: e.message || String(e) });
          }
        }}
        connected={hasSupabaseCreds(settings)}
      />
      <div className="flex-1 flex flex-col">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={newChat}><PlusCircle className="mr-2"/>New</Button>
            <SettingsDialog onChanged={handleSettingsChanged} />
          </div>
        </div>
        <ChatWindow
          messages={messages}
          onSend={send}
          onEditMessage={handleEditMessage}
          disabled={!hasLLMCreds(settings)}
          loading={loading}
          title={activeTitle}
        />
      </div>
    </div>
  );
};

export default Index;
