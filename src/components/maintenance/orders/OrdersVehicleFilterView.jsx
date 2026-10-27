import React, { useState, useMemo } from 'react';
import { 
  Search, Calendar, Filter, Truck, Download, Printer, Eye, Edit3, 
  RotateCcw, DollarSign, CheckCircle2, Clock, AlertTriangle, ArrowUpDown
} from 'lucide-react';
import { ORDER_STATUS, ORDER_TYPES, PRIORITIES, isLate } from '../../../utils/orderValidation';
import { money, date } from '../PartnerDetail';
import { exportOrdersListExcel } from '../../../utils/orderWorkbook';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function OrdersVehicleFilterView({
  orders = [],
  options = { vehicles: [], partners: [] },
  loading = false,
  error = '',
  companyId,
  canManage = false,
  onSelectOrder,
  onPrintOrder,
  onEditOrder,
  onRefresh
}) {
  // Estados de Filtros
  const [search, setSearch] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [status, setStatus] = useState('');
  const [tipo, setTipo] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [prioridade, setPrioridade] = useState('');
  const [lateOnly, setLateOnly] = useState(false);
  
  // Datas e Mês
  const [selectedMonth, setSelectedMonth] = useState(''); // '1'..'12' or ''
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Ordenação
  const [sortField, setSortField] = useState('data_abertura');
  const [sortAsc, setSortAsc] = useState(false);

  // Paginação
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Mapa de veículos e oficinas
  const vehiclesMap = useMemo(() => {
    const map = new Map();
    (options.vehicles || []).forEach(v => map.set(v.id, v));
    return map;
  }, [options.vehicles]);

  const partnersMap = useMemo(() => {
    const map = new Map();
    (options.partners || []).forEach(p => map.set(p.id, p));
    return map;
  }, [options.partners]);

  // Função para definir datas a partir do Mês/Ano
  function handleSelectMonth(monthVal, yearVal) {
    const m = monthVal !== undefined ? monthVal : selectedMonth;
    const y = yearVal !== undefined ? yearVal : selectedYear;
    setSelectedMonth(m);
    setSelectedYear(y);

    if (!m) {
      // Se limpou o mês, não força datas
      return;
    }

    const monthNum = parseInt(m, 10);
    const yearNum = parseInt(y, 10) || new Date().getFullYear();
    const firstDay = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;
    const lastDayNum = new Date(yearNum, monthNum, 0).getDate();
    const lastDay = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(lastDayNum).padStart(2, '0')}`;

    setStartDate(firstDay);
    setEndDate(lastDay);
    setPage(1);
  }

  // Atalhos rápidos de data
  function handleQuickDateRange(type) {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    if (type === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
      setSelectedMonth(String(today.getMonth() + 1));
      setSelectedYear(String(today.getFullYear()));
    } else if (type === '7days') {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      setStartDate(past.toISOString().slice(0, 10));
      setEndDate(todayStr);
      setSelectedMonth('');
    } else if (type === '30days') {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      setStartDate(past.toISOString().slice(0, 10));
      setEndDate(todayStr);
      setSelectedMonth('');
    } else if (type === 'this_month') {
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      handleSelectMonth(String(currentMonth), String(currentYear));
    } else if (type === 'last_month') {
      let prevMonth = today.getMonth(); // 0 is previous month if current is 1
      let year = today.getFullYear();
      if (prevMonth === 0) {
        prevMonth = 12;
        year -= 1;
      }
      handleSelectMonth(String(prevMonth), String(year));
    } else if (type === 'this_year') {
      const year = today.getFullYear();
      setStartDate(`${year}-01-01`);
      setEndDate(`${year}-12-31`);
      setSelectedMonth('');
      setSelectedYear(String(year));
    } else if (type === 'clear') {
      setStartDate('');
      setEndDate('');
      setSelectedMonth('');
    }
    setPage(1);
  }

  function handleClearAllFilters() {
    setSearch('');
    setVehicleId('');
    setStatus('');
    setTipo('');
    setPartnerId('');
    setPrioridade('');
    setLateOnly(false);
    setSelectedMonth('');
    setSelectedYear(String(new Date().getFullYear()));
    setStartDate('');
    setEndDate('');
    setPage(1);
  }

  // Filtragem dos dados
  const filteredOrders = useMemo(() => {
    return (orders || []).filter(order => {
      // 1. Veículo / Placa
      if (vehicleId && order.vehicle_id !== vehicleId) {
        return false;
      }

      // 2. Status
      if (status && order.status !== status) {
        return false;
      }

      // 3. Tipo
      if (tipo && order.tipo !== tipo && !(Array.isArray(order.tipos) && order.tipos.includes(tipo))) {
        return false;
      }

      // 4. Oficina
      if (partnerId && order.partner_id !== partnerId) {
        return false;
      }

      // 5. Prioridade
      if (prioridade && order.prioridade !== prioridade) {
        return false;
      }

      // 6. Somente atrasadas
      if (lateOnly && !isLate(order)) {
        return false;
      }

      // 7. Intervalo de Datas
      if (startDate) {
        const orderDate = (order.data_abertura || '').slice(0, 10);
        if (orderDate && orderDate < startDate) return false;
      }
      if (endDate) {
        const orderDate = (order.data_abertura || '').slice(0, 10);
        if (orderDate && orderDate > endDate) return false;
      }

      // 8. Busca textual livre (Número, Placa, Descrição)
      if (search) {
        const q = search.toLowerCase().trim();
        const num = (order.numero || '').toLowerCase();
        const desc = (order.descricao_problema || '').toLowerCase();
        const diag = (order.diagnostico || '').toLowerCase();
        const veh = vehiclesMap.get(order.vehicle_id);
        const placa = (veh?.placa || '').toLowerCase();
        const modelo = (veh?.marca_modelo || '').toLowerCase();

        const match = num.includes(q) || desc.includes(q) || diag.includes(q) || placa.includes(q) || modelo.includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [orders, vehicleId, status, tipo, partnerId, prioridade, lateOnly, startDate, endDate, search, vehiclesMap]);

  // Ordenação
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'placa') {
        valA = vehiclesMap.get(a.vehicle_id)?.placa || '';
        valB = vehiclesMap.get(b.vehicle_id)?.placa || '';
      }

      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === 'string') {
        const cmp = valA.localeCompare(String(valB));
        return sortAsc ? cmp : -cmp;
      }
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [filteredOrders, sortField, sortAsc, vehiclesMap]);

  // Paginação
  const paginatedOrders = useMemo(() => {
    const startIdx = (page - 1) * pageSize;
    return sortedOrders.slice(startIdx, startIdx + pageSize);
  }, [sortedOrders, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / pageSize));

  // Métricas do filtro atual
  const stats = useMemo(() => {
    const totalCount = filteredOrders.length;
    let totalValor = 0;
    const placasSet = new Set();
    let prevCount = 0;
    let corrCount = 0;
    let atrasadasCount = 0;
    let encerradasCount = 0;
    let abertasCount = 0;

    filteredOrders.forEach(o => {
      totalValor += Number(o.valor_total || 0);
      if (o.vehicle_id) placasSet.add(o.vehicle_id);
      if (o.tipo === 'preventiva' || (Array.isArray(o.tipos) && o.tipos.includes('preventiva'))) prevCount++;
      else corrCount++;

      if (isLate(o)) atrasadasCount++;
      if (o.status === 'encerrada' || o.status === 'concluido' || o.status === 'veiculo_retirado') encerradasCount++;
      else if (o.status !== 'cancelada') abertasCount++;
    });

    return {
      totalCount,
      totalValor,
      placasDistintas: placasSet.size,
      prevCount,
      corrCount,
      atrasadasCount,
      encerradasCount,
      abertasCount
    };
  }, [filteredOrders]);

  function handleToggleSort(field) {
    if (sortField === field) {
      setSortAsc(v => !v);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  }

  // Exportar Excel
  async function handleExportExcel() {
    const selectedVeh = vehiclesMap.get(vehicleId);
    const filterInfo = {
      placa: selectedVeh?.placa || (vehicleId ? 'Veículo Selecionado' : ''),
      mes: selectedMonth ? `${MONTH_NAMES[parseInt(selectedMonth, 10) - 1]} / ${selectedYear}` : '',
      periodo: (startDate || endDate) ? `${startDate || 'início'} até ${endDate || 'fim'}` : '',
      status: ORDER_STATUS[status] || ''
    };
    await exportOrdersListExcel(sortedOrders, options.vehicles, options.partners, filterInfo);
  }

  return (
    <div className="orders-vehicle-filter-view animate-fade-in" style={{ marginTop: '16px' }}>
      
      {/* 1. PAINEL DE FILTRO AVANÇADO (Placas, Datas, Mês) */}
      <section 
        className="mp-card" 
        style={{ 
          background: 'var(--mp-panel, #ffffff)', 
          border: '1.5px solid var(--mp-border, #cbd5e1)', 
          borderRadius: '12px', 
          padding: '20px', 
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', borderBottom: '1px solid var(--mp-border, #e2e8f0)', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--mp-text, #0f172a)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={18} style={{ color: '#0ea5e9' }} />
              Consulta e Filtro Completo de S.D.O por Veículo
            </h3>
            <p className="mp-muted" style={{ margin: '2px 0 0 0', fontSize: '0.85rem' }}>
              Filtre por placa de veículo, período específico de datas ou selecione o mês desejado.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="mp-button"
              onClick={handleClearAllFilters}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
            >
              <RotateCcw size={14} /> Limpar Todos os Filtros
            </button>
            <button
              type="button"
              className="mp-button"
              onClick={handleExportExcel}
              disabled={!sortedOrders.length}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', background: '#0284c7', color: '#ffffff', borderColor: '#0284c7' }}
            >
              <Download size={14} /> Exportar Excel ({sortedOrders.length})
            </button>
          </div>
        </div>

        {/* Linha 1 de Filtros: Placa, Mês, Ano e Busca */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          {/* SELETOR DE PLACA */}
          <label className="mp-field" style={{ margin: 0 }}>
            <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Truck size={15} style={{ color: '#0284c7' }} /> Placa do Veículo
            </span>
            <select
              aria-label="Placa do Veículo"
              value={vehicleId}
              onChange={e => { setVehicleId(e.target.value); setPage(1); }}
              style={{ fontWeight: vehicleId ? 700 : 'normal' }}
            >
              <option value="">Todas as Placas da Frota</option>
              {(options.vehicles || []).map(v => (
                <option key={v.id} value={v.id}>
                  {v.placa} — {v.marca_modelo || v.tipo || 'Veículo'} {v.km_atual ? `(${Number(v.km_atual).toLocaleString('pt-BR')} km)` : ''}
                </option>
              ))}
            </select>
          </label>

          {/* SELETOR DE MÊS */}
          <label className="mp-field" style={{ margin: 0 }}>
            <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={15} style={{ color: '#10b981' }} /> Mês
            </span>
            <select
              aria-label="Mês"
              value={selectedMonth}
              onChange={e => handleSelectMonth(e.target.value, selectedYear)}
              style={{ fontWeight: selectedMonth ? 700 : 'normal' }}
            >
              <option value="">Todos os Meses</option>
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={String(idx + 1)}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          {/* SELETOR DE ANO */}
          <label className="mp-field" style={{ margin: 0 }}>
            <span style={{ fontWeight: 700 }}>Ano</span>
            <select
              aria-label="Ano"
              value={selectedYear}
              onChange={e => handleSelectMonth(selectedMonth, e.target.value)}
            >
              <option value="2027">2027</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </label>

          {/* BUSCA TEXTUAL LIVRE */}
          <label className="mp-field" style={{ margin: 0 }}>
            <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Search size={15} style={{ color: '#64748b' }} /> Buscar na S.D.O
            </span>
            <input
              type="text"
              placeholder="Número, placa ou defeito…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </label>
        </div>

        {/* Linha 2 de Filtros: Intervalo de Datas e Atalhos Rápidos */}
        <div style={{ background: 'rgba(0,0,0,0.02)', border: '1px dashed var(--mp-border, #cbd5e1)', borderRadius: '8px', padding: '12px 14px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--mp-muted, #475569)', letterSpacing: '0.5px' }}>
              📅 Período de Datas & Atalhos Rápidos:
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button type="button" className="mp-button" style={{ padding: '3px 8px', fontSize: '0.76rem' }} onClick={() => handleQuickDateRange('today')}>Hoje</button>
              <button type="button" className="mp-button" style={{ padding: '3px 8px', fontSize: '0.76rem' }} onClick={() => handleQuickDateRange('7days')}>7 dias</button>
              <button type="button" className="mp-button" style={{ padding: '3px 8px', fontSize: '0.76rem' }} onClick={() => handleQuickDateRange('30days')}>30 dias</button>
              <button type="button" className="mp-button" style={{ padding: '3px 8px', fontSize: '0.76rem', background: 'rgba(16, 185, 129, 0.1)', color: '#047857', borderColor: '#10b981' }} onClick={() => handleQuickDateRange('this_month')}>Este Mês</button>
              <button type="button" className="mp-button" style={{ padding: '3px 8px', fontSize: '0.76rem' }} onClick={() => handleQuickDateRange('last_month')}>Mês Passado</button>
              <button type="button" className="mp-button" style={{ padding: '3px 8px', fontSize: '0.76rem' }} onClick={() => handleQuickDateRange('this_year')}>Este Ano</button>
              {(startDate || endDate) && (
                <button type="button" className="mp-button" style={{ padding: '3px 8px', fontSize: '0.76rem', color: '#ef4444' }} onClick={() => handleQuickDateRange('clear')}>✕ Limpar datas</button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
              <span>Data Inicial (De):</span>
              <input
                type="date"
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setSelectedMonth(''); setPage(1); }}
                style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
              <span>Data Final (Até):</span>
              <input
                type="date"
                min={startDate}
                value={endDate}
                onChange={e => { setEndDate(e.target.value); setSelectedMonth(''); setPage(1); }}
                style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </label>
            {(startDate || endDate) && (
              <span style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 600 }}>
                ✓ Filtrando de {startDate || 'início'} até {endDate || 'hoje'}
              </span>
            )}
          </div>
        </div>

        {/* Linha 3 de Filtros Adicionais: Status, Tipo, Oficina, Prioridade, Atrasada */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
          <label className="mp-field" style={{ margin: 0 }}>
            <span>Status</span>
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
              <option value="">Todos os Status</option>
              {Object.entries(ORDER_STATUS).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </label>

          <label className="mp-field" style={{ margin: 0 }}>
            <span>Tipo de Manutenção</span>
            <select value={tipo} onChange={e => { setTipo(e.target.value); setPage(1); }}>
              <option value="">Todos os Tipos</option>
              {Object.entries(ORDER_TYPES).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </label>

          <label className="mp-field" style={{ margin: 0 }}>
            <span>Oficina Parceira</span>
            <select value={partnerId} onChange={e => { setPartnerId(e.target.value); setPage(1); }}>
              <option value="">Todas as Oficinas</option>
              {(options.partners || []).map(p => (
                <option key={p.id} value={p.id}>{p.nome_fantasia || p.razao_social}</option>
              ))}
            </select>
          </label>

          <label className="mp-field" style={{ margin: 0 }}>
            <span>Prioridade</span>
            <select value={prioridade} onChange={e => { setPrioridade(e.target.value); setPage(1); }}>
              <option value="">Todas</option>
              {Object.entries(PRIORITIES).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </label>

          <div style={{ display: 'flex', alignItems: 'center', height: '38px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={lateOnly}
                onChange={e => { setLateOnly(e.target.checked); setPage(1); }}
                style={{ width: '16px', height: '16px', accentColor: '#ef4444' }}
              />
              <span style={{ color: lateOnly ? '#ef4444' : undefined }}>Somente Atrasadas</span>
            </label>
          </div>
        </div>
      </section>

      {/* 2. CARDS DE KPIS DO FILTRO EM TEMPO REAL */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px', marginBottom: '18px' }}>
        <div className="mp-card" style={{ padding: '14px', borderLeft: '4px solid #0284c7' }}>
          <span className="mp-muted" style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>S.D.O no Filtro</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0284c7', marginTop: '2px' }}>
            {stats.totalCount}
          </div>
          <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
            {stats.placasDistintas} placa(s) atendida(s)
          </span>
        </div>

        <div className="mp-card" style={{ padding: '14px', borderLeft: '4px solid #10b981' }}>
          <span className="mp-muted" style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>Valor Total Filtrado</span>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#047857', marginTop: '2px' }}>
            {money(stats.totalValor)}
          </div>
          <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
            Peças e serviços acumulados
          </span>
        </div>

        <div className="mp-card" style={{ padding: '14px', borderLeft: '4px solid #f59e0b' }}>
          <span className="mp-muted" style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>Em Andamento</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#d97706', marginTop: '2px' }}>
            {stats.abertasCount}
          </div>
          <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
            {stats.atrasadasCount > 0 ? `⚠️ ${stats.atrasadasCount} em atraso` : 'Dentro do prazo'}
          </span>
        </div>

        <div className="mp-card" style={{ padding: '14px', borderLeft: '4px solid #6366f1' }}>
          <span className="mp-muted" style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>Encerradas / Concluídas</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#4338ca', marginTop: '2px' }}>
            {stats.encerradasCount}
          </div>
          <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
            {stats.prevCount} preventivas · {stats.corrCount} corretivas
          </span>
        </div>
      </section>

      {/* 3. TABELA COMPLETA DAS S.D.O FILTRADAS */}
      <section className="mp-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', background: 'var(--mp-panel, #ffffff)', borderBottom: '1px solid var(--mp-border, #e2e8f0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700 }}>
              Listagem de Solicitações ({sortedOrders.length})
            </h4>
            <span className="mp-muted" style={{ fontSize: '0.8rem' }}>
              Exibindo página {page} de {totalPages} · Ordenado por {sortField === 'data_abertura' ? 'Data' : sortField === 'placa' ? 'Placa' : sortField}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="mp-button"
              onClick={handleExportExcel}
              disabled={!sortedOrders.length}
              style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={13} /> Baixar Planilha
            </button>
            {onRefresh && (
              <button
                type="button"
                className="mp-button"
                onClick={onRefresh}
                style={{ fontSize: '0.8rem' }}
              >
                Atualizar
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center' }}>
            <p role="status">Carregando solicitações de orçamento…</p>
          </div>
        ) : error ? (
          <div style={{ padding: '24px', color: '#ef4444' }} role="alert">
            <p>{error}</p>
          </div>
        ) : !sortedOrders.length ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
            <Truck size={36} style={{ color: '#94a3b8', margin: '0 auto 8px auto', display: 'block' }} />
            <h4 style={{ margin: '0 0 4px 0', color: '#334155' }}>Nenhuma S.D.O encontrada para os filtros aplicados</h4>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              Tente selecionar "Todas as Placas", limpar as datas ou selecionar outro mês.
            </p>
            <button
              type="button"
              className="mp-button"
              onClick={handleClearAllFilters}
              style={{ marginTop: '12px' }}
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="mp-table-wrap" style={{ margin: 0, border: 'none' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.03)', borderBottom: '2px solid var(--mp-border, #e2e8f0)' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleToggleSort('numero')}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      S.D.O <ArrowUpDown size={12} />
                    </span>
                  </th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleToggleSort('data_abertura')}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Data Abertura <ArrowUpDown size={12} />
                    </span>
                  </th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleToggleSort('placa')}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Veículo / Placa <ArrowUpDown size={12} />
                    </span>
                  </th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>KM</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Tipo</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Oficina Parceira</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', cursor: 'pointer' }} onClick={() => handleToggleSort('valor_total')}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                      Total (R$) <ArrowUpDown size={12} />
                    </span>
                  </th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map(o => {
                  const v = vehiclesMap.get(o.vehicle_id);
                  const p = partnersMap.get(o.partner_id);
                  const late = isLate(o);
                  const isPrev = o.tipo === 'preventiva' || (Array.isArray(o.tipos) && o.tipos.includes('preventiva'));

                  return (
                    <tr 
                      key={o.id} 
                      style={{ 
                        borderBottom: '1px solid var(--mp-border, #f1f5f9)',
                        background: late ? 'rgba(239, 68, 68, 0.03)' : undefined
                      }}
                    >
                      {/* NÚMERO S.D.O */}
                      <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                        <strong style={{ color: 'var(--mp-accent, #0284c7)', fontFamily: 'monospace', fontSize: '0.92rem' }}>
                          {o.numero}
                        </strong>
                        {late && (
                          <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#dc2626', background: '#fee2e2', padding: '1px 5px', borderRadius: '4px', width: 'fit-content', marginTop: '2px' }}>
                            ATRASADA
                          </span>
                        )}
                        <small className="mp-muted" style={{ display: 'block', fontSize: '0.74rem' }}>
                          {PRIORITIES[o.prioridade]}
                        </small>
                      </td>

                      {/* DATA ABERTURA */}
                      <td style={{ padding: '10px 12px', verticalAlign: 'middle', fontSize: '0.82rem' }}>
                        {o.data_abertura ? new Date(o.data_abertura).toLocaleDateString('pt-BR') : '—'}
                        <small className="mp-muted" style={{ display: 'block', fontSize: '0.72rem' }}>
                          {o.data_abertura ? new Date(o.data_abertura).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </small>
                      </td>

                      {/* VEÍCULO / PLACA COM BADGE */}
                      <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span 
                            style={{ 
                              display: 'inline-block',
                              padding: '2px 8px',
                              background: '#0f172a',
                              border: '1.5px solid #38bdf8',
                              borderRadius: '5px',
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              color: '#38bdf8',
                              fontSize: '0.85rem',
                              letterSpacing: '1px'
                            }}
                          >
                            {v?.placa || o.placa || 'SEM PLACA'}
                          </span>
                        </div>
                        <small className="mp-muted" style={{ display: 'block', fontSize: '0.74rem', marginTop: '2px' }}>
                          {v?.marca_modelo || v?.tipo || 'Veículo da frota'}
                        </small>
                      </td>

                      {/* KM */}
                      <td style={{ padding: '10px 12px', verticalAlign: 'middle', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                        {o.km_abertura != null ? `${Number(o.km_abertura).toLocaleString('pt-BR')} km` : '—'}
                      </td>

                      {/* TIPO */}
                      <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                        <span 
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            background: isPrev ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                            color: isPrev ? '#047857' : '#1d4ed8',
                            border: `1px solid ${isPrev ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`
                          }}
                        >
                          {isPrev ? '⚡ Preventiva' : '🔧 Corretiva'}
                        </span>
                      </td>

                      {/* OFICINA */}
                      <td style={{ padding: '10px 12px', verticalAlign: 'middle', fontSize: '0.82rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--mp-text, #1e293b)' }}>
                          {p?.nome_fantasia || p?.razao_social || 'Oficina a Definir'}
                        </div>
                      </td>

                      {/* STATUS */}
                      <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                        <span className={'mp-badge ' + o.status} style={{ fontSize: '0.75rem' }}>
                          {ORDER_STATUS[o.status] || o.status}
                        </span>
                        {o.previsao_entrega && (
                          <small className="mp-muted" style={{ display: 'block', fontSize: '0.72rem', marginTop: '2px' }}>
                            Prev: {new Date(o.previsao_entrega).toLocaleDateString('pt-BR')}
                          </small>
                        )}
                      </td>

                      {/* VALOR TOTAL */}
                      <td style={{ padding: '10px 12px', verticalAlign: 'middle', textAlign: 'right', fontWeight: 700, fontSize: '0.88rem', color: Number(o.valor_total) > 0 ? '#047857' : '#64748b' }}>
                        {money(o.valor_total)}
                      </td>

                      {/* AÇÕES */}
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          {onSelectOrder && (
                            <button
                              type="button"
                              className="mp-button"
                              onClick={() => onSelectOrder(o.id)}
                              title="Ver detalhes da S.D.O"
                              style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Eye size={13} /> Ver
                            </button>
                          )}

                          {onPrintOrder && (
                            <button
                              type="button"
                              className="mp-button"
                              onClick={() => onPrintOrder(o)}
                              title="Imprimir S.D.O em 1 folha A4 Preto e Branco"
                              style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(5, 150, 105, 0.1)', color: '#047857', borderColor: '#10b981' }}
                            >
                              <Printer size={13} /> A4
                            </button>
                          )}

                          {onEditOrder && canManage && (
                            <button
                              type="button"
                              className="mp-button"
                              onClick={() => onEditOrder(o)}
                              title="Editar dados da S.D.O"
                              style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Edit3 size={13} /> Editar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINAÇÃO */}
        {sortedOrders.length > pageSize && (
          <div className="mp-row mp-between mp-pagination" style={{ padding: '12px 18px', borderTop: '1px solid var(--mp-border, #e2e8f0)' }}>
            <span style={{ fontSize: '0.82rem' }}>
              Mostrando {((page - 1) * pageSize) + 1} a {Math.min(page * pageSize, sortedOrders.length)} de {sortedOrders.length} S.D.O filtradas
            </span>
            <div className="mp-row" style={{ gap: '6px' }}>
              <button disabled={page <= 1} onClick={() => setPage(v => v - 1)}>
                Anterior
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage(v => v + 1)}>
                Próxima
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
