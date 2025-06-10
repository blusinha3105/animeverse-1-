import React, { useState, useEffect } from 'react';
import { FaBell, FaPaperPlane, FaTimes, FaDiscord, FaCopy } from 'react-icons/fa';
import { apiService } from '../../../services/apiService'; 
import { useAuth } from '../../../hooks/useAuth';

const AdminBroadcastMessagePage: React.FC = () => {
  const { token } = useAuth();
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [previewTitulo, setPreviewTitulo] = useState('Título do Aviso');
  const [previewConteudo, setPreviewConteudo] = useState('Este é o conteúdo do aviso que será exibido aos usuários.');
  const [showAlertPreview, setShowAlertPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);


  useEffect(() => {
    setPreviewTitulo(titulo || 'Título do Aviso');
  }, [titulo]);

  useEffect(() => {
    setPreviewConteudo(conteudo || 'Este é o conteúdo do aviso que será exibido aos usuários.');
  }, [conteudo]);

  const handleSendAviso = async () => {
    if (!titulo.trim() || !conteudo.trim()) {
      alert('Título e conteúdo são obrigatórios.');
      return;
    }
    if (!token) {
      alert('Autenticação necessária.');
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(true);
    console.log('Enviando Aviso:', { titulo, conteudo });
    try {
      await apiService.adminSendBroadcastMessage({ titulo, conteudo }, token);
      alert('Aviso enviado com sucesso!');
      // setTitulo(''); // Keep fields for review or clear them
      // setConteudo('');
      setShowAlertPreview(true); 
    } catch (error) {
      alert(`Erro ao enviar aviso: ${(error as Error).message}`);
      console.error(error);
    } finally {
        setIsSubmitting(false);
    }
  };

  const copyToClipboard = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy)
      .then(() => alert('Texto HTML copiado para a área de transferência! Cole no campo "Conteúdo".'))
      .catch(err => {
        console.error('Erro ao copiar texto: ', err);
        alert("Falha ao copiar texto.");
      });
  };

  const inputClass = "mt-1 block w-full bg-gray-700 text-gray-200 rounded-md shadow-sm p-2 focus:ring-primary focus:border-transparent text-sm";
  const labelClass = "block text-sm font-medium text-gray-400";
  const buttonClass = "bg-primary hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm flex items-center justify-center disabled:opacity-50";

  const htmlExamples = [
    { text: '<a href="https://seusite.com" target="_blank">Visite nosso site!</a>', display: '<a href="https://seusite.com" target="_blank" class="text-blue-400 hover:underline">Visite nosso site!</a>' },
    { text: '<a href="https://discord.gg/seuconvite" target="_blank" style="color: #7289DA; text-decoration: none;">Nosso Discord <i class="fab fa-discord"></i></a>', display: '<a href="#" target="_blank" class="text-blue-400 hover:underline">Nosso Discord <i class="fab fa-discord"></i></a> <FaDiscord class="inline text-indigo-400"/>' },
    { text: '<strong>Texto em negrito</strong> e <em>texto em itálico</em>', display: '<strong>Texto em negrito</strong> e <em>texto em itálico</em>' },
    { text: 'Nova temporada de <b>Anime X</b> lançada!', display: 'Nova temporada de <b>Anime X</b> lançada!' },
    { text: '<span style="color: red;">Aviso Importante!</span>', display: '<span style="color: red;">Aviso Importante!</span>'},
    { text: 'Manutenção programada para <u>amanhã às 02:00</u>.', display: 'Manutenção programada para <u>amanhã às 02:00</u>.'}
  ];

  return (
    <div className="p-2 md:p-4 bg-admin-bg rounded-lg shadow-xl">
      <h1 className="text-2xl font-semibold text-primary mb-6">Enviar Mensagem para Todos (Aviso Global)</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formulário de Envio */}
        <div className="bg-admin-card-bg p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-200 mb-4">Criar Novo Aviso</h2>
          <form onSubmit={(e) => {e.preventDefault(); handleSendAviso();}} className="space-y-4">
            <div>
              <label htmlFor="titulo-msg" className={labelClass}>Título do Aviso:</label>
              <input 
                type="text" 
                id="titulo-msg" 
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className={inputClass}
                placeholder="Ex: Manutenção Programada"
                required 
              />
            </div>
            <div>
              <label htmlFor="conteudo-msg" className={labelClass}>Conteúdo do Aviso (suporta HTML básico):</label>
              <textarea 
                id="conteudo-msg" 
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                rows={5}
                className={`${inputClass} custom-scrollbar`}
                placeholder="Detalhes do aviso. Ex: O site estará em manutenção das 02:00 às 03:00."
                required 
              />
            </div>
            <button type="submit" className={`${buttonClass} w-full`} disabled={isSubmitting}>
              <FaPaperPlane className="mr-2" /> {isSubmitting ? 'Enviando...' : 'Enviar Aviso'}
            </button>
          </form>
        </div>

        {/* Pré-visualização e Exemplos */}
        <div className="space-y-6">
            <div className="bg-admin-card-bg p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-200 mb-4">Pré-visualização do Aviso Ativo</h2>
                 {!showAlertPreview && !(titulo || conteudo) && (
                    <div className="text-center text-gray-400 py-4">
                        <p>A pré-visualização do aviso aparecerá aqui ao preencher os campos ou após o envio.</p>
                    </div>
                )}
                {(showAlertPreview || titulo || conteudo) && ( 
                    <div className={`p-3 shadow-md rounded-md relative ${showAlertPreview ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300'}`}>
                        {showAlertPreview && (
                            <button 
                                onClick={() => setShowAlertPreview(false)} 
                                className="absolute top-2 right-2 text-xl font-bold hover:text-gray-200 focus:outline-none"
                                aria-label="Fechar pré-visualização"
                            >
                                <FaTimes />
                            </button>
                        )}
                        <div className="flex items-start">
                            <FaBell size={20} className={`mr-3 mt-1 flex-shrink-0 ${showAlertPreview ? 'text-yellow-300' : 'text-gray-500'}`} />
                            <div>
                                <strong className="font-semibold block">{previewTitulo}</strong>
                                <div 
                                    className="text-sm prose prose-sm prose-invert max-w-none" 
                                    dangerouslySetInnerHTML={{ __html: previewConteudo.replace(/\n/g, '<br />') }}
                                ></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-admin-card-bg p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-200 mb-4">Exemplos de Conteúdo HTML</h2>
                <div className="space-y-3 text-sm max-h-60 overflow-y-auto custom-scrollbar pr-2">
                    {htmlExamples.map((item, index) => (
                        <div key={index} className="bg-gray-700 p-3 rounded-md">
                            <p className="text-xs text-gray-400 mb-1">HTML (clique para copiar):</p>
                            <code 
                                className="text-xs text-yellow-300 bg-gray-800 p-1 rounded block overflow-x-auto cursor-pointer custom-scrollbar"
                                onClick={() => copyToClipboard(item.text)}
                                title="Clique para copiar"
                            >
                                {item.text}
                            </code>
                            <p className="text-xs text-gray-400 mt-2 mb-1">Resultado:</p>
                            <div className="text-gray-300 prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: item.display }}></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBroadcastMessagePage;