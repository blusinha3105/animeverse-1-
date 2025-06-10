
import React from 'react';

const DMCAPage: React.FC = () => {
  return (
    <div className="prose prose-sm sm:prose-base prose-invert max-w-4xl mx-auto p-6 bg-card rounded-lg shadow-xl">
      <h1>Política DMCA (Digital Millennium Copyright Act)</h1>
      <p>Última atualização: [Data]</p>

      <p>
        AnimeVerse ("Nós", "Nosso") respeita os direitos de propriedade intelectual de terceiros e espera que seus usuários façam o mesmo. 
        De acordo com a Digital Millennium Copyright Act (DMCA), Título 17, Código dos Estados Unidos, Seção 512(c), um proprietário de 
        direitos autorais ou seu agente pode nos enviar uma notificação de remoção por meio de nosso Agente DMCA listado abaixo.
      </p>

      <h2>Notificação de Infração de Direitos Autorais</h2>
      <p>
        Se você é um proprietário de direitos autorais ou um agente e acredita que qualquer material disponível em nossos serviços 
        infringe seus direitos autorais, você pode enviar uma notificação por escrito de acordo com a DMCA, fornecendo ao nosso Agente DMCA 
        as seguintes informações:
      </p>
      <ol>
        <li>Uma assinatura física ou eletrônica de uma pessoa autorizada a agir em nome do proprietário de um direito exclusivo que supostamente foi violado.</li>
        <li>Identificação da obra protegida por direitos autorais alegadamente violada ou, se várias obras protegidas por direitos autorais em um único site online forem cobertas por uma única notificação, uma lista representativa de tais obras naquele site.</li>
        <li>Identificação do material que se alega estar infringindo ou ser objeto de atividade infratora e que deve ser removido ou cujo acesso deve ser desativado, e informações razoavelmente suficientes para permitir que o provedor de serviços localize o material. Fornecer URLs no corpo de um email é a melhor maneira de nos ajudar a localizar o conteúdo rapidamente.</li>
        <li>Informações razoavelmente suficientes para permitir que o provedor de serviços entre em contato com você, como endereço, número de telefone e, se disponível, um endereço de correio eletrônico.</li>
        <li>Uma declaração de que você acredita de boa fé que o uso do material da maneira reclamada não é autorizado pelo proprietário dos direitos autorais, seu agente ou pela lei.</li>
        <li>Uma declaração de que as informações na notificação são precisas e, sob pena de perjúrio, que você está autorizado a agir em nome do proprietário de um direito exclusivo que supostamente foi violado.</li>
      </ol>
      <p>
        O Título 17 USC §512(f) prevê penalidades civis por danos, incluindo custos e honorários advocatícios, contra qualquer pessoa que 
        intencionalmente e materialmente deturpe certas informações em uma notificação de infração sob 17 USC §512(c)(3).
      </p>
      <p>
        Envie todas as notificações de remoção através da nossa página de Contato ou diretamente para o nosso Agente DMCA:
      </p>
      <p>
        <strong>Agente DMCA Designado:</strong> [Nome do Agente DMCA / Departamento Legal]<br/>
        <strong>Email:</strong> [dmca@animeverse.com] (Este é um email de exemplo, substitua pelo seu)<br/>
        <strong>Endereço Postal:</strong> [Seu Endereço Postal, se aplicável]
      </p>
      <p>
        Observe que podemos compartilhar a identidade e as informações em qualquer reclamação de violação de direitos autorais que recebermos 
        com o suposto infrator. Ao enviar uma reclamação, você entende, aceita e concorda que sua identidade e reclamação podem ser 
        comunicadas ao suposto infrator.
      </p>

      <h2>Contranotificação</h2>
      <p>
        Se você recebeu uma notificação de que o material foi removido devido a uma reclamação de violação de direitos autorais, você pode nos 
        fornecer uma contranotificação na tentativa de restaurar o material em questão no site. A referida notificação deve ser feita por 
        escrito ao nosso Agente DMCA e deve conter substancialmente os seguintes elementos de acordo com 17 USC Seção 512(g)(3):
      </p>
      <ol>
        <li>Sua assinatura física ou eletrônica.</li>
        <li>Uma descrição do material que foi removido e o local original do material antes de ser removido.</li>
        <li>Uma declaração sua, sob pena de perjúrio, de que você acredita de boa fé que o material foi removido ou desativado como resultado de erro ou identificação incorreta do material a ser removido ou desativado.</li>
        <li>Seu nome, endereço e número de telefone, e uma declaração de que você concorda com a jurisdição do tribunal federal distrital para o distrito judicial em que o endereço está localizado (ou se você estiver fora dos Estados Unidos, para qualquer distrito judicial em que o provedor de serviços possa ser encontrado), e que você aceitará a citação do processo da pessoa ou empresa que forneceu a notificação original de infração.</li>
      </ol>
      
      <h2>Política de Infratores Recorrentes</h2>
      <p>
        Levamos a violação de direitos autorais muito a sério. De acordo com os requisitos da política de infratores recorrentes da Digital Millennium Copyright Act, 
        mantemos uma lista de avisos DMCA de detentores de direitos autorais e fazemos um esforço de boa fé para identificar quaisquer infratores recorrentes. 
        Aqueles que violarem nossa política de infratores recorrentes terão suas contas encerradas.
      </p>

      <p>
        Reservamo-nos o direito de modificar o conteúdo desta página e sua política para lidar com reclamações da DMCA a qualquer momento. 
        Aconselhamos que você verifique esta página com frequência para quaisquer alterações.
      </p>
    </div>
  );
};

export default DMCAPage;
