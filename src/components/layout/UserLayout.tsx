
import React, { ReactNode, useState, useEffect } from 'react';
import LeftSidebar from './LeftSidebar';
import Header from '../Header'; 
import Footer from '../Footer'; 

interface UserLayoutProps {
  children: ReactNode;
}

const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768); // md breakpoint

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
      if (!mobile) { // If switching to desktop view
        setIsMobileSidebarOpen(false); // Close mobile sidebar
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMobileSidebar = () => {
    if (isMobileView) {
      setIsMobileSidebarOpen(prev => !prev);
    }
  };
  
  const closeMobileSidebar = () => {
    if (isMobileView) {
      setIsMobileSidebarOpen(false);
    }
  }

  return (
    <div className="flex h-screen bg-background text-text-primary">
      <LeftSidebar 
        isMobileSidebarOpen={isMobileSidebarOpen} 
        isMobileView={isMobileView}
        closeMobileSidebar={closeMobileSidebar} 
      />
      
      {/* Backdrop for mobile sidebar */}
      {isMobileView && isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" 
          onClick={closeMobileSidebar}
          aria-hidden="true"
        ></div>
      )}

      <div 
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out
                    ${isMobileView ? '' : 'md:ml-60'}`} // ml-60 is sidebar width
      >
        <Header toggleMobileSidebar={toggleMobileSidebar} />
        <main className={`flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar
                        ${isMobileView && isMobileSidebarOpen ? 'overflow-hidden' : ''}`} // Prevent scroll when mobile sidebar open
        >
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default UserLayout;
