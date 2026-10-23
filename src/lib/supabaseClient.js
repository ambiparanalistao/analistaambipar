import { createClient } from '@supabase/supabase-js';

// Tenta obter de todas as variáveis possíveis injetadas pelo Vite/Vercel no build ou no runtime
const buildUrl = 
  (typeof __SUPABASE_URL__ !== 'undefined' && __SUPABASE_URL__) ||
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_URL || process.env?.SUPABASE_URL)) ||
  '';

const buildKey = 
  (typeof __SUPABASE_ANON_KEY__ !== 'undefined' && __SUPABASE_ANON_KEY__) ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_ANON_KEY || process.env?.SUPABASE_ANON_KEY || process.env?.SUPABASE_KEY)) ||
  '';

const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('supabase_url') : null;
const storedKey = typeof window !== 'undefined' ? localStorage.getItem('supabase_anon_key') : null;

export const supabaseUrl = (buildUrl && buildUrl.trim() !== '') 
  ? buildUrl.trim() 
  : (storedUrl && storedUrl.trim() !== '' ? storedUrl.trim() : '');

export const supabaseAnonKey = (buildKey && buildKey.trim() !== '') 
  ? buildKey.trim() 
  : (storedKey && storedKey.trim() !== '' ? storedKey.trim() : '');

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http') &&
  supabaseAnonKey.length > 10
);

// Cria o cliente se configurado, ou null se não configurado
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
 * Salva credenciais dinamicamente via UI caso o usuário queira trocar/forçar credenciais no navegador
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

