

import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
    FaDisplay, FaCirclePlus, FaPenToSquare, FaTv, 
    FaScrewdriverWrench, FaGears, FaRobot, FaBullhorn,
    FaComments, FaLifeRing, FaNewspaper, FaUsersGear,
    FaTableColumns, FaAnglesLeft, FaAnglesRight, FaUsers // Changed FaUsersCog to FaUsers
} from 'react-icons/fa6'; 
import { useAuth } from '../../hooks/useAuth'; 
import { resolveImageUrl, DEFAULT_PLACEHOLDER_IMAGE, APP_NAME } from '../../constants';

interface AdminSidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  isMobile?: boolean; // To indicate if it's in mobile view for slightly different behavior
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, toggleSidebar, isMobile }) => {
  const { user } = useAuth(); 

  const navLinkClasses = ({ isActive }: { isActive: boolean } ) =>
    `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150 ease-in-out
     ${isActive ? 'bg-primary text-white shadow-lg' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`;

  const iconClasses = "mr-3 h-5 w-5 flex-shrink-0"; // Added flex-shrink-0
  const textClasses = "truncate"; // Ensure text truncates if sidebar is very narrow (though not the primary collapsed state)

  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-30 bg-admin-sidebar-bg shadow-xl transition-all duration-300 ease-in-out custom-scrollbar overflow-y-auto
                  ${isOpen ? 'w-64' : 'w-16 hover:w-64 group'} md:relative md:translate-x-0 
                  ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}`}
    >
      <div className="flex items-center justify-between h-16 px-4 bg-gray-900 shadow-md">
        <span className={`text-xl font-bold text-white ${!isOpen && 'hidden group-hover:block'}`}>{APP_NAME} Admin</span>
        <button 
            onClick={toggleSidebar} 
            className="text-gray-300 hover:text-white p-1 rounded md:hidden" // Only show toggle on md for collapsing fully
            aria-label={isOpen ? "Fechar sidebar" : "Abrir sidebar"}
        >
            {isOpen ? <FaAnglesLeft size={20} /> : <FaAnglesRight size={20} />}
        </button>
      </div>
      <nav className="mt-6 px-3 space-y-1.5"> {/* Adjusted space-y */}
        {/* Links updated to show icon only when collapsed, text on hover/open */}
        <NavLink to="/admin/dashboard" className={navLinkClasses} title="Início">
          <FaDisplay className={iconClasses} /> <span className={`${!isOpen && 'hidden group-hover:inline'} ${textClasses}`}>Início</span>
        </NavLink>
        <NavLink to="/admin/users" className={navLinkClasses} title="Gerenciar Usuários">
          <FaUsers className={iconClasses} /> <span className={`${!isOpen && 'hidden group-hover:inline'} ${textClasses}`}>Gerenciar Usuários</span>
        </NavLink>
        <NavLink to="/admin/insert-catalog" className={navLinkClasses} title="Inserir Catálogo">
          <FaCirclePlus className={iconClasses} /> <span className={`${!isOpen && 'hidden group-hover:inline'} ${textClasses}`}>Inserir Catálogo</span>
        </NavLink>
        <NavLink to="/admin/edit-catalog" className={navLinkClasses} title="Editar Catálogo">
          <FaPenToSquare className={iconClasses} /> <span className={`${!isOpen && 'hidden group-hover:inline'} ${textClasses}`}>Editar Catálogo</span>
        </NavLink>
         <NavLink to="/admin/home-sections" className={navLinkClasses} title="Gerenciar Homepage">
          <FaTableColumns className={iconClasses} /> <span className={`${!isOpen && 'hidden group-hover:inline'} ${textClasses}`}>Gerenciar Homepage</span>
        </NavLink>
        <NavLink to="/admin/add-exibir" className={navLinkClasses} title="Adicionar Exibir">
          <FaTv className={iconClasses} /> <span className={`${!isOpen && 'hidden group-hover:inline'} ${textClasses}`}>Adicionar Exibir</span>
        </NavLink>
        <NavLink to="/admin/edit-exibir" className={navLinkClasses} title="Editar Exibir">
          <FaPenToSquare className={iconClasses} /> <span className={`${!isOpen && 'hidden group-hover:inline'} ${textClasses}`}>Editar Exibir</span>
        </NavLink>
         <NavLink to="/admin/news" className={navLinkClasses} title="Notícias (Blog)"> 
          <FaNewspaper className={iconClasses} /> <span className={`${!isOpen && 'hidden group-hover:inline'} ${textClasses}`}>Notícias (Blog)</span>
        </NavLink>
        <NavLink to="/admin/comments" className={navLinkClasses} title="Gerenciar Comentários">
            <FaComments className={iconClasses} /> <span className={`${!isOpen && 'hidden group-hover:inline'} ${textClasses}`}>Gerenciar Comentários</span>
        </NavLink>
         <NavLink to="/admin/community" className={navLinkClasses} title="Gerenciar Comunidade">
            <FaUsersGear className={iconClasses} /> <span className={`${!isOpen && 'hidden group-hover:inline'} ${textClasses}`}>Gerenciar Comunidade</span>
        </NavLink>
        <NavLink to="/admin/support-tickets" className={navLinkClasses} title="Tickets de Suporte">
            <FaLifeRing className={iconClasses} /> <span className={`${!isOpen && 'hidden group-hover:inline'} ${textClasses}`}>Tickets de Suporte</span>
        </NavLink>
        <NavLink to="/admin/broadcast-message" className={navLinkClasses} title="Mensagem Global">
          <FaBullhorn className={iconClasses} /> <span className={`${!isOpen && 'hidden group-hover:inline'} ${textClasses}`}>Mensagem Global</span>
        </NavLink>
        <NavLink to="/admin/scraper" className={navLinkClasses} title="Scraper de Animes">
          <FaRobot className={iconClasses} /> <span className={`${!isOpen && 'hidden group-hover:inline'} ${textClasses}`}>Scraper de Animes</span>
        </NavLink>
        <NavLink to="/admin/utilities" className={navLinkClasses} title="Utilitários">
          <FaScrewdriverWrench className={iconClasses} /> <span className={`${!isOpen && 'hidden group-hover:inline'} ${textClasses}`}>Utilitários</span>
        </NavLink>
        <NavLink to="/admin/settings" className={navLinkClasses} title="Configurações">
          <FaGears className={iconClasses} /> <span className={`${!isOpen && 'hidden group-hover:inline'} ${textClasses}`}>Configurações</span>
        </NavLink>
      </nav>
      <div className={`absolute bottom-4 left-0 right-0 px-3 ${!isOpen && 'group-hover:px-3 hidden group-hover:block'}`}>
         <div className={`flex items-center p-3 bg-gray-700 rounded-lg ${!isOpen && 'justify-center'}`}>
            <img 
              src={user?.imagem_perfil ? resolveImageUrl(user.imagem_perfil) : DEFAULT_PLACEHOLDER_IMAGE} 
              alt={user?.nome || "Admin"} 
              className="h-10 w-10 rounded-full object-cover border-2 border-primary flex-shrink-0"
            />
            <div className={`ml-3 ${!isOpen && 'hidden group-hover:block'}`}>
                <p className="text-sm font-medium text-white truncate">{user?.nome || 'Admin User'}</p>
            </div>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
