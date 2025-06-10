import React, { useState } from 'react';
import { FaEdit, FaCommentDots, FaSmileBeam } from 'react-icons/fa';
import AdminPostsTab from '../community/AdminPostsTab';
import AdminCommentsTab from '../community/AdminCommentsTab';
import AdminStickersTab from '../community/AdminStickersTab';

type AdminCommunityTab = 'posts' | 'comments' | 'stickers';

const AdminCommunityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminCommunityTab>('posts');

  const tabButtonClass = (tabName: AdminCommunityTab) =>
    `px-4 py-2 text-sm font-medium rounded-t-lg transition-colors outline-none focus:ring-2 focus:ring-primary flex items-center
     ${activeTab === tabName ? 'bg-primary text-white shadow-md' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`;

  return (
    <div className="p-2 md:p-4 bg-admin-bg rounded-lg shadow-xl text-gray-200">
      <h1 className="text-2xl font-semibold text-primary mb-6">Gerenciar Comunidade</h1>

      <div className="mb-6 flex border-b border-gray-700">
        <button onClick={() => setActiveTab('posts')} className={tabButtonClass('posts')}>
          <FaEdit className="mr-2" /> Publicações
        </button>
        <button onClick={() => setActiveTab('comments')} className={tabButtonClass('comments')}>
          <FaCommentDots className="mr-2" /> Comentários
        </button>
        <button onClick={() => setActiveTab('stickers')} className={tabButtonClass('stickers')}>
          <FaSmileBeam className="mr-2" /> Stickers
        </button>
      </div>

      <div className="bg-admin-card-bg p-4 sm:p-6 rounded-b-lg shadow-md animate-fadeIn">
        {activeTab === 'posts' && <AdminPostsTab />}
        {activeTab === 'comments' && <AdminCommentsTab />}
        {activeTab === 'stickers' && <AdminStickersTab />}
      </div>
       <style>
        {`
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}
      </style>
    </div>
  );
};

export default AdminCommunityPage;