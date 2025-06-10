
import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../../services/apiService';
import { useAuth } from '../../../../hooks/useAuth';
import { User } from '../../../types';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import { FaUsersCog, FaUserSlash, FaUserCheck, FaUserShield, FaRedo, FaExclamationTriangle, FaSpinner, FaUserTimes } from 'react-icons/fa'; // FaUserTimes for demote

const AdminUsersPage: React.FC = () => {
  const { user: adminUser, token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showBanModal, setShowBanModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showDemoteModal, setShowDemoteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banReason, setBanReason] = useState('');
  const [masterAdminPassword, setMasterAdminPassword] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [filterTerm, setFilterTerm] = useState('');

  const fetchUsers = useCallback(async () => {
    if (!token) {
        setError("Autenticação necessária.");
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const fetchedUsers = await apiService.adminGetUsers(token);
      setUsers(fetchedUsers.map(u => ({
        ...u,
        admin: !!u.admin,
        is_banned: !!u.is_banned,
        vip: !!u.vip,
      })));
    } catch (err) {
      setError((err as Error).message || 'Falha ao carregar usuários.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openBanModal = (userToBan: User) => {
    setSelectedUser(userToBan);
    setBanReason(userToBan.banned_reason || '');
    setShowBanModal(true);
    setActionError(null);
  };

  const openPromoteModal = (userToPromote: User) => {
    setSelectedUser(userToPromote);
    setMasterAdminPassword('');
    setShowPromoteModal(true);
    setActionError(null);
  };
  
  const openDemoteModal = (userToDemote: User) => {
    setSelectedUser(userToDemote);
    setMasterAdminPassword('');
    setShowDemoteModal(true);
    setActionError(null);
  };

  const handleBanUser = async () => {
    if (!token || !selectedUser) return;
    if (selectedUser.id === adminUser?.id) {
        setActionError("Você não pode banir a si mesmo.");
        return;
    }
    setIsActionLoading(true);
    setActionError(null);
    try {
      await apiService.adminBanUser(selectedUser.id, banReason, token);
      fetchUsers();
      setShowBanModal(false);
      setBanReason('');
      setSelectedUser(null);
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUnbanUser = async (userId: number) => {
    if (!token) return;
    if (userId === adminUser?.id && adminUser?.is_banned) {
        alert("Ação não permitida em sua própria conta banida.");
        return;
    }
    setIsActionLoading(true);
    setActionError(null);
    try {
      await apiService.adminUnbanUser(userId, token);
      fetchUsers();
    } catch (err) {
      alert(`Erro ao desbanir: ${(err as Error).message}`); 
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePromoteUser = async () => {
    if (!token || !selectedUser || !masterAdminPassword) {
        setActionError("Senha mestre é obrigatória.");
        return;
    }
     if (selectedUser.id === adminUser?.id) {
        setActionError("Este usuário já é administrador ou é você mesmo.");
        return;
    }
    setIsActionLoading(true);
    setActionError(null);
    try {
      await apiService.adminPromoteUser(selectedUser.id, masterAdminPassword, token);
      fetchUsers();
      setShowPromoteModal(false);
      setMasterAdminPassword('');
      setSelectedUser(null);
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDemoteUser = async () => {
    if (!token || !selectedUser || !masterAdminPassword) {
      setActionError("Senha mestre é obrigatória.");
      return;
    }
    if (selectedUser.id === adminUser?.id) {
      setActionError("Você não pode rebaixar sua própria conta.");
      return;
    }
    setIsActionLoading(true);
    setActionError(null);
    try {
      await apiService.adminDemoteUser(selectedUser.id, masterAdminPassword, token);
      fetchUsers();
      setShowDemoteModal(false);
      setMasterAdminPassword('');
      setSelectedUser(null);
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.nome.toLowerCase().includes(filterTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(filterTerm.toLowerCase()) ||
    u.id.toString().includes(filterTerm)
  );

  const inputClass = "block w-full bg-gray-700 text-gray-200 rounded-md shadow-sm p-2 focus:ring-primary focus:border-transparent text-sm";
  const modalInputClass = "block w-full bg-gray-600 text-gray-100 rounded-md p-2 text-sm";
  const modalButtonClass = (variant: 'primary' | 'danger' | 'secondary' | 'warning' = 'primary') => {
    let base = "py-2 px-4 rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center";
    if (variant === 'primary') base += " bg-primary hover:bg-purple-700 text-white";
    else if (variant === 'danger') base += " bg-red-600 hover:bg-red-700 text-white";
    else if (variant === 'warning') base += " bg-yellow-500 hover:bg-yellow-600 text-black";
    else base += " bg-gray-600 hover:bg-gray-500 text-white";
    return base;
  }

  return (
    <div className="p-2 md:p-4 bg-admin-bg rounded-lg shadow-xl text-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-primary flex items-center"><FaUsersCog className="mr-3"/>Gerenciar Usuários</h1>
        <button 
            onClick={fetchUsers} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-md text-sm flex items-center"
            disabled={isLoading || isActionLoading}
            title="Recarregar Usuários"
        >
            <FaRedo className={`mr-2 ${(isLoading || isActionLoading) ? 'animate-spin' : ''}`} /> Recarregar
        </button>
      </div>
      
      <div className="mb-4">
        <input 
            type="text"
            placeholder="Filtrar por ID, nome ou email..."
            value={filterTerm}
            onChange={(e) => setFilterTerm(e.target.value)}
            className={`${inputClass} max-w-sm`}
        />
      </div>

      {isLoading && users.length === 0 && <LoadingSpinner />}
      {error && <p className="text-red-400 text-center py-4 bg-red-900 bg-opacity-30 rounded">{error}</p>}

      {!isLoading && !error && (
        <div className="overflow-x-auto admin-custom-scrollbar bg-admin-card-bg rounded-lg shadow">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-gray-750">
              <tr>
                <th scope="col" className="px-4 py-3">ID</th>
                <th scope="col" className="px-4 py-3">Nome</th>
                <th scope="col" className="px-4 py-3">Email</th>
                <th scope="col" className="px-4 py-3">Admin</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id} className="bg-gray-800 hover:bg-gray-750 transition-colors">
                  <td className="px-4 py-2 font-medium">{u.id}</td>
                  <td className="px-4 py-2">{u.nome}</td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">{u.admin ? <span className="text-green-400 font-semibold">Sim</span> : 'Não'}</td>
                  <td className="px-4 py-2">
                    {u.is_banned ? 
                        <span className="text-red-400 font-semibold" title={u.banned_reason || 'Banido'}>Banido</span> : 
                        <span className="text-green-400">Ativo</span>
                    }
                  </td>
                  <td className="px-4 py-2 space-x-2 whitespace-nowrap">
                    {u.is_banned ? (
                      <button onClick={() => handleUnbanUser(u.id)} className="text-green-400 hover:text-green-300 disabled:opacity-50" title="Desbanir Usuário" disabled={isActionLoading || u.id === adminUser?.id}><FaUserCheck/></button>
                    ) : (
                      <button onClick={() => openBanModal(u)} className="text-red-500 hover:text-red-400 disabled:opacity-50" title="Banir Usuário" disabled={isActionLoading || u.id === adminUser?.id}><FaUserSlash/></button>
                    )}
                    {u.admin ? (
                       <button onClick={() => openDemoteModal(u)} className="text-orange-400 hover:text-orange-300 disabled:opacity-50" title="Rebaixar Admin" disabled={isActionLoading || u.id === adminUser?.id}><FaUserTimes /></button>
                    ) : (
                      <button onClick={() => openPromoteModal(u)} className="text-yellow-400 hover:text-yellow-300 disabled:opacity-50" title="Promover a Admin" disabled={isActionLoading || u.id === adminUser?.id}><FaUserShield/></button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && !isLoading && (
                <tr><td colSpan={6} className="text-center py-6 text-gray-500">Nenhum usuário encontrado com os filtros atuais.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showBanModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => {setShowBanModal(false); setSelectedUser(null);}}>
          <div className="bg-admin-sidebar-bg p-6 rounded-lg shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-red-500 mb-1 flex items-center"><FaExclamationTriangle className="mr-2"/>Banir Usuário: {selectedUser.nome}</h3>
            <p className="text-sm text-gray-400 mb-4">ID: {selectedUser.id}, Email: {selectedUser.email}</p>
            <div className="space-y-3">
                <div>
                    <label htmlFor="banReason" className="block text-sm font-medium text-gray-300">Motivo do Banimento (Opcional):</label>
                    <textarea id="banReason" value={banReason} onChange={e => setBanReason(e.target.value)} rows={3} className={`${modalInputClass} custom-scrollbar`} placeholder="Ex: Violação dos termos de serviço."/>
                </div>
                {actionError && <p className="text-xs text-red-400 bg-red-900/30 p-2 rounded">{actionError}</p>}
                <div className="flex justify-end space-x-3 pt-2">
                    <button type="button" onClick={() => {setShowBanModal(false); setSelectedUser(null);}} className={modalButtonClass('secondary')} disabled={isActionLoading}>Cancelar</button>
                    <button onClick={handleBanUser} className={modalButtonClass('danger')} disabled={isActionLoading}>
                        {isActionLoading ? <FaSpinner className="animate-spin"/> : 'Confirmar Banimento'}
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}

      {showPromoteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => {setShowPromoteModal(false); setSelectedUser(null);}}>
          <div className="bg-admin-sidebar-bg p-6 rounded-lg shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-yellow-400 mb-1">Promover a Administrador: {selectedUser.nome}</h3>
             <p className="text-sm text-gray-400 mb-4">ID: {selectedUser.id}, Email: {selectedUser.email}</p>
            <div className="space-y-3">
                <div>
                    <label htmlFor="masterAdminPasswordPromote" className="block text-sm font-medium text-gray-300">Senha Mestre de Administrador:</label>
                    <input type="password" id="masterAdminPasswordPromote" value={masterAdminPassword} onChange={e => setMasterAdminPassword(e.target.value)} className={modalInputClass} required />
                </div>
                {actionError && <p className="text-xs text-red-400 bg-red-900/30 p-2 rounded">{actionError}</p>}
                <div className="flex justify-end space-x-3 pt-2">
                    <button type="button" onClick={() => {setShowPromoteModal(false); setSelectedUser(null);}} className={modalButtonClass('secondary')} disabled={isActionLoading}>Cancelar</button>
                    <button onClick={handlePromoteUser} className={modalButtonClass('warning')} disabled={isActionLoading}>
                         {isActionLoading ? <FaSpinner className="animate-spin"/> : 'Confirmar Promoção'}
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}

      {showDemoteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => {setShowDemoteModal(false); setSelectedUser(null);}}>
          <div className="bg-admin-sidebar-bg p-6 rounded-lg shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-orange-400 mb-1 flex items-center"><FaUserTimes className="mr-2"/>Rebaixar Administrador: {selectedUser.nome}</h3>
             <p className="text-sm text-gray-400 mb-4">ID: {selectedUser.id}, Email: {selectedUser.email}</p>
            <div className="space-y-3">
                <div>
                    <label htmlFor="masterAdminPasswordDemote" className="block text-sm font-medium text-gray-300">Senha Mestre de Administrador:</label>
                    <input type="password" id="masterAdminPasswordDemote" value={masterAdminPassword} onChange={e => setMasterAdminPassword(e.target.value)} className={modalInputClass} required />
                </div>
                {actionError && <p className="text-xs text-red-400 bg-red-900/30 p-2 rounded">{actionError}</p>}
                <div className="flex justify-end space-x-3 pt-2">
                    <button type="button" onClick={() => {setShowDemoteModal(false); setSelectedUser(null);}} className={modalButtonClass('secondary')} disabled={isActionLoading}>Cancelar</button>
                    <button onClick={handleDemoteUser} className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md text-sm flex items-center justify-center" disabled={isActionLoading}>
                         {isActionLoading ? <FaSpinner className="animate-spin"/> : 'Confirmar Rebaixamento'}
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
