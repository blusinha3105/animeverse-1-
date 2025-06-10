
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { Anime } from '../types';
import AnimeGrid from '../components/AnimeGrid';
import LoadingSpinner from '../components/LoadingSpinner';

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('term');
  
  const [results, setResults] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchTerm) {
      const fetchResults = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const data = await apiService.searchAnimes(searchTerm);
          setResults(data);
        } catch (err) {
          setError((err as Error).message || 'Falha ao realizar a busca.');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchResults();
    } else {
      setResults([]); // Clear results if no search term
    }
  }, [searchTerm]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-text-primary">
        Resultados da busca por: <span className="text-primary">{searchTerm || '...'}</span>
      </h1>

      {isLoading && <LoadingSpinner />}
      {error && <p className="text-red-500 text-center">{error}</p>}
      
      {!isLoading && !error && results.length === 0 && searchTerm && (
        <p className="text-text-secondary text-center">Nenhum resultado encontrado para "{searchTerm}".</p>
      )}
      {!isLoading && !error && results.length === 0 && !searchTerm && (
        <p className="text-text-secondary text-center">Por favor, digite um termo para buscar.</p>
      )}

      {!isLoading && !error && results.length > 0 && (
        <AnimeGrid animes={results} />
      )}
    </div>
  );
};

export default SearchPage;