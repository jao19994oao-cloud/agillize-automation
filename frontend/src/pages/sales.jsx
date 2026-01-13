import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregarVendas = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get('http://localhost:3000/api/sales', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSales(res.data);
    } catch (error) {
      console.error("Erro ao carregar vendas", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    carregarVendas(); 
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Painel de Vendas</h1>
          <p className="text-sm text-gray-500">Acompanhamento de conversões aprovadas</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase mr-2">Total:</span>
          <span className="text-lg font-black text-palm-dark">{sales.length}</span>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Data</th>
              <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Cliente</th>
              <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Vendedor</th>
              <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan="4" className="p-8 text-center text-gray-400">Carregando vendas...</td></tr>
            ) : sales.length === 0 ? (
              <tr><td colSpan="4" className="p-8 text-center text-gray-400 italic">Nenhuma venda encontrada no sistema.</td></tr>
            ) : (
              sales.map(sale => (
                <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(sale.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-bold text-gray-900">{sale.nome_cliente}</div>
                    <div className="text-[10px] text-gray-400">{sale.documento}</div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{sale.nome_vendedor}</td>
                  <td className="p-4">
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter">
                      Aprovado
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}