
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  FaHouseSignal, FaAtom, FaPeopleGroup, FaNewspaper, 
  FaClock, FaBookmark, FaDownload, 
  FaSliders, FaRightFromBracket, FaUserSecret, FaRightToBracket, FaXmark // Changed FaTimes to FaXmark
} from 'react-icons/fa6';

interface LeftSidebarProps {
  isMobileSidebarOpen: boolean;
  isMobileView: boolean;
  closeMobileSidebar: () => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ isMobileSidebarOpen, isMobileView, closeMobileSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    closeMobileSidebar(); // Close sidebar on logout if mobile
    navigate('/');
  };

  const handleNavLinkClick = () => {
    if (isMobileView) {
      closeMobileSidebar();
    }
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean; }) =>
    `flex items-center px-3 py-2.5 text-sm rounded-md transition-colors duration-150 ease-in-out group
     ${isActive 
       ? 'bg-primary-action text-white shadow-lg' 
       : 'text-text-secondary hover:bg-card hover:text-text-primary'
     }`;
  
  const iconClasses = "h-5 w-5 mr-3 text-gray-400 group-hover:text-primary transition-colors";
  const activeIconClasses = "h-5 w-5 mr-3 text-white";

  const sidebarBaseClasses = "bg-card flex-shrink-0 flex flex-col h-full shadow-lg transition-transform duration-300 ease-in-out";
  const desktopClasses = "md:w-60 md:relative md:translate-x-0";
  const mobileClasses = `fixed inset-y-0 left-0 z-50 w-60 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`;

  return (
    <aside className={`${sidebarBaseClasses} ${isMobileView ? mobileClasses : desktopClasses}`}>
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700/50">
        {/* Placeholder for logo/app name if needed inside sidebar, or keep it clean */}
        <span className="text-xl font-bold text-primary">AnimeVerse</span>
        {isMobileView && (
          <button onClick={closeMobileSidebar} className="text-text-secondary hover:text-white p-1">
            <FaXmark size={20} /> {/* Changed FaTimes to FaXmark */}
          </button>
        )}
      </div>
      <nav className="flex-grow p-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">MENU</p>
        <NavLink to="/" className={navLinkClasses} onClick={handleNavLinkClick} end>
          {({isActive}) => (<><FaHouseSignal className={isActive ? activeIconClasses : iconClasses} /> Início</>)}
        </NavLink>
        <NavLink to="/discovery" className={navLinkClasses} onClick={handleNavLinkClick}>
          {({isActive}) => (<><FaAtom className={isActive ? activeIconClasses : iconClasses} /> Descobrir</>)}
        </NavLink>
        <NavLink to="/community" className={navLinkClasses} onClick={handleNavLinkClick}>
         {({isActive}) => (<><FaPeopleGroup className={isActive ? activeIconClasses : iconClasses} /> Comunidade</>)}
        </NavLink>
        <NavLink to="/news" className={navLinkClasses} onClick={handleNavLinkClick}>
          {({isActive}) => (<><FaNewspaper className={isActive ? activeIconClasses : iconClasses} /> Notícias</>)}
        </NavLink>

        <p className="px-3 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">BIBLIOTECA</p>
        <NavLink to="/recent" className={navLinkClasses} onClick={handleNavLinkClick}>
          {({isActive}) => (<><FaClock className={isActive ? activeIconClasses : iconClasses} /> Recentes</>)}
        </NavLink>
        <NavLink to="/my-collection" className={navLinkClasses} onClick={handleNavLinkClick}>
          {({isActive}) => (<><FaBookmark className={isActive ? activeIconClasses : iconClasses} /> Minha Coleção</>)}
        </NavLink>
        <NavLink to="/download" className={navLinkClasses} onClick={handleNavLinkClick}>
          {({isActive}) => (<><FaDownload className={isActive ? activeIconClasses : iconClasses} /> Downloads</>)}
        </NavLink>
        
        {user?.admin && (
           <NavLink 
             to="/admin/dashboard" 
             onClick={handleNavLinkClick}
             className="flex items-center px-3 py-2.5 text-sm text-yellow-400 hover:bg-yellow-900/50 hover:text-yellow-300 rounded-md transition-colors group"
           >
            <FaUserSecret className="h-5 w-5 mr-3 text-yellow-500 group-hover:text-yellow-300"/> Painel Admin
           </NavLink>
        )}
      </nav>
      <div className="p-3 space-y-1.5 border-t border-gray-700/50">
        <NavLink to="/settings" className={navLinkClasses} onClick={handleNavLinkClick}>
          {({isActive}) => (<><FaSliders className={isActive ? activeIconClasses : iconClasses} /> Configurações</>)}
        </NavLink>
        {user ? (
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2.5 text-sm text-text-secondary hover:bg-card hover:text-text-primary rounded-md transition-colors group"
          >
            <FaRightFromBracket className={iconClasses} /> Sair
          </button>
        ) : (
          <NavLink to="/login" className={navLinkClasses} onClick={handleNavLinkClick}>
            {({isActive}) => (<><FaRightToBracket className={isActive ? activeIconClasses : iconClasses} /> Entrar</>)}
          </NavLink>
        )}
      </div>
    </aside>
  );
};

export default LeftSidebar;
