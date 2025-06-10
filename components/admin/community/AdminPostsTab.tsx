
import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../../services/apiService';
import { useAuth } from '../../../hooks/useAuth';
import { CommunityPost } from '../../../types';
import LoadingSpinner from '../../LoadingSpinner';
import { FaTrash, FaRedo } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const AdminPostsTab: React.FC = () => {
  const { token } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    if (!token) {
        setError("Autenticação necessária.");
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const fetchedPosts = await apiService.adminGetCommunityPosts(token); 
      setPosts(fetchedPosts.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (err) {
      setError((err as Error).message || 'Falha ao carregar publicações.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDeletePost = async (postId: string | number) => {
    if (!token || !window.confirm(`Tem certeza que deseja excluir a publicação ID: ${postId}?`)) return;
    try {
      await apiService.adminDeleteCommunityPost(postId, token);
      setPosts(prev => prev.filter(p => p.id !== postId));
      alert('Publicação excluída com sucesso.');
    } catch (err) {
      alert(`Erro ao excluir publicação: ${(err as Error).message}`);
    }
  };

  if (isLoading) return <div className="py-8"><LoadingSpinner /></div>;
  if (error) return <p className="text-red-400 text-center py-4 bg-red-900 bg-opacity-30 rounded">{error}</p>;

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button 
            onClick={fetchPosts} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-md text-sm flex items-center"
            disabled={isLoading}
            title="Recarregar Publicações"
        >
            <FaRedo className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Recarregar
        </button>
      </div>
      {posts.length === 0 ? (
        <p className="text-center text-gray-400 py-6">Nenhuma publicação encontrada.</p>
      ) : (
        <div className="overflow-x-auto admin-custom-scrollbar">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-gray-750">
              <tr>
                <th scope="col" className="px-4 py-3">ID</th>
                <th scope="col" className="px-4 py-3">Autor</th>
                <th scope="col" className="px-4 py-3">Conteúdo</th>
                <th scope="col" className="px-4 py-3">Imagem</th>
                <th scope="col" className="px-4 py-3">Sticker</th>
                <th scope="col" className="px-4 py-3">Data</th>
                <th scope="col" className="px-4 py-3">Curtidas</th>
                <th scope="col" className="px-4 py-3">Comentários</th>
                <th scope="col" className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
                <tr key={post.id} className="bg-gray-800 hover:bg-gray-750 transition-colors">
                  <td className="px-4 py-2 font-medium">{post.id}</td>
                  <td className="px-4 py-2">{post.user_name} (ID: {post.user_id})</td>
                  <td className="px-4 py-2 max-w-xs truncate" title={post.content_text}>{post.content_text}</td>
                  <td className="px-4 py-2">
                    {post.content_image_url && <Link to={post.content_image_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Ver Imagem</Link>}
                  </td>
                   <td className="px-4 py-2">
                    {post.sticker_url && <Link to={post.sticker_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Ver Sticker</Link>}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">{new Date(post.created_at).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-2">{post.likes_count}</td>
                  <td className="px-4 py-2">{post.comments_count}</td>
                  <td className="px-4 py-2">
                    <button 
                      onClick={() => handleDeletePost(post.id)} 
                      className="text-red-500 hover:text-red-400"
                      title="Excluir Publicação"
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

export default AdminPostsTab;
      