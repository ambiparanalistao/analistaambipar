import MaintenanceNotifications from './components/maintenance/communication/MaintenanceNotifications';
import DriverMaintenancePage from './components/maintenance/driver/DriverMaintenancePage';
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
import ClientsModule from './components/ClientsModule';
import FuelModule from './components/FuelModule';
import AuthCard from './components/AuthCard';
import SupabaseConfigModal from './components/SupabaseConfigModal';
import ComplianceAuditModule from './components/ComplianceAuditModule';
import EscalaModule from './components/EscalaModule';
import RotasModule from './components/RotasModule';
import PreventiveMaintenanceModule from './components/PreventiveMaintenanceModule';
import ErrorBoundary from './components/ErrorBoundary';
import AutomationModule from './components/AutomationModule';
import MaintenanceModule from './components/maintenance/MaintenanceModule';
import {MAINTENANCE_PAGES} from './components/maintenance/maintenanceRoutes';
import useMaintenanceAccess from './hooks/useMaintenanceAccess';
import WeeklyFuelProvisionModule from './components/WeeklyFuelProvisionModule';
import './App.css';

// Mapeamento de Rotas Web para cada Módulo
export const MODULE_ROUTES = {
  ...Object.fromEntries(MAINTENANCE_PAGES.map(p=>[p.id,p.path])),
  driver_maintenance: '/motorista/manutencao',
  automacao: '/automacao',
  dashboard: '/dashboard',
  escala: '/escala',
  rotas: '/rotas',
  auditoria_vencimentos: '/auditoria-vencimentos',
  manutencao_preventiva: '/manutencao-preventiva',
  frotas: '/frotas',
  motoristas: '/motoristas',
  viagens: '/viagens',
  combustivel: '/combustivel',
  aporte_combustivel: '/aporte-combustivel',
  simulador_autonomia: '/simulador-autonomia',
  clientes: '/clientes',
  mtr: '/mtr',
  calculadora_frete: '/calculadora-frete',
  antt_formulas: '/antt-formulas',
  ocorrencias: '/ocorrencias',
  esg: '/esg'
};

