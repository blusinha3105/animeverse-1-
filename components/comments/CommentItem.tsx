
import React, { useState } from 'react';
import { FaReply, FaEdit, FaTrash, FaUserCircle } from 'react-icons/fa';
import { Comment as CommentType } from '../../types';
import { resolveImageUrl } from '../../constants';
import CommentForm from './CommentForm';

interface CommentItemProps {
  comment: CommentType;
  allComments: CommentType[]; // To find replies
  onReply: (content: string, parentId: number | null) => Promise<void>;
  onDelete: (commentId: number) => Promise<void>;
  onUpdate: (commentId: number, newContent: string) => Promise<void>;
  currentUserId?: number | null;
  level?: number; // For indentation of replies
}

const CommentItem: React.FC<CommentItemProps> = ({ 
    comment, 
    allComments,
    onReply, 
    onDelete, 
    onUpdate, 
    currentUserId, 
    level = 0 
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const userImageUrl = comment.user_imagem_perfil ? resolveImageUrl(comment.user_imagem_perfil) : null;
  const canEditOrDelete = currentUserId === comment.user_id;

  const replies = allComments.filter(c => c.parent_comment_id === comment.id);

  const handleEditSubmit = async () => {
    if (editContent.trim() === comment.content.trim() || !editContent.trim()) {
        setIsEditing(false);
        return;
    }
    await onUpdate(comment.id, editContent.trim());
    setIsEditing(false);
  };

  return (
    <div className={`bg-gray-700 p-3 rounded-md shadow ${level > 0 ? `ml-${level * 4} border-l-2 border-primary pl-3` : ''}`}>
      <div className="flex items-start space-x-3">
        {userImageUrl ? (
          <img src={userImageUrl} alt={comment.user_nome} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <FaUserCircle className="w-8 h-8 text-gray-400" />
        )}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-primary">{comment.user_nome}</p>
            <span className="text-xs text-gray-400">
              {new Date(comment.created_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {isEditing ? (
            <div className="mt-2">
                <textarea 
                    value={editContent} 
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    className="w-full p-2 bg-gray-600 text-text-primary rounded-md text-sm custom-scrollbar"
                />
                <div className="mt-1 space-x-2">
                    <button onClick={handleEditSubmit} className="text-xs bg-primary hover:bg-secondary text-white px-2 py-1 rounded">Salvar</button>
                    <button onClick={() => { setIsEditing(false); setEditContent(comment.content); }} className="text-xs bg-gray-500 hover:bg-gray-400 text-white px-2 py-1 rounded">Cancelar</button>
                </div>
            </div>
          ) : (
            <p className="text-sm text-gray-200 mt-1 whitespace-pre-wrap">{comment.content}</p>
          )}

          <div className="mt-2 flex items-center space-x-3">
            {currentUserId && (
              <button onClick={() => setShowReplyForm(!showReplyForm)} className="text-xs text-gray-400 hover:text-primary flex items-center">
                <FaReply className="mr-1" /> Responder
              </button>
            )}
            {canEditOrDelete && !isEditing && (
              <>
                <button onClick={() => setIsEditing(true)} className="text-xs text-gray-400 hover:text-yellow-400 flex items-center">
                  <FaEdit className="mr-1" /> Editar
                </button>
                <button onClick={() => onDelete(comment.id)} className="text-xs text-gray-400 hover:text-red-400 flex items-center">
                  <FaTrash className="mr-1" /> Excluir
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {showReplyForm && (
        <div className={`mt-2 ${level < 3 ? `pl-${(level+1)*2}` : 'pl-2'}`}> {/* Limit indentation */}
          <CommentForm 
            onSubmit={async (content) => {
              await onReply(content, comment.id);
              setShowReplyForm(false); // Hide form after successful reply
            }} 
            isSubmitting={false} // This should be managed by CommentSection if posting state is global
            placeholderText={`Respondendo a ${comment.user_nome}...`}
            buttonText="Enviar Resposta"
            compact
          />
        </div>
      )}
      {replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {replies.map(reply => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              allComments={allComments}
              onReply={onReply} 
              onDelete={onDelete}
              onUpdate={onUpdate}
              currentUserId={currentUserId}
              level={Math.min(level + 1, 3)} // Cap indentation at level 3 for readability
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;