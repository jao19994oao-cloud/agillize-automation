import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha na autenticação');
      }

      // Salva no Contexto e LocalStorage
      login(data.user, data.token);
      
      console.log("Login bem-sucedido! Redirecionando...");
      navigate('/leads');

    } catch (err) {
      console.error("Erro no login frontend:", err);
      setError('E-mail ou senha inválidos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-8">
        <div className="text-center">
          <div className="inline-block bg-palm-neon text-black font-black text-2xl p-3 rounded-xl mb-4">A</div>
          <h1 className="text-2xl font-bold text-gray-900">Agillize</h1>
          <p className="text-sm text-gray-500">Sistema de Gestão de Leads</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">E-mail Corporativo</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-palm-neon outline-none transition-all"
              placeholder="exemplo@agillize.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Senha</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-palm-neon outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-palm-neon text-black font-bold py-4 rounded-lg hover:bg-[#b8e600] transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'PROCESSANDO...' : 'Entrar no Sistema'}
          </button>
        </form>

        <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">Tecnologia Palm © 2026</p>
      </div>
    </div>
  );
}