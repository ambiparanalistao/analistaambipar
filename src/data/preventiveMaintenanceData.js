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

// Apenas regras genéricas de manutenção. Histórico e cadastros operacionais devem vir do Supabase.
