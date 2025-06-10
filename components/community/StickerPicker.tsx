import React, { useState, useEffect, useCallback } from 'react';
import { Sticker } from '../../types';
import { apiService } from '../../services/apiService';
import LoadingSpinner from '../LoadingSpinner';
import { FaTimes, FaTag } from 'react-icons/fa';
import { resolveImageUrl } from '../../constants';

interface StickerPickerProps {
  onSelectSticker: (stickerUrl: string) => void;
  onClose: () => void;
}

const StickerPicker: React.FC<StickerPickerProps> = ({ onSelectSticker, onClose }) => {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');

  const fetchStickers = useCallback(async () => {
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

  const categories = ['all', ...Array.from(new Set(stickers.map(s => s.category).filter(Boolean) as string[]))];

  const filteredStickers = stickers.filter(sticker => {
    const matchesCategory = selectedCategory === 'all' || sticker.category === selectedCategory;
    const matchesSearch = searchTerm === '' || sticker.name.toLowerCase().includes(searchTerm.toLowerCase()) || (sticker.category && sticker.category.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-card p-4 sm:p-5 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-primary">Escolha um Sticker</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <input
            type="text"
            placeholder="Buscar stickers..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full p-2 bg-gray-700 text-text-primary rounded-md text-sm focus:ring-primary outline-none"
          />
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full p-2 bg-gray-700 text-text-primary rounded-md text-sm focus:ring-primary outline-none custom-scrollbar"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'Todas Categorias' : cat}
              </option>
            ))}
          </select>
        </div>

        {isLoading && <div className="py-8 flex-grow flex items-center justify-center"><LoadingSpinner /></div>}
        {error && <p className="text-red-400 text-center py-4 flex-grow">{error}</p>}
        
        {!isLoading && !error && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 overflow-y-auto custom-scrollbar flex-grow p-1">
            {filteredStickers.length > 0 ? filteredStickers.map(sticker => (
              <button
                key={sticker.id}
                onClick={() => {
                  onSelectSticker(sticker.image_url);
                  onClose();
                }}
                className="bg-gray-700 p-2 rounded-md hover:bg-gray-600 transition-colors aspect-square flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary"
                title={sticker.name}
              >
                <img 
                  src={resolveImageUrl(sticker.image_url)} 
                  alt={sticker.name} 
                  className="w-16 h-16 object-contain"
                  onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/64?text=Error"; }}
                />
                <span className="text-xs text-text-secondary mt-1 truncate w-full text-center">{sticker.name}</span>
              </button>
            )) : (
              <p className="text-gray-400 text-center col-span-full py-6">Nenhum sticker encontrado.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StickerPicker;