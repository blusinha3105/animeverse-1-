import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import { FaClipboardList, FaUserShield, FaHome, FaLifeRing } from 'react-icons/fa';
import { apiService } from '../../../services/apiService'; 
import { Anime } from '../../../types'; 
import { useAuth } from '../../../hooks/useAuth';

interface CatalogItem extends Anime {} 

const AdminDashboardPage: React.FC = () => {
  const { token } = useAuth();
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogs, setCatalogs] = useState<CatalogItem[]>([]);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [filters, setFilters] = useState({ id: '', title: '', altTitle: '', status: 'all', date: '' });

  useEffect(() => {
    if (showCatalogModal && token) { 
      fetchCatalogs();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCatalogModal, token]); 

  const fetchCatalogs = async () => {
    if (!token) return;
    setIsLoadingCatalogs(true);
    setCatalogError(null);
    try {
      const data = await apiService.adminGetCatalogs(token); 
      setCatalogs(data);
    } catch (error) {
      setCatalogError('Falha ao carregar catálogos.');
      console.error(error);
    } finally {
      setIsLoadingCatalogs(false);
    }
  };


  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filteredCatalogs = catalogs.filter(catalog => {
    return (
      (filters.id ? catalog.id.toString().includes(filters.id) : true) &&
      (filters.title ? catalog.titulo.toLowerCase().includes(filters.title.toLowerCase()) : true) &&
      (filters.altTitle && catalog.tituloAlternativo ? catalog.tituloAlternativo.toLowerCase().includes(filters.altTitle.toLowerCase()) : !filters.altTitle || !catalog.tituloAlternativo) &&
      (filters.status === 'all' || (catalog.status && catalog.status.toLowerCase() === filters.status.toLowerCase())) &&
      (filters.date && catalog.dataPostagem ? catalog.dataPostagem.includes(filters.date) : !filters.date || !catalog.dataPostagem)
    );
  });
  
  const inputClass = "bg-gray-700 text-gray-200 text-xs p-2 rounded focus:ring-primary focus:border-transparent";

  return (
    <div className="text-gray-100">
      <div className="flex items-center mb-6">
        <FaHome className="text-3xl text-primary mr-3" />
        <h1 className="text-3xl font-semibold">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Widget 1: Gerenciamento de Catálogos */}
        <div className="bg-admin-card-bg p-6 rounded-xl shadow-lg hover:shadow-primary/30 transition-shadow">
          <div className="flex items-center text-primary mb-3">
            <FaClipboardList size={24} className="mr-3" />
            <h3 className="text-xl font-semibold">Gerenciamento de Catálogos</h3>
          </div>
          <p className="text-gray-400 mb-4 text-sm">Veja e gerencie seus catálogos postados.</p>
          <button 
            onClick={() => setShowCatalogModal(true)}
            className="w-full bg-primary hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Gerenciar Catálogos
          </button>
        </div>

        {/* Widget 2: Gerenciamento de Suporte */}
        <div className="bg-admin-card-bg p-6 rounded-xl shadow-lg hover:shadow-primary/30 transition-shadow">
          <div className="flex items-center text-primary mb-3">
            <FaLifeRing size={24} className="mr-3" /> {/* Changed icon */}
            <h3 className="text-xl font-semibold">Gerenciamento de Suporte</h3>
          </div>
          <p className="text-gray-400 mb-4 text-sm">Veja os pedidos de suporte dos usuários.</p>
          <Link
            to="/admin/support-tickets" // Link to the new support tickets page
            className="w-full block text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Gerenciar Suporte
          </Link>
        </div>
      </div>
      
      <div className="bg-admin-card-bg p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold text-primary mb-4">Estatísticas do Site (Placeholder)</h3>
        <p className="text-gray-400">Gráficos e estatísticas de visualizações, usuários, etc., aparecerão aqui.</p>
        <div className="mt-4 h-64 bg-gray-700 rounded flex items-center justify-center">
            <span className="text-gray-500">Chart Area</span>
        </div>
      </div>

      {showCatalogModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-admin-sidebar-bg p-4 sm:p-6 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-3">
              <h2 className="text-2xl font-semibold text-primary">Lista de Catálogos</h2>
              <button 
                onClick={() => setShowCatalogModal(false)} 
                className="text-gray-400 hover:text-white text-2xl"
                aria-label="Fechar modal"
              >&times;</button>
            </div>

            <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 items-end">
              <input type="text" name="id" value={filters.id} onChange={handleFilterChange} placeholder="Filtrar ID" className={inputClass}/>
              <input type="text" name="title" value={filters.title} onChange={handleFilterChange} placeholder="Filtrar Título" className={inputClass}/>
              <input type="text" name="altTitle" value={filters.altTitle} onChange={handleFilterChange} placeholder="Filtrar Tít. Alt." className={inputClass}/>
              <select 
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className={`${inputClass} text-xs rounded-lg block w-full p-2`}
                >
                  <option value="all">Todos Status</option>
                  <option value="Incompleto">Incompleto</option>
                  <option value="Andamento">Andamento</option>
                  <option value="Completo">Completo</option>
                  <option value="Aguardando Lançamento">Aguard. Lançamento</option>
                </select>
              <input type="date" name="date" value={filters.date} onChange={handleFilterChange} className={`${inputClass} text-xs p-2`}/>
            </div>
            
            <div className="overflow-auto flex-grow admin-custom-scrollbar">
              {isLoadingCatalogs ? <p className="text-center py-4">Carregando catálogos...</p> :
               catalogError ? <p className="text-red-500 text-center py-4">{catalogError}</p> :
               filteredCatalogs.length > 0 ? (
                <table className="w-full text-sm text-left text-gray-300 table-auto">
                  <thead className="text-xs text-gray-400 uppercase bg-gray-750 sticky top-0">
                    <tr>
                      <th scope="col" className="px-3 py-2">ID</th>
                      <th scope="col" className="px-3 py-2">Título</th>
                      <th scope="col" className="px-3 py-2">Título Alt.</th>
                      <th scope="col" className="px-3 py-2">Status</th>
                      <th scope="col" className="px-3 py-2">Data Pub.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCatalogs.map(catalog => (
                      <tr key={catalog.id} className="bg-gray-800 hover:bg-gray-750 transition-colors">
                        <td className="px-3 py-2 font-medium whitespace-nowrap">{catalog.id}</td>
                        <td className="px-3 py-2 truncate max-w-xs" title={catalog.titulo}>{catalog.titulo}</td>
                        <td className="px-3 py-2 truncate max-w-xs" title={catalog.tituloAlternativo}>{catalog.tituloAlternativo || '-'}</td>
                        <td className="px-3 py-2">{catalog.status || '-'}</td>
                        <td className="px-3 py-2">{catalog.dataPostagem ? new Date(catalog.dataPostagem).toLocaleDateString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center py-4 text-gray-500">Nenhum catálogo encontrado com os filtros atuais.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;