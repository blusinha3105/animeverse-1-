
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { CollectionItem, CollectionStatus, collectionStatusMap, AnimeBase } from '../types';
import AnimeCard from '../components/AnimeCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { FaTrash, FaEdit, FaPlus } from 'react-icons/fa';

const MyCollectionPage: React.FC = () => {
  const { user, token } = useAuth();
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<CollectionStatus | 'all'>('all');
  const [editingItem, setEditingItem] = useState<CollectionItem | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const fetchCollection = useCallback(async () => {
    if (!token) {
        setError("Autenticação necessária para ver sua coleção.");
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const items = await apiService.getCollectionItems(token);
      setCollection(items);
    } catch (err) {
      setError((err as Error).message || 'Falha ao carregar sua coleção.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCollection();
  }, [fetchCollection]);

  const handleRemoveItem = async (animeId: number) => {
    if (!token || !window.confirm('Tem certeza que deseja remover este item da sua coleção?')) return;
    try {
      await apiService.removeCollectionItem(token, animeId);
      setCollection(prev => prev.filter(item => item.id !== animeId)); // Anime ID is item.id from AnimeBase
    } catch (err) {
      alert(`Erro ao remover item: ${(err as Error).message}`);
    }
  };

  const openStatusModal = (item: CollectionItem) => {
    setEditingItem(item);
    setShowStatusModal(true);
  };

  const handleChangeStatus = async (newStatus: CollectionStatus) => {
    if (!token || !editingItem) return;
    try {
      // The backend's POST /api/my-collection handles upsert
      const updatedItem = await apiService.updateCollectionItemStatus(token, editingItem.id, newStatus, editingItem.notes, editingItem.lastWatchedEpisode);
      setCollection(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...updatedItem, collectionStatus: newStatus } : item));
      setShowStatusModal(false);
      setEditingItem(null);
    } catch (err) {
      alert(`Erro ao mudar status: ${(err as Error).message}`);
    }
  };
  
  const filterOptions: { key: CollectionStatus | 'all', label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'favorite', label: collectionStatusMap.favorite },
    { key: 'watching', label: collectionStatusMap.watching },
    { key: 'completed', label: collectionStatusMap.completed },
    { key: 'planned', label: collectionStatusMap.planned },
    { key: 'on_hold', label: collectionStatusMap.on_hold },
    { key: 'dropped', label: collectionStatusMap.dropped },
  ];

  const filteredCollection = activeFilter === 'all' 
    ? collection 
    : collection.filter(item => item.collectionStatus === activeFilter);

  if (isLoading) {
    return <div className="flex justify-center items-center h-[calc(100vh-10rem)]"><LoadingSpinner /></div>;
  }

  if (error) {
    return <p className="text-center text-red-500 py-10">{error}</p>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-text-primary">Minha Coleção</h1>

      <div className="flex flex-wrap gap-2 mb-6 pb-3">
        {filterOptions.map(opt => (
          <button
            key={opt.key}
            onClick={() => setActiveFilter(opt.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors
                        ${activeFilter === opt.key 
                            ? 'bg-primary text-white shadow-md' 
                            : 'bg-card text-text-secondary hover:bg-gray-700 hover:text-text-primary'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filteredCollection.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-text-secondary text-lg mb-4">
            {activeFilter === 'all' ? 'Sua coleção está vazia.' : `Nenhum item encontrado com o status "${collectionStatusMap[activeFilter as CollectionStatus]}".`}
          </p>
          <Link to="/discovery" className="px-6 py-2 bg-primary hover:bg-secondary text-white rounded-md transition-colors inline-flex items-center">
            <FaPlus className="mr-2"/> Descobrir Animes
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {filteredCollection.map(item => (
            <div key={item.id} className="relative group">
              {/* AnimeCard now expects AnimeBase, CollectionItem extends AnimeBase */}
              <AnimeCard anime={item as AnimeBase} /> 
              <div className="absolute top-2 right-2 flex flex-col space-y-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                <button 
                    onClick={() => openStatusModal(item)}
                    title="Mudar Status"
                    className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg text-xs"
                    aria-label="Mudar status do anime na coleção"
                >
                    <FaEdit />
                </button>
                <button 
                    onClick={() => handleRemoveItem(item.id)} // item.id is animeId
                    title="Remover da Coleção"
                    className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg text-xs"
                    aria-label="Remover anime da coleção"
                >
                    <FaTrash />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-black bg-opacity-60 text-center">
                <span className="text-xs text-yellow-300 font-semibold">{collectionStatusMap[item.collectionStatus]}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showStatusModal && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setShowStatusModal(false)}>
          <div className="bg-card p-6 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-primary mb-1">Mudar Status de:</h3>
            <p className="text-text-primary mb-4 truncate font-medium" title={editingItem.titulo}>{editingItem.titulo}</p>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(collectionStatusMap) as CollectionStatus[]).map(statusKey => (
                <button
                  key={statusKey}
                  onClick={() => handleChangeStatus(statusKey)}
                  className={`w-full px-3 py-2 text-sm rounded-md transition-colors
                              ${editingItem.collectionStatus === statusKey 
                                ? 'bg-primary text-white ring-2 ring-primary-action' 
                                : 'bg-gray-700 text-text-secondary hover:bg-gray-600'}`}
                >
                  {collectionStatusMap[statusKey]}
                </button>
              ))}
            </div>
            <button onClick={() => setShowStatusModal(false)} className="mt-6 w-full px-4 py-2 bg-gray-500 hover:bg-gray-400 text-white rounded-md text-sm">
                Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCollectionPage;
