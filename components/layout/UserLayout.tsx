import React, { ReactNode } from 'react';
import LeftSidebar from './LeftSidebar';
import Header from '../Header'; // New global header
import Footer from '../Footer'; // New global footer
// import AlertBanner from '../AlertBanner'; // Optional: include if needed

interface UserLayoutProps {
  children: ReactNode;
}

const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-background text-text-primary">
      <LeftSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* <AlertBanner /> */} {/* Optional Global Alert Banner */}
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default UserLayout;
