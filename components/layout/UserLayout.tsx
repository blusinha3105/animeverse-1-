

import React, { ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import LeftSidebar from './LeftSidebar';
import Header from '../Header';
import Footer from '../Footer';
import JuicyAdsPopunder from '../ads/JuicyAdsPopunder'; // Import Popunder
import JuicyAdsBanner from '../ads/JuicyAdsBanner'; // Import Banner for example
import { JuicyAdsSettings } from '../../types';


interface UserLayoutProps {
  children: ReactNode;
}

const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [adSettings, setAdSettings] = useState<Partial<JuicyAdsSettings>>({});

  useEffect(() => {
    // Load ad settings from localStorage
    const storedSettings = localStorage.getItem('siteSettings');
    if (storedSettings) {
      setAdSettings(JSON.parse(storedSettings));
    }
  }, []);


  const handleResize = useCallback(() => {
    const mobile = window.innerWidth < 768;
    setIsMobileView(mobile);
    if (!mobile) {
      setIsMobileSidebarOpen(false); 
    }
  }, []);

  const checkFooterVisibility = useCallback(() => {
    const mainEl = mainContentRef.current;
    if (mainEl) {
      const { scrollHeight, clientHeight, scrollTop } = mainEl;
      
      if (scrollHeight <= clientHeight) {
        setIsFooterVisible(true);
      } else {
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 1; 
        setIsFooterVisible(isAtBottom);
      }
    } else {
      setIsFooterVisible(false);
    }
  }, []);


  useEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);
  
  useEffect(() => {
    const mainEl = mainContentRef.current;
    if (mainEl) {
      mainEl.addEventListener('scroll', checkFooterVisibility);
      window.addEventListener('resize', checkFooterVisibility); 
      checkFooterVisibility(); 
    }
    return () => {
      if (mainEl) {
        mainEl.removeEventListener('scroll', checkFooterVisibility);
      }
      window.removeEventListener('resize', checkFooterVisibility);
    };
  }, [checkFooterVisibility]);


  useEffect(() => {
    if (isMobileView && isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = ''; 
    };
  }, [isMobileView, isMobileSidebarOpen]);

  const toggleMobileSidebar = () => {
    if (isMobileView) {
      setIsMobileSidebarOpen(prev => !prev);
    }
  };

  const closeMobileSidebar = () => {
    if (isMobileView) {
      setIsMobileSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-background text-text-primary">
      <JuicyAdsPopunder /> {/* Load popunder script if enabled */}
      <LeftSidebar 
        isMobileView={isMobileView}
        isMobileSidebarOpen={isMobileSidebarOpen}
        closeMobileSidebar={closeMobileSidebar}
      />
      
      {isMobileView && isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        ></div>
      )}

      <div 
        className="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out"
      >
        <Header toggleMainMobileSidebar={toggleMobileSidebar} />
        <main 
            ref={mainContentRef}
            className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar"
        >
          {/* Example: Mobile Banner at the top of content */}
          {adSettings.juicyAdsEnabled && adSettings.juicyAdsSpotMobileBanner300x100 && isMobileView && (
            <div className="mb-4 flex justify-center">
              <JuicyAdsBanner 
                spotId={adSettings.juicyAdsSpotMobileBanner300x100} 
                width={300} 
                height={100} 
                className="sm:hidden" 
              />
            </div>
          )}
          {children}
        </main>
        {/* Example: Desktop Banner in Footer (or above footer) */}
        {adSettings.juicyAdsEnabled && adSettings.juicyAdsSpotBanner728x90 && !isMobileView && (
            <div className="py-2 flex justify-center bg-card">
                 <JuicyAdsBanner spotId={adSettings.juicyAdsSpotBanner728x90} width={728} height={90} />
            </div>
        )}
        <Footer isFooterVisible={isFooterVisible} />
      </div>
    </div>
  );
};

export default UserLayout;
