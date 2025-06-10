
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { NewsArticle } from '../types';
import { apiService } from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';
import { resolveImageUrl } from '../constants'; // Removed DEFAULT_PLACEHOLDER_IMAGE as it's handled by resolveImageUrl
import { FaArrowLeft, FaCalendarDays, FaUserPen, FaTags } from 'react-icons/fa6';

const NewsArticleDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) {
        setError("Slug do artigo não fornecido.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const fetchedArticle = await apiService.getNewsArticleBySlug(slug); 
        if (fetchedArticle) {
          setArticle(fetchedArticle);
        } else {
          setError("Artigo não encontrado.");
        }
      } catch (err) {
        setError((err as Error).message || 'Falha ao carregar o artigo.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-[calc(100vh-10rem)]"><LoadingSpinner /></div>;
  }

  if (error) {
    return <p className="text-center text-red-500 py-10">{error}</p>;
  }

  if (!article) {
    return <p className="text-center text-text-secondary py-10">Artigo não encontrado.</p>;
  }

  const coverImage = article.cover_image_url ? resolveImageUrl(article.cover_image_url) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/news" className="inline-flex items-center text-sm text-primary hover:underline mb-4">
        <FaArrowLeft className="mr-2" /> Voltar para Notícias
      </Link>

      <article className="bg-card p-6 md:p-8 rounded-lg shadow-xl">
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">{article.title}</h1>
        
        <div className="flex flex-wrap items-center text-xs text-text-secondary mb-6 gap-x-4 gap-y-1">
          <span className="flex items-center"><FaCalendarDays className="mr-1.5"/> Publicado em: {new Date(article.published_at).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <span className="flex items-center"><FaUserPen className="mr-1.5"/> Por: {article.author_name}</span>
          {article.tags && article.tags.length > 0 && (
            <span className="flex items-center"><FaTags className="mr-1.5"/> Tags: {article.tags.join(', ')}</span>
          )}
        </div>

        {coverImage && (
          <img 
            src={coverImage} 
            alt={article.title} 
            className="w-full h-auto max-h-[500px] object-cover rounded-md mb-6 shadow-md"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        )}
        {/* TODO: Add video player support for article.cover_video_url if present */}

        <div 
          className="prose prose-sm sm:prose-base prose-invert max-w-none text-text-primary leading-relaxed custom-scrollbar"
          dangerouslySetInnerHTML={{ __html: article.content_html }} 
        />
      </article>
    </div>
  );
};

export default NewsArticleDetailPage;
      