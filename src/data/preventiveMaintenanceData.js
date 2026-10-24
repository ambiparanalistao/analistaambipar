/**
 * Dados Oficiais de Manutenção Preventiva e Controle de Odômetro
 * Ambipar Environmental Solutions - Frota Duque de Caxias & Contrato Vale / Amazon
 * Data Base: 2026
 */

export const PREVENTIVE_RULES = [
  {
    id: 'oleo_filtros',
    nome: 'Troca de Óleo de Motor & Filtros',
    intervalo_km: 15000,
    intervalo_horas_pto: 250,
    descricao: 'Substituição completa do óleo lubrificante mineral/sintético 15W40, filtro de óleo lubrificante e filtro de combustível primário.',
    criticidade: 'ALTA',
    aviso_antecipado_km: 1000,
    aviso_antecipado_horas: 30
  },
  {
    id: 'engraxamento',
    nome: 'Engraxamento & Lubrificação de Articulações',
    intervalo_km: 5000,
    intervalo_horas_pto: 100,
    descricao: 'Engraxamento com graxa de lítio EP2 nos pinos e braços do poliguindaste, rampa roll-on/off, cruzetas de cardan, quinta roda e pinos de mola.',
    criticidade: 'MÉDIA',
    aviso_antecipado_km: 500,
    aviso_antecipado_horas: 15
  },
  {
    id: 'freios',
    nome: 'Revisão de Freios (Lonas, Pastilhas & Cuícas)',
    intervalo_km: 30000,
    intervalo_horas_pto: null,
    descricao: 'Inspeção e regulagem das catracas de freio automáticas, verificação de espessura de lonas/pastilhas, tambores, flexíveis e teste pneumático de cuícas spring-brake.',
    criticidade: 'CRÍTICA',
    aviso_antecipado_km: 2000,
    aviso_antecipado_horas: null
  },
  {
    id: 'filtro_ar_racor',
    nome: 'Filtros de Ar & Separador de Água (Racor)',
    intervalo_km: 20000,
    intervalo_horas_pto: 350,
    descricao: 'Drenagem e troca do elemento filtrante Racor (separador de água do Diesel S10) e troca do filtro de ar primário/secundário do motor.',
    criticidade: 'ALTA',
    aviso_antecipado_km: 1500,
    aviso_antecipado_horas: 40
  }
];

