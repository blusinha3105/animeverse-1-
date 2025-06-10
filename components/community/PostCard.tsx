
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CommunityPost } from '../../types';
import { resolveImageUrl } from '../../constants'; 
import { FaHeart, FaRegHeart, FaCommentAlt, FaShareSquare, FaUserCircle } from 'react-icons/fa';
import { apiService } from '../../services/apiService';

interface PostCardProps {
  post: CommunityPost;
  currentUserId?: number | string | null;
  token?: string | null;
  isDetailView?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, currentUserId, token, isDetailView = false }) => {
  const [likes, setLikes] = useState(post.likes_count);
  const [isLiked, setIsLiked] = useState(post.isLiked || false);

  useEffect(() => {
    // Initialize from prop if backend provided this value during fetch
    setIsLiked(post.isLiked || false); 
    setLikes(post.likes_count);
  }, [post.isLiked, post.likes_count]);


  const handleLike = async () => {
    if (!token) {
        alert("Você precisa estar logado para curtir.");
        return;
    }
    
    const originalIsLiked = isLiked;
    const originalLikesCount = likes;

    // Optimistic update
    setIsLiked(!originalIsLiked);
    setLikes(prevLikes => originalIsLiked ? prevLikes - 1 : prevLikes + 1);

    try {
        const response = await apiService.likePost(post.id, token);
        if (response.success) {
            // Update with actual count and like status from backend
            setLikes(response.likesCount);
            setIsLiked(response.liked); 
        } else {
            // Revert optimistic update if backend call failed
            setIsLiked(originalIsLiked); 
            setLikes(originalLikesCount);
            alert("Não foi possível curtir o post.");
        }
    } catch (error) {
        console.error("Erro ao curtir post:", error);
        // Revert optimistic update
        setIsLiked(originalIsLiked); 
        setLikes(originalLikesCount);
        alert("Erro ao tentar curtir o post.");
    }
  };

  const userAvatarUrl = post.user_avatar ? resolveImageUrl(post.user_avatar) : null;
  const postImageUrl = post.content_image_url ? resolveImageUrl(post.content_image_url) : null;
  const postStickerUrl = post.sticker_url ? resolveImageUrl(post.sticker_url) : null;


  return (
    <article className="bg-card rounded-lg shadow-lg p-4 sm:p-5">
      <header className="flex items-center mb-3">
        {userAvatarUrl ? (
            <img src={userAvatarUrl} alt={post.user_name} className="w-10 h-10 rounded-full mr-3 object-cover"/>
        ) : (
            <FaUserCircle className="w-10 h-10 text-gray-500 mr-3"/>
        )}
        <div>
          <h3 className="font-semibold text-text-primary text-sm sm:text-base">{post.user_name}</h3>
          <p className="text-xs text-text-secondary">
            {new Date(post.created_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </header>

      {post.content_text && (
        <div className="mb-3">
            <p className="text-text-primary whitespace-pre-wrap text-sm sm:text-base">{post.content_text}</p>
        </div>
      )}

      {postImageUrl && (
        <Link to={`/community/post/${post.id}`} className="block mb-3 rounded-md overflow-hidden">
            <img src={postImageUrl} alt="Conteúdo da publicação" className="w-full h-auto max-h-96 object-contain bg-black rounded-md" />
        </Link>
      )}

      {postStickerUrl && (
         <div className="my-3 flex justify-start">
            <img 
                src={postStickerUrl} 
                alt="Sticker da publicação" 
                className="max-w-[128px] max-h-[128px] object-contain" 
            />
        </div>
      )}


      <footer className="flex items-center justify-between text-text-secondary pt-3">
        <div className="flex items-center space-x-4">
          <button onClick={handleLike} className={`flex items-center text-xs sm:text-sm hover:text-primary-action transition-colors ${isLiked ? 'text-primary-action' : ''}`} disabled={!token}>
            {isLiked ? <FaHeart className="mr-1.5"/> : <FaRegHeart className="mr-1.5"/>} 
            {likes} Curtidas
          </button>
          <Link to={`/community/post/${post.id}`} className="flex items-center text-xs sm:text-sm hover:text-primary transition-colors">
            <FaCommentAlt className="mr-1.5" /> {post.comments_count} Comentários
          </Link>
        </div>
        <button className="flex items-center text-xs sm:text-sm hover:text-primary transition-colors">
          <FaShareSquare className="mr-1.5" /> Compartilhar
        </button>
      </footer>
      {!isDetailView && post.comments_count > 0 && (
         <Link to={`/community/post/${post.id}`} className="text-xs text-primary hover:underline mt-2 inline-block">
            Ver todos os {post.comments_count} comentários...
        </Link>
      )}
    </article>
  );
};

export default PostCard;
      