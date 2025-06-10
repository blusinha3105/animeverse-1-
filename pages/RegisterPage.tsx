
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Though register doesn't auto-login here
import AuthForm from '../components/AuthForm';
import { authService } from '../services/authService';
import { APP_NAME } from '../constants';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (formData: Record<string, string>) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);
    try {
      // formData.user is username from AuthForm
      // formData.email is email from AuthForm
      // formData.senha is password from AuthForm
      await authService.register(formData.user, formData.email, formData.senha);
      setSuccessMessage('Cadastro realizado com sucesso! Por favor, faça login.');
      setTimeout(() => navigate('/login'), 2000); // Redirect to login after a delay
    } catch (error) {
      setErrorMessage((error as Error).message || 'Cadastro falhou. Por favor, tente novamente.');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-8 bg-card shadow-2xl rounded-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-text-primary">
            Crie sua conta {APP_NAME}
          </h2>
        </div>
        <AuthForm
          formType="register"
          onSubmit={handleRegister}
          errorMessage={errorMessage}
          isLoading={isLoading}
        />
        {successMessage && (
          <p className="text-sm text-green-500 text-center">{successMessage}</p>
        )}
        <p className="mt-4 text-center text-sm text-text-secondary">
          Já tem uma conta?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-secondary">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;