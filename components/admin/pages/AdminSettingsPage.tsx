
import React, { useState, useEffect } from 'react';
import { FaSave, FaSitemap, FaCogs, FaBullhorn, FaPalette, FaUndo } from 'react-icons/fa';
import { apiService } from '../../../services/apiService'; 
import { useAuth } from '../../../hooks/useAuth';
import { SiteSettings, JuicyAdsSettings, GeneralSettings, ThemeSettings } from '../../../types'; 
import { DEFAULT_THEME } from '../../../constants'; // Importar DEFAULT_THEME

// Declaração para a função global que será definida em index.html
declare global {
  interface Window {
    applyThemeSettings: (theme: ThemeSettings) => void;
  }
}

const themeColorLabels: Record<keyof ThemeSettings, string> = {
  primary: 'Cor Primária',
  primaryAction: 'Cor Ação Primária (Botões)',
  secondary: 'Cor Secundária',
  background: 'Cor de Fundo (Principal)',
  card: 'Cor de Fundo (Cards)',
  textPrimary: 'Cor do Texto (Principal)',
  textSecondary: 'Cor do Texto (Secundário)',
};

const juicyAdsOptions: Array<{ label: string; value: string }> = [
  {label: 'Sim', value: 'true'},
  {label: 'Não', value: 'false'}
];

