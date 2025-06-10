
import React, { useState, ReactNode, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import AdminLoadingOverlay from './AdminLoadingOverlay';
import AdminNotificationModal from './AdminNotificationModal';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const [isLoading, setIsLoading] = useState(false); 
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false); // Collapse sidebar on mobile by default
      else setIsSidebarOpen(true); // Expand sidebar on desktop by default
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  // Example functions to control loading and notifications from child pages
  const showLoading = (show: boolean) => setIsLoading(show);
  const showNotification = (message: string, type: 'success' | 'error') => setNotification({ message, type });
  const closeNotification = () => setNotification(null);

  return (
    <div className="flex h-screen bg-admin-bg text-admin-text font-sans">
      {isLoading && <AdminLoadingOverlay />}
      {notification && (
        <AdminNotificationModal
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}
      
      <AdminSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} isMobile={isMobile} />
      
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out 
                    ${isMobile ? 'ml-0' : (isSidebarOpen ? 'md:ml-64' : 'md:ml-16')}`}
      >
        <AdminHeader toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen}/>
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-gray-800 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
