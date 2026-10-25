import useCompliance from '../hooks/useCompliance';
import {validity} from '../utils/compliance';
import PreventiveIndicator from './maintenance/plans/PreventiveIndicator';
import React,{useState} from 'react';
import {MAINTENANCE_PAGES} from './maintenance/maintenanceRoutes';
import { 
  CalendarDays,
  MapPin,
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
  Wifi, Wrench, Database,
  DollarSign
} from 'lucide-react';

export default function Sidebar({ 
  currentModule, 
  onSelectModule, 
  isCollapsed, 
  onToggleCollapse, 
  user, 
  onLogout,
  onOpenConfig,
  isSupabaseOnline, maintenanceAccess
}) {
  const compliance=useCompliance(maintenanceAccess?.canRead?maintenanceAccess.companyId:undefined);
  const complianceAlerts=compliance.rows.filter(l=>['vencida','breve'].includes(validity(l.vencimento,l.indeterminada).key)).length;
  const [maintenanceOpen,setMaintenanceOpen]=useState(true);
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'A';
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Analista';

  const menuSections = [
    { title: 'Integrações', items: [{ id: 'automacao', label: 'Automação · WhatsApp', icon: Wifi }] },
    {
      title: 'Operação & Torre de Controle',
      items: [
        { id: 'centralizacao_dados', label: 'Centralização de Dados', icon: Database },
        {
          id: 'dashboard',
          label: 'Torre de Controle (KPIs)',
          icon: LayoutDashboard
        },
        {
          id: 'auditoria_vencimentos',
          label: 'Auditoria e Vencimentos',
          icon: ShieldAlert,
          badge: complianceAlerts?complianceAlerts+' alertas':null
        },
        {
          id: 'manutencao_preventiva',
          label: 'Manutenção Preventiva & KM',
          icon: Wrench,
          badge: 'Preventiva'
        },
        {
          id: 'escala',
          label: 'Escala Operacional',
          icon: CalendarDays
        },
        {
          id: 'rotas',
          label: 'Central de Rotas & Circuitos',
          icon: Route
        },
        {
          id: 'clientes',
          label: 'Gestão de Clientes & Contratos',
          icon: Building2
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
          icon: Compass
        },
        {
          id: 'combustivel',
          label: 'Controle de Combustível & ARLA',
          icon: Fuel
        },
        {
          id: 'aporte_combustivel',
          label: 'Aporte Semanal Combustível',
          icon: DollarSign,
          badge: 'Quinta'
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
          label: 'Simulador de Autonomia',
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
              <span className="brand-subtitle-main">Central de Gestão de Frota e Logística</span>
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
            <span className="user-role-tag">Analista de Transporte</span>
          </div>
        )}
      </div>

      {/* Navegação dos Módulos */}
      <nav className="sidebar-nav">
        {maintenanceAccess?.canRead&&<div className="nav-group">
          <button type="button" className="nav-link-btn" aria-expanded={maintenanceOpen} title="Manutenção" onClick={()=>isCollapsed?onSelectModule('maintenance_partners'):setMaintenanceOpen(v=>!v)}><div className="nav-icon-box"><Wrench size={18}/></div>{!isCollapsed&&<span>Manutenção</span>}</button>
          {!isCollapsed&&maintenanceOpen&&<ul className="nav-items-list maintenance-submenu">{MAINTENANCE_PAGES.map(p=><li key={p.id}><button type="button" className={'nav-link-btn '+(currentModule===p.id?'active':'')} onClick={()=>onSelectModule(p.id)}>{p.label}{p.id==='maintenance_plans'&&<PreventiveIndicator company={maintenanceAccess.companyId} compact/>}</button></li>)}</ul>}
        </div>}

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
                        <div className="nav-label-box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <span className="nav-label-text">{item.label}</span>
                          {item.badge && (
                            <span style={{
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              background: '#ef4444',
                              color: '#ffffff',
                              padding: '2px 6px',
                              borderRadius: '8px',
                              marginLeft: 'auto',
                              boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)'
                            }}>
                              {item.badge}
                            </span>
                          )}
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
