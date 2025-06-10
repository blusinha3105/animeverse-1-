
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { EpisodeExibir, Anime, Comment as CommentType } from '../types';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';
import { EPISODE_THUMB_PLACEHOLDER, resolveImageUrl, DEFAULT_PLACEHOLDER_IMAGE } from '../constants';
import CommentSection from '../components/comments/CommentSection'; // New component
import { FaDownload } from 'react-icons/fa';

declare global {
  interface Window {
    jwplayer?: any; 
  }
}

const PLAYER_DOM_ID = 'episode-video-player-container-id';

const PlayerPage: React.FC = () => {
  const { animeId, episodeNumber } = useParams<{ animeId: string; episodeNumber: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  const [currentPlayingEpisode, setCurrentPlayingEpisode] = useState<EpisodeExibir | null>(null);
  const [allExibirEpisodes, setAllExibirEpisodes] = useState<EpisodeExibir[]>([]);
  const [animeDetailsForInfoBox, setAnimeDetailsForInfoBox] = useState<Anime | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [dataFetchError, setDataFetchError] = useState<string | null>(null);
  const [isProcessingDownload, setIsProcessingDownload] = useState(false);


  const playerContainerRef = useRef<HTMLDivElement>(null);
  const jwPlayerInstanceRef = useRef<any>(null);

  const cleanupPlayer = useCallback(() => {
    if (jwPlayerInstanceRef.current) {
      try {
        jwPlayerInstanceRef.current.remove();
      } catch (e) {
        console.warn("Erro ao remover instância anterior do JW Player:", e);
      }
      jwPlayerInstanceRef.current = null;
    }
    if (playerContainerRef.current) {
        playerContainerRef.current.innerHTML = ''; 
    }
  }, []);

  const fetchEpisodeAndAnimeData = useCallback(async () => {
    if (!animeId || !episodeNumber) {
        setDataFetchError("ID do Anime ou número do episódio inválido.");
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setDataFetchError(null);
    setPlayerError(null);
    cleanupPlayer();

    try {
      const exibirData = await apiService.getAnimeExibirDetails(animeId);
      const currentEp = exibirData.episodios.find(ep => ep.episodio === parseInt(episodeNumber, 10));
      
      if (currentEp) {
        setCurrentPlayingEpisode(currentEp);
        setAllExibirEpisodes(exibirData.episodios.sort((a, b) => a.episodio - b.episodio));
      } else {
        throw new Error('Episódio não encontrado nos dados de exibição.');
      }

      const fullAnimeDetails = await apiService.getAnimeById(animeId);
      setAnimeDetailsForInfoBox(fullAnimeDetails);

    } catch (err) {
      setDataFetchError((err as Error).message || 'Falha ao carregar dados do episódio ou anime.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [animeId, episodeNumber, cleanupPlayer]);

  useEffect(() => {
    fetchEpisodeAndAnimeData();
  }, [fetchEpisodeAndAnimeData]);

  useEffect(() => {
    if (currentPlayingEpisode?.link && playerContainerRef.current && !isLoading && !dataFetchError) {
      const link = currentPlayingEpisode.link;
      const container = playerContainerRef.current;
      cleanupPlayer(); 

      if (link.endsWith('.mp4')) {
        if (window.jwplayer) {
          const playerDiv = document.createElement('div');
          playerDiv.id = PLAYER_DOM_ID + Date.now();
          container.appendChild(playerDiv);
          
          try {
             if (!window.jwplayer.key) {
                window.jwplayer.key="64HPbvSQorQcd52B8XFuhMtEoitbvY/EXJmMBfKcXZQU2Rnn";
             }
            jwPlayerInstanceRef.current = window.jwplayer(playerDiv.id).setup({
              file: link, width: '100%', aspectratio: '16:9', autostart: false, mute: false, primary: 'html5', skin: { name: 'bekle' }
            });
          } catch(e) {
            console.error("Erro ao configurar JW Player:", e);
            setPlayerError("Não foi possível inicializar o player de vídeo (JW).");
          }
        } else {
          setPlayerError("Biblioteca do player de vídeo (JW) não carregada.");
        }
      } else if (link.includes('blogger.com/video.g')) {
        const iframe = document.createElement('iframe');
        iframe.src = link;
        iframe.style.width = '100%'; iframe.style.height = '100%';
        iframe.frameBorder = '0'; iframe.allowFullscreen = true;
        iframe.setAttribute('allow', 'fullscreen'); iframe.setAttribute('scrolling', 'no');
        container.appendChild(iframe);
      } else {
        setPlayerError("Link de vídeo inválido ou formato não suportado.");
        container.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-black text-text-secondary p-4"><p>Formato de vídeo não suportado ou link inválido.</p></div>`;
      }
    }
    return cleanupPlayer;
  }, [currentPlayingEpisode, isLoading, dataFetchError, cleanupPlayer]);

  const handleDownloadEpisode = async () => {
    if (!token || !currentPlayingEpisode || !animeDetailsForInfoBox || !animeId || !user) {
      alert("Você precisa estar logado para baixar. Detalhes do episódio ou anime ausentes.");
      return;
    }
    setIsProcessingDownload(true);
    try {
      const downloadData = {
        // user_id: user.id, // Removed: Backend derives user_id from token
        anime_id: parseInt(animeId, 10),
        episode_id: currentPlayingEpisode.id,
        title: animeDetailsForInfoBox.titulo,
        episode_title: currentPlayingEpisode.descricao || `Episódio ${currentPlayingEpisode.episodio}`,
        season_number: currentPlayingEpisode.temporada,
        episode_number: currentPlayingEpisode.episodio,
        thumbnail_url: currentPlayingEpisode.capa_ep || animeDetailsForInfoBox.capa,
      };
      await apiService.addDownloadedItem(token, downloadData);
      alert(`${animeDetailsForInfoBox.titulo} - ${currentPlayingEpisode.descricao || `Episódio ${currentPlayingEpisode.episodio}`} adicionado à sua lista de downloads (simulado).`);
    } catch (err) {
      alert(`Erro ao simular download: ${(err as Error).message}`);
    } finally {
      setIsProcessingDownload(false);
    }
  };

  const currentEpIndex = allExibirEpisodes.findIndex(ep => ep.episodio === currentPlayingEpisode?.episodio);
  const prevExibirEpisode = currentEpIndex > 0 ? allExibirEpisodes[currentEpIndex - 1] : null;
  const nextExibirEpisode = currentEpIndex !== -1 && currentEpIndex < allExibirEpisodes.length - 1 ? allExibirEpisodes[currentEpIndex + 1] : null;

  if (isLoading) return <LoadingSpinner />;
  if (dataFetchError) return <p className="text-red-500 text-center py-10">{dataFetchError}</p>;
  if (!currentPlayingEpisode || !animeDetailsForInfoBox || !animeId || !episodeNumber) return <p className="text-text-secondary text-center py-10">Detalhes do episódio ou anime não encontrados.</p>;

  return (
    <>
      <div className="mb-4 text-sm text-text-secondary">
        <Link to="/" className="hover:text-primary">Início</Link> &raquo; 
        <Link to={`/anime/${animeId}`} className="hover:text-primary px-1">{animeDetailsForInfoBox.titulo}</Link> &raquo; 
        <span className="px-1">{currentPlayingEpisode.descricao || `Episódio ${currentPlayingEpisode.episodio}`}</span>
      </div>

      <div className="space-y-8">
        <section className="bg-card shadow-xl rounded-lg p-4 md:p-6">
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-4 text-center">
            {animeDetailsForInfoBox.titulo} - {currentPlayingEpisode.descricao || `Episódio ${currentPlayingEpisode.episodio}`}
          </h1>
          
          <div ref={playerContainerRef} className="mb-4 w-full aspect-video bg-black rounded-lg overflow-hidden shadow-md">
            {playerError && (
              <div className="w-full h-full flex items-center justify-center text-red-400 p-4">
                <p>{playerError}</p>
              </div>
            )}
          </div>
          
           <div className="flex flex-col sm:flex-row justify-between items-center border-t border-gray-700 pt-4">
            <div className="w-full sm:w-auto mb-2 sm:mb-0">
                 {prevExibirEpisode ? (
                    <Link 
                        to={`/watch/${animeId}/ep/${prevExibirEpisode.episodio}`}
                        className="flex items-center justify-center sm:justify-start space-x-2 bg-primary hover:bg-secondary text-white px-3 py-2 md:px-4 rounded-md text-xs md:text-sm transition-colors w-full sm:w-auto"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        <span>Anterior (Ep. {prevExibirEpisode.episodio})</span>
                    </Link>
                    ) : <div className="sm:w-1/3"></div>} {/* Placeholder to balance layout */}
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-2 mb-2 sm:mb-0">
                <Link
                   to={`/anime/${animeId}`}
                   className="text-primary hover:text-secondary underline text-xs md:text-sm text-center"
                >
                  Lista de Episódios
                </Link>
                <button
                    onClick={handleDownloadEpisode}
                    disabled={isProcessingDownload || !user}
                    className={`flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-semibold py-1.5 px-3 rounded-lg transition-colors shadow-md text-xs md:text-sm ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={!user ? "Faça login para baixar" : "Baixar episódio (mock)"}
                >
                    {isProcessingDownload ? <LoadingSpinner /> : <FaDownload className="mr-1.5"/>}
                    Baixar Ep.
                </button>
            </div>

            <div className="w-full sm:w-auto">
                {nextExibirEpisode ? (
                <Link 
                    to={`/watch/${animeId}/ep/${nextExibirEpisode.episodio}`}
                    className="flex items-center justify-center sm:justify-end space-x-2 bg-primary hover:bg-secondary text-white px-3 py-2 md:px-4 rounded-md text-xs md:text-sm transition-colors w-full sm:w-auto"
                >
                    <span>Próximo (Ep. {nextExibirEpisode.episodio})</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                </Link>
                ) : <div className="sm:w-1/3"></div>} {/* Placeholder to balance layout */}
            </div>
          </div>
        </section>

        <section className="bg-card shadow-xl rounded-lg p-4 md:p-6 flex flex-col md:flex-row gap-4 items-start">
          <div className="w-full md:w-1/4 flex-shrink-0">
            <Link to={`/anime/${animeId}`}>
              <img 
                src={resolveImageUrl(animeDetailsForInfoBox.capa)} 
                alt={animeDetailsForInfoBox.titulo} 
                onError={(e) => (e.currentTarget.src = DEFAULT_PLACEHOLDER_IMAGE)}
                className="w-full h-auto object-cover rounded-md shadow-md aspect-[2/3]"
              />
            </Link>
          </div>
          <div className="md:w-3/4">
            <Link to={`/anime/${animeId}`} className="hover:text-primary">
              <h2 className="text-xl font-semibold text-text-primary mb-2">{animeDetailsForInfoBox.titulo}</h2>
            </Link>
            <p className="text-sm text-text-secondary leading-relaxed max-h-24 overflow-y-auto custom-scrollbar pr-2">
              {animeDetailsForInfoBox.sinopse}
            </p>
          </div>
        </section>

        <CommentSection animeId={animeId} episodeNumber={parseInt(episodeNumber, 10)} />

         {allExibirEpisodes.length > 0 && currentPlayingEpisode && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-3 text-text-primary">Outros Episódios (Temp. {currentPlayingEpisode.temporada})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 custom-scrollbar pb-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {allExibirEpisodes
                .filter(ep => ep.temporada === currentPlayingEpisode.temporada) 
                .map(ep => (
                <Link 
                  key={`${ep.temporada}-${ep.episodio}`} 
                  to={`/watch/${animeId}/ep/${ep.episodio}`} 
                  className={`block rounded-md transition-colors group relative overflow-hidden shadow-lg
                              ${ep.episodio === currentPlayingEpisode.episodio ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-secondary focus:outline-none focus:ring-2 focus:ring-secondary'}`}
                  aria-current={ep.episodio === currentPlayingEpisode.episodio ? "page" : undefined}
                >
                  <img 
                    src={resolveImageUrl(ep.capa_ep || animeDetailsForInfoBox?.capa)} 
                    alt={ep.descricao || `Episódio ${ep.episodio}`}
                    className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-110" 
                    onError={(e) => e.currentTarget.src = EPISODE_THUMB_PLACEHOLDER}/>
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black via-black/70 to-transparent">
                      <p className="text-xs text-white truncate font-medium" title={ep.descricao || `Episódio ${ep.episodio}`}>
                          {ep.descricao || `Ep. ${ep.episodio}`}
                      </p>
                  </div>
                  {ep.episodio === currentPlayingEpisode.episodio && <div className="absolute inset-0 bg-primary/30 pointer-events-none"></div>}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PlayerPage;
