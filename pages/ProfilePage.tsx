import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import { resolveImageUrl, DEFAULT_PLACEHOLDER_IMAGE } from '../constants';
import LoadingSpinner from '../components/LoadingSpinner';
import { FaTicketAlt } from 'react-icons/fa';

const ProfilePage: React.FC = () => {
  const { user, token, updateUserProfileImage } = useAuth();
  const [profileImageUrl, setProfileImageUrl] = useState<string>(DEFAULT_PLACEHOLDER_IMAGE);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfileImage = async () => {
      if (user && token) {
        if (user.imagem_perfil) {
           setProfileImageUrl(resolveImageUrl(user.imagem_perfil));
        } else {
           try {
             const data = await apiService.getProfileImageUrl(user.id, token);
             setProfileImageUrl(data.url);
           } catch (error) {
             console.error("Falha ao buscar URL da imagem de perfil:", error);
             setProfileImageUrl(user.imagem_perfil ? resolveImageUrl(user.imagem_perfil) : DEFAULT_PLACEHOLDER_IMAGE);
           }
        }
      }
    };
    fetchProfileImage();
  }, [user, token]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user && token) {
      setIsUploading(true);
      setUploadError(null);
      setUploadSuccess(null);
      try {
        await apiService.uploadProfilePicture(user.id, file, token);
        const data = await apiService.getProfileImageUrl(user.id, token);
        setProfileImageUrl(data.url);
        updateUserProfileImage(data.url); 
        setUploadSuccess('Foto de perfil atualizada com sucesso!');
      } catch (error) {
        setUploadError((error as Error).message || 'Falha ao enviar imagem.');
        console.error("Erro no upload:", error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (!user) {
    return <LoadingSpinner />; 
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card shadow-xl rounded-lg">
      <h1 className="text-3xl font-bold text-text-primary mb-6 text-center">Seu Perfil</h1>
      
      <div className="flex flex-col items-center space-y-6">
        <div className="relative group">
          <img 
            src={profileImageUrl} 
            alt="Perfil" 
            onError={(e) => (e.currentTarget.src = DEFAULT_PLACEHOLDER_IMAGE)}
            className="w-32 h-32 rounded-full object-cover border-4 border-primary shadow-lg"
          />
          <button 
            onClick={triggerFileInput}
            className="absolute inset-0 w-full h-full bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
            disabled={isUploading}
            aria-label="Mudar foto de perfil"
          >
            {isUploading ? 'Enviando...' : 'Mudar Foto'}
          </button>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/jpeg, image/png" 
          />
        </div>
        {isUploading && <LoadingSpinner/>}
        {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
        {uploadSuccess && <p className="text-sm text-green-500">{uploadSuccess}</p>}

        <div className="text-center">
          <h2 className="text-2xl font-semibold text-text-primary">{user.nome}</h2>
          <p className="text-text-secondary">{user.email}</p>
        </div>

        <div className="w-full pt-6 space-y-3">
          <InfoRow label="ID de Usuário:" value={user.id.toString()} />
          {typeof user.vip === 'boolean' && <InfoRow label="Status VIP:" value={user.vip ? 'Ativo' : 'Inativo'} />}
          {typeof user.admin === 'boolean' && <InfoRow label="Acesso Admin:" value={user.admin ? 'Sim' : 'Não'} />}
        </div>

        <div className="w-full pt-6">
          <Link 
            to="/support"
            className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-secondary transition-colors"
          >
            <FaTicketAlt className="mr-2" /> Meus Tickets de Suporte
          </Link>
        </div>
      </div>
    </div>
  );
};

interface InfoRowProps {
  label: string;
  value: string;
}
const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => (
  <div className="flex justify-between text-sm">
    <span className="font-medium text-text-secondary">{label}</span>
    <span className="text-text-primary">{value}</span>
  </div>
);

export default ProfilePage;