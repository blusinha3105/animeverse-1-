
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { Anime, AnimeBase } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import TrendingCard from '../components/layout/TrendingCard';
import HorizontalAnimeScroll from '../components/layout/HorizontalAnimeScroll';
import RightInfoPanel from '../components/layout/RightInfoPanel'; // RightInfoPanel will now use top_week from featured
import { DEFAULT_PLACEHOLDER_IMAGE } from '../constants';


const HomePage: React.FC = () => {
  const [trendingAnime, setTrendingAnime] = useState<Anime | null>(null);
  const [continueWatchingAnimes, setContinueWatchingAnimes] = useState<AnimeBase[]>([]); // Stays mocked
  
  const [topWeekAnimes, setTopWeekAnimes] = useState<AnimeBase[]>([]);
  const [featuredMovies, setFeaturedMovies] = useState<AnimeBase[]>([]);
  const [featuredSeries, setFeaturedSeries] = useState<AnimeBase[]>([]);
  const [featuredExtras, setFeaturedExtras] = useState<AnimeBase[]>([]);


  const [loadingStates, setLoadingStates] = useState({
    trending: true,
    continueWatching: true, // Mocked, so control its loading if needed
    topWeek: true,
    featuredMovies: true,
    featuredSeries: true,
    featuredExtras: true,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Trending (still uses recents for a main hero banner)
        setLoadingStates(prev => ({ ...prev, trending: true }));
        const recentsForTrending = await apiService.getAnimesRecentes();
        if (recentsForTrending.length > 0) {
          const fullTrendingAnime = await apiService.getAnimeById(recentsForTrending[0].id.toString());
          setTrendingAnime(fullTrendingAnime);
        } else {
          setTrendingAnime({ id: 0, capa: DEFAULT_PLACEHOLDER_IMAGE, titulo: "Nenhum Anime em Destaque", sinopse: "Por favor, volte mais tarde.", generos: [], episodios: [] });
        }
        setLoadingStates(prev => ({ ...prev, trending: false }));

        // Continue Watching (Mocked)
        setLoadingStates(prev => ({ ...prev, continueWatching: true }));
        const randomForContinue = await apiService.getAnimesAleatorios(); 
        setContinueWatchingAnimes(randomForContinue.slice(0, 6).map(a => ({...a, status: `T1:E${Math.floor(Math.random()*10)+1}`})));
        setLoadingStates(prev => ({ ...prev, continueWatching: false }));

        // Top This Week (Dynamic)
        setLoadingStates(prev => ({ ...prev, topWeek: true }));
        const topWeekData = await apiService.getFeaturedContentList('top_week');
        setTopWeekAnimes(topWeekData);
        setLoadingStates(prev => ({ ...prev, topWeek: false }));
        
        // Featured Movies (Dynamic)
        setLoadingStates(prev => ({ ...prev, featuredMovies: true }));
        const featuredMoviesData = await apiService.getFeaturedContentList('featured_movies');
        setFeaturedMovies(featuredMoviesData);
        setLoadingStates(prev => ({ ...prev, featuredMovies: false }));

        // Featured Series (Dynamic)
        setLoadingStates(prev => ({ ...prev, featuredSeries: true }));
        const featuredSeriesData = await apiService.getFeaturedContentList('featured_series');
        setFeaturedSeries(featuredSeriesData);
        setLoadingStates(prev => ({ ...prev, featuredSeries: false }));
        
        // Featured Extras (Dynamic)
        setLoadingStates(prev => ({ ...prev, featuredExtras: true }));
        const featuredExtrasData = await apiService.getFeaturedContentList('featured_extras');
        setFeaturedExtras(featuredExtrasData);
        setLoadingStates(prev => ({ ...prev, featuredExtras: false }));

      } catch (err) {
        setError((err as Error).message || 'Falha ao carregar dados da página inicial.');
        console.error("HomePage fetch error:", err);
        // Set all loading to false on error to prevent infinite spinners
        setLoadingStates({ trending: false, continueWatching: false, topWeek: false, featuredMovies: false, featuredSeries: false, featuredExtras: false });
      }
    };
    fetchData();
  }, []);
  
  if (error && !loadingStates.trending && !loadingStates.topWeek) { // Show error if critical fetches fail
    return <p className="text-red-500 text-center py-10">{error}</p>;
  }
  
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main content area */}
      <div className="flex-grow space-y-8 min-w-0">
        {loadingStates.trending ? 
          <div className="h-72 md:h-96 flex items-center justify-center bg-card rounded-xl"><LoadingSpinner/></div> : 
          trendingAnime && <TrendingCard anime={trendingAnime} />
        }

        {loadingStates.continueWatching ? 
          <div className="h-60 flex items-center justify-center bg-card rounded-xl"><LoadingSpinner/></div> :
          <HorizontalAnimeScroll title="Continue Assistindo" animes={continueWatchingAnimes} cardType="progress" />
        }
        
        {loadingStates.featuredSeries ? 
          <div className="h-72 flex items-center justify-center bg-card rounded-xl"><LoadingSpinner/></div> :
          <HorizontalAnimeScroll title="Séries em Destaque" animes={featuredSeries} cardType="standard"/>
        }

        {loadingStates.featuredMovies ? 
          <div className="h-72 flex items-center justify-center bg-card rounded-xl"><LoadingSpinner/></div> :
          <HorizontalAnimeScroll title="Filmes em Destaque" animes={featuredMovies} cardType="standard"/>
        }
        
        {loadingStates.featuredExtras ? 
          <div className="h-72 flex items-center justify-center bg-card rounded-xl"><LoadingSpinner/></div> :
          <HorizontalAnimeScroll title="Extras em Destaque" animes={featuredExtras} cardType="standard"/>
        }
      </div>

      {/* Right Info Panel uses topWeekAnimes */}
      <div className="lg:w-72 xl:w-80 flex-shrink-0">
        {(loadingStates.topWeek) && !topWeekAnimes.length && !error ? 
        <div className="lg:sticky lg:top-20 h-96 flex items-center justify-center bg-card rounded-xl lg:mt-0 mt-6"><LoadingSpinner/></div> :
        <RightInfoPanel 
            topWeekAnimes={topWeekAnimes} 
            yourMovies={featuredMovies} // Can replace 'yourMovies' with another list if needed, or keep as featured movies for now
            loadingTopWeek={loadingStates.topWeek}
            loadingYourMovies={loadingStates.featuredMovies} // Reflects featured movies loading
        />
        }
      </div>
    </div>
  );
};

export default HomePage;
