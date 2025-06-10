
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { AnimeBase } from '../types';
import AnimeGrid from '../components/AnimeGrid';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';

const MOVIES_TIPO_MIDIA = ['Filme', 'Movie'];

const MoviesPage: React.FC = () => {
  const [movies, setMovies] = useState<AnimeBase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchMovies = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiService.getPaginatedAnimes(currentPage);
        const filteredMovies = data.animes.filter(anime =>
          anime.tipoMidia && MOVIES_TIPO_MIDIA.includes(anime.tipoMidia)
        );
        setMovies(filteredMovies);
        setTotalPages(data.totalPages); // See note in SeriesPage about totalPages
      } catch (err) {
        setError((err as Error).message || 'Falha ao carregar filmes.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovies();
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading && movies.length === 0) return <LoadingSpinner />;
  if (error) return <p className="text-red-500 text-center py-10">{error}</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-text-primary">Filmes</h1>
      {isLoading && movies.length > 0 && <div className="my-4"><LoadingSpinner /></div>}
      <AnimeGrid animes={movies} />
      {movies.length === 0 && !isLoading && (
        <p className="text-text-secondary text-center py-10">Nenhum filme encontrado.</p>
      )}
      {totalPages > 1 && !isLoading && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      )}
    </div>
  );
};

export default MoviesPage;
