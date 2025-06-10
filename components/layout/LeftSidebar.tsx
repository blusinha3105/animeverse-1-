import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  FaHouseSignal, FaAtom, FaPeopleGroup, FaNewspaper, 
  FaClock, FaBookmark, FaDownload, 
  FaSliders, FaRightFromBracket, FaUserSecret, FaRightToBracket
} from 'react-icons/fa6';

const LeftSidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean; isPending: boolean; }) => // Matched NavLink v6 props
    `flex items-center px-3 py-2.5 text-sm rounded-md transition-colors duration-150 ease-in-out group
     ${isActive 
       ? 'bg-primary-action text-white shadow-lg' 
       : 'text-text-secondary hover:bg-card hover:text-text-primary'
     }`;
  
  const iconClasses = "h-5 w-5 mr-3 text-gray-400 group-hover:text-primary transition-colors";
  const activeIconClasses = "h-5 w-5 mr-3 text-white";


  return (
    <aside className="w-60 bg-card flex-shrink-0 flex flex-col h-full shadow-lg">
      {/* App Name/Logo removed from here, moved to global Header */}
      <div className="h-16"> {/* Placeholder for spacing if needed, or remove if Header handles all top bar */}
        {/* This div can be removed if the Header component is styled to visually connect or if no top spacing is desired here */}
      </div>
      <nav className="flex-grow p-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">MENU</p>
        <NavLink to="/" className={navLinkClasses} end>
          {({isActive}: { isActive: boolean; isPending: boolean; }) => (
            <>
              <FaHouseSignal className={isActive ? activeIconClasses : iconClasses} /> Início
            </>
          )}
        </NavLink>
        <NavLink to="/discovery" className={navLinkClasses}>
          {({isActive}: { isActive: boolean; isPending: boolean; }) => (
            <>
              <FaAtom className={isActive ? activeIconClasses : iconClasses} /> Descobrir
            </>
          )}
        </NavLink>
        <NavLink to="/community" className={navLinkClasses}>
         {({isActive}: { isActive: boolean; isPending: boolean; }) => ( 
            <>
              <FaPeopleGroup className={isActive ? activeIconClasses : iconClasses} /> Comunidade
            </>
          )}
        </NavLink>
        <NavLink to="/news" className={navLinkClasses}>
          {({isActive}: { isActive: boolean; isPending: boolean; }) => (
            <>
              <FaNewspaper className={isActive ? activeIconClasses : iconClasses} /> Notícias
            </>
          )}
        </NavLink>

        <p className="px-3 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">BIBLIOTECA</p>
        <NavLink to="/recent" className={navLinkClasses}>
          {({isActive}: { isActive: boolean; isPending: boolean; }) => (
            <>
              <FaClock className={isActive ? activeIconClasses : iconClasses} /> Recentes
            </>
          )}
        </NavLink>
        <NavLink to="/my-collection" className={navLinkClasses}>
          {({isActive}: { isActive: boolean; isPending: boolean; }) => (
            <>
              <FaBookmark className={isActive ? activeIconClasses : iconClasses} /> Minha Coleção
            </>
          )}
        </NavLink>
        <NavLink to="/download" className={navLinkClasses}>
          {({isActive}: { isActive: boolean; isPending: boolean; }) => (
            <>
              <FaDownload className={isActive ? activeIconClasses : iconClasses} /> Downloads
            </>
          )}
        </NavLink>
        
        {user?.admin && (
           <NavLink 
             to="/admin/dashboard" 
             className="flex items-center px-3 py-2.5 text-sm text-yellow-400 hover:bg-yellow-900/50 hover:text-yellow-300 rounded-md transition-colors group"
           >
            <FaUserSecret className="h-5 w-5 mr-3 text-yellow-500 group-hover:text-yellow-300"/> Painel Admin
           </NavLink>
        )}
      </nav>
      <div className="p-3 space-y-1.5">
        <NavLink to="/settings" className={navLinkClasses}>
          {({isActive}: { isActive: boolean; isPending: boolean; }) => (
            <>
              <FaSliders className={isActive ? activeIconClasses : iconClasses} /> Configurações
            </>
          )}
        </NavLink>
        {user ? (
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2.5 text-sm text-text-secondary hover:bg-card hover:text-text-primary rounded-md transition-colors group"
          >
            <FaRightFromBracket className={iconClasses} /> Sair
          </button>
        ) : (
          <NavLink to="/login" className={navLinkClasses}>
            {({isActive}: { isActive: boolean; isPending: boolean; }) => (
              <>
                <FaRightToBracket className={isActive ? activeIconClasses : iconClasses} /> Entrar
              </>
            )}
          </NavLink>
        )}
      </div>
    </aside>
  );
};

export default LeftSidebar;