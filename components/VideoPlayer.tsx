
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import LoadingSpinner from './LoadingSpinner';

interface VideoPlayerProps {
  originalVideoUrl: string; // The episode.link from the database
  title?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ originalVideoUrl, title }) => {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemporaryLink = async () => {
      if (!originalVideoUrl) {
        setError("Nenhuma URL de vídeo fornecida.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiService.generateTemporaryLink(originalVideoUrl);
        setVideoSrc(response.temporaryLink);
      } catch (err) {
        setError((err as Error).message || 'Falha ao carregar o vídeo. O link pode ser inválido ou ter expirado.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemporaryLink();
  }, [originalVideoUrl]);

  if (isLoading) {
    return (
      <div className="w-full aspect-video bg-black flex flex-col justify-center items-center text-text-primary">
        <LoadingSpinner />
        <p className="mt-2">Carregando vídeo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full aspect-video bg-black flex flex-col justify-center items-center text-red-400 p-4">
        <p className="font-semibold">Erro ao carregar vídeo:</p>
        <p className="text-sm">{error}</p>
        <p className="text-xs mt-2">Por favor, tente atualizar a página ou selecione outra fonte, se disponível.</p>
      </div>
    );
  }

  if (!videoSrc) {
    return (
      <div className="w-full aspect-video bg-black flex justify-center items-center text-text-secondary">
        Vídeo não disponível.
      </div>
    );
  }

  return (
    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
      <video
        key={videoSrc} // Force re-render if src changes, helps with some browser caching issues
        className="w-full h-full"
        controls
        autoPlay
        preload="auto"
        src={videoSrc}
        title={title || 'Episódio de Anime'}
      >
        Seu navegador não suporta a tag de vídeo.
      </video>
    </div>
  );
};

export default VideoPlayer;