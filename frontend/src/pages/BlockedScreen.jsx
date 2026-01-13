import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function BlockedScreen() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  
  // Estado para o Modal de Pix
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixData, setPixData] = useState({ image: '', code: '' });
  const [loading, setLoading] = useState(false);
  
  const isAdmin = user?.permissions?.all === true;

  useEffect(() => {
    if (isAdmin) fetchInvoices();
  }, [isAdmin]);

  const fetchInvoices = async () => {
      try {
          const token = localStorage.getItem('token');
          const res = await fetch('http://localhost:3000/api/financial/invoices', {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          
          const data = await res.json();
          
          // BLINDAGEM: Se der erro e não vier array, define vazio para não dar tela preta
          if (Array.isArray(data)) {
              setInvoices(data);
          } else {
              console.error("Erro formato faturas:", data);
              setInvoices([]); 
          }
      } catch (err) { 
          console.error("Erro ao buscar faturas", err);
          setInvoices([]);
      }
  };

  const handleGeneratePix = async (id) => {
      setLoading(true);
      try {
          const token = localStorage.getItem('token');
          const res = await fetch(`http://localhost:3000/api/financial/generate-pix/${id}`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          
          if (res.ok) {
              setPixData({ image: data.qrCodeImage, code: data.copyPaste });
              setShowPixModal(true);
          } else {
              alert("Erro: " + (data.error || "Falha ao gerar Pix"));
          }
      } catch (err) { alert("Erro de conexão com gateway"); }
      setLoading(false);
  };

  const checkUnlock = () => {
      window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 animate-fade-in relative overflow-hidden font-sans">
      
      {/* Fundo Decorativo */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 to-red-900"></div>

      <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-3xl max-w-2xl w-full shadow-2xl relative z-10 text-white">
          
          <div className="flex items-center gap-4 mb-6">
              <div className="bg-red-500/20 p-4 rounded-full animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                  <h1 className="text-3xl font-black uppercase italic tracking-tighter">Acesso Suspenso</h1>
                  <p className="text-gray-400 text-sm">Identificamos pendências financeiras.</p>
              </div>
          </div>

          {!isAdmin ? (
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-2xl text-center">
                  <p className="text-yellow-200 font-bold mb-2">Atenção, Colaborador</p>
                  <p className="text-gray-400 text-sm">
                      O acesso ao sistema foi temporariamente interrompido. 
                      Por favor, entre em contato com o administrador ou gestor financeiro da sua empresa para regularização.
                  </p>
              </div>
          ) : (
              <div className="space-y-4">
                  <p className="text-gray-300 text-sm mb-4">
                      Abaixo estão as faturas em aberto. Realize o pagamento via PIX para liberação imediata.
                  </p>

                  <div className="space-y-3">
                      {/* BLINDAGEM: Garante que invoices é array antes de mapear */}
                      {Array.isArray(invoices) && invoices.map(inv => (
                          <div key={inv.id} className="bg-white p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
                              <div>
                                  <p className="font-black text-gray-900 uppercase text-sm">{inv.description}</p>
                                  <p className="text-xs text-red-600 font-bold uppercase">Vencimento: {new Date(inv.due_date).toLocaleDateString('pt-BR')}</p>
                              </div>
                              <div className="text-right flex items-center gap-4">
                                  <span className="font-bold text-lg text-gray-900">R$ {inv.amount}</span>
                                  <button 
                                    onClick={() => handleGeneratePix(inv.id)}
                                    className="bg-[#25D366] hover:bg-[#1ebc57] text-white px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                                  >
                                      {loading ? 'Gerando...' : 'Pagar com Pix'}
                                  </button>
                              </div>
                          </div>
                      ))}

                      {(!invoices || invoices.length === 0) && (
                          <div className="text-center py-4 bg-white/5 rounded-xl border border-white/10">
                              <p className="text-gray-400 text-sm italic">Nenhuma fatura pendente encontrada.</p>
                              <p className="text-[10px] text-gray-500 mt-1">(Se o bloqueio persistir, contate o suporte)</p>
                          </div>
                      )}
                  </div>
              </div>
          )}
      </div>
      
      {/* MODAL DO PIX */}
      {showPixModal && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
              <div className="bg-white p-8 rounded-3xl max-w-md w-full text-center relative">
                  <button onClick={() => setShowPixModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black font-bold">✕</button>
                  <h3 className="text-xl font-black uppercase mb-4 text-black">Escaneie para Pagar</h3>
                  
                  {pixData.image ? (
                      <img src={`data:image/png;base64,${pixData.image}`} alt="Pix QRCode" className="mx-auto w-64 h-64 mb-4 border border-gray-200 rounded-lg" />
                  ) : (
                      <div className="w-64 h-64 mx-auto bg-gray-100 flex items-center justify-center mb-4 rounded-lg text-gray-400 text-xs">QR Code Indisponível visualmente</div>
                  )}
                  
                  <textarea readOnly className="w-full p-3 bg-gray-100 text-xs rounded-xl mb-4 h-24 border-none outline-none resize-none font-mono text-gray-600" value={pixData.code} />
                  
                  <div className="space-y-2">
                      <button onClick={() => navigator.clipboard.writeText(pixData.code)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors">Copiar Código Pix</button>
                      <button onClick={checkUnlock} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl animate-pulse shadow-lg transition-colors">JÁ PAGUEI (Liberar Sistema)</button>
                  </div>
              </div>
          </div>
      )}
      
      <p className="mt-8 text-xs text-gray-600 font-mono">CODE: LICENSE_SUSPENDED_402</p>
    </div>
  );
}