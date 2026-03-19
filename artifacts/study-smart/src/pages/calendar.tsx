import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { useSchedulesData } from "@/hooks/use-schedules";
import { useGoalsData } from "@/hooks/use-goals";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, parseISO, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Target, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

export default function CalendarPage() {
  const [, setLocation] = useLocation();
  const { data: schedules = [] } = useSchedulesData();
  const { data: goals = [] } = useGoalsData();
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const startingDayIndex = startOfMonth(currentDate).getDay();
  const blanks = Array(startingDayIndex).fill(null);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const handleDayClick = (day: Date) => {
    setLocation(`/timetable?date=${format(day, "yyyy-MM-dd")}`);
  };

  return (
    <Layout title="Calendar Overview">
      <div className="bg-card rounded-3xl border border-border/50 shadow-sm p-4 md:p-8 mb-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-display font-bold text-foreground">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth} className="rounded-full border-border/50">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth} className="rounded-full border-border/50">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center font-bold text-sm text-muted-foreground uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-2 md:gap-4 auto-rows-fr">
          {blanks.map((_, i) => (
            <div key={`blank-${i}`} className="min-h-[80px] md:min-h-[120px] rounded-2xl bg-muted/20 border border-transparent" />
          ))}

          {daysInMonth.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTdy = isToday(day);
            const dayOfWeek = day.getDay();

            const daySchedules = schedules.filter((s) => s.dayOfWeek === dayOfWeek);
            const dayGoals = goals.filter((g) => isSameDay(parseISO(g.deadline), day));

            return (
              <motion.div
                key={day.toISOString()}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleDayClick(day)}
                className={`
                  min-h-[80px] md:min-h-[120px] rounded-2xl p-1.5 md:p-3 transition-all relative
                  cursor-pointer select-none
                  ${isTdy
                    ? "bg-primary/5 border-2 border-primary/40 shadow-inner"
                    : "bg-background border border-border/60 hover:border-primary/30 hover:shadow-md"
                  }
                  ${!isCurrentMonth ? "opacity-40" : ""}
                `}
              >
                <span className={`
                  inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold mb-1
                  ${isTdy ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "text-foreground"}
                `}>
                  {format(day, "d")}
                </span>

                <div className="space-y-1 mt-0.5">
                  {dayGoals.slice(0, 2).map((g) => (
                    <div key={g.id} className="text-[10px] md:text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded flex items-center gap-1 truncate">
                      <Target className="w-3 h-3 shrink-0 hidden md:block" />
                      <span className="truncate">{g.title}</span>
                    </div>
                  ))}
                  {dayGoals.length > 2 && (
                    <div className="text-[10px] font-bold text-red-500 pl-1">+{dayGoals.length - 2} goals</div>
                  )}

                  {daySchedules.slice(0, 2).map((s) => (
                    <div
                      key={s.id}
                      className="text-[10px] md:text-xs font-medium px-1.5 py-0.5 rounded flex items-center gap-1 truncate"
                      style={{ backgroundColor: `${s.color}18`, color: s.color }}
                    >
                      <BookOpen className="w-3 h-3 shrink-0 hidden md:block" />
                      <span className="truncate">{s.subject}</span>
                    </div>
                  ))}
                  {daySchedules.length > 2 && (
                    <div className="text-[10px] font-bold pl-1 text-muted-foreground">+{daySchedules.length - 2} more</div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Tap any date to view that day's timetable
        </p>
      </div>
    </Layout>
  );
}
