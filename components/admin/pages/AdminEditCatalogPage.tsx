import React, { useState, useEffect, useCallback } from 'react';
import { FaSearch, FaTrash, FaEdit, FaImages, FaPlus, FaSave, FaSync, FaListOl, FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import { apiService } from '../../../services/apiService'; 
import { Anime, Episode, AnimeExibirResponse } from '../../../types'; 
import { useAuth } from '../../../hooks/useAuth';

interface EpisodeField {
  id: string | number; 
  temporada: string;
  numero: string;
  nome: string;
  link: string;
  capa_ep: string;
  alertanovoep?: string; // Add this field, keeping it string for form
}

interface CatalogFormData {
  id: string; 
  capa: string;
  titulo: string;
  tituloAlternativo?: string;
  selo?: string;
  sinopse: string;
  classificacao?: string;
  status?: string;
  qntd_temporadas: string;   
  anoLancamento: string;    
  dataPostagem: string;     
  ovas?: string;
  filmes?: string;
  estudio?: string;
  diretor?: string;
  tipoMidia?: string;
  visualizacoes?: number; 
  genero: string[]; 
  episodios: EpisodeField[];
}


const genreOptions = [
  "Ação", "Aventura", "Comédia", "Drama", "Fantasia", "Sci-Fi", "Slice of Life", 
  "Sobrenatural", "Esportes", "Romance", "Mistério", "Suspense", "Terror", 
  "Psicológico", "Magia", "Mecha", "Militar", "Histórico", "Escolar", "Seinen",
  "Shoujo", "Shounen", "Josei", "Ecchi", "Harem", "Isekai" 
].sort();

const AdminEditCatalogPage: React.FC = () => {
  const { token } = useAuth();
  const [searchId, setSearchId] = useState('');
  const [loadedAnimeId, setLoadedAnimeId] = useState<string | null>(null); 
  const [formData, setFormData] = useState<Partial<CatalogFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showCapaTextarea, setShowCapaTextarea] = useState(false);
  const [capasTextarea, setCapasTextarea] = useState('');
  const [searchGenreTerm, setSearchGenreTerm] = useState('');
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [capaStatus, setCapaStatus] = useState<'valid' | 'invalid' | 'unchecked' | 'checking'>('unchecked');
  const [isSyncing, setIsSyncing] = useState(false);


  const checkCapaUrl = (url: string) => {
    if (!url) {
      setCapaStatus('unchecked');
      return;
    }
    setCapaStatus('checking');
    const img = new Image();
    img.onload = () => setCapaStatus('valid');
    img.onerror = () => setCapaStatus('invalid');
    img.src = url;
  };


  const mapApiToFormData = (apiData: Anime): Partial<CatalogFormData> => {
    const mappedData: Partial<CatalogFormData> = {
    ...apiData, 
    id: apiData.id.toString(), 
    qntd_temporadas: apiData.qntd_temporadas?.toString() || '', 
    anoLancamento: apiData.anoLancamento?.toString() || '',   
    dataPostagem: apiData.dataPostagem ? apiData.dataPostagem.split('T')[0] : new Date().toISOString().split('T')[0], 
    genero: apiData.generos || [], 
    episodios: apiData.episodios.map((ep: Episode) => ({
        id: ep.id?.toString() || `temp-${Date.now()}-${Math.random()}`, 
        temporada: ep.temporada.toString(), 
        numero: ep.numero.toString(), 
        nome: ep.nome || '', 
        link: ep.link || '', 
        capa_ep: ep.capa_ep || '', 
        alertanovoep: ep.alertanovoep ? '1' : '0', // Convert boolean/number to string '0' or '1'
    })),
   };
    if (apiData.capa) {
        checkCapaUrl(apiData.capa);
    } else {
        setCapaStatus('unchecked');
    }
    return mappedData;
  };

  const fetchAnimeData = useCallback(async (id: string) => {
    if (!id || !token) {
        setFormData({});
        setLoadedAnimeId(null);
        setIsFormDirty(false);
        setCapaStatus('unchecked');
        if(!token) setError("Autenticação necessária.");
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.adminGetCatalogById(id, token); 
      if (data) {
        setFormData(mapApiToFormData(data));
        setLoadedAnimeId(data.id.toString());
        setIsFormDirty(false); 
      } else {
        setError('Anime não encontrado.');
        setFormData({});
        setLoadedAnimeId(null);
        setCapaStatus('unchecked');
      }
    } catch (err) {
      setError((err as Error).message || 'Falha ao buscar dados do anime.');
      setFormData({});
      setLoadedAnimeId(null);
      setCapaStatus('unchecked');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isFormDirty) {
        e.preventDefault();
        e.returnValue = ''; 
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isFormDirty]);


  const handleSearch = () => {
    if (isFormDirty && !window.confirm("Você tem alterações não salvas. Deseja descartá-las e pesquisar um novo anime?")) {
        return;
    }
    if (searchId) {
      fetchAnimeData(searchId);
    } else {
      alert('Por favor, insira um ID para pesquisar.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsFormDirty(true);
    if (name === 'capa') {
        checkCapaUrl(value);
    }
  };
  
  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({ ...prev, genero: selectedOptions }));
    setIsFormDirty(true);
  };

  const handleEpisodeChange = (id: string | number, field: keyof Omit<EpisodeField, 'id'>, value: string) => {
    setFormData(prev => ({
        ...prev,
        episodios: prev.episodios?.map(ep => ep.id === id ? { ...ep, [field]: value } : ep)
    }));
    setIsFormDirty(true);
  };

  const addEpisodeField = () => {
    const episodes = formData.episodios || [];
    const lastEpisode = episodes[episodes.length - 1];
    const nextEpisodeNumber = lastEpisode ? (parseInt(lastEpisode.numero, 10) || 0) + 1 : 1;
    const currentSeason = lastEpisode ? lastEpisode.temporada : '1';

    const newEpisode: EpisodeField = { 
      id: `new-${Date.now()}`, 
      temporada: currentSeason, 
      numero: nextEpisodeNumber.toString(), 
      nome: `Episódio ${nextEpisodeNumber}`, 
      link: '', 
      capa_ep: '',
      alertanovoep: '0',
    };
    setFormData(prev => ({ ...prev, episodios: [...(prev.episodios || []), newEpisode]}));
    setIsFormDirty(true);
  };

  const removeEpisodeField = (id: string | number) => {
    setFormData(prev => ({ ...prev, episodios: prev.episodios?.filter(ep => ep.id !== id)}));
    setIsFormDirty(true);
  };

  const handleSave = async () => {
    if (!loadedAnimeId || !formData.id) {
        alert("Nenhum anime carregado para salvar.");
        return;
    }
    if (!token) {
        alert("Autenticação necessária.");
        setIsSubmitting(false);
        return;
    }
     if (capaStatus === 'invalid' && formData.capa && formData.capa.trim() !== '') {
        if (!window.confirm("A URL da capa principal parece inválida. Deseja continuar mesmo assim?")) {
            return;
        }
    }
    setIsSubmitting(true);
    const originalIdToUpdate = loadedAnimeId; 
    
    const currentFormData = formData as CatalogFormData;

    const {
        id: formIdStr, 
        qntd_temporadas: formQntdTemporadasStr, 
        anoLancamento: formAnoLancamentoStr, 
        episodios: formEpisodes, 
        genero: formGeneroArr, 
        visualizacoes: formVisualizacoes, 
        capa, titulo, tituloAlternativo, selo, sinopse, classificacao, status, dataPostagem, ovas, filmes, estudio, diretor, tipoMidia
    } = currentFormData;

    const dataToSubmitForApi: any = {
        capa, titulo, tituloAlternativo, selo, sinopse, classificacao, status, dataPostagem, ovas, filmes, estudio, diretor, tipoMidia,
        visualizacoes: formVisualizacoes, 
        id: parseInt(formIdStr, 10), 
        qntd_temporadas: formQntdTemporadasStr ? (parseInt(formQntdTemporadasStr, 10) || undefined) : undefined,
        anoLancamento: formAnoLancamentoStr ? (parseInt(formAnoLancamentoStr, 10) || undefined) : undefined,
        
        episodios: formEpisodes.map(({ id: epId, temporada, numero, alertanovoep, ...restEp }) => ({
            ...restEp, 
            id: typeof epId === 'string' && epId.startsWith('new-') ? undefined : Number(epId),
            temporada: parseInt(temporada, 10) || 1,
            numero: parseInt(numero, 10) || 1,
            alertanovoep: alertanovoep === '1' ? 1 : 0, // Convert string '0'/'1' to number 0/1
        })),
        generos: formGeneroArr || [], 
    };
    
    console.log('Saving Anime Data:', dataToSubmitForApi);
    try {
      await apiService.adminUpdateCatalog(originalIdToUpdate, dataToSubmitForApi, token);
      alert('Alterações salvas com sucesso!');
      setIsFormDirty(false);
      if (formIdStr && originalIdToUpdate !== formIdStr) {
        setSearchId(formIdStr); 
        fetchAnimeData(formIdStr); 
      } else {
        fetchAnimeData(originalIdToUpdate); 
      }
    } catch (error) {
      alert(`Erro ao salvar alterações: ${(error as Error).message}`);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteAnime = async () => {
    if(loadedAnimeId) {
        if (!token) {
            alert("Autenticação necessária.");
            setIsSubmitting(false);
            return;
        }
        if(window.confirm(`Tem certeza que deseja excluir o anime ID ${loadedAnimeId}: ${formData.titulo}?`)){
            setIsSubmitting(true);
            try {
                await apiService.adminDeleteCatalogById(loadedAnimeId, token);
                alert(`Anime ${loadedAnimeId} excluído com sucesso.`);
                setFormData({});
                setLoadedAnimeId(null);
                setSearchId('');
                setIsFormDirty(false);
                setCapaStatus('unchecked');
            } catch (error) {
                alert(`Erro ao excluir anime: ${(error as Error).message}`);
                console.error(error);
            } finally {
                setIsSubmitting(false);
            }
        }
    } else {
        alert("Nenhum anime carregado para excluir.");
    }
  };

  const handleInsertCapas = () => {
    const links = capasTextarea.split('\n').filter(link => link.trim() !== '');
    const currentEpisodes = formData.episodios || [];
    if (!currentEpisodes.length || !links.length) {
        alert("Carregue um anime com episódios e insira links de capa.");
        return;
    }
    setFormData(prev => ({
        ...prev,
        episodios: currentEpisodes.map((ep, index) => ({
            ...ep,
            capa_ep: links[index] || ep.capa_ep 
        }))
    }));
    setCapasTextarea('');
    setShowCapaTextarea(false);
    setIsFormDirty(true);
    alert(`${Math.min(links.length, currentEpisodes.length)} capas de episódio atualizadas.`);
  };

  const handleGenerateSequence = () => {
    if (!formData.id) {
        alert("Carregue um anime primeiro.");
        return;
    }
    const currentEpisodes = formData.episodios || [];
    const animeCatalogId = formData.id; // ID do catálogo (string)

    let nextEpisodeNumber: number;
    let currentSeason: string;

    if (currentEpisodes.length > 0) {
        const lastEpisode = currentEpisodes[currentEpisodes.length - 1];
        nextEpisodeNumber = (parseInt(lastEpisode.numero, 10) || 0) + 1;
        currentSeason = lastEpisode.temporada || '1';
    } else {
        // Find the first episode in the form to get its season, or default to 1
        const firstEpInForm = document.querySelector('#episodes_edit .episode input[name="temporada_edit"]') as HTMLInputElement;
        currentSeason = firstEpInForm ? firstEpInForm.value : '1';
        nextEpisodeNumber = 1;
    }
    
    const newEpisode: EpisodeField = {
      id: `new-${Date.now()}`,
      temporada: currentSeason,
      numero: nextEpisodeNumber.toString(),
      nome: `Episódio ${nextEpisodeNumber}`,
      link: `https://incriveiscuriosidades.online/animes/animes.html?animeId=${animeCatalogId}&temporada=${currentSeason}&episodio=${nextEpisodeNumber}`,
      capa_ep: `https://incriveiscuriosidades.online/animes/img-capa/${animeCatalogId}-episodio-${nextEpisodeNumber}.png`,
      alertanovoep: '0',
    };

    setFormData(prev => ({ ...prev, episodios: [...(prev.episodios || []), newEpisode] }));
    setIsFormDirty(true);
    alert(`Episódio ${nextEpisodeNumber} (Temporada ${currentSeason}) adicionado à sequência.`);
  };

  const handleSyncEpisodesFromExibir = async () => {
    if (!loadedAnimeId || !token) {
        alert("Carregue um anime e certifique-se de estar autenticado.");
        return;
    }
    setIsSyncing(true);
    try {
        const exibirData: AnimeExibirResponse = await apiService.adminGetExibirDetails(loadedAnimeId, token);
        if (exibirData && exibirData.episodios) {
            const syncedEpisodes: EpisodeField[] = exibirData.episodios.map((exEp, index) => ({
                id: `sync-${loadedAnimeId}-${index}-${Date.now()}`, // Temporary ID for new/synced items
                temporada: exEp.temporada.toString(),
                numero: exEp.episodio.toString(), // 'episodio' from exibir is the number
                nome: exEp.descricao || `Episódio ${exEp.episodio}`, // 'descricao' from exibir is the title
                link: `https://incriveiscuriosidades.online/animes/animes.html?animeId=${loadedAnimeId}&temporada=${exEp.temporada}&episodio=${exEp.episodio}`,
                capa_ep: formData.capa || '', // Use main anime cover as default, or exEp.capa_ep if available
                alertanovoep: '0',
            }));
            setFormData(prev => ({ ...prev, episodios: syncedEpisodes }));
            setIsFormDirty(true);
            alert("Episódios sincronizados da configuração 'Exibir'. Verifique e salve as alterações.");
        } else {
            alert("Nenhum dado de 'Exibir' encontrado para este anime.");
        }
    } catch (err) {
        alert(`Erro ao sincronizar episódios: ${(err as Error).message}`);
        console.error(err);
    } finally {
        setIsSyncing(false);
    }
  };


  const filteredGenreOptions = genreOptions.filter(genre => 
    genre.toLowerCase().includes(searchGenreTerm.toLowerCase())
  );

  const inputClass = "mt-1 block w-full bg-gray-700 text-gray-200 rounded-md shadow-sm p-2 focus:ring-primary focus:border-transparent text-sm";
  const labelClass = "block text-sm font-medium text-gray-400";
  const buttonClass = "bg-primary hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm flex items-center justify-center disabled:opacity-50";
  const secondaryButtonClass = "bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm flex items-center justify-center disabled:opacity-50";

  return (
    <div className="p-2 md:p-4 bg-admin-bg rounded-lg shadow-xl">
      <h1 className="text-2xl font-semibold text-primary mb-6">Editar Catálogo</h1>

      <div className="bg-gray-750 p-4 rounded-md mb-6 space-y-4 md:space-y-0 md:flex md:flex-wrap md:items-end md:gap-4">
        <div className="flex-grow">
          <label htmlFor="searchId" className={labelClass}>ID do Anime para Editar:</label>
          <input type="text" id="searchId" value={searchId} onChange={(e) => setSearchId(e.target.value)} placeholder="Digite o ID do anime" className={inputClass} />
        </div>
        <button onClick={handleSearch} className={`${buttonClass} w-full md:w-auto`} disabled={isLoading || isSubmitting}>
          <FaSearch className="mr-2" /> {isLoading ? 'Pesquisando...' : 'Pesquisar'}
        </button>
         {loadedAnimeId && (
            <button onClick={handleDeleteAnime} className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm flex items-center justify-center w-full md:w-auto" disabled={isLoading || isSubmitting}>
                <FaTrash className="mr-2" /> Excluir Anime
            </button>
        )}
      </div>

      {isLoading && <p className="text-center text-gray-300">Carregando dados do anime...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {loadedAnimeId && !isLoading && !error && formData.id && (
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4 rounded-md bg-admin-card-bg shadow">
            <legend className="text-lg font-medium text-gray-300 px-2">Informações do Anime</legend>
            
            <div>
                <label htmlFor="id_edit" className={labelClass}>ID (Editável):</label>
                <input type="text" id="id_edit" name="id" value={formData.id || ''} onChange={handleChange} className={inputClass} />
            </div>
            <div>
                <label htmlFor="capa_edit" className={labelClass}><FaImages className="inline mr-1"/> Capa:
                    {capaStatus === 'checking' && <FaSpinner className="ml-2 animate-spin text-yellow-500" title="Verificando URL..." />}
                    {capaStatus === 'valid' && <FaCheckCircle className="ml-2 text-green-500" title="URL da capa válida" />}
                    {capaStatus === 'invalid' && <FaTimesCircle className="ml-2 text-red-500" title="URL da capa inválida ou imagem não encontrada" />}
                </label>
                <input type="text" id="capa_edit" name="capa" value={formData.capa || ''} onChange={handleChange} className={inputClass} />
            </div>
            <div>
                <label htmlFor="titulo_edit" className={labelClass}>Título:</label>
                <input type="text" id="titulo_edit" name="titulo" value={formData.titulo || ''} onChange={handleChange} className={inputClass} required />
            </div>
            <div><label htmlFor="tituloAlternativo_edit" className={labelClass}>Título Alternativo:</label><input type="text" name="tituloAlternativo" value={formData.tituloAlternativo || ''} onChange={handleChange} className={inputClass}/></div>
            <div><label htmlFor="selo_edit" className={labelClass}>Selo:</label><select name="selo" value={formData.selo || 'Legendado'} onChange={handleChange} className={inputClass}><option value="Legendado">Legendado</option><option value="Dublado">Dublado</option></select></div>
            <div className="md:col-span-2"><label htmlFor="sinopse_edit" className={labelClass}>Sinopse:</label><textarea name="sinopse" value={formData.sinopse || ''} onChange={handleChange} rows={3} className={`${inputClass} custom-scrollbar`}></textarea></div>
            <div><label htmlFor="classificacao_edit" className={labelClass}>Classificação:</label><input type="text" name="classificacao" value={formData.classificacao || ''} onChange={handleChange} className={inputClass}/></div>
            <div><label htmlFor="status_edit" className={labelClass}>Status:</label><select name="status" value={formData.status || 'Andamento'} onChange={handleChange} className={inputClass}><option value="Andamento">Lançamento</option><option value="Completo">Completo</option><option value="Incompleto">Incompleto</option><option value="Aguardando Lançamento">Aguardando Lançamento</option></select></div>
            <div><label htmlFor="qntd_temporadas_edit" className={labelClass}>Temporadas (Número):</label><input type="number" name="qntd_temporadas" value={formData.qntd_temporadas || ''} onChange={handleChange} className={inputClass}/></div>
            <div><label htmlFor="anoLancamento_edit" className={labelClass}>Ano Lançamento (Número):</label><input type="number" name="anoLancamento" value={formData.anoLancamento || ''} onChange={handleChange} className={inputClass}/></div>
            <div><label htmlFor="dataPostagem_edit" className={labelClass}>Data Postagem:</label><input type="date" name="dataPostagem" value={formData.dataPostagem || ''} onChange={handleChange} className={inputClass}/></div>
            <div><label htmlFor="ovas_edit" className={labelClass}>OVAs:</label><input type="text" name="ovas" value={formData.ovas || ''} onChange={handleChange} className={inputClass}/></div>
            <div><label htmlFor="filmes_edit" className={labelClass}>Filmes:</label><input type="text" name="filmes" value={formData.filmes || ''} onChange={handleChange} className={inputClass}/></div>
            <div><label htmlFor="estudio_edit" className={labelClass}>Estúdio:</label><input type="text" name="estudio" value={formData.estudio || ''} onChange={handleChange} className={inputClass}/></div>
            <div><label htmlFor="diretor_edit" className={labelClass}>Diretor:</label><input type="text" name="diretor" value={formData.diretor || ''} onChange={handleChange} className={inputClass}/></div>
            <div><label htmlFor="tipoMidia_edit" className={labelClass}>Tipo Mídia:</label><select name="tipoMidia" value={formData.tipoMidia || 'Anime'} onChange={handleChange} className={inputClass}><option value="Anime">Anime</option><option value="Filme">Filme</option><option value="Ova">Ova</option><option value="Especial">Especial</option><option value="Series">Series</option></select></div>
            
            <div className="form-group md:col-span-2">
              <label htmlFor="genero_edit" className={labelClass}>Gêneros:</label>
              <input type="text" id="searchGenre_edit" placeholder="Pesquisar gênero..." value={searchGenreTerm} onChange={(e) => setSearchGenreTerm(e.target.value)} className={`mb-2 ${inputClass}`} />
              <select id="genero_edit" name="genero" multiple value={formData.genero || []} onChange={handleGenreChange} className={`${inputClass} h-32 custom-scrollbar`}>
                {filteredGenreOptions.map(genre => ( <option key={genre} value={genre} className="p-1 hover:bg-primary">{genre}</option>))}
              </select>
              <div className="mt-2 text-xs text-gray-400">Selecionados: {(formData.genero || []).join(', ') || 'Nenhum'}</div>
            </div>
          </fieldset>

          <fieldset className="p-4 rounded-md bg-admin-card-bg shadow">
            <legend className="text-lg font-medium text-gray-300 px-2">Episódios</legend>
            <div className="mb-4 flex flex-wrap gap-2">
                 <button type="button" onClick={() => setShowCapaTextarea(!showCapaTextarea)} className={`${secondaryButtonClass} text-xs`}>
                    <FaImages className="mr-1" /> {showCapaTextarea ? 'Esconder Capas' : 'Inserir Capas em Massa'}
                </button>
                 <button type="button" onClick={handleGenerateSequence} className={`${secondaryButtonClass} text-xs`} disabled={isSubmitting || isLoading}>
                    <FaListOl className="mr-1" /> Gerar Sequência
                </button>
                <button type="button" onClick={handleSyncEpisodesFromExibir} className={`${secondaryButtonClass} text-xs`} disabled={isSubmitting || isLoading || isSyncing}>
                    <FaSync className={`mr-1 ${isSyncing ? 'animate-spin' : ''}`} /> {isSyncing ? 'Sincronizando...' : "Sincronizar de 'Exibir'"}
                </button>
            </div>
            {showCapaTextarea && (
                <div className="mb-4 p-3 bg-gray-700 rounded-md">
                    <label htmlFor="capas_textarea" className={`${labelClass} mb-1`}>Links das Capas (um por linha, na ordem dos episódios):</label>
                    <textarea id="capas_textarea" value={capasTextarea} onChange={(e) => setCapasTextarea(e.target.value)} rows={5} className={`${inputClass} custom-scrollbar`}></textarea>
                    <button type="button" onClick={handleInsertCapas} className={`${buttonClass} mt-2 text-xs`}><FaPlus className="mr-1"/> Aplicar Capas</button>
                </div>
            )}
            <div id="episodes_edit_container" className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar pr-2">
              {(formData.episodios || []).map((ep, index) => (
                <div key={ep.id} className="p-3 bg-gray-750 rounded-md grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
                  <button type="button" onClick={() => removeEpisodeField(ep.id)} className="absolute top-2 right-2 text-red-500 hover:text-red-400 text-xl p-0.5 bg-gray-800 rounded-full leading-none flex items-center justify-center h-6 w-6 z-10" title="Remover Episódio">&times;</button>
                  <h4 className="sm:col-span-2 text-sm font-semibold text-gray-300 mb-1">Episódio {index + 1} (Num. {ep.numero})</h4>
                  
                  <div>
                    <label htmlFor={`ep-edit-${ep.id}-temporada`} className="block text-xs font-medium text-gray-400 capitalize">Temporada:</label>
                    <input type='number' id={`ep-edit-${ep.id}-temporada`} name='temporada' value={ep.temporada} onChange={(e) => handleEpisodeChange(ep.id, 'temporada', e.target.value)} className="mt-0.5 block w-full bg-gray-700 text-gray-200 rounded-md shadow-sm p-1.5 text-sm focus:ring-primary focus:border-transparent" />
                  </div>
                  <div>
                    <label htmlFor={`ep-edit-${ep.id}-numero`} className="block text-xs font-medium text-gray-400 capitalize">Número:</label>
                    <input type='number' id={`ep-edit-${ep.id}-numero`} name='numero' value={ep.numero} onChange={(e) => handleEpisodeChange(ep.id, 'numero', e.target.value)} className="mt-0.5 block w-full bg-gray-700 text-gray-200 rounded-md shadow-sm p-1.5 text-sm focus:ring-primary focus:border-transparent" />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor={`ep-edit-${ep.id}-nome`} className="block text-xs font-medium text-gray-400 capitalize">Nome:</label>
                    <input type='text' id={`ep-edit-${ep.id}-nome`} name='nome' value={ep.nome} onChange={(e) => handleEpisodeChange(ep.id, 'nome', e.target.value)} className="mt-0.5 block w-full bg-gray-700 text-gray-200 rounded-md shadow-sm p-1.5 text-sm focus:ring-primary focus:border-transparent" />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor={`ep-edit-${ep.id}-link`} className="block text-xs font-medium text-gray-400 capitalize">Link:</label>
                    <input type='text' id={`ep-edit-${ep.id}-link`} name='link' value={ep.link} onChange={(e) => handleEpisodeChange(ep.id, 'link', e.target.value)} className="mt-0.5 block w-full bg-gray-700 text-gray-200 rounded-md shadow-sm p-1.5 text-sm focus:ring-primary focus:border-transparent" />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor={`ep-edit-${ep.id}-capa_ep`} className="block text-xs font-medium text-gray-400 capitalize">Capa Episódio:</label>
                    <input type='text' id={`ep-edit-${ep.id}-capa_ep`} name='capa_ep' value={ep.capa_ep} onChange={(e) => handleEpisodeChange(ep.id, 'capa_ep', e.target.value)} className="mt-0.5 block w-full bg-gray-700 text-gray-200 rounded-md shadow-sm p-1.5 text-sm focus:ring-primary focus:border-transparent" />
                  </div>
                   <div className="sm:col-span-2">
                      <label htmlFor={`ep-edit-${ep.id}-alertanovoep`} className="block text-xs font-medium text-gray-400 capitalize">Alerta Novo EP (0 ou 1):</label>
                      <input 
                        type='number' 
                        id={`ep-edit-${ep.id}-alertanovoep`} 
                        name='alertanovoep' 
                        value={ep.alertanovoep || '0'} 
                        min="0" max="1"
                        onChange={(e) => handleEpisodeChange(ep.id, 'alertanovoep', e.target.value)} 
                        className="mt-0.5 block w-full bg-gray-700 text-gray-200 rounded-md shadow-sm p-1.5 text-sm focus:ring-primary focus:border-transparent" 
                      />
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={addEpisodeField} className={`${secondaryButtonClass} mt-4 text-sm`}>
              <FaPlus className="mr-2" /> Adicionar Episódio
            </button>
          </fieldset>

          <div className="flex justify-end mt-6">
            <button type="button" onClick={handleSave} className={`${buttonClass} text-base px-6 py-3`} disabled={isSubmitting || isLoading || (capaStatus === 'invalid' && formData.capa?.trim() !== '')}>
              <FaSave className="mr-2" /> {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      )}
       {!loadedAnimeId && !isLoading && !error && (
        <p className="text-center text-gray-400 py-6">Pesquise por um ID para carregar os dados do catálogo para edição.</p>
      )}
    </div>
  );
};

export default AdminEditCatalogPage;