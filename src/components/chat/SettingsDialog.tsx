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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="cafe" onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
