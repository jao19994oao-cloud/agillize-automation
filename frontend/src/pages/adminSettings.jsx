import React, { useState, useEffect } from 'react';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('users'); // users, products, manage_groups, providers
  const [groupType, setGroupType] = useState('products'); 
  
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [products, setProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [providers, setProviders] = useState([]);
  const [systemPerms, setSystemPerms] = useState([]);

  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Estados dos Formulários
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role_id: '' });
  const [prodForm, setProdForm] = useState({ category_id: '', provider_id: '', name: '', price: '' });
  const [provForm, setProvForm] = useState({ name: '', razao_social: '', cnpj: '', email: '', contato: '', endereco: '', commission_resale: '', commission_seller: '' });
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedPerms, setSelectedPerms] = useState({});

  const token = localStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
        const [resU, resR, resP, resG, resProv, resPerms] = await Promise.all([
            fetch('http://localhost:3000/api/admin/users', { headers }),
            fetch('http://localhost:3000/api/admin/roles', { headers }),
            fetch('http://localhost:3000/api/admin/products', { headers }),
            fetch('http://localhost:3000/api/admin/groups', { headers }),
            fetch('http://localhost:3000/api/admin/providers', { headers }),
            fetch('http://localhost:3000/api/admin/permissions-list', { headers })
        ]);
        setUsers(await resU.json());
        setRoles(await resR.json());
        setProducts(await resP.json());
        setGroups(await resG.json());
        setProviders(await resProv.json());
        setSystemPerms(await resPerms.json());
    } catch (err) { console.error(err); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    let url, body;
    
    if(activeTab === 'users') { url = 'users'; body = userForm; }
    else if(activeTab === 'products') { url = 'products'; body = prodForm; }
    else if(activeTab === 'providers') { url = 'providers'; body = provForm; }
    else if(activeTab === 'manage_groups') {
        if (groupType === 'products') { url = 'groups'; body = { name: newGroupName }; }
        else { url = 'roles'; body = { name: newGroupName, permissions: selectedPerms }; }
    }

    try {
        const res = await fetch(`http://localhost:3000/api/admin/${url}`, { method: 'POST', headers, body: JSON.stringify(body) });
        if (res.ok) {
            fetchData();
            // Limpa formulários
            setNewGroupName(''); setSelectedPerms({});
            setUserForm({ name: '', email: '', password: '', role_id: '' });
            setProdForm({ category_id: '', provider_id: '', name: '', price: '' });
            setProvForm({ name: '', razao_social: '', cnpj: '', email: '', contato: '', endereco: '', commission_resale: '', commission_seller: '' });
            alert("Cadastrado com sucesso!");
        } else {
            const errData = await res.json();
            alert("Erro: " + (errData.error || "Falha ao cadastrar"));
        }
    } catch (err) { alert("Erro de conexão"); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    let endpoint = '';
    if (selectedItem.type === 'user') endpoint = 'users';
    else if (selectedItem.type === 'product') endpoint = 'products';
    else if (selectedItem.type === 'role') endpoint = 'roles';
    else if (selectedItem.type === 'group') endpoint = 'groups';
    else if (selectedItem.type === 'provider') endpoint = 'providers';

    try {
        const res = await fetch(`http://localhost:3000/api/admin/${endpoint}/${selectedItem.id}`, {
            method: 'PUT', headers, body: JSON.stringify(selectedItem)
        });
        if (res.ok) { setShowModal(false); fetchData(); alert("Atualizado!"); }
        else { alert("Erro ao atualizar"); }
    } catch (err) { console.error(err); }
  };

  const handleDelete = async () => {
    if(!window.confirm("ATENÇÃO: Deseja realmente excluir/inativar este item?")) return;
    let endpoint = selectedItem.type === 'group' ? 'groups' : selectedItem.type + 's';
    if (selectedItem.type === 'provider') endpoint = 'providers';
    
    try {
        const res = await fetch(`http://localhost:3000/api/admin/${endpoint}/${selectedItem.id}`, { method: 'DELETE', headers });
        if (res.ok) { setShowModal(false); fetchData(); alert("Item removido/inativado."); }
        else { 
            const errData = await res.json();
            alert("Erro: " + (errData.error || "Não foi possível excluir")); 
        }
    } catch (err) { alert("Erro de conexão"); }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <h1 className="text-4xl font-black uppercase italic mb-8 tracking-tighter">Configurações</h1>
      
      <div className="flex gap-4 mb-8 overflow-x-auto">
        {['users', 'providers', 'products', 'manage_groups'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase transition-all whitespace-nowrap ${activeTab === t ? 'bg-palm-neon text-black shadow-lg' : 'bg-white text-gray-400'}`}>
            {t === 'users' ? 'Vendedores' : t === 'providers' ? 'Provedores' : t === 'products' ? 'Produtos' : 'Grupos/Cargos'}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* LADO ESQUERDO: FORMULÁRIOS */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 h-fit">
          <h2 className="text-xl font-black uppercase mb-6 italic">Novo Cadastro</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            
            {/* FORM: USUÁRIOS */}
            {activeTab === 'users' && (
                <>
                    <input placeholder="Nome" className="w-full p-4 bg-gray-50 rounded-xl font-bold border-none outline-none" value={userForm.name} onChange={e=>setUserForm({...userForm, name:e.target.value})} required />
                    <input placeholder="Email" className="w-full p-4 bg-gray-50 rounded-xl font-bold border-none outline-none" value={userForm.email} onChange={e=>setUserForm({...userForm, email:e.target.value})} required />
                    <input type="password" placeholder="Senha" className="w-full p-4 bg-gray-50 rounded-xl font-bold border-none outline-none" value={userForm.password} onChange={e=>setUserForm({...userForm, password:e.target.value})} required />
                    <select className="w-full p-4 bg-gray-50 rounded-xl font-bold border-none outline-none" value={userForm.role_id} onChange={e=>setUserForm({...userForm, role_id:e.target.value})} required>
                        <option value="">Selecione o Cargo</option>
                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </>
            )}

            {/* FORM: PROVEDORES */}
            {activeTab === 'providers' && (
                <>
                    <input placeholder="Nome Fantasia" className="w-full p-4 bg-gray-50 rounded-xl font-bold border-none outline-none" value={provForm.name} onChange={e=>setProvForm({...provForm, name:e.target.value})} required />
                    <input placeholder="Razão Social" className="w-full p-4 bg-gray-50 rounded-xl font-bold border-none outline-none" value={provForm.razao_social} onChange={e=>setProvForm({...provForm, razao_social:e.target.value})} />
                    <input placeholder="CNPJ" className="w-full p-4 bg-gray-50 rounded-xl font-bold border-none outline-none" value={provForm.cnpj} onChange={e=>setProvForm({...provForm, cnpj:e.target.value})} />
                    <div className="flex gap-2">
                        <input placeholder="% Revenda" type="number" className="w-1/2 p-4 bg-gray-50 rounded-xl font-bold border-none outline-none" value={provForm.commission_resale} onChange={e=>setProvForm({...provForm, commission_resale:e.target.value})} />
                        <input placeholder="% Vendedor" type="number" className="w-1/2 p-4 bg-gray-50 rounded-xl font-bold border-none outline-none" value={provForm.commission_seller} onChange={e=>setProvForm({...provForm, commission_seller:e.target.value})} />
                    </div>
                </>
            )}

            {/* FORM: PRODUTOS */}
            {activeTab === 'products' && (
                <>
                    <input placeholder="Nome do Produto" className="w-full p-4 bg-gray-50 rounded-xl font-bold border-none outline-none" value={prodForm.name} onChange={e=>setProdForm({...prodForm, name:e.target.value})} required />
                    <input placeholder="Preço (ex: 1200,00)" className="w-full p-4 bg-gray-50 rounded-xl font-bold border-none outline-none" value={prodForm.price} onChange={e=>setProdForm({...prodForm, price:e.target.value})} required />
                    <select className="w-full p-4 bg-gray-50 rounded-xl font-bold border-none outline-none" value={prodForm.provider_id} onChange={e=>setProdForm({...prodForm, provider_id:e.target.value})} required>
                        <option value="">Selecione o Provedor</option>
                        {providers.filter(p => p.active).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select className="w-full p-4 bg-gray-50 rounded-xl font-bold border-none outline-none" value={prodForm.category_id} onChange={e=>setProdForm({...prodForm, category_id:e.target.value})} required>
                        <option value="">Selecione o Grupo</option>
                        {groups.filter(g => g.active).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                </>
            )}

            {/* FORM: GRUPOS E CARGOS */}
            {activeTab === 'manage_groups' && (
                <>
                    <div className="flex gap-2 p-1 bg-gray-100 rounded-lg mb-4">
                        <button type="button" onClick={()=>setGroupType('products')} className={`flex-1 py-2 text-[9px] font-black rounded ${groupType==='products'?'bg-white':'text-gray-400'}`}>GRUPO PROD.</button>
                        <button type="button" onClick={()=>setGroupType('roles')} className={`flex-1 py-2 text-[9px] font-black rounded ${groupType==='roles'?'bg-white':'text-gray-400'}`}>CARGOS</button>
                    </div>
                    <input placeholder="Nome" className="w-full p-4 bg-gray-50 rounded-xl font-bold border-none outline-none" value={newGroupName} onChange={e=>setNewGroupName(e.target.value)} required />
                    {groupType === 'roles' && (
                        <div className="p-4 bg-gray-50 rounded-xl space-y-2 max-h-40 overflow-y-auto">
                            {systemPerms.map(p => (
                                <label key={p.id} className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                                    <input type="checkbox" className="accent-palm-neon" checked={!!selectedPerms[p.key_name]} onChange={()=>setSelectedPerms({...selectedPerms, [p.key_name]: !selectedPerms[p.key_name]})} />
                                    {p.display_name}
                                </label>
                            ))}
                        </div>
                    )}
                </>
            )}
            <button type="submit" className="w-full bg-black text-palm-neon py-5 rounded-2xl font-black text-xs uppercase italic tracking-widest shadow-lg hover:scale-[1.02] transition-transform">Cadastrar</button>
          </form>
        </div>

        {/* LADO DIREITO: LISTAGEM */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <table className="w-full text-left">
            <tbody className="divide-y divide-gray-50">
              {activeTab === 'users' && users.map(u => (
                <tr key={u.id} onClick={() => {setSelectedItem({...u, type: 'user'}); setShowModal(true);}} className="hover:bg-gray-50 cursor-pointer">
                  <td className="p-6 font-bold text-sm">{u.name}<br/><span className="text-xs text-gray-400 font-normal">{u.email}</span></td>
                  <td className="p-6 text-[9px] font-black uppercase text-gray-400">{u.role_name}</td>
                  <td className="p-6"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${u.active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{u.active ? 'Ativo' : 'Bloqueado'}</span></td>
                </tr>
              ))}
              
              {/* LISTA DE PROVEDORES */}
              {activeTab === 'providers' && providers.map(p => (
                <tr key={p.id} onClick={() => {setSelectedItem({...p, type: 'provider'}); setShowModal(true);}} className="hover:bg-gray-50 cursor-pointer border-l-4 border-purple-500">
                    <td className="p-6 font-bold text-sm">{p.name}<br/><span className="text-xs text-gray-400 font-normal">{p.razao_social}</span></td>
                    <td className="p-6 text-xs">Rev: {p.commission_resale}% | Vend: {p.commission_seller}%</td>
                    <td className="p-6"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${p.active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{p.active ? 'Ativo' : 'Inativo'}</span></td>
                </tr>
              ))}

              {/* LISTA DE PRODUTOS */}
              {activeTab === 'products' && products.map(p => (
                <tr key={p.id} onClick={() => {setSelectedItem({...p, type: 'product'}); setShowModal(true);}} className="hover:bg-gray-50 cursor-pointer">
                  <td className="p-6 font-bold text-sm">{p.name}<br/><span className="text-xs text-gray-400 font-normal">{p.provider_name} • {p.category_name}</span></td>
                  <td className="p-6 text-sm font-bold">R$ {p.price}</td>
                  <td className="p-6"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${p.active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{p.active ? 'Ativo' : 'Inativo'}</span></td>
                </tr>
              ))}

              {activeTab === 'manage_groups' && (
                <>
                  {groups.map(g => (
                    <tr key={g.id} onClick={() => {setSelectedItem({...g, type: 'group'}); setShowModal(true);}} className="hover:bg-gray-50 cursor-pointer">
                      <td className="p-6 font-bold text-sm">{g.name}</td>
                      <td className="p-6 text-right"><span className={`text-[9px] font-black px-2 py-1 rounded uppercase mr-2 ${g.active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{g.active ? 'Ativo' : 'Inativo'}</span></td>
                    </tr>
                  ))}
                  {roles.map(r => (
                    <tr key={r.id} onClick={() => {setSelectedItem({...r, type: 'role'}); setShowModal(true);}} className="hover:bg-gray-50 cursor-pointer">
                      <td className="p-6 font-bold text-sm">{r.name}</td>
                      <td className="p-6 text-right"><span className="text-[9px] font-black bg-palm-neon/20 text-black px-2 py-1 rounded uppercase">Cargo</span></td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE EDIÇÃO */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-8 bg-black text-white flex justify-between items-center">
              <h2 className="text-xl font-black uppercase italic">Editar {selectedItem.type === 'provider' ? 'Provedor' : selectedItem.type}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleUpdate} className="p-8 space-y-4">
              
              {/* EDIÇÃO PROVEDOR */}
              {selectedItem.type === 'provider' && (
                  <>
                    <input className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none" value={selectedItem.name} onChange={e=>setSelectedItem({...selectedItem, name:e.target.value})} placeholder="Nome Fantasia" />
                    <input className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none" value={selectedItem.razao_social || ''} onChange={e=>setSelectedItem({...selectedItem, razao_social:e.target.value})} placeholder="Razão Social" />
                    <div className="flex gap-2">
                        <input type="number" className="w-1/2 p-4 bg-gray-50 rounded-2xl font-bold outline-none" value={selectedItem.commission_resale} onChange={e=>setSelectedItem({...selectedItem, commission_resale:e.target.value})} placeholder="% Revenda" />
                        <input type="number" className="w-1/2 p-4 bg-gray-50 rounded-2xl font-bold outline-none" value={selectedItem.commission_seller} onChange={e=>setSelectedItem({...selectedItem, commission_seller:e.target.value})} placeholder="% Vendedor" />
                    </div>
                  </>
              )}

              {/* EDIÇÃO PRODUTO (COM SELECT DE PROVEDOR) */}
              {selectedItem.type === 'product' && (
                <>
                   <input className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none" value={selectedItem.name} onChange={e=>setSelectedItem({...selectedItem, name:e.target.value})} placeholder="Nome" />
                   <input className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none" value={selectedItem.price} onChange={e=>setSelectedItem({...selectedItem, price:e.target.value})} placeholder="Preço" />
                   <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none" value={selectedItem.provider_id || ''} onChange={e=>setSelectedItem({...selectedItem, provider_id:e.target.value})}>
                        <option value="">Selecione o Provedor</option>
                        {providers.filter(p => p.active).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                   </select>
                   <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none" value={selectedItem.category_id} onChange={e=>setSelectedItem({...selectedItem, category_id:e.target.value})}>
                        {groups.filter(g => g.active).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                   </select>
                </>
              )}

              {/* EDIÇÃO USUÁRIO */}
              {selectedItem.type === 'user' && (
                <>
                   <input className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none" value={selectedItem.name} onChange={e=>setSelectedItem({...selectedItem, name:e.target.value})} />
                   <input className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none" value={selectedItem.email} onChange={e=>setSelectedItem({...selectedItem, email:e.target.value})} />
                   <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none" value={selectedItem.role_id} onChange={e=>setSelectedItem({...selectedItem, role_id:e.target.value})}>
                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                   </select>
                </>
              )}

              {/* EDIÇÃO GRUPO */}
              {selectedItem.type === 'group' && (
                   <input className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none" value={selectedItem.name} onChange={e=>setSelectedItem({...selectedItem, name:e.target.value})} />
              )}

              {/* EDIÇÃO CARGO */}
              {selectedItem.type === 'role' && (
                  <>
                    <input className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none" value={selectedItem.name} onChange={e=>setSelectedItem({...selectedItem, name:e.target.value})} />
                    <div className="p-4 bg-gray-50 rounded-2xl space-y-2 max-h-48 overflow-y-auto">
                        {systemPerms.map(p => (
                            <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="accent-palm-neon" checked={!!selectedItem.permissions?.[p.key_name]} onChange={(e)=>setSelectedItem({...selectedItem, permissions: {...selectedItem.permissions, [p.key_name]: e.target.checked}})} />
                                <span className="text-xs font-bold">{p.display_name}</span>
                            </label>
                        ))}
                    </div>
                  </>
              )}

              {/* STATUS (GLOBAL) */}
              {selectedItem.type !== 'role' && (
                <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none" value={selectedItem.active} onChange={e=>setSelectedItem({...selectedItem, active: e.target.value === 'true'})}>
                    <option value="true">ATIVO</option>
                    <option value="false">INATIVO / BLOQUEADO</option>
                </select>
              )}

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-black text-palm-neon py-5 rounded-2xl font-black text-xs uppercase italic tracking-widest shadow-lg">Salvar</button>
                <button type="button" onClick={handleDelete} className="px-8 bg-red-50 text-red-500 rounded-2xl font-black text-[10px] uppercase">{selectedItem.type === 'role' ? 'Excluir' : 'Inativar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}