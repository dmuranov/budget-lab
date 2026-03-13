import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import AppLayout from './components/layout/AppLayout';
import Configuracion from './pages/Configuracion';
import Panel from './pages/Panel';
import Movimientos from './pages/Movimientos';
import Patrimonio from './pages/Patrimonio';
import Presupuesto from './pages/Presupuesto';
import Metas from './pages/Metas';
import AsesorIA from './pages/AsesorIA';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#0b0e13" }}>
        <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: "#1a2030", borderTopColor: "#4ade80" }}></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/Panel" replace />} />
      <Route element={<AppLayout />}>
        <Route path="/Configuracion" element={<Configuracion />} />
        <Route path="/Panel" element={<Panel />} />
        <Route path="/Movimientos" element={<Movimientos />} />
        <Route path="/Patrimonio" element={<Patrimonio />} />
        <Route path="/Presupuesto" element={<Presupuesto />} />
        <Route path="/Metas" element={<Metas />} />
        <Route path="/AsesorIA" element={<AsesorIA />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;