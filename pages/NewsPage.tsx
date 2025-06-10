
import React, { useState, useEffect } from 'react';
import { NewsArticle } from '../types';
import { apiService } from '../services/apiService';
import NewsArticleCard from '../components/news/NewsArticleCard';
import LoadingSpinner from '../components/LoadingSpinner';

const NewsPage: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedArticles = await apiService.getNewsArticles(); 
        setArticles(fetchedArticles.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()));
      } catch (err) {
        setError((err as Error).message || 'Falha ao carregar notícias.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, []);

  if (isLoading) {
    return <div className="flex justify-center items-center h-[calc(100vh-10rem)]"><LoadingSpinner /></div>;
  }

  if (error) {
    return <p className="text-center text-red-500 py-10">{error}</p>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-text-primary text-center">Notícias e Destaques do AnimeVerse</h1>
      
      {articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map(article => (
            <NewsArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <p className="text-center text-text-secondary py-10">Nenhuma notícia disponível no momento. Volte em breve!</p>
      )}
    </div>
  );
};

export default NewsPage;
      