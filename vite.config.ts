import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173, // Usa PORT do ambiente ou 5173 como fallback
    host: true, // Permite acesso externo (necessário em algumas plataformas)
  },
});
