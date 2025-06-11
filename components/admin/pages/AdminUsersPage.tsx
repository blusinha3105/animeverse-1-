
import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../../services/apiService';
import { useAuth } from '../../../hooks/useAuth';
import { User } from '../../../types';
import LoadingSpinner from '../../LoadingSpinner';
import { FaUserShield, FaUserSlash, FaUserPlus, FaUserMinus, FaRedo, FaFilter, FaTimes, FaCrown, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const MASTER_ADMIN_PASSWORD_PLACEHOLDER = "SUPER_ADMIN_PASSWORD_123"; // Placeholder, ideally env var

const AdminUsersPage: React.FC = () => {
  const { user: adminUser, token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [showBanModal, setShowBanModal] = useState(false);
  const [showMasterPasswordModal, setShowMasterPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banReason, setBanReason] = useState('');
  const [masterPasswordInput, setMasterPasswordInput] = useState('');
  const [actionType, setActionType] = useState<'promote' | 'demote' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!token) {
      setError("Autenticação necessária.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setActionError(null);
    setActionSuccess(null);
    try {
      const fetchedUsers = await apiService.adminGetUsers(token);
      setUsers(fetchedUsers);
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
  };

  const handleBanUser = async () => {
    if (!selectedUser || !token) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      await apiService.adminBanUser(selectedUser.id, banReason, token);
      setActionSuccess(`Usuário ${selectedUser.nome} banido com sucesso.`);
      fetchUsers(); // Refresh list
      setShowBanModal(false);
    } catch (err) {
      setActionError((err as Error).message);
    }
  };

  const handleUnbanUser = async (userId: number) => {
    if (!token || !window.confirm("Tem certeza que deseja desbanir este usuário?")) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      await apiService.adminUnbanUser(userId, token);
      setActionSuccess(`Usuário ID ${userId} desbanido com sucesso.`);
      fetchUsers(); // Refresh list
    } catch (err) {
      setActionError((err as Error).message);
    }
  };

  const openMasterPasswordModal = (userToModify: User, type: 'promote' | 'demote') => {
    setSelectedUser(userToModify);
    setActionType(type);
    setShowMasterPasswordModal(true);
  };

  const handleAdminAction = async () => {
    if (!selectedUser || !actionType || !token) return;
    setActionError(null);
    setActionSuccess(null);

    // Basic client-side check for master password.
    // In a real app, this password check should be part of the backend logic too for security.
    if (masterPasswordInput !== MASTER_ADMIN_PASSWORD_PLACEHOLDER) {
        setActionError("Senha mestre incorreta.");
        return;
    }

    try {
      if (actionType === 'promote') {
        await apiService.adminPromoteUser(selectedUser.id, masterPasswordInput, token);
        setActionSuccess(`Usuário ${selectedUser.nome} promovido a admin.`);
      } else if (actionType === 'demote') {
        await apiService.adminDemoteUser(selectedUser.id, masterPasswordInput, token);
        setActionSuccess(`Usuário ${selectedUser.nome} rebaixado de admin.`);
      }
      fetchUsers();
      setShowMasterPasswordModal(false);
      setMasterPasswordInput('');
    } catch (err) {
      setActionError((err as Error).message);
    }
  };
  
  const filteredUsers = users.filter(u => 
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id.toString().includes(searchTerm)
  );

  const inputClass = "bg-gray-700 text-gray-200 text-sm rounded-lg focus:ring-primary focus:border-transparent block w-full p-2.5";
  const modalInputClass = "bg-gray-800 text-gray-200 text-sm rounded-lg focus:ring-primary focus:border-transparent block w-full p-2.5";
  const buttonClass = "py-2 px-4 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center";

  return (
    <div className="p-2 md:p-4 bg-admin-bg rounded-lg shadow-xl text-gray-200">
      <h1 className="text-2xl font-semibold text-primary mb-6">Gerenciar Usuários</h1>

      {actionError && <div className="mb-4 p-3 bg-red-900 text-red-200 rounded-md text-sm flex items-center"><FaExclamationTriangle className="mr-2"/>{actionError}</div>}
      {actionSuccess && <div className="mb-4 p-3 bg-green-800 text-green-200 rounded-md text-sm flex items-center"><FaCheckCircle className="mr-2"/>{actionSuccess}</div>}
      
      <div className="mb-6 p-4 bg-admin-card-bg rounded-lg shadow flex flex-col sm:flex-row justify-between items-center gap-4">
        <input
          type="text"
          placeholder="Buscar por ID, Nome ou Email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className={inputClass}
        />
        <button 
            onClick={fetchUsers} 
            className={`${buttonClass} bg-blue-600 hover:bg-blue-700 text-white h-10`}
            disabled={isLoading}
            title="Recarregar Usuários"
        >
            <FaRedo className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Recarregar
        </button>
      </div>

      {isLoading && <div className="py-10"><LoadingSpinner /></div>}
      {error && !isLoading && <p className="text-red-400 text-center py-4 bg-red-900 bg-opacity-30 rounded">{error}</p>}
      
      {!isLoading && !error && (
        <div className="overflow-x-auto admin-custom-scrollbar bg-admin-card-bg rounded-lg shadow">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-gray-750">
              <tr>
                <th scope="col" className="px-4 py-3">ID</th>
                <th scope="col" className="px-4 py-3">Nome</th>
                <th scope="col" className="px-4 py-3">Email</th>
                <th scope="col" className="px-4 py-3">VIP</th>
                <th scope="col" className="px-4 py-3">Admin</th>
                <th scope="col" className="px-4 py-3">Banido</th>
                <th scope="col" className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id} className="bg-gray-800 hover:bg-gray-750 transition-colors">
                  <td className="px-4 py-2 font-medium">{u.id}</td>
                  <td className="px-4 py-2">{u.nome}</td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">{u.vip ? <span className="text-yellow-400">Sim</span> : 'Não'}</td>
                  <td className="px-4 py-2">{u.admin ? <span className="text-green-400">Sim</span> : 'Não'}</td>
                  <td className="px-4 py-2">{u.is_banned ? <span className="text-red-400">Sim</span> : 'Não'}</td>
                  <td className="px-4 py-2 space-x-2 whitespace-nowrap">
                    {u.id !== adminUser?.id && ( // Admin cannot ban/unban or demote self from this interface
                      <>
                        {u.is_banned ? (
                          <button onClick={() => handleUnbanUser(u.id)} className={`${buttonClass} bg-green-600 hover:bg-green-700 text-white`} title="Desbanir Usuário"><FaUserPlus className="mr-1"/> Desbanir</button>
                        ) : (
                          <button onClick={() => openBanModal(u)} className={`${buttonClass} bg-red-600 hover:bg-red-700 text-white`} title="Banir Usuário"><FaUserSlash className="mr-1"/> Banir</button>
                        )}
                        {u.admin ? (
                          <button onClick={() => openMasterPasswordModal(u, 'demote')} className={`${buttonClass} bg-yellow-600 hover:bg-yellow-700 text-black`} title="Rebaixar Admin"><FaUserMinus className="mr-1"/> Rebaixar</button>
                        ) : (
                          <button onClick={() => openMasterPasswordModal(u, 'promote')} className={`${buttonClass} bg-blue-500 hover:bg-blue-600 text-white`} title="Promover para Admin"><FaUserShield className="mr-1"/> Promover</button>
                        )}
                      </>
                    )}
                    {u.id === adminUser?.id && <span className="text-xs text-gray-500 italic">Você</span>}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr><td colSpan={7} className="text-center py-6 text-gray-500">Nenhum usuário encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Ban Modal */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setShowBanModal(false)}>
          <div className="bg-admin-sidebar-bg p-6 rounded-lg shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-primary mb-4">Banir Usuário: {selectedUser.nome}</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="banReason" className="block text-sm font-medium text-gray-400">Motivo do Banimento (Opcional):</label>
                <textarea id="banReason" value={banReason} onChange={e => setBanReason(e.target.value)} rows={3} className={`${modalInputClass} custom-scrollbar`} placeholder="Ex: Violação dos termos de serviço." />
              </div>
              {actionError && <p className="text-red-400 text-sm bg-red-900/30 p-2 rounded">{actionError}</p>}
              <div className="flex justify-end space-x-3">
                <button onClick={() => setShowBanModal(false)} className={`${buttonClass} bg-gray-600 hover:bg-gray-500 text-white`}>Cancelar</button>
                <button onClick={handleBanUser} className={`${buttonClass} bg-red-600 hover:bg-red-700 text-white`}><FaUserSlash className="mr-1"/> Confirmar Banimento</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Master Password Modal */}
      {showMasterPasswordModal && selectedUser && actionType && (
         <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setShowMasterPasswordModal(false)}>
          <div className="bg-admin-sidebar-bg p-6 rounded-lg shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-primary mb-1">
                {actionType === 'promote' ? 'Promover' : 'Rebaixar'} Usuário: {selectedUser.nome}
            </h3>
            <p className="text-sm text-gray-400 mb-4">Para {actionType === 'promote' ? 'promover para' : 'rebaixar de'} administrador, por favor, insira a senha mestre.</p>
            <div className="space-y-4">
              <div>
                <label htmlFor="masterPasswordInput" className="block text-sm font-medium text-gray-400">Senha Mestre:</label>
                <input type="password" id="masterPasswordInput" value={masterPasswordInput} onChange={e => setMasterPasswordInput(e.target.value)} className={modalInputClass} />
              </div>
              {actionError && <p className="text-red-400 text-sm bg-red-900/30 p-2 rounded">{actionError}</p>}
              <div className="flex justify-end space-x-3">
                <button onClick={() => setShowMasterPasswordModal(false)} className={`${buttonClass} bg-gray-600 hover:bg-gray-500 text-white`}>Cancelar</button>
                <button onClick={handleAdminAction} className={`${buttonClass} ${actionType === 'promote' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white`}><FaCrown className="mr-1"/> Confirmar Ação</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminUsersPage;
