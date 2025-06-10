
import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../../services/apiService';
import { useAuth } from '../../../hooks/useAuth';
import { AnimeBase, FeaturedListItemAdmin } from '../../../types';
import LoadingSpinner from '../../LoadingSpinner';
import { FaPlus, FaTrash, FaArrowUp, FaArrowDown, FaSpinner, FaTableColumns, FaStar, FaFilm, FaTv, FaGift } from 'react-icons/fa6';
import { resolveImageUrl, DEFAULT_PLACEHOLDER_IMAGE } from '../../../constants';

type ListName = 'top_week' | 'featured_movies' | 'featured_series' | 'featured_extras';

interface ListConfig {
  key: ListName;
  title: string;
  icon: React.ReactElement;
}

const listConfigurations: ListConfig[] = [
  { key: 'top_week', title: 'Top da Semana', icon: <FaStar className="mr-2" /> },
  { key: 'featured_movies', title: 'Filmes em Destaque', icon: <FaFilm className="mr-2" /> },
  { key: 'featured_series', title: 'Séries em Destaque', icon: <FaTv className="mr-2" /> },
  { key: 'featured_extras', title: 'Extras em Destaque', icon: <FaGift className="mr-2" /> },
];

const AdminHomePageSectionsPage: React.FC = () => {
  const { token } = useAuth();
  const [activeList, setActiveList] = useState<ListName>(listConfigurations[0].key);
  const [currentItems, setCurrentItems] = useState<FeaturedListItemAdmin[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [allAnimes, setAllAnimes] = useState<AnimeBase[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingAllAnimes, setIsLoadingAllAnimes] = useState(false);

  const fetchListItems = useCallback(async (listName: ListName) => {
    if (!token) return;
    setIsLoadingList(true);
    setError(null);
    try {
      const items = await apiService.adminGetFeaturedContentList(listName, token);
      setCurrentItems(items);
    } catch (err) {
      setError(`Erro ao carregar lista "${listName}": ${(err as Error).message}`);
    } finally {
      setIsLoadingList(false);
    }
  }, [token]);

  useEffect(() => {
    fetchListItems(activeList);
  }, [activeList, fetchListItems]);

  const fetchAllAnimesForModal = async () => {
    if (!token || allAnimes.length > 0) return; // Don't refetch if already loaded
    setIsLoadingAllAnimes(true);
    try {
      const animes = await apiService.adminGetCatalogs(token); // Assuming this fetches all animes
      setAllAnimes(animes);
    } catch (err) {
      console.error("Erro ao carregar todos os animes:", err);
      // setErrorModal("Erro ao carregar animes para seleção.");
    } finally {
      setIsLoadingAllAnimes(false);
    }
  };

  const handleAddItemToList = async (animeId: number) => {
    if (!token) return;
    if (currentItems.some(item => item.id === animeId)) {
      alert("Este anime já está na lista.");
      return;
    }
    try {
      await apiService.adminAddFeaturedItem(activeList, animeId, token);
      fetchListItems(activeList); // Refresh list
    } catch (err) {
      alert(`Erro ao adicionar anime à lista: ${(err as Error).message}`);
    }
  };

  const handleRemoveItemFromList = async (animeId: number) => {
    if (!token || !window.confirm("Tem certeza que deseja remover este item da lista?")) return;
    try {
      await apiService.adminRemoveFeaturedItem(activeList, animeId, token);
      fetchListItems(activeList); // Refresh list
    } catch (err) {
      alert(`Erro ao remover anime da lista: ${(err as Error).message}`);
    }
  };
  
  const handleReorderItem = async (animeId: number, direction: 'up' | 'down') => {
    if (!token) return;
    const currentIndex = currentItems.findIndex(item => item.id === animeId);
    if (currentIndex === -1) return;

    const newItems = [...currentItems];
    const itemToMove = newItems.splice(currentIndex, 1)[0];

    let newIndex = currentIndex;
    if (direction === 'up' && currentIndex > 0) newIndex = currentIndex - 1;
    else if (direction === 'down' && currentIndex < newItems.length) newIndex = currentIndex + 1;
    else return; // Cannot move further

    newItems.splice(newIndex, 0, itemToMove);
    
    // Update display order locally for immediate feedback before API call
    const reorderedWithNewDisplayOrder = newItems.map((item, idx) => ({...item, display_order: idx}));
    setCurrentItems(reorderedWithNewDisplayOrder);

    const orderedAnimeIds = reorderedWithNewDisplayOrder.map(item => item.id);
    try {
      await apiService.adminUpdateFeaturedListOrder(activeList, orderedAnimeIds, token);
      // Optionally refetch, but local update should be accurate if API call succeeds
      // fetchListItems(activeList); 
    } catch (err) {
      alert(`Erro ao reordenar lista: ${(err as Error).message}`);
      fetchListItems(activeList); // Revert to server state on error
    }
  };

  const filteredAllAnimes = searchTerm 
    ? allAnimes.filter(anime => anime.titulo.toLowerCase().includes(searchTerm.toLowerCase()))
    : allAnimes;

  const tabButtonClass = (listKey: ListName) =>
    `px-3 py-2.5 text-xs sm:text-sm font-medium rounded-t-lg transition-colors outline-none focus:ring-2 focus:ring-primary flex items-center
     ${activeList === listKey ? 'bg-primary text-white shadow-md' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`;
  
  const inputClass = "block w-full bg-gray-700 text-gray-200 rounded-md shadow-sm p-2 focus:ring-primary focus:border-transparent text-sm";

  return (
    <div className="p-2 md:p-4 bg-admin-bg rounded-lg shadow-xl text-gray-200">
      <h1 className="text-2xl font-semibold text-primary mb-6 flex items-center"><FaTableColumns className="mr-3"/>Gerenciar Seções da Homepage</h1>

      <div className="mb-6 flex flex-wrap border-b border-gray-700">
        {listConfigurations.map(listConfig => (
          <button key={listConfig.key} onClick={() => setActiveList(listConfig.key)} className={tabButtonClass(listConfig.key)}>
            {listConfig.icon} {listConfig.title}
          </button>
        ))}
      </div>

      <div className="bg-admin-card-bg p-4 sm:p-6 rounded-b-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-200">{listConfigurations.find(lc => lc.key === activeList)?.title}</h2>
          <button 
            onClick={() => { setShowAddModal(true); fetchAllAnimesForModal(); }} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-md text-sm flex items-center"
          >
            <FaPlus className="mr-2"/> Adicionar Anime
          </button>
        </div>

        {isLoadingList && <LoadingSpinner />}
        {error && <p className="text-red-400 bg-red-900/30 p-3 rounded-md text-center">{error}</p>}
        
        {!isLoadingList && !error && currentItems.length === 0 && (
          <p className="text-gray-400 text-center py-6">Nenhum item nesta lista ainda.</p>
        )}

        {!isLoadingList && !error && currentItems.length > 0 && (
          <ul className="space-y-3">
            {currentItems.map((item, index) => (
              <li key={item.id} className="bg-gray-750 p-3 rounded-md shadow flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 flex-grow min-w-0">
                  <span className="text-gray-500 text-sm w-6 text-center">{index + 1}.</span>
                  <img src={resolveImageUrl(item.capa)} alt={item.titulo} className="w-10 h-14 object-cover rounded flex-shrink-0" onError={(e) => e.currentTarget.src = DEFAULT_PLACEHOLDER_IMAGE } />
                  <p className="text-sm text-gray-200 truncate flex-grow" title={item.titulo}>{item.titulo} (ID: {item.id})</p>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button onClick={() => handleReorderItem(item.id, 'up')} disabled={index === 0} className="text-gray-400 hover:text-green-400 disabled:opacity-50 p-1"><FaArrowUp/></button>
                  <button onClick={() => handleReorderItem(item.id, 'down')} disabled={index === currentItems.length - 1} className="text-gray-400 hover:text-green-400 disabled:opacity-50 p-1"><FaArrowDown/></button>
                  <button onClick={() => handleRemoveItemFromList(item.id)} className="text-red-500 hover:text-red-400 p-1"><FaTrash/></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-admin-sidebar-bg p-6 rounded-lg shadow-2xl w-full max-w-xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-primary mb-4">Adicionar Anime a "{listConfigurations.find(lc => lc.key === activeList)?.title}"</h3>
            <input 
              type="text"
              placeholder="Buscar anime por título..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={`${inputClass} mb-3`}
            />
            {isLoadingAllAnimes && <LoadingSpinner />}
            {!isLoadingAllAnimes && (
              <ul className="space-y-2 overflow-y-auto flex-grow custom-scrollbar pr-1">
                {filteredAllAnimes.length > 0 ? filteredAllAnimes.map(anime => (
                  <li key={anime.id} className="bg-gray-700 p-2 rounded-md flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                       <img src={resolveImageUrl(anime.capa)} alt={anime.titulo} className="w-8 h-12 object-cover rounded flex-shrink-0" onError={(e) => e.currentTarget.src = DEFAULT_PLACEHOLDER_IMAGE } />
                       <span className="truncate text-gray-300" title={anime.titulo}>{anime.titulo}</span>
                    </div>
                    <button 
                      onClick={() => handleAddItemToList(anime.id)}
                      className="bg-green-600 hover:bg-green-700 text-white py-1 px-2.5 rounded text-xs flex-shrink-0"
                      disabled={currentItems.some(ci => ci.id === anime.id)}
                    >
                      {currentItems.some(ci => ci.id === anime.id) ? 'Adicionado' : 'Adicionar'}
                    </button>
                  </li>
                )) : <p className="text-gray-400 text-center">Nenhum anime encontrado.</p>}
              </ul>
            )}
             <button onClick={() => setShowAddModal(false)} className="mt-4 bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-md text-sm self-end">
                Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHomePageSectionsPage;
