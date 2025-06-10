
import React, { useState, useEffect, useCallback } from 'react';
import { NewsArticle } from '../../../types';
import { apiService } from '../../../services/apiService';
import { useAuth } from '../../../hooks/useAuth';
import { FaPlus, FaPenToSquare, FaTrash, FaSpinner, FaImage, FaVideo, FaFloppyDisk } from 'react-icons/fa6';
import LoadingSpinner from '../../LoadingSpinner';

type FormState = Omit<NewsArticle, 'id' | 'slug' | 'published_at' | 'snippet'> & { id?: string | number };

const AdminNewsPage: React.FC = () => {
  const { token } = useAuth();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<FormState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchArticles = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const fetchedArticles = await apiService.getNewsArticles();
      setArticles(fetchedArticles.sort((a,b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()));
    } catch (err) {
      setError((err as Error).message || 'Falha ao carregar notícias.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentArticle(prev => prev ? { ...prev, [name]: value } : null);
  };
  
  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tagsArray = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setCurrentArticle(prev => prev ? { ...prev, tags: tagsArray } : null);
  };

  const openNewArticleForm = () => {
    setCurrentArticle({ title: '', content_html: '', author_name: 'Equipe AnimeVerse', cover_image_url: '', cover_video_url: '', tags: [] });
    setIsFormVisible(true);
  };

  const openEditArticleForm = (article: NewsArticle) => {
    setCurrentArticle({ ...article, tags: article.tags || [] }); // Ensure tags is an array
    setIsFormVisible(true);
  };

  const closeForm = () => {
    setIsFormVisible(false);
    setCurrentArticle(null);
    setError(null); 
  };

  const handleSubmitArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentArticle || !token) return;
    setIsSubmitting(true);
    setError(null);

    const articleDataToSubmit = {
        title: currentArticle.title,
        content_html: currentArticle.content_html,
        author_name: currentArticle.author_name,
        cover_image_url: currentArticle.cover_image_url || undefined,
        cover_video_url: currentArticle.cover_video_url || undefined,
        tags: currentArticle.tags || [],
    };

    try {
      if (currentArticle.id) {
        await apiService.adminUpdateNewsArticle(currentArticle.id, articleDataToSubmit, token);
      } else { 
        await apiService.adminCreateNewsArticle(articleDataToSubmit, token);
      }
      fetchArticles(); 
      closeForm();
    } catch (err) {
      setError((err as Error).message || 'Falha ao salvar o artigo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteArticle = async (id: string | number) => {
    if (!token || !window.confirm(`Tem certeza que deseja excluir este artigo (ID: ${id})?`)) return;
    try {
      await apiService.adminDeleteNewsArticle(id, token);
      fetchArticles();
    } catch (err) {
      alert(`Erro ao excluir artigo: ${(err as Error).message}`);
    }
  };

  const inputClass = "mt-1 block w-full bg-gray-700 text-gray-200 rounded-md shadow-sm p-2 focus:ring-primary focus:border-transparent text-sm custom-scrollbar";
  const labelClass = "block text-sm font-medium text-gray-400";
  const buttonClass = "bg-primary hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm flex items-center justify-center disabled:opacity-50";

  return (
    <div className="p-2 md:p-4 bg-admin-bg rounded-lg shadow-xl text-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-primary">Gerenciar Notícias (Blog)</h1>
        <button onClick={openNewArticleForm} className={buttonClass}>
          <FaPlus className="mr-2" /> Adicionar Novo Artigo
        </button>
      </div>

      {isLoading && <LoadingSpinner />}
      {error && !isFormVisible && <p className="text-red-400 text-center py-4 bg-red-900 bg-opacity-30 rounded">{error}</p>}

      {!isLoading && !error && !isFormVisible && (
        <div className="overflow-x-auto admin-custom-scrollbar bg-admin-card-bg rounded-lg shadow">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-gray-750">
              <tr>
                <th scope="col" className="px-4 py-3">Título</th>
                <th scope="col" className="px-4 py-3">Autor</th>
                <th scope="col" className="px-4 py-3">Publicado em</th>
                <th scope="col" className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {articles.map(article => (
                <tr key={article.id} className="bg-gray-800 hover:bg-gray-750">
                  <td className="px-4 py-2 font-medium max-w-xs truncate" title={article.title}>{article.title}</td>
                  <td className="px-4 py-2">{article.author_name}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{new Date(article.published_at).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-2 space-x-2 whitespace-nowrap">
                    <button onClick={() => openEditArticleForm(article)} className="text-blue-400 hover:text-blue-300" title="Editar"><FaPenToSquare /></button>
                    <button onClick={() => handleDeleteArticle(article.id)} className="text-red-500 hover:text-red-400" title="Excluir"><FaTrash /></button>
                  </td>
                </tr>
              ))}
              {articles.length === 0 && (
                <tr><td colSpan={4} className="text-center py-6 text-gray-500">Nenhum artigo encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isFormVisible && currentArticle && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-admin-sidebar-bg p-6 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <h2 className="text-xl font-semibold text-primary mb-4">
              {currentArticle.id ? 'Editar Artigo' : 'Novo Artigo'}
            </h2>
            <form onSubmit={handleSubmitArticle} className="space-y-4 overflow-y-auto custom-scrollbar pr-2 flex-grow">
              <div><label htmlFor="title" className={labelClass}>Título:</label><input type="text" id="title" name="title" value={currentArticle.title} onChange={handleInputChange} className={inputClass} required /></div>
              <div><label htmlFor="author_name" className={labelClass}>Nome do Autor:</label><input type="text" id="author_name" name="author_name" value={currentArticle.author_name} onChange={handleInputChange} className={inputClass} required /></div>
              <div><label htmlFor="cover_image_url" className={labelClass}><FaImage className="inline mr-1"/> URL da Imagem de Capa (Opcional):</label><input type="text" id="cover_image_url" name="cover_image_url" value={currentArticle.cover_image_url || ''} onChange={handleInputChange} className={inputClass} placeholder="https://exemplo.com/imagem.jpg"/></div>
              <div><label htmlFor="cover_video_url" className={labelClass}><FaVideo className="inline mr-1"/> URL do Vídeo de Capa (Opcional):</label><input type="text" id="cover_video_url" name="cover_video_url" value={currentArticle.cover_video_url || ''} onChange={handleInputChange} className={inputClass} placeholder="https://youtube.com/watch?v=..."/></div>
              <div><label htmlFor="content_html" className={labelClass}>Conteúdo (HTML):</label><textarea id="content_html" name="content_html" value={currentArticle.content_html} onChange={handleInputChange} rows={10} className={`${inputClass} min-h-[200px]`} placeholder="Escreva o conteúdo do artigo aqui. Use HTML para formatação." required /></div>
              <div><label htmlFor="tags" className={labelClass}>Tags (separadas por vírgula):</label><input type="text" id="tags" name="tags" value={(currentArticle.tags || []).join(', ')} onChange={handleTagsChange} className={inputClass} placeholder="Ex: Anúncio, Nova Temporada, Evento"/></div>
               {error && isFormVisible && <p className="text-sm text-red-400 bg-red-900 bg-opacity-30 p-2 rounded">{error}</p>}
            </form>
            <div className="mt-6 flex justify-end space-x-3 pt-4">
                <button type="button" onClick={closeForm} className="bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-md text-sm">Cancelar</button>
                <button type="submit" onClick={handleSubmitArticle} className={buttonClass} disabled={isSubmitting}>
                 {isSubmitting ? <FaSpinner className="animate-spin mr-2"/> : <FaFloppyDisk className="mr-2" />}
                 {isSubmitting ? 'Salvando...' : (currentArticle.id ? 'Salvar Alterações' : 'Criar Artigo')}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNewsPage;
      