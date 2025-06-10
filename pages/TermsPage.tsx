
import React from 'react';

const TermsPage: React.FC = () => {
  return (
    <div className="prose prose-sm sm:prose-base prose-invert max-w-4xl mx-auto p-6 bg-card rounded-lg shadow-xl">
      <h1>Termos de Serviço</h1>
      <p>Última atualização: [Data]</p>

      <h2>1. Aceitação dos Termos</h2>
      <p>
        Ao acessar e usar o AnimeVerse (o "Serviço"), você aceita e concorda em ficar vinculado 
        pelos termos e disposições deste acordo. Além disso, ao usar estes serviços específicos, 
        você estará sujeito a quaisquer diretrizes ou regras publicadas aplicáveis a esses serviços.
      </p>

      <h2>2. Descrição do Serviço</h2>
      <p>
        O AnimeVerse fornece aos usuários acesso a uma coleção de conteúdo de anime, 
        funcionalidades da comunidade e outras informações relacionadas. Você entende e concorda que o Serviço 
        pode incluir certas comunicações do AnimeVerse, como anúncios de serviço e mensagens administrativas, 
        e que essas comunicações são consideradas parte da assinatura do AnimeVerse.
      </p>

      <h2>3. Conduta do Usuário</h2>
      <p>
        Você concorda em não usar o Serviço para:
        <ul>
          <li>Fazer upload, postar, enviar por email, transmitir ou de outra forma disponibilizar qualquer conteúdo que seja ilegal, prejudicial, ameaçador, abusivo, ofensivo, difamatório, vulgar, obsceno, invasivo da privacidade de outrem, odioso ou racialmente, etnicamente ou de outra forma censurável;</li>
          <li>Prejudicar menores de qualquer forma;</li>
          <li>Personificar qualquer pessoa ou entidade, incluindo, mas não se limitando a, um oficial do AnimeVerse, ou declarar falsamente ou de outra forma deturpar sua afiliação com uma pessoa ou entidade;</li>
        </ul>
        (Esta é uma lista de exemplo, adicione mais conforme necessário)
      </p>
      
      <h2>4. Direitos de Propriedade Intelectual</h2>
      <p>
        Todo o conteúdo incluído no Serviço, como texto, gráficos, logotipos, ícones de botões, imagens, clipes de áudio, 
        downloads digitais, compilações de dados e software, é propriedade do AnimeVerse ou de seus 
        fornecedores de conteúdo e protegido pelas leis internacionais de direitos autorais.
      </p>

      <h2>5. Isenção de Garantias</h2>
      <p>
        O serviço é fornecido "como está" e "conforme disponível". O AnimeVerse não oferece garantias, 
        expressas ou implícitas, e por meio deste se isenta e nega todas as outras garantias...
      </p>

      <h2>6. Limitação de Responsabilidade</h2>
      <p>
        Em nenhum caso o AnimeVerse ou seus fornecedores serão responsáveis por quaisquer danos (incluindo, sem limitação, 
        danos por perda de dados ou lucro, ou devido a interrupção dos negócios)...
      </p>

      <h2>7. Modificações nos Termos</h2>
      <p>
        O AnimeVerse reserva-se o direito de revisar estes termos a qualquer momento sem aviso prévio. Ao usar este 
        Serviço, você concorda em ficar vinculado pela versão atual destes Termos de Serviço.
      </p>

      <h2>8. Lei Aplicável</h2>
      <p>
        Qualquer reivindicação relacionada ao site do AnimeVerse será regida pelas leis da jurisdição de 
        [Sua Jurisdição] sem levar em conta o conflito de disposições legais.
      </p>

      <p>Para quaisquer perguntas sobre estes Termos, entre em contato conosco em [Seu Email de Contato].</p>
    </div>
  );
};

export default TermsPage;
