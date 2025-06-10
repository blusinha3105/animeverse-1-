
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { Anime, AnimeBase, CollectionItem } from '../types';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';
import EpisodeList from '../components/EpisodeList';
import AnimeCard from '../components/AnimeCard';
import { resolveImageUrl, DEFAULT_PLACEHOLDER_IMAGE } from '../constants';
import { FaPlayCircle, FaHeart, FaRegHeart, FaDownload } from 'react-icons/fa';

const AnimeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const [anime, setAnime] = useState<Anime | null>(null);
  const [similarAnimes, setSimilarAnimes] = useState<AnimeBase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isProcessingFavorite, setIsProcessingFavorite] = useState(false);
  const [isProcessingDownload, setIsProcessingDownload] = useState(false);


  const fetchAnimeDetails = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const animeData = await apiService.getAnimeById(id);
      setAnime(animeData);
      await apiService.incrementAnimeView(id);

      const similarData = await apiService.getSimilarTitles(id);
      setSimilarAnimes(similarData.slice(0, 5));

      if (token && user) {
        const userCollection = await apiService.getCollectionItems(token);
        const currentAnimeInCollection = userCollection.find(item => item.id === parseInt(id, 10));
        if (currentAnimeInCollection && currentAnimeInCollection.collectionStatus === 'favorite') {
          setIsFavorite(true);
        } else {
          setIsFavorite(false);
        }
      }
    } catch (err) {
      setError((err as Error).message || 'Falha ao carregar detalhes do anime.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [id, token, user]);

  useEffect(() => {
    fetchAnimeDetails();
  }, [fetchAnimeDetails]);
  
  const handleToggleFavorite = async () => {
    if (!token || !anime) {
      alert("Você precisa estar logado para gerenciar favoritos.");
      return;
    }
    setIsProcessingFavorite(true);
    try {
      if (isFavorite) {
        await apiService.removeCollectionItem(token, anime.id);
        setIsFavorite(false);
        alert(`${anime.titulo} removido dos favoritos.`);
      } else {
        await apiService.addCollectionItem(token, anime.id, 'favorite');
        setIsFavorite(true);
        alert(`${anime.titulo} adicionado aos favoritos!`);
      }
    } catch (err) {
      alert(`Erro ao atualizar favoritos: ${(err as Error).message}`);
    } finally {
      setIsProcessingFavorite(false);
    }
  };

  const handleDownloadAnime = async () => {
    if (!token || !anime || !user) {
        alert("Você precisa estar logado para baixar.");
        return;
    }
    setIsProcessingDownload(true);
    try {
        const firstEpisode = anime.episodios && anime.episodios.length > 0 ? anime.episodios.sort((a,b) => a.numero - b.numero)[0] : null;

        const downloadData = {
            // user_id: user.id, // Removed: Backend derives user_id from token
            anime_id: anime.id,
            episode_id: firstEpisode?.id,
            title: anime.titulo,
            episode_title: firstEpisode?.nome,
            season_number: firstEpisode?.temporada,
            episode_number: firstEpisode?.numero,
            thumbnail_url: anime.capa,
        };
        await apiService.addDownloadedItem(token, downloadData);
        alert(`${anime.titulo} ${firstEpisode ? `- Episódio ${firstEpisode.numero}`: ''} adicionado à sua lista de downloads (simulado).`);
    } catch (err) {
        alert(`Erro ao simular download: ${(err as Error).message}`);
    } finally {
        setIsProcessingDownload(false);
    }
  };


  if (isLoading) return <LoadingSpinner />;
  if (error) return <p className="text-red-500 text-center py-10">{error}</p>;
  if (!anime) return <p className="text-text-secondary text-center py-10">Anime não encontrado.</p>;
  
  const imageUrl = resolveImageUrl(anime.capa);
  const firstEpisodeLink = anime.episodios && anime.episodios.length > 0 
    ? `/watch/${anime.id}/ep/${anime.episodios.sort((a,b) => a.numero - b.numero)[0].numero}` 
    : null;

  return (
    <div className="space-y-8">
      <section className="bg-card shadow-xl rounded-lg p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          <div className="md:w-1/3 lg:w-1/4">
            <img 
              src={imageUrl} 
              alt={anime.titulo} 
              onError={(e) => (e.currentTarget.src = DEFAULT_PLACEHOLDER_IMAGE)}
              className="w-full h-auto object-cover rounded-md shadow-lg aspect-[2/3]" 
            />
          </div>
          <div className="md:w-2/3 lg:w-3/4">
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">{anime.titulo}</h1>
            {anime.tituloAlternativo && <h2 className="text-lg text-text-secondary mb-4">{anime.tituloAlternativo}</h2>}
            
            <div className="flex flex-wrap gap-2 mb-4">
              {anime.generos.map(genre => (
                <span key={genre} className="bg-gray-700 text-text-secondary text-xs px-3 py-1 rounded-full">{genre}</span>
              ))}
            </div>

            <p className="text-text-secondary leading-relaxed mb-4">{anime.sinopse}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {anime.tipoMidia && <InfoItem label="Tipo" value={anime.tipoMidia} />}
              {anime.status && <InfoItem label="Status" value={anime.status} />}
              {anime.anoLancamento && <InfoItem label="Lançamento" value={anime.anoLancamento.toString()} />}
              {anime.classificacao && <InfoItem label="Classificação" value={anime.classificacao} />}
              {anime.estudio && <InfoItem label="Estúdio" value={anime.estudio} />}
              {anime.diretor && <InfoItem label="Diretor" value={anime.diretor} />}
              {anime.qntd_temporadas && <InfoItem label="Temporadas" value={anime.qntd_temporadas.toString()} />}
              {anime.ovas && <InfoItem label="OVAs" value={anime.ovas} />}
              {anime.filmes && <InfoItem label="Filmes" value={anime.filmes} />}
              {typeof anime.visualizacoes === 'number' && <InfoItem label="Visualizações" value={anime.visualizacoes.toString()} />}
            </div>
            
            <div className="mt-6 flex flex-wrap gap-3">
                {firstEpisodeLink && (
                    <Link 
                        to={firstEpisodeLink}
                        className="flex items-center bg-primary hover:bg-secondary text-white font-semibold py-2.5 px-5 rounded-lg transition-colors shadow-md text-sm"
                    >
                        <FaPlayCircle className="mr-2"/> Assistir Primeiro Episódio
                    </Link>
                )}
                 <button
                    onClick={handleToggleFavorite}
                    disabled={isProcessingFavorite || !user}
                    className={`flex items-center font-semibold py-2.5 px-5 rounded-lg transition-colors shadow-md text-sm
                                ${isFavorite ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-600 hover:bg-gray-500 text-text-primary'}
                                ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={!user ? "Faça login para favoritar" : (isFavorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos")}
                >
                    {isProcessingFavorite ? <LoadingSpinner /> : (isFavorite ? <FaHeart className="mr-2"/> : <FaRegHeart className="mr-2"/>)}
                    {isFavorite ? 'Favoritado' : 'Favoritar'}
                </button>
                <button
                    onClick={handleDownloadAnime}
                    disabled={isProcessingDownload || !user}
                    className={`flex items-center bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors shadow-md text-sm ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={!user ? "Faça login para baixar" : "Baixar anime (mock)"}
                >
                    {isProcessingDownload ? <LoadingSpinner /> : <FaDownload className="mr-2"/>}
                    Baixar
                </button>
            </div>

          </div>
        </div>
      </section>

      {anime.episodios && id && <EpisodeList animeId={id} totalInitialEpisodes={anime.episodios.length} />}

      {similarAnimes.length > 0 && (
        <section className="mt-12">
          <h3 className="text-xl font-semibold mb-4 text-text-primary">Títulos Semelhantes</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {similarAnimes.map(simAnime => (
              <AnimeCard key={simAnime.id} anime={simAnime} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const InfoItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <span className="font-semibold text-text-primary">{label}: </span>
    <span className="text-text-secondary">{value}</span>
  </div>
);

export default AnimeDetailPage;
