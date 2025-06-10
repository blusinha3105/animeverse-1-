
import React from 'react';
import { FaEnvelope, FaDiscord, FaInfoCircle } from 'react-icons/fa'; // Using Fa from react-icons

const ContactPage: React.FC = () => {
  return (
    <div className="prose prose-sm sm:prose-base prose-invert max-w-4xl mx-auto p-6 bg-card rounded-lg shadow-xl">
      <h1>Entre em Contato</h1>
      <p>
        Se você tiver alguma dúvida, sugestão, relatório de bug ou qualquer outro assunto 
        relacionado ao AnimeVerse, não hesite em nos contatar. Estamos aqui para ajudar!
      </p>

      <h2>Formas de Contato</h2>
      
      <div className="my-4 p-4 bg-gray-700 rounded-md">
        <h3 className="flex items-center"><FaEnvelope className="mr-2" /> Email</h3>
        <p>
          Para suporte geral, parcerias ou questões formais, você pode nos enviar um email para:
        </p>
        <p>
          <a href="mailto:suporte@animeverse.com" className="text-primary hover:underline">suporte@animeverse.com</a> 
          (Este é um email de exemplo, substitua pelo seu)
        </p>
      </div>

      <div className="my-4 p-4 bg-gray-700 rounded-md">
        <h3 className="flex items-center"><FaDiscord className="mr-2" /> Discord</h3>
        <p>
          Junte-se à nossa comunidade no Discord para discussões, anúncios e suporte mais rápido da comunidade e moderadores:
        </p>
        <p>
          <a href="https://discord.gg/seuservidor" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Clique aqui para entrar no nosso servidor Discord
          </a> 
          (Substitua pelo link real do seu servidor)
        </p>
      </div>
      
      <div className="my-4 p-4 bg-gray-700 rounded-md">
        <h3 className="flex items-center"><FaInfoCircle className="mr-2" /> Informações Adicionais</h3>
        <p>
          Antes de entrar em contato, por favor, verifique nossa seção de <a href="#/support" className="text-primary hover:underline">Suporte/FAQ</a>, 
          onde você pode encontrar respostas para perguntas comuns.
        </p>
        <p>
          Nosso objetivo é responder a todas as perguntas o mais rápido possível. Obrigado pela sua paciência!
        </p>
      </div>
    </div>
  );
};

export default ContactPage;
