import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Settings, 
  Database, 
  CheckCircle, 
  AlertTriangle,
  Leaf,
  Layers,
  Sparkles
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import AuthCard from './components/AuthCard';
import Dashboard from './components/Dashboard';
import SupabaseConfigModal from './components/SupabaseConfigModal';
import './App.css';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);

  useEffect(() => {
    // Se o Supabase não estiver configurado com credenciais, para o loading
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    // Busca a sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    }).catch((err) => {
      console.error('Erro ao buscar sessão:', err);
      setLoading(false);
    });

    // Escuta mudanças de autenticação em tempo real
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setSession(null);
    }
  };

  return (
    <div className="app-wrapper" id="ambipar-app-root">
      {/* Barra de Navegação Superior */}
      <header className="navbar" id="app-navbar">
        <div className="nav-brand">
          <div className="brand-icon-wrapper">
            <Leaf size={22} />
          </div>
          <div className="brand-text">
            <h1>
              Analista Ambipar
              <span className="brand-tag">v1.0</span>
            </h1>
            <span className="brand-desc">Gestão Ambiental & Inteligência de Dados</span>
          </div>
        </div>

        <div className="nav-controls">
          {/* Indicador de Status do Supabase */}
          <div 
            className={`status-pill ${isSupabaseConfigured ? 'online' : 'unconfigured'}`}
            id="navbar-supabase-status"
          >
            <span className="dot"></span>
            <span>{isSupabaseConfigured ? 'Supabase Conectado' : 'Supabase Pendente'}</span>
          </div>

          {/* Botão de Configuração de Chaves */}
          <button
            type="button"
            className="btn-secondary btn-icon-text"
            onClick={() => setShowConfigModal(true)}
            id="navbar-config-btn"
          >
            <Settings size={16} />
            <span>Chaves API</span>
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="main-content" id="app-main-content">
        {loading ? (
          <div className="loading-state animate-fade-in" id="app-loading-state">
            <span className="spinner"></span>
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
              Conectando aos serviços da Ambipar...
            </p>
          </div>
        ) : session ? (
          <Dashboard 
            user={session.user} 
            session={session} 
            onLogout={handleLogout} 
          />
        ) : (
          <AuthCard 
            onOpenConfig={() => setShowConfigModal(true)} 
          />
        )}
      </main>

      {/* Modal de Configuração das Chaves do Supabase */}
      <SupabaseConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
      />

      {/* Rodapé */}
      <footer className="footer" id="app-footer">
        <div className="footer-info">
          <span>&copy; {new Date().getFullYear()} Analista Ambipar • Todos os direitos reservados.</span>
        </div>
        <div className="footer-tags">
          <span>Backend: Supabase PostgreSQL (Externo)</span>
          <span>Autenticação: Supabase Auth (JWT)</span>
        </div>
      </footer>
    </div>
  );
}
