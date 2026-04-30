import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { AskKWIButton } from "@/components/insights/AskKWIButton";
import Dashboard from "./pages/Dashboard";
import DailyLog from "./pages/DailyLog";
import Records from "./pages/Records";
import Insights from "./pages/Insights";
import DoctorReport from "./pages/DoctorReport";
import Settings from "./pages/Settings";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { onboarded } = useApp();

  if (!onboarded) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="/log" element={<AppLayout><DailyLog /></AppLayout>} />
        <Route path="/records" element={<AppLayout><Records /></AppLayout>} />
        <Route path="/insights" element={<AppLayout><Insights /></AppLayout>} />
        <Route path="/doctor-report" element={<AppLayout><DoctorReport /></AppLayout>} />
        <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <AskKWIButton />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
