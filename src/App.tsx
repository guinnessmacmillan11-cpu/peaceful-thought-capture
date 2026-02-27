import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useSyncExternalStore, useState } from "react";
import Index from "./pages/Index";
import Talk from "./pages/Talk";
import Journal from "./pages/Journal";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import BottomNav from "./components/BottomNav";
import { getProfile, subscribeProfile } from "./lib/user-store";

const queryClient = new QueryClient();

function AppContent() {
  const profile = useSyncExternalStore(subscribeProfile, getProfile, getProfile);
  const [onboarded, setOnboarded] = useState(profile.onboardingComplete);

  if (!onboarded) {
    return <Onboarding onComplete={() => setOnboarded(true)} />;
  }

  return (
    <>
      <div className="pb-16">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/talk" element={<Talk />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <BottomNav />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
