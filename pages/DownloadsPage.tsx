
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { DownloadedItem } from '../types';
import DownloadedItemCard from '../components/DownloadedItemCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { FaDownload, FaPlus } from 'react-icons/fa';

const DownloadsPage: React.FC = () => {
  const { user, token } = useAuth();
  const [downloads, setDownloads] = useState<DownloadedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDownloads = useCallback(async () => {
    if (!token) {
        setError("Autenticação necessária para visualizar seus downloads.");
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const items = await apiService.getDownloadedItems(token);
      setDownloads(items);
    } catch (err) {
      setError((err as Error).message || 'Falha ao carregar seus downloads.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDownloads();
  }, [fetchDownloads]);

  const handleRemoveDownload = async (itemId: string | number) => {
    if (!token || !window.confirm('Tem certeza que deseja remover este item dos seus downloads?')) return;
    try {
      await apiService.removeDownloadedItem(token, itemId);
      setDownloads(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      alert(`Erro ao remover download: ${(err as Error).message}`);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-[calc(100vh-10rem)]"><LoadingSpinner /></div>;
  }

  if (error) {
    return <p className="text-center text-red-500 py-10">{error}</p>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-text-primary">Meus Downloads (Simulado)</h1>

      {downloads.length === 0 ? (
        <div className="text-center py-10">
          <FaDownload className="text-6xl text-text-secondary mx-auto mb-4" />
          <p className="text-text-secondary text-lg mb-4">Você não tem nenhum item baixado.</p>
          <Link to="/discovery" className="px-6 py-2 bg-primary hover:bg-secondary text-white rounded-md transition-colors inline-flex items-center">
            <FaPlus className="mr-2" /> Procurar Animes para Baixar
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6"> 
        {/* Using lg:grid-cols-1 for a list-like appearance on larger screens, or adjust as needed */}
          {downloads.map(item => (
            <DownloadedItemCard 
              key={item.id} 
              item={item} 
              onRemove={handleRemoveDownload} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DownloadsPage;
