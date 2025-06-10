
import React from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME } from '../constants';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer 
      className="bg-card text-text-secondary py-6 px-4 md:px-8 flex-shrink-0" 
      style={{ boxShadow: "0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)" }}
    >
      <div className="container mx-auto text-center text-sm">
        <p>&copy; {currentYear} {APP_NAME}. Todos os direitos reservados.</p>
        <nav className="mt-2 space-x-4">
          <Link to="/terms" className="hover:text-text-primary hover:underline">Termos de Serviço</Link>
          <span>|</span>
          <Link to="/privacy" className="hover:text-text-primary hover:underline">Política de Privacidade</Link>
          <span>|</span>
          <Link to="/contact" className="hover:text-text-primary hover:underline">Contato</Link>
          <span>|</span>
          <Link to="/dmca" className="hover:text-text-primary hover:underline">DMCA</Link>
        </nav>
        {/* Placeholder for social media icons if desired */}
        {/* <div className="mt-4 flex justify-center space-x-4">
          <a href="#" aria-label="Facebook" className="hover:text-primary"><FaFacebookF size={18}/></a>
          <a href="#" aria-label="Twitter" className="hover:text-primary"><FaTwitter size={18}/></a>
          <a href="#" aria-label="Instagram" className="hover:text-primary"><FaInstagram size={18}/></a>
        </div> */}
      </div>
    </footer>
  );
};

export default Footer;
