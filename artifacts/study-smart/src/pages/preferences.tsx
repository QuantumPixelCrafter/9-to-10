import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetChatBalance, useUpdatePreferences } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Coins, MessageCircle, Settings } from "lucide-react";

export default function Preferences() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: balanceData, isLoading } = useGetChatBalance(!!user);
  const updatePrefsMut = useUpdatePreferences();

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

  const currentBalance = balanceData?.balance;
  const messageCost = balanceData?.messageCost ?? 10;
  const parsedThreshold = parseInt(thresholdInput, 10);
  const thresholdValid = !isNaN(parsedThreshold) && parsedThreshold >= 0;

  return (
    <Layout title="Preferences">
      <div className="max-w-xl space-y-8 pb-10">

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

        {/* Save button */}
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
