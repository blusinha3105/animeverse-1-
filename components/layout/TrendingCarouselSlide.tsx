
import React from 'react';
import { Link } from 'react-router-dom';
import { Anime } from '../../types';
import { resolveImageUrl, DEFAULT_PLACEHOLDER_IMAGE } from '../../constants';
import { FaCirclePlay, FaPlus } from 'react-icons/fa6'; // Using Fa6 icons

interface TrendingCarouselSlideProps {
  anime: Anime;
}

const TrendingCarouselSlide: React.FC<TrendingCarouselSlideProps> = ({ anime }) => {
  const imageUrl = resolveImageUrl(anime.capa);
  // Ensure episodes are sorted to get the correct first episode.
  const sortedEpisodes = anime.episodios?.sort((a, b) => a.temporada - b.temporada || a.numero - b.numero);
  const firstEpisodeLink = sortedEpisodes && sortedEpisodes.length > 0
    ? `/watch/${anime.id}/ep/${sortedEpisodes[0].numero}`
    : `/anime/${anime.id}`; // Fallback to detail page if no episodes

  return (
    <div className="relative w-full h-full">
      <img
        src={imageUrl}
        alt={anime.titulo}
        onError={(e) => (e.currentTarget.src = DEFAULT_PLACEHOLDER_IMAGE)}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Gradient overlays for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent w-full md:w-3/4 lg:w-2/3"></div>

      <div className="absolute bottom-0 left-0 p-4 md:p-8 lg:p-10 xl:p-12 text-white w-full md:w-3/5 lg:w-7/12 xl:w-1/2">
        <h2 
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-3 drop-shadow-lg line-clamp-2 md:line-clamp-3" 
          title={anime.titulo}
        >
          {anime.titulo}
        </h2>
        <p className="text-xs sm:text-sm text-gray-300 mb-1">
          {anime.dataPostagem ? `Atualizado ${new Date(anime.dataPostagem).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}` : (anime.anoLancamento ? `Ano: ${anime.anoLancamento}` : 'Recente')}
        </p>
        <p className="text-xs sm:text-sm lg:text-base text-gray-300 mb-3 md:mb-4 line-clamp-2 md:line-clamp-3 lg:line-clamp-3 leading-relaxed">
          {anime.sinopse}
        </p>
        <div className="flex items-center space-x-3 md:space-x-4">
          <Link
            to={firstEpisodeLink}
            className="flex items-center bg-primary-action hover:bg-red-700 text-white font-semibold px-3 py-2 md:px-5 md:py-2.5 rounded-lg text-xs sm:text-sm transition-colors shadow-md"
          >
            <FaCirclePlay className="mr-1.5 md:mr-2 h-4 w-4 md:h-5 md:w-5" /> Assistir Agora
          </Link>
          <button
            aria-label="Adicionar à Minha Lista"
            className="bg-gray-600 bg-opacity-60 hover:bg-opacity-90 text-white p-2 md:p-2.5 rounded-full transition-colors shadow-md"
            onClick={() => alert(`Adicionado ${anime.titulo} à sua lista! (Placeholder)`)}
          >
            <FaPlus size={12} className="md:h-4 md:w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrendingCarouselSlide;
