
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthForm from '../components/AuthForm';
import { APP_NAME } from '../constants';

const LoginPage: React.FC = () => {
  const { login, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [banMessage, setBanMessage] = useState<string | null>(null);

  useEffect(() => {
    const locationState = location.state as { banned?: boolean; reason?: string; from?: Location };
    if (locationState?.banned) {
      setBanMessage(`Sua conta está banida. Motivo: ${locationState.reason || 'Não especificado.'}`);
      // Clear the state to prevent message from showing again on refresh or re-navigation
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);


  const handleLogin = async (formData: Record<string, string>) => {
    setErrorMessage(null);
    setBanMessage(null); // Clear ban message on new login attempt
    try {
      await login(formData.user, formData.senha);
      const from = (location.state as { from?: Location })?.from?.pathname || '/profile';
      navigate(from, { replace: true });
    } catch (error) {
      const errorMsg = (error as Error).message || 'Login falhou. Verifique suas credenciais.';
       if (errorMsg.toLowerCase().includes('banida') || errorMsg.toLowerCase().includes('banned')) {
        setBanMessage(errorMsg); // Show ban message from login attempt itself
      } else {
        setErrorMessage(errorMsg);
      }
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-8 bg-card shadow-2xl rounded-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-text-primary">
            Entrar em {APP_NAME}
          </h2>
        </div>
        {banMessage && (
          <p className="text-sm text-yellow-400 text-center bg-yellow-900 bg-opacity-40 p-3 rounded-md border border-yellow-700">
            {banMessage}
          </p>
        )}
        <AuthForm
          formType="login"
          onSubmit={handleLogin}
          errorMessage={errorMessage}
          isLoading={authLoading}
        />
        <div className="text-sm text-center">
            <Link to="#" className="font-medium text-primary hover:text-secondary">
              Esqueceu sua senha?
            </Link>
        </div>
        <p className="mt-4 text-center text-sm text-text-secondary">
          Não tem uma conta?{' '}
          <Link to="/register" className="font-medium text-primary hover:text-secondary">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
