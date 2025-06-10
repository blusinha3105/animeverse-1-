import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimesCircle, FaImage, FaSpinner } from 'react-icons/fa';
import { apiService } from '../../../services/apiService'; 
import { useAuth } from '../../../hooks/useAuth';

interface EpisodeField {
  id: number;
  temporada: string;
  numero: string;
  nome: string;
  link: string;
  capa_ep: string;
}

const genreOptions = [
  "Ação", "Aventura", "Comédia", "Drama", "Fantasia", "Sci-Fi", "Slice of Life", 
  "Sobrenatural", "Esportes", "Romance", "Mistério", "Suspense", "Terror", 
  "Psicológico", "Magia", "Mecha", "Militar", "Histórico", "Escolar", "Seinen",
  "Shoujo", "Shounen", "Josei", "Ecchi", "Harem", "Isekai" 
].sort();

// Jikan types (simplified)
interface JikanAnimeTitle {
  type: string;
  title: string;
}
interface JikanAnimeImage {
  jpg: { image_url: string; small_image_url: string; large_image_url: string; };
  webp: { image_url: string; small_image_url: string; large_image_url: string; };
}
interface JikanAnimeStudio {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}
interface JikanAnimeGenre {
  mal_id: number;
  type: string;
  name: string; // This is in English
  url: string;
}
interface JikanAnimeData {
  mal_id: number;
  url: string;
  images: JikanAnimeImage;
  title: string;
  title_english?: string;
  title_japanese?: string;
  titles: JikanAnimeTitle[];
  type?: string; // TV, Movie, OVA, etc.
  source?: string;
  episodes?: number; // Total episodes
  status?: string; // Finished Airing, Currently Airing
  airing: boolean;
  aired: { from: string; to: string | null; prop: any; string: string; };
  duration?: string;
  rating?: string; // e.g., "PG-13 - Teens 13 or older"
  score?: number;
  scored_by?: number;
  rank?: number;
  popularity?: number;
  members?: number;
  favorites?: number;
  synopsis?: string;
  background?: string;
  season?: string;
  year?: number;
  broadcast?: { day: string; time: string; timezone: string; string: string; };
  producers: any[];
  licensors: any[];
  studios: JikanAnimeStudio[];
  genres: JikanAnimeGenre[];
  explicit_genres: any[];
  themes: any[];
  demographics: any[];
}


