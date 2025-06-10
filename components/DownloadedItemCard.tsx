
import React from 'react';
import { Link } from 'react-router-dom';
import { DownloadedItem } from '../types';
import { resolveImageUrl, EPISODE_THUMB_PLACEHOLDER } from '../constants';
import { FaPlay, FaTrashAlt, FaFilm, FaTv } from 'react-icons/fa';

interface DownloadedItemCardProps {
  item: DownloadedItem;
  onRemove: (itemId: string | number) => void;
}

const DownloadedItemCard: React.FC<DownloadedItemCardProps> = ({ item, onRemove }) => {
  const imageUrl = item.thumbnail_url ? resolveImageUrl(item.thumbnail_url) : EPISODE_THUMB_PLACEHOLDER;
  const watchLink = item.episode_number 
    ? `/watch/${item.anime_id}/ep/${item.episode_number}`
    : `/anime/${item.anime_id}`; // Fallback for movies or if ep number not specified

  return (
    <div className="bg-card rounded-lg shadow-lg overflow-hidden flex flex-col sm:flex-row group transition-all duration-300 hover:shadow-primary/30">
      <Link to={watchLink} className="sm:w-1/3 block relative">
        <img 
          src={imageUrl} 
          alt={item.title} 
          className="w-full h-40 sm:h-full object-cover aspect-video sm:aspect-auto" 
          onError={(e) => (e.currentTarget.src = EPISODE_THUMB_PLACEHOLDER)}
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-opacity">
          <FaPlay className="text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </Link>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <Link to={watchLink}>
            <h3 className="text-md font-semibold text-text-primary group-hover:text-primary transition-colors mb-1 truncate" title={item.title}>
              {item.title}
            </h3>
          </Link>
          {item.episode_title && (
            <p className="text-xs text-text-secondary mb-0.5">
              {item.season_number && `T${item.season_number} `}E{item.episode_number}: {item.episode_title}
            </p>
          )}
          <p className="text-xs text-text-secondary mb-0.5">
            Tamanho: <span className="font-medium text-text-primary">{item.size_mb.toFixed(1)} MB</span>
          </p>
          <p className="text-xs text-text-secondary">
            Baixado em: {new Date(item.downloaded_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
        
        <div className="mt-3 flex items-center space-x-2">
            <Link
                to={watchLink}
                className="flex-1 flex items-center justify-center px-3 py-1.5 bg-primary hover:bg-secondary text-white text-xs rounded-md transition-colors"
            >
                <FaPlay className="mr-1.5" /> Assistir
            </Link>
            <button
                onClick={() => onRemove(item.id)}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-md transition-colors"
                aria-label="Remover download"
            >
                <FaTrashAlt />
            </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadedItemCard;
