import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Layout } from "@/components/layout";
import { useSchedulesData, useCreateScheduleAction, useDeleteScheduleAction } from "@/hooks/use-schedules";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, BellRing, Trash2, Clock, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { format, addDays, subDays, isToday, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const COLORS = ["#F97316", "#3B82F6", "#10B981", "#8B5CF6", "#F43F5E", "#06B6D4", "#F59E0B"];

function parseDateParam(search: string): Date {
  const params = new URLSearchParams(search);
  const d = params.get("date");
  if (d) {
    const parsed = parseISO(d);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

export default function TimetablePage() {
  const { toast } = useToast();
  const search = useSearch();
  const [, setLocation] = useLocation();

  const [selectedDate, setSelectedDate] = useState<Date>(() => parseDateParam(search));

  useEffect(() => {
    setSelectedDate(parseDateParam(search));
  }, [search]);

  const { data: schedules = [] } = useSchedulesData();
  const createMut = useCreateScheduleAction();
  const deleteMut = useDeleteScheduleAction();

  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [day, setDay] = useState(selectedDate.getDay());
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [color, setColor] = useState(COLORS[0]);
  const [notify, setNotify] = useState(true);

  const dayOfWeek = selectedDate.getDay();
  const daySchedules = schedules
    .filter((s) => s.dayOfWeek === dayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const goToDate = (date: Date) => {
    setLocation(`/timetable?date=${format(date, "yyyy-MM-dd")}`);
  };

  const openAddDialog = () => {
    setDay(selectedDate.getDay());
    setSubject("");
    setStart("09:00");
    setEnd("10:00");
    setColor(COLORS[0]);
    setNotify(true);
    setOpen(true);
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
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
        data: { subject, dayOfWeek: day, startTime: start, endTime: end, color, notificationEnabled: notify },
      });
      setOpen(false);
      toast({ title: "Class scheduled!" });
    } catch {
      toast({ title: "Error saving schedule", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const interval = setInterval(() => {
      const now = new Date();
      const currentDay = now.getDay();
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      schedules.forEach((s) => {
        if (s.notificationEnabled && s.dayOfWeek === currentDay && s.startTime === currentTime && now.getSeconds() === 0) {
          new Notification("Class Starting Now!", { body: `Time for ${s.subject}` });
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [schedules]);

  const isTdy = isToday(selectedDate);

  return (
    <Layout
      title="Daily Timetable"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setLocation("/calendar")} className="rounded-xl gap-2 border-border/60">
            <CalendarDays className="w-4 h-4" /> Calendar
          </Button>
          <Button onClick={openAddDialog} className="rounded-xl shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" /> Add Class
          </Button>
        </div>
      }
    >
      <div className="space-y-6 pb-12">

        {/* Date Navigation */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
          <Button variant="ghost" size="icon" onClick={() => goToDate(subDays(selectedDate, 1))} className="rounded-xl shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold">{format(selectedDate, "EEEE")}</span>
              {isTdy && (
                <span className="text-xs font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Today</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{format(selectedDate, "MMMM d, yyyy")}</span>
              <input
                type="date"
                value={format(selectedDate, "yyyy-MM-dd")}
                onChange={(e) => {
                  const d = parseISO(e.target.value);
                  if (!isNaN(d.getTime())) goToDate(d);
                }}
                className="text-xs text-primary underline underline-offset-2 bg-transparent border-none outline-none cursor-pointer"
                style={{ colorScheme: "light dark" }}
              />
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={() => goToDate(addDays(selectedDate, 1))} className="rounded-xl shrink-0">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Notification Banner */}
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-primary">
            <div className="p-2 bg-background rounded-full shadow-sm">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Study Reminders</p>
              <p className="text-xs text-primary/80">Get notified when it's time to study.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={requestNotificationPermission} className="rounded-xl bg-background border-primary/20 hover:bg-primary/5 hover:text-primary whitespace-nowrap">
            Enable Notifications
          </Button>
        </div>

        {/* Schedule for the day */}
        <AnimatePresence mode="wait">
          <motion.div
            key={format(selectedDate, "yyyy-MM-dd")}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {daySchedules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                  <CalendarDays className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="text-lg font-semibold text-muted-foreground mb-1">No classes on {DAYS[dayOfWeek]}</p>
                <p className="text-sm text-muted-foreground/60 mb-6">Free day — add a class or pick another date.</p>
                <Button onClick={openAddDialog} variant="outline" className="rounded-xl gap-2">
                  <Plus className="w-4 h-4" /> Add class for {DAYS[dayOfWeek]}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {daySchedules.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group relative p-5 rounded-2xl shadow-sm border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 overflow-hidden flex items-center gap-4"
                    style={{ backgroundColor: `${item.color}10`, borderColor: `${item.color}30` }}
                  >
                    <div className="absolute left-0 inset-y-0 w-1.5 rounded-l-2xl" style={{ backgroundColor: item.color }} />

                    <div className="flex-1 pl-2">
                      <h4 className="font-bold text-base leading-tight" style={{ color: item.color }}>{item.subject}</h4>
                      <div className="flex items-center gap-1.5 text-sm font-medium mt-1" style={{ color: `${item.color}99` }}>
                        <Clock className="w-4 h-4" />
                        {item.startTime} – {item.endTime}
                      </div>
                    </div>

                    {item.notificationEnabled && (
                      <BellRing className="w-4 h-4 opacity-40 shrink-0" style={{ color: item.color }} />
                    )}

                    <button
                      onClick={() => deleteMut.mutate({ id: item.id })}
                      className="opacity-0 group-hover:opacity-100 text-destructive/70 hover:text-destructive transition-opacity bg-background/60 rounded-lg p-1.5 backdrop-blur-sm shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Schedule Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div>
              <label className="text-sm font-semibold mb-1 block">Subject Name</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Physics 101"
                className="rounded-xl bg-muted/50 border-transparent focus-visible:bg-background"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold mb-1 block">Day</label>
                <select
                  value={day}
                  onChange={(e) => setDay(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl bg-muted/50 border-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                >
                  {DAYS.map((d, i) => (
                    <option key={i} value={i}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Color</label>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${color === c ? "border-foreground scale-125" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold mb-1 block">Start Time</label>
                <Input
                  type="time"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="rounded-xl bg-muted/50 border-transparent focus-visible:bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">End Time</label>
                <Input
                  type="time"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="rounded-xl bg-muted/50 border-transparent focus-visible:bg-background"
                />
              </div>
            </div>

            <div className="flex items-center justify-between bg-muted/30 p-3 rounded-xl border border-border/50">
              <div className="space-y-0.5">
                <label className="text-sm font-semibold block">Push Notification</label>
                <p className="text-xs text-muted-foreground">Alert me when class starts</p>
              </div>
              <Switch checked={notify} onCheckedChange={setNotify} />
            </div>

            <Button
              onClick={handleSave}
              disabled={createMut.isPending || !subject}
              className="w-full rounded-xl py-6 text-base shadow-lg shadow-primary/20"
            >
              {createMut.isPending ? "Saving..." : "Add to Timetable"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
