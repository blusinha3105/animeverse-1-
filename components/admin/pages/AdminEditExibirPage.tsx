import React, { useState } from 'react'; 
import { FaSearch, FaPlus, FaSave } from 'react-icons/fa';
import { apiService } from '../../../services/apiService'; 
import { useAuth } from '../../../hooks/useAuth';

interface ExibirEpisodeField {
  id: number | string; 
  temporada: string;
  episodio: string; // This is the episode number
  descricao: string; // This is the episode title/name for display
  link: string;
  link_extra_1: string;
  link_extra_2: string;
  link_extra_3: string;
}

const AdminEditExibirPage: React.FC = () => {
  const { token } = useAuth();
  const [animeIdToSearch, setAnimeIdToSearch] = useState(''); // ID from main catalog (animes table)
  const [loadedExibirAnimeId, setLoadedExibirAnimeId] = useState<string | null>(null); 
  const [animeTitleExibir, setAnimeTitleExibir] = useState('');
  const [episodes, setEpisodes] = useState<ExibirEpisodeField[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const handleSearchAnime = async () => {
    if (!animeIdToSearch) {
      alert("Por favor, insira um ID de Anime (do Catálogo) para pesquisar.");
      return;
    }
    if (!token) {
        alert("Autenticação necessária.");
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    setEpisodes([]);
    setAnimeTitleExibir('');
    setLoadedExibirAnimeId(null);

    try {
      const data = await apiService.adminGetExibirDetails(animeIdToSearch, token);
      if (data && data.anime) { 
        setLoadedExibirAnimeId(data.anime.anime_id.toString()); 
        setAnimeTitleExibir(data.anime.titulo);
        setEpisodes(data.episodios.map((ep: any, index: number) => ({
            ...ep, 
            id: ep.id || `exibir-${data.anime.anime_id}-${index}-${Date.now()}` 
        })));
      } else {
        setError("Nenhum dado de Exibir encontrado para este ID de Anime do Catálogo.");
      }
    } catch (err) {
      setError(`Falha ao buscar dados de Exibir: ${(err as Error).message}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const addEpisodeField = () => {
    const newEpisode: ExibirEpisodeField = {
      id: `new-${Date.now()}`,
      temporada: episodes.length > 0 ? episodes[episodes.length - 1].temporada : '1',
      episodio: (episodes.length > 0 ? parseInt(episodes[episodes.length - 1].episodio, 10) + 1 : 1).toString(),
      descricao: `Novo Episódio`,
      link: '',
      link_extra_1: '',
      link_extra_2: '',
      link_extra_3: '',
    };
    setEpisodes([...episodes, newEpisode]);
  };

  const handleEpisodeChange = (id: number | string, field: keyof Omit<ExibirEpisodeField, 'id'>, value: string) => {
    setEpisodes(prev => prev.map(ep => ep.id === id ? { ...ep, [field]: value } : ep));
  };

  const removeEpisodeField = (id: number | string) => {
    setEpisodes(prev => prev.filter(ep => ep.id !== id));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loadedExibirAnimeId) { 
        alert("Nenhum anime carregado para editar.");
        return;
    }
    if (!token) {
        alert("Autenticação necessária.");
        setIsSubmitting(false);
        return;
    }
    setIsSubmitting(true);
    setError(null);
    
    const episodesToSubmit = episodes.map(({ id, temporada, episodio, ...rest }) => ({
        ...rest,
        temporada: parseInt(temporada, 10) || 1,
        episodio: parseInt(episodio, 10) || 1,
    }));

    const exibirData = {
        titulo: animeTitleExibir,
        episodios: episodesToSubmit
    };

    try {
        await apiService.adminUpdateExibirDetails(loadedExibirAnimeId, exibirData, token);
        alert('Dados de Exibir atualizados com sucesso!');
    } catch (err) {
        setError(`Falha ao atualizar dados de Exibir: ${(err as Error).message}`);
        console.error(err);
    } finally {
        setIsSubmitting(false);
    }
  };

  const inputClass = "mt-1 block w-full bg-gray-700 text-gray-200 rounded-md shadow-sm p-2 focus:ring-primary focus:border-transparent text-sm";
  const labelClass = "block text-sm font-medium text-gray-400";
  const buttonClass = "bg-primary hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm flex items-center justify-center disabled:opacity-50";
  const secondaryButtonClass = "bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm disabled:opacity-50";


  return (
    <div className="p-2 md:p-4 bg-admin-bg rounded-lg shadow-xl">
      <h1 className="text-2xl font-semibold text-primary mb-6">Editar "Exibir"</h1>
      
      <div className="bg-admin-card-bg p-4 rounded-md mb-6 flex items-end gap-3 shadow">
        <div className="flex-grow">
            <label htmlFor="animeIdToSearch" className={labelClass}>ID do Anime (Catálogo) para Editar "Exibir":</label>
            <input 
                type="text" 
                id="animeIdToSearch" 
                value={animeIdToSearch} 
                onChange={(e) => setAnimeIdToSearch(e.target.value)} 
                placeholder="ID do Anime do Catálogo" 
                className={inputClass} 
            />
        </div>
        <button 
            type="button" 
            onClick={handleSearchAnime} 
            className={buttonClass}
            disabled={isLoading || isSubmitting}
        >
          <FaSearch className="mr-2" /> {isLoading ? 'Pesquisando...' : 'Pesquisar'}
        </button>
      </div>
      
      {isLoading && <p className="text-center text-gray-300">Carregando dados de Exibir...</p>}
      {error && <p className="text-center text-red-500 py-2 bg-red-900 bg-opacity-20 rounded">{error}</p>}

      {loadedExibirAnimeId && !isLoading && !error && (
        <form onSubmit={handleSubmit} className="space-y-6">
            <fieldset className="grid grid-cols-1 p-4 rounded-md bg-admin-card-bg shadow">
                <legend className="text-lg font-medium text-gray-300 px-2">Informações do Anime (Exibir)</legend>
                <div>
                    <label htmlFor="animeTitleExibir" className={labelClass}>Título do Anime (para Exibir):</label>
                    <input type="text" id="animeTitleExibir" value={animeTitleExibir} onChange={e => setAnimeTitleExibir(e.target.value)} placeholder="Título que aparecerá na página de exibição" className={inputClass} required />
                    <p className="text-xs text-gray-500 mt-1">ID do Catálogo relacionado: {loadedExibirAnimeId}</p>
                </div>
            </fieldset>

            <fieldset className="p-4 rounded-md bg-admin-card-bg shadow">
                <legend className="text-lg font-medium text-gray-300 px-2">Episódios (Exibir)</legend>
                <div id="episodesContainerEditExibir" className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                    {episodes.map((ep, index) => (
                    <div key={ep.id} className="p-3 bg-gray-750 rounded-md space-y-2 relative">
                        <button type="button" onClick={() => removeEpisodeField(ep.id)} className="absolute top-2 right-2 text-red-500 hover:text-red-400 p-0.5 bg-gray-800 rounded-full z-10 leading-none flex items-center justify-center h-6 w-6" title="Remover Episódio">&times;</button>
                        <h4 className="text-sm font-semibold text-gray-300">Episódio {index + 1} (Nº {ep.episodio})</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div><label htmlFor={`exibir-edit-temp-${ep.id}`} className="text-xs text-gray-400">Temporada:</label><input type="number" id={`exibir-edit-temp-${ep.id}`} value={ep.temporada} onChange={e => handleEpisodeChange(ep.id, 'temporada', e.target.value)} className={inputClass} /></div>
                            <div><label htmlFor={`exibir-edit-epnum-${ep.id}`} className="text-xs text-gray-400">Número EP:</label><input type="number" id={`exibir-edit-epnum-${ep.id}`} value={ep.episodio} onChange={e => handleEpisodeChange(ep.id, 'episodio', e.target.value)} className={inputClass} /></div>
                        </div>
                        <div><label htmlFor={`exibir-edit-desc-${ep.id}`} className="text-xs text-gray-400">Descrição (Título EP):</label><input type="text" id={`exibir-edit-desc-${ep.id}`} value={ep.descricao} onChange={e => handleEpisodeChange(ep.id, 'descricao', e.target.value)} className={inputClass} /></div>
                        <div><label htmlFor={`exibir-edit-link-${ep.id}`} className="text-xs text-gray-400">Link Principal:</label><input type="text" id={`exibir-edit-link-${ep.id}`} value={ep.link} onChange={e => handleEpisodeChange(ep.id, 'link', e.target.value)} className={inputClass} required/></div>
                        <div><label htmlFor={`exibir-edit-link1-${ep.id}`} className="text-xs text-gray-400">Link Extra 1:</label><input type="text" id={`exibir-edit-link1-${ep.id}`} value={ep.link_extra_1} onChange={e => handleEpisodeChange(ep.id, 'link_extra_1', e.target.value)} className={inputClass} /></div>
                        <div><label htmlFor={`exibir-edit-link2-${ep.id}`} className="text-xs text-gray-400">Link Extra 2:</label><input type="text" id={`exibir-edit-link2-${ep.id}`} value={ep.link_extra_2} onChange={e => handleEpisodeChange(ep.id, 'link_extra_2', e.target.value)} className={inputClass} /></div>
                        <div><label htmlFor={`exibir-edit-link3-${ep.id}`} className="text-xs text-gray-400">Link Extra 3:</label><input type="text" id={`exibir-edit-link3-${ep.id}`} value={ep.link_extra_3} onChange={e => handleEpisodeChange(ep.id, 'link_extra_3', e.target.value)} className={inputClass} /></div>
                    </div>
                    ))}
                </div>
                <button type="button" onClick={addEpisodeField} className={`${secondaryButtonClass} mt-4`} disabled={isSubmitting || isLoading}>
                    <FaPlus className="mr-2"/> Adicionar Episódio
                </button>
            </fieldset>

            <div className="flex justify-end mt-6">
                <button type="submit" className={`${buttonClass} text-base px-6 py-3`} disabled={isSubmitting || isLoading}>
                    <FaSave className="mr-2" /> {isSubmitting ? 'Salvando...' : 'Salvar Alterações em Exibir'}
                </button>
            </div>
        </form>
      )}
      {!loadedExibirAnimeId && !isLoading && !error && (
        <p className="text-center text-gray-400 py-6">Pesquise por um ID de Catálogo para carregar os dados de "Exibir" para edição.</p>
      )}
    </div>
  );
};

export default AdminEditExibirPage;