export const INITIAL_VEHICLE_MAINTENANCE_STATUS = [
  {
    placa: 'RHU-6I87',
    prefixo: 'AMB-104',
    modelo: 'VW 26.280 CRM Poli Duplo (6x4)',
    tipo_implemento: 'Poliguindaste Duplo Articulado (Brooks)',
    operacao: 'Contrato Vale S.A. (TIG Guaíba / CPBS)',
    odometro_atual: 142350,
    horimetro_pto: 1840,
    servicos: {
      oleo_filtros: {
        ultimo_km: 127800,
        ultima_data: '2026-06-12',
        oficina: 'EIVA Manutenção Pesada',
        os_numero: 'OS-14920'
      },
      engraxamento: {
        ultimo_km: 138170,
        ultima_data: '2026-09-18',
        oficina: 'Oficina Interna Base DCX',
        os_numero: 'OS-INT-882'
      },
      freios: {
        ultimo_km: 124750,
        ultima_data: '2026-05-20',
        oficina: 'Autotec Serviços Mecânicos',
        os_numero: 'OS-14110'
      },
      filtro_ar_racor: {
        ultimo_km: 134150,
        ultima_data: '2026-08-10',
        oficina: 'EIVA Manutenção Pesada',
        os_numero: 'OS-15330'
      }
    }
  },
  {
    placa: 'FVV-0E16',
    prefixo: 'AMB-105',
    modelo: 'Ford Cargo 2629 6x4 Roll-On / Roll-Off',
    tipo_implemento: 'Roll-On / Roll-Off 25t com Trava Pneumática',
    operacao: 'Contrato Amazon Meriti (CD GIG 1 / GIG 7)',
    odometro_atual: 188420,
    horimetro_pto: 2110,
    servicos: {
      oleo_filtros: {
        ultimo_km: 175000,
        ultima_data: '2026-07-04',
        oficina: 'Autotec Serviços Mecânicos',
        os_numero: 'OS-15102'
      },
      engraxamento: {
        ultimo_km: 184100,
        ultima_data: '2026-09-25',
        oficina: 'Oficina Interna Base DCX',
        os_numero: 'OS-INT-904'
      },
      freios: {
        ultimo_km: 160000,
        ultima_data: '2026-03-15',
        oficina: 'Autotec Serviços Mecânicos',
        os_numero: 'OS-13840'
      },
      filtro_ar_racor: {
        ultimo_km: 172000,
        ultima_data: '2026-06-18',
        oficina: 'Autotec Serviços Mecânicos',
        os_numero: 'OS-15011'
      }
    }
  },
  {
    placa: 'RAW-1B54',
    prefixo: 'AMB-101',
    modelo: 'M.Benz Accelo 1016 Baú 3/4',
    tipo_implemento: 'Baú Frigorífico / Carga Seca',
    operacao: 'Base Duque de Caxias (Coletas RJ)',
    odometro_atual: 48500,
    horimetro_pto: 0,
    servicos: {
      oleo_filtros: {
        ultimo_km: 35000,
        ultima_data: '2025-11-10',
        oficina: 'Oficina Interna Base DCX',
        os_numero: 'OS-INT-720'
      },
      engraxamento: {
        ultimo_km: 44000,
        ultima_data: '2026-05-12',
        oficina: 'Oficina Interna Base DCX',
        os_numero: 'OS-INT-815'
      },
      freios: {
        ultimo_km: 25000,
        ultima_data: '2025-06-20',
        oficina: 'Autotec Serviços Mecânicos',
        os_numero: 'OS-12900'
      },
      filtro_ar_racor: {
        ultimo_km: 35000,
        ultima_data: '2025-11-10',
        oficina: 'Oficina Interna Base DCX',
        os_numero: 'OS-INT-720'
      }
    }
  },
  {
    placa: 'EWX-0I82',
    prefixo: 'AMB-106',
    modelo: 'VW Constellation 25.390 (Cavalo Mecânico)',
    tipo_implemento: 'Carreta Sider / Graneleira 3 Eixos',
    operacao: 'Contrato Amazon (Transferência Interestadual)',
    odometro_atual: 312450,
    horimetro_pto: 450,
    servicos: {
      oleo_filtros: {
        ultimo_km: 301000,
        ultima_data: '2026-08-20',
        oficina: 'EIVA Manutenção Pesada',
        os_numero: 'OS-15490'
      },
      engraxamento: {
        ultimo_km: 309000,
        ultima_data: '2026-10-02',
        oficina: 'Oficina Interna Base DCX',
        os_numero: 'OS-INT-920'
      },
      freios: {
        ultimo_km: 290000,
        ultima_data: '2026-04-10',
        oficina: 'EIVA Manutenção Pesada',
        os_numero: 'OS-14022'
      },
      filtro_ar_racor: {
        ultimo_km: 301000,
        ultima_data: '2026-08-20',
        oficina: 'EIVA Manutenção Pesada',
        os_numero: 'OS-15490'
      }
    }
  },
  {
    placa: 'GEB-8C37',
    prefixo: 'AMB-107',
    modelo: 'VW Delivery 9.170 Baú 3/4',
    tipo_implemento: 'Baú Furgão Carga Seca',
    operacao: 'Contrato Vale (Leste Fluminense / Niterói)',
    odometro_atual: 98700,
    horimetro_pto: 0,
    servicos: {
      oleo_filtros: {
        ultimo_km: 85000,
        ultima_data: '2026-05-15',
        oficina: 'Autotec Serviços Mecânicos',
        os_numero: 'OS-14190'
      },
      engraxamento: {
        ultimo_km: 95000,
        ultima_data: '2026-09-10',
        oficina: 'Oficina Interna Base DCX',
        os_numero: 'OS-INT-875'
      },
      freios: {
        ultimo_km: 72000,
        ultima_data: '2025-12-05',
        oficina: 'Autotec Serviços Mecânicos',
        os_numero: 'OS-13100'
      },
      filtro_ar_racor: {
        ultimo_km: 85000,
        ultima_data: '2026-05-15',
        oficina: 'Autotec Serviços Mecânicos',
        os_numero: 'OS-14190'
      }
    }
  },
  {
    placa: 'GBU-0A23',
    prefixo: 'AMB-108',
    modelo: 'M.Benz Accelo 1016 Baú 3/4',
    tipo_implemento: 'Baú Plataforma Elevatória',
    operacao: 'Contrato Jogue Limpo (Barra & Recreio)',
    odometro_atual: 134200,
    horimetro_pto: 320,
    servicos: {
      oleo_filtros: {
        ultimo_km: 122000,
        ultima_data: '2026-06-28',
        oficina: 'Autotec Serviços Mecânicos',
        os_numero: 'OS-15080'
      },
      engraxamento: {
        ultimo_km: 130000,
        ultima_data: '2026-09-02',
        oficina: 'Oficina Interna Base DCX',
        os_numero: 'OS-INT-860'
      },
      freios: {
        ultimo_km: 110000,
        ultima_data: '2026-02-18',
        oficina: 'Autotec Serviços Mecânicos',
        os_numero: 'OS-13720'
      },
      filtro_ar_racor: {
        ultimo_km: 122000,
        ultima_data: '2026-06-28',
        oficina: 'Autotec Serviços Mecânicos',
        os_numero: 'OS-15080'
      }
    }
  },
  {
    placa: 'DWE-4I52',
    prefixo: 'AMB-109',
    modelo: 'VW Delivery VUC Baú',
    tipo_implemento: 'Baú Urbano VUC',
    operacao: 'Contrato Jogue Limpo (Zona Sul RJ)',
    odometro_atual: 118600,
    horimetro_pto: 0,
    servicos: {
      oleo_filtros: {
        ultimo_km: 105000,
        ultima_data: '2026-04-12',
        oficina: 'Autotec Serviços Mecânicos',
        os_numero: 'OS-13980'
      },
      engraxamento: {
        ultimo_km: 115000,
        ultima_data: '2026-08-30',
        oficina: 'Oficina Interna Base DCX',
        os_numero: 'OS-INT-850'
      },
      freios: {
        ultimo_km: 92000,
        ultima_data: '2025-10-14',
        oficina: 'Autotec Serviços Mecânicos',
        os_numero: 'OS-12990'
      },
      filtro_ar_racor: {
        ultimo_km: 105000,
        ultima_data: '2026-04-12',
        oficina: 'Autotec Serviços Mecânicos',
        os_numero: 'OS-13980'
      }
    }
  },
  {
    placa: 'FMB-1H09',
    prefixo: 'AMB-110',
    modelo: 'VW 26.280 CRM Hidrovácuo',
    tipo_implemento: 'Tanque Vácuo / Sucção 12m³ com Bomba Anel Líquido',
    operacao: 'Efluentes Industriais / Base DCX',
    odometro_atual: 87300,
    horimetro_pto: 1450,
    servicos: {
      oleo_filtros: {
        ultimo_km: 74000,
        ultima_data: '2026-03-22',
        oficina: 'EIVA Manutenção Pesada',
        os_numero: 'OS-13890'
      },
      engraxamento: {
        ultimo_km: 84000,
        ultima_data: '2026-08-15',
        oficina: 'Oficina Interna Base DCX',
        os_numero: 'OS-INT-830'
      },
      freios: {
        ultimo_km: 60000,
        ultima_data: '2025-08-10',
        oficina: 'EIVA Manutenção Pesada',
        os_numero: 'OS-12500'
      },
      filtro_ar_racor: {
        ultimo_km: 74000,
        ultima_data: '2026-03-22',
        oficina: 'EIVA Manutenção Pesada',
        os_numero: 'OS-13890'
      }
    }
  }
];

