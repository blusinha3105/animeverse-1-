
import React, { useState, useEffect, useCallback } from 'react';
import { Episode } from '../types';
import { apiService } from '../services/apiService';
import EpisodeCard from './EpisodeCard';
import LoadingSpinner from './LoadingSpinner';
import Pagination from './Pagination';

interface EpisodeListProps {
  animeId: string;
  totalInitialEpisodes?: number; // Total episodes for the anime, if known, to set initial total pages
}

const ITEMS_PER_PAGE = 20; // Or make this configurable

const EpisodeList: React.FC<EpisodeListProps> = ({ animeId, totalInitialEpisodes }) => {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(Math.ceil((totalInitialEpisodes || 0) / ITEMS_PER_PAGE) || 1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEpisodes = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getPaginatedEpisodes(animeId, page, ITEMS_PER_PAGE);
      setEpisodes(data.episodios);
      setTotalPages(Math.ceil(data.totalEpisodios / ITEMS_PER_PAGE));
      setCurrentPage(page);
    } catch (err) {
      setError((err as Error).message || 'Failed to load episodes.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animeId]);

  useEffect(() => {
    fetchEpisodes(1);
  }, [fetchEpisodes]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchEpisodes(newPage);
    }
  };

  if (isLoading && episodes.length === 0) return <LoadingSpinner />;
  if (error) return <p className="text-red-500 text-center py-4">{error}</p>;
  if (episodes.length === 0 && !isLoading) return <p className="text-text-secondary text-center py-4">No episodes available for this anime yet.</p>;

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4 text-text-primary">Episódios</h3>
      {isLoading && <LoadingSpinner />}
      {!isLoading && episodes.length > 0 && (
         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {episodes.map((ep) => (
            <EpisodeCard key={`${ep.temporada}-${ep.numero}`} episode={ep} animeId={animeId} />
          ))}
        </div>
      )}
      {totalPages > 1 && !isLoading && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      )}
    </div>
  );
};

export default EpisodeList;
    