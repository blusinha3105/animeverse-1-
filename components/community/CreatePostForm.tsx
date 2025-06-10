
import React, { useState } from 'react';
import { apiService } from '../../services/apiService';
import { CommunityPost } from '../../types';
import { FaPaperPlane, FaImage, FaSpinner, FaFaceSmile } from 'react-icons/fa6';
import StickerPicker from './StickerPicker';

interface CreatePostFormProps {
  onPostCreated: (newPost: CommunityPost) => void;
  token: string;
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({ onPostCreated, token }) => {
  const [contentText, setContentText] = useState('');
  const [contentImageURL, setContentImageURL] = useState('');
  const [selectedStickerUrl, setSelectedStickerUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentText.trim() && !contentImageURL.trim() && !selectedStickerUrl.trim()) {
      setError("A publicação precisa de conteúdo (texto, imagem ou sticker).");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      // User details (name, avatar) will be handled by the backend using the token
      const newPost = await apiService.createCommunityPost({ 
        contentText: contentText.trim(), 
        contentImageURL: contentImageURL.trim() || undefined,
        sticker_url: selectedStickerUrl.trim() || undefined
      }, token);
      onPostCreated(newPost); // newPost from backend should have all user details
      setContentText('');
      setContentImageURL('');
      setSelectedStickerUrl('');
    } catch (err) {
      setError((err as Error).message || "Erro ao criar publicação.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStickerSelect = (stickerUrl: string) => {
    setSelectedStickerUrl(stickerUrl);
    setShowStickerPicker(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="contentText" className="sr-only">Conteúdo da Publicação</label>
          <textarea
            id="contentText"
            value={contentText}
            onChange={(e) => setContentText(e.target.value)}
            placeholder="No que você está pensando?"
            rows={3}
            className="w-full p-3 bg-gray-700 text-text-primary rounded-md focus:ring-2 focus:ring-primary outline-none custom-scrollbar"
            disabled={isSubmitting}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
                <label htmlFor="contentImageURL" className="sr-only">URL da Imagem (Opcional)</label>
                <div className="flex items-center bg-gray-700 rounded-md">
                    <span className="pl-3 text-gray-400"><FaImage/></span>
                    <input
                    type="text"
                    id="contentImageURL"
                    value={contentImageURL}
                    onChange={(e) => setContentImageURL(e.target.value)}
                    placeholder="URL da Imagem (Opcional)"
                    className="w-full p-3 bg-transparent text-text-primary focus:ring-0 focus:ring-primary outline-none text-sm"
                    disabled={isSubmitting}
                    />
                </div>
            </div>
            <button 
                type="button"
                onClick={() => setShowStickerPicker(true)}
                className="w-full sm:w-auto p-3 bg-gray-700 hover:bg-gray-600 text-text-secondary rounded-md transition-colors flex items-center justify-center text-sm"
                disabled={isSubmitting}
            >
                <FaFaceSmile className="mr-2"/> Adicionar Sticker
            </button>
        </div>

        {selectedStickerUrl && (
            <div className="p-2 bg-gray-700 rounded-md inline-block">
                <img src={selectedStickerUrl} alt="Sticker Selecionado" className="h-16 w-16 object-contain"/>
                <button 
                    type="button" 
                    onClick={() => setSelectedStickerUrl('')} 
                    className="text-xs text-red-400 hover:text-red-300 mt-1"
                >
                    Remover Sticker
                </button>
            </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || (!contentText.trim() && !contentImageURL.trim() && !selectedStickerUrl.trim())}
            className="px-4 py-2 bg-primary hover:bg-secondary text-white font-semibold rounded-md transition-colors disabled:opacity-60 flex items-center"
          >
            {isSubmitting ? <FaSpinner className="animate-spin mr-2"/> : <FaPaperPlane className="mr-2" />}
            {isSubmitting ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </form>
      {showStickerPicker && (
        <StickerPicker 
          onSelectSticker={handleStickerSelect} 
          onClose={() => setShowStickerPicker(false)} 
        />
      )}
    </>
  );
};

export default CreatePostForm;
      