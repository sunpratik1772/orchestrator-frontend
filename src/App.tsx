import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CommandPalette } from "@/components/CommandPalette";
import { useApplyTheme } from "@/lib/theme";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import WorkflowList from "@/pages/WorkflowList";
import WorkflowEditor from "@/pages/WorkflowEditor";
import NewWorkflow from "@/pages/NewWorkflow";
import Blocks from "@/pages/Blocks";
import Settings from "@/pages/Settings";
import Logs from "@/pages/Logs";
import Tables from "@/pages/Tables";
import Files from "@/pages/Files";
import KnowledgeBase from "@/pages/KnowledgeBase";
import ScheduledTasks from "@/pages/ScheduledTasks";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 10_000 },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/workflows" component={WorkflowList} />
      <Route path="/workflows/new" component={NewWorkflow} />
      <Route path="/workflows/:id" component={WorkflowEditor} />
      <Route path="/blocks" component={Blocks} />
      <Route path="/settings" component={Settings} />
      <Route path="/logs" component={Logs} />
      <Route path="/tables" component={Tables} />
      <Route path="/files" component={Files} />
      <Route path="/knowledge-base" component={KnowledgeBase} />
      <Route path="/scheduled-tasks" component={ScheduledTasks} />
      <Route path="/search" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useApplyTheme();
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
          <CommandPalette />
        </WouterRouter>
        <Toaster />
        <SonnerToaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
