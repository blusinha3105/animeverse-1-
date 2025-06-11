
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { Anime, AnimeBase } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import TrendingCarousel from '../components/layout/TrendingCarousel'; // New component
import HorizontalAnimeScroll from '../components/layout/HorizontalAnimeScroll';
import RightInfoPanel from '../components/layout/RightInfoPanel'; 
import { DEFAULT_PLACEHOLDER_IMAGE } from '../constants';


const HomePage: React.FC = () => {
  const [trendingAnimesCarousel, setTrendingAnimesCarousel] = useState<Anime[]>([]); // Changed from single anime
  const [continueWatchingAnimes, setContinueWatchingAnimes] = useState<AnimeBase[]>([]); 
  
  const [topWeekAnimes, setTopWeekAnimes] = useState<AnimeBase[]>([]);
  const [featuredMovies, setFeaturedMovies] = useState<AnimeBase[]>([]);
  const [featuredSeries, setFeaturedSeries] = useState<AnimeBase[]>([]);
  const [featuredExtras, setFeaturedExtras] = useState<AnimeBase[]>([]);


  const [loadingStates, setLoadingStates] = useState({
    trending: true,
    continueWatching: true, 
    topWeek: true,
    featuredMovies: true,
    featuredSeries: true,
    featuredExtras: true,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Trending Carousel (up to 4 animes)
        setLoadingStates(prev => ({ ...prev, trending: true }));
        const recentsForCarousel = await apiService.getAnimesRecentes();
        if (recentsForCarousel.length > 0) {
          // The getAnimesRecentes already returns Anime[] which includes episodios.
          // No need to fetch full details one by one if this data is sufficient.
          setTrendingAnimesCarousel(recentsForCarousel.slice(0, 4));
        } else {
          // Provide a fallback structure if no animes are found
          const fallbackAnime: Anime = { 
            id: 0, 
            capa: DEFAULT_PLACEHOLDER_IMAGE, 
            titulo: "Nenhum Anime em Destaque", 
            sinopse: "Por favor, volte mais tarde.", 
            generos: [], 
            episodios: [] 
          };
          setTrendingAnimesCarousel([fallbackAnime]);
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
        setLoadingStates({ trending: false, continueWatching: false, topWeek: false, featuredMovies: false, featuredSeries: false, featuredExtras: false });
      }
    };
    fetchData();
  }, []);
  
  if (error && !loadingStates.trending && !loadingStates.topWeek) { 
    return <p className="text-red-500 text-center py-10">{error}</p>;
  }
  
  return (
    <div className="flex flex-col gap-6"> {/* Changed from lg:flex-row */}
      {/* Main content area */}
      <div className="flex-grow space-y-8 min-w-0">
        {loadingStates.trending ? 
          <div className="h-72 md:h-96 lg:h-[480px] xl:h-[550px] flex items-center justify-center bg-card rounded-xl"><LoadingSpinner/></div> : 
          trendingAnimesCarousel.length > 0 && <TrendingCarousel animes={trendingAnimesCarousel} />
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

      {/* Right Info Panel - MOVED HERE, BELOW MAIN CONTENT */}
      <div className="w-full mt-8"> {/* Adjusted width and added margin */}
        {(loadingStates.topWeek || loadingStates.featuredMovies) && (!topWeekAnimes.length && !featuredMovies.length) && !error ? 
        <div className="h-96 flex items-center justify-center bg-card rounded-xl mt-6"><LoadingSpinner/></div> :
        <RightInfoPanel 
            topWeekAnimes={topWeekAnimes} 
            yourMovies={featuredMovies} 
            loadingTopWeek={loadingStates.topWeek}
            loadingYourMovies={loadingStates.featuredMovies}
        />
        }
      </div>
    </div>
  );
};

export default HomePage;
