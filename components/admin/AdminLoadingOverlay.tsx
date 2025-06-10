
import React from 'react';
import { FaSpinner } from 'react-icons/fa'; // Using FaSpinner for a different look

const AdminLoadingOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex flex-col items-center justify-center z-[101]">
      <FaSpinner className="animate-spin text-primary text-5xl mb-4" />
      <p className="text-gray-200 text-lg">Carregando...</p>
    </div>
  );
};

export default AdminLoadingOverlay;
