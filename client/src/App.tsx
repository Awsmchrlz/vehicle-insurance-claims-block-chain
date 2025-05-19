import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Claims from "@/pages/Claims";
import Blockchain from "@/pages/Blockchain";
import Explorer from "@/pages/Explorer";
import Policies from "@/pages/Policies";
import References from "@/pages/References";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/claims" component={Claims} />
      <Route path="/blockchain" component={Blockchain} />
      <Route path="/explorer" component={Explorer} />
      <Route path="/policies" component={Policies} />
      <Route path="/references" component={References} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppLayout>
          <Router />
        </AppLayout>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
