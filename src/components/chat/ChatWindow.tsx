import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { LocalMessage } from "@/types/chat";
import { cn } from "@/lib/utils";
import { Copy, Check, Pencil, X, Mic, MicOff, Square, Volume2, VolumeX } from "lucide-react";
import { transcribeAudio } from "@/lib/transcription";
import { textToSpeech } from "@/lib/tts";
import { loadSettings } from "@/lib/settings";
import { toast } from "@/hooks/use-toast";

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
  
  // Microphone state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // TTS state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  
  // Load settings fresh each time we need them
  const getSettings = () => loadSettings();

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsTranscribing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        try {
          const result = await transcribeAudio(audioBlob);
          if (result.success) {
            setInput(result.text);
            toast({ title: "Transcription complete", description: "Your voice has been transcribed." });
          } else {
            toast({ title: "Transcription failed", description: result.error || "Unknown error occurred", variant: "destructive" });
          }
        } catch (error) {
          toast({ title: "Transcription failed", description: "An error occurred during transcription", variant: "destructive" });
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({ title: "Microphone access denied", description: "Please allow microphone access to use voice input", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const speakText = async (text: string) => {
    if (isSpeaking) {
      // Stop current speech
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        setCurrentAudio(null);
      }
      setIsSpeaking(false);
      return;
    }

    try {
      setIsSpeaking(true);
      const result = await textToSpeech(text);
      
      if (result.success && result.audioUrl) {
        const audio = new Audio(result.audioUrl);
        audio.onended = () => {
          setIsSpeaking(false);
          setCurrentAudio(null);
          URL.revokeObjectURL(result.audioUrl!);
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          setCurrentAudio(null);
          toast({ title: "TTS Error", description: "Failed to play audio", variant: "destructive" });
        };
        
        setCurrentAudio(audio);
        await audio.play();
      } else {
        setIsSpeaking(false);
        toast({ title: "TTS Failed", description: result.error || "Unknown error", variant: "destructive" });
      }
    } catch (error) {
      setIsSpeaking(false);
      toast({ title: "TTS Error", description: "An error occurred during TTS", variant: "destructive" });
    }
  };

  // Check if microphone should be enabled
  const shouldShowMicrophone = () => {
    const settings = getSettings();
    return settings.microphoneEnabled && settings.transcriptionProvider;
  };

  // Check if TTS should be enabled
  const shouldShowTTS = () => {
    const settings = getSettings();
    return settings.ttsEnabled && settings.ttsProvider;
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
                  <div className="mt-3 flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => copyText(m.content)}>
                      <Copy className="mr-2 h-4 w-4" /> Copy response
                    </Button>
                    
                    {shouldShowTTS() && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => speakText(m.content)}
                        disabled={isSpeaking}
                      >
                        {isSpeaking ? (
                          <VolumeX className="mr-2 h-4 w-4" />
                        ) : (
                          <Volume2 className="mr-2 h-4 w-4" />
                        )}
                        {isSpeaking ? "Stop" : "Speak"}
                      </Button>
                    )}
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
          <div className="flex gap-2 items-center">
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
              disabled={loading || isTranscribing}
              className="flex-1"
            />
            
            {shouldShowMicrophone() && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleRecording}
                disabled={loading || isTranscribing}
                className="h-10 w-10 p-2 bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800 rounded-full text-white"
                title={isRecording ? "Stop recording" : "Start recording"}
              >
                {isTranscribing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : isRecording ? (
                  <Square className="h-4 w-4 text-white" />
                ) : (
                  <Mic className="h-4 w-4 text-white" />
                )}
              </Button>
            )}
          </div>
          
          <div className="flex justify-end">
            <Button variant="cafe" onClick={submit} disabled={loading || isTranscribing}>
              {loading ? "Thinking…" : "Send"}
            </Button>
          </div>
        </div>
      </footer>
    </section>
  );
}
