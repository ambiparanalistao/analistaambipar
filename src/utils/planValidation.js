export const PLAN_ITEMS=['Troca de óleo','Filtros','Pneus','Correia','Freios','Revisão geral','Licenciamento','Extintor','Tacógrafo'];
export const PLAN_STATES={vencida:'Vencida',breve:'Vence em breve',dia:'Em dia'};

export const DEFAULT_PREVENTIVE_PLANS = [
  {
    id: 'default-plan-oleo',
    nome: 'Troca de Óleo de Motor',
    item_chave: 'oleo',
    intervalo_km: 10000,
    intervalo_dias: 180,
    categoria: 'Motor',
    ativo: true,
    descricao: 'Substituição periódica do óleo lubrificante de motor e conferência dos níveis.'
  },
  {
    id: 'default-plan-filtros',
    nome: 'Filtros (Ar, Óleo e Combustível)',
    item_chave: 'filtros',
    intervalo_km: 10000,
    intervalo_dias: 180,
    categoria: 'Filtros',
    ativo: true,
    descricao: 'Troca periódica dos filtros de combustível, óleo motor, ar do motor e cabine.'
  },
  {
    id: 'default-plan-freios',
    nome: 'Sistema de Freios (Pastilhas, Lonas e Discos)',
    item_chave: 'freios',
    intervalo_km: 20000,
    intervalo_dias: 365,
    categoria: 'Freios',
    ativo: true,
    descricao: 'Inspeção e substituição de pastilhas, tambores, lonas, discos e fluido de freio.'
  },
  {
    id: 'default-plan-pneus',
    nome: 'Pneus (Rodízio, Alinhamento e Geometria)',
    item_chave: 'pneus',
    intervalo_km: 10000,
    intervalo_dias: 180,
    categoria: 'Pneus',
    ativo: true,
    descricao: 'Rodízio periódico de pneus, balanceamento de rodas e alinhamento de direção.'
  },
  {
    id: 'default-plan-correias',
    nome: 'Correias, Tensores e Transmissão',
    item_chave: 'correias',
    intervalo_km: 40000,
    intervalo_dias: 730,
    categoria: 'Transmissão',
    ativo: true,
    descricao: 'Inspeção e troca das correias dentadas e de acessórios, polias e tensores.'
  },
  {
    id: 'default-plan-revisao',
    nome: 'Revisão Geral Preventiva Periódica',
    item_chave: 'revisao',
    intervalo_km: 30000,
    intervalo_dias: 365,
    categoria: 'Revisão Geral',
    ativo: true,
    descricao: 'Check-up completo de suspensão, elétrica, motor, arrefecimento e segurança.'
  }
];

export function validatePlan(f,vehicle,today=new Date().toLocaleDateString('en-CA')){const e={};if(!f.nome?.trim()||f.nome.trim().length>100)e.nome='Informe o item (até 100 caracteres).';if(!!f.vehicle_id===!!f.categoria_veiculo)e.scope='Selecione veículo ou categoria.';for(const k of ['intervalo_km','intervalo_dias'])if(f[k]!==''&&f[k]!=null&&(!Number.isInteger(Number(f[k]))||Number(f[k])<1||Number(f[k])>(k==='intervalo_dias'?36500:2147483647)))e[k]='Informe um intervalo inteiro positivo.';if(!Number(f.intervalo_km)&&!Number(f.intervalo_dias))e.intervalo_km='Informe intervalo por KM, dias ou ambos.';if(!f.id){if(!/^\d{4}-\d{2}-\d{2}$/.test(f.ultima_execucao_data||'')||f.ultima_execucao_data>today||Number.isNaN(Date.parse(f.ultima_execucao_data+'T12:00:00Z'))||new Date(f.ultima_execucao_data+'T12:00:00Z').toISOString().slice(0,10)!==f.ultima_execucao_data)e.ultima_execucao_data='Informe uma data base válida, até hoje.';if(f.vehicle_id&&(f.ultima_execucao_km===''||!Number.isInteger(Number(f.ultima_execucao_km))||Number(f.ultima_execucao_km)<0||Number(f.ultima_execucao_km)>Number(vehicle?.km_atual??0)))e.ultima_execucao_km='KM base deve estar entre zero e o odômetro atual.';}return e;}

