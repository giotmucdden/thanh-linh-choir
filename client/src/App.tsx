import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LangProvider } from "./contexts/LangContext";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Navbar from "./components/Navbar";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/admin"} component={Admin} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <LangProvider>
          <TooltipProvider>
            <Toaster richColors position="top-right" />
            {/* Navbar only on non-admin pages */}
            <Route path="/">
              <Navbar />
            </Route>
            <Router />
          </TooltipProvider>
        </LangProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
