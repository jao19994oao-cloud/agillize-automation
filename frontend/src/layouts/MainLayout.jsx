import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BlockedScreen from '../pages/BlockedScreen';

export default function MainLayout() {
  const { logout, user, isBlocked, setSystemBlocked } = useAuth();
  const navigate = useNavigate();
  const perms = user?.permissions || {};
  
  // ESTADO NOVO: Impede que as páginas carreguem antes de checar a licença
  const [checkingLicense, setCheckingLicense] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        // Faz uma requisição leve apenas para testar o status HTTP
        const res = await fetch('http://localhost:3000/api/leads?limit=1', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // Se o backend devolver 402, ativamos o bloqueio imediatamente
        if (res.status === 402) {
            setSystemBlocked();
        }
      } catch (error) {
        console.error("Erro ao verificar status do sistema");
      } finally {
        // Libera o carregamento da interface (seja para bloquear ou para mostrar o menu)
        setCheckingLicense(false);
      }
    };

    checkStatus();
  }, []); // Executa apenas uma vez ao montar o layout

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // 1. PRIMEIRO: Se estiver checando, mostra um "Loading" simples para não quebrar
  if (checkingLicense) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-palm-neon"></div>
        </div>
      );
  }

  // 2. SEGUNDO: Se detectou bloqueio, mostra a Tela Vermelha e NÃO CARREGA O RESTO
  if (isBlocked) {
      return <BlockedScreen />;
  }

  // 3. TERCEIRO: Se está tudo ok, carrega o menu e as páginas
  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900 font-sans">
      <aside className="w-64 bg-palm-dark text-white flex flex-col shadow-2xl z-20">
        <div className="p-8 flex flex-col items-center border-b border-gray-800">
          <div className="bg-palm-neon text-black font-black text-xl w-10 h-10 flex items-center justify-center rounded-lg mb-3 shadow-[0_0_15px_rgba(204,255,0,0.3)]">A</div>
          <span className="text-xl font-bold tracking-tighter uppercase text-white">Agillize</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          {(perms.all || perms.view_leads) && (
            <NavLink to="/leads" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${isActive ? 'bg-palm-neon text-black shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}>Leads</NavLink>
          )}
          {(perms.all || perms.view_sales) && (
             <NavLink to="/vendas" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${isActive ? 'bg-palm-neon text-black shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}>Vendas</NavLink>
          )}
          {(perms.all || perms.view_finance) && (
             <NavLink to="/financeiro" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${isActive ? 'bg-palm-neon text-black shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}>Financeiro</NavLink>
          )}
          {perms.all && (
            <NavLink to="/admin" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${isActive ? 'bg-palm-neon text-black shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}>Configurações</NavLink>
          )}
        </nav>

        <div className="p-6 border-t border-gray-800 bg-black/20">
            <p className="text-[9px] text-gray-500 uppercase font-black mb-1">Perfil: {user?.role_name || 'Usuário'}</p>
            <p className="text-sm font-bold text-palm-neon truncate mb-4">{user?.name}</p>
            <button onClick={handleLogout} className="w-full bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors">Sair</button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto h-screen">
         {/* O Outlet só renderiza se não estiver bloqueado */}
         <Outlet />
      </main>
    </div>
  );
}