
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { SiteAlert } from '../types';

const AlertBanner: React.FC = () => {
  const [alert, setAlert] = useState<SiteAlert | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchAlert = async () => {
      try {
        const activeAlert = await apiService.getActiveAlert();
        if (activeAlert && activeAlert.titulo && activeAlert.conteudo) {
          setAlert(activeAlert);
          setIsVisible(true);
        }
      } catch (error) {
        // No active alert or error fetching, do nothing
        console.warn('Não foi possível buscar alerta ativo:', error);
      }
    };
    fetchAlert();
  }, []);

  if (!alert || !isVisible) {
    return null;
  }

  return (
    <div className="bg-primary text-white p-3 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <div>
          <strong className="font-semibold">{alert.titulo}</strong>
          <p className="text-sm">{alert.conteudo}</p>
        </div>
        <button 
          onClick={() => setIsVisible(false)} 
          className="ml-4 text-xl font-bold hover:text-gray-200 focus:outline-none"
          aria-label="Fechar alerta"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default AlertBanner;