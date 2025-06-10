
import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-3xl font-semibold text-text-primary mb-6">Página Não Encontrada</h2>
      <p className="text-text-secondary mb-8 max-w-md">
        Oops! A página que você está procurando não existe. Pode ter sido movida ou excluída.
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-primary hover:bg-secondary text-white font-semibold rounded-lg shadow-md transition-colors duration-300"
      >
        Voltar para Início
      </Link>
    </div>
  );
};

export default NotFoundPage;