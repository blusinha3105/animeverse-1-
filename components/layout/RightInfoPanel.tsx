
import React from 'react';
import { Link } from 'react-router-dom';
import { AnimeBase } from '../../types';
import { FaListAlt, FaFilm, FaArrowRight } from 'react-icons/fa';
import { resolveImageUrl, DEFAULT_PLACEHOLDER_IMAGE } from '../../constants';
import LoadingSpinner from '../LoadingSpinner';

interface RightInfoPanelProps {
  topWeekAnimes: AnimeBase[];
  yourMovies: AnimeBase[];
  loadingTopWeek?: boolean;
  loadingYourMovies?: boolean;
}

const RightInfoPanel: React.FC<RightInfoPanelProps> = ({ topWeekAnimes, yourMovies, loadingTopWeek, loadingYourMovies }) => {
  return (
    <aside className="bg-card p-4 rounded-lg shadow-lg space-y-6 w-full"> {/* Removed sticky, top, overflow, max-h */}
      <InfoSection title="Top da Semana" icon={<FaListAlt />} animes={topWeekAnimes} loading={loadingTopWeek} />
      <InfoSection title="Seus Filmes" icon={<FaFilm />} animes={yourMovies} loading={loadingYourMovies} />
    </aside>
  );
};

interface InfoSectionProps {
  title: string;
  icon: React.ReactNode;
  animes: AnimeBase[];
  loading?: boolean;
}

const InfoSection: React.FC<InfoSectionProps> = ({ title, icon, animes, loading }) => {
  if (loading) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-lg font-semibold text-text-primary flex items-center">
                {icon} <span className="ml-2">{title}</span>
                </h4>
            </div>
            <LoadingSpinner/>
        </div>
    );
  }
  
  if (!animes || animes.length === 0) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-lg font-semibold text-text-primary flex items-center">
                {icon} <span className="ml-2">{title}</span>
                </h4>
            </div>
            <p className="text-sm text-text-secondary">Nenhum item para exibir.</p>
        </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-lg font-semibold text-text-primary flex items-center">
          {icon} <span className="ml-2">{title}</span>
        </h4>
        {/* Optional: Link to see all */}
        {/* <Link to={`/all/${title.toLowerCase().replace(/\s+/g, '-')}`} className="text-xs text-primary hover:underline">Ver todos</Link> */}
      </div>
      <ul className="space-y-3">
        {animes.slice(0,3).map(anime => ( // Show top 3 for example
          <li key={`${title}-${anime.id}`}>
            <Link to={`/anime/${anime.id}`} className="flex items-start space-x-3 group p-1.5 rounded-md hover:bg-gray-700 transition-colors">
              <img 
                src={resolveImageUrl(anime.capa)} 
                alt={anime.titulo} 
                onError={(e) => (e.currentTarget.src = DEFAULT_PLACEHOLDER_IMAGE)}
                className="w-12 h-16 object-cover rounded-md flex-shrink-0" 
              />
              <div className="flex-grow overflow-hidden">
                <h5 className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors truncate" title={anime.titulo}>
                  {anime.titulo}
                </h5>
                <p className="text-xs text-text-secondary truncate" title={anime.generos?.join(', ')}>
                  {anime.generos?.slice(0, 2).join(', ') || 'N/A'}
                </p>
                {anime.classificacao && ( // Assuming 'classificacao' might contain rating like "4.5 stars"
                     <p className="text-xs text-yellow-400 mt-0.5">&#9733; {anime.classificacao.match(/\d+(\.\d+)?/)?.[0] || anime.classificacao}</p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      { animes.length > 3 && 
        <Link to={`/all-${title.toLowerCase().replace(/\s+/g, '-')}`} className="block text-center mt-3 text-sm bg-primary-action hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-md transition-colors">
          Ver Mais <FaArrowRight className="inline ml-1"/>
        </Link>
      }
    </div>
  );
};

export default RightInfoPanel;
