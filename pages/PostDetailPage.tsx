
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CommunityPost, CommunityComment } from '../types';
import { apiService } from '../services/apiService';
import PostCard from '../components/community/PostCard';
import CreateCommentForm from '../components/comments/CommentForm'; // Using existing form, adapted
import LoadingSpinner from '../components/LoadingSpinner';
import { FaArrowLeft, FaCircleUser } from 'react-icons/fa6';
import { useAuth } from '../hooks/useAuth';
import { resolveImageUrl } from '../constants';

const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const { user, token } = useAuth();

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPostingComment, setIsPostingComment] = useState(false);

  const fetchPostAndComments = useCallback(async () => {
    if (!postId) return;
    setIsLoading(true);
    setError(null);
    try {
      // Fetch the specific post. 
      // This assumes getCommunityPosts() can be used, or a new endpoint like /api/community/posts/:postId exists.
      // For now, filtering from all posts for simplicity.
      const allPosts = await apiService.getCommunityPosts(); 
      const foundPost = allPosts.find(p => p.id.toString() === postId);
      
      if (foundPost) {
        // TODO: Ideally, the backend would tell us if the current user liked this specific post.
        // For now, `isLiked` will be managed optimistically within PostCard or need a separate fetch.
        setPost(foundPost);
        const fetchedComments = await apiService.getPostComments(postId);
        setComments(fetchedComments);
      } else {
        setError("Publicação não encontrada.");
      }
    } catch (err) {
      setError((err as Error).message || 'Falha ao carregar a publicação.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [postId]); // Removed token and user from deps as primary fetch is public

  useEffect(() => {
    fetchPostAndComments();
  }, [fetchPostAndComments]);

  const handleCommentSubmitted = async (contentText: string) => {
    if (!token || !postId || !user) {
        alert("Você precisa estar logado para comentar.");
        return;
    }
    setIsPostingComment(true);
    try {
        // Backend uses token to get user_id, user_name, user_avatar for the comment
        const newComment = await apiService.addCommentToPost(postId, { contentText }, token);
        setComments(prevComments => [...prevComments, newComment]);
        if(post) setPost(p => p ? ({...p, comments_count: p.comments_count + 1}) : null);
    } catch (error) {
        console.error("Erro ao enviar comentário:", error);
        alert("Falha ao enviar comentário.");
    } finally {
        setIsPostingComment(false);
    }
  };


  if (isLoading) {
    return <div className="flex justify-center items-center h-[calc(100vh-10rem)]"><LoadingSpinner /></div>;
  }

  if (error) {
    return <p className="text-center text-red-500 py-10">{error}</p>;
  }

  if (!post) {
    return <p className="text-center text-text-secondary py-10">Publicação não encontrada.</p>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link to="/community" className="inline-flex items-center text-sm text-primary hover:underline mb-4">
        <FaArrowLeft className="mr-2" /> Voltar para Comunidade
      </Link>

      <PostCard post={post} currentUserId={user?.id} token={token} isDetailView={true} />

      <section className="bg-card p-4 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Comentários ({comments.length})</h2>
        {user && token && (
            <CreateCommentForm 
                onSubmit={handleCommentSubmitted} 
                isSubmitting={isPostingComment}
                placeholderText="Adicione seu comentário..."
                buttonText="Comentar"
            />
        )}
        {!user && <p className="text-sm text-text-secondary mb-3">Você precisa estar logado para comentar.</p>}

        <div className="space-y-4 mt-4">
          {comments.length > 0 ? (
            comments.map(comment => (
              <div key={comment.id} className="bg-gray-700 p-3 rounded-md shadow">
                 <div className="flex items-start space-x-3">
                    {comment.user_avatar ? (
                        <img src={resolveImageUrl(comment.user_avatar)} alt={comment.user_name} className="w-8 h-8 rounded-full object-cover"/>
                    ) : (
                        <FaCircleUser className="w-8 h-8 text-gray-500"/>
                    )}
                    <div>
                        <span className="text-sm font-semibold text-primary">{comment.user_name}</span>
                        <span className="text-xs text-text-secondary ml-2">
                        {new Date(comment.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <p className="text-sm text-text-primary mt-1 whitespace-pre-wrap">{comment.content_text}</p>
                    </div>
                 </div>
              </div>
            ))
          ) : (
            <p className="text-text-secondary text-sm">Nenhum comentário ainda.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default PostDetailPage;
      