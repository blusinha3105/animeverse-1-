import React, { useState, useEffect } from 'react';
import { FaSave, FaSitemap, FaCogs } from 'react-icons/fa';
import { apiService } from '../../../services/apiService'; // Import apiService
import { useAuth } from '../../../hooks/useAuth';

const AdminSettingsPage: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'config' | 'sitemap'>('config');

  // Configurações State
  const [siteName, setSiteName] = useState('');
  const [catalogVerification, setCatalogVerification] = useState('yes');
  const [isConfigLoading, setIsConfigLoading] = useState(false);
  const [isConfigSubmitting, setIsConfigSubmitting] = useState(false);
  
  // Sitemap State
  const [sitemapType, setSitemapType] = useState<'a' | 'e' | 't'>('a'); 
  const [sitemapResult, setSitemapResult] = useState<string | null>(null);
  const [isGeneratingSitemap, setIsGeneratingSitemap] = useState(false);

  // Fetch initial settings
  useEffect(() => {
    const fetchSettings = async () => {
        if (!token) return; // Guard clause for token
        setIsConfigLoading(true);
        try {
            // const settings = await apiService.adminGetSiteSettings(token); // Pass token
            // setSiteName(settings.siteName || 'AnimeVerse');
            // setCatalogVerification(settings.catalogVerification || 'yes');
            // Mocked for now:
            setSiteName('AnimeVerse (Mocked)');
            setCatalogVerification('yes');
        } catch (error) {
            console.error("Failed to load site settings", error);
            // Use defaults if fetch fails
            setSiteName('AnimeVerse');
            setCatalogVerification('yes');
        } finally {
            setIsConfigLoading(false);
        }
    };
    if (activeTab === 'config') { // Only load when config tab is active
        fetchSettings();
    }
  }, [activeTab, token]);


  const handleSaveConfig = async () => {
    if (!token) {
        alert('Autenticação necessária.');
        setIsConfigSubmitting(false);
        return;
    }
    setIsConfigSubmitting(true);
    console.log('Salvando Configurações:', { siteName, catalogVerification });
    try {
      // await apiService.adminUpdateSiteSettings({ siteName, catalogVerification }, token); // Pass token
      alert('Configurações salvas com sucesso! (Mock)');
    } catch (error) {
      alert(`Erro ao salvar configurações: ${(error as Error).message}`);
      console.error(error);
    } finally {
      setIsConfigSubmitting(false);
    }
  };

  const handleGenerateSitemap = async () => {
    if (!token) {
        alert('Autenticação necessária.');
        setIsGeneratingSitemap(false);
        return;
    }
    setIsGeneratingSitemap(true);
    setSitemapResult(null);
    console.log('Gerando Sitemap para tipo:', sitemapType);
    try {
      const response = await apiService.adminGenerateSitemap(sitemapType, token);
      // Assuming the backend provides a URL or the sitemap content directly
      // For this example, we'll assume it's a direct download response like the original backend script
      // Or, if the backend saves it and returns a URL:
      // const sitemapUrl = response.sitemapUrl;
      // setSitemapResult(`Sitemap gerado: <a href="${sitemapUrl}" target="_blank" download class="text-blue-400 hover:underline">Baixar sitemap.xml</a>`);

      // Simulating backend response similar to original script's `res.download`
      // Create a blob from the (mocked) XML string and a download link
      const xmlString = response; // Assuming `response` is the XML string content from backend
      const blob = new Blob([xmlString], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      setSitemapResult(`Sitemap gerado com sucesso! <a href="${url}" download="sitemap.xml" class="text-blue-400 hover:underline">Baixar sitemap.xml</a>`);
      // URL.revokeObjectURL(url) should be called after download, but it's tricky here. Link will work for session.

    } catch (error) {
      setSitemapResult(`Erro ao gerar sitemap: ${(error as Error).message}`);
      console.error(error);
    } finally {
      setIsGeneratingSitemap(false);
    }
  };

  const inputClass = "mt-1 block w-full bg-gray-700 text-gray-200 rounded-md shadow-sm p-2 focus:ring-primary focus:border-transparent text-sm";
  const labelClass = "block text-sm font-medium text-gray-400";
  const buttonClass = "bg-primary hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm flex items-center justify-center disabled:opacity-50";
  const tabButtonClass = (isActive: boolean) => 
    `px-4 py-2 text-sm font-medium rounded-t-lg transition-colors outline-none focus:ring-2 focus:ring-primary
     ${isActive ? 'bg-primary text-white shadow-md' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`;

  return (
    <div className="p-2 md:p-4 bg-admin-bg rounded-lg shadow-xl">
      <h1 className="text-2xl font-semibold text-primary mb-6">Configurações</h1>

      <div className="mb-6 flex">
        <button onClick={() => setActiveTab('config')} className={tabButtonClass(activeTab === 'config')}>
          <FaCogs className="inline mr-2" /> Configurações Gerais
        </button>
        <button onClick={() => setActiveTab('sitemap')} className={tabButtonClass(activeTab === 'sitemap')}>
          <FaSitemap className="inline mr-2" /> Gerar Sitemap
        </button>
      </div>

      {isConfigLoading && activeTab === 'config' && <p className="text-gray-300 py-4">Carregando configurações...</p>}
      
      {activeTab === 'config' && !isConfigLoading && (
        <div id="Configurações-content-tab" className="bg-admin-card-bg p-6 rounded-b-lg shadow-md animate-fadeIn">
          <h2 className="text-xl font-semibold text-gray-200 mb-4">Opções do Site</h2>
          <div className="space-y-6">
            <div>
              <label htmlFor="site_name_config" className={labelClass}>Nome do Site:</label>
              <input type="text" id="site_name_config" value={siteName} onChange={(e) => setSiteName(e.target.value)} className={inputClass} />
            </div>
            <div className="pt-4">
              <span className={labelClass}>Habilitar Verificação de Catálogos Diária:
                <span className="ml-2 text-xs text-blue-400 cursor-help" title="Desativa a verificação diária de novos episódios."> (Info) </span>
              </span>
              <div className="mt-2 flex space-x-4">
                <label className="flex items-center text-sm text-gray-300 cursor-pointer">
                  <input type="radio" name="catalogVerification" value="yes" checked={catalogVerification === 'yes'} onChange={(e) => setCatalogVerification(e.target.value)} className="form-radio h-4 w-4 text-primary bg-gray-600 border-gray-500 focus:ring-primary"/>
                  <span className="ml-2">Sim</span>
                </label>
                <label className="flex items-center text-sm text-gray-300 cursor-pointer">
                  <input type="radio" name="catalogVerification" value="no" checked={catalogVerification === 'no'} onChange={(e) => setCatalogVerification(e.target.value)} className="form-radio h-4 w-4 text-primary bg-gray-600 border-gray-500 focus:ring-primary"/>
                  <span className="ml-2">Não</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={handleSaveConfig} className={buttonClass} disabled={isConfigSubmitting}>
                <FaSave className="mr-2"/> {isConfigSubmitting ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sitemap' && (
        <div id="sitemap-content-tab" className="bg-admin-card-bg p-6 rounded-b-lg shadow-md animate-fadeIn">
          <h2 className="text-xl font-semibold text-gray-200 mb-4">Geração de Sitemap</h2>
          <form onSubmit={(e) => {e.preventDefault(); handleGenerateSitemap();}} className="space-y-4">
            <div>
              <label htmlFor="sitemapType" className={labelClass}>Tipo de Conteúdo para Sitemap:</label>
              <select id="sitemapType" value={sitemapType} onChange={(e) => setSitemapType(e.target.value as 'a' | 'e' | 't')} className={inputClass}>
                <option value="a">Apenas Animes (páginas de detalhe)</option>
                <option value="e">Apenas Episódios (páginas de player)</option>
                <option value="t">Ambos (Animes e Episódios)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">A URL base do site (ex: https://seusite.com) será usada automaticamente.</p>
            </div>
            <button type="submit" className={buttonClass} disabled={isGeneratingSitemap}>
              <FaSitemap className="mr-2" /> {isGeneratingSitemap ? 'Gerando...' : 'Gerar Sitemap'}
            </button>
          </form>
          {sitemapResult && (
            <div className="mt-6 p-3 bg-gray-700 rounded-md text-sm text-gray-300"
                 dangerouslySetInnerHTML={{ __html: sitemapResult }}>
            </div>
          )}
        </div>
      )}
      <style>
        {`
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}
      </style>
    </div>
  );
};

export default AdminSettingsPage;