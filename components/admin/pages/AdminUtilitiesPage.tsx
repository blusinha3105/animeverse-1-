import React, { useState } from 'react';
import { FaCopy, FaSearch, FaTrashAlt, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import { apiService } from '../../../services/apiService'; 
import { useAuth } from '../../../hooks/useAuth';

interface OMDBEpisode {
  Poster: string;
  Title: string;
  Episode: string;
  imdbID: string;
}

// Ensure this key is not committed if it's sensitive. For OMDB free tier, it's usually fine.
// Ideally, this would be a backend proxy call if key secrecy is paramount.
const OMDB_API_KEY = 'ca369dbb'; 

const AdminUtilitiesPage: React.FC = () => {
  const { token } = useAuth();
  const [imdbSearchInput, setImdbSearchInput] = useState('');
  const [seasonNumberInput, setSeasonNumberInput] = useState('1');
  const [imdbSearchResults, setImdbSearchResults] = useState<OMDBEpisode[]>([]);
  const [isLoadingImdb, setIsLoadingImdb] = useState(false);
  const [imdbError, setImdbError] = useState<string | null>(null);
  const [isClearingDb, setIsClearingDb] = useState(false);

  const searchImdbCover = async () => {
    if (!imdbSearchInput.trim()) {
      setImdbError('Por favor, digite o nome do anime.');
      return;
    }
    setIsLoadingImdb(true);
    setImdbError(null);
    setImdbSearchResults([]);

    const apiUrl = `https://www.omdbapi.com/?t=${encodeURIComponent(imdbSearchInput)}&Season=${seasonNumberInput || '1'}&apikey=${OMDB_API_KEY}`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.Response === "False") {
        setImdbError(data.Error || "Nenhum resultado encontrado no OMDB.");
        setIsLoadingImdb(false);
        return;
      }

      if (data.Episodes && data.Episodes.length > 0) {
        // Fetch full details for each episode to get the Poster
        // Note: OMDB API is sometimes inconsistent with Poster URLs in season listings
        const episodeDetailsPromises = data.Episodes.map((ep: any) => 
          fetch(`https://www.omdbapi.com/?i=${ep.imdbID}&apikey=${OMDB_API_KEY}`).then(res => res.json())
        );
        const detailedEpisodes = await Promise.all(episodeDetailsPromises);
        
        // Filter out episodes that don't have a valid poster
        const validEpisodes = detailedEpisodes.filter(ep => ep.Response === "True" && ep.Poster && ep.Poster !== "N/A") as OMDBEpisode[];
        
        validEpisodes.sort((a,b) => parseInt(a.Episode, 10) - parseInt(b.Episode, 10)); // Sort by episode number
        setImdbSearchResults(validEpisodes);

      } else {
        setImdbError("Nenhum episódio encontrado para esta temporada no OMDB.");
      }
    } catch (error) {
      console.error('Erro ao buscar no OMDB:', error);
      setImdbError('Erro ao conectar com a API do OMDB.');
    } finally {
      setIsLoadingImdb(false);
    }
  };

  const copyImageLinks = () => {
    if (imdbSearchResults.length === 0) {
      alert("Nenhuma imagem para copiar.");
      return;
    }
    const links = imdbSearchResults.map(ep => ep.Poster).join("\n");
    navigator.clipboard.writeText(links)
      .then(() => alert("Links das imagens copiados para a área de transferência!"))
      .catch(err => {
        console.error('Erro ao copiar links: ', err);
        alert("Erro ao copiar links.");
      });
  };

  const handleClearDatabase = async () => {
    if (!token) {
        alert('Autenticação necessária.');
        setIsClearingDb(false);
        return;
    }
    if (window.confirm('TEM CERTEZA ABSOLUTA que deseja limpar TODO o banco de dados de animes e episódios? Esta ação é IRREVERSÍVEL.')) {
      if (window.confirm('CONFIRMAÇÃO FINAL: Limpar o banco de dados? Não haverá como recuperar os dados.')) {
        setIsClearingDb(true);
        try {
          const response = await apiService.adminClearDatabase(token);
          alert('Banco de dados limpo com sucesso!'); 
          console.log(response);
        } catch (error) {
          alert(`Erro ao limpar banco de dados: ${(error as Error).message}`);
          console.error(error);
        } finally {
          setIsClearingDb(false);
        }
      } else {
        alert('Ação de limpeza cancelada.');
      }
    } else {
      alert('Ação de limpeza cancelada.');
    }
  };
  
  const inputClass = "block w-full bg-gray-700 text-gray-200 rounded-md shadow-sm p-2 focus:ring-primary focus:border-transparent text-sm";
  const labelClass = "block text-sm font-medium text-gray-400 mb-1";
  const buttonClass = "bg-primary hover:bg-purple-700 text-white font-medium py-2 px-3 rounded-md transition-colors text-sm flex items-center justify-center disabled:opacity-50";
  const secondaryButtonClass = "bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-md transition-colors text-sm flex items-center justify-center disabled:opacity-50";
  const dangerButtonClass = "bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm flex items-center justify-center disabled:opacity-50";


  return (
    <div className="p-2 md:p-4 bg-admin-bg rounded-lg shadow-xl space-y-8">
      <h1 className="text-2xl font-semibold text-primary">Utilitários</h1>

      <section className="bg-admin-card-bg p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-200 mb-4">Gerador de Links de Capas de Episódios (OMDB)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-4">
          <div>
            <label htmlFor="imdbSearchInput" className={labelClass}>Nome do Anime (Título Original):</label>
            <input type="text" id="imdbSearchInput" value={imdbSearchInput} onChange={(e) => setImdbSearchInput(e.target.value)} placeholder="Ex: Naruto, One Piece" className={inputClass} />
          </div>
          <div>
            <label htmlFor="seasonNumberInput" className={labelClass}>Número da Temporada:</label>
            <input type="number" id="seasonNumberInput" value={seasonNumberInput} onChange={(e) => setSeasonNumberInput(e.target.value)} placeholder="Padrão: 1" min="1" className={inputClass} />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 md:pt-6">
            <button onClick={searchImdbCover} className={`${buttonClass} w-full`} disabled={isLoadingImdb}>
              <FaSearch className="mr-2" /> {isLoadingImdb ? <FaSpinner className="animate-spin mr-1"/> : ''} {isLoadingImdb ? 'Pesquisando...' : 'Pesquisar'}
            </button>
            <button onClick={copyImageLinks} className={`${secondaryButtonClass} w-full`} disabled={imdbSearchResults.length === 0 || isLoadingImdb}>
              <FaCopy className="mr-2" /> Copiar Links
            </button>
          </div>
        </div>
        {imdbError && <p className="text-red-400 text-sm mb-4 bg-red-900 bg-opacity-30 p-2 rounded">{imdbError}</p>}
        {isLoadingImdb && <p className="text-gray-300 text-center py-4">Carregando capas... <FaSpinner className="inline animate-spin ml-2"/></p>}
        {imdbSearchResults.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-medium text-gray-300 mb-2">Resultados ({imdbSearchResults.length} episódios com capa):</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
              {imdbSearchResults.map((ep) => (
                <div key={ep.imdbID} className="bg-gray-700 p-2 rounded shadow flex flex-col items-center">
                  <img src={ep.Poster} alt={`Capa Ep. ${ep.Episode} - ${ep.Title}`} className="w-full h-auto object-cover rounded aspect-[2/3]" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  <p className="text-xs text-gray-300 mt-1 text-center truncate w-full" title={ep.Title}>Ep. {ep.Episode}: {ep.Title}</p>
                </div>
              ))}
            </div>
          </div>
        )}
         {imdbSearchResults.length === 0 && !isLoadingImdb && !imdbError && imdbSearchInput && (
            <p className="text-gray-400 text-center py-4">Nenhuma capa encontrada para os critérios de pesquisa. Verifique o título e a temporada.</p>
        )}
      </section>
      
      <section className="bg-admin-card-bg p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-red-500 mb-4 flex items-center">
            <FaExclamationTriangle className="mr-2"/> Ações Perigosas
        </h2>
        <div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">Limpar Banco de Dados</h3>
            <p className="text-sm text-gray-400 mb-3">Esta ação excluirá TODOS os dados de animes e episódios do banco de dados. Use com extrema cautela.</p>
            <button onClick={handleClearDatabase} className={dangerButtonClass} disabled={isClearingDb}>
                <FaTrashAlt className="mr-2" /> {isClearingDb ? <FaSpinner className="animate-spin mr-1"/> : ''} {isClearingDb ? 'Limpando...' : 'Limpar Banco de Dados Principal'}
            </button>
        </div>
      </section>
    </div>
  );
};

export default AdminUtilitiesPage;