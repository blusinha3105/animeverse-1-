
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
  toggleMobileSidebar: () => void; // New prop to control UserLayout's sidebar
}

const Header: React.FC<HeaderProps> = ({ toggleMobileSidebar }) => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(false); // For mobile search bar visibility
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
            // No direct control over LeftSidebar from here, but could call toggleMobileSidebar if it were also for quick access items
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
  
  return (
    <header className="h-16 bg-background flex items-center justify-between px-4 md:px-6 flex-shrink-0 sticky top-0 z-30 shadow-md">
      <div className="flex items-center">
         {/* Hamburger for LeftSidebar on mobile */}
        <button 
            onClick={toggleMobileSidebar} 
            className="md:hidden text-text-secondary hover:text-text-primary mr-3 p-1"
            aria-label="Abrir menu de navegação principal"
        >
            <FaBars size={22} />
        </button>
        <Link to="/" className="text-2xl font-bold text-primary hover:text-secondary transition-colors mr-4">
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
          <SearchBar onSearch={() => setIsMobileSearchVisible(false)} />
        </div>
        <div className="sm:hidden">
            <button onClick={() => setIsMobileSearchVisible(prev => !prev)} className="text-text-secondary hover:text-text-primary">
                {isMobileSearchVisible ? <FaXmark size={20} /> : <FaMagnifyingGlass size={20} />}
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
        
        {/* Removed md:hidden from hamburger to use toggleMobileSidebar exclusively for LeftSidebar */}
        {/* The actual hamburger icon is now at the start of the header for mobile */}
      </div>

      {/* Mobile Search Bar - appears below header */}
      {isMobileSearchVisible && (
        <div className="sm:hidden absolute top-16 left-0 right-0 bg-background shadow-lg z-20 p-4">
          <SearchBar onSearch={() => setIsMobileSearchVisible(false)}/>
        </div>
      )}
    </header>
  );
};

export default Header;
