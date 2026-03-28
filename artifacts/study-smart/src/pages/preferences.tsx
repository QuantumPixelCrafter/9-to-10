import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetChatBalance, useUpdatePreferences } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useThemeMode } from "@/lib/theme-context";
import { cn } from "@/lib/utils";
import { AlertTriangle, Coins, MessageCircle, Settings, Sun, Moon, Monitor, Globe2, EyeOff, Languages } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { LANGUAGES, type LangCode } from "@/lib/languages";

export default function Preferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useThemeMode();
  const { lang, setLang } = useLanguage();

  const { data: balanceData, isLoading } = useGetChatBalance(!!user);
  const updatePrefsMut = useUpdatePreferences();

  const handleLangChange = async (code: LangCode) => {
    setLang(code);
    try {
      await updatePrefsMut.mutateAsync({ preferredLanguage: code });
      toast({ title: "Language updated" });
    } catch {
      toast({ title: "Failed to save language", variant: "destructive" });
    }
  };

  const [warningEnabled, setWarningEnabled] = useState(false);
  const [thresholdInput, setThresholdInput] = useState("50");
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    if (balanceData && !initialised) {
      if (balanceData.threshold !== null) {
        setWarningEnabled(true);
        setThresholdInput(String(balanceData.threshold));
      } else {
        setWarningEnabled(false);
        setThresholdInput("50");
      }
      setInitialised(true);
    }
  }, [balanceData, initialised]);

  const handleSave = async () => {
    const threshold = warningEnabled ? Math.max(0, parseInt(thresholdInput, 10) || 0) : null;
    await updatePrefsMut.mutateAsync({ chatPointWarningThreshold: threshold });
    toast({
      title: "Preferences saved",
      description: warningEnabled
        ? `You'll be warned when your balance drops to ${threshold} pts or below.`
        : "Messaging balance warnings are now off.",
    });
  };

  const handleVisibility = async (value: boolean) => {
    try {
      await updatePrefsMut.mutateAsync({ isPublic: value });
      toast({ title: value ? "Account set to public" : "Account set to private" });
      window.location.reload();
    } catch {
      toast({ title: "Failed to update visibility", variant: "destructive" });
    }
  };

  const currentBalance = balanceData?.balance;
  const messageCost = balanceData?.messageCost ?? 10;
  const parsedThreshold = parseInt(thresholdInput, 10);
  const thresholdValid = !isNaN(parsedThreshold) && parsedThreshold >= 0;

  const isPublic = (user as any)?.isPublic ?? true;

  return (
    <Layout title="Preferences">
      <div className="max-w-xl space-y-6 pb-10">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-muted/60">
            <Settings className="w-6 h-6 text-foreground/70" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Preferences</h2>
            <p className="text-sm text-muted-foreground">Customise your Mind Forge experience</p>
          </div>
        </div>

        {/* Language */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 shrink-0 mt-0.5">
              <Languages className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold">Language</h3>
              <p className="text-sm text-muted-foreground">Choose your preferred display language.</p>
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => handleLangChange(l.code)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-xl border text-left text-sm transition-all",
                  lang === l.code
                    ? "border-blue-500 bg-blue-500/5 font-semibold text-blue-600 dark:text-blue-400"
                    : "border-transparent hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="text-lg shrink-0">{l.flag}</span>
                <div className="flex flex-col min-w-0 flex-1">
                  <span>{l.nativeName}</span>
                  {l.nativeName !== l.name && <span className="text-[10px] text-muted-foreground">{l.name}</span>}
                </div>
                {lang === l.code && <span className="text-blue-500 text-xs font-bold shrink-0">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-primary/10 shrink-0 mt-0.5">
              <Monitor className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Appearance</h3>
              <p className="text-sm text-muted-foreground">Choose between light, dark, or system-based theme.</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: "light",  label: "Light",  Icon: Sun },
              { value: "dark",   label: "Dark",   Icon: Moon },
              { value: "system", label: "Auto",   Icon: Monitor },
            ] as const).map(({ value, label, Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-all duration-200",
                  theme === value
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Account Visibility */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 shrink-0 mt-0.5">
              <Globe2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold">Account Visibility</h3>
              <p className="text-sm text-muted-foreground">Control who can see your profile and scores.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {([
              { value: true,  label: "Public",  sub: "Visible on leaderboard & search", Icon: Globe2 },
              { value: false, label: "Private", sub: "Hidden from other users",          Icon: EyeOff },
            ] as const).map(({ value, label, sub, Icon }) => {
              const isSelected = isPublic === value;
              return (
                <button
                  key={String(value)}
                  onClick={() => handleVisibility(value)}
                  disabled={updatePrefsMut.isPending}
                  className={cn(
                    "flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all duration-200",
                    isSelected
                      ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20"
                      : "border-border bg-background text-muted-foreground hover:border-emerald-400/40"
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">{label}</span>
                  </div>
                  <span className={cn("text-[10px] leading-tight", isSelected ? "text-white/70" : "text-muted-foreground/60")}>{sub}</span>
                </button>
              );
            })}
          </div>

          {/* Fine-grained privacy settings (private accounts only) */}
          {isPublic === false && (
            <div className="border-t border-border/40 pt-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Privacy Preferences</p>
              {([
                {
                  key: "showNameOnLeaderboard" as const,
                  label: "Show name on leaderboard",
                  sub: "Others see your display name instead of just your username",
                },
              ]).map(({ key, label, sub }) => (
                <div key={key} className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-xl bg-muted/30">
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug">{label}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{sub}</p>
                  </div>
                  <Switch
                    checked={((user as any)?.[key] ?? true) as boolean}
                    onCheckedChange={async (v) => {
                      await updatePrefsMut.mutateAsync({ [key]: v });
                    }}
                    disabled={updatePrefsMut.isPending}
                    className="shrink-0"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Messaging cost section */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-primary/10 shrink-0 mt-0.5">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold">Messaging cost</h3>
              <p className="text-sm text-muted-foreground">
                Each message you send to a friend costs <span className="font-semibold text-amber-500">{messageCost} pts</span>.
                Receiving messages is always free.
              </p>
              {currentBalance !== undefined && (
                <div className="flex items-center gap-1.5 text-sm mt-1">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  <span>Your current balance: <span className="font-bold text-foreground">{currentBalance.toLocaleString()} pts</span></span>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border/40 pt-5 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Low-balance warning</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Get notified in your inbox and in the chat when your points drop below a set amount.
                </p>
              </div>
              <Switch
                checked={warningEnabled}
                onCheckedChange={setWarningEnabled}
                disabled={isLoading}
              />
            </div>

            {warningEnabled && (
              <div className="bg-muted/40 rounded-xl p-4 space-y-3">
                <label className="text-sm font-medium">
                  Warn me when my balance drops to or below:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={999999}
                    value={thresholdInput}
                    onChange={e => setThresholdInput(e.target.value)}
                    className="w-32 px-3 py-2 rounded-xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm text-muted-foreground">pts</span>
                </div>
                {!thresholdValid && (
                  <p className="text-xs text-destructive">Please enter a valid number (0 or more).</p>
                )}
                {thresholdValid && parsedThreshold > 0 && currentBalance !== undefined && currentBalance <= parsedThreshold && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Your current balance is already at or below this threshold.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Save button (for messaging prefs) */}
        <Button
          onClick={handleSave}
          disabled={updatePrefsMut.isPending || isLoading || (warningEnabled && !thresholdValid)}
          className="rounded-xl px-8"
        >
          {updatePrefsMut.isPending ? "Saving…" : "Save preferences"}
        </Button>
      </div>
    </Layout>
  );
}
