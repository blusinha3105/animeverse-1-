
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { AnimeBase } from '../types';
import AnimeGrid from '../components/AnimeGrid';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';

const SERIES_TIPO_MIDIA = ['Anime', 'Series', 'Série']; // Possible values for series

const SeriesPage: React.FC = () => {
  const [series, setSeries] = useState<AnimeBase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchSeries = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch all animes and filter client-side, or use a specific endpoint if available
        // This approach might be inefficient for large datasets.
        // A backend filter `?tipoMidia=Anime` would be better.
        const data = await apiService.getPaginatedAnimes(currentPage);
        const filteredSeries = data.animes.filter(anime => 
          anime.tipoMidia && SERIES_TIPO_MIDIA.includes(anime.tipoMidia)
        );
        // Client-side pagination after filtering might lead to uneven page content
        // For now, we accept this. Ideally, pagination is backend-driven with filters.
        setSeries(filteredSeries);
        setTotalPages(data.totalPages); // This totalPages is for ALL animes, not just series.
                                      // This needs adjustment if accurate pagination for filtered content is required.
                                      // For now, we'll use it, but it might be misleading.
      } catch (err) {
        setError((err as Error).message || 'Falha ao carregar séries.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSeries();
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading && series.length === 0) return <LoadingSpinner />;
  if (error) return <p className="text-red-500 text-center py-10">{error}</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-text-primary">Séries</h1>
      {isLoading && series.length > 0 && <div className="my-4"><LoadingSpinner /></div>}
      <AnimeGrid animes={series} />
      {series.length === 0 && !isLoading && (
        <p className="text-text-secondary text-center py-10">Nenhuma série encontrada.</p>
      )}
      {totalPages > 1 && !isLoading && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      )}
    </div>
  );
};

export default SeriesPage;
