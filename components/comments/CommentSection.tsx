
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom'; 
import { apiService } from '../../services/apiService';
import { useAuth } from '../../hooks/useAuth';
import { Comment as CommentType } from '../../types';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import LoadingSpinner from '../LoadingSpinner';

interface CommentSectionProps {
  animeId: string;
  episodeNumber: number;
}

const CommentSection: React.FC<CommentSectionProps> = ({ animeId, episodeNumber }) => {
  const { user, token } = useAuth();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedData = await apiService.getComments(animeId, episodeNumber.toString());
      if (Array.isArray(fetchedData)) {
        setComments(fetchedData);
      } else {
        console.warn("Os comentários recebidos para o episódio não são uma lista:", fetchedData);
        setComments([]);
        if (typeof fetchedData === 'object' && fetchedData !== null && 'message' in fetchedData && typeof (fetchedData as any).message === 'string') {
            setError((fetchedData as {message: string}).message || "Formato de dados inesperado para comentários do episódio.");
        } else if (fetchedData && typeof fetchedData !== 'object') {
            setError("Formato de dados inesperado para comentários do episódio.");
        } else {
             setError("Não foi possível carregar os comentários ou a resposta não é uma lista válida.");
        }
      }
    } catch (err) {
      setError((err as Error).message || 'Falha ao carregar comentários.');
      console.error(err);
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  }, [animeId, episodeNumber]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handlePostComment = async (content: string, parentId: number | null = null) => {
    if (!token) {
      alert("Você precisa estar logado para comentar.");
      return;
    }
    setIsPosting(true);
    try {
      // Backend will use token to derive user_id, user_nome, user_imagem_perfil
      await apiService.postComment(animeId, episodeNumber.toString(), content, parentId, token);
      fetchComments(); // Refetch comments to include the new one
    } catch (err) {
      alert(`Erro ao postar comentário: ${(err as Error).message}`);
      console.error(err);
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!token) return;
    if (window.confirm("Tem certeza que deseja excluir este comentário?")) {
        try {
            await apiService.deleteUserComment(commentId, token);
            fetchComments(); 
        } catch (err) {
            alert(`Erro ao excluir comentário: ${(err as Error).message}`);
        }
    }
  };
  
  const handleUpdateComment = async (commentId: number, newContent: string) => {
    if (!token) return;
     try {
        await apiService.updateUserComment(commentId, newContent, token);
        fetchComments(); 
    } catch (err) {
        alert(`Erro ao atualizar comentário: ${(err as Error).message}`);
    }
  };


  return (
    <section className="bg-card shadow-xl rounded-lg p-4 md:p-6 mt-8">
      <h2 className="text-xl font-semibold text-text-primary mb-4">Comentários ({comments.length})</h2>
      
      {user && <CommentForm onSubmit={handlePostComment} isSubmitting={isPosting} />}
      {!user && <p className="text-text-secondary text-sm mb-4">Você precisa estar <Link to="/login" className="text-primary hover:underline">logado</Link> para comentar.</p>}

      {isLoading && <LoadingSpinner />}
      {error && <p className="text-red-500 text-center py-4">{error}</p>}
      
      {!isLoading && !error && comments.length === 0 && (
        <p className="text-text-secondary text-center py-4">Nenhum comentário ainda. Seja o primeiro!</p>
      )}

      {!isLoading && !error && comments.length > 0 && (
        <div className="space-y-4 mt-4">
          {comments.filter(c => !c.parent_comment_id).map(comment => ( 
            <CommentItem 
                key={comment.id} 
                comment={comment} 
                allComments={comments} 
                onReply={handlePostComment} 
                onDelete={handleDeleteComment}
                onUpdate={handleUpdateComment}
                currentUserId={user?.id}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default CommentSection;
      