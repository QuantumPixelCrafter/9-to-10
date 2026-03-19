import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { useSchedulesData, useCreateScheduleAction, useDeleteScheduleAction } from "@/hooks/use-schedules";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, BellRing, Trash2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const COLORS = ["#F97316", "#3B82F6", "#10B981", "#8B5CF6", "#F43F5E", "#06B6D4", "#F59E0B"];

export default function TimetablePage() {
  const { toast } = useToast();
  const { data: schedules = [] } = useSchedulesData();
  const createMut = useCreateScheduleAction();
  const deleteMut = useDeleteScheduleAction();

  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [day, setDay] = useState(1);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [color, setColor] = useState(COLORS[0]);
  const [notify, setNotify] = useState(true);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast({ title: "Browser does not support notifications", variant: "destructive" });
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      toast({ title: "Notifications enabled!" });
    } else {
      toast({ title: "Notifications denied", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!subject) return;
    try {
      await createMut.mutateAsync({
        data: { subject, dayOfWeek: day, startTime: start, endTime: end, color, notificationEnabled: notify }
      });
      setOpen(false);
      setSubject("");
      toast({ title: "Class scheduled!" });
    } catch(e) {
      toast({ title: "Error saving schedule", variant: "destructive" });
    }
  };

  // Setup actual notifications (simplified simulation)
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== "granted") return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const currentDay = now.getDay();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      schedules.forEach(s => {
        if (s.notificationEnabled && s.dayOfWeek === currentDay && s.startTime === currentTime && now.getSeconds() === 0) {
          new Notification("Class Starting Now!", { body: `Time for ${s.subject}` });
        }
      });
    }, 1000); // check every second

    return () => clearInterval(interval);
  }, [schedules]);

  // Group by day for the grid
  const scheduleGrid = DAYS.map((d, i) => ({
    name: d,
    items: schedules.filter(s => s.dayOfWeek === i).sort((a,b) => a.startTime.localeCompare(b.startTime))
  }));

  // Show Mon-Fri mostly, hide Sun/Sat if empty on mobile
  const displayGrid = scheduleGrid.filter((day, i) => i !== 0 && i !== 6 || day.items.length > 0);

  return (
    <Layout 
      title="Weekly Timetable"
      actions={
        <Button onClick={() => setOpen(true)} className="rounded-xl shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" /> Add Class
        </Button>
      }
    >
      <div className="space-y-6 pb-12">
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-primary">
            <div className="p-2 bg-background rounded-full shadow-sm"><BellRing className="w-5 h-5" /></div>
            <div>
              <p className="font-bold text-sm">Study Reminders</p>
              <p className="text-xs text-primary/80">Get notified when it's time to study.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={requestNotificationPermission} className="rounded-xl bg-background border-primary/20 hover:bg-primary/5 hover:text-primary whitespace-nowrap">
            Enable Notifications
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {displayGrid.map((day) => (
            <div key={day.name} className="flex flex-col gap-3">
              <div className="bg-card border border-border/50 rounded-xl p-3 text-center shadow-sm sticky top-[72px] md:top-[88px] z-20">
                <span className="font-display font-bold text-foreground">{day.name}</span>
              </div>
              
              <div className="space-y-3">
                {day.items.length === 0 ? (
                  <div className="h-24 rounded-xl border-2 border-dashed border-border/50 flex items-center justify-center text-muted-foreground/50 text-sm font-medium">
                    Free day
                  </div>
                ) : (
                  day.items.map(item => (
                    <div 
                      key={item.id} 
                      className="group relative p-4 rounded-xl shadow-sm border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 overflow-hidden"
                      style={{ backgroundColor: `${item.color}10`, borderColor: `${item.color}30` }}
                    >
                      <div className="absolute left-0 inset-y-0 w-1.5" style={{ backgroundColor: item.color }} />
                      
                      <div className="flex justify-between items-start mb-2 pl-1">
                        <h4 className="font-bold leading-tight" style={{ color: item.color }}>{item.subject}</h4>
                        <button 
                          onClick={() => deleteMut.mutate({ id: item.id })}
                          className="opacity-0 group-hover:opacity-100 text-destructive/70 hover:text-destructive transition-opacity bg-background/50 rounded-md p-1 backdrop-blur-sm -mt-1 -mr-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-xs font-semibold pl-1" style={{ color: `${item.color}90` }}>
                        <Clock className="w-3.5 h-3.5" />
                        {item.startTime} - {item.endTime}
                      </div>

                      {item.notificationEnabled && (
                        <div className="absolute bottom-2 right-2 opacity-50" style={{ color: item.color }}>
                          <BellRing className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Schedule Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div>
              <label className="text-sm font-semibold mb-1 block">Subject Name</label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Physics 101" className="rounded-xl bg-muted/50 border-transparent focus-visible:bg-background" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold mb-1 block">Day</label>
                <select 
                  value={day} onChange={e => setDay(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl bg-muted/50 border-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                >
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Color</label>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {COLORS.map(c => (
                    <button 
                      key={c} onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${color === c ? 'border-foreground scale-125' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold mb-1 block">Start Time</label>
                <Input type="time" value={start} onChange={e => setStart(e.target.value)} className="rounded-xl bg-muted/50 border-transparent focus-visible:bg-background" />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">End Time</label>
                <Input type="time" value={end} onChange={e => setEnd(e.target.value)} className="rounded-xl bg-muted/50 border-transparent focus-visible:bg-background" />
              </div>
            </div>

            <div className="flex items-center justify-between bg-muted/30 p-3 rounded-xl border border-border/50">
              <div className="space-y-0.5">
                <label className="text-sm font-semibold block">Push Notification</label>
                <p className="text-xs text-muted-foreground">Alert me when class starts</p>
              </div>
              <Switch checked={notify} onCheckedChange={setNotify} />
            </div>

            <Button onClick={handleSave} disabled={createMut.isPending || !subject} className="w-full rounded-xl py-6 text-base shadow-lg shadow-primary/20">
              {createMut.isPending ? "Saving..." : "Add to Timetable"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
