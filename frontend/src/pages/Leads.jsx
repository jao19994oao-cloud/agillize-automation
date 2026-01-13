import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Leads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [products, setProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [providers, setProviders] = useState([]); 
  
  const [selectedLead, setSelectedLead] = useState(null);
  const [showModal, setShowModal] = useState(false); 
  const [showFinalModal, setShowFinalModal] = useState(false); 

  // Estados Admin
  const [obsAdmin, setObsAdmin] = useState('');
  const [approvedProviders, setApprovedProviders] = useState([]); 

  // Estado Venda
  const [selectedSaleProvider, setSelectedSaleProvider] = useState(''); 
  
  // FORMULÁRIO DE LEAD
  const [formData, setFormData] = useState({ 
      nome_cliente: '', 
      documento: '', 
      endereco: '', 
      nascimento: '', 
      nome_mae: '', 
      observacoes: '' 
  });
  
  const [interestedProviders, setInterestedProviders] = useState([]); 
  
  // DADOS DA VENDA (Contato + Observações novas)
  const [finalData, setFinalData] = useState({ contato: '', email: '', observacoes: '' });
  const [cart, setCart] = useState([{ group_id: '', product_id: '', quantity: 1 }]);

  const isAdmin = user?.permissions?.all === true;

  useEffect(() => {
    fetchLeads();
    fetchCatalog();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/leads', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setLeads(data);
    } catch (error) { console.error("Erro ao buscar leads", error); }
  };

  const fetchCatalog = async () => {
    try {
        const token = localStorage.getItem('token');
        const [pRes, gRes, provRes] = await Promise.all([
            fetch('http://localhost:3000/api/sales/products', { headers: { Authorization: `Bearer ${token}` } }),
            fetch('http://localhost:3000/api/sales/groups', { headers: { Authorization: `Bearer ${token}` } }),
            fetch('http://localhost:3000/api/sales/providers?active=true', { headers: { Authorization: `Bearer ${token}` } }) 
        ]);

        setProducts(await pRes.json());
        setGroups(await gRes.json());
        
        const providersData = await provRes.json();
        if (Array.isArray(providersData)) {
            setProviders(providersData);
        } else {
            setProviders([]);
        }
        
    } catch (error) { console.error("Erro ao carregar catálogo", error); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (interestedProviders.length === 0) {
        return alert("Selecione pelo menos um Provedor para análise.");
    }

    try {
      const response = await fetch('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
            ...formData, 
            vendedor_id: user.id, 
            status_id: 1, 
            interested_providers: interestedProviders
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("✅ Lead enviado para análise com sucesso!");
        setFormData({ nome_cliente: '', documento: '', endereco: '', nascimento: '', nome_mae: '', observacoes: '' });
        setInterestedProviders([]);
        fetchLeads();
      } else {
        alert("❌ Erro ao cadastrar: " + (data.error || "Erro desconhecido"));
      }
    } catch (error) { 
        alert("⚠️ Erro de conexão com o servidor.");
    }
  };

  const updateStatus = async (statusName) => {
    try {
      const response = await fetch(`http://localhost:3000/api/leads/${selectedLead.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
            status: statusName, 
            observacoes_admin: obsAdmin,
            approved_providers: approvedProviders
        }),
      });

      if (response.ok) {
        alert(`Lead atualizado para: ${statusName}`);
        setShowModal(false);
        fetchLeads();
      }
    } catch (error) { console.error("Erro ao atualizar status", error); }
  };

  const handleConvertToSale = async (e) => {
    e.preventDefault();
    if (!selectedSaleProvider) return alert("Selecione o provedor da venda!");

    const salePayload = {
        lead_id: selectedLead.id,
        provider_id: selectedSaleProvider,
        nascimento: selectedLead.nascimento, 
        ...finalData, // Inclui a nova observação aqui
        items: cart.map(item => ({ product_id: item.product_id, quantity: item.quantity }))
    };

    try {
        const response = await fetch('http://localhost:3000/api/sales/convert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify(salePayload)
        });

        if (response.ok) {
            alert("Venda realizada com sucesso!");
            setShowFinalModal(false);
            fetchLeads();
        } else {
            const err = await response.json();
            alert("Erro: " + err.error);
        }
    } catch (error) { alert("Erro de conexão"); }
  };

  const addCartItem = () => setCart([...cart, { group_id: '', product_id: '', quantity: 1 }]);
  const removeCartItem = (index) => setCart(cart.filter((_, i) => i !== index));
  const updateCartItem = (index, field, value) => {
    const newCart = [...cart];
    newCart[index][field] = value;
    if (field === 'group_id') newCart[index].product_id = ''; 
    setCart(newCart);
  };
  const toggleProvider = (id, list, setList) => {
      if (list.includes(id)) setList(list.filter(item => item !== id));
      else setList([...list, id]);
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in bg-gray-50 min-h-screen">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter">Gestão de Leads</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Análise de Viabilidade e Crédito</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* NOVO LEAD: FORMULÁRIO DE ANÁLISE */}
        <div className="bg-white p-8 rounded-[40px] shadow-xl h-fit border border-gray-100">
          <h2 className="text-xl font-black uppercase mb-6 italic">Dados para Análise</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input required placeholder="Nome Completo do Cliente" className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-palm-neon transition-all" value={formData.nome_cliente} onChange={e => setFormData({...formData, nome_cliente: e.target.value})} />
            
            <div className="grid grid-cols-2 gap-4">
               <input required placeholder="CPF" className="p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none" value={formData.documento} onChange={e => setFormData({...formData, documento: e.target.value})} />
               <div className="relative">
                   <p className="absolute -top-2 left-2 bg-white px-1 text-[9px] font-black text-gray-400 uppercase">Nascimento</p>
                   <input required type="date" className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none" value={formData.nascimento} onChange={e => setFormData({...formData, nascimento: e.target.value})} />
               </div>
            </div>

            <input required placeholder="Nome da Mãe" className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none" value={formData.nome_mae} onChange={e => setFormData({...formData, nome_mae: e.target.value})} />
            <input required placeholder="Endereço Completo" className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none" value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} />
            <textarea placeholder="Observações..." className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none h-24 resize-none" value={formData.observacoes} onChange={e => setFormData({...formData, observacoes: e.target.value})} />
            
            <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Solicitar Análise na:</p>
                <div className="grid grid-cols-2 gap-2">
                    {providers.map(p => (
                        <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="accent-palm-neon" 
                                checked={interestedProviders.includes(p.id)}
                                onChange={() => toggleProvider(p.id, interestedProviders, setInterestedProviders)} />
                            <span className="text-xs font-bold text-gray-700">{p.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            <button type="submit" className="w-full bg-black text-palm-neon font-black py-5 rounded-2xl shadow-lg hover:scale-[1.02] transition-transform uppercase text-xs tracking-widest">Enviar para Análise</button>
          </form>
        </div>

        {/* LISTAGEM */}
        <div className="lg:col-span-2 space-y-4">
          {leads.map(lead => (
            <div key={lead.id} onClick={() => { setSelectedLead(lead); setObsAdmin(lead.observacoes || ''); setApprovedProviders(lead.approved_providers || []); setShowModal(true); }} className="group bg-white p-6 rounded-3xl shadow-sm hover:shadow-xl border border-gray-100 cursor-pointer transition-all hover:border-palm-neon">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{lead.nome_cliente}</h3>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mt-1">CPF: {lead.documento}</p>
                </div>
                <div className="text-right">
                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                    lead.status_name === 'NOVO' ? 'bg-blue-50 text-blue-600' :
                    lead.status_name === 'APROVADO' ? 'bg-palm-neon text-black' :
                    lead.status_name === 'CONCLUIDO' ? 'bg-green-100 text-green-700' :
                    'bg-red-50 text-red-600'
                    }`}>
                    {lead.status_name}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-2">{new Date(lead.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DETALHES */}
      {showModal && selectedLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden">
            <div className="p-8 bg-black text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">{selectedLead.nome_cliente}</h2>
                <p className="text-xs text-gray-400 font-mono mt-1">CPF: {selectedLead.documento}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition-colors">✕</button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-8 text-sm">
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase">Mãe</p>
                    <p className="font-bold text-gray-800">{selectedLead.nome_mae}</p>
                </div>
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase">Nascimento</p>
                    <p className="font-bold text-gray-800">{selectedLead.nascimento ? new Date(selectedLead.nascimento).toLocaleDateString('pt-BR') : '-'}</p>
                </div>
                <div className="col-span-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Endereço</p>
                    <p className="font-bold text-gray-800">{selectedLead.endereco}</p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  <p className="text-[10px] font-black text-blue-400 uppercase mb-2">Interesse em:</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedLead.interested_providers && selectedLead.interested_providers.map(provId => {
                        const prov = providers.find(p => p.id === provId);
                        return prov ? <span key={provId} className="bg-white px-2 py-1 rounded text-xs font-bold text-blue-600">{prov.name}</span> : null;
                    })}
                  </div>
              </div>

              {isAdmin && selectedLead.status_name === 'NOVO' && (
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200">
                  <h3 className="font-black text-sm uppercase mb-4">Área de Aprovação</h3>
                  
                  <div className="mb-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Aprovar nos Provedores:</p>
                    <div className="grid grid-cols-3 gap-2">
                        {providers.map(p => (
                            <label key={p.id} className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border border-gray-100 hover:border-palm-neon">
                                <input type="checkbox" className="accent-palm-neon" 
                                    checked={approvedProviders.includes(p.id)}
                                    onChange={() => toggleProvider(p.id, approvedProviders, setApprovedProviders)} />
                                <span className="text-xs font-bold">{p.name}</span>
                            </label>
                        ))}
                    </div>
                  </div>

                  <textarea placeholder="Observações da análise..." className="w-full p-4 bg-white rounded-2xl text-sm font-bold border border-gray-200 outline-none h-24 mb-4" value={obsAdmin} onChange={e => setObsAdmin(e.target.value)} />
                  <div className="flex gap-3">
                    <button onClick={() => updateStatus('APROVADO')} className="flex-1 bg-green-500 text-white font-black py-4 rounded-xl shadow-lg hover:bg-green-600 uppercase text-xs">Aprovar Lead</button>
                    <button onClick={() => updateStatus('REPROVADO')} className="flex-1 bg-red-500 text-white font-black py-4 rounded-xl shadow-lg hover:bg-red-600 uppercase text-xs">Reprovar</button>
                  </div>
                </div>
              )}

              {selectedLead.status_name === 'APROVADO' && (
                <button onClick={() => { setShowModal(false); setShowFinalModal(true); }} className="w-full bg-palm-neon text-black font-black py-4 rounded-2xl shadow-xl uppercase text-sm tracking-widest hover:scale-[1.02] transition-transform">
                    Gerar Venda Agora
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL FINAL DE VENDA */}
      {showFinalModal && selectedLead && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden">
            <div className="p-8 bg-black text-white">
              <h2 className="text-xl font-black uppercase italic">Finalizar Venda</h2>
              <p className="text-xs text-gray-400 mt-1">Preencha os dados de contato e escolha o plano</p>
            </div>
            
            <form onSubmit={handleConvertToSale} className="p-8 space-y-4 max-h-[80vh] overflow-y-auto">
              
              <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100">
                  <label className="text-[10px] font-black text-yellow-600 uppercase mb-2 block">Provedor Aprovado:</label>
                  <select className="w-full p-3 bg-white rounded-xl font-bold text-sm outline-none border-2 border-yellow-200 focus:border-yellow-400" 
                    value={selectedSaleProvider} 
                    onChange={e => { setSelectedSaleProvider(e.target.value); setCart([{ group_id: '', product_id: '', quantity: 1 }]); }} required>
                      <option value="">-- Escolha um --</option>
                      {selectedLead.approved_providers && selectedLead.approved_providers.map(provId => {
                          const prov = providers.find(p => p.id === provId);
                          return prov ? <option key={provId} value={provId}>{prov.name}</option> : null;
                      })}
                  </select>
              </div>

              {/* DADOS DE CONTATO E OBSERVAÇÃO */}
              <div className="space-y-4 border-t border-gray-100 pt-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase">Dados de Contato e Instalação:</p>
                  <input required placeholder="Telefone / WhatsApp" className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-xs" value={finalData.contato} onChange={e => setFinalData({...finalData, contato: e.target.value})} />
                  <input required placeholder="E-mail" type="email" className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-xs" value={finalData.email} onChange={e => setFinalData({...finalData, email: e.target.value})} />
                  
                  {/* NOVO CAMPO: OBSERVAÇÕES DA VENDA */}
                  <textarea placeholder="Obs. de Instalação (Ex: Melhor horário, cuidado com cão...)" className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-xs outline-none h-20 resize-none" value={finalData.observacoes} onChange={e => setFinalData({...finalData, observacoes: e.target.value})} />
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Planos</p>
                    <button type="button" onClick={addCartItem} className="text-[10px] font-black text-palm-neon bg-black px-3 py-1 rounded-lg uppercase">+ Item</button>
                </div>
                
                <div className="space-y-2">
                  {cart.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <select className="flex-1 p-3 bg-gray-50 rounded-xl font-bold text-xs outline-none" value={item.group_id} onChange={e => updateCartItem(index, 'group_id', e.target.value)} required disabled={!selectedSaleProvider}>
                        <option value="">Grupo</option>
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>

                      <select className="flex-[2] p-3 bg-gray-50 rounded-xl font-bold text-xs outline-none" value={item.product_id} onChange={e => updateCartItem(index, 'product_id', e.target.value)} required disabled={!item.group_id || !selectedSaleProvider}>
                        <option value="">Produto</option>
                        {products
                          .filter(p => p.category_id == item.group_id && p.provider_id == selectedSaleProvider) 
                          .map(p => (
                            <option key={p.id} value={p.id}>{p.name} - R$ {p.price}</option>
                          ))
                        }
                      </select>

                      <input type="number" className="w-16 p-3 bg-gray-50 rounded-xl font-bold text-center text-xs outline-none" value={item.quantity} onChange={e => updateCartItem(index, 'quantity', e.target.value)} min="1" required />
                      
                      {cart.length > 1 && (
                        <button type="button" onClick={() => removeCartItem(index)} className="text-red-400 font-black px-2">×</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                  <button type="submit" className="flex-1 bg-palm-neon text-black font-black py-4 rounded-xl shadow-lg hover:brightness-105 transition-all uppercase text-sm">Confirmar Venda</button>
                  <button type="button" onClick={() => setShowFinalModal(false)} className="px-6 text-gray-400 text-[10px] font-black uppercase">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}