const AdminInsertCatalogPage: React.FC = () => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    capa: '',
    titulo: '',
    tituloAlternativo: '',
    sinopse: '',
    classificacao: '',
    qntd_temporadas: '',
    anoLancamento: '',
    dataPostagem: new Date().toISOString().split('T')[0], 
    ovas: '',
    filmes: '',
    estudio: '',
    diretor: '',
    tipoMidia: 'Anime',
    status: 'Andamento',
    selo: 'Legendado',
    genero: [] as string[],
  });

  const [episodes, setEpisodes] = useState<EpisodeField[]>([
    { id: Date.now(), temporada: '1', numero: '1', nome: 'Episódio 1', link: '', capa_ep: '' }
  ]);
  const [searchGenreTerm, setSearchGenreTerm] = useState('');
  const [capaStatus, setCapaStatus] = useState<'valid' | 'invalid' | 'unchecked' | 'checking'>('unchecked');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jikanTimeoutId, setJikanTimeoutId] = useState<number | null>(null);
  const [isFetchingJikan, setIsFetchingJikan] = useState(false);

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

  const mapJikanGenreToLocal = (jikanGenreName: string): string | undefined => {
    const mapping: { [key: string]: string } = {
        "Action": "Ação", "Adventure": "Aventura", "Comedy": "Comédia", "Drama": "Drama",
        "Fantasy": "Fantasia", "Sci-Fi": "Sci-Fi", "Slice of Life": "Slice of Life",
        "Supernatural": "Sobrenatural", "Sports": "Esportes", "Romance": "Romance",
        "Mystery": "Mistério", "Suspense": "Suspense", "Horror": "Terror",
        "Psychological": "Psicológico", "Magic": "Magia", "Mecha": "Mecha",
        "Military": "Militar", "Historical": "Histórico", "School": "Escolar",
        "Seinen": "Seinen", "Shoujo": "Shoujo", "Shounen": "Shounen", "Josei": "Josei",
        "Ecchi": "Ecchi", "Harem": "Harem", "Isekai": "Isekai",
        // Add more mappings if Jikan uses other genre names
    };
    return mapping[jikanGenreName] || genreOptions.find(opt => opt.toLowerCase() === jikanGenreName.toLowerCase());
  };


  const populateFormWithJikan = (anime: JikanAnimeData) => {
    setFormData(prev => ({
      ...prev,
      capa: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || prev.capa,
      titulo: prev.titulo || anime.title, // Keep manually typed title if it exists
      tituloAlternativo: anime.title_english || anime.titles?.find(t => t.type === "English")?.title || anime.title_japanese || '',
      sinopse: anime.synopsis || '',
      classificacao: anime.rating || '',
      qntd_temporadas: anime.episodes?.toString() || '',
      anoLancamento: anime.year?.toString() || (anime.aired?.from ? new Date(anime.aired.from).getFullYear().toString() : ''),
      estudio: anime.studios?.map(s => s.name).join(', ') || '',
      tipoMidia: anime.type === "Movie" ? "Filme" : anime.type === "OVA" ? "Ova" : anime.type === "Special" ? "Especial" : "Anime",
      status: anime.airing ? "Andamento" : (anime.status === "Finished Airing" ? "Completo" : "Andamento"),
      selo: (prev.titulo.toLowerCase().includes('dublado') || (anime.title_english && anime.title_english.toLowerCase().includes('dubbed'))) ? 'Dublado' : 'Legendado',
      genero: anime.genres?.map(g => mapJikanGenreToLocal(g.name)).filter(g => g !== undefined) as string[] || [],
      // dataPostagem remains as is (current date by default)
      ovas: anime.type === "OVA" ? 'Sim' : '', // Simple indication
      filmes: anime.type === "Movie" ? 'Sim' : '', // Simple indication
      diretor: '', // Jikan v4 doesn't easily provide director
    }));
    if (anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url) {
      checkCapaUrl(anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url);
    }
  };

  const fetchJikanDetails = async (title: string) => {
    if (!title.trim() || title.length < 3) {
      setIsFetchingJikan(false);
      return;
    }
    setIsFetchingJikan(true);
    try {
      const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1`);
      if (!response.ok) throw new Error('Jikan API request failed');
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        populateFormWithJikan(data.data[0]);
      }
    } catch (error) {
      console.error("Failed to fetch from Jikan API:", error);
    } finally {
      setIsFetchingJikan(false);
    }
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'capa') {
      checkCapaUrl(value);
    }

    if (name === 'titulo') {
      if (jikanTimeoutId) clearTimeout(jikanTimeoutId);
      if (value.trim().length >= 3) {
        const newTimeoutId = setTimeout(() => {
          fetchJikanDetails(value.trim());
        }, 1000); // 1 second delay
        setJikanTimeoutId(newTimeoutId); 
      } else {
        setIsFetchingJikan(false);
      }
    }
  };

  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({ ...prev, genero: selectedOptions }));
  };

  const handleEpisodeChange = (id: number, field: keyof EpisodeField, value: string) => {
    setEpisodes(prevEpisodes => 
      prevEpisodes.map(ep => ep.id === id ? { ...ep, [field]: value } : ep)
    );
  };

  const addEpisodeField = () => {
    const lastEpisode = episodes[episodes.length -1];
    const nextEpisodeNumber = lastEpisode ? (parseInt(lastEpisode.numero, 10) || 0) + 1 : 1;
    const currentSeason = lastEpisode ? lastEpisode.temporada : '1';

    setEpisodes(prev => [
      ...prev, 
      { id: Date.now(), temporada: currentSeason, numero: nextEpisodeNumber.toString(), nome: `Episódio ${nextEpisodeNumber}`, link: '', capa_ep: '' }
    ]);
  };

  const removeEpisodeField = (id: number) => {
    setEpisodes(prev => prev.filter(ep => ep.id !== id));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
        alert('Autenticação necessária.');
        setIsSubmitting(false);
        return;
    }
    if (capaStatus === 'invalid' && formData.capa.trim() !== '') {
        if (!window.confirm("A URL da capa parece inválida. Deseja continuar mesmo assim?")) {
            return;
        }
    }
    setIsSubmitting(true);
    const episodesToSubmit = episodes.map(({id, temporada, numero, ...rest}) => ({
        ...rest,
        temporada: parseInt(temporada, 10) || 1,
        numero: parseInt(numero, 10) || 1,
    }));

    const catalogData = { 
        ...formData, 
        qntd_temporadas: parseInt(formData.qntd_temporadas, 10) || undefined,
        anoLancamento: parseInt(formData.anoLancamento, 10) || undefined,
        episodios: episodesToSubmit 
    };
    
    console.log('Submitting Catalog Data:', catalogData);
    try {
      const response = await apiService.adminInsertCatalog(catalogData, token);
      alert('Catálogo inserido com sucesso!'); 
      console.log("API Response:", response);
      // Reset form or navigate away
       setFormData({
        capa: '', titulo: '', tituloAlternativo: '', sinopse: '', classificacao: '',
        qntd_temporadas: '', anoLancamento: '', dataPostagem: new Date().toISOString().split('T')[0],
        ovas: '', filmes: '', estudio: '', diretor: '', tipoMidia: 'Anime',
        status: 'Andamento', selo: 'Legendado', genero: []
      });
      setEpisodes([{ id: Date.now(), temporada: '1', numero: '1', nome: 'Episódio 1', link: '', capa_ep: '' }]);
      setCapaStatus('unchecked');
    } catch (error) {
      alert(`Erro ao inserir catálogo: ${(error as Error).message}`);
      console.error("API Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredGenreOptions = genreOptions.filter(genre => 
    genre.toLowerCase().includes(searchGenreTerm.toLowerCase())
  );
  
  const inputBaseClass = "mt-1 block w-full bg-gray-700 text-gray-200 rounded-md shadow-sm p-2 focus:ring-primary focus:border-transparent text-sm";
  const selectInputClasses = `${inputBaseClass}`;

  return (
    <div className="p-2 md:p-4 bg-admin-bg rounded-lg shadow-xl">
      <h1 className="text-2xl font-semibold text-primary mb-6">Inserir Novo Catálogo</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-md bg-admin-card-bg shadow">
          <legend className="text-lg font-medium text-gray-300 px-2">Informações do Anime</legend>
          
          <div className="form-group md:col-span-2">
            <label htmlFor="titulo" className="block text-sm font-medium text-gray-400 capitalize">
              Título: {isFetchingJikan && <FaSpinner className="inline ml-2 animate-spin" />}
            </label>
            <input
              type="text"
              id="titulo"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              placeholder="Digite o título do anime para auto-preenchimento (Jikan API)"
              className={inputBaseClass}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="capa" className="block text-sm font-medium text-gray-400 capitalize flex items-center">
              <FaImage className="mr-2" /> Capa:
              {capaStatus === 'checking' && <FaSpinner className="ml-2 animate-spin text-yellow-500" title="Verificando URL..." />}
              {capaStatus === 'valid' && <FaCheckCircle className="ml-2 text-green-500" title="URL da capa válida" />}
              {capaStatus === 'invalid' && <FaTimesCircle className="ml-2 text-red-500" title="URL da capa inválida ou imagem não encontrada" />}
            </label>
            <input
              type="text"
              id="capa"
              name="capa"
              value={formData.capa}
              onChange={handleChange}
              onBlur={(e) => checkCapaUrl(e.target.value)}
              placeholder="URL da imagem da capa"
              className={inputBaseClass}
            />
          </div>
          
          {(Object.keys(formData) as Array<keyof typeof formData>).map(key => {
            if (['genero', 'sinopse', 'tipoMidia', 'status', 'selo', 'dataPostagem', 'capa', 'titulo'].includes(key)) return null;
            return (
              <div key={key} className="form-group">
                <label htmlFor={key} className="block text-sm font-medium text-gray-400 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                </label>
                <input
                  type={(key === 'qntd_temporadas' || key === 'anoLancamento') ? 'number' : 'text'}
                  id={key}
                  name={key}
                  value={formData[key as keyof Omit<typeof formData, 'genero' | 'dataPostagem' | 'capa' | 'titulo'>]}
                  onChange={handleChange}
                  placeholder={`Insira ${key.toLowerCase().replace(/([A-Z])/g, ' $1')}`}
                  className={inputBaseClass}
                />
              </div>
            );
          })}

          <div className="form-group md:col-span-2">
            <label htmlFor="sinopse" className="block text-sm font-medium text-gray-400">Sinopse:</label>
            <textarea
              id="sinopse"
              name="sinopse"
              value={formData.sinopse}
              onChange={handleChange}
              rows={4}
              placeholder="Sinopse do anime"
              className={`${inputBaseClass} custom-scrollbar`}
            />
          </div>

          <div className="form-group">
            <label htmlFor="tipoMidia" className="block text-sm font-medium text-gray-400">Tipo de Mídia:</label>
            <select id="tipoMidia" name="tipoMidia" value={formData.tipoMidia} onChange={handleChange} className={selectInputClasses}>
              <option value="Anime">Anime</option> <option value="Filme">Filme</option> <option value="Ova">Ova</option>
              <option value="Especial">Especial</option> <option value="Series">Series</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="status" className="block text-sm font-medium text-gray-400">Status:</label>
            <select id="status" name="status" value={formData.status} onChange={handleChange} className={selectInputClasses}>
              <option value="Andamento">Lançamento</option> <option value="Completo">Completo</option> <option value="Incompleto">Incompleto</option>
              <option value="Pausado">Pausado</option> <option value="Cancelado">Cancelado</option> <option value="Em Revisão">Em Revisão</option>
              <option value="Removido">Removido</option> <option value="Aguardando Lançamento">Aguardando Lançamento</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="selo" className="block text-sm font-medium text-gray-400">Selo:</label>
            <select id="selo" name="selo" value={formData.selo} onChange={handleChange} className={selectInputClasses}>
              <option value="Legendado">Legendado</option> <option value="Dublado">Dublado</option>
            </select>
          </div>
           <div className="form-group">
            <label htmlFor="dataPostagem" className="block text-sm font-medium text-gray-400">Data de Postagem:</label>
            <input type="date" id="dataPostagem" name="dataPostagem" value={formData.dataPostagem} onChange={handleChange} className={inputBaseClass}/>
          </div>

          <div className="form-group md:col-span-2">
            <label htmlFor="genero" className="block text-sm font-medium text-gray-400">Gêneros:</label>
            <input 
              type="text" 
              id="searchGenre"
              placeholder="Pesquisar gênero..."
              value={searchGenreTerm}
              onChange={(e) => setSearchGenreTerm(e.target.value)}
              className={`mb-2 ${inputBaseClass}`}
            />
            <select 
              id="genero" 
              name="genero" 
              multiple 
              value={formData.genero} 
              onChange={handleGenreChange} 
              className={`${inputBaseClass} h-32 custom-scrollbar`}
            >
              {filteredGenreOptions.map(genre => (
                <option key={genre} value={genre} className="p-1 hover:bg-primary">{genre}</option>
              ))}
            </select>
            <div className="mt-2 text-xs text-gray-400">
              Selecionados: {formData.genero.join(', ') || 'Nenhum'}
            </div>
          </div>
        </fieldset>

        <fieldset className="p-4 rounded-md bg-admin-card-bg shadow">
          <legend className="text-lg font-medium text-gray-300 px-2">Episódios</legend>
          <div id="episodesContainer" className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar pr-2">
            {episodes.map((ep, index) => (
              <div key={ep.id} className="p-3 bg-gray-750 rounded-md grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
                 <button 
                    type="button" 
                    onClick={() => removeEpisodeField(ep.id)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-400 text-xl p-0.5 bg-gray-800 rounded-full leading-none flex items-center justify-center h-6 w-6"
                    title="Remover Episódio"
                    aria-label="Remover Episódio"
                 >
                    &times;
                  </button>
                  <h4 className="text-sm font-semibold text-gray-300 sm:col-span-2">Episódio {index + 1}</h4>
                  {(Object.keys(ep) as Array<keyof EpisodeField>).map(fieldKey => {
                    if (fieldKey === 'id') return null;
                    return (
                      <div key={fieldKey}>
                        <label htmlFor={`ep-${ep.id}-${fieldKey}`} className="block text-xs font-medium text-gray-400 capitalize">{fieldKey.replace('_', ' ')}:</label>
                        <input 
                          type={fieldKey === 'temporada' || fieldKey === 'numero' ? 'number' : 'text'}
                          id={`ep-${ep.id}-${fieldKey}`}
                          value={ep[fieldKey]}
                          onChange={(e) => handleEpisodeChange(ep.id, fieldKey, e.target.value)}
                          placeholder={fieldKey.replace('_', ' ').replace(/^./, str => str.toUpperCase())}
                          className="mt-0.5 block w-full bg-gray-700 text-gray-200 rounded-md shadow-sm p-1.5 text-sm focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
          <button 
            type="button" 
            onClick={addEpisodeField} 
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm"
            disabled={isSubmitting}
          >
            Adicionar Episódio
          </button>
        </fieldset>

        <div className="flex justify-end">
          <button 
            type="submit" 
            className="bg-primary hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors disabled:opacity-50"
            disabled={isSubmitting || (capaStatus === 'invalid' && formData.capa.trim() !== '') || isFetchingJikan}
          >
            {isSubmitting ? 'Enviando...' : (isFetchingJikan ? 'Aguarde...' : 'Inserir Catálogo')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminInsertCatalogPage;