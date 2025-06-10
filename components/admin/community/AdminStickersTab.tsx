import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../../services/apiService';
import { useAuth } from '../../../hooks/useAuth';
import { Sticker } from '../../../types';
import LoadingSpinner from '../../LoadingSpinner';
import { FaTrash, FaPlus, FaSpinner, FaImage, FaTag } from 'react-icons/fa6';
import { resolveImageUrl } from '../../../constants';

const AdminStickersTab: React.FC = () => {
  const { token } = useAuth();
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStickerName, setNewStickerName] = useState('');
  const [newStickerCategory, setNewStickerCategory] = useState('');
  const [newStickerImageUrl, setNewStickerImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStickers = useCallback(async () => {
    // This calls the public endpoint, for admin it could be /admin/stickers if different
    setIsLoading(true);
    setError(null);
    try {
      const fetchedStickers = await apiService.getStickers(); 
      setStickers(fetchedStickers);
    } catch (err) {
      setError((err as Error).message || 'Falha ao carregar stickers.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStickers();
  }, [fetchStickers]);

  const handleAddSticker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newStickerName.trim() || !newStickerImageUrl.trim()) {
      alert("Nome do sticker e URL da imagem são obrigatórios.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const newSticker = await apiService.adminAddSticker({
        name: newStickerName.trim(),
        category: newStickerCategory.trim() || undefined,
        image_url: newStickerImageUrl.trim()
      }, token);
      setStickers(prev => [...prev, newSticker]);
      setNewStickerName('');
      setNewStickerCategory('');
      setNewStickerImageUrl('');
      setShowAddForm(false);
    } catch (err) {
      setError((err as Error).message || 'Falha ao adicionar sticker.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSticker = async (stickerId: number) => {
    if (!token || !window.confirm(`Tem certeza que deseja excluir o sticker ID: ${stickerId}?`)) return;
    try {
      await apiService.adminDeleteSticker(stickerId, token);
      setStickers(prev => prev.filter(s => s.id !== stickerId));
      alert('Sticker excluído com sucesso.');
    } catch (err) {
      alert(`Erro ao excluir sticker: ${(err as Error).message}`);
    }
  };

  const inputClass = "mt-1 block w-full bg-gray-700 text-gray-200 rounded-md shadow-sm p-2 focus:ring-primary focus:border-transparent text-sm";
  const labelClass = "block text-sm font-medium text-gray-400";
  const buttonClass = "bg-primary hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm flex items-center justify-center disabled:opacity-50";

  if (isLoading) return <div className="py-8"><LoadingSpinner /></div>;
  if (error && !showAddForm) return <p className="text-red-400 text-center py-4 bg-red-900 bg-opacity-30 rounded">{error}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-200">Gerenciar Stickers</h2>
        <button onClick={() => setShowAddForm(!showAddForm)} className={buttonClass}>
          <FaPlus className="mr-2" /> {showAddForm ? 'Cancelar' : 'Adicionar Sticker'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddSticker} className="mb-6 p-4 bg-gray-750 rounded-lg space-y-3 shadow-md">
          <h3 className="text-lg font-medium text-primary">Novo Sticker</h3>
          <div>
            <label htmlFor="newStickerName" className={labelClass}>Nome do Sticker:</label>
            <input type="text" id="newStickerName" value={newStickerName} onChange={e => setNewStickerName(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label htmlFor="newStickerCategory" className={labelClass}>Categoria (Opcional):</label>
            <input type="text" id="newStickerCategory" value={newStickerCategory} onChange={e => setNewStickerCategory(e.target.value)} className={inputClass} placeholder="Ex: Reações, Memes"/>
          </div>
          <div>
            <label htmlFor="newStickerImageUrl" className={labelClass}><FaImage className="inline mr-1"/> URL da Imagem do Sticker:</label>
            <input type="text" id="newStickerImageUrl" value={newStickerImageUrl} onChange={e => setNewStickerImageUrl(e.target.value)} className={inputClass} placeholder="https://exemplo.com/sticker.png" required />
          </div>
          {error && showAddForm && <p className="text-sm text-red-400 bg-red-900 bg-opacity-30 p-2 rounded">{error}</p>}
          <button type="submit" className={buttonClass} disabled={isSubmitting}>
            {isSubmitting ? <FaSpinner className="animate-spin mr-2"/> : <FaPlus className="mr-2"/>}
            {isSubmitting ? 'Adicionando...' : 'Adicionar Sticker'}
          </button>
        </form>
      )}

      {stickers.length === 0 && !isLoading && !showAddForm && (
        <p className="text-center text-gray-400 py-6">Nenhum sticker encontrado. Adicione alguns!</p>
      )}

      {stickers.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {stickers.map(sticker => (
            <div key={sticker.id} className="bg-gray-800 p-3 rounded-lg shadow-md text-center group relative">
              <img 
                src={resolveImageUrl(sticker.image_url)} 
                alt={sticker.name} 
                className="w-20 h-20 object-contain mx-auto mb-2"
                onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/80?text=Error"; }}
              />
              <p className="text-xs text-gray-300 truncate font-medium" title={sticker.name}>{sticker.name}</p>
              {sticker.category && <p className="text-[10px] text-primary truncate" title={sticker.category}><FaTag className="inline mr-0.5"/>{sticker.category}</p>}
              <button 
                onClick={() => handleDeleteSticker(sticker.id)}
                className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                title="Excluir Sticker"
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminStickersTab;