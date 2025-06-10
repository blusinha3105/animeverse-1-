import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../../services/apiService';
import { useAuth } from '../../../hooks/useAuth';
import { Comment as CommentType } from '../../../types';
import LoadingSpinner from '../../LoadingSpinner';
import { FaTrash, FaSearch, FaFilter, FaRedo } from 'react-icons/fa';

const AdminCommentsPage: React.FC = () => {
  const { token } = useAuth();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ animeId: '', userId: '', content: '' });
  const [searchTerm, setSearchTerm] = useState(''); // General search term

  const fetchAdminComments = useCallback(async () => {
    if (!token) {
        setError("Autenticação necessária.");
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const fetchedData = await apiService.adminGetComments(token);
      if (Array.isArray(fetchedData)) {
        setComments(fetchedData);
      } else {
        console.warn("Fetched admin comments is not an array:", fetchedData);
        setComments([]); 
        if (typeof fetchedData === 'object' && fetchedData !== null && 'message' in fetchedData && typeof (fetchedData as any).message === 'string') {
            setError((fetchedData as {message: string}).message || "Formato de dados inesperado para comentários.");
        } else if (fetchedData && typeof fetchedData !== 'object' ) {
            setError("Formato de dados inesperado para comentários.");
        } else {
            setError("Não foi possível carregar os comentários ou a resposta não é uma lista válida.");
        }
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to load comments.');
      console.error(err);
      setComments([]); 
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAdminComments();
  }, [fetchAdminComments]);

  const handleDeleteComment = async (commentId: number) => {
    if (!token) {
        alert("Autenticação necessária.");
        return;
    }
    if (window.confirm(`Tem certeza que deseja excluir o comentário ID: ${commentId}?`)) {
      try {
        await apiService.adminDeleteComment(commentId, token);
        setComments(prev => prev.filter(c => c.id !== commentId));
        alert('Comentário excluído com sucesso.');
      } catch (err) {
        alert(`Erro ao excluir comentário: ${(err as Error).message}`);
      }
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const filteredComments = comments.filter(comment => {
    const generalMatch = searchTerm ? 
        comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comment.user_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comment.anime_id.toString().includes(searchTerm) ||
        comment.episode_number.toString().includes(searchTerm)
        : true;
    
    const specificMatch = 
        (filters.animeId ? comment.anime_id.toString() === filters.animeId : true) &&
        (filters.userId ? comment.user_id.toString() === filters.userId : true) &&
        (filters.content ? comment.content.toLowerCase().includes(filters.content.toLowerCase()) : true);

    return generalMatch && specificMatch;
  });

  const inputClass = "bg-gray-700 text-gray-200 text-sm rounded-lg focus:ring-primary focus:border-transparent block w-full p-2";

  return (
    <div className="p-2 md:p-4 bg-admin-bg rounded-lg shadow-xl text-gray-200">
      <h1 className="text-2xl font-semibold text-primary mb-6">Gerenciar Comentários</h1>

      <div className="mb-6 p-4 bg-admin-card-bg rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
                <label htmlFor="searchTerm" className="block text-xs font-medium text-gray-400 mb-1">Pesquisa Geral</label>
                <input 
                    type="text" 
                    id="searchTerm"
                    name="searchTerm"
                    placeholder="ID Anime/Ep, Usuário, Conteúdo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={inputClass}
                />
            </div>
            <div>
                <label htmlFor="filterAnimeId" className="block text-xs font-medium text-gray-400 mb-1">Filtrar por ID do Anime</label>
                <input type="text" name="animeId" id="filterAnimeId" value={filters.animeId} onChange={handleFilterChange} placeholder="ID do Anime" className={inputClass}/>
            </div>
            <div>
                <label htmlFor="filterUserId" className="block text-xs font-medium text-gray-400 mb-1">Filtrar por ID do Usuário</label>
                <input type="text" name="userId" id="filterUserId" value={filters.userId} onChange={handleFilterChange} placeholder="ID do Usuário" className={inputClass}/>
            </div>
             <button 
                onClick={fetchAdminComments} 
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-sm flex items-center justify-center h-10"
                disabled={isLoading}
                title="Recarregar Comentários"
            >
                <FaRedo className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Recarregar
            </button>
        </div>
      </div>

      {isLoading && <div className="py-10"><LoadingSpinner /></div>}
      {error && <p className="text-red-400 text-center py-4 bg-red-900 bg-opacity-30 rounded">{error}</p>}
      
      {!isLoading && !error && (
        <div className="overflow-x-auto admin-custom-scrollbar bg-admin-card-bg rounded-lg shadow">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-gray-750">
              <tr>
                <th scope="col" className="px-4 py-3">ID</th>
                <th scope="col" className="px-4 py-3">Anime ID</th>
                <th scope="col" className="px-4 py-3">Ep. Nº</th>
                <th scope="col" className="px-4 py-3">Usuário</th>
                <th scope="col" className="px-4 py-3">Comentário</th>
                <th scope="col" className="px-4 py-3">Data</th>
                <th scope="col" className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredComments.length > 0 ? filteredComments.map(comment => (
                <tr key={comment.id} className="bg-gray-800 hover:bg-gray-750 transition-colors">
                  <td className="px-4 py-2 font-medium">{comment.id}</td>
                  <td className="px-4 py-2">{comment.anime_id}</td>
                  <td className="px-4 py-2">{comment.episode_number}</td>
                  <td className="px-4 py-2">{comment.user_nome} (ID: {comment.user_id})</td>
                  <td className="px-4 py-2 max-w-sm truncate" title={comment.content}>{comment.content}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{new Date(comment.created_at).toLocaleString('pt-BR')}</td>
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
              )) : (
                <tr>
                    <td colSpan={7} className="text-center py-6 text-gray-500">Nenhum comentário encontrado com os filtros atuais.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminCommentsPage;