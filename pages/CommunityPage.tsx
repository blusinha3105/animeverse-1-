
import React, { useState, useEffect, useCallback } from 'react';
import { CommunityPost } from '../types';
import { apiService } from '../services/apiService';
import CreatePostForm from '../components/community/CreatePostForm';
import PostCard from '../components/community/PostCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';

const CommunityPage: React.FC = () => {
  const { user, token } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedPosts = await apiService.getCommunityPosts();
      // Sorting might be handled by backend, but good to ensure if needed
      setPosts(fetchedPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (err) {
      setError((err as Error).message || 'Falha ao carregar posts da comunidade.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []); // Removed token and user dependency as getCommunityPosts is public; specific user data like 'isLiked' would need separate handling

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostCreated = (newPost: CommunityPost) => {
    // The newPost object from the backend now includes user_id, user_name, user_avatar
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-[calc(100vh-10rem)]"><LoadingSpinner /></div>;
  }

  if (error) {
    return <p className="text-center text-red-500 py-10">{error}</p>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-text-primary text-center">Comunidade AnimeVerse</h1>
      
      {user && token && (
        <div className="bg-card p-4 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-primary mb-3">Criar Nova Publicação</h2>
          <CreatePostForm onPostCreated={handlePostCreated} token={token} />
        </div>
      )}

      <div className="space-y-6">
        {posts.length > 0 ? (
          posts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              currentUserId={user?.id} 
              token={token} 
            />
          ))
        ) : (
          <p className="text-center text-text-secondary py-10">Nenhuma publicação na comunidade ainda. Seja o primeiro a postar!</p>
        )}
      </div>
    </div>
  );
};

export default CommunityPage;
      