import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega todas as variáveis de ambiente sem restringir a prefixo no carregamento inicial
  const env = loadEnv(mode, process.cwd(), '');
  const mergedEnv = { ...process.env, ...env };

  // Busca a URL do Supabase aceitando todas as convenções
  let supabaseUrl = 
    mergedEnv.NEXT_PUBLIC_SUPABASE_URL ||
    mergedEnv.VITE_SUPABASE_URL || 
    mergedEnv.SUPABASE_URL || 
    '';

  // Se não achou de forma direta, busca dinamicamente qualquer chave contendo SUPABASE e URL
  if (!supabaseUrl) {
    for (const [k, v] of Object.entries(mergedEnv)) {
      if (k.toUpperCase().includes('SUPABASE') && k.toUpperCase().includes('URL') && v && typeof v === 'string') {
        supabaseUrl = v.trim();
        break;
      }
    }
  }

  // Busca a chave pública/anon/publishable aceitando qualquer convenção
  let supabaseAnonKey = 
    mergedEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    mergedEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    mergedEnv.VITE_SUPABASE_PUBLISHABLE_KEY ||
    mergedEnv.VITE_SUPABASE_ANON_KEY || 
    mergedEnv.SUPABASE_PUBLISHABLE_KEY ||
    mergedEnv.SUPABASE_ANON_KEY || 
    mergedEnv.SUPABASE_KEY || 
    '';

  // Se não achou de forma direta, busca dinamicamente qualquer chave com SUPABASE e (KEY/ANON/PUBLISHABLE)
  if (!supabaseAnonKey) {
    for (const [k, v] of Object.entries(mergedEnv)) {
      const upper = k.toUpperCase();
      if (
        upper.includes('SUPABASE') && 
        (upper.includes('PUBLISHABLE') || upper.includes('ANON') || upper.includes('KEY') || upper.includes('TOKEN')) &&
        !upper.includes('SERVICE') &&
        v && typeof v === 'string' && v.length > 10
      ) {
        supabaseAnonKey = v.trim();
        break;
      }
    }
  }

  return {
    plugins: [react()],
    // Permite que o Vite exponha no import.meta.env variáveis com esses prefixos
    envPrefix: ['VITE_', 'SUPABASE_', 'NEXT_PUBLIC_'],
    define: {
      '__SUPABASE_URL__': JSON.stringify(supabaseUrl),
      '__SUPABASE_ANON_KEY__': JSON.stringify(supabaseAnonKey),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
      'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(supabaseAnonKey),
      'process.env.SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
    }
  };
});