export const PATH_TO_MODULE = {
  ...Object.fromEntries(MAINTENANCE_PAGES.map(p=>[p.path,p.id])),
  '/motorista/manutencao':'driver_maintenance',
  '/manutencao':'maintenance_partners',
  '/automacao': 'automacao',
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/escala': 'escala',
  '/escalas': 'escala',
  '/despacho': 'escala',
  '/rotas': 'rotas',
  '/rota': 'rotas',
  '/roteirizacao': 'rotas',
  '/auditoria-vencimentos': 'auditoria_vencimentos',
  '/manutencao-preventiva': 'manutencao_preventiva',
  '/preventiva': 'manutencao_preventiva',
  '/odometro': 'manutencao_preventiva',
  '/vencimentos': 'auditoria_vencimentos',
  '/auditoria': 'auditoria_vencimentos',
  '/documentos': 'auditoria_vencimentos',
  '/frotas': 'frotas',
  '/frota': 'frotas',
  '/veiculos': 'frotas',
  '/veiculo': 'frotas',
  '/motoristas': 'motoristas',
  '/motorista': 'motoristas',
  '/viagens': 'viagens',
  '/viagem': 'viagens',
  '/combustivel': 'combustivel',
  '/combustiveis': 'combustivel',
  '/abastecimento': 'combustivel',
  '/abastecimentos': 'combustivel',
  '/diesel': 'combustivel',
  '/arla': 'combustivel',
  '/aporte-combustivel': 'aporte_combustivel',
  '/aporte': 'aporte_combustivel',
  '/reporte-combustivel': 'aporte_combustivel',
  '/saldo-combustivel': 'aporte_combustivel',
  '/aporte-semanal': 'aporte_combustivel',
  '/simulador-autonomia': 'simulador_autonomia',
  '/simulador': 'simulador_autonomia',
  '/autonomia': 'simulador_autonomia',
  '/clientes': 'clientes',
  '/cliente': 'clientes',
  '/rotas-clientes': 'clientes',
  '/contratos': 'clientes',
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
  const maintenanceAccess = useMaintenanceAccess(session?.user);
  useEffect(()=>{
    if(!currentModule.startsWith('maintenance_'))return;
    const compact=()=>{if(window.matchMedia('(max-width:760px)').matches)setIsSidebarCollapsed(true);};
    compact();window.addEventListener('resize',compact);return()=>window.removeEventListener('resize',compact);
  },[currentModule]);

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

  // Nomes e descrições dos módulos para o cabeçalho superior
  const moduleInfo = {
    ...Object.fromEntries(MAINTENANCE_PAGES.map(p=>[p.id,{title:'Manutenção · '+p.label,subtitle:'Gestão de manutenção e oficinas parceiras'}])),
    automacao: { title: 'Automação · Conexão WhatsApp', subtitle: 'Autenticação, status e reconexão da instância Evolution API' },
    escala: { 
      title: 'Escala Operacional & Despacho CCO', 
      subtitle: 'Alocação diária de motoristas homologados e veículos a circuitos com múltiplos clientes e endereços' 
    },
    rotas: { 
      title: 'Central de Rotas & Circuitos Logísticos RJ', 
      subtitle: 'Corredores homologados, sequenciamento de paradas e cálculo de distâncias' 
    },
    dashboard: { 
      title: 'Torre de Controle Operacional', 
      subtitle: 'Painel Geral de Operações, KPIs Consolidados e Monitoramento de Frota & Resíduos' 
    },
    auditoria_vencimentos: { 
      title: 'Central de Vencimentos Regulatórios & CIPP/CIV', 
      subtitle: 'Monitoramento preditivo de CRLV, CIV, CIPP (Produtos Perigosos), Tacógrafo Inmetro, Licenças IBAMA/INEA e CNH/MOPP' 
    },
    manutencao_preventiva: {
      title: 'Manutenção Preventiva por KM & Odômetro',
      subtitle: 'Monitoramento preditivo de vida útil (óleo 15k km / 250h PTO, engraxamento 5k km, freios 30k km) e gestão de OSs'
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
    combustivel: { 
      title: 'Controle de Combustível, ARLA 32 & Eficiência Energética', 
      subtitle: 'Auditoria de abastecimentos, rendimento médio (km/l), custo por quilômetro (CPK) e conformidade fiscal' 
    },
    aporte_combustivel: {
      title: 'Aporte Semanal & Solicitação de Saldo de Combustível',
      subtitle: 'Fechamento Quarta-feira 17h ➔ Relatório e Solicitação de Saldo Ticket Log toda Quinta-feira Manhã'
    },
    simulador_autonomia: { 
      title: 'Simulador Analítico de Autonomia & Consumo de Rota CCO', 
      subtitle: 'Planejamento preditivo de abastecimento para despacho, cálculo de ARLA 32, paradas na rodovia e CPK' 
    },
    clientes: { 
      title: 'Gestão de Clientes & Roteirização Dedicada', 
      subtitle: 'Cadastro industrial homologado, SLA de atendimento e direcionamento dinâmico a rotas logísticas' 
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
            />
          </main>
        </>
      ) : maintenanceAccess.loading ? <p role="status">Verificando acesso…</p> : maintenanceAccess.error ? <div role="alert">{maintenanceAccess.error}<button onClick={maintenanceAccess.reload}>Tentar novamente</button><button onClick={handleLogout}>Sair</button></div> : (maintenanceAccess.memberships.some(m=>m.roleName==='motorista')&&!maintenanceAccess.canRead)||currentModule==='driver_maintenance' ? <DriverMaintenancePage access={maintenanceAccess} onLogout={handleLogout}/> : (
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
            maintenanceAccess={maintenanceAccess}
          />

          {/* Área Principal de Conteúdo */}
          <div className={`main-stage-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${currentModule.startsWith('maintenance_') ? 'maintenance-stage' : ''}`}>
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
              </div>

              <div className="topbar-actions">
                {maintenanceAccess.canRead&&<MaintenanceNotifications key={maintenanceAccess.companyId} access={maintenanceAccess}/>}
                <div className="live-status-chip">
                  <span className="pulse-green"></span>
                  <span>Operação Ativa</span>
                </div>

                <button
                  type="button"
                  className="topbar-icon-btn"
                  onClick={() => setShowConfigModal(true)}
                  title="Configurações do Sistema"
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
              <ErrorBoundary>
                {currentModule === 'auditoria_vencimentos' && <ComplianceAuditModule />}
                {currentModule === 'manutencao_preventiva' && <PreventiveMaintenanceModule user={session.user} onNavigateFleet={() => handleSelectModule('frotas')} />}
                {currentModule === 'escala' && <EscalaModule user={session.user} onNavigateRotas={() => handleSelectModule('rotas')} />}
                {currentModule === 'rotas' && <RotasModule user={session.user} onNavigateEscala={() => handleSelectModule('escala')} />}
                {currentModule.startsWith('maintenance_') && <MaintenanceModule access={maintenanceAccess} page={currentModule} />}
                {currentModule === 'dashboard' && (
                  <LogisticsDashboard 
                    user={session.user} 
                    onNavigateModule={handleSelectModule} 
                  />
                )}
                {currentModule === 'frotas' && (
                  <VehiclesModule key={maintenanceAccess.companyId}
                    companyId={maintenanceAccess.companyId}
                    maintenanceAccess={maintenanceAccess}
                    user={session.user} 
                    onNavigateDrivers={() => handleSelectModule('motoristas')}
                  />
                )}
                {currentModule === 'motoristas' && (
                  <DriversModule key={maintenanceAccess.companyId}
                    maintenanceAccess={maintenanceAccess}
                    user={session.user} 
                    onNavigateVehicles={() => handleSelectModule('frotas')}
                  />
                )}
                {currentModule === 'viagens' && <TripsModule companyId={maintenanceAccess.companyId} user={session.user} />}
                {currentModule === 'combustivel' && <FuelModule companyId={maintenanceAccess.companyId} key={maintenanceAccess.companyId} user={session.user} initialView="dashboard" onNavigateModule={handleSelectModule} />}
                {currentModule === 'aporte_combustivel' && <WeeklyFuelProvisionModule user={session.user} onNavigateModule={handleSelectModule} />}
                {currentModule === 'simulador_autonomia' && <FuelModule companyId={maintenanceAccess.companyId} key={maintenanceAccess.companyId} user={session.user} initialView="simulator" onNavigateModule={handleSelectModule} />}
                {currentModule === 'clientes' && (
                  <ClientsModule 
                    companyId={maintenanceAccess.companyId}
                    user={session.user} 
                    onNavigateTrips={() => handleSelectModule('viagens')}
                    onNavigateFleet={() => handleSelectModule('frotas')}
                  />
                )}
                {currentModule === 'mtr' && <MtrModule user={session.user} />}
                {currentModule === 'calculadora_frete' && <FreightCarbonCalculator onNavigateMtr={() => handleSelectModule('mtr')} />}
                {currentModule === 'antt_formulas' && <AnttFormulasModule />}
                {currentModule === 'ocorrencias' && <OcorrenciasModule companyId={maintenanceAccess.companyId} key={maintenanceAccess.companyId}/>}
                {currentModule === 'esg' && <EsgModule />}
                {currentModule === 'automacao' && <AutomationModule user={session.user} />}
              </ErrorBoundary>
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
