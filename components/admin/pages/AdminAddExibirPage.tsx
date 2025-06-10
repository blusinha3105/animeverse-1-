import React, { useState } from 'react';
import { FaPlus, FaTrashAlt, FaTools, FaPaperPlane } from 'react-icons/fa';
import { apiService } from '../../../services/apiService'; // Import apiService
import { useAuth } from '../../../hooks/useAuth';

interface ExibirEpisodeField {
  id: number; 
  temporada: string;
  episodio: string;
  descricao: string;
  link: string;
  link_extra_1: string;
  link_extra_2: string;
  link_extra_3: string;
}

const AdminAddExibirPage: React.FC = () => {
  const { token } = useAuth();
  const [animeId, setAnimeId] = useState(''); // This is the ID from the main 'animes' table (catalog)
  const [animeTitleExibir, setAnimeTitleExibir] = useState(''); // Title for the 'animes_exibir' table
  const [animeIdToDelete, setAnimeIdToDelete] = useState('');
  const [episodes, setEpisodes] = useState<ExibirEpisodeField[]>([]);
  const [showUtilitario, setShowUtilitario] = useState(false);
  const [linksTextarea, setLinksTextarea] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);


  const addEpisodeField = () => {
    const newEpisode: ExibirEpisodeField = {
      id: Date.now(),
      temporada: episodes.length > 0 ? episodes[episodes.length - 1].temporada : '1',
      episodio: (episodes.length > 0 ? parseInt(episodes[episodes.length - 1].episodio, 10) + 1 : 1).toString(),
      descricao: `Episódio ${(episodes.length > 0 ? parseInt(episodes[episodes.length - 1].episodio, 10) + 1 : 1)}`,
      link: '',
      link_extra_1: '',
      link_extra_2: '',
      link_extra_3: '',
    };
    setEpisodes([...episodes, newEpisode]);
  };

  const handleEpisodeChange = (id: number, field: keyof Omit<ExibirEpisodeField, 'id'>, value: string) => {
    setEpisodes(prev => prev.map(ep => ep.id === id ? { ...ep, [field]: value } : ep));
  };

  const removeEpisodeField = (id: number) => {
    setEpisodes(prev => prev.filter(ep => ep.id !== id));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!animeId.trim() || !animeTitleExibir.trim()) {
        alert("ID do Anime (Catálogo) e Título do Anime (Exibir) são obrigatórios.");
        return;
    }
    if (!token) {
        alert("Autenticação necessária.");
        setIsSubmitting(false);
        return;
    }
    setIsSubmitting(true);
    const exibirData = {
        animeId: animeId, // This is the foreign key to animes table (catalog id)
        titulo: animeTitleExibir, // This is the title for animes_exibir table
        episodios: episodes.map(({id, temporada, episodio, ...rest}) => ({
            ...rest,
            temporada: parseInt(temporada, 10) || 1,
            episodio: parseInt(episodio, 10) || 1, // Ensure 'episodio' (ep number) is part of the payload
        }))
    };
    console.log('Submitting Exibir Data:', exibirData);
    try {
      await apiService.adminAddExibir(exibirData, token); // Pass animeId as part of data if backend expects it in body
      alert('Dados de Exibir enviados com sucesso!');
      // Reset form
      setAnimeId('');
      setAnimeTitleExibir('');
      setEpisodes([]);
    } catch (error) {
      alert(`Erro ao enviar dados de Exibir: ${(error as Error).message}`);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExibir = async () => {
    if (!animeIdToDelete) {
        alert("Por favor, insira um ID de Anime para excluir.");
        return;
    }
    if (!token) {
        alert("Autenticação necessária.");
        setIsSubmitting(false);
        return;
    }
    if (window.confirm(`Tem certeza que deseja excluir os dados de Exibir para o Anime ID: ${animeIdToDelete}?`)) {
        setIsSubmitting(true);
        try {
            await apiService.adminDeleteExibir(animeIdToDelete, token);
            alert(`Dados de Exibir para o Anime ID: ${animeIdToDelete} excluídos com sucesso.`);
            setAnimeIdToDelete('');
        } catch (error) {
            alert(`Erro ao excluir dados de Exibir: ${(error as Error).message}`);
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    }
  };

  const handleInsertLinksFromTextarea = () => {
    const linksArray = linksTextarea.split('\n').map(link => link.trim()).filter(link => link);
    if (!linksArray.length) {
        alert("Nenhum link inserido na área de texto.");
        return;
    }

    const newEpisodesWithLinks = linksArray.map((link, index) => {
      const existingEpisode = episodes[index];
      const episodeNumber = existingEpisode ? existingEpisode.episodio : (episodes.length + index + 1).toString();
      const temporada = existingEpisode ? existingEpisode.temporada : '1';
      const descricao = existingEpisode ? existingEpisode.descricao : `Episódio ${episodeNumber}`;

      return {
        id: existingEpisode ? existingEpisode.id : Date.now() + index,
        temporada: temporada,
        episodio: episodeNumber,
        descricao: descricao,
        link: link, // Assign the main link
        link_extra_1: existingEpisode ? existingEpisode.link_extra_1 : '',
        link_extra_2: existingEpisode ? existingEpisode.link_extra_2 : '',
        link_extra_3: existingEpisode ? existingEpisode.link_extra_3 : '',
      };
    });
    
    // Replace all current episodes with the new ones generated from links, or merge logic
    setEpisodes(newEpisodesWithLinks); 

    setLinksTextarea('');
    setShowUtilitario(false);
    alert(`${linksArray.length} links processados e inseridos/atualizados nos episódios.`);
  };


  const inputClass = "mt-1 block w-full bg-gray-700 text-gray-200 rounded-md shadow-sm p-2 focus:ring-primary focus:border-transparent text-sm";
  const labelClass = "block text-sm font-medium text-gray-400";
  const buttonClass = "bg-primary hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm flex items-center justify-center disabled:opacity-50";
  const secondaryButtonClass = "bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm disabled:opacity-50";
  const dangerButtonClass = "bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm disabled:opacity-50";

  return (
    <div className="p-2 md:p-4 bg-admin-bg rounded-lg shadow-xl">
      <h1 className="text-2xl font-semibold text-primary mb-6">Adicionar/Gerenciar "Exibir"</h1>
      
      <div className="bg-admin-card-bg p-4 rounded-md mb-6 space-y-3 shadow">
        <div className="flex items-end gap-3">
            <div className="flex-grow">
                <label htmlFor="animeIdToDelete" className={labelClass}>Excluir Anime Exibir (ID Catálogo):</label>
                <input type="text" id="animeIdToDelete" value={animeIdToDelete} onChange={e => setAnimeIdToDelete(e.target.value)} placeholder="ID do Anime do Catálogo" className={inputClass} />
            </div>
            <button type="button" onClick={handleDeleteExibir} className={dangerButtonClass} disabled={isSubmitting}>
                <FaTrashAlt className="mr-2" /> Excluir
            </button>
        </div>
        <div>
            <button type="button" onClick={() => setShowUtilitario(!showUtilitario)} className={`${secondaryButtonClass} w-full md:w-auto`}>
                <FaTools className="mr-2" /> Utilitário de Links em Massa
            </button>
            {showUtilitario && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setShowUtilitario(false)}>
                    <div className="bg-admin-sidebar-bg p-6 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-primary mb-3">Inserir Links em Massa</h3>
                        <textarea 
                            id="linksTextarea" 
                            value={linksTextarea}
                            onChange={e => setLinksTextarea(e.target.value)}
                            placeholder="Cole os links principais dos episódios aqui, um por linha..." 
                            rows={10}
                            className={`${inputClass} h-40 custom-scrollbar`}
                        />
                        <div className="mt-4 flex justify-end gap-3">
                             <button type="button" onClick={() => setShowUtilitario(false)} className="bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-md text-sm">Cancelar</button>
                            <button type="button" onClick={handleInsertLinksFromTextarea} className={buttonClass}>Inserir Links</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-md bg-admin-card-bg shadow">
            <legend className="text-lg font-medium text-gray-300 px-2">Informações do Anime (Exibir)</legend>
            <div>
                <label htmlFor="animeId" className={labelClass}>ID do Anime (Catálogo):</label>
                <input type="text" id="animeId" value={animeId} onChange={e => setAnimeId(e.target.value)} placeholder="ID do anime original no catálogo" className={inputClass} required/>
            </div>
            <div>
                <label htmlFor="animeTitleExibir" className={labelClass}>Título do Anime (para Exibir):</label>
                <input type="text" id="animeTitleExibir" value={animeTitleExibir} onChange={e => setAnimeTitleExibir(e.target.value)} placeholder="Título que aparecerá na página de exibição" className={inputClass} required />
            </div>
        </fieldset>

        <fieldset className="p-4 rounded-md bg-admin-card-bg shadow">
          <legend className="text-lg font-medium text-gray-300 px-2">Episódios (Exibir)</legend>
          <div id="episodesContainerExibir" className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            {episodes.map((ep, index) => (
              <div key={ep.id} className="p-3 bg-gray-750 rounded-md space-y-2 relative">
                <button type="button" onClick={() => removeEpisodeField(ep.id)} className="absolute top-2 right-2 text-red-500 hover:text-red-400 p-0.5 bg-gray-800 rounded-full z-10 leading-none flex items-center justify-center h-6 w-6" title="Remover Episódio">&times;</button>
                <h4 className="text-sm font-semibold text-gray-300">Episódio {index + 1} (Nº {ep.episodio})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><label htmlFor={`exibir-temp-${ep.id}`} className="text-xs text-gray-400">Temporada:</label><input type="number" id={`exibir-temp-${ep.id}`} value={ep.temporada} onChange={e => handleEpisodeChange(ep.id, 'temporada', e.target.value)} className={inputClass} /></div>
                    <div><label htmlFor={`exibir-epnum-${ep.id}`} className="text-xs text-gray-400">Número EP:</label><input type="number" id={`exibir-epnum-${ep.id}`} value={ep.episodio} onChange={e => handleEpisodeChange(ep.id, 'episodio', e.target.value)} className={inputClass} /></div>
                </div>
                <div><label htmlFor={`exibir-desc-${ep.id}`} className="text-xs text-gray-400">Descrição (Título EP):</label><input type="text" id={`exibir-desc-${ep.id}`} value={ep.descricao} onChange={e => handleEpisodeChange(ep.id, 'descricao', e.target.value)} className={inputClass} /></div>
                <div><label htmlFor={`exibir-link-${ep.id}`} className="text-xs text-gray-400">Link Principal:</label><input type="text" id={`exibir-link-${ep.id}`} value={ep.link} onChange={e => handleEpisodeChange(ep.id, 'link', e.target.value)} className={inputClass} required/></div>
                <div><label htmlFor={`exibir-link1-${ep.id}`} className="text-xs text-gray-400">Link Extra 1:</label><input type="text" id={`exibir-link1-${ep.id}`} value={ep.link_extra_1} onChange={e => handleEpisodeChange(ep.id, 'link_extra_1', e.target.value)} className={inputClass} /></div>
                <div><label htmlFor={`exibir-link2-${ep.id}`} className="text-xs text-gray-400">Link Extra 2:</label><input type="text" id={`exibir-link2-${ep.id}`} value={ep.link_extra_2} onChange={e => handleEpisodeChange(ep.id, 'link_extra_2', e.target.value)} className={inputClass} /></div>
                <div><label htmlFor={`exibir-link3-${ep.id}`} className="text-xs text-gray-400">Link Extra 3:</label><input type="text" id={`exibir-link3-${ep.id}`} value={ep.link_extra_3} onChange={e => handleEpisodeChange(ep.id, 'link_extra_3', e.target.value)} className={inputClass} /></div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addEpisodeField} className={`${secondaryButtonClass} mt-4`} disabled={isSubmitting}>
            <FaPlus className="mr-2"/> Adicionar Episódio
          </button>
        </fieldset>

        <div className="flex justify-end mt-6">
          <button type="submit" className={`${buttonClass} text-base px-6 py-3`} disabled={isSubmitting}>
            <FaPaperPlane className="mr-2" /> {isSubmitting ? 'Enviando...' : 'Enviar Dados de Exibir'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminAddExibirPage;