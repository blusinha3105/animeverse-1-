
import React from 'react';
import { FaTimes, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

interface AdminNotificationModalProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const AdminNotificationModal: React.FC<AdminNotificationModalProps> = ({ message, type, onClose }) => {
  const Icon = type === 'success' ? FaCheckCircle : FaExclamationCircle;
  const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600';
  const iconColor = type === 'success' ? 'text-green-100' : 'text-red-100';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className={`relative ${bgColor} text-white p-6 rounded-lg shadow-xl max-w-sm w-full`}>
        <button 
          onClick={onClose} 
          className="absolute top-2 right-2 text-white hover:text-gray-200 text-xl"
          aria-label="Fechar notificação"
        >
          <FaTimes />
        </button>
        <div className="flex items-center">
          <Icon size={24} className={`${iconColor} mr-3 flex-shrink-0`} />
          <p className="text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationModal;
