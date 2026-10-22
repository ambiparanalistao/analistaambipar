import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Settings, 
  Database, 
  Leaf, 
  Radio, 
  Bell, 
  Search,
  Sparkles,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import Sidebar from './components/Sidebar';
import LogisticsDashboard from './components/LogisticsDashboard';
import TripsModule from './components/TripsModule';
import MtrModule from './components/MtrModule';
import CalculatorModule from './components/CalculatorModule';
import OcorrenciasModule from './components/OcorrenciasModule';
import EsgModule from './components/EsgModule';
import AuthCard from './components/AuthCard';
import SupabaseConfigModal from './components/SupabaseConfigModal';
import './App.css';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentModule, setCurrentModule] = useState('dashboard');

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
    }
    setSession(null);
  };

  const handleDemoAccess = () => {
    setSession({
      user: {
        id: 'demo-analista-ambipar',
        email: 'analista.logistica@ambipar.com',
        user_metadata: {
          full_name: 'Carlos Oliveira (CCO Ambipar)'
        }
      }
    });
  };

  // Nomes e descrições dos módulos para o cabeçalho superior
  const moduleInfo = {
    dashboard: { title: 'Torre de Controle Operacional', subtitle: 'Painel Central, KPIs, Fórmulas e Monitoramento em Tempo Real' },
    viagens: { title: 'Monitoramento de Frotas & Viagens', subtitle: 'Rastreamento de veículos, tempos de carga/descarga e gestão de rotas' },
    mtr: { title: 'Manifestos de Transporte de Resíduos (MTR)', subtitle: 'Controle de resíduos industriais perigosos (Classe I/II) e conformidade SINIR' },
    calculadoras: { title: 'Engenharia de Frete & Fórmulas', subtitle: 'Simulador de custos por quilômetro (CPK) e compatibilidade química ANTT' },
    ocorrencias: { title: 'Central de Ocorrências & Emergências', subtitle: 'Ambipar Response, atendimento 24h e paradas preventivas' },
    esg: { title: 'Descarbonização & Indicadores ESG', subtitle: 'Métricas de redução de pegada de carbono e créditos de reciclagem' }
  };

  return (
    <div className="app-wrapper" id="ambipar-app-root">
      {loading ? (
        <div className="loading-state animate-fade-in" id="app-loading-state">
          <span className="spinner"></span>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
            Conectando aos serviços da Ambipar...
          </p>
        </div>
      ) : !session ? (
        <>
          {/* Header simplificado para a tela de login */}
          <header className="navbar simple" id="login-navbar">
            <div className="nav-brand">
              <div className="brand-icon-wrapper">
                <Leaf size={22} />
              </div>
              <div className="brand-text">
                <h1>
                  Analista Ambipar
                  <span className="brand-tag">v2.0</span>
                </h1>
                <span className="brand-desc">Logística, Transporte & Gestão Ambiental</span>
              </div>
            </div>

            <div className="nav-controls">
              <button
                type="button"
                className="btn-secondary btn-icon-text"
                onClick={() => setShowConfigModal(true)}
              >
                <Settings size={16} />
                <span>Chaves Supabase</span>
              </button>
            </div>
          </header>

          <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AuthCard 
              onOpenConfig={() => setShowConfigModal(true)}
              onDemoAccess={handleDemoAccess}
            />
          </main>
        </>
      ) : (
        /* Layout Principal do Analista de Logística com Sidebar Lateral */
        <div className="dashboard-app-layout" id="authenticated-layout">
          {/* Sidebar Lateral Expansível */}
          <Sidebar
            currentModule={currentModule}
            onSelectModule={setCurrentModule}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            user={session.user}
            onLogout={handleLogout}
            onOpenConfig={() => setShowConfigModal(true)}
            isSupabaseOnline={isSupabaseConfigured}
          />

          {/* Área Principal de Conteúdo */}
          <div className={`main-stage-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            {/* Top Bar da Dashboard */}
            <header className="stage-topbar" id="stage-topbar">
              <div className="topbar-breadcrumb">
                <span className="breadcrumb-root">Ambipar Logistics</span>
                <ChevronRight size={14} className="breadcrumb-separator" />
                <span className="breadcrumb-current">{moduleInfo[currentModule]?.title}</span>
              </div>

              <div className="topbar-actions">
                <div className="live-status-chip">
                  <span className="pulse-green"></span>
                  <span>Operação Ativa</span>
                </div>

                <button
                  type="button"
                  className="topbar-icon-btn"
                  onClick={() => setShowConfigModal(true)}
                  title="Configurações Supabase (.env)"
                >
                  <Settings size={18} />
                </button>

                <div className="topbar-user-pill">
                  <div className="avatar-mini">
                    {session.user?.email ? session.user.email.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <span className="user-short-name">
                    {session.user?.user_metadata?.full_name?.split(' ')[0] || 'Analista'}
                  </span>
                </div>
              </div>
            </header>

            {/* Módulo Ativo Selecionado */}
            <main className="stage-content-body" id="stage-content-body">
              {currentModule === 'dashboard' && <LogisticsDashboard user={session.user} />}
              {currentModule === 'viagens' && <TripsModule user={session.user} />}
              {currentModule === 'mtr' && <MtrModule user={session.user} />}
              {currentModule === 'calculadoras' && <CalculatorModule />}
              {currentModule === 'ocorrencias' && <OcorrenciasModule />}
              {currentModule === 'esg' && <EsgModule />}
            </main>
          </div>
        </div>
      )}

      {/* Modal de Configuração das Chaves do Supabase */}
      <SupabaseConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
      />
    </div>
  );
}
