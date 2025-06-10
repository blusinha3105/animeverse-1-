
export interface Episode {
  id?: number; 
  temporada: number;
  numero: number;
  nome: string;
  link: string; 
  capa_ep?: string;
  alertanovoep?: number | boolean; // Can be 0/1 from DB, or true/false
  comment_count?: number; // Optional: to show number of comments
}

export interface AnimeBase {
  id: number;
  capa: string;
  titulo: string;
  tituloAlternativo?: string;
  selo?: string;
  sinopse: string;
  generos: string[]; // Ensured this is string[]
  classificacao?: string;
  status?: string; // e.g. "Andamento", "Completo"
  qntd_temporadas?: number;
  anoLancamento?: number;
  dataPostagem?: string; 
  ovas?: string;
  filmes?: string;
  estudio?: string;
  diretor?: string;
  tipoMidia?: string; // e.g. "Anime", "Filme", "Ova"
  visualizacoes?: number;
}

export interface Anime extends AnimeBase {
  episodios: Episode[];
}

export interface PaginatedAnimesResponse {
  animes: Anime[];
  totalPages: number;
  totalAnimes?: number;
  totalEpisodios?: number;
}

export interface PaginatedEpisodesResponse {
  totalEpisodios: number;
  pagina: number;
  itensPorPagina: number;
  episodios: Episode[];
}

export interface User {
  id: number;
  nome: string;
  email: string;
  vip?: boolean; 
  admin?: boolean;
  imagem_perfil?: string; 
}

export interface AuthResponse {
  message: string;
  token?: string; // Present on successful login
  user?: User; // May not be returned directly, token is decoded
}

export interface TemporaryLinkResponse {
  temporaryLink: string;
}

export interface SiteAlert {
  id: number;
  titulo: string;
  conteudo: string;
  dataHoraPostagem: string;
}

export interface CategoryCount {
  [categoryName: string]: number;
}

// Types for the /animes_exibir/ endpoint data
export interface EpisodeExibir {
  id?: number; 
  temporada: number; 
  episodio: number; // This is the 'ep' number from URL params
  descricao: string; // Used as episode title in the player
  link: string; // Main video link
  link_extra_1?: string;
  link_extra_2?: string;
  link_extra_3?: string;
  capa_ep?: string; 
}

export interface AnimeInfoForExibir { 
  anime_id: string | number; 
  titulo: string;
}

export interface AnimeExibirResponse {
  anime: AnimeInfoForExibir; 
  episodios: EpisodeExibir[];
}

// Native Comment System Types
export interface Comment {
  id: number;
  anime_id: string; // or number, consistent with your Anime ID type
  episode_number: number;
  user_id: number;
  user_nome: string; // Denormalized for easier display
  user_imagem_perfil?: string; // Denormalized
  parent_comment_id?: number | null;
  content: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  replies?: Comment[]; // For nested comments
}

// Support System Types
export type TicketStatus = 'Open' | 'In Progress' | 'Answered' | 'Closed';

export interface SupportTicket {
  id: number;
  user_id?: number; 
  user_nome?: string; 
  user_email: string; 
  subject: string;
  description: string;
  status: TicketStatus;
  created_at: string; 
  updated_at: string; 
}

export interface SupportTicketReply {
  id: number;
  ticket_id: number;
  user_id?: number; 
  admin_id?: number; 
  replier_name: string; 
  message: string;
  created_at: string; 
}

export interface SupportTicketWithReplies extends SupportTicket {
  replies: SupportTicketReply[];
}

// New Feature Types

// Sticker Type
export interface Sticker {
  id: number;
  name: string;
  category?: string;
  image_url: string;
  created_at: string;
}

export interface CommunityPost {
  id: string | number;
  user_id: string | number; // Populated by backend based on token
  user_name: string;       // Populated by backend
  user_avatar?: string;   // Populated by backend
  content_text: string; 
  content_image_url?: string;
  sticker_url?: string;
  created_at: string;   
  likes_count: number;   
  comments_count: number;
  isLiked?: boolean; // Optional: for frontend to know if current user liked this post (client-side state or future backend enhancement)
}

export interface CommunityComment {
  id: string | number;
  post_id: string | number; 
  user_id: string | number;   // Populated by backend
  user_name: string;        // Populated by backend
  user_avatar?: string;    // Populated by backend
  content_text: string;   
  created_at: string;     
}


export interface NewsArticle {
  id: string | number;
  slug: string; 
  title: string;
  cover_image_url?: string; 
  cover_video_url?: string; 
  content_html: string;    
  author_name: string;     
  published_at: string;  
  tags?: string[]; // Stored as comma-separated in DB, converted to array in frontend
  snippet?: string; 
}

export interface UserNotification {
  id: string | number;
  user_id: number; 
  message: string;
  type: 'new_episode' | 'comment_reply' | 'system_update' | 'news' | 'general';
  link?: string; 
  is_read: boolean; // Backend sends 0/1, converted to boolean in frontend if needed
  created_at: string;      
}


// Types for "My Collection"
export type CollectionStatus = 'watching' | 'completed' | 'planned' | 'on_hold' | 'dropped' | 'favorite';

export const collectionStatusMap: Record<CollectionStatus, string> = {
  watching: 'Assistindo',
  completed: 'Completo',
  planned: 'Planejado',
  on_hold: 'Em Pausa',
  dropped: 'Descartado',
  favorite: 'Favorito',
};

// CollectionItem now includes all AnimeBase properties directly, as fetched from backend join.
// It also has its own specific properties.
export interface CollectionItem extends AnimeBase {
  collection_id: number; // ID from the user_collections table
  user_id: number;
  // anime_id: number; // This is now `id` from AnimeBase
  collectionStatus: CollectionStatus; // Renamed from 'status' to avoid conflict with AnimeBase.status
  addedAt: string; // ISO date string
  lastWatchedEpisode?: string; // e.g., "S1 E5"
  notes?: string;
}


// Types for "Downloads" (Mocked)
export interface DownloadedItem {
  id: number; // Unique ID for the downloaded item instance from DB
  user_id: number;
  anime_id: number; // Reference to the anime (Anime.id)
  episode_id?: number; // Reference to the specific episode (Episode.id), if applicable
  title: string; // Anime title
  episode_title?: string; 
  season_number?: number;
  episode_number?: number;
  thumbnail_url: string;
  size_mb: number; // Mock size in MB, generated by backend
  downloaded_at: string; // ISO date string, generated by backend
}

// For Admin Featured Content List
export interface FeaturedListItemAdmin extends AnimeBase {
  // This is what admin will see, includes anime details
  display_order: number;
}
