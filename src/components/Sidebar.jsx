import React from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  FileText, 
  UserCheck,
  Calculator, 
  ShieldAlert, 
  AlertTriangle, 
  BarChart3, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  Leaf,
  Route,
  Building2,
  Fuel,
  Compass,
  Wifi
} from 'lucide-react';

export default function Sidebar({ 
  currentModule, 
  onSelectModule, 
  isCollapsed, 
  onToggleCollapse, 
  user, 
  onLogout,
  onOpenConfig,
  isSupabaseOnline
}) {
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'A';
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Analista';

  const menuSections = [
    { title: 'Integrações', items: [{ id: 'automacao', label: 'Automação · WhatsApp', icon: Wifi }] },
    {
      title: 'Operação & Torre de Controle',
      items: [
        {
          id: 'dashboard',
          label: 'Torre de Controle (KPIs)',
          icon: LayoutDashboard
        },
        {
          id: 'frotas',
          label: 'Gestão de Frotas & Veículos',
          icon: Truck
        },
        {
          id: 'motoristas',
          label: 'Gestão de Motoristas (MOPP)',
          icon: UserCheck
        },
        {
          id: 'viagens',
          label: 'Monitoramento de Viagens',
          icon: Route
        },
        {
          id: 'combustivel',
          label: 'Controle de Combustível & ARLA',
          icon: Fuel
        },
        {
          id: 'clientes',
          label: 'Gestão de Clientes & Rotas',
          icon: Building2
        },
        {
          id: 'mtr',
          label: 'MTR & Destinação Resíduos',
          icon: FileText
        }
      ]
    },
    {
      title: 'Engenharia de Frete & Inteligência',
      items: [
        {
          id: 'calculadora_frete',
          label: 'Calculadora de Frete & Carbono',
          icon: Calculator
        },
        {
          id: 'simulador_autonomia',
          label: 'Simulador de Autonomia CCO',
          icon: Compass
        },
        {
          id: 'antt_formulas',
          label: 'Compatibilidade ANTT & Fórmulas',
          icon: ShieldAlert
        },
        {
          id: 'ocorrencias',
          label: 'Ocorrências & Emergências',
          icon: AlertTriangle
        },
        {
          id: 'esg',
          label: 'Descarbonização & ESG',
          icon: BarChart3
        }
      ]
    }
  ];

  return (
    <aside 
      className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}
      id="main-app-sidebar"
    >
      {/* Topo da Sidebar: Logo & Botão de Recolher */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="brand-logo-glow">
            <Leaf size={22} className="brand-logo-icon" />
          </div>
          {!isCollapsed && (
            <div className="brand-meta">
              <span className="brand-title-main">AMBIPAR</span>
              <span className="brand-subtitle-main">Logistics & CCO</span>
            </div>
          )}
        </div>
        
        <button 
          type="button"
          className="sidebar-collapse-btn"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          id="toggle-sidebar-collapse-btn"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Cartão do Analista de Logística */}
      <div className="sidebar-user-card">
        <div className="user-avatar-badge">
          <span>{userInitial}</span>
          <span className="online-beacon" title="Analista em serviço"></span>
        </div>
        {!isCollapsed && (
          <div className="user-details-compact">
            <span className="user-name-label" title={userName}>{userName}</span>
            <span className="user-role-tag">Analista de Logística / CCO</span>
          </div>
        )}
      </div>

      {/* Navegação dos Módulos */}
      <nav className="sidebar-nav">
        {menuSections.map((section, sIdx) => (
          <div key={sIdx} className="nav-group">
            {!isCollapsed && (
              <span className="nav-group-title" title={section.title}>
                {section.title}
              </span>
            )}
            <ul className="nav-items-list">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentModule === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`nav-link-btn ${isActive ? 'active' : ''}`}
                      onClick={() => onSelectModule(item.id)}
                      title={isCollapsed ? item.label : undefined}
                      id={`sidebar-nav-${item.id}`}
                    >
                      <div className="nav-icon-box">
                        <Icon size={18} />
                      </div>
                      {!isCollapsed && (
                        <div className="nav-label-box">
                          <span className="nav-label-text">{item.label}</span>
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Rodapé da Sidebar: Status & Ações */}
      <div className="sidebar-footer">
        <div 
          className={`sidebar-status-pill ${isSupabaseOnline ? 'online' : 'unconfigured'}`}
          title={isSupabaseOnline ? 'Servidor em Nuvem Sincronizado' : 'Conexão em Nuvem Pendente'}
        >
          <span className="pulse-dot"></span>
          {!isCollapsed && (
            <span>{isSupabaseOnline ? 'Servidor Conectado' : 'Sincronização Pendente'}</span>
          )}
        </div>

        <div className="sidebar-quick-actions">
          <button
            type="button"
            className="sidebar-action-btn"
            onClick={onOpenConfig}
            title="Configurações do Sistema"
            id="sidebar-config-keys-btn"
          >
            <Settings size={16} />
            {!isCollapsed && <span>Configurações</span>}
          </button>

          <button
            type="button"
            className="sidebar-action-btn logout"
            onClick={onLogout}
            title="Sair do sistema"
            id="sidebar-logout-btn"
          >
            <LogOut size={16} />
            {!isCollapsed && <span>Sair</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
