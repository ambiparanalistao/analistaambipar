import useCompliance from '../hooks/useCompliance';
import { validity } from '../utils/compliance';
import PreventiveIndicator from './maintenance/plans/PreventiveIndicator';
import React, { useState, useMemo } from 'react';
import { MAINTENANCE_PAGES } from './maintenance/maintenanceRoutes';
import {
  CalendarDays,
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
  Wifi,
  Wrench,
  Database,
  DollarSign,
  Search,
  X,
  Layers,
  ChevronDown
} from 'lucide-react';

export default function Sidebar({
  currentModule,
  onSelectModule,
  isCollapsed,
  onToggleCollapse,
  user,
  onLogout,
  onOpenConfig,
  isSupabaseOnline,
  maintenanceAccess
}) {
  const compliance = useCompliance(maintenanceAccess?.canRead ? maintenanceAccess.companyId : undefined);
  const complianceAlerts = compliance.rows.filter((l) =>
    ['vencida', 'breve'].includes(validity(l.vencimento, l.indeterminada).key)
  ).length;

  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'A';
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Analista';

  // 4 Pilares Executivos Claros e Sem Confusão
  const menuSections = useMemo(
    () => [
      {
        id: 'torre_controle',
        title: 'Torre de Controle',
        icon: LayoutDashboard,
        items: [
          {
            id: 'dashboard',
            label: 'Torre de Controle (KPIs)',
            icon: LayoutDashboard,
            description: 'Painel geral, KPIs consolidados e status operacional'
          },
          {
            id: 'centralizacao_dados',
            label: 'Centralização de Dados',
            icon: Database,
            description: 'Auditoria e unificação de bases operacionais'
          }
        ]
      },
      {
        id: 'frota_manutencao',
        title: 'Frota & Manutenção',
        icon: Truck,
        items: [
          {
            id: 'frotas',
            label: 'Gestão de Frotas & Veículos',
            icon: Truck,
            badge: 'Vale & DCX',
            badgeColor: '#10b981',
            description: 'Controle de veículos alocados por base'
          },
          {
            id: 'manutencao_preventiva',
            label: 'Preventiva por KM & Odômetro',
            icon: Wrench,
            badge: 'Preventiva',
            badgeColor: '#06b6d4',
            description: 'Revisões periódicas e vida útil de componentes'
          },
          {
            id: 'auditoria_vencimentos',
            label: 'Auditoria de Vencimentos',
            icon: ShieldAlert,
            badge: complianceAlerts ? `${complianceAlerts} alertas` : null,
            badgeColor: '#ef4444',
            description: 'CIPP, CIV, CRLV, Tacógrafo e Licenças'
          },
          {
            id: 'motoristas',
            label: 'Quadro de Condutores (MOPP)',
            icon: UserCheck,
            description: 'Habilitação, exames toxicológicos e conformidade'
          }
        ]
      },
      {
        id: 'logistica_despacho',
        title: 'Logística & Despacho',
        icon: Route,
        items: [
          {
            id: 'escala',
            label: 'Escala Operacional Diária',
            icon: CalendarDays,
            description: 'Alocação de condutores e veículos por circuito'
          },
          {
            id: 'rotas',
            label: 'Central de Rotas & Circuitos RJ',
            icon: Route,
            description: 'Corredores homologados e cálculo de distâncias'
          },
          {
            id: 'viagens',
            label: 'Monitoramento de Viagens',
            icon: Compass,
            description: 'Rastreamento operacional e carga/descarga'
          },
          {
            id: 'clientes',
            label: 'Clientes & Roteirização',
            icon: Building2,
            description: 'Contratos industriais e rotas dedicadas'
          }
        ]
      },
      {
        id: 'combustivel_custos',
        title: 'Combustível, Custos & ESG',
        icon: Fuel,
        items: [
          {
            id: 'combustivel',
            label: 'Controle de Combustível & ARLA',
            icon: Fuel,
            description: 'Auditoria de abastecimentos e CPK'
          },
          {
            id: 'aporte_combustivel',
            label: 'Aporte Semanal Abank',
            icon: DollarSign,
            badge: 'Quinta',
            badgeColor: '#f59e0b',
            description: 'Fechamento Quarta 17h e reporte semanal'
          },
          {
            id: 'mtr',
            label: 'MTR & Destinação Resíduos',
            icon: FileText,
            description: 'Controle SINIR e manifestos de resíduos'
          },
          {
            id: 'calculadora_frete',
            label: 'Calculadora de Frete & Carbono',
            icon: Calculator,
            description: 'Formação de preço e balanço de carbono'
          },
          {
            id: 'simulador_autonomia',
            label: 'Simulador de Autonomia',
            icon: Compass,
            description: 'Cálculo de paradas e autonomia estimada'
          },
          {
            id: 'ocorrencias',
            label: 'Ocorrências & PAE 24h',
            icon: AlertTriangle,
            description: 'Plano de Atendimento a Emergências Ambipar'
          },
          {
            id: 'automacao',
            label: 'Automação · WhatsApp',
            icon: Wifi,
            description: 'Instância conectada e disparos operacionais'
          },
          {
            id: 'antt_formulas',
            label: 'ANTT & Fórmulas Químicas',
            icon: ShieldAlert,
            description: 'Segregação química de produtos perigosos'
          },
          {
            id: 'esg',
            label: 'Descarbonização & ESG',
            icon: BarChart3,
            description: 'Indicadores sustentáveis e créditos verdes'
          }
        ]
      }
    ],
    [complianceAlerts]
  );

  // Filtro de Busca Instantâneo
  const filteredSections = useMemo(() => {
    if (!searchTerm.trim()) return menuSections;
    const term = searchTerm.toLowerCase().trim();
    return menuSections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.label.toLowerCase().includes(term) ||
            item.description?.toLowerCase().includes(term) ||
            section.title.toLowerCase().includes(term)
        )
      }))
      .filter((section) => section.items.length > 0);
  }, [menuSections, searchTerm]);

  return (
    <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`} id="main-app-sidebar">
      {/* Topo da Sidebar: Logo & Botão de Recolher */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="brand-logo-glow">
            <Leaf size={22} className="brand-logo-icon" />
          </div>
          {!isCollapsed && (
            <div className="brand-meta">
              <span className="brand-title-main">AMBIPAR</span>
              <span className="brand-subtitle-main">Central de Gestão de Frota</span>
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
            <span className="user-name-label" title={userName}>
              {userName}
            </span>
            <div className="user-role-subline">
              <span className="user-role-tag">Analista de Frota</span>
              <span className="bases-tag-mini">Vale · DCX</span>
            </div>
          </div>
        )}
      </div>

      {/* Campo de Busca Rápida de Módulos (Elimina a confusão) */}
      {!isCollapsed && (
        <div className="sidebar-search-box">
          <Search size={14} className="sidebar-search-icon" />
          <input
            type="text"
            placeholder="Buscar módulo (ex: frota, diesel)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sidebar-search-input"
          />
          {searchTerm && (
            <button
              type="button"
              className="sidebar-search-clear"
              onClick={() => setSearchTerm('')}
              title="Limpar busca"
            >
              <X size={13} />
            </button>
          )}
        </div>
      )}

      {/* Navegação dos Módulos */}
      <nav className="sidebar-nav">
        {/* Menu Manutenção Avançada (Oficinas, O.S., etc.) */}
        {maintenanceAccess?.canRead && (
          <div className="nav-group">
            <button
              type="button"
              className={`nav-link-btn ${currentModule.startsWith('maintenance_') ? 'active-group' : ''}`}
              aria-expanded={maintenanceOpen}
              title="Manutenção e Oficinas"
              onClick={() =>
                isCollapsed
                  ? onSelectModule('maintenance_partners')
                  : setMaintenanceOpen((v) => !v)
              }
            >
              <div className="nav-icon-box">
                <Wrench size={17} />
              </div>
              {!isCollapsed && (
                <div className="nav-label-box">
                  <span className="nav-label-text">Manutenção & Oficinas</span>
                  <ChevronDown
                    size={14}
                    style={{
                      transform: maintenanceOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease',
                      opacity: 0.7
                    }}
                  />
                </div>
              )}
            </button>
            {!isCollapsed && maintenanceOpen && (
              <ul className="nav-items-list maintenance-submenu">
                {MAINTENANCE_PAGES.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className={`nav-link-btn ${currentModule === p.id ? 'active' : ''}`}
                      onClick={() => onSelectModule(p.id)}
                    >
                      <span className="submenu-bullet"></span>
                      <span>{p.label}</span>
                      {p.id === 'maintenance_plans' && (
                        <PreventiveIndicator company={maintenanceAccess.companyId} compact />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 4 Pilares de Módulos */}
        {filteredSections.map((section) => (
          <div key={section.id} className="nav-group">
            {!isCollapsed && (
              <div className="nav-group-header">
                <span className="nav-group-title">{section.title}</span>
                <span className="nav-group-count">{section.items.length}</span>
              </div>
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
                      title={isCollapsed ? `${item.label} - ${item.description}` : undefined}
                      id={`sidebar-nav-${item.id}`}
                    >
                      <div className="nav-icon-box">
                        <Icon size={17} />
                      </div>
                      {!isCollapsed && (
                        <div className="nav-label-box">
                          <span className="nav-label-text">{item.label}</span>
                          {item.badge && (
                            <span
                              style={{
                                fontSize: '0.62rem',
                                fontWeight: 800,
                                background: item.badgeColor || '#ef4444',
                                color: '#ffffff',
                                padding: '2px 6px',
                                borderRadius: '8px',
                                marginLeft: 'auto',
                                boxShadow: `0 0 8px ${item.badgeColor || '#ef4444'}66`,
                                letterSpacing: '0.02em',
                                flexShrink: 0
                              }}
                            >
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

        {filteredSections.length === 0 && (
          <div className="sidebar-empty-search">
            <AlertTriangle size={18} />
            <span>Nenhum módulo encontrado para "{searchTerm}".</span>
            <button type="button" onClick={() => setSearchTerm('')}>
              Limpar busca
            </button>
          </div>
        )}
      </nav>

      {/* Rodapé da Sidebar: Status & Ações */}
      <div className="sidebar-footer">
        <div
          className={`sidebar-status-pill ${isSupabaseOnline ? 'online' : 'unconfigured'}`}
          title={isSupabaseOnline ? 'Servidor em Nuvem Conectado' : 'Conexão em Nuvem Pendente'}
        >
          <span className="pulse-dot"></span>
          {!isCollapsed && (
            <span>{isSupabaseOnline ? 'Servidor Online' : 'Sincronização Pendente'}</span>
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
