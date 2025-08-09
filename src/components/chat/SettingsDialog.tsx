import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { loadSettings, saveSettings, type EdisonSettings } from "@/lib/settings";
import { toast } from "@/hooks/use-toast";
import { Settings } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Props {
  onChanged?: (s: EdisonSettings) => void;
}

export default function SettingsDialog({ onChanged }: Props) {
  const [open, setOpen] = useState(false);
  const [s, setS] = useState<EdisonSettings>({});

  useEffect(() => {
    setS(loadSettings());
  }, [open]);

  const save = () => {
    saveSettings(s);
    toast({ title: "Settings saved", description: "Your preferences have been stored locally." });
    setOpen(false);
    onChanged?.(s);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Settings"><Settings className="mr-2" />Settings</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Supabase (optional)</h3>
            <p className="text-sm text-muted-foreground">Provide your Supabase URL and ANON KEY to sync chats.</p>
            <div className="grid gap-3">
              <div className="grid gap-1">
                <Label htmlFor="supabaseUrl">VITE_SUPABASE_URL</Label>
                <Input id="supabaseUrl" placeholder="https://xxxxx.supabase.co" value={s.supabaseUrl ?? ""} onChange={(e) => setS({ ...s, supabaseUrl: e.target.value })} />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="supabaseKey">VITE_SUPABASE_ANON_KEY</Label>
                <Input id="supabaseKey" type="password" placeholder="eyJhbGci..." value={s.supabaseAnonKey ?? ""} onChange={(e) => setS({ ...s, supabaseAnonKey: e.target.value })} />
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">LLM Provider</h3>
            <div className="grid gap-3">
              <div className="grid gap-1">
                <Label>Provider</Label>
                <Select value={s.provider ?? undefined} onValueChange={(v) => setS({ ...s, provider: v as any })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="groq">Groq</SelectItem>
                    <SelectItem value="gemini">Gemini</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {s.provider === "groq" && (
                <div className="grid gap-1">
                  <Label htmlFor="groqKey">GROQ_API_KEY</Label>
                  <Input id="groqKey" type="password" placeholder="gsk_..." value={s.groqApiKey ?? ""} onChange={(e) => setS({ ...s, groqApiKey: e.target.value })} />
                </div>
              )}

              {s.provider === "gemini" && (
                <div className="grid gap-1">
                  <Label htmlFor="geminiKey">GEMINI_API_KEY</Label>
                  <Input id="geminiKey" type="password" placeholder="AIza..." value={s.geminiApiKey ?? ""} onChange={(e) => setS({ ...s, geminiApiKey: e.target.value })} />
                </div>
              )}

              <div className="grid gap-1">
                <Label htmlFor="model">Model name</Label>
                <Input id="model" placeholder={s.provider === "groq" ? "llama-3.3-70b-versatile" : "gemini-2.5-flash"} value={s.model ?? ""} onChange={(e) => setS({ ...s, model: e.target.value })} />
              </div>

              <div className="grid gap-1">
                <Label htmlFor="system">System prompt (optional)</Label>
                <Textarea id="system" rows={4} placeholder="You are EdisonAI, a thoughtful assistant..." value={s.systemPrompt ?? ""} onChange={(e) => setS({ ...s, systemPrompt: e.target.value })} />
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Microphone & Transcription</h3>
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="microphoneEnabled">Enable microphone</Label>
                <Switch
                  id="microphoneEnabled"
                  checked={s.microphoneEnabled ?? false}
                  onCheckedChange={(checked) => {
                    const newSettings = { ...s, microphoneEnabled: checked };
                    // Set default transcription provider when enabling microphone
                    if (checked && !newSettings.transcriptionProvider) {
                      newSettings.transcriptionProvider = "groq";
                    }
                    setS(newSettings);
                  }}
                />
              </div>

              {s.microphoneEnabled && (
                <>
                  <div className="grid gap-1">
                    <Label>Transcription Provider</Label>
                    <Select 
                      value={s.transcriptionProvider || "groq"} 
                      onValueChange={(v) => setS({ ...s, transcriptionProvider: v as any })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="groq">Groq (Whisper)</SelectItem>
                        <SelectItem value="openai">OpenAI (Whisper)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {s.transcriptionProvider === "groq" && (
                    <div className="grid gap-1">
                      <Label htmlFor="groqTranscriptionKey">GROQ_API_KEY (for transcription)</Label>
                      <Input 
                        id="groqTranscriptionKey" 
                        type="password" 
                        placeholder="gsk_..." 
                        value={s.groqApiKey ?? ""} 
                        onChange={(e) => setS({ ...s, groqApiKey: e.target.value })} 
                      />
                      <p className="text-xs text-muted-foreground">Uses the same API key as LLM provider</p>
                    </div>
                  )}

                  {s.transcriptionProvider === "openai" && (
                    <div className="grid gap-1">
                      <Label htmlFor="openaiTranscriptionKey">OPENAI_API_KEY</Label>
                      <Input 
                        id="openaiTranscriptionKey" 
                        type="password" 
                        placeholder="sk-..." 
                        value={s.openaiApiKey ?? ""} 
                        onChange={(e) => setS({ ...s, openaiApiKey: e.target.value })} 
                      />
                    </div>
                  )}

                  <div className="grid gap-1">
                    <Label htmlFor="transcriptionModel">Transcription Model</Label>
                    <Input 
                      id="transcriptionModel" 
                      placeholder={s.transcriptionProvider === "groq" ? "whisper-large-v3-turbo" : "whisper-1"} 
                      value={s.transcriptionModel ?? ""} 
                      onChange={(e) => setS({ ...s, transcriptionModel: e.target.value })} 
                    />
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Text-to-Speech (TTS)</h3>
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="ttsEnabled">Enable TTS</Label>
                <Switch
                  id="ttsEnabled"
                  checked={s.ttsEnabled ?? false}
                  onCheckedChange={(checked) => {
                    const newSettings = { ...s, ttsEnabled: checked };
                    // Set default TTS provider when enabling TTS
                    if (checked && !newSettings.ttsProvider) {
                      newSettings.ttsProvider = "groq";
                    }
                    setS(newSettings);
                  }}
                />
              </div>

              {s.ttsEnabled && (
                <>
                  <div className="grid gap-1">
                    <Label>TTS Provider</Label>
                    <Select 
                      value={s.ttsProvider || "groq"} 
                      onValueChange={(v) => {
                        const newSettings = { ...s, ttsProvider: v as any };
                        // Auto-suggest model based on provider
                        if (v === "gemini") {
                          newSettings.ttsModel = "gemini-2.5-flash-preview-tts";
                        } else if (v === "groq") {
                          newSettings.ttsModel = "playai-tts";
                        } else if (v === "openai") {
                          newSettings.ttsModel = "tts-1";
                        }
                        setS(newSettings);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="groq">Groq (PlayAI TTS)</SelectItem>
                        <SelectItem value="openai">OpenAI (TTS-1)</SelectItem>
                        <SelectItem value="gemini">Gemini (TTS)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {s.ttsProvider === "groq" && (
                    <>
                      <div className="grid gap-1">
                        <Label htmlFor="groqTTSKey">GROQ_API_KEY (for TTS)</Label>
                        <Input 
                          id="groqTTSKey" 
                          type="password" 
                          placeholder="gsk_..." 
                          value={s.groqApiKey ?? ""} 
                          onChange={(e) => setS({ ...s, groqApiKey: e.target.value })} 
                        />
                        <p className="text-xs text-muted-foreground">Uses the same API key as LLM provider</p>
                      </div>
                      
                      <div className="grid gap-1">
                        <Label htmlFor="groqTTSModel">TTS Model</Label>
                        <Input 
                          id="groqTTSModel" 
                          placeholder="playai-tts" 
                          value={s.ttsModel ?? ""} 
                          onChange={(e) => setS({ ...s, ttsModel: e.target.value })} 
                        />
                      </div>
                      
                      <div className="grid gap-1">
                        <Label htmlFor="groqTTSVoice">Voice</Label>
                        <Input 
                          id="groqTTSVoice" 
                          placeholder="Fritz-PlayAI" 
                          value={s.ttsVoice ?? ""} 
                          onChange={(e) => setS({ ...s, ttsVoice: e.target.value })} 
                        />
                        <p className="text-xs text-muted-foreground">Available voices: Fritz-PlayAI, Clara-PlayAI, etc.</p>
                      </div>
                    </>
                  )}

                  {s.ttsProvider === "openai" && (
                    <>
                      <div className="grid gap-1">
                        <Label htmlFor="openaiTTSKey">OPENAI_API_KEY (for TTS)</Label>
                        <Input 
                          id="openaiTTSKey" 
                          type="password" 
                          placeholder="sk-..." 
                          value={s.openaiApiKey ?? ""} 
                          onChange={(e) => setS({ ...s, openaiApiKey: e.target.value })} 
                        />
                      </div>
                      
                      <div className="grid gap-1">
                        <Label htmlFor="openaiTTSModel">TTS Model</Label>
                        <Input 
                          id="openaiTTSModel" 
                          placeholder="tts-1" 
                          value={s.ttsModel ?? ""} 
                          onChange={(e) => setS({ ...s, ttsModel: e.target.value })} 
                        />
                      </div>
                      
                      <div className="grid gap-1">
                        <Label htmlFor="openaiTTSVoice">Voice</Label>
                        <Select 
                          value={s.ttsVoice || "alloy"} 
                          onValueChange={(v) => setS({ ...s, ttsVoice: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select voice" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="alloy">Alloy</SelectItem>
                            <SelectItem value="echo">Echo</SelectItem>
                            <SelectItem value="fable">Fable</SelectItem>
                            <SelectItem value="onyx">Onyx</SelectItem>
                            <SelectItem value="nova">Nova</SelectItem>
                            <SelectItem value="shimmer">Shimmer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {s.ttsProvider === "gemini" && (
                    <>
                      <div className="grid gap-1">
                        <Label htmlFor="geminiTTSKey">GEMINI_API_KEY (for TTS)</Label>
                        <Input 
                          id="geminiTTSKey" 
                          type="password" 
                          placeholder="AIza..." 
                          value={s.geminiApiKey ?? ""} 
                          onChange={(e) => setS({ ...s, geminiApiKey: e.target.value })} 
                        />
                        <p className="text-xs text-muted-foreground">Uses the same API key as LLM provider</p>
                      </div>
                      
                      <div className="grid gap-1">
                        <Label htmlFor="geminiTTSModel">TTS Model</Label>
                        <Select 
                          value={s.ttsModel || "gemini-2.5-flash-preview-tts"} 
                          onValueChange={(v) => setS({ ...s, ttsModel: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gemini-2.5-flash-preview-tts">Gemini 2.5 Flash TTS</SelectItem>
                            <SelectItem value="gemini-2.5-pro-preview-tts">Gemini 2.5 Pro TTS</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid gap-1">
                        <Label htmlFor="geminiTTSVoice">Voice</Label>
                        <Select 
                          value={s.ttsVoice || "Kore"} 
                          onValueChange={(v) => setS({ ...s, ttsVoice: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select voice" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Zephyr">Zephyr</SelectItem>
                            <SelectItem value="Puck">Puck</SelectItem>
                            <SelectItem value="Charon">Charon</SelectItem>
                            <SelectItem value="Kore">Kore</SelectItem>
                            <SelectItem value="Fenrir">Fenrir</SelectItem>
                            <SelectItem value="Leda">Leda</SelectItem>
                            <SelectItem value="Orus">Orus</SelectItem>
                            <SelectItem value="Aoede">Aoede</SelectItem>
                            <SelectItem value="Callirhoe">Callirhoe</SelectItem>
                            <SelectItem value="Autonoe">Autonoe</SelectItem>
                            <SelectItem value="Enceladus">Enceladus</SelectItem>
                            <SelectItem value="Iapetus">Iapetus</SelectItem>
                            <SelectItem value="Umbriel">Umbriel</SelectItem>
                            <SelectItem value="Algieba">Algieba</SelectItem>
                            <SelectItem value="Despina">Despina</SelectItem>
                            <SelectItem value="Erinome">Erinome</SelectItem>
                            <SelectItem value="Algenib">Algenib</SelectItem>
                            <SelectItem value="Rasalgethi">Rasalgethi</SelectItem>
                            <SelectItem value="Laomedeia">Laomedeia</SelectItem>
                            <SelectItem value="Achernar">Achernar</SelectItem>
                            <SelectItem value="Alnilam">Alnilam</SelectItem>
                            <SelectItem value="Schedar">Schedar</SelectItem>
                            <SelectItem value="Gacrux">Gacrux</SelectItem>
                            <SelectItem value="Pulcherrima">Pulcherrima</SelectItem>
                            <SelectItem value="Achird">Achird</SelectItem>
                            <SelectItem value="Zubenelgenubi">Zubenelgenubi</SelectItem>
                            <SelectItem value="Vindemiatrix">Vindemiatrix</SelectItem>
                            <SelectItem value="Sadachbia">Sadachbia</SelectItem>
                            <SelectItem value="Sadaltager">Sadaltager</SelectItem>
                            <SelectItem value="Sulafar">Sulafar</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">30 different voices available with unique characteristics</p>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </section>
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="cafe" onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
