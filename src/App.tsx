import { ReactNode, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { AskKWIButton } from "@/components/insights/AskKWIButton";
import Dashboard from "./pages/Dashboard";
import DailyLog from "./pages/DailyLog";
import Records from "./pages/Records";
import Insights from "./pages/Insights";
import DoctorReport from "./pages/DoctorReport";
import Settings from "./pages/Settings";
import Onboarding from "./pages/Onboarding";
import SignIn from "./pages/SignIn";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <p className="text-muted-foreground text-sm">Loading…</p>
  </div>
);

const RootRedirect = () => {
  const { loading, isAuthenticated, hasCompletedOnboarding, user, profile } = useAuth();
  if (loading || (user && profile === null)) return <LoadingScreen />;
  if (isAuthenticated && hasCompletedOnboarding) return <Navigate to="/dashboard" replace />;
  if (isAuthenticated) return <Navigate to="/onboarding" replace />;
  return <Navigate to="/signin" replace />;
};

const OnboardingGuard = ({ children }: { children: ReactNode }) => {
  const { loading, isAuthenticated, hasCompletedOnboarding, user, profile } = useAuth();
  if (loading || (user && profile === null)) return <LoadingScreen />;
  if (isAuthenticated && hasCompletedOnboarding) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated, hasCompletedOnboarding } = useAuth();
  return (
    <>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/onboarding" element={<OnboardingGuard><Onboarding /></OnboardingGuard>} />
        <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
        <Route path="/log" element={<ProtectedRoute><AppLayout><DailyLog /></AppLayout></ProtectedRoute>} />
        <Route path="/records" element={<ProtectedRoute><AppLayout><Records /></AppLayout></ProtectedRoute>} />
        <Route path="/insights" element={<ProtectedRoute><AppLayout><Insights /></AppLayout></ProtectedRoute>} />
        <Route path="/doctor-report" element={<ProtectedRoute><AppLayout><DoctorReport /></AppLayout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {isAuthenticated && hasCompletedOnboarding && <AskKWIButton />}
    </>
  );
};

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppProvider>
            <ScrollToTop />
            <AppRoutes />
          </AppProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;
