
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { AnimeBase } from '../types';
import AnimeGrid from '../components/AnimeGrid';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';

const EXTRAS_TIPO_MIDIA = ['Ova', 'Especial', 'ONA']; // Possible values for extras

const ExtrasPage: React.FC = () => {
  const [extras, setExtras] = useState<AnimeBase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchExtras = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiService.getPaginatedAnimes(currentPage);
        const filteredExtras = data.animes.filter(anime =>
          anime.tipoMidia && EXTRAS_TIPO_MIDIA.includes(anime.tipoMidia)
        );
        setExtras(filteredExtras);
        setTotalPages(data.totalPages); // See note in SeriesPage about totalPages
      } catch (err) {
        setError((err as Error).message || 'Falha ao carregar extras.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExtras();
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading && extras.length === 0) return <LoadingSpinner />;
  if (error) return <p className="text-red-500 text-center py-10">{error}</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-text-primary">Extras (OVAs, Especiais)</h1>
      {isLoading && extras.length > 0 && <div className="my-4"><LoadingSpinner /></div>}
      <AnimeGrid animes={extras} />
       {extras.length === 0 && !isLoading && (
        <p className="text-text-secondary text-center py-10">Nenhum extra encontrado.</p>
      )}
      {totalPages > 1 && !isLoading && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      )}
    </div>
  );
};

export default ExtrasPage;
