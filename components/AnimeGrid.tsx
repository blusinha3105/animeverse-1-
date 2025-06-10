
import React from 'react';
import { AnimeBase } from '../types';
import AnimeCard from './AnimeCard';

interface AnimeGridProps {
  animes: AnimeBase[];
  title?: string;
}

const AnimeGrid: React.FC<AnimeGridProps> = ({ animes, title }) => {
  if (!animes || animes.length === 0) {
    return title ? <div className="py-4"><h2 className="text-2xl font-semibold mb-4 text-text-primary">{title}</h2><p className="text-text-secondary">No animes found.</p></div> : <p className="text-text-secondary text-center py-8">No animes to display.</p>;
  }

  return (
    <section className="py-4">
      {title && <h2 className="text-2xl font-semibold mb-6 text-text-primary">{title}</h2>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {animes.map((anime) => (
          <AnimeCard key={anime.id} anime={anime} />
        ))}
      </div>
    </section>
  );
};

export default AnimeGrid;
    