import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth'; // To get current user for avatar if needed
import { FaPaperPlane } from 'react-icons/fa';

interface CommentFormProps {
  onSubmit: (content: string, parentId?: number | null) => Promise<void>;
  isSubmitting: boolean;
  placeholderText?: string;
  buttonText?: string;
  compact?: boolean; // For reply forms
  parentId?: number | null; // For replies
}

const CommentForm: React.FC<CommentFormProps> = ({ 
    onSubmit, 
    isSubmitting, 
    placeholderText = "Escreva seu comentário...", 
    buttonText = "Comentar",
    compact = false,
    parentId = null 
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await onSubmit(content.trim(), parentId);
    setContent(''); // Clear form after submission
  };

  if (!user && !compact) { // Don't show main form if not logged in and not a reply form
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className={`mt-4 ${compact ? 'ml-8' : 'p-4 bg-gray-750 rounded-md'}`}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholderText}
        rows={compact ? 2 : 3}
        className={`w-full p-2 bg-gray-600 text-text-primary rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none custom-scrollbar ${compact ? 'mb-1' : 'mb-2'}`}
        required
        disabled={isSubmitting}
      />
      <div className={`flex ${compact ? 'justify-end' : 'justify-end'}`}>
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className={`px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-secondary rounded-md transition-colors disabled:opacity-50 flex items-center
                      ${compact ? 'text-xs px-3 py-1.5' : ''}`}
        >
          <FaPaperPlane className={`mr-1.5 ${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
          {isSubmitting ? (compact ? 'Enviando...' : 'Enviando Comentário...') : buttonText}
        </button>
      </div>
    </form>
  );
};

export default CommentForm;