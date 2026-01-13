import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from './pages/Login';
import Leads from './pages/Leads';
import Sales from './pages/Sales';
import AdminSettings from './pages/adminSettings';
import MainLayout from './layouts/MainLayout';

const ProtectedRoute = ({ children, permission }) => {
  const { user } = useAuth();
  const perms = user?.permissions || {};
  
  if (!user) return <Navigate to="/" />;
  
  // Admin (all: true) tem passe livre
  const hasAccess = perms.all === true || perms[permission] === true;
  
  if (!hasAccess) return <Navigate to="/leads" />;
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route element={<MainLayout />}>
            <Route path="/leads" element={<Leads />} />
            <Route path="/vendas" element={
              <ProtectedRoute permission="view_sales">
                <Sales />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute permission="all">
                <AdminSettings />
              </ProtectedRoute>
            } />
            <Route path="/financeiro" element={
              <ProtectedRoute permission="view_finance">
                <div className="p-8 text-2xl font-bold text-gray-800">🏦 Painel Financeiro</div>
              </ProtectedRoute>
            } />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;