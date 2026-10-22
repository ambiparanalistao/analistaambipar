import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Settings, 
  Database, 
  Leaf, 
  ChevronRight,
  LogOut
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import Sidebar from './components/Sidebar';
import LogisticsDashboard from './components/LogisticsDashboard';
import VehiclesModule from './components/VehiclesModule';
import TripsModule from './components/TripsModule';
import MtrModule from './components/MtrModule';
import DriversModule from './components/DriversModule';
import FreightCarbonCalculator from './components/FreightCarbonCalculator';
import AnttFormulasModule from './components/AnttFormulasModule';
import OcorrenciasModule from './components/OcorrenciasModule';
import EsgModule from './components/EsgModule';
import AuthCard from './components/AuthCard';
import SupabaseConfigModal from './components/SupabaseConfigModal';
import './App.css';

// Mapeamento de Rotas Web para cada Módulo
export const MODULE_ROUTES = {
  dashboard: '/dashboard',
  frotas: '/frotas',
  motoristas: '/motoristas',
  viagens: '/viagens',
  mtr: '/mtr',
  calculadora_frete: '/calculadora-frete',
  antt_formulas: '/antt-formulas',
  ocorrencias: '/ocorrencias',
  esg: '/esg'
};

export const PATH_TO_MODULE = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/frotas': 'frotas',
  '/frota': 'frotas',
  '/veiculos': 'frotas',
  '/veiculo': 'frotas',
  '/motoristas': 'motoristas',
  '/motorista': 'motoristas',
  '/viagens': 'viagens',
  '/viagem': 'viagens',
  '/mtr': 'mtr',
  '/sinir': 'mtr',
  '/calculadora': 'calculadora_frete',
  '/calculadora-frete': 'calculadora_frete',
  '/frete': 'calculadora_frete',
  '/antt': 'antt_formulas',
  '/antt-formulas': 'antt_formulas',
  '/formulas': 'antt_formulas',
  '/ocorrencias': 'ocorrencias',
  '/emergencias': 'ocorrencias',
  '/esg': 'esg',
  '/sustentabilidade': 'esg'
};

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Inicializa o módulo ativo a partir da URL no navegador
  const getInitialModule = () => {
    if (typeof window === 'undefined') return 'dashboard';
    const rawPath = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
    return PATH_TO_MODULE[rawPath] || 'dashboard';
  };

  const [currentModule, setCurrentModule] = useState(getInitialModule);

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
        email: 'carlos.eduardo@ambipar.com',
        user_metadata: {
          full_name: 'Carlos Eduardo Dos Santos'
        }
      }
    });
  };

  // Nomes e descrições dos módulos para o cabeçalho superior
  const moduleInfo = {
    dashboard: { 
      title: 'Torre de Controle Operacional', 
      subtitle: 'Painel Geral de Operações, KPIs Consolidados e Monitoramento do Banco de Dados' 
    },
    frotas: { 
      title: 'Gestão de Frotas & Veículos Homologados', 
      subtitle: 'Controle de veículos, carretas, vistorias CIPP/CIV, tacógrafo e conformidade regulatória' 
    },
    motoristas: { 
      title: 'Quadro de Motoristas & Certificações MOPP', 
      subtitle: 'Habilitação, exames toxicológicos, cursos regulamentares e conformidade de condutores' 
    },
    viagens: { 
      title: 'Monitoramento de Viagens & Rotas', 
      subtitle: 'Rastreamento operacional de veículos, carga/descarga e gestão de motoristas' 
    },
    mtr: { 
      title: 'Manifestos de Transporte de Resíduos (MTR)', 
      subtitle: 'Controle de resíduos industriais perigosos (Classe I/II) e conformidade com o SINIR' 
    },
    calculadora_frete: { 
      title: 'Calculadora Avançada de Frete & Carbono', 
      subtitle: 'Simulação analítica de rotas, formação de preço, DRE de custos (CPK) e balanço GEE' 
    },
    antt_formulas: { 
      title: 'Compatibilidade ANTT & Fórmulas Operacionais', 
      subtitle: 'Segregação química de produtos perigosos (Resolução ANTT 5998) e metodologias técnicas' 
    },
    ocorrencias: { 
      title: 'Central de Ocorrências & Emergências', 
      subtitle: 'Plano de Atendimento a Emergências (PAE) e suporte 24h Ambipar Response' 
    },
    esg: { 
      title: 'Descarbonização & Indicadores ESG', 
      subtitle: 'Metas corporativas de sustentabilidade, créditos verdes e descarte sustentável' 
    }
  };

  // Navegação que atualiza a URL na barra de endereços (sem recarregar a página)
  const handleSelectModule = (targetModule) => {
    setCurrentModule(targetModule);
    if (typeof window !== 'undefined') {
      const targetPath = MODULE_ROUTES[targetModule] || '/dashboard';
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ module: targetModule }, '', targetPath);
      }
      const title = moduleInfo[targetModule]?.title ? `${moduleInfo[targetModule].title} | Analista Ambipar` : 'Analista Ambipar';
      document.title = title;
    }
  };

  // Escuta os botões Voltar / Avançar do navegador (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
      const mod = PATH_TO_MODULE[path] || 'dashboard';
      setCurrentModule(mod);
      const title = moduleInfo[mod]?.title ? `${moduleInfo[mod].title} | Analista Ambipar` : 'Analista Ambipar';
      document.title = title;
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Garante que o document.title e a URL fiquem sincronizados no primeiro carregamento
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
      const mapped = PATH_TO_MODULE[currentPath];
      if (mapped) {
        const canonical = MODULE_ROUTES[mapped];
        if (currentPath === '/' && canonical) {
          window.history.replaceState({ module: mapped }, '', canonical);
        }
        const title = moduleInfo[mapped]?.title ? `${moduleInfo[mapped].title} | Analista Ambipar` : 'Analista Ambipar';
        document.title = title;
      }
    }
  }, []);

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
            onSelectModule={handleSelectModule}
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
                <span 
                  className="breadcrumb-root" 
                  onClick={() => handleSelectModule('dashboard')}
                  style={{ cursor: 'pointer' }}
                  title="Ir para a Torre de Controle"
                >
                  Ambipar Logistics
                </span>
                <ChevronRight size={14} className="breadcrumb-separator" />
                <span className="breadcrumb-current">{moduleInfo[currentModule]?.title}</span>
                <span className="breadcrumb-route-tag" style={{ marginLeft: '0.65rem', fontSize: '0.72rem', color: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  {MODULE_ROUTES[currentModule] || '/dashboard'}
                </span>
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
              {currentModule === 'dashboard' && (
                <LogisticsDashboard 
                  user={session.user} 
                  onNavigateModule={handleSelectModule} 
                />
              )}
              {currentModule === 'frotas' && (
                <VehiclesModule 
                  user={session.user} 
                  onNavigateDrivers={() => handleSelectModule('motoristas')}
                />
              )}
              {currentModule === 'motoristas' && (
                <DriversModule 
                  user={session.user} 
                  onNavigateVehicles={() => handleSelectModule('frotas')}
                />
              )}
              {currentModule === 'viagens' && <TripsModule user={session.user} />}
              {currentModule === 'mtr' && <MtrModule user={session.user} />}
              {currentModule === 'calculadora_frete' && <FreightCarbonCalculator onNavigateMtr={() => handleSelectModule('mtr')} />}
              {currentModule === 'antt_formulas' && <AnttFormulasModule />}
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
