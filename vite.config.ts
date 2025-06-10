import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    allowedHosts: [
      'all' // aqui está o domínio que você recebeu no erro
    ]
  }
})
