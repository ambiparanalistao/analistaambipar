import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega todas as variáveis de ambiente sem restringir a prefixo no carregamento inicial
  const env = loadEnv(mode, process.cwd(), '');

  // Detecta a URL do Supabase aceitando todas as convenções comuns (Vite, Next, Vercel Integration, etc.)
  const supabaseUrl = 
    env.VITE_SUPABASE_URL || 
    env.SUPABASE_URL || 
    env.NEXT_PUBLIC_SUPABASE_URL || 
    process.env.VITE_SUPABASE_URL || 
    process.env.SUPABASE_URL || 
    process.env.NEXT_PUBLIC_SUPABASE_URL || 
    '';

  // Detecta a Anon Key pública aceitando qualquer convenção
  const supabaseAnonKey = 
    env.VITE_SUPABASE_ANON_KEY || 
    env.SUPABASE_ANON_KEY || 
    env.SUPABASE_KEY || 
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    process.env.VITE_SUPABASE_ANON_KEY || 
    process.env.SUPABASE_ANON_KEY || 
    process.env.SUPABASE_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    '';

  return {
    plugins: [react()],
    // Permite que o Vite exponha no import.meta.env variáveis com esses prefixos
    envPrefix: ['VITE_', 'SUPABASE_', 'NEXT_PUBLIC_'],
    define: {
      '__SUPABASE_URL__': JSON.stringify(supabaseUrl),
      '__SUPABASE_ANON_KEY__': JSON.stringify(supabaseAnonKey),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
      'process.env.SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
    }
  };
});

