
import React from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import UserLayout from './components/layout/UserLayout'; 
import HomePage from './pages/HomePage';
import AnimeDetailPage from './pages/AnimeDetailPage';
import PlayerPage from './pages/PlayerPage';
import SearchPage from './pages/SearchPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import SupportPage from './pages/SupportPage'; 
import NotFoundPage from './pages/NotFoundPage';
import { useAuth } from './hooks/useAuth';
import LoadingSpinner from './components/LoadingSpinner';

// New Page Imports
import DiscoveryPage from './pages/DiscoveryPage';
import CommunityPage from './pages/CommunityPage';
import PostDetailPage from './pages/PostDetailPage';
import NewsPage from './pages/NewsPage';
import NewsArticleDetailPage from './pages/NewsArticleDetailPage';
import MyCollectionPage from './pages/MyCollectionPage'; 
import DownloadsPage from './pages/DownloadsPage'; 
import RecentPage from './pages/RecentPage'; // New
import SeriesPage from './pages/SeriesPage'; // New
import MoviesPage from './pages/MoviesPage'; // New
import ExtrasPage from './pages/ExtrasPage'; // New
import UserSettingsPage from './pages/UserSettingsPage'; // New
import TermsPage from './pages/TermsPage'; // New
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'; // New
import ContactPage from './pages/ContactPage'; // New
import DMCAPage from './pages/DMCAPage'; // New


// Admin Imports
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboardPage from './components/admin/pages/AdminDashboardPage';
import AdminInsertCatalogPage from './components/admin/pages/AdminInsertCatalogPage';
import AdminEditCatalogPage from './components/admin/pages/AdminEditCatalogPage';
import AdminAddExibirPage from './components/admin/pages/AdminAddExibirPage';
import AdminEditExibirPage from './components/admin/pages/AdminEditExibirPage';
import AdminBroadcastMessagePage from './components/admin/pages/AdminBroadcastMessagePage';
import AdminScraperPage from './components/admin/pages/AdminScraperPage';
import AdminUtilitiesPage from './components/admin/pages/AdminUtilitiesPage';
import AdminSettingsPage from './components/admin/pages/AdminSettingsPage';
import AdminSupportTicketsPage from './components/admin/pages/AdminSupportTicketsPage'; 
import AdminSupportTicketDetailPage from './components/admin/pages/AdminSupportTicketDetailPage'; 
import AdminCommentsPage from './components/admin/pages/AdminCommentsPage'; 
import AdminNewsPage from './components/admin/pages/AdminNewsPage'; 
import AdminCommunityPage from './components/admin/pages/AdminCommunityPage';
import AdminHomePageSectionsPage from './components/admin/pages/AdminHomePageSectionsPage';
import AdminUsersPage from './components/admin/pages/AdminUsersPage'; // New User Management Page


const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/*" element={<MainSiteRoutes />} />
      </Routes>
    </HashRouter>
  );
};

const MainSiteRoutes: React.FC = () => (
  <UserLayout> 
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/anime/:id" element={<AnimeDetailPage />} />
      <Route path="/watch/:animeId/ep/:episodeNumber" element={<PlayerPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/support" element={<SupportPage />} /> 
      <Route 
        path="/profile" 
        element={
          <UserPrivateRoute>
            <ProfilePage />
          </UserPrivateRoute>
        } 
      />
      
      <Route path="/discovery" element={<DiscoveryPage />} />
      <Route path="/community" element={<CommunityPage />} />
      <Route path="/community/post/:postId" element={<PostDetailPage />} />
      <Route path="/news" element={<NewsPage />} />
      <Route path="/news/:slug" element={<NewsArticleDetailPage />} />
      <Route path="/my-collection" element={<UserPrivateRoute><MyCollectionPage /></UserPrivateRoute>} />
      <Route path="/download" element={<UserPrivateRoute><DownloadsPage /></UserPrivateRoute>} />
      
      {/* Updated and New Static Routes */}
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/dmca" element={<DMCAPage />} />

      {/* Filtered Content Pages */}
      <Route path="/series" element={<SeriesPage />} />
      <Route path="/movies" element={<MoviesPage />} />
      <Route path="/extras" element={<ExtrasPage />} />
      
      {/* Recent Page */}
      <Route path="/recent" element={<RecentPage />} />

      {/* User Settings Page */}
      <Route path="/settings" element={<UserPrivateRoute><UserSettingsPage /></UserPrivateRoute>} />


      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </UserLayout>
);

interface PrivateRouteProps {
  children: JSX.Element;
}

const UserPrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner />;
  
  if (user && user.is_banned) {
    return <Navigate to="/login" replace state={{ from: location, banned: true, reason: user.banned_reason }} />;
  }
  
  return user ? children : <Navigate to="/login" replace state={{ from: location }} />;
};

const AdminPrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner />;
  
  if (user && user.is_banned) { // Also prevent banned admins from accessing admin panel
    return <Navigate to="/login" replace state={{ from: location, banned: true, reason: user.banned_reason }} />;
  }

  return user && user.admin ? children : <Navigate to="/login" replace state={{ from: location }} />;
};


const AdminRoutes: React.FC = () => (
  <AdminPrivateRoute>
    <AdminLayout>
      <Routes>
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} /> {/* New Route */}
        <Route path="insert-catalog" element={<AdminInsertCatalogPage />} />
        <Route path="edit-catalog" element={<AdminEditCatalogPage />} />
        <Route path="add-exibir" element={<AdminAddExibirPage />} />
        <Route path="edit-exibir" element={<AdminEditExibirPage />} />
        <Route path="home-sections" element={<AdminHomePageSectionsPage />} />
        <Route path="news" element={<AdminNewsPage />} />
        <Route path="comments" element={<AdminCommentsPage />} />
        <Route path="community" element={<AdminCommunityPage />} />
        <Route path="support-tickets" element={<AdminSupportTicketsPage />} />
        <Route path="support-tickets/:ticketId" element={<AdminSupportTicketDetailPage />} />
        <Route path="broadcast-message" element={<AdminBroadcastMessagePage />} />
        <Route path="scraper" element={<AdminScraperPage />} />
        <Route path="utilities" element={<AdminUtilitiesPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="*" element={<Navigate to="dashboard" />} />
      </Routes>
    </AdminLayout>
  </AdminPrivateRoute>
);

export default App;
