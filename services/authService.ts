
import { API_BASE_URL } from '../constants';
import { User, AuthResponse } from '../types';

// Mock jwt-decode, in a real app, use the library
const jwtDecode = <T,>(token: string): T | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload) as T;
  } catch (error) {
    console.error("Failed to decode JWT", error);
    return null;
  }
};

const TOKEN_KEY = 'animeverse_token';

export const authService = {
  login: async (userLogin: string, senhaLogin: string): Promise<{ token: string; user: User }> => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: userLogin, senha: senhaLogin }),
    });

    const data: AuthResponse = await response.json();

    if (!response.ok || !data.token) {
      throw new Error(data.message || 'Login failed');
    }
    
    localStorage.setItem(TOKEN_KEY, data.token);
    const decodedUser = jwtDecode<{ id: number; nome: string; email: string; vip: boolean; admin: boolean; imagem_perfil?: string }>(data.token);
    if (!decodedUser) {
        throw new Error('Failed to decode token');
    }
    // Ensure the user object structure matches the User type
    const userObject: User = {
        id: decodedUser.id,
        nome: decodedUser.nome,
        email: decodedUser.email,
        vip: !!decodedUser.vip, // Ensure boolean
        admin: !!decodedUser.admin, // Ensure boolean
        imagem_perfil: decodedUser.imagem_perfil
    };
    return { token: data.token, user: userObject };
  },

  register: async (userRegister: string, emailRegister: string, senhaRegister: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/cadastro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: userRegister, email: emailRegister, senha: senhaRegister }),
    });
    const data: AuthResponse = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    return data;
  },

  logout: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },

  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  getUserFromToken: (): User | null => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const decodedUser = jwtDecode<{ id: number; nome: string; email: string; vip: boolean; admin: boolean; imagem_perfil?: string }>(token);
    if (!decodedUser) return null;
    // Ensure the user object structure matches the User type
    return {
        id: decodedUser.id,
        nome: decodedUser.nome,
        email: decodedUser.email,
        vip: !!decodedUser.vip,
        admin: !!decodedUser.admin,
        imagem_perfil: decodedUser.imagem_perfil
    };
  },
};
      