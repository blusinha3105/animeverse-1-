
import { ThemeSettings } from './types';

// Read API_BASE_URL from window.env injected by index.html or deployment process
// Fallback to localhost for local development if not set.
export const API_BASE_URL = (window as any).env?.REACT_APP_API_BASE_URL || 'https://back-api.orbital.host';

export const APP_NAME = 'AnimeVerse';
export const DEFAULT_PLACEHOLDER_IMAGE = 'https://picsum.photos/300/450?grayscale';
export const EPISODE_THUMB_PLACEHOLDER = 'https://picsum.photos/320/180?grayscale';

export const DEFAULT_THEME: ThemeSettings = {
  primary: '#581c87',        // Dark Purple (purple-900)
  primaryAction: '#dc2626',  // Red (red-600)
  secondary: '#7e22ce',      // Lighter Dark Purple (purple-700)
  background: '#000000',     // Absolute Black
  card: '#0A0A0A',           // Very Dark Gray (almost black)
  textPrimary: '#E0E0E0',    // Light Gray
  textSecondary: '#A0A0A0',   // Medium Gray
};

export const resolveImageUrl = (path?: string): string => {
  if (!path) {
    return DEFAULT_PLACEHOLDER_IMAGE;
  }
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // Assuming paths like 'uploads/...' or 'images/...' are relative to API_BASE_URL
  if (path.startsWith('uploads/') || path.startsWith('images/')) {
     return `${API_BASE_URL}/${path}`;
  }
  // If it's just a filename or an unexpected format, try prepending API_BASE_URL
  // This might need adjustment based on how backend stores/returns image paths
  // For now, if it's not a full URL and not 'uploads/', we assume it might be relative
  // and needs the base URL. Or it might be an error/unhandled case.
  // A safer bet if paths are inconsistent: only prefix known relative path structures.
  // For this exercise, being a bit more aggressive with prefixing.
  return `${API_BASE_URL}/${path.startsWith('/') ? path.substring(1) : path}`;
};
