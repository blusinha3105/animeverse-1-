
import { API_BASE_URL } from '../constants';
import { 
  Anime, AnimeBase, Episode, PaginatedAnimesResponse, PaginatedEpisodesResponse, 
  TemporaryLinkResponse, SiteAlert, User, CategoryCount, AnimeExibirResponse,
  Comment, SupportTicket, SupportTicketReply, SupportTicketWithReplies, TicketStatus,
  CommunityPost, CommunityComment, NewsArticle, UserNotification,
  CollectionItem, CollectionStatus, DownloadedItem, Sticker, FeaturedListItemAdmin
} from '../types';

interface FetchOptions extends RequestInit {
  token?: string | null;
}

// Specific payload for adding a downloaded item, matching backend expectations for req.body
interface AddDownloadItemPayload {
  anime_id: number;
  episode_id?: number;
  title: string;
  episode_title?: string;
  season_number?: number;
  episode_number?: number;
  thumbnail_url: string;
}

const getAuthHeaders = (token?: string | null) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`; 
  }
  return headers;
};


async function fetchApi<T,>(endpoint: string, options: FetchOptions = {}, baseUrl: string = API_BASE_URL): Promise<T> {
  const { token, ...fetchOptions } = options;
  const requestUrl = `${baseUrl}${endpoint}`;
  
  console.log(`API Request: ${fetchOptions.method || 'GET'} ${requestUrl}`, { options: fetchOptions, tokenProvided: !!token });

  try {
    const response = await fetch(requestUrl, {
      ...fetchOptions,
      headers: {
        ...getAuthHeaders(token),
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      let errorData: any; // Use 'any' for flexibility with error structures
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: response.statusText };
      }
      console.error(`API Error Response for ${requestUrl}:`, response.status, errorData);
      // Improved error message extraction
      throw new Error(errorData.message || errorData.error || `API Error: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      return response.json();
    } else {
      if (response.status === 204 || response.headers.get('Content-Length') === '0') {
        return {} as T; 
      }
      const textResponse = await response.text();
      console.log(`API Non-JSON Response for ${requestUrl}:`, textResponse);
      return textResponse as unknown as T; 
    }
  } catch (error) {
    console.error(`API Fetch Failed for ${requestUrl}:`, error);
    if (error instanceof TypeError && (error as TypeError).message === 'Failed to fetch') {
      throw new Error(`Network error: Failed to fetch from ${requestUrl}. Please ensure the backend server is running and accessible, and check for CORS issues in the browser console.`);
    }
    // Re-throw specific API errors that were constructed above
    if (error instanceof Error && (error.message.startsWith('API Error:') || error.message.includes('required for download entry') || error.message.includes('Failed to retrieve'))) {
        throw error; 
    }
    // For other errors, wrap them or provide a generic message
    throw new Error((error as Error).message || 'An unknown network error occurred while trying to fetch data.');
  }
}

const ANIME_EXIBIR_BASE_URL = 'https://back-api.orbital.host';

