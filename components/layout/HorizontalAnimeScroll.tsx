
import React from 'react';
import { AnimeBase } from '../../types';
import AnimeCard from '../AnimeCard'; // Standard card for recommendations
import ContinueWatchingCard from '../ContinueWatchingCard'; // Special card for progress

interface HorizontalAnimeScrollProps {
  title: string;
  animes: AnimeBase[];
  cardType?: 'standard' | 'progress';
}

const HorizontalAnimeScroll: React.FC<HorizontalAnimeScrollProps> = ({ title, animes, cardType = 'standard' }) => {
  if (!animes || animes.length === 0) {
    return (
      <section className="py-4">
        <h3 className="text-xl font-semibold mb-3 text-text-primary">{title}</h3>
        <p className="text-text-secondary">Nenhum item para exibir nesta seção.</p>
      </section>
    );
  }

  const CardComponent = cardType === 'progress' ? ContinueWatchingCard : AnimeCard;
  const cardWidthClass = cardType === 'progress' ? 'w-60 md:w-72' : 'w-40 md:w-48'; // Adjust width based on card type

  return (
    <section className="py-4">
      <h3 className="text-xl font-semibold mb-4 text-text-primary">{title}</h3>
      <div className="flex overflow-x-auto space-x-4 pb-4 horizontal-scrollbar">
        {animes.map((anime) => (
          <div key={`${title}-${anime.id}`} className={`flex-shrink-0 ${cardWidthClass}`}>
            <CardComponent anime={anime} />
          </div>
        ))}
        {/* Optional: Add a see more card/button */}
        {/* <div className="flex-shrink-0 w-40 md:w-48 flex items-center justify-center">
          <Link to={`/view-all/${title.toLowerCase().replace(/\s+/g, '-')}`} className="text-primary hover:underline">Ver todos</Link>
        </div> */}
      </div>
    </section>
  );
};

export default HorizontalAnimeScroll;