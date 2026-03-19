import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Notes from "@/pages/notes";
import Timetable from "@/pages/timetable";
import Goals from "@/pages/goals";
import Calendar from "@/pages/calendar";
import Mood from "@/pages/mood";
import Games from "@/pages/games";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/notes" component={Notes} />
      <Route path="/timetable" component={Timetable} />
      <Route path="/goals" component={Goals} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/mood" component={Mood} />
      <Route path="/games" component={Games} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
