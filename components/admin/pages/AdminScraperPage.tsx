import React, { useState } from 'react';
import { FaPlay } from 'react-icons/fa';
import { apiService } from '../../../services/apiService'; // Import apiService
import { useAuth } from '../../../hooks/useAuth';

const AdminScraperPage: React.FC = () => {
  const { token } = useAuth();
  const [provider, setProvider] = useState('animeq.blog');
  const [homeLink, setHomeLink] = useState(''); // 'inicio' parameter for backend
  const [scraperResult, setScraperResult] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStartScraper = async () => {
    if (!homeLink.trim()) {
      setStatusMessage('Por favor, insira o ID/link da home do anime (parâmetro "inicio" para o backend).');
      return;
    }
    if (!token) {
        alert('Autenticação necessária.');
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setStatusMessage(`Iniciando scraper para ${provider} com "inicio": ${homeLink}...`);
    setScraperResult('');

    try {
      const result = await apiService.adminScrapeAnime(provider, homeLink, token);
      const links = result.LinksEncontrados.filter((link: string | null) => link !== null);
      setScraperResult(links); // Pretty print JSON
      setStatusMessage('Scraper concluído com sucesso!');
    } catch (error) {
      const errorMessage = (error as Error).message || "Erro desconhecido no scraper.";
      setStatusMessage(`Erro no scraper: ${errorMessage}`);
      setScraperResult(`Erro: ${errorMessage}`);
      console.error("Scraper Error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const inputClass = "mt-1 block w-full bg-gray-700 text-gray-200 rounded-md shadow-sm p-2 focus:ring-primary focus:border-transparent text-sm";
  const labelClass = "block text-sm font-medium text-gray-400";
  const buttonClass = "bg-primary hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm flex items-center justify-center disabled:opacity-50";


  return (
    <div className="p-2 md:p-4 bg-admin-bg rounded-lg shadow-xl">
      <h1 className="text-2xl font-semibold text-primary mb-6">Configurações de Scraper</h1>
      
      <div className="bg-admin-card-bg p-6 rounded-lg shadow-md max-w-2xl mx-auto">
        <div className="space-y-4">
          <div>
            <label htmlFor="provider" className={labelClass}>Provedor do Site (Parâmetro `site`):</label>
            <select 
              id="provider" 
              value={provider} 
              onChange={(e) => setProvider(e.target.value)}
              className={inputClass}
            >
              <option value="animeq.blog">animeq.blog</option>
              <option value="goyabu.to">goyabu.to</option>
              <option value="animesgames.cc">animesgames.cc</option>
              <option value="animesorionvip.net">animesorionvip.net</option>
              {/* Add other sites from your backend's `sites` object */}
            </select>
          </div>

          <div>
            <label htmlFor="homeLink" className={labelClass}>ID/Slug Home do Anime (Parâmetro `inicio`):</label>
            <input 
              type="text" 
              id="homeLink" 
              value={homeLink}
              onChange={(e) => setHomeLink(e.target.value)}
              placeholder="Ex: boku-no-hero-academia ou 60453"
              className={inputClass}
            />
            <p className="text-xs text-gray-500 mt-1">Este valor será usado como o parâmetro `inicio` na URL do scraper.</p>
          </div>

          <button 
            onClick={handleStartScraper} 
            className={`${buttonClass} w-full`}
            disabled={isLoading}
          >
            <FaPlay className="mr-2" /> {isLoading ? 'Executando...' : 'Executar Scraper'}
          </button>

          {statusMessage && (
            <div className={`mt-4 p-3 rounded-md text-sm ${statusMessage.includes('Erro') ? 'bg-red-900 text-red-200' : 'bg-blue-900 text-blue-200'}`}>
              {statusMessage}
            </div>
          )}
        </div>

        <div className="mt-6">
          <label htmlFor="scraperResult" className={labelClass}>Resultado do Scraper:</label>
          <textarea 
            id="scraperResult" 
            value={scraperResult}
            readOnly 
            rows={15}
            className={`${inputClass} custom-scrollbar font-mono text-xs`}
            placeholder="Os resultados da execução do scraper aparecerão aqui..."
          />
        </div>
      </div>
    </div>
  );
};

export default AdminScraperPage;