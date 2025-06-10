
import React, { useState, useEffect } from 'react'; // Added useEffect
import { useNavigate, Link, useLocation } from 'react-router-dom'; // Added useLocation
import { useAuth } from '../hooks/useAuth';
import AuthForm from '../components/AuthForm';
import { APP_NAME } from '../constants';

const LoginPage: React.FC = () => {
  const { login, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); 
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check if navigation state indicates a ban redirect and has a reason
    if (location.state?.banned && location.state?.reason) {
      setErrorMessage(`Sua conta está banida. Motivo: ${location.state.reason}`);
    } else if (location.state?.banned) {
      setErrorMessage("Sua conta está banida. Entre em contato com o suporte.");
    }
  }, [location.state]);


  const handleLogin = async (formData: Record<string, string>) => {
    setErrorMessage(null); // Clear previous errors
    try {
      await login(formData.user, formData.senha);
      const from = location.state?.from?.pathname || '/profile';
      navigate(from, { replace: true });
    } catch (error) {
      // The error message from authService.login might already include the ban reason
      const apiErrorMessage = (error as Error).message || 'Login falhou. Verifique suas credenciais.';
      setErrorMessage(apiErrorMessage);
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
