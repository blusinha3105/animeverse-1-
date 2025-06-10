import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../../../services/apiService';
import { useAuth } from '../../../hooks/useAuth';
import { SupportTicketWithReplies, SupportTicketReply, TicketStatus } from '../../../types';
import LoadingSpinner from '../../LoadingSpinner';
import { FaPaperPlane, FaSave, FaArrowLeft } from 'react-icons/fa';

const AdminSupportTicketDetailPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { user, token } = useAuth(); // Admin user for replying
  
  const [ticketDetails, setTicketDetails] = useState<SupportTicketWithReplies | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [newStatus, setNewStatus] = useState<TicketStatus | ''>('');

  const fetchTicketDetails = useCallback(async () => {
    if (!ticketId || !token) return;
    setIsLoading(true);
    setError(null);
    try {
      const details = await apiService.adminGetSupportTicketDetails(ticketId, token);
      setTicketDetails(details);
      setNewStatus(details.status); // Initialize status dropdown
    } catch (err) {
      setError((err as Error).message || 'Failed to load ticket details.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [ticketId, token]);

  useEffect(() => {
    fetchTicketDetails();
  }, [fetchTicketDetails]);

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !ticketId || !token) return;
    setIsReplying(true);
    try {
      await apiService.adminReplyToSupportTicket(ticketId, replyContent, token);
      setReplyContent('');
      fetchTicketDetails(); // Refresh ticket details to show new reply
      if (newStatus === 'Open' || newStatus === 'In Progress') setNewStatus('Answered'); // Auto-set to Answered if admin replies
    } catch (err) {
      alert(`Erro ao enviar resposta: ${(err as Error).message}`);
    } finally {
      setIsReplying(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus || !ticketId || !token || newStatus === ticketDetails?.status) return;
     if (window.confirm(`Tem certeza que deseja alterar o status para "${newStatus}"?`)) {
        try {
            await apiService.adminUpdateTicketStatus(ticketId, newStatus, token);
            fetchTicketDetails(); // Refresh details
            alert(`Status do ticket atualizado para "${newStatus}".`);
        } catch (err) {
            alert(`Erro ao atualizar status: ${(err as Error).message}`);
        }
    }
  };
  
  const getStatusColorClass = (status: TicketStatus | '') => {
    switch (status) {
        case 'Open': return 'text-green-400 bg-green-900/50';
        case 'In Progress': return 'text-yellow-400 bg-yellow-900/50';
        case 'Answered': return 'text-blue-400 bg-blue-900/50';
        case 'Closed': return 'text-gray-400 bg-gray-700/50';
        default: return 'text-gray-400 bg-gray-700/50';
    }
  };
  
  const inputClass = "mt-1 block w-full bg-gray-700 text-gray-200 rounded-md shadow-sm p-2 focus:ring-primary focus:border-transparent text-sm custom-scrollbar";
  const labelClass = "block text-sm font-medium text-gray-400";
  const buttonClass = "bg-primary hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm flex items-center justify-center disabled:opacity-50";


  if (isLoading) return <div className="py-10"><LoadingSpinner /></div>;
  if (error) return <p className="text-red-400 text-center py-4 bg-red-900 bg-opacity-30 rounded">{error}</p>;
  if (!ticketDetails) return <p className="text-gray-400 text-center py-4">Ticket não encontrado.</p>;

  return (
    <div className="p-2 md:p-4 bg-admin-bg rounded-lg shadow-xl text-gray-200 space-y-6">
      <Link to="/admin/support-tickets" className="inline-flex items-center text-sm text-primary hover:underline mb-4">
        <FaArrowLeft className="mr-2" /> Voltar para Lista de Tickets
      </Link>

      <section className="bg-admin-card-bg p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <h1 className="text-2xl font-semibold text-primary mb-2 sm:mb-0">Detalhes do Ticket #{ticketDetails.id}</h1>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColorClass(ticketDetails.status)}`}>
                {ticketDetails.status}
            </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm mb-4">
            <div><strong className="text-gray-400">Assunto:</strong> {ticketDetails.subject}</div>
            <div><strong className="text-gray-400">Usuário:</strong> {ticketDetails.user_nome || 'N/A'} (Email: {ticketDetails.user_email})</div>
            <div><strong className="text-gray-400">Criado em:</strong> {new Date(ticketDetails.created_at).toLocaleString('pt-BR')}</div>
            <div><strong className="text-gray-400">Última Atualização:</strong> {new Date(ticketDetails.updated_at).toLocaleString('pt-BR')}</div>
        </div>
        <div className="pt-4">
            <h3 className="text-md font-semibold text-gray-300 mb-1">Descrição Original:</h3>
            <p className="text-sm whitespace-pre-wrap bg-gray-750 p-3 rounded-md">{ticketDetails.description}</p>
        </div>
      </section>

      <section className="bg-admin-card-bg p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-300 mb-4">Respostas</h2>
        <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar pr-2">
          {ticketDetails.replies && ticketDetails.replies.length > 0 ? ticketDetails.replies.map(reply => (
            <div key={reply.id} className={`p-3 rounded-md shadow-sm ${reply.admin_id ? 'bg-blue-900/30 ml-auto w-11/12' : 'bg-gray-750 mr-auto w-11/12'}`}>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-primary">{reply.admin_id ? (user?.id === reply.admin_id ? 'Você (Admin)' : `Admin ID: ${reply.admin_id}`) : (ticketDetails.user_id === reply.user_id ? 'Usuário' : 'Usuário (Outro)')}</span>
                <span className="text-gray-400">{new Date(reply.created_at).toLocaleString('pt-BR')}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
            </div>
          )) : (
            <p className="text-gray-400 text-sm">Nenhuma resposta ainda.</p>
          )}
        </div>
      </section>

      <section className="bg-admin-card-bg p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-300 mb-4">Responder ao Ticket / Atualizar Status</h2>
        <form onSubmit={handlePostReply} className="space-y-4">
            <div>
                <label htmlFor="replyContent" className={labelClass}>Sua Resposta:</label>
                <textarea 
                    id="replyContent" 
                    value={replyContent} 
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={5}
                    className={inputClass}
                    placeholder="Digite sua resposta aqui..."
                />
            </div>
            <button type="submit" className={buttonClass} disabled={isReplying || !replyContent.trim()}>
                <FaPaperPlane className="mr-2" /> {isReplying ? 'Enviando...' : 'Enviar Resposta'}
            </button>
        </form>
        <div className="mt-6 pt-4">
            <label htmlFor="ticketStatus" className={labelClass}>Alterar Status do Ticket:</label>
            <div className="flex items-center gap-3">
                <select 
                    id="ticketStatus" 
                    value={newStatus} 
                    onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
                    className={`${inputClass} flex-grow`}
                >
                    <option value="Open">Aberto</option>
                    <option value="In Progress">Em Progresso</option>
                    <option value="Answered">Respondido</option>
                    <option value="Closed">Fechado</option>
                </select>
                <button onClick={handleUpdateStatus} className={`${buttonClass} bg-green-600 hover:bg-green-700`} disabled={newStatus === ticketDetails.status}>
                    <FaSave className="mr-2" /> Salvar Status
                </button>
            </div>
        </div>
      </section>
    </div>
  );
};

export default AdminSupportTicketDetailPage;