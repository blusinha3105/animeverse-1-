
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (userLogin: string, senhaLogin: string) => Promise<void>;
  register: (userRegister: string, emailRegister: string, senhaRegister: string) => Promise<void>;
  logout: () => void;
  updateUserProfileImage: (newImageUrl: string) => void;
  updateUser: (updatedUserDetails: Partial<User>) => void; // New
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      const storedToken = authService.getToken();
      if (storedToken) {
        const currentUser = authService.getUserFromToken(); 
        if (currentUser) {
          setUser(currentUser); // This now includes is_banned
          setToken(storedToken);
        } else {
          authService.logout(); // Invalid token
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  const login = async (userLogin: string, senhaLogin: string) => {
    setLoading(true);
    const { token: newToken, user: loggedInUser } = await authService.login(userLogin, senhaLogin); 
    setUser(loggedInUser); // This now includes is_banned
    setToken(newToken);
    setLoading(false);
  };

  const register = async (userRegister: string, emailRegister: string, senhaRegister: string) => {
    setLoading(true);
    await authService.register(userRegister, emailRegister, senhaRegister);
    // Optionally auto-login after register or prompt user to login
    setLoading(false);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };
  
  const updateUserProfileImage = (newImageUrl: string) => {
    setUser(currentUser => currentUser ? { ...currentUser, imagem_perfil: newImageUrl } : null);
  };

  const updateUser = (updatedUserDetails: Partial<User>) => {
    setUser(currentUser => currentUser ? { ...currentUser, ...updatedUserDetails } : null);
    // Note: This only updates client-side state. 
    // The JWT token in localStorage is not updated here. If user details in the token
    // are critical for subsequent requests and need to be fresh, a new token
    // should be issued by the backend and re-stored upon successful profile update.
  };


  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUserProfileImage, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
