
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';
import { FaUserEdit, FaEnvelope, FaImage, FaLock, FaSave, FaSpinner } from 'react-icons/fa';
import { resolveImageUrl, DEFAULT_PLACEHOLDER_IMAGE } from '../constants';

const UserSettingsPage: React.FC = () => {
  const { user, token, updateUser, updateUserProfileImage } = useAuth();
  
  const [name, setName] = useState(user?.nome || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileImageUrl, setProfileImageUrl] = useState(user?.imagem_perfil || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'security'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState(user?.imagem_perfil ? resolveImageUrl(user.imagem_perfil) : DEFAULT_PLACEHOLDER_IMAGE);


  useEffect(() => {
    if (user) {
      setName(user.nome);
      setEmail(user.email);
      setProfileImageUrl(user.imagem_perfil || '');
      setImagePreview(user.imagem_perfil ? resolveImageUrl(user.imagem_perfil) : DEFAULT_PLACEHOLDER_IMAGE);
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent, field: 'name' | 'profileImage') => {
    e.preventDefault();
    if (!token || !user) return;
    
    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      let updatedUser;
      if (field === 'name') {
        if (!name.trim()) { setErrorMessage("O nome não pode estar vazio."); setIsLoading(false); return; }
        updatedUser = await apiService.updateUserName(name, token);
        updateUser({ nome: updatedUser.nome });
        setSuccessMessage("Nome atualizado com sucesso!");
      } else if (field === 'profileImage') {
        if (!profileImageUrl.trim()) { 
            // If URL is empty, revert to default or handle as 'remove picture' if backend supports
            // For now, just show error or ignore. Let's assume an empty URL is not a valid update here.
             setErrorMessage("URL da imagem de perfil não pode ser vazia para atualização."); 
             setIsLoading(false); 
             return; 
        }
        updatedUser = await apiService.updateUserProfilePictureByUrl(profileImageUrl, token);
        updateUserProfileImage(updatedUser.imagem_perfil || ''); // AuthContext specific update
        setImagePreview(updatedUser.imagem_perfil ? resolveImageUrl(updatedUser.imagem_perfil) : DEFAULT_PLACEHOLDER_IMAGE);
        setSuccessMessage("Foto de perfil atualizada com sucesso!");
      }
    } catch (err) {
      setErrorMessage((err as Error).message || 'Falha ao atualizar perfil.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAccountUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user) return;
    if (!email.trim()) { setErrorMessage("O email não pode estar vazio."); return; }
    
    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
        const updatedUser = await apiService.updateUserEmail(email, token);
        updateUser({ email: updatedUser.email });
        setSuccessMessage("Email atualizado com sucesso! (Pode ser necessário verificar o novo email).");
    } catch (err) {
      setErrorMessage((err as Error).message || 'Falha ao atualizar email.');
    } finally {
      setIsLoading(false);
    }
  };


  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (newPassword !== confirmNewPassword) {
      setErrorMessage("As novas senhas não coincidem.");
      return;
    }
    if (!currentPassword || !newPassword) {
        setErrorMessage("Todos os campos de senha são obrigatórios.");
        return;
    }
    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      await apiService.updateUserPassword(currentPassword, newPassword, token);
      setSuccessMessage("Senha atualizada com sucesso!");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setErrorMessage((err as Error).message || 'Falha ao atualizar senha.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleProfileImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setProfileImageUrl(url);
    if (url.trim()) {
        setImagePreview(resolveImageUrl(url)); // Preview immediately
    } else {
        setImagePreview(DEFAULT_PLACEHOLDER_IMAGE);
    }
  };


  if (!user) return <LoadingSpinner />;

  const inputClass = "block w-full px-3 py-2 bg-card rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-transparent sm:text-sm text-text-primary";
  const labelClass = "block text-sm font-medium text-text-secondary";
  const buttonClass = "w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary disabled:opacity-60 transition-colors";
  const tabButtonClass = (tabName: 'profile' | 'account' | 'security') => 
    `px-4 py-2 font-medium rounded-t-lg transition-colors outline-none focus:ring-2 focus:ring-primary
     ${activeTab === tabName ? 'bg-card text-primary border-b-2 border-primary' : 'text-text-secondary hover:bg-gray-700/50 hover:text-text-primary'}`;


  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold text-text-primary mb-8 text-center">Configurações do Usuário</h1>

        {successMessage && <p className="mb-4 p-3 bg-green-800 text-green-200 rounded-md text-sm text-center">{successMessage}</p>}
        {errorMessage && <p className="mb-4 p-3 bg-red-800 text-red-200 rounded-md text-sm text-center">{errorMessage}</p>}

        <div className="mb-6 border-b border-gray-700 flex">
            <button onClick={() => setActiveTab('profile')} className={tabButtonClass('profile')}>Perfil</button>
            <button onClick={() => setActiveTab('account')} className={tabButtonClass('account')}>Conta</button>
            <button onClick={() => setActiveTab('security')} className={tabButtonClass('security')}>Segurança</button>
        </div>

        <div className="bg-card shadow-xl rounded-lg p-6 md:p-8">
            {activeTab === 'profile' && (
                <div className="space-y-6 animate-fadeIn">
                    <h2 className="text-xl font-semibold text-primary mb-4 flex items-center"><FaUserEdit className="mr-2"/> Editar Perfil</h2>
                    <form onSubmit={(e) => handleProfileUpdate(e, 'name')} className="space-y-4">
                        <div>
                            <label htmlFor="name" className={labelClass}>Nome de Usuário:</label>
                            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
                        </div>
                        <button type="submit" className={buttonClass} disabled={isLoading || name === user.nome}>
                            {isLoading && name !== user.nome ? <FaSpinner className="animate-spin mr-2" /> : <FaSave className="mr-2" />} Salvar Nome
                        </button>
                    </form>
                    <hr className="my-6 border-gray-700"/>
                    <form onSubmit={(e) => handleProfileUpdate(e, 'profileImage')} className="space-y-4">
                        <div className="flex flex-col items-center">
                             <img 
                                src={imagePreview} 
                                alt="Prévia foto de perfil" 
                                className="w-32 h-32 rounded-full object-cover border-4 border-primary shadow-lg mb-3"
                                onError={() => setImagePreview(DEFAULT_PLACEHOLDER_IMAGE)} // Fallback if URL is invalid during preview
                            />
                            <label htmlFor="profileImageUrl" className={labelClass}>URL da Foto de Perfil:</label>
                            <input type="url" id="profileImageUrl" value={profileImageUrl} onChange={handleProfileImageUrlChange} className={inputClass} placeholder="https://exemplo.com/imagem.jpg"/>
                        </div>
                        <button type="submit" className={buttonClass} disabled={isLoading || profileImageUrl === user.imagem_perfil}>
                            {isLoading && profileImageUrl !== user.imagem_perfil ? <FaSpinner className="animate-spin mr-2" /> : <FaImage className="mr-2" />} Salvar Foto de Perfil
                        </button>
                    </form>
                </div>
            )}

            {activeTab === 'account' && (
                 <div className="space-y-6 animate-fadeIn">
                    <h2 className="text-xl font-semibold text-primary mb-4 flex items-center"><FaEnvelope className="mr-2"/> Configurações da Conta</h2>
                    <form onSubmit={handleAccountUpdate} className="space-y-4">
                        <div>
                            <label htmlFor="email" className={labelClass}>Endereço de Email:</label>
                            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
                        </div>
                         <button type="submit" className={buttonClass} disabled={isLoading || email === user.email}>
                            {isLoading && email !== user.email ? <FaSpinner className="animate-spin mr-2" /> : <FaSave className="mr-2" />} Salvar Email
                        </button>
                    </form>
                 </div>
            )}
            
            {activeTab === 'security' && (
                <div className="space-y-6 animate-fadeIn">
                    <h2 className="text-xl font-semibold text-primary mb-4 flex items-center"><FaLock className="mr-2"/> Segurança</h2>
                    <form onSubmit={handlePasswordUpdate} className="space-y-4">
                        <div>
                            <label htmlFor="currentPassword" className={labelClass}>Senha Atual:</label>
                            <input type="password" id="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} required />
                        </div>
                        <div>
                            <label htmlFor="newPassword" className={labelClass}>Nova Senha:</label>
                            <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} required />
                        </div>
                        <div>
                            <label htmlFor="confirmNewPassword" className={labelClass}>Confirmar Nova Senha:</label>
                            <input type="password" id="confirmNewPassword" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className={inputClass} required />
                        </div>
                        <button type="submit" className={buttonClass} disabled={isLoading}>
                            {isLoading ? <FaSpinner className="animate-spin mr-2" /> : <FaLock className="mr-2" />} Atualizar Senha
                        </button>
                    </form>
                </div>
            )}
        </div>
         <style>{`
            .animate-fadeIn { animation: fadeIn 0.3s ease-in-out; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
    </div>
  );
};

export default UserSettingsPage;
