
import React, { useState, useEffect } from 'react';
import { FaBell, FaBars, FaTimes, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa'; // Updated to FaTimes
import { APP_NAME } from '../../constants';

interface AdminHeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

interface Notification {
    id: number;
    title: string;
    message: string;
    read?: boolean;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ toggleSidebar, isSidebarOpen }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, title: "Novo Episódio Adicionado!", message: "Anime X - Episódio 10 já disponível.", read: false },
    { id: 2, title: "Manutenção Agendada", message: "Servidores offline às 02:00 AM.", read: true },
    { id: 3, title: "Usuário Registrado", message: "Novo usuário 'testuser' se cadastrou.", read: false },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000 * 60); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const handleToggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setShowNotifications(false);
  }

  return (
    <header className="h-16 bg-gray-900 shadow-md flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar} 
          className="text-gray-300 hover:text-white focus:outline-none mr-4" // Always show toggle for desktop collapsing
          aria-label={isSidebarOpen ? "Recolher sidebar" : "Expandir sidebar"}
        >
          {isSidebarOpen ? <FaAngleDoubleLeft size={20} /> : <FaAngleDoubleRight size={20} />}
        </button>
        {!isSidebarOpen && <span className="text-lg font-semibold text-white hidden md:block">{APP_NAME} Admin</span>}
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative">
          <button 
            onClick={handleToggleNotifications}
            className="text-gray-300 hover:text-white focus:outline-none relative"
            aria-label="Notifications"
          >
            <FaBell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-gray-800 rounded-lg shadow-xl z-20">
              <div className="flex justify-between items-center p-3">
                <h4 className="font-semibold text-white text-sm">Notificações</h4>
                <button onClick={() => setShowNotifications(false)} className="text-xs text-primary hover:underline">Fechar</button>
              </div>
              <div className="text-sm text-gray-300 max-h-80 overflow-y-auto custom-scrollbar">
                {notifications.length > 0 ? notifications.map((notif, index) => (
                  <div key={notif.id} className={`p-3 hover:bg-gray-750 ${notif.read ? 'opacity-70' : ''} ${index === notifications.length - 1 ? '' : 'border-b border-gray-700'}`}>
                    <p className={`font-medium ${notif.read ? 'text-gray-400' : 'text-white'}`}>{notif.title}</p>
                    <p className="text-xs text-gray-400">{notif.message}</p>
                  </div>
                )) : (
                  <p className="text-gray-400 text-center py-4">Não há novas notificações.</p>
                )}
              </div>
              {notifications.length > 0 && (
                 <div className="p-2 text-center">
                    <button onClick={clearAllNotifications} className="text-xs text-red-400 hover:text-red-300 hover:underline">Limpar Todas</button>
                 </div>
              )}
            </div>
          )}
        </div>
        <span className="text-sm text-gray-300">{formattedTime}</span>
      </div>
    </header>
  );
};

export default AdminHeader;