export const INITIAL_SERVICE_ORDERS_HISTORY = [
  {
    id: 'OS-15575',
    data: '2026-10-15',
    placa: 'RHU-6I87',
    modelo: 'VW 26.280 CRM Poli Duplo',
    servico_tipo: 'oleo_filtros',
    servico_nome: 'Troca de Óleo Lubrificante 15W40 & Filtros de Motor',
    oficina: 'EIVA Manutenção Pesada (Itaguaí/RJ)',
    km_execucao: 127800,
    valor_pecas: 2840.00,
    valor_mao_obra: 950.00,
    valor_total: 3790.00,
    tecnico_responsavel: 'Marcos Vinicius (Chefe Oficina EIVA)',
    nf_numero: 'NF-e 88319',
    observacoes: 'Drenagem de óleo do cárter, troca do filtro Racor e filtro blindado de óleo. Veículo liberado para operação Vale.'
  },
  {
    id: 'OS-INT-920',
    data: '2026-10-02',
    placa: 'EWX-0I82',
    modelo: 'VW Constellation 25.390',
    servico_tipo: 'engraxamento',
    servico_nome: 'Engraxamento Geral de Chassi, Quinta Roda e Cardan',
    oficina: 'Oficina Interna Base Ambipar DCX',
    km_execucao: 309000,
    valor_pecas: 280.00,
    valor_mao_obra: 350.00,
    valor_total: 630.00,
    tecnico_responsavel: 'Equipe de Pátio DCX',
    nf_numero: 'Interno',
    observacoes: 'Aplicação de graxa azul de alta pressão na quinta roda Jost e cruzetas de transmissão.'
  },
  {
    id: 'OS-15102',
    data: '2026-07-04',
    placa: 'FVV-0E16',
    modelo: 'Ford Cargo 2629 Roll-On',
    servico_tipo: 'oleo_filtros',
    servico_nome: 'Revisão Preventiva de Motor & Filtros de Sucção',
    oficina: 'Autotec Serviços Mecânicos (Caxias/RJ)',
    km_execucao: 175000,
    valor_pecas: 2650.00,
    valor_mao_obra: 850.00,
    valor_total: 3500.00,
    tecnico_responsavel: 'Robson Ferreira',
    nf_numero: 'NF-e 44102',
    observacoes: 'Revisão preventiva periódica de 175.000 km realizada para atendimento contínuo na Amazon GIG 1.'
  }
];

export const WORKSHOP_OPTIONS = [
  { value: 'EIVA Manutenção Pesada', label: 'EIVA Manutenção Pesada (Itaguaí/RJ)', sublabel: 'Oficina credenciada Contrato Vale e implementos pesados' },
  { value: 'Autotec Serviços Mecânicos', label: 'Autotec Serviços Mecânicos (Caxias/RJ)', sublabel: 'Especialista em suspensão, freios pneumáticos e motores' },
  { value: 'Oficina Interna Base DCX', label: 'Oficina Interna Base Ambipar DCX', sublabel: 'Manutenção preventiva rápida, engraxamento e inspeção de pátio' },
  { value: 'Concessionária Autorizada VW / MAN', label: 'Concessionária Autorizada VW / MAN', sublabel: 'Garantia e serviços eletrônicos complexos' },
  { value: 'Concessionária Mercedes-Benz', label: 'Concessionária Mercedes-Benz', sublabel: 'Revisão periódica linha Accelo' }
];
