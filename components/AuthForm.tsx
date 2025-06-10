import React, { useState } from 'react';
import { FaUserAstronaut, FaEnvelopeOpenText, FaKey } from 'react-icons/fa6'; // Updated to Fa6

interface AuthFormProps {
  formType: 'login' | 'register';
  onSubmit: (formData: Record<string, string>) => Promise<void>;
  errorMessage?: string | null;
  isLoading: boolean;
}

const AuthForm: React.FC<AuthFormProps> = ({ formType, onSubmit, errorMessage, isLoading }) => {
  const [user, setUser] = useState(''); // Can be username or email for login
  const [email, setEmail] = useState(''); // Only for register
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData: Record<string, string> = { senha: password };
    if (formType === 'login') {
      formData.user = user; 
    } else {
      formData.user = user; 
      formData.email = email;
    }
    onSubmit(formData);
  };

  const isLogin = formType === 'login';
  const inputBaseClass = "block w-full px-3 py-2 bg-card rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-transparent sm:text-sm text-text-primary";
  const iconClass = "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!isLogin && (
        <div className="relative">
          <label htmlFor="username" className="block text-sm font-medium text-text-secondary sr-only">
            Nome de Usuário
          </label>
          <div className={iconClass}> <FaUserAstronaut /> </div> {/* Updated */}
          <input
            id="username"
            name="username"
            type="text"
            required
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="Nome de Usuário"
            className={`${inputBaseClass} pl-10`}
          />
        </div>
      )}

      {isLogin && (
         <div className="relative">
          <label htmlFor="user" className="block text-sm font-medium text-text-secondary sr-only">
            Nome de Usuário ou Email
          </label>
          <div className={iconClass}> <FaUserAstronaut /> </div> {/* Updated */}
          <input
            id="user"
            name="user"
            type="text"
            autoComplete="username"
            required
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="Nome de Usuário ou Email"
            className={`${inputBaseClass} pl-10`}
          />
        </div>
      )}


      {!isLogin && (
        <div className="relative">
          <label htmlFor="email" className="block text-sm font-medium text-text-secondary sr-only">
            Endereço de Email
          </label>
          <div className={iconClass}> <FaEnvelopeOpenText /> </div> {/* Updated */}
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Endereço de Email"
            className={`${inputBaseClass} pl-10`}
          />
        </div>
      )}
      
      <div className="relative">
        <label htmlFor="password" className="block text-sm font-medium text-text-secondary sr-only">
          Senha
        </label>
        <div className={iconClass}> <FaKey /> </div> {/* Updated */}
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          className={`${inputBaseClass} pl-10`}
        />
      </div>

      {errorMessage && (
        <p className="text-sm text-red-500 text-center bg-red-900 bg-opacity-30 p-2 rounded-md">{errorMessage}</p>
      )}

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary disabled:opacity-60 transition-colors"
        >
          {isLoading ? (isLogin ? 'Entrando...' : 'Registrando...') : (isLogin ? 'Entrar' : 'Criar Conta')}
        </button>
      </div>
    </form>
  );
};

export default AuthForm;