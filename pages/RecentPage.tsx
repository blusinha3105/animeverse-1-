
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { AnimeBase } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { FaPlayCircle, FaHeart, FaDownload, FaRegHeart } from 'react-icons/fa';
import { resolveImageUrl, EPISODE_THUMB_PLACEHOLDER } from '../constants';

interface RecentEpisodeItem {
  anime: AnimeBase;
  numero: number;
  temporada: number;
  nome: string;
}

const RecentPage: React.FC = () => {
  const { user, token } = useAuth();
  const [recentEpisodes, setRecentEpisodes] = useState<RecentEpisodeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set()); // Store IDs of favorited animes

  const fetchRecentEpisodes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getAnimesLancadosHoje();
      setRecentEpisodes(data.episodiosNovos);
    } catch (err) {
      setError((err as Error).message || 'Falha ao carregar episódios recentes.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch user's collection to mark favorites correctly
  const fetchUserCollection = useCallback(async () => {
    if (token) {
      try {
        const collectionItems = await apiService.getCollectionItems(token);
        const favoriteIds = new Set(
          collectionItems
            .filter(item => item.collectionStatus === 'favorite')
            .map(item => item.id) // Assuming item.id is the anime_id
        );
        setFavorites(favoriteIds);
      } catch (collectionError) {
        console.warn("Não foi possível carregar a coleção do usuário para marcar favoritos:", collectionError);
      }
    }
  }, [token]);


  useEffect(() => {
    fetchRecentEpisodes();
    fetchUserCollection();
  }, [fetchRecentEpisodes, fetchUserCollection]);

  const handleAddToFavorites = async (anime: AnimeBase) => {
    if (!token) {
      alert('Você precisa estar logado para adicionar aos favoritos.');
      return;
    }
    try {
      await apiService.addCollectionItem(token, anime.id, 'favorite');
      setFavorites(prev => new Set(prev).add(anime.id));
      alert(`${anime.titulo} adicionado aos favoritos!`);
    } catch (err) {
      alert(`Erro ao adicionar aos favoritos: ${(err as Error).message}`);
    }
  };
  
  const handleRemoveFromFavorites = async (animeId: number) => {
    if (!token) return;
    try {
      await apiService.removeCollectionItem(token, animeId);
      setFavorites(prev => {
        const newFavs = new Set(prev);
        newFavs.delete(animeId);
        return newFavs;
      });
      alert('Removido dos favoritos.');
    } catch (err) {
      alert(`Erro ao remover dos favoritos: ${(err as Error).message}`);
    }
  };


  const handleDownload = (animeTitle: string, episodeNumber: number) => {
    alert(`Download de ${animeTitle} - Episódio ${episodeNumber} iniciado! (Funcionalidade em desenvolvimento)`);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <p className="text-red-500 text-center py-10">{error}</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-text-primary">Lançamentos Recentes</h1>
      {recentEpisodes.length === 0 ? (
        <p className="text-text-secondary text-center py-10">Nenhum episódio lançado recentemente.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {recentEpisodes.map((item, index) => (
            <div key={`${item.anime.id}-${item.numero}-${index}`} className="bg-card rounded-lg shadow-lg overflow-hidden group transform transition-all duration-300 hover:scale-105">
              <Link to={`/watch/${item.anime.id}/ep/${item.numero}`}>
                <div className="relative aspect-video w-full">
                  <img
                    src={resolveImageUrl(item.anime.capa)}
                    alt={item.anime.titulo}
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.src = EPISODE_THUMB_PLACEHOLDER)}
                  />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                   <span className="absolute top-2 right-2 bg-primary-action text-white text-xs font-semibold px-2 py-1 rounded">NOVO</span>
                </div>
              </Link>
              <div className="p-4">
                <Link to={`/anime/${item.anime.id}`} className="hover:text-primary">
                    <h3 className="text-md font-semibold text-text-primary group-hover:text-primary transition-colors truncate" title={item.anime.titulo}>
                    {item.anime.titulo}
                    </h3>
                </Link>
                <p className="text-sm text-text-secondary truncate" title={`Temporada ${item.temporada} - Episódio ${item.numero}: ${item.nome}`}>
                  T{item.temporada}:E{item.numero} - {item.nome}
                </p>
                <div className="mt-3 space-y-2">
                  <Link
                    to={`/watch/${item.anime.id}/ep/${item.numero}`}
                    className="w-full flex items-center justify-center px-3 py-1.5 bg-primary hover:bg-secondary text-white text-xs rounded-md transition-colors"
                  >
                    <FaPlayCircle className="mr-1.5" /> Assistir
                  </Link>
                  <div className="flex space-x-2">
                  {favorites.has(item.anime.id) ? (
                     <button
                        onClick={() => handleRemoveFromFavorites(item.anime.id)}
                        className="w-full flex items-center justify-center px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs rounded-md transition-colors"
                        title="Remover dos Favoritos"
                        disabled={!token}
                    >
                        <FaHeart className="mr-1.5" /> Favoritado
                    </button>
                  ) : (
                    <button
                        onClick={() => handleAddToFavorites(item.anime)}
                        className="w-full flex items-center justify-center px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded-md transition-colors"
                        title="Adicionar aos Favoritos"
                        disabled={!token}
                    >
                        <FaRegHeart className="mr-1.5" /> Favoritar
                    </button>
                  )}
                    <button
                        onClick={() => handleDownload(item.anime.titulo, item.numero)}
                        className="w-full flex items-center justify-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md transition-colors"
                    >
                        <FaDownload className="mr-1.5" /> Baixar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentPage;
