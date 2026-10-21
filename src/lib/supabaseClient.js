import { createClient } from '@supabase/supabase-js';

// Tenta obter do .env (Vite) ou do armazenamento local do navegador para setup dinâmico
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('supabase_url') : null;
const storedKey = typeof window !== 'undefined' ? localStorage.getItem('supabase_anon_key') : null;

export const supabaseUrl = (envUrl && envUrl.trim() !== '') ? envUrl : storedUrl;
export const supabaseAnonKey = (envKey && envKey.trim() !== '') ? envKey : storedKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co')
);

// Cria o cliente se configurado, ou um cliente mock seguro para não quebrar na inicialização
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Salva credenciais dinamicamente via UI caso o usuário prefira configurar na tela
 */
export function setDynamicSupabaseCredentials(url, key) {
  if (url && key) {
    localStorage.setItem('supabase_url', url.trim());
    localStorage.setItem('supabase_anon_key', key.trim());
    window.location.reload();
  }
}

/**
 * Remove credenciais salvas no navegador
 */
export function clearDynamicSupabaseCredentials() {
  localStorage.removeItem('supabase_url');
  localStorage.removeItem('supabase_anon_key');
  window.location.reload();
}
