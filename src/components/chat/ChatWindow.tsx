import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { LocalMessage } from "@/types/chat";
import { cn } from "@/lib/utils";
import { Copy, Check, Pencil, X } from "lucide-react";

interface Props {
  messages: LocalMessage[];
  onSend: (text: string, options?: { editOfMessageId?: string }) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  disabled?: boolean;
  loading?: boolean;
  title?: string;
}

export default function ChatWindow({ messages, onSend, onEditMessage, disabled, loading, title }: Props) {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  const startEdit = (message: LocalMessage) => {
    setEditingId(message.id);
    setEditingContent(message.content);
  };

  const saveEdit = () => {
    if (!editingContent.trim() || !editingId) return;
    onEditMessage(editingId, editingContent.trim());
    setEditingId(null);
    setEditingContent("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingContent("");
  };

  const submit = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <section className="flex-1 flex flex-col">
      <header className="border-b px-6 py-4 flex items-center justify-between bg-gradient-to-r from-background to-secondary/50">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="EdisonAI coffee-themed mascot" className="h-8 w-8 rounded" />
          <div>
            <h1 className="text-xl font-semibold">{title ?? "EdisonAI"}</h1>
            <p className="text-sm text-muted-foreground">The Thinking Satellite</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((m) => (
            <div key={m.id} className={cn(
              "flex",
              m.role === "user" ? "justify-end" : "justify-start"
            )}>
              <article className={cn(
                "max-w-none",
                m.role === "user" 
                  ? "w-[60%] bg-primary text-primary-foreground rounded-lg px-4 py-3" 
                  : "w-full prose prose-neutral max-w-none dark:prose-invert"
              )}>
                {m.role === "user" ? (
                  <div className="text-sm">
                    {editingId === m.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              saveEdit();
                            }
                            if (e.key === "Escape") {
                              cancelEdit();
                            }
                          }}
                          className="min-h-[60px] text-sm resize-none text-foreground bg-background border-border"
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={cancelEdit}>
                            Cancel
                          </Button>
                          <Button variant="ghost" size="sm" onClick={saveEdit}>
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="group relative">
                        <div>{m.content}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => startEdit(m)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="prose prose-neutral max-w-none dark:prose-invert">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        pre: ({ node, ...props }) => {
                          // @ts-ignore
                          const [copied, setCopied] = useState(false);
                          const preRef = useRef<HTMLPreElement | null>(null);
                          const doCopy = async () => {
                            const text = preRef.current?.querySelector("code")?.textContent ?? preRef.current?.textContent ?? "";
                            try {
                              await navigator.clipboard.writeText(text.trim());
                              setCopied(true);
                              setTimeout(() => setCopied(false), 1200);
                            } catch {}
                          };
                          return (
                            <div className="relative group">
                              <button
                                onClick={doCopy}
                                className="absolute right-2 top-2 text-xs px-2 py-1 rounded-md border bg-background/80 backdrop-blur hover:bg-accent transition"
                                aria-label="Copy code"
                                title="Copy code"
                              >
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              </button>
                              <pre ref={preRef} {...props} />
                            </div>
                          );
                        },
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  </div>
                )}
                {m.role === "assistant" && (
                  <div className="mt-3 flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => copyText(m.content)}>
                      <Copy className="mr-2 h-4 w-4" /> Copy response
                    </Button>
                  </div>
                )}
              </article>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </div>

      <footer className="border-t p-4">
        <div className="max-w-3xl mx-auto grid gap-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={disabled ? "Enter provider, API key and model in Settings, then send." : "Type your message. Press Enter to send, Shift+Enter for a new line."}
            rows={4}
            disabled={loading}
          />
          <div className="flex justify-end">
            <Button variant="cafe" onClick={submit} disabled={loading}>
              {loading ? "Thinking…" : "Send"}
            </Button>
          </div>
        </div>
      </footer>
    </section>
  );
}
