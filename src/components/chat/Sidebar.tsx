import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ChatRow } from "@/types/chat";
import { PlusCircle, Database, Trash2 } from "lucide-react";

interface Props {
  chats: ChatRow[];
  activeId?: string;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  connected: boolean;
}

export default function Sidebar({ chats, activeId, onSelect, onNewChat, onDeleteChat, connected }: Props) {
  return (
    <aside className="w-72 border-r bg-sidebar px-3 py-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="EdisonAI mascot brand" className="h-10 w-10 rounded-md border" />
        <div className="text-left">
          {/* <div className="text-sm text-[#6F4E37]">🧠 EdisonAI</div> */}
          <div className="text-lg font-semibold text-[#6F4E37]">EdisonAI</div>
        </div>
      </div>
      <Button variant="hero" onClick={onNewChat}><PlusCircle /> New Chat</Button>

      <div className="text-xs text-muted-foreground flex items-center gap-2">
        <Database className={cn("", connected ? "text-accent" : "opacity-50")} />
        {connected ? "Supabase: Connected" : "Supabase: Not configured"}
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 pr-2">
          {chats.map((c) => (
            <div key={c.id} className="relative group">
              <button
                onClick={() => onSelect(c.id)}
                className={cn(
                  "w-[60%] text-left px-3 py-2 rounded-md border hover:bg-accent/50 transition-colors relative",
                  activeId === c.id ? "bg-accent/60 border-accent" : "border-border"
                )}
                title={c.title}
              >
                <div className="truncate text-sm pr-8">{c.title}</div>
                {c.updated_at && (
                  <div className="text-xs text-muted-foreground pr-8">
                    {new Date(c.updated_at).toLocaleString()}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 h-6 w-6"
                  onClick={(e) => { e.stopPropagation(); onDeleteChat(c.id); }}
                  aria-label="Delete chat"
                  title="Delete chat"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </button>
            </div>
          ))}
          {chats.length === 0 && (
            <div className="text-sm text-muted-foreground px-3 py-6">
              No chats yet. Start a new conversation.
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
