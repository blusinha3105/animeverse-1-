import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import SearchBar from './SearchBar'; 
import { 
    FaTableCellsLarge, FaBell, FaUserAstronaut, FaRightToBracket, 
    FaTicket, FaHeart, FaGlobe, FaDice, FaCircleXmark, FaBars,
    FaMagnifyingGlass, FaXmark
} from 'react-icons/fa6';
import { useAuth } from '../hooks/useAuth';
import { resolveImageUrl, DEFAULT_PLACEHOLDER_IMAGE, APP_NAME } from '../constants';
import { apiService } from '../services/apiService';
import type { UserNotification } from '../types';

interface HeaderProps {
  toggleMainMobileSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleMainMobileSidebar }) => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [showMobileMenu, setShowMobileMenu] = useState(false); // This is for the right-side mobile menu
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showQuickAccess, setShowQuickAccess] = useState(false);

  const fetchUserNotifications = useCallback(async () => {
    if (user && token) {
      try {
        const fetchedNotifications = await apiService.getUserNotifications(token);
        setNotifications(fetchedNotifications);
        setUnreadCount(fetchedNotifications.filter(n => !n.is_read).length);
      } catch (error) {
        console.error("Erro ao buscar notificações:", error);
      }
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, token]);

  useEffect(() => {
    fetchUserNotifications();
  }, [fetchUserNotifications]);

  const handleMarkAsRead = async (notificationId: string | number) => {
    if (!token) return;
    try {
      await apiService.markNotificationAsRead(notificationId, token);
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    if (!token || unreadCount === 0) return;
    try {
        await apiService.markAllNotificationsAsRead(token);
        setNotifications(prev => prev.map(n => ({...n, is_read: true })));
        setUnreadCount(0);
    } catch (error) {
        console.error("Erro ao marcar todas como lidas:", error);
    }
  };

  const handleRandomAnime = async () => {
    try {
        const randomId = await apiService.getRandomAnimeId();
        if (randomId) {
            navigate(`/anime/${randomId}`);
            setShowQuickAccess(false);
            setShowMobileMenu(false);
        } else {
            alert("Não foi possível encontrar um anime aleatório no momento.");
        }
    } catch (error) {
        console.error("Erro ao buscar anime aleatório:", error);
        alert("Erro ao buscar anime aleatório.");
    }
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean } ) =>
    `px-3 py-2 text-sm font-medium rounded-md transition-colors
     ${isActive ? 'text-text-primary bg-card' : 'text-text-secondary hover:text-text-primary hover:bg-card'}`;
  
  const mobileNavLinkClasses = ({ isActive }: { isActive: boolean } ) =>
    `block px-3 py-2 text-base font-medium rounded-md
     ${isActive ? 'bg-primary text-white' : 'text-text-secondary hover:bg-gray-700 hover:text-text-primary'}`;

  return (
    <header className="h-16 bg-background flex items-center justify-between px-4 md:px-6 flex-shrink-0 sticky top-0 z-30 shadow-md">
      <div className="flex items-center">
        {/* Hamburger for main LeftSidebar on mobile */}
        <button 
          onClick={toggleMainMobileSidebar} 
          className="md:hidden text-text-secondary hover:text-text-primary mr-3 p-1"
          aria-label="Abrir menu principal"
        >
          <FaBars size={22} />
        </button>
        <Link to="/" className="text-2xl font-bold text-primary hover:text-secondary transition-colors">
          {APP_NAME}
        </Link>
      </div>

      <nav className="hidden md:flex items-center space-x-2 md:space-x-4">
        <NavLink to="/series" className={navLinkClasses}>Séries</NavLink>
        <NavLink to="/movies" className={navLinkClasses}>Filmes</NavLink>
        <NavLink to="/extras" className={navLinkClasses}>Extras</NavLink>
      </nav>

      <div className="flex items-center space-x-3 md:space-x-4">
        <div className="hidden sm:block">
          <SearchBar onSearch={() => setShowMobileMenu(false)} />
        </div>
        {/* Search toggle for small screens (part of right-side mobile menu) */}
        <div className="sm:hidden">
            <button onClick={() => setShowMobileMenu(prev => !prev)} className="text-text-secondary hover:text-text-primary">
                {showMobileMenu ? <FaXmark size={20} /> : <FaMagnifyingGlass size={20} />}
            </button>
        </div>

        <div className="relative hidden md:block">
          <button 
            onClick={() => setShowQuickAccess(prev => !prev)} 
            className="text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Acesso Rápido" id="quick-access-button" aria-haspopup="true" aria-expanded={showQuickAccess}
          >
            <FaTableCellsLarge size={20} />
          </button>
          {showQuickAccess && (
            <div 
                className="absolute right-0 mt-2 w-56 bg-card rounded-lg shadow-xl z-50 py-2"
                role="menu" aria-orientation="vertical" aria-labelledby="quick-access-button"
                onMouseLeave={() => setShowQuickAccess(false)}
            >
              <button onClick={handleRandomAnime} role="menuitem" className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-gray-700 hover:text-text-primary flex items-center"><FaDice className="mr-2"/> Anime Aleatório</button>
              <Link to="/discovery" role="menuitem" onClick={() => setShowQuickAccess(false)} className="block px-4 py-2 text-sm text-text-secondary hover:bg-gray-700 hover:text-text-primary flex items-center"><FaGlobe className="mr-2"/> Ver Gêneros</Link>
              {user && <Link to="/my-collection" role="menuitem" onClick={() => setShowQuickAccess(false)} className="block px-4 py-2 text-sm text-text-secondary hover:bg-gray-700 hover:text-text-primary flex items-center"><FaHeart className="mr-2"/> Minha Coleção</Link>}
              <Link to="/support" role="menuitem" onClick={() => setShowQuickAccess(false)} className="block px-4 py-2 text-sm text-text-secondary hover:bg-gray-700 hover:text-text-primary flex items-center"><FaTicket className="mr-2"/> Suporte</Link>
            </div>
          )}
        </div>
        
        {user && token && (
            <div className="relative">
                <button 
                    onClick={() => setShowNotifications(prev => !prev)} 
                    className="text-text-secondary hover:text-text-primary transition-colors relative"
                    aria-label="Notificações" id="notifications-button" aria-haspopup="true" aria-expanded={showNotifications}
                >
                    <FaBell size={20} />
                    {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-action text-white text-[10px] rounded-full flex items-center justify-center animate-pulse" aria-hidden="true">
                        {unreadCount}
                    </span>
                    )}
                </button>
                {showNotifications && (
                <div 
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-card rounded-lg shadow-xl z-50"
                    role="dialog" aria-modal="true" aria-labelledby="notifications-heading"
                    onMouseLeave={() => setShowNotifications(false)}
                >
                  <div className="flex justify-between items-center p-3">
                    <h4 id="notifications-heading" className="font-semibold text-text-primary text-sm">Notificações</h4>
                    {unreadCount > 0 && 
                        <button onClick={handleMarkAllAsRead} className="text-xs text-primary hover:underline">Marcar todas como lidas</button>
                    }
                     <button onClick={() => setShowNotifications(false)} className="text-xs text-gray-400 hover:text-white" aria-label="Fechar notificações">
                        <FaCircleXmark />
                    </button>
                  </div>
                  <div className="text-sm text-text-secondary max-h-80 overflow-y-auto custom-scrollbar" role="list">
                    {notifications.length > 0 ? notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        role="listitem"
                        className={`p-3 hover:bg-gray-700/50 cursor-pointer ${!notif.is_read ? 'bg-primary/10' : ''} ${notifications.indexOf(notif) === notifications.length -1 ? '' : 'border-b border-gray-700'}`}
                        onClick={() => {
                            if (!notif.is_read) handleMarkAsRead(notif.id);
                            if (notif.link) navigate(notif.link);
                            setShowNotifications(false);
                        }}
                        tabIndex={0}
                        onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') { if (!notif.is_read) handleMarkAsRead(notif.id); if (notif.link) navigate(notif.link); setShowNotifications(false);}}}
                      >
                        <p className={`font-medium ${!notif.is_read ? 'text-text-primary' : 'text-text-secondary'}`}>{notif.message}</p>
                        <p className="text-xs text-gray-500">{new Date(notif.created_at).toLocaleDateString('pt-BR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}</p>
                      </div>
                    )) : (
                      <p className="text-gray-500 text-center py-4">Nenhuma notificação.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
        )}

        {user ? (
          <Link to="/profile" className="flex items-center space-x-2" aria-label="Ver perfil">
            {user.imagem_perfil && resolveImageUrl(user.imagem_perfil) !== DEFAULT_PLACEHOLDER_IMAGE ? (
                <img src={resolveImageUrl(user.imagem_perfil)} alt={user.nome} className="w-7 h-7 rounded-full object-cover" />
            ) : ( <FaUserAstronaut size={20} className="text-text-secondary hover:text-text-primary"/> )}
          </Link>
        ) : (
          <Link to="/login" className="text-text-secondary hover:text-text-primary" aria-label="Entrar">
            <FaRightToBracket size={20} />
          </Link>
        )}
        
        {/* Hamburger for right-side mobile menu (search, quick links) */}
        <div className="md:hidden">
          <button onClick={() => setShowMobileMenu(prev => !prev)} className="text-text-secondary hover:text-text-primary" aria-label="Abrir menu de navegação secundário" aria-expanded={showMobileMenu}>
            {showMobileMenu ? <FaXmark size={22} /> : <FaBars size={22} />}
          </button>
        </div>
      </div>

      {/* This is the RIGHT-SIDE mobile dropdown menu for search and quick links */}
      {showMobileMenu && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-background shadow-lg z-20 p-4">
          <div className="mb-4"> <SearchBar onSearch={() => setShowMobileMenu(false)}/> </div>
          <nav className="flex flex-col space-y-2">
            <NavLink to="/series" className={mobileNavLinkClasses} onClick={() => setShowMobileMenu(false)}>Séries</NavLink>
            <NavLink to="/movies" className={mobileNavLinkClasses} onClick={() => setShowMobileMenu(false)}>Filmes</NavLink>
            <NavLink to="/extras" className={mobileNavLinkClasses} onClick={() => setShowMobileMenu(false)}>Extras</NavLink>
            <hr className="my-2 opacity-20" />
            <button onClick={handleRandomAnime} className="w-full text-left px-3 py-2 text-base font-medium rounded-md text-text-secondary hover:bg-gray-700 hover:text-text-primary flex items-center"><FaDice className="mr-2"/> Anime Aleatório</button>
            <Link to="/discovery" onClick={() => setShowMobileMenu(false)} className="block px-3 py-2 text-base font-medium rounded-md text-text-secondary hover:bg-gray-700 hover:text-text-primary flex items-center"><FaGlobe className="mr-2"/> Ver Gêneros</Link>
            {user && <Link to="/my-collection" onClick={() => setShowMobileMenu(false)} className="block px-3 py-2 text-base font-medium rounded-md text-text-secondary hover:bg-gray-700 hover:text-text-primary flex items-center"><FaHeart className="mr-2"/> Minha Coleção</Link>}
            <Link to="/support" onClick={() => setShowMobileMenu(false)} className="block px-3 py-2 text-base font-medium rounded-md text-text-secondary hover:bg-gray-700 hover:text-text-primary flex items-center"><FaTicket className="mr-2"/> Suporte</Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;