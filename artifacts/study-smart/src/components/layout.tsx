import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, BookOpen, Calendar as CalendarIcon, 
  Target, Clock, Smile, Menu,
  BrainCircuit, Sparkles, ChevronRight, Gamepad2, Trophy, User, LogOut, Medal, ShoppingBag, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@workspace/replit-auth-web";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
}

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: Home, color: "text-blue-500", bg: "bg-blue-500/10" },
  { href: "/notes", label: "Notes & Subjects", icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
  { href: "/timetable", label: "Timetable", icon: Clock, color: "text-secondary", bg: "bg-secondary/10" },
  { href: "/goals", label: "Goals", icon: Target, color: "text-accent", bg: "bg-accent/10" },
  { href: "/calendar", label: "Calendar", icon: CalendarIcon, color: "text-purple-500", bg: "bg-purple-500/10" },
  { href: "/mood", label: "Mood Check-in", icon: Smile, color: "text-pink-500", bg: "bg-pink-500/10" },
  { href: "/games", label: "Minigames", icon: Gamepad2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" },
  { href: "/achievements", label: "Achievements", icon: Medal, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  { href: "/shop", label: "Shop", icon: ShoppingBag, color: "text-rose-500", bg: "bg-rose-500/10" },
  { href: "/friends", label: "Friends", icon: Users, color: "text-teal-500", bg: "bg-teal-500/10" },
];

function UserAvatar({ size = "sm" }: { size?: "sm" | "md" }) {
  const { user } = useAuth();
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Me";
  const initials = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
  const dim = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";

  if (user?.profileImageUrl) {
    return <img src={user.profileImageUrl} alt={displayName} className={`${dim} rounded-xl object-cover border-2 border-border/40`} />;
  }
  return (
    <div className={`${dim} rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold`}>
      {initials}
    </div>
  );
}

export function Layout({ children, title, actions }: LayoutProps) {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Student";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pl-64 flex flex-col">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-card border-r border-border/50 shadow-sm z-40">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">Study Smart</span>
        </div>
        
        <div className="px-4 py-2 flex-1 overflow-y-auto">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">Menu</p>
          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}>
                  <div className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group relative overflow-hidden
                    ${isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}
                  `}>
                    {isActive && (
                      <motion.div 
                        layoutId="activeNav" 
                        className="absolute inset-0 bg-primary/10 rounded-xl"
                        initial={false}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-lg ${isActive ? item.bg : 'bg-transparent group-hover:bg-background'}`}>
                      <item.icon className={`w-4 h-4 ${isActive ? item.color : 'text-current'}`} />
                    </div>
                    <span className="relative z-10 text-sm">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Profile section at bottom */}
        <div className="p-4 border-t border-border/40">
          <Link href="/profile">
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all group
              ${location === "/profile" ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}>
              <UserAvatar size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || "My Profile"}</p>
              </div>
            </div>
          </Link>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className={`
        md:hidden fixed top-0 inset-x-0 z-40 transition-all duration-300
        ${scrolled ? 'glass-panel py-3' : 'bg-transparent py-4'}
        px-4 flex items-center justify-between
      `}>
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 md:hidden bg-card/50 backdrop-blur-sm border border-border/50">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 border-r-0 flex flex-col">
              <div className="p-6 flex items-center gap-3 bg-card border-b border-border/50">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="font-display font-bold text-xl tracking-tight">Study Smart</span>
              </div>
              <div className="p-4 flex-1 overflow-y-auto">
                <nav className="space-y-2">
                  {NAV_ITEMS.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <SheetTrigger asChild>
                        <div className={`
                          flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer
                          ${location === item.href ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'}
                        `}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.bg}`}>
                            <item.icon className={`w-4 h-4 ${item.color}`} />
                          </div>
                          <span>{item.label}</span>
                          <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                        </div>
                      </SheetTrigger>
                    </Link>
                  ))}
                </nav>
              </div>
              <div className="p-4 border-t border-border/40">
                <Link href="/profile">
                  <SheetTrigger asChild>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted">
                      <UserAvatar size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{displayName}</p>
                        <p className="text-xs text-muted-foreground">{user?.email || "View profile"}</p>
                      </div>
                    </div>
                  </SheetTrigger>
                </Link>
                <button onClick={logout} className="w-full mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl text-destructive hover:bg-destructive/5 text-sm transition-colors">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </SheetContent>
          </Sheet>
          
          <div className="flex flex-col">
            <span className="font-display font-bold text-lg leading-none">{title || "Study Smart"}</span>
            {title && <span className="text-xs text-muted-foreground md:hidden">Study Smart App</span>}
          </div>
        </div>
        
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </header>

      {/* Desktop Header */}
      <header className={`
        hidden md:flex sticky top-0 z-30 transition-all duration-300
        ${scrolled ? 'glass-panel py-4' : 'bg-transparent py-6'}
        px-8 items-center justify-between
      `}>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          {actions}
          <Link href="/profile">
            <div className="cursor-pointer hover:opacity-80 transition-opacity">
              <UserAvatar size="sm" />
            </div>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pt-24 md:pt-6 md:px-8 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-card border-t border-border/50 pb-safe z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around p-2">
          {[...NAV_ITEMS.slice(0, 4), { href: "/profile", label: "Profile", icon: User, color: "text-slate-500", bg: "bg-slate-500/10" }].map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div className="flex flex-col items-center justify-center p-2 min-w-[56px] cursor-pointer">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? `${item.bg} scale-110` : 'text-muted-foreground hover:bg-muted'}`}>
                    <item.icon className={`w-5 h-5 ${isActive ? item.color : ''}`} />
                  </div>
                  <span className={`text-[10px] mt-1 font-medium transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {item.label.split(' ')[0]}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
