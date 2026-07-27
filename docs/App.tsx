import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import PastorFunnel from "./pages/PastorFunnel";
import Profile from "./pages/Profile";
import TwoFactorChallenge from "./pages/TwoFactorChallenge";
import Orders from "./pages/Orders";
import GiftRedemption from "./pages/GiftRedemption";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/pastor"} component={PastorFunnel} />
      <Route path={"/profile"} component={Profile} />
      <Route path={"/2fa-challenge"} component={TwoFactorChallenge} />
      <Route path={"/orders"} component={Orders} />
      <Route path={"/gift/:token"} component={GiftRedemption} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
