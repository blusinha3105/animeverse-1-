
import React from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME } from '../constants';

interface FooterProps {
  isFooterVisible: boolean;
}

const Footer: React.FC<FooterProps> = ({ isFooterVisible }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer 
      className={`bg-card text-text-secondary py-4 px-4 md:px-8 flex-shrink-0 transition-all duration-500 ease-in-out
                  ${isFooterVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'}`}
      style={{ boxShadow: "0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)" }}
      aria-hidden={!isFooterVisible} // Hide from accessibility tree when not visible
    >
      <div className="container mx-auto text-center text-sm">
        <p>&copy; {currentYear} {APP_NAME}. Todos os direitos reservados.</p>
        <nav className="mt-1">
          <Link to="/terms" className="hover:text-text-primary hover:underline">Termos de Serviço</Link>
          <span className="mx-2">|</span>
          <Link to="/privacy" className="hover:text-text-primary hover:underline">Política de Privacidade</Link>
          <span className="mx-2">|</span>
          <Link to="/contact" className="hover:text-text-primary hover:underline">Contato</Link>
          <span className="mx-2">|</span>
          <Link to="/dmca" className="hover:text-text-primary hover:underline">DMCA</Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
