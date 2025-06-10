
import React from 'react';
import { Link } from 'react-router-dom';
import { AnimeBase } from '../types'; // Assuming AnimeBase might get a progress property or use status for it
import { resolveImageUrl, DEFAULT_PLACEHOLDER_IMAGE } from '../constants';
import { FaPlay } from 'react-icons/fa';

interface ContinueWatchingCardProps {
  anime: AnimeBase & { progress?: number; currentEpisode?: string }; // Extend with optional progress info
}

const ContinueWatchingCard: React.FC<ContinueWatchingCardProps> = ({ anime }) => {
  const imageUrl = resolveImageUrl(anime.capa);
  // Example: Extract episode from status or a dedicated field
  const episodeProgressText = anime.status?.startsWith('T') ? anime.status : (anime.currentEpisode || 'T1:E1'); // Fallback for display. T for Temporada.

  // Find first episode link or link to anime detail page
   const watchLink = `/anime/${anime.id}`; // Fallback, ideally link to specific episode

  return (
    <Link to={watchLink} className="block group h-full">
      <div className="bg-card rounded-lg shadow-lg overflow-hidden h-full flex flex-col relative">
        <div className="relative aspect-video w-full"> {/* Landscape aspect ratio for watch cards */}
          <img 
            src={imageUrl} 
            alt={anime.titulo} 
            onError={(e) => (e.currentTarget.src = DEFAULT_PLACEHOLDER_IMAGE)}
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
          
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <FaPlay className="text-white text-4xl bg-black/50 p-2 rounded-full" />
          </div>
          
          {/* Episode progress text */}
           <span className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs font-semibold px-2 py-1 rounded">
            {episodeProgressText.replace("S", "T")} {/* Replacing S with T for Temporada */}
          </span>
        </div>
        
        <div className="p-3">
          <h3 className="text-base font-semibold text-text-primary group-hover:text-primary transition-colors truncate" title={anime.titulo}>
            {anime.titulo}
          </h3>
          {/* Optional: progress bar */}
          {/* <div className="w-full bg-gray-600 rounded-full h-1.5 mt-1.5">
            <div className="bg-primary-action h-1.5 rounded-full" style={{ width: `${anime.progress || 50}%` }}></div>
          </div> */}
        </div>
      </div>
    </Link>
  );
};

export default ContinueWatchingCard;