export const apiService = {
  getAnimesRecentes: (): Promise<Anime[]> => fetchApi<Anime[]>('/animesRecentes'),
  getFilmesRecentes: (): Promise<AnimeBase[]> => fetchApi<AnimeBase[]>('/FilmesRecentes'), // This might be replaced by featured_movies
  getAnimesAleatorios: (): Promise<AnimeBase[]> => fetchApi<AnimeBase[]>('/AnimesAleatorios'),
  getAnimesLancadosHoje: (): Promise<{ episodiosNovos: { anime: AnimeBase, numero: number, temporada: number, nome: string }[] }> => 
    fetchApi('/animes-lancados-hoje'),
  getPaginatedAnimes: (page: number = 1): Promise<PaginatedAnimesResponse> =>
    fetchApi<PaginatedAnimesResponse>(`/animesPagina/${page}`),
  getAnimeById: (id: string): Promise<Anime> => fetchApi<Anime>(`/todosAnimes/${id}`), 
  getPaginatedEpisodes: (animeId: string, page: number = 1, itemsPerPage: number = 10): Promise<PaginatedEpisodesResponse> =>
    fetchApi<PaginatedEpisodesResponse>(`/episodiosPagina/${animeId}?pagina=${page}&itensPorPagina=${itemsPerPage}`),
  getAnimeExibirDetails: async (animeId: string): Promise<AnimeExibirResponse> => {
    return fetchApi<AnimeExibirResponse>(`/animes_exibir/${animeId}`, {}, ANIME_EXIBIR_BASE_URL);
  },
  getEpisodeDetails: (animeId: string, episodeNumber: string): Promise<{ anime: AnimeBase, episodio: Episode }> =>
    fetchApi(`/episodio/${animeId}/${episodeNumber}`),
  searchAnimes: (term: string, limit: number = 20): Promise<Anime[]> =>
    fetchApi<Anime[]>(`/pesquisa/termo?term=${encodeURIComponent(term)}&limit=${limit}`),
  generateTemporaryLink: (linkVideo: string): Promise<TemporaryLinkResponse> =>
    fetchApi<TemporaryLinkResponse>('/api/gerar-link-temporario', {
      method: 'POST',
      body: JSON.stringify({ linkVideo }),
    }),
  getActiveAlert: (): Promise<SiteAlert> => fetchApi<SiteAlert>('/avisoAtivo'),
  incrementAnimeView: (animeId: string): Promise<{ message: string }> =>
    fetchApi(`/animes/${animeId}/visualizar`, { method: 'POST' }),
  getAnimeViews: (animeId: string): Promise<{ id: string; visualizacoes: number }> =>
    fetchApi(`/animes/${animeId}/visualizacoes`),
  getSimilarTitles: (animeId: string): Promise<AnimeBase[]> => fetchApi(`/titulos-semelhantes/${animeId}`),
  getProfileImageUrl: (userId: number, token: string): Promise<{ url: string }> => 
    fetchApi<{ url: string }>(`/obter-imagem-de-perfil/${userId}`, { token }),
  uploadProfilePicture: async (userId: number, file: File, token: string): Promise<{ message: string }> => {
    const formData = new FormData();
    formData.append('fotoPerfil', userId.toString()); 
    formData.append('file', file); 
    const requestUrl = `${API_BASE_URL}/upload`;
    const response = await fetch(requestUrl, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }
    return response.json();
  },
  getCategoryCounts: (categories: string[]): Promise<CategoryCount> => 
    fetchApi<CategoryCount>(`/categorias?categorias=${categories.join(',')}`),

  // User Settings
  updateUserName: (newName: string, token: string): Promise<User> => 
    fetchApi<User>('/user/update-name', { method: 'PUT', body: JSON.stringify({ nome: newName }), token }),
  updateUserEmail: (newEmail: string, token: string): Promise<User> =>
    fetchApi<User>('/user/update-email', { method: 'PUT', body: JSON.stringify({ email: newEmail }), token }),
  updateUserProfilePictureByUrl: (imageUrl: string, token: string): Promise<User> =>
    fetchApi<User>('/user/update-profile-picture-url', { method: 'PUT', body: JSON.stringify({ imagem_perfil_url: imageUrl }), token }),
  updateUserPassword: (currentPassword: string, newPassword: string, token: string): Promise<{ message: string }> =>
    fetchApi<{ message: string }>('/user/update-password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }), token }),

  // Native Anime Comments (connected to backend)
  getComments: (animeId: string, episodeNumber: string): Promise<Comment[]> => {
    return fetchApi<Comment[]>(`/comments/anime/${animeId}/episode/${episodeNumber}`); 
  },
  postComment: (animeId: string, episodeNumber: string, content: string, parentId: number | null = null, token: string): Promise<Comment> => {
    return fetchApi<Comment>(`/comments`, { method: 'POST', body: JSON.stringify({ anime_id: animeId, episode_number: episodeNumber, content, parent_comment_id: parentId }), token });
  },
  deleteUserComment: (commentId: number, token: string): Promise<void> => {
    return fetchApi<void>(`/comments/${commentId}`, { method: 'DELETE', token });
  },
  updateUserComment: (commentId: number, content: string, token: string): Promise<Comment> => {
    return fetchApi<Comment>(`/comments/${commentId}`, { method: 'PUT', body: JSON.stringify({ content }), token });
  },

  // Support Tickets (connected to backend)
  submitSupportTicket: (data: { subject: string; description: string; email?: string }, token?: string): Promise<SupportTicket> => {
    return fetchApi<SupportTicket>(`/support-tickets`, { method: 'POST', body: JSON.stringify(data), token });
  },
  getUserSupportTickets: (token: string): Promise<SupportTicket[]> => {
    return fetchApi<SupportTicket[]>(`/support-tickets/my-tickets`, { token });
  },
  getSupportTicketDetails: (ticketId: string, token: string): Promise<SupportTicketWithReplies> => {
    return fetchApi<SupportTicketWithReplies>(`/support-tickets/${ticketId}`, { token });
  },

  // Stickers API (connected to backend)
  getStickers: async (): Promise<Sticker[]> => fetchApi<Sticker[]>(`/api/stickers`),

  // Community Posts - Connected to REAL backend
  getCommunityPosts: async (): Promise<CommunityPost[]> => {
    return fetchApi<CommunityPost[]>('/api/community/posts');
  },
  createCommunityPost: async (postData: { contentText: string; contentImageURL?: string; sticker_url?: string }, token: string): Promise<CommunityPost> => {
    return fetchApi<CommunityPost>('/api/community/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
      token,
    });
  },
  likePost: async (postId: string | number, token: string): Promise<{ success: boolean; liked: boolean, likesCount: number }> => {
    return fetchApi<{ success: boolean; liked: boolean, likesCount: number }>(`/api/community/posts/${postId}/like`, {
      method: 'POST',
      token,
    });
  },

  // Community Comments - Connected to REAL backend
  getPostComments: async (postId: string | number): Promise<CommunityComment[]> => {
    return fetchApi<CommunityComment[]>(`/api/community/posts/${postId}/comments`);
  },
  addCommentToPost: async (postId: string | number, commentData: { contentText: string }, token: string): Promise<CommunityComment> => {
    return fetchApi<CommunityComment>(`/api/community/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData),
      token,
    });
  },

  // News - Connected to REAL backend
  getNewsArticles: async (): Promise<NewsArticle[]> => {
    return fetchApi<NewsArticle[]>('/api/news');
  },
  getNewsArticleBySlug: async (slug: string): Promise<NewsArticle | null> => {
    try {
      return await fetchApi<NewsArticle>(`/api/news/${slug}`);
    } catch (error) {
      if ((error as Error).message.includes("404") || (error as Error).message.toLowerCase().includes("not found")) {
        return null;
      }
      throw error;
    }
  },
  
  // User Notifications - Connected to REAL backend
  getUserNotifications: async (token: string): Promise<UserNotification[]> => {
    return fetchApi<UserNotification[]>('/api/notifications', { token });
  },
  markNotificationAsRead: async (notificationId: string | number, token: string): Promise<{ success: boolean }> => {
    return fetchApi<{ success: boolean }>(`/api/notifications/${notificationId}/read`, { method: 'POST', token });
  },
  markAllNotificationsAsRead: async (token: string): Promise<{ success: boolean, markedCount: number }> => {
    return fetchApi<{ success: boolean, markedCount: number }>(`/api/notifications/read-all`, { method: 'POST', token });
  },

  getRandomAnimeId: async (): Promise<number | null> => {
    const animes = await apiService.getAnimesAleatorios();
    if (animes.length > 0) return animes[Math.floor(Math.random() * animes.length)].id;
    return null;
  },

  // User Collections API - Connected to REAL backend
  getCollectionItems: async (token: string): Promise<CollectionItem[]> => {
    if (!token) throw new Error("Autenticação necessária para ver coleção.");
    return fetchApi<CollectionItem[]>('/api/my-collection', { token });
  },
  addCollectionItem: async (token: string, animeId: number, status: CollectionStatus, notes?: string, lastWatchedEpisode?: string): Promise<CollectionItem> => {
    if (!token) throw new Error("Autenticação necessária para adicionar à coleção.");
    return fetchApi<CollectionItem>('/api/my-collection', {
      method: 'POST',
      body: JSON.stringify({ anime_id: animeId, status, notes, last_watched_episode: lastWatchedEpisode }),
      token
    });
  },
  updateCollectionItemStatus: async (token: string, animeId: number, status: CollectionStatus, notes?: string, lastWatchedEpisode?: string): Promise<CollectionItem> => {
    // This is the same as addCollectionItem due to backend upsert logic
    if (!token) throw new Error("Autenticação necessária para atualizar item da coleção.");
     return fetchApi<CollectionItem>('/api/my-collection', {
      method: 'POST', // Backend handles upsert
      body: JSON.stringify({ anime_id: animeId, status, notes, last_watched_episode: lastWatchedEpisode }),
      token
    });
  },
  removeCollectionItem: async (token: string, animeId: number): Promise<{ success: boolean }> => {
    if (!token) throw new Error("Autenticação necessária para remover da coleção.");
    return fetchApi<{ success: boolean }>(`/api/my-collection/${animeId}`, {
      method: 'DELETE',
      token
    });
  },

  // User Downloads API (Mocked backend)
  getDownloadedItems: async (token: string): Promise<DownloadedItem[]> => {
    if (!token) throw new Error("Autenticação necessária para ver downloads.");
    return fetchApi<DownloadedItem[]>('/api/my-downloads', { token });
  },
  addDownloadedItem: async (token: string, itemData: AddDownloadItemPayload): Promise<DownloadedItem> => {
    if (!token) throw new Error("Autenticação necessária para adicionar download.");
    return fetchApi<DownloadedItem>('/api/my-downloads', {
      method: 'POST',
      body: JSON.stringify(itemData),
      token
    });
  },
  removeDownloadedItem: async (token: string, itemId: string | number): Promise<{ success: boolean }> => {
    if (!token) throw new Error("Autenticação necessária para remover download.");
    return fetchApi<{ success: boolean }>(`/api/my-downloads/${itemId}`, { method: 'DELETE', token });
  },


  // Featured Content API (for homepage)
  getFeaturedContentList: async (listName: string): Promise<AnimeBase[]> => {
    return fetchApi<AnimeBase[]>(`/api/featured-content/${listName}`);
  },

  // Admin Panel Specific APIs
  adminClearDatabase: (token: string): Promise<any> => fetchApi('/limparBanco', { method: 'DELETE', token }),
  adminSendBroadcastMessage: async (message: { titulo: string; conteudo: string }, token: string): Promise<any> => 
    fetchApi('/enviarAviso', { method: 'POST', body: JSON.stringify(message), token }),
  adminGenerateSitemap: async (type: 'a' | 'e' | 't', token: string): Promise<string> => 
    fetchApi(`/generate-sitemap?type=${type}&url=${encodeURIComponent(window.location.origin)}`, { token }), 
  adminGetSiteSettings: async (token: string): Promise<any> => fetchApi('/admin/settings', { token }), 
  adminUpdateSiteSettings: async (settings: any, token: string): Promise<any> => fetchApi('/admin/settings', { method: 'PUT', body: JSON.stringify(settings), token }),
  adminGetCatalogs: async (token: string, filters?: any): Promise<Anime[]> => fetchApi('/todosAnimes', { token }), 
  adminGetCatalogById: async (id: string, token: string): Promise<Anime> => fetchApi(`/todosAnimes/${id}`, { token }),
  adminInsertCatalog: async (data: any, token: string): Promise<any> => fetchApi('/inserirDados', { method: 'POST', body: JSON.stringify(data), token }),
  adminUpdateCatalog: async (id: string, data: any, token: string): Promise<any> => fetchApi(`/catalogo/${id}`, { method: 'PUT', body: JSON.stringify(data), token }),
  adminDeleteCatalogById: async (id: string, token: string): Promise<any> => fetchApi(`/excluirAnime/${id}`, { method: 'DELETE', token }),
  adminAddExibir: async (data: any, token: string): Promise<any> => fetchApi(`/animes_exibir/${data.animeId}`, { method: 'POST', body: JSON.stringify(data), token }, ANIME_EXIBIR_BASE_URL),
  adminGetExibirDetails: async (animeId: string, token: string): Promise<any> => fetchApi(`/animes_exibir/${animeId}`, { token }, ANIME_EXIBIR_BASE_URL),
  adminUpdateExibirDetails: async (animeId: string, data: any, token: string): Promise<any> => fetchApi(`/animes_exibir_editar/${animeId}`, { method: 'POST', body: JSON.stringify(data), token }, ANIME_EXIBIR_BASE_URL),
  adminDeleteExibir: async (animeId: string, token: string): Promise<any> => fetchApi(`/animes_exibir/${animeId}`, { method: 'DELETE', token }, ANIME_EXIBIR_BASE_URL),
  adminScrapeAnime: async (provider: string, homeLink: string, token: string): Promise<any> => fetchApi(`/scrape/${provider}/${encodeURIComponent(homeLink)}`, { token }),
  
  // Admin Support Tickets (connected to backend)
  adminGetAllSupportTickets: (token: string): Promise<SupportTicket[]> => fetchApi('/admin/support-tickets', { token }), 
  adminGetSupportTicketDetails: (ticketId: string, token: string): Promise<SupportTicketWithReplies> => fetchApi<SupportTicketWithReplies>(`/admin/support-tickets/${ticketId}`, { token }), 
  adminReplyToSupportTicket: (ticketId: string, reply: string, token: string): Promise<SupportTicketReply> => fetchApi<SupportTicketReply>(`/admin/support-tickets/${ticketId}/reply`, { method: 'POST', body: JSON.stringify({ message: reply }), token }), 
  adminUpdateTicketStatus: (ticketId: string, status: TicketStatus, token: string): Promise<SupportTicket> => fetchApi<SupportTicket>(`/admin/support-tickets/${ticketId}/status`, { method: 'PUT', body: JSON.stringify({ status }), token }), 
  
  // Admin Native Comments (connected to backend)
  adminGetComments: (token: string): Promise<Comment[]> => fetchApi<Comment[]>(`/admin/comments`, { token }), 
  adminDeleteComment: (commentId: number, token: string): Promise<void> => fetchApi<void>(`/admin/comments/${commentId}`, { method: 'DELETE', token }), 

  // Admin News Management - Connected to REAL backend
  adminCreateNewsArticle: async (articleData: Omit<NewsArticle, 'id' | 'slug' | 'published_at' | 'snippet'>, token: string): Promise<NewsArticle> => {
    return fetchApi<NewsArticle>('/admin/news', {
      method: 'POST',
      body: JSON.stringify(articleData),
      token,
    });
  },
  adminUpdateNewsArticle: async (id: string | number, articleData: Partial<Omit<NewsArticle, 'id' | 'slug' | 'published_at' | 'snippet'>>, token: string): Promise<NewsArticle | null> => {
    return fetchApi<NewsArticle>(`/admin/news/${id}`, {
      method: 'PUT',
      body: JSON.stringify(articleData),
      token,
    });
  },
  adminDeleteNewsArticle: async (id: string | number, token: string): Promise<{ success: boolean }> => {
    return fetchApi<{ success: boolean }>(`/admin/news/${id}`, { method: 'DELETE', token });
  },

  // Admin Community Management (Stickers connected, Posts/Comments now connected)
  adminGetStickers: (token: string): Promise<Sticker[]> => fetchApi<Sticker[]>('/api/stickers', { token }), 
  adminAddSticker: (stickerData: { name: string; category?: string; image_url: string }, token: string): Promise<Sticker> => fetchApi<Sticker>('/admin/stickers', { method: 'POST', body: JSON.stringify(stickerData), token }),
  adminDeleteSticker: (stickerId: number, token: string): Promise<{ success: boolean }> => fetchApi<{ success: boolean }>(`/admin/stickers/${stickerId}`, { method: 'DELETE', token }),

  adminGetCommunityPosts: async (token: string): Promise<CommunityPost[]> => {
    return fetchApi<CommunityPost[]>('/api/community/posts', { token }); 
  },
  adminDeleteCommunityPost: async (postId: string | number, token: string): Promise<{ success: boolean }> => {
    return fetchApi<{ success: boolean }>(`/admin/community/posts/${postId}`, { method: 'DELETE', token });
  },
  adminGetCommunityComments: async (token: string): Promise<CommunityComment[]> => {
     return fetchApi<CommunityComment[]>('/admin/community/comments', { token });
  },
  adminDeleteCommunityComment: async (commentId: string | number, token: string): Promise<{ success: boolean }> => {
    return fetchApi<{ success: boolean }>(`/admin/community/comments/${commentId}`, { method: 'DELETE', token });
  },

  // Admin Featured Content Lists
  adminGetFeaturedContentList: async (listName: string, token: string): Promise<FeaturedListItemAdmin[]> => {
    return fetchApi<FeaturedListItemAdmin[]>(`/admin/featured-content/${listName}`, { token });
  },
  adminAddFeaturedItem: async (listName: string, animeId: number, token: string): Promise<any> => {
    return fetchApi(`/admin/featured-content/${listName}`, {
        method: 'POST',
        body: JSON.stringify({ anime_id: animeId }),
        token,
    });
  },
  adminUpdateFeaturedListOrder: async (listName: string, orderedAnimeIds: number[], token: string): Promise<any> => {
      return fetchApi(`/admin/featured-content/${listName}`, {
          method: 'PUT',
          body: JSON.stringify({ ordered_anime_ids: orderedAnimeIds }),
          token,
      });
  },
  adminRemoveFeaturedItem: async (listName: string, animeId: number, token: string): Promise<any> => {
      return fetchApi(`/admin/featured-content/${listName}/${animeId}`, {
          method: 'DELETE',
          token,
      });
  },

  // Admin User Management
  adminGetUsers: async (token: string): Promise<User[]> => {
    return fetchApi<User[]>('/admin/users', { token });
  },
  adminBanUser: async (userId: number, reason: string, token: string): Promise<{ success: boolean; message?: string }> => {
    return fetchApi<{ success: boolean; message?: string }>(`/admin/users/${userId}/ban`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
      token,
    });
  },
  adminUnbanUser: async (userId: number, token: string): Promise<{ success: boolean; message?: string }> => {
    return fetchApi<{ success: boolean; message?: string }>(`/admin/users/${userId}/unban`, {
      method: 'PUT',
      token,
    });
  },
  adminPromoteUser: async (userId: number, masterPassword: string, token: string): Promise<{ success: boolean; message?: string }> => {
    return fetchApi<{ success: boolean; message?: string }>(`/admin/users/${userId}/promote`, {
      method: 'PUT',
      body: JSON.stringify({ masterPassword }),
      token,
    });
  },
  adminDemoteUser: async (userId: number, masterPassword: string, token: string): Promise<{ success: boolean; message?: string }> => {
    return fetchApi<{ success: boolean; message?: string }>(`/admin/users/${userId}/demote`, {
      method: 'PUT',
      body: JSON.stringify({ masterPassword }),
      token,
    });
  },
};
