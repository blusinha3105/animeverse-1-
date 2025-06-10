
import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../../services/apiService';
import { useAuth } from '../../../hooks/useAuth';
import { CommunityComment } from '../../../types';
import LoadingSpinner from '../../LoadingSpinner';
import { FaTrash, FaRedo } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const AdminCommentsTab: React.FC = () => {
  const { token } = useAuth();
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    if (!token) {
        setError("Autenticação necessária.");
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const fetchedComments = await apiService.adminGetCommunityComments(token); 
      setComments(fetchedComments.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (err) {
      setError((err as Error).message || 'Falha ao carregar comentários da comunidade.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleDeleteComment = async (commentId: string | number) => {
    if (!token || !window.confirm(`Tem certeza que deseja excluir o comentário ID: ${commentId}?`)) return;
    try {
      await apiService.adminDeleteCommunityComment(commentId, token);
      setComments(prev => prev.filter(c => c.id !== commentId));
      alert('Comentário excluído com sucesso.');
    } catch (err) {
      alert(`Erro ao excluir comentário: ${(err as Error).message}`);
    }
  };

  if (isLoading) return <div className="py-8"><LoadingSpinner /></div>;
  if (error) return <p className="text-red-400 text-center py-4 bg-red-900 bg-opacity-30 rounded">{error}</p>;

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button 
            onClick={fetchComments} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-md text-sm flex items-center"
            disabled={isLoading}
            title="Recarregar Comentários"
        >
            <FaRedo className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Recarregar
        </button>
      </div>
      {comments.length === 0 ? (
        <p className="text-center text-gray-400 py-6">Nenhum comentário encontrado.</p>
      ) : (
        <div className="overflow-x-auto admin-custom-scrollbar">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-gray-750">
              <tr>
                <th scope="col" className="px-4 py-3">ID</th>
                <th scope="col" className="px-4 py-3">Post ID</th>
                <th scope="col" className="px-4 py-3">Autor</th>
                <th scope="col" className="px-4 py-3">Conteúdo</th>
                <th scope="col" className="px-4 py-3">Data</th>
                <th scope="col" className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {comments.map(comment => (
                <tr key={comment.id} className="bg-gray-800 hover:bg-gray-750 transition-colors">
                  <td className="px-4 py-2 font-medium">{comment.id}</td>
                  <td className="px-4 py-2">
                    <Link to={`/community/post/${comment.post_id}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                        {comment.post_id}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{comment.user_name} (ID: {comment.user_id})</td>
                  <td className="px-4 py-2 max-w-sm truncate" title={comment.content_text}>{comment.content_text}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{new Date(comment.created_at).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-2">
                    <button 
                      onClick={() => handleDeleteComment(comment.id)} 
                      className="text-red-500 hover:text-red-400"
                      title="Excluir Comentário"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminCommentsTab;
      