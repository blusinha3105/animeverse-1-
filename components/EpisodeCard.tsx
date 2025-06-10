
import React from 'react';
import { Link } from 'react-router-dom';
import { Episode } from '../types';
import { resolveImageUrl, EPISODE_THUMB_PLACEHOLDER } from '../constants';

interface EpisodeCardProps {
  episode: Episode;
  animeId: number | string;
}

const EpisodeCard: React.FC<EpisodeCardProps> = ({ episode, animeId }) => {
  const imageUrl = resolveImageUrl(episode.capa_ep);
  
  return (
    <Link to={`/watch/${animeId}/ep/${episode.numero}`} className="block group">
      <div className="bg-card rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:bg-gray-700">
        {episode.capa_ep && (
          <div className="relative aspect-video w-full">
            <img 
              src={imageUrl} 
              alt={`Episode ${episode.numero}`} 
              onError={(e) => (e.currentTarget.src = EPISODE_THUMB_PLACEHOLDER)}
              className="w-full h-full object-cover"
            />
             {episode.alertanovoep === 1 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">NEW</span>
            )}
          </div>
        )}
        <div className="p-3">
          <h4 className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors truncate" title={episode.nome || `Episódio ${episode.numero}`}>
            {`Ep. ${episode.numero}${episode.nome ? `: ${episode.nome}` : ''}`}
          </h4>
          <p className="text-xs text-text-secondary">Temporada {episode.temporada}</p>
        </div>
      </div>
    </Link>
  );
};

export default EpisodeCard;
    