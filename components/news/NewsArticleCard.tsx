
import React from 'react';
import { Link } from 'react-router-dom';
import { NewsArticle } from '../../types';
import { resolveImageUrl, DEFAULT_PLACEHOLDER_IMAGE } from '../../constants'; // Assuming a default placeholder

interface NewsArticleCardProps {
  article: NewsArticle;
}

const NewsArticleCard: React.FC<NewsArticleCardProps> = ({ article }) => {
  const coverImage = article.cover_image_url ? resolveImageUrl(article.cover_image_url) : DEFAULT_PLACEHOLDER_IMAGE;
  
  return (
    <Link to={`/news/${article.slug}`} className="block group">
      <article className="bg-card rounded-lg shadow-lg overflow-hidden h-full flex flex-col transform transition-all duration-300 hover:scale-105 hover:shadow-primary/30">
        {coverImage && (
          <div className="aspect-video w-full">
            <img 
              src={coverImage} 
              alt={article.title} 
              className="w-full h-full object-cover"
              onError={(e) => (e.currentTarget.src = DEFAULT_PLACEHOLDER_IMAGE)}
            />
          </div>
        )}
        <div className="p-4 flex flex-col flex-grow">
          <h2 className="text-lg font-semibold text-text-primary group-hover:text-primary transition-colors mb-2 truncate" title={article.title}>
            {article.title}
          </h2>
          <p className="text-xs text-text-secondary mb-1">
            Por {article.author_name} em {new Date(article.published_at).toLocaleDateString('pt-BR')}
          </p>
          <p className="text-sm text-text-secondary mb-3 line-clamp-3">
            {article.snippet || article.content_html.substring(0, 100).replace(/<[^>]+>/g, '') + '...'}
          </p>
          <div className="mt-auto">
            <span className="text-sm text-primary font-medium group-hover:underline">
              Ler Mais &rarr;
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default NewsArticleCard;