export function preventiveState({km,proximaKm,proximaData,today,dias=7,antecedenciaKm=500}){if(proximaKm!=null&&km>=proximaKm||proximaData&&today>=proximaData)return 'vencida';const next=new Date(today+'T12:00:00Z');next.setUTCDate(next.getUTCDate()+dias);if(proximaKm!=null&&km+antecedenciaKm>=proximaKm||proximaData&&next.toISOString().slice(0,10)>=proximaData)return 'breve';return 'dia';}

export function computeVehiclePreventiveAlerts(vehicle, customPlans = [], settings = {}, openOrders = []) {
  if (!vehicle) return [];
  const today = new Date().toLocaleDateString('en-CA');
  const kmAtual = Math.max(0, Number(vehicle.km_atual || 0));
  const antecedenciaKm = Number(settings?.antecedencia_alerta_km ?? 500);
  const antecedenciaDias = Number(settings?.antecedencia_alerta_dias ?? 7);

  const plans = Array.isArray(customPlans) && customPlans.length ? customPlans : DEFAULT_PREVENTIVE_PLANS;

  return plans.filter(p => p.ativo !== false).map(plan => {
    const intervaloKm = Number(plan.intervalo_km || 10000);
    const intervaloDias = Number(plan.intervalo_dias || 180);

    let ultimaKm;
    let proximaKm;

    if (plan.ultima_execucao_km != null) {
      ultimaKm = Number(plan.ultima_execucao_km);
      proximaKm = ultimaKm + intervaloKm;
    } else {
      const prevMilestone = Math.floor(kmAtual / intervaloKm) * intervaloKm;
      const gracePeriod = Math.max(antecedenciaKm * 3, intervaloKm * 0.25);
      if (prevMilestone > 0 && (kmAtual - prevMilestone) <= gracePeriod) {
        proximaKm = prevMilestone;
        ultimaKm = Math.max(0, prevMilestone - intervaloKm);
      } else {
        ultimaKm = prevMilestone;
        proximaKm = prevMilestone + intervaloKm;
      }
    }

    const cycle = Math.max(1, Math.floor(kmAtual / intervaloKm) + 1);

    const baseDate = plan.ultima_execucao_data || today;
    const nextDateObj = new Date(baseDate + 'T12:00:00Z');
    nextDateObj.setUTCDate(nextDateObj.getUTCDate() + intervaloDias);
    const proximaData = nextDateObj.toISOString().slice(0, 10);

    const estado = preventiveState({
      km: kmAtual,
      proximaKm,
      proximaData,
      today,
      dias: antecedenciaDias,
      antecedenciaKm
    });

    const openOrder = (openOrders || []).find(o => o.vehicle_id === vehicle.id && o.status !== 'encerrada' && o.status !== 'cancelada');

    return {
      id: plan.plan_vehicle_id || `auto-${vehicle.id}-${plan.id || plan.nome.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      plan_id: plan.id,
      vehicle_id: vehicle.id,
      nome: plan.nome,
      placa: vehicle.placa,
      categoria: vehicle.tipo || 'Caminhão',
      km_atual: kmAtual,
      ultima_execucao_km: ultimaKm,
      ultima_execucao_data: baseDate,
      proxima_km: proximaKm,
      proxima_data: proximaData,
      estado,
      cycle,
      order_id: openOrder?.id || null
    };
  });
}

export function generateFleetAlerts(vehicles = [], savedPlans = [], settings = {}, openOrders = []) {
  if (!Array.isArray(vehicles) || !vehicles.length) return [];
  const allAlerts = [];
  for (const v of vehicles) {
    const vehiclePlans = (savedPlans || []).filter(p => p.vehicle_id === v.id || (!p.vehicle_id && (!p.categoria_veiculo || p.categoria_veiculo === 'TODOS' || p.categoria_veiculo?.toUpperCase() === 'TODOS' || p.categoria_veiculo === v.tipo)));
    const alerts = computeVehiclePreventiveAlerts(v, vehiclePlans.length ? vehiclePlans : DEFAULT_PREVENTIVE_PLANS, settings, openOrders);
    allAlerts.push(...alerts);
  }
  return allAlerts.sort((a, b) => {
    const rank = { vencida: 0, breve: 1, dia: 2 };
    return (rank[a.estado] ?? 3) - (rank[b.estado] ?? 3);
  });
}

