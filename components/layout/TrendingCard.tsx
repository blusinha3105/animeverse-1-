
import React from 'react';
import { Link } from 'react-router-dom';
import { Anime } from '../../types';
import { resolveImageUrl, DEFAULT_PLACEHOLDER_IMAGE } from '../../constants';
import { FaPlayCircle, FaPlus } from 'react-icons/fa';

interface TrendingCardProps {
  anime: Anime;
}

const TrendingCard: React.FC<TrendingCardProps> = ({ anime }) => {
  const imageUrl = resolveImageUrl(anime.capa);
  const firstEpisodeLink = anime.episodios && anime.episodios.length > 0 
    ? `/watch/${anime.id}/ep/${anime.episodios.sort((a,b) => a.numero - b.numero)[0].numero}` 
    : `/anime/${anime.id}`; // Fallback to detail page if no episodes

  return (
    <div className="relative rounded-xl overflow-hidden shadow-2xl aspect-video md:aspect-[2.5/1] group">
      <img 
        src={imageUrl} 
        alt={anime.titulo} 
        onError={(e) => (e.currentTarget.src = DEFAULT_PLACEHOLDER_IMAGE)}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent w-3/4 md:w-1/2"></div>
      
      <div className="absolute bottom-0 left-0 p-4 md:p-8 lg:p-10 text-white w-full md:w-3/5 lg:w-1/2">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-3 drop-shadow-lg">
          {anime.titulo}
        </h2>
        <p className="text-xs sm:text-sm text-gray-300 mb-1">
          Atualizado {anime.dataPostagem ? new Date(anime.dataPostagem).toLocaleDateString('pt-BR') : 'recentemente'}
        </p>
        <p className="text-xs sm:text-sm text-gray-300 mb-3 md:mb-4 max-h-16 overflow-hidden line-clamp-2 md:line-clamp-3">
          {anime.sinopse}
        </p>
        <div className="flex items-center space-x-3 md:space-x-4">
          <Link 
            to={firstEpisodeLink}
            className="flex items-center bg-primary-action hover:bg-red-700 text-white font-semibold px-4 py-2 md:px-6 md:py-2.5 rounded-lg text-sm md:text-base transition-colors shadow-md"
          >
            <FaPlayCircle className="mr-2" /> Assistir Agora
          </Link>
          <button 
            aria-label="Adicionar à Minha Lista"
            className="bg-gray-600 bg-opacity-70 hover:bg-opacity-100 text-white p-2 md:p-2.5 rounded-full transition-colors"
            onClick={() => alert(`Adicionado ${anime.titulo} à sua lista! (Placeholder)`)}
          >
            <FaPlus size={14}/>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrendingCard;