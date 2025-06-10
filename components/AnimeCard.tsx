
import React from 'react';
import { Link } from 'react-router-dom';
import { AnimeBase } from '../types';
import { resolveImageUrl, DEFAULT_PLACEHOLDER_IMAGE } from '../constants';

interface AnimeCardProps {
  anime: AnimeBase;
}

const AnimeCard: React.FC<AnimeCardProps> = ({ anime }) => {
  const imageUrl = resolveImageUrl(anime.capa);

  return (
    <Link to={`/anime/${anime.id}`} className="block group h-full">
      <div className="bg-card rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-primary/30 h-full flex flex-col">
        <div className="relative aspect-[2/3] w-full">
          <img 
            src={imageUrl} 
            alt={anime.titulo} 
            onError={(e) => (e.currentTarget.src = DEFAULT_PLACEHOLDER_IMAGE)}
            className="w-full h-full object-cover" 
          />
          {anime.selo && (
            <span className="absolute top-1.5 left-1.5 bg-primary-action text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
              {anime.selo}
            </span>
          )}
           {anime.tipoMidia && (
            <span className="absolute bottom-1.5 right-1.5 bg-black bg-opacity-75 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
              {anime.tipoMidia}
            </span>
          )}
        </div>
        <div className="p-2.5 flex flex-col flex-grow"> {/* Slightly reduced padding */}
          <h3 className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors truncate" title={anime.titulo}>
            {anime.titulo}
          </h3>
          {anime.anoLancamento && (
            <p className="text-xs text-text-secondary mt-0.5">{anime.anoLancamento}</p>
          )}
          {/* Removed status from card for cleaner look in horizontal scroll, can be added back if needed */}
          {/* {anime.status && (
            <p className="text-xs text-text-secondary mt-0.5">{anime.status}</p>
          )} */}
          <div className="mt-auto pt-1.5">
            {anime.generos && anime.generos.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {anime.generos.slice(0, 2).map((genre) => (
                  <span key={genre} className="text-[10px] bg-gray-700 text-text-secondary px-1.5 py-0.5 rounded-full">
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default AnimeCard;