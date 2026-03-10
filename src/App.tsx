import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import NotFound from "./pages/NotFound.tsx";
import History from "./pages/History.tsx";
import Result from "./pages/Result.tsx";
import AdminLayout from "./components/admin/AdminLayout.tsx";
import DashboardPage from "./pages/admin/DashboardPage.tsx";
import ClientesPage from "./pages/admin/ClientesPage.tsx";
import RelatoriosPage from "./pages/admin/RelatoriosPage.tsx";
import NotificacoesPage from "./pages/admin/NotificacoesPage.tsx";
import ConfiguracoesPage from "./pages/admin/ConfiguracoesPage.tsx";
import PlanoPage from "./pages/admin/PlanoPage.tsx";
import CreditosPage from "./pages/admin/CreditosPage.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/privacidade" element={<PrivacyPolicy />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/history" element={<History />} />
            <Route path="/result/:id" element={<Result />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="clientes" element={<ClientesPage />} />
              <Route path="relatorios" element={<RelatoriosPage />} />
              <Route path="notificacoes" element={<NotificacoesPage />} />
              <Route path="configuracoes" element={<ConfiguracoesPage />} />
              <Route path="plano" element={<PlanoPage />} />
              <Route path="creditos" element={<CreditosPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
