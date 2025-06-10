import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../../services/apiService';
import { useAuth } from '../../../hooks/useAuth';
import { SupportTicket, TicketStatus } from '../../../types';
import LoadingSpinner from '../../LoadingSpinner';
import { FaEye, FaFilter, FaRedo } from 'react-icons/fa';

const AdminSupportTicketsPage: React.FC = () => {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'All'>('All');

  const fetchTickets = useCallback(async () => {
    if (!token) {
        setError("Autenticação necessária.");
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const fetchedData = await apiService.adminGetAllSupportTickets(token);
      if (Array.isArray(fetchedData)) {
        setTickets(fetchedData.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      } else {
        console.warn("Fetched support tickets is not an array:", fetchedData);
        setTickets([]); // Default to empty array to prevent .sort errors
        if (typeof fetchedData === 'object' && fetchedData !== null && 'message' in fetchedData && typeof (fetchedData as any).message === 'string') {
             setError((fetchedData as {message: string}).message || "Formato de dados inesperado para tickets.");
        } else if (fetchedData && typeof fetchedData !== 'object' ) { // if it's a string or something else non-array
             setError("Formato de dados inesperado para tickets.");
        } else {
            setError("Não foi possível carregar os tickets ou a resposta não é uma lista válida.");
        }
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to load support tickets.');
      console.error(err);
      setTickets([]); // Ensure tickets is an array on error too
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filteredTickets = statusFilter === 'All' 
    ? tickets 
    : tickets.filter(ticket => ticket.status === statusFilter);
  
  const getStatusColorClass = (status: TicketStatus) => {
    switch (status) {
        case 'Open': return 'text-green-400 bg-green-900/50';
        case 'In Progress': return 'text-yellow-400 bg-yellow-900/50';
        case 'Answered': return 'text-blue-400 bg-blue-900/50';
        case 'Closed': return 'text-gray-400 bg-gray-700/50';
        default: return 'text-gray-400 bg-gray-700/50';
    }
  };
  const selectClass = "bg-gray-700 text-gray-200 text-sm rounded-lg focus:ring-primary focus:border-transparent block w-full p-2";


  return (
    <div className="p-2 md:p-4 bg-admin-bg rounded-lg shadow-xl text-gray-200">
      <h1 className="text-2xl font-semibold text-primary mb-6">Gerenciar Tickets de Suporte</h1>

      <div className="mb-6 p-4 bg-admin-card-bg rounded-lg shadow flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
            <label htmlFor="statusFilter" className="block text-xs font-medium text-gray-400 mb-1">Filtrar por Status:</label>
            <select 
                id="statusFilter" 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'All')}
                className={selectClass}
            >
                <option value="All">Todos</option>
                <option value="Open">Aberto</option>
                <option value="In Progress">Em Progresso</option>
                <option value="Answered">Respondido</option>
                <option value="Closed">Fechado</option>
            </select>
        </div>
        <button 
            onClick={fetchTickets} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-sm flex items-center justify-center self-end sm:self-auto h-10"
            disabled={isLoading}
            title="Recarregar Tickets"
        >
            <FaRedo className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Recarregar
        </button>
      </div>

      {isLoading && <div className="py-10"><LoadingSpinner /></div>}
      {error && <p className="text-red-400 text-center py-4 bg-red-900 bg-opacity-30 rounded">{error}</p>}
      
      {!isLoading && !error && (
        <div className="overflow-x-auto admin-custom-scrollbar bg-admin-card-bg rounded-lg shadow">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-gray-750">
              <tr>
                <th scope="col" className="px-4 py-3">ID</th>
                <th scope="col" className="px-4 py-3">Assunto</th>
                <th scope="col" className="px-4 py-3">Usuário (Email)</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Criado em</th>
                <th scope="col" className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length > 0 ? filteredTickets.map(ticket => (
                <tr key={ticket.id} className="bg-gray-800 hover:bg-gray-750 transition-colors">
                  <td className="px-4 py-2 font-medium">{ticket.id}</td>
                  <td className="px-4 py-2 max-w-xs truncate" title={ticket.subject}>{ticket.subject}</td>
                  <td className="px-4 py-2">{ticket.user_nome || ticket.user_email} {ticket.user_id ? `(ID: ${ticket.user_id})` : '(Anônimo)'}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColorClass(ticket.status)}`}>
                        {ticket.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">{new Date(ticket.created_at).toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-2">
                    <Link 
                      to={`/admin/support-tickets/${ticket.id}`}
                      className="text-primary hover:text-secondary"
                      title="Ver Detalhes do Ticket"
                    >
                      <FaEye size={16}/>
                    </Link>
                  </td>
                </tr>
              )) : (
                <tr>
                    <td colSpan={6} className="text-center py-6 text-gray-500">Nenhum ticket encontrado com os filtros atuais.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminSupportTicketsPage;