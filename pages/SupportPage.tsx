import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import { SupportTicket, TicketStatus } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { FaPlus, FaListAlt, FaSpinner } from 'react-icons/fa';

const SupportPage: React.FC = () => {
  const { user, token, loading: authLoading } = useAuth();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState(user?.email || ''); // Pre-fill if user is logged in
  
  const [userTickets, setUserTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchUserTickets = useCallback(async () => {
    if (user && token) {
      setIsLoadingTickets(true);
      try {
        const tickets = await apiService.getUserSupportTickets(token);
        setUserTickets(tickets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      } catch (err) {
        console.error("Falha ao buscar tickets do usuário:", err);
        // setError("Não foi possível carregar seus tickets anteriores.");
      } finally {
        setIsLoadingTickets(false);
      }
    }
  }, [user, token]);

  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
    fetchUserTickets();
  }, [user, fetchUserTickets, email]);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim() || (!user && !email.trim())) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const ticketData = { subject, description, email: user ? undefined : email };
      await apiService.submitSupportTicket(ticketData, token || undefined);
      setSuccessMessage("Seu ticket de suporte foi enviado com sucesso! Entraremos em contato em breve.");
      setSubject('');
      setDescription('');
      if (!user) setEmail(''); // Clear email if anonymous
      fetchUserTickets(); // Refresh ticket list
    } catch (err) {
      setError((err as Error).message || "Falha ao enviar o ticket de suporte.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
        case 'Open': return 'text-green-400 bg-green-900';
        case 'In Progress': return 'text-yellow-400 bg-yellow-900';
        case 'Answered': return 'text-blue-400 bg-blue-900';
        case 'Closed': return 'text-gray-400 bg-gray-700';
        default: return 'text-gray-400 bg-gray-700';
    }
  };
  
  const inputClass = "mt-1 block w-full px-3 py-2 bg-card rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-transparent sm:text-sm text-text-primary custom-scrollbar";
  const labelClass = "block text-sm font-medium text-text-secondary";


  if (authLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <section className="bg-card shadow-xl rounded-lg p-6 md:p-8">
        <h1 className="text-3xl font-bold text-primary mb-6 flex items-center">
          <FaPlus className="mr-3" /> Enviar Novo Ticket de Suporte
        </h1>
        {successMessage && <p className="mb-4 p-3 bg-green-800 text-green-200 rounded-md text-sm">{successMessage}</p>}
        {error && <p className="mb-4 p-3 bg-red-800 text-red-200 rounded-md text-sm">{error}</p>}
        <form onSubmit={handleSubmitTicket} className="space-y-6">
          {!user && (
            <div>
              <label htmlFor="email" className={labelClass}>Seu Email:</label>
              <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} placeholder="seuemail@exemplo.com" />
            </div>
          )}
          <div>
            <label htmlFor="subject" className={labelClass}>Assunto:</label>
            <input type="text" id="subject" value={subject} onChange={e => setSubject(e.target.value)} required className={inputClass} placeholder="Ex: Problema ao assistir episódio X" />
          </div>
          <div>
            <label htmlFor="description" className={labelClass}>Descrição Detalhada:</label>
            <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={6} required className={inputClass} placeholder="Por favor, descreva seu problema ou dúvida com o máximo de detalhes possível." />
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary disabled:opacity-60 transition-colors"
          >
            {isSubmitting ? <><FaSpinner className="animate-spin mr-2" /> Enviando...</> : 'Enviar Ticket'}
          </button>
        </form>
      </section>

      {user && (
        <section className="bg-card shadow-xl rounded-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold text-primary mb-6 flex items-center">
            <FaListAlt className="mr-3" /> Meus Tickets de Suporte
          </h2>
          {isLoadingTickets ? <LoadingSpinner /> : 
           userTickets.length === 0 ? <p className="text-text-secondary">Você ainda não abriu nenhum ticket de suporte.</p> : (
            <div className="space-y-4">
              {userTickets.map(ticket => (
                <div key={ticket.id} className="bg-gray-700 p-4 rounded-md shadow">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-text-primary">{ticket.subject}</h3>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                      {ticket.status === 'Open' ? 'Aberto' : ticket.status === 'In Progress' ? 'Em Progresso' : ticket.status === 'Answered' ? 'Respondido' : 'Fechado'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Ticket ID: {ticket.id} | Criado em: {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-sm text-gray-300 mt-2 truncate">
                    {ticket.description}
                  </p>
                  {/* <Link to={`/support/ticket/${ticket.id}`} className="text-xs text-primary hover:underline mt-2 inline-block">Ver Detalhes</Link> */}
                  {/* Placeholder for ticket detail view if implemented */}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default SupportPage;