const AdminSettingsPage: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'juicyads' | 'theme' | 'sitemap'>('general');

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    siteName: 'AnimeVerse',
    catalogVerification: 'yes',
  });

  // JuicyAds Settings State
  const [juicyAdsSettings, setJuicyAdsSettings] = useState<JuicyAdsSettings>({
    juicyAdsEnabled: false,
    juicyAdsSpotBanner728x90: '',
    juicyAdsSpotBanner300x250: '',
    juicyAdsSpotMobileBanner300x100: '',
    juicyAdsSpotPopunder: '',
  });

  // Theme Settings State
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(DEFAULT_THEME);
  
  // Sitemap State
  const [sitemapType, setSitemapType] = useState<'a' | 'e' | 't'>('a'); 
  const [sitemapResult, setSitemapResult] = useState<string | null>(null);
  
  // Loading/Submitting States
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingSitemap, setIsGeneratingSitemap] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);


  useEffect(() => {
    setIsLoadingSettings(true);
    try {
      const storedSettings = localStorage.getItem('siteSettings');
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings) as Partial<SiteSettings>;
        setGeneralSettings(prev => ({
          ...prev,
          siteName: parsedSettings.siteName || prev.siteName,
          catalogVerification: parsedSettings.catalogVerification || prev.catalogVerification,
        }));
        setJuicyAdsSettings(prev => ({
          ...prev,
          juicyAdsEnabled: typeof parsedSettings.juicyAdsEnabled === 'boolean' ? parsedSettings.juicyAdsEnabled : prev.juicyAdsEnabled,
          juicyAdsSpotBanner728x90: typeof parsedSettings.juicyAdsSpotBanner728x90 === 'string' ? parsedSettings.juicyAdsSpotBanner728x90 : (prev.juicyAdsSpotBanner728x90 || ''),
          juicyAdsSpotBanner300x250: typeof parsedSettings.juicyAdsSpotBanner300x250 === 'string' ? parsedSettings.juicyAdsSpotBanner300x250 : (prev.juicyAdsSpotBanner300x250 || ''),
          juicyAdsSpotMobileBanner300x100: typeof parsedSettings.juicyAdsSpotMobileBanner300x100 === 'string' ? parsedSettings.juicyAdsSpotMobileBanner300x100 : (prev.juicyAdsSpotMobileBanner300x100 || ''),
          juicyAdsSpotPopunder: typeof parsedSettings.juicyAdsSpotPopunder === 'string' ? parsedSettings.juicyAdsSpotPopunder : (prev.juicyAdsSpotPopunder || ''),
        }));
        
        const loadedTheme: ThemeSettings = {
            primary: parsedSettings.primary ?? DEFAULT_THEME.primary,
            primaryAction: parsedSettings.primaryAction ?? DEFAULT_THEME.primaryAction,
            secondary: parsedSettings.secondary ?? DEFAULT_THEME.secondary,
            background: parsedSettings.background ?? DEFAULT_THEME.background,
            card: parsedSettings.card ?? DEFAULT_THEME.card,
            textPrimary: parsedSettings.textPrimary ?? DEFAULT_THEME.textPrimary,
            textSecondary: parsedSettings.textSecondary ?? DEFAULT_THEME.textSecondary,
        };
        setThemeSettings(loadedTheme);

      } else {
        setThemeSettings(DEFAULT_THEME); 
      }
    } catch (error) {
      console.error("Falha ao carregar configurações do localStorage", error);
      setErrorMessage("Erro ao carregar configurações.");
      setThemeSettings(DEFAULT_THEME); 
    } finally {
      setIsLoadingSettings(false);
    }
  }, []);


  const handleGeneralSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setGeneralSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleJuicyAdsSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'juicyAdsEnabled') { // This is for the radio buttons
        setJuicyAdsSettings(prev => ({ 
            ...prev, 
            juicyAdsEnabled: value === 'true' 
        }));
    } else { // This is for the text inputs (spot IDs)
        setJuicyAdsSettings(prev => ({ 
            ...prev, 
            [name]: value 
        }));
    }
  };

  const handleThemeSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setThemeSettings(prev => ({ ...prev, [name]: value }));
  };


  const handleSaveSettings = async (newThemeSettings?: ThemeSettings) => {
    if (!token && activeTab !== 'theme') { 
      setErrorMessage('Autenticação necessária para salvar algumas configurações.');
    }
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    
    const currentThemeToSave = newThemeSettings || themeSettings;
    const settingsToSave: SiteSettings = { ...generalSettings, ...juicyAdsSettings, ...currentThemeToSave };
    
    console.log('Salvando Configurações:', settingsToSave);
    try {
      localStorage.setItem('siteSettings', JSON.stringify(settingsToSave));
      if (window.applyThemeSettings) {
        window.applyThemeSettings(currentThemeToSave);
      }
      // await apiService.adminUpdateSiteSettings(settingsToSave, token); // Uncomment when API is ready
      setSuccessMessage('Configurações salvas com sucesso!');
    } catch (error) {
      setErrorMessage(`Erro ao salvar configurações: ${(error as Error).message}`);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRestoreDefaultTheme = () => {
    if (window.confirm("Tem certeza que deseja restaurar as cores padrão do tema?")) {
      setThemeSettings(DEFAULT_THEME);
      handleSaveSettings(DEFAULT_THEME); 
    }
  };

  const handleGenerateSitemap = async () => {
    if (!token) {
        setErrorMessage('Autenticação necessária.');
        return;
    }
    setIsGeneratingSitemap(true);
    setSitemapResult(null);
    setErrorMessage(null);
    console.log('Gerando Sitemap para tipo:', sitemapType);
    try {
      const response = await apiService.adminGenerateSitemap(sitemapType, token);
      const xmlString = response; 
      const blob = new Blob([xmlString], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      setSitemapResult(`Sitemap gerado com sucesso! <a href="${url}" download="sitemap.xml" class="text-blue-400 hover:underline">Baixar sitemap.xml</a>`);
    } catch (error) {
      setErrorMessage(`Erro ao gerar sitemap: ${(error as Error).message}`);
      console.error(error);
    } finally {
      setIsGeneratingSitemap(false);
    }
  };

  const inputClass = "mt-1 block w-full bg-gray-700 text-gray-200 rounded-md shadow-sm p-2 focus:ring-primary focus:border-transparent text-sm";
  const labelClass = "block text-sm font-medium text-gray-400";
  const saveButtonClass = "bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm flex items-center justify-center disabled:opacity-50";
  const tabButtonClass = (tabKey: 'general' | 'juicyads' | 'theme' | 'sitemap') => 
    `px-4 py-2 text-sm font-medium rounded-t-lg transition-colors outline-none focus:ring-2 focus:ring-primary
     ${activeTab === tabKey ? 'bg-primary text-white shadow-md' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`;

  return (
    <div className="p-2 md:p-4 bg-admin-bg rounded-lg shadow-xl">
      <h1 className="text-2xl font-semibold text-primary mb-6">Configurações</h1>

      {successMessage && <div className="mb-4 p-3 bg-green-800 text-green-200 rounded-md text-sm">{successMessage}</div>}
      {errorMessage && <div className="mb-4 p-3 bg-red-800 text-red-200 rounded-md text-sm">{errorMessage}</div>}


      <div className="mb-6 flex border-b border-gray-700">
        <button onClick={() => setActiveTab('general')} className={tabButtonClass('general')}>
          <FaCogs className="inline mr-2" /> Gerais
        </button>
        <button onClick={() => setActiveTab('juicyads')} className={tabButtonClass('juicyads')}>
          <FaBullhorn className="inline mr-2" /> JuicyAds
        </button>
        <button onClick={() => setActiveTab('theme')} className={tabButtonClass('theme')}>
          <FaPalette className="inline mr-2" /> Tema
        </button>
        <button onClick={() => setActiveTab('sitemap')} className={tabButtonClass('sitemap')}>
          <FaSitemap className="inline mr-2" /> Sitemap
        </button>
      </div>

      {isLoadingSettings && <p className="text-gray-300 py-4">Carregando configurações...</p>}
      
      {!isLoadingSettings && (
        <>
          {activeTab === 'general' && (
            <div id="general-settings-tab" className="bg-admin-card-bg p-6 rounded-b-lg shadow-md animate-fadeIn">
              <h2 className="text-xl font-semibold text-gray-200 mb-4">Opções do Site</h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="siteName" className={labelClass}>Nome do Site:</label>
                  <input type="text" id="siteName" name="siteName" value={generalSettings.siteName} onChange={handleGeneralSettingChange} className={inputClass} />
                </div>
                <div className="pt-4">
                  <span className={labelClass}>Habilitar Verificação de Catálogos Diária:</span>
                  <div className="mt-2 flex space-x-4">
                    {['yes', 'no'].map(val => (
                        <label key={val} className="flex items-center text-sm text-gray-300 cursor-pointer">
                        <input type="radio" name="catalogVerification" value={val} checked={generalSettings.catalogVerification === val} onChange={handleGeneralSettingChange} className="form-radio h-4 w-4 text-primary bg-gray-600 border-gray-500 focus:ring-primary"/>
                        <span className="ml-2">{val === 'yes' ? 'Sim' : 'Não'}</span>
                        </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'juicyads' && (
            <div id="juicyads-settings-tab" className="bg-admin-card-bg p-6 rounded-b-lg shadow-md animate-fadeIn">
              <h2 className="text-xl font-semibold text-gray-200 mb-4">Configurações JuicyAds</h2>
              <div className="space-y-6">
                <div>
                  <span className={labelClass}>Habilitar JuicyAds:</span>
                  <div className="mt-2 flex space-x-4">
                    {juicyAdsOptions.map(opt => (
                        <label key={opt.value} className="flex items-center text-sm text-gray-300 cursor-pointer">
                        <input
                            type="radio"
                            name="juicyAdsEnabled"
                            value={opt.value}
                            checked={juicyAdsSettings.juicyAdsEnabled.toString() === opt.value}
                            onChange={handleJuicyAdsSettingChange}
                            className="form-radio h-4 w-4 text-primary bg-gray-600 border-gray-500 focus:ring-primary"/>
                        <span className="ml-2">{opt.label}</span>
                        </label>
                    ))}
                  </div>
                </div>
                {(Object.keys(juicyAdsSettings) as Array<keyof JuicyAdsSettings>)
                    .filter(key => key !== 'juicyAdsEnabled')
                    .map(key => {
                        let labelText = key.replace(/([A-Z])/g, ' $1').replace('juicy Ads Spot', '').trim();
                        labelText = labelText.charAt(0).toUpperCase() + labelText.slice(1); // Capitalize
                        if (key.includes('728x90')) labelText = `Banner 728x90 Spot ID`;
                        else if (key.includes('300x250')) labelText = `Banner 300x250 Spot ID`;
                        else if (key.includes('MobileBanner300x100')) labelText = `Mobile Banner 300x100 Spot ID`;
                        else if (key.includes('Popunder')) labelText = `Popunder Spot ID`;
                        
                        return (
                            <div key={key}>
                                <label htmlFor={key} className={labelClass}>{labelText}:</label>
                                <input type="text" id={key} name={key} value={juicyAdsSettings[key] || ''} onChange={handleJuicyAdsSettingChange} className={inputClass} placeholder="Insira o Spot ID"/>
                            </div>
                        );
                 })}
              </div>
            </div>
          )}

          {activeTab === 'theme' && (
            <div id="theme-settings-tab" className="bg-admin-card-bg p-6 rounded-b-lg shadow-md animate-fadeIn">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-200">Personalização do Tema</h2>
                <button onClick={handleRestoreDefaultTheme} className="text-xs bg-gray-600 hover:bg-gray-500 text-white py-1 px-3 rounded-md flex items-center">
                   <FaUndo className="mr-1.5"/> Restaurar Padrões
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(Object.keys(themeSettings) as Array<keyof ThemeSettings>).map(key => (
                  <div key={key}>
                    <label htmlFor={`theme-${key}`} className={`${labelClass} flex items-center`}>
                      {themeColorLabels[key] || key}:
                      <input
                        type="color"
                        id={`theme-${key}-picker`}
                        name={key}
                        value={themeSettings[key]}
                        onChange={handleThemeSettingChange}
                        className="ml-2 h-6 w-8 p-0 border-none rounded cursor-pointer"
                        title="Selecionar cor"
                      />
                    </label>
                    <input
                      type="text"
                      id={`theme-${key}`}
                      name={key}
                      value={themeSettings[key]}
                      onChange={handleThemeSettingChange}
                      className={`${inputClass} mt-0.5`}
                      placeholder="#RRGGBB"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}


          {activeTab === 'sitemap' && (
            <div id="sitemap-settings-tab" className="bg-admin-card-bg p-6 rounded-b-lg shadow-md animate-fadeIn">
              <h2 className="text-xl font-semibold text-gray-200 mb-4">Geração de Sitemap</h2>
              <form onSubmit={(e) => {e.preventDefault(); handleGenerateSitemap();}} className="space-y-4">
                <div>
                  <label htmlFor="sitemapType" className={labelClass}>Tipo de Conteúdo para Sitemap:</label>
                  <select id="sitemapType" value={sitemapType} onChange={(e) => setSitemapType(e.target.value as 'a' | 'e' | 't')} className={inputClass}>
                    <option value="a">Apenas Animes (páginas de detalhe)</option>
                    <option value="e">Apenas Episódios (páginas de player)</option>
                    <option value="t">Ambos (Animes e Episódios)</option>
                  </select>
                </div>
                <button type="submit" className={saveButtonClass} disabled={isGeneratingSitemap}>
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

          {/* Botão Salvar para abas General, JuicyAds e Theme */}
          {activeTab !== 'sitemap' && (
            <div className="mt-8 flex justify-end">
                <button onClick={() => handleSaveSettings()} className={saveButtonClass} disabled={isSubmitting}>
                <FaSave className="mr-2"/> {isSubmitting ? 'Salvando...' : 'Salvar Configurações da Aba Atual'}
                </button>
            </div>
          )}
        </>
      )}
      <style>
        {`
        .animate-fadeIn { animation: fadeIn 0.5s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        `}
      </style>
    </div>
  );
};

export default AdminSettingsPage;
