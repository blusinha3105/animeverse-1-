
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { AnimeBase } from '../types';
import HorizontalAnimeScroll from '../components/layout/HorizontalAnimeScroll';
import LoadingSpinner from '../components/LoadingSpinner';

interface AnimesByGenre {
  [genre: string]: AnimeBase[];
}

const DiscoveryPage: React.FC = () => {
  const [animesByGenre, setAnimesByGenre] = useState<AnimesByGenre>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [genresOrder, setGenresOrder] = useState<string[]>([]);

  useEffect(() => {
    const fetchAndGroupAnimes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch all animes - In a real app, this might need pagination or a dedicated endpoint
        // For now, let's fetch a few pages to get a decent variety.
        let allAnimes: AnimeBase[] = [];
        const initialData = await apiService.getPaginatedAnimes(1);
        allAnimes = initialData.animes;

        // If totalPages > 1, fetch more (up to a limit for this demo)
        const pagesToFetch = Math.min(initialData.totalPages, 5); // Fetch up to 5 pages
        if (pagesToFetch > 1) {
            for (let i = 2; i <= pagesToFetch; i++) {
                const nextPageData = await apiService.getPaginatedAnimes(i);
                allAnimes = [...allAnimes, ...nextPageData.animes];
            }
        }
        
        // Remove duplicates based on ID, in case API returns same anime on different pages (unlikely for good pagination)
        const uniqueAnimes = Array.from(new Map(allAnimes.map(anime => [anime.id, anime])).values());

        const grouped: AnimesByGenre = {};
        const genreSet = new Set<string>();

        uniqueAnimes.forEach(anime => {
          anime.generos.forEach(genre => {
            genreSet.add(genre);
            if (!grouped[genre]) {
              grouped[genre] = [];
            }
            grouped[genre].push(anime);
          });
        });
        
        // Sort genres alphabetically for consistent order
        const sortedGenres = Array.from(genreSet).sort((a,b) => a.localeCompare(b));
        setGenresOrder(sortedGenres);
        setAnimesByGenre(grouped);

      } catch (err) {
        setError((err as Error).message || 'Falha ao carregar animes para descoberta.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndGroupAnimes();
  }, []);

  if (isLoading) {
    return <div className="flex justify-center items-center h-[calc(100vh-10rem)]"><LoadingSpinner /></div>;
  }

  if (error) {
    return <p className="text-center text-red-500 py-10">{error}</p>;
  }

  if (genresOrder.length === 0) {
    return <p className="text-center text-text-secondary py-10">Nenhum anime encontrado para exibir.</p>;
  }

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold text-text-primary mb-8">Descobrir Animes por Gênero</h1>
      {genresOrder.map(genre => (
        animesByGenre[genre] && animesByGenre[genre].length > 0 && (
          <HorizontalAnimeScroll 
            key={genre} 
            title={genre} 
            animes={animesByGenre[genre]}
            cardType="standard"
          />
        )
      ))}
    </div>
  );
};

export default DiscoveryPage;
