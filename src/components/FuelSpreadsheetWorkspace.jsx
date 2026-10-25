import React, { useState, useMemo, useEffect } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  FileDown,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Link2,
  Copy,
  ExternalLink,
  Plus,
  Trash2,
  Save,
  Search,
  Check,
  Zap,
  Layers,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Database,
  Table,
  Building,
  Truck,
  TrendingUp,
  DollarSign,
  Calendar
} from 'lucide-react';
import {
  exportFuelRecordsToExcel,
  generateBlankTemplateExcel,
  parseClipboardTable,
  convertRowsToFuelRecords,
  GOOGLE_APPS_SCRIPT_TEMPLATE,
  MATRIX_MONTHS
} from '../utils/excelFuelIntegration';
import { listCompanyOperationalRecords } from '../services/companyOperationalRecords';

// Dados padrão baseados exatamente no Relatório Mensal da Ambipar (Imagem 2 do usuário)
const INITIAL_MATRIX_DATA=[];
const VEHICLE_FAMILIES = [
  'CUSTO FROTA GERAL',
  'BAÚ 3-4',
  'BAÚ TOCO',
  'BAÚ VUC',
  'HIDROVÁCUO',
  'POLIGUINDASTE DUPLO',
  'ROLLON'
];

export default function FuelSpreadsheetWorkspace({
  records = [],
  onUpdateRecords,
  onUpdateMatrix,
  onOpenImportModal,
  companyId,
  user,
  initialMatrix,
  availablePlates = [],
  availableDrivers = []
}) {
  // Sub-abas da Central de Planilhas
  // 'matrix' (Matriz Mensal da Foto) | 'grid' (Grade ao vivo) | 'sync' (Google Sheets)
  const [activeSubTab, setActiveSubTab] = useState('matrix');
  const [selectedFleetTab, setSelectedFleetTab] = useState('CUSTO FROTA GERAL');

  // Estado da Matriz de Custos da Frota (Como a foto do usuário)
  const [fleetMatrix, setFleetMatrix] = useState(INITIAL_MATRIX_DATA);
  const [matrixLoading, setMatrixLoading] = useState(true);
  const [matrixError, setMatrixError] = useState('');
  const [matrixSaving, setMatrixSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    let active = true;
    setMatrixLoading(true);
    setMatrixError('');
    if (!companyId) {
      setFleetMatrix([]);
      setHasUnsavedChanges(false);
      setMatrixLoading(false);
      return () => { active = false; };
    }
    listCompanyOperationalRecords(companyId, 'monthly_fleet_costs')
      .then(rows => {
        if (!active) return;
        const current = rows.find(row => row.record_key === '2026');
        setFleetMatrix(Array.isArray(initialMatrix)
          ? initialMatrix
          : Array.isArray(current?.payload?.rows) ? current.payload.rows : []);
        setHasUnsavedChanges(Array.isArray(initialMatrix));
      })
      .catch(error => { if (active) { setFleetMatrix(Array.isArray(initialMatrix) ? initialMatrix : []); setHasUnsavedChanges(Array.isArray(initialMatrix)); setMatrixError(error.message || 'Não foi possível carregar a matriz da empresa.'); } })
      .finally(() => { if (active) setMatrixLoading(false); });
    return () => { active = false; };
  }, [companyId, initialMatrix]);

  // Estado da Sincronização em Nuvem (Google Sheets / Excel 365)
  const [webhookUrl, setWebhookUrl] = useState(() => {
    return localStorage.getItem('ambipar_sheet_webhook_url') || '';
  });
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
    return localStorage.getItem('ambipar_sheet_auto_sync') === 'true';
  });
  const [webhookTestResult, setWebhookTestResult] = useState(null);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);

  // Estado da Grade Interativa (Spreadsheet Grid)
  const [gridData, setGridData] = useState(() => [...(records || [])]);
  const [gridSearch, setGridSearch] = useState('');
  const [pasteBoxText, setPasteBoxText] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  useEffect(() => {
    if (!hasUnsavedChanges) {
      setGridData([...(records || [])]);
    }
  }, [records, hasUnsavedChanges]);

  const showNotification = (text, type = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Alteração de valor na Matriz Mensal
  const handleMatrixCellChange = (rowIndex, monthKey, value) => {
    const num = parseFloat(value) || 0;
    setFleetMatrix(prev => {
      const updated = [...prev];
      updated[rowIndex] = {
        ...updated[rowIndex],
        meses: {
          ...updated[rowIndex].meses,
          [monthKey]: num
        }
      };
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  // Salvar Matriz no LocalStorage
  const handleSaveMatrix = async () => {
    if (!user?.id || !companyId) { showNotification('Selecione uma empresa com sessão ativa antes de salvar.', 'error'); return; }
    if (!fleetMatrix.length) { showNotification('Adicione ao menos um item de custo antes de salvar.', 'error'); return; }
    const cleaned = fleetMatrix.map(row => ({
      ...row,
      unidade: String(row.unidade || '').trim(),
      tipo: String(row.tipo || '').trim(),
      categoria: String(row.categoria || '').trim(),
      meses: Object.fromEntries(MATRIX_MONTHS.map(month => [month.key, Number(row.meses?.[month.key]) || 0])),
    }));
    if (cleaned.some(row => !row.categoria)) { showNotification('Informe a descrição de cada item de custo.', 'error'); return; }
    if (cleaned.some(row => MATRIX_MONTHS.some(month => row.meses[month.key] < 0))) { showNotification('Os valores mensais não podem ser negativos.', 'error'); return; }
    try {
      setMatrixSaving(true);
      await onUpdateMatrix?.(cleaned);
      setHasUnsavedChanges(false);
      showNotification('Matriz salva no banco de dados da empresa.');
    } catch (e) {
      showNotification(e.message || 'Não foi possível salvar a matriz no banco de dados.', 'error');
    } finally {
      setMatrixSaving(false);
    }
  };

  const handleMatrixTextChange = (rowIndex, field, value) => {
    setFleetMatrix(prev => prev.map((row, index) => index === rowIndex ? { ...row, [field]: value } : row));
    setHasUnsavedChanges(true);
  };

  const handleAddMatrixRow = () => {
    setFleetMatrix(prev => [...prev, { unidade: '', tipo: '', categoria: '', meses: Object.fromEntries(MATRIX_MONTHS.map(month => [month.key, 0])) }]);
    setHasUnsavedChanges(true);
  };

  // Totais por mês da Matriz (Linha TOTAL R$)
  const matrixMonthTotals = useMemo(() => {
    const totals = {};
    let grandTotal = 0;
    MATRIX_MONTHS.forEach(m => {
      let sum = 0;
      fleetMatrix.forEach(row => {
        sum += Number(row.meses?.[m.key] || 0);
      });
      totals[m.key] = sum;
      grandTotal += sum;
    });
    return { totals, grandTotal };
  }, [fleetMatrix]);

  // Salvar URL do Webhook
  const handleSaveWebhookSettings = (url, autoSync) => {
    setWebhookUrl(url);
    setAutoSyncEnabled(autoSync);
    localStorage.setItem('ambipar_sheet_webhook_url', url);
    localStorage.setItem('ambipar_sheet_auto_sync', autoSync ? 'true' : 'false');
    showNotification('Configurações de sincronização com Google Sheets salvas!');
  };

  // Valida o formato da URL sem inserir uma linha de teste fictícia na planilha.
  const handleTestWebhook = async () => {
    if (!webhookUrl || !webhookUrl.trim().startsWith('http')) {
      alert('Por favor informe uma URL válida de Webhook do Google Apps Script (iniciando com https://).');
      return;
    }
    try { new URL(webhookUrl); setWebhookTestResult({ success: true, message: 'Endereço válido. Nenhuma linha de teste foi enviada; a entrega só será confirmada ao sincronizar um abastecimento real.' }); }
    catch { setWebhookTestResult({ success: false, message: 'Informe uma URL completa e válida.' }); }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setScriptCopied(true);
    setTimeout(() => setScriptCopied(false), 3000);
  };

  // Grade Interativa
  const handleCellChange = (index, field, value) => {
    setGridData(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      const litros = parseFloat(item.litros) || 0;
      const preco = parseFloat(item.preco_litro) || 0;
      if (field === 'litros' || field === 'preco_litro') {
        if (litros > 0 && preco > 0) {
          item.valor_total = (litros * preco).toFixed(2);
        }
      }

      const atualKm = parseFloat(item.hodometro_atual) || 0;
      const anteriorKm = parseFloat(item.hodometro_anterior) || 0;
      if (field === 'hodometro_atual' || field === 'hodometro_anterior' || field === 'litros') {
        if (atualKm > anteriorKm) {
          item.distancia_percorrida_km = atualKm - anteriorKm;
          if (litros > 0) {
            item.km_por_litro = Number(((atualKm - anteriorKm) / litros).toFixed(2));
          }
          const totalVal = parseFloat(item.valor_total) || 0;
          if (totalVal > 0) {
            item.custo_por_km = Number((totalVal / (atualKm - anteriorKm)).toFixed(2));
          }
        }
      }

      updated[index] = item;
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const handleAddBlankRow = () => {
    const newRow = {
      id: `row_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      data_abastecimento: new Date().toISOString().split('T')[0],
      hora_abastecimento: new Date().toTimeString().slice(0, 5),
      placa: '',
      modelo_veiculo: '',
      motorista: '',
      tipo_combustivel: 'Diesel S10',
      litros: '',
      preco_litro: '',
      valor_total: '',
      hodometro_atual: '',
      hodometro_anterior: '',
      distancia_percorrida_km: 0,
      km_por_litro: null,
      custo_por_km: null,
      posto_nome: '',
      cidade: '',
      uf: 'SP',
      nota_fiscal: '',
      forma_pagamento: 'Cartão Frota - Ticket Log'
    };

    setGridData(prev => [newRow, ...prev]);
    setHasUnsavedChanges(true);
  };

  const handleRemoveRow = (index) => {
    if (confirm('Tem certeza que deseja remover esta linha da planilha?')) {
      setGridData(prev => prev.filter((_, i) => i !== index));
      setHasUnsavedChanges(true);
    }
  };

  const handleSaveGridChanges = async () => {
    const validRows = gridData.filter(r => r.placa && r.placa.trim() && Number(r.litros) > 0);
    try {
      const saved = await onUpdateRecords?.(validRows);
      if (saved === false) throw new Error('A cópia não foi concluída. Confira a mensagem de erro.');
      setHasUnsavedChanges(false);
      showNotification(`${validRows.length} abastecimentos copiados para revisão da empresa no Supabase.`);
    } catch (error) {
      showNotification(error.message || 'Não foi possível copiar os abastecimentos para revisão.', 'error');
    }
  };

  const handleProcessPastedData = () => {
    if (!pasteBoxText.trim()) return;

    const rawRows = parseClipboardTable(pasteBoxText);
    if (rawRows.length === 0) return;

    let startIndex = 0;
    const firstRowStr = rawRows[0].join(' ').toLowerCase();
    if (firstRowStr.includes('placa') || firstRowStr.includes('litro') || firstRowStr.includes('data')) {
      startIndex = 1;
    }

    const newRows = [];
    for (let i = startIndex; i < rawRows.length; i++) {
      const cols = rawRows[i];
      if (cols.length < 2) continue;

      const placa = (cols[0] || '').toUpperCase().trim();
      const data = cols[1] || '';
      const litros = parseFloat(cols[2]?.replace(',', '.')) || 0;
      const preco = parseFloat(cols[3]?.replace(',', '.')) || 0;
      const total = parseFloat(cols[4]?.replace(',', '.')) || (litros * preco);
      const kmAnterior = parseFloat(cols[5]?.replace(',', '.')) || 0;
      const kmAtual = parseFloat(cols[6]?.replace(',', '.')) || 0;
      const motorista = cols[7] || '';
      const posto = cols[8] || '';

      const dist = kmAtual > kmAnterior ? kmAtual - kmAnterior : 0;
      const kmL = dist > 0 && litros > 0 ? Number((dist / litros).toFixed(2)) : null;
      const cpk = dist > 0 && total > 0 ? Number((total / dist).toFixed(2)) : null;

      if (placa && litros > 0) {
        newRows.push({
          id: `paste_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          data_abastecimento: data,
          hora_abastecimento: '',
          placa,
          modelo_veiculo: '',
          motorista,
          tipo_combustivel: '',
          litros,
          preco_litro: preco > 0 ? preco.toFixed(3) : '',
          valor_total: total > 0 ? total.toFixed(2) : '',
          hodometro_anterior: kmAnterior || '',
          hodometro_atual: kmAtual || '',
          distancia_percorrida_km: dist,
          km_por_litro: kmL,
          custo_por_km: cpk,
          posto_nome: posto,
          cidade: '',
          uf: '',
          nota_fiscal: '',
          forma_pagamento: ''
        });
      }
    }

    if (newRows.length > 0) {
      setGridData(prev => [...newRows, ...prev]);
      setHasUnsavedChanges(true);
      setPasteBoxText('');
      setShowPasteBox(false);
      showNotification(`${newRows.length} linhas coladas do Excel com sucesso!`);
    } else {
      alert('Nenhuma linha válida reconhecida.');
    }
  };

  const filteredGridData = useMemo(() => {
    if (!gridSearch) return gridData;
    const q = gridSearch.toLowerCase();
    return gridData.filter(r => 
      r.placa?.toLowerCase().includes(q) ||
      r.motorista?.toLowerCase().includes(q) ||
      r.posto_nome?.toLowerCase().includes(q) ||
      r.nota_fiscal?.toLowerCase().includes(q) ||
      r.data_abastecimento?.includes(q)
    );
  }, [gridData, gridSearch]);

  return (
    <div className="fuel-spreadsheet-workspace animate-fade-in" id="fuel-spreadsheet-workspace">
      {/* Toast de Feedback */}
      {feedbackMsg && (
        <div style={{
          padding: '0.85rem 1.25rem',
          borderRadius: '10px',
          marginBottom: '1.25rem',
          background: feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
          border: `1px solid ${feedbackMsg.type === 'success' ? '#10b981' : '#f43f5e'}`,
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.88rem'
        }}>
          <CheckCircle2 size={18} color={feedbackMsg.type === 'success' ? '#10b981' : '#f43f5e'} />
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* 1. Header da Central de Planilhas */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        borderRadius: '16px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(6, 182, 212, 0.15) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981'
          }}>
            <FileSpreadsheet size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#ffffff' }}>
                Central de Planilhas & Custos da Frota (Matrix 2026)
              </h3>
              <span className="fuel-header-tag" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
                Modelo Oficial Ambipar DCX
              </span>
            </div>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.84rem', color: '#94a3b8', maxWidth: '750px', lineHeight: 1.4 }}>
              Gerencie a <strong>Matriz de Custo Frota Mensal 2026</strong> por conjunto, importe planilhas gigantescas sem travar e sincronize em tempo real sem retrabalho.
            </p>
          </div>
        </div>

        {/* Ações Rápidas no Topo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="fuel-btn fuel-btn-primary"
            onClick={onOpenImportModal}
            id="btn-anexar-planilha-xls-main"
          >
            <UploadCloud size={16} />
            <span>+ Anexar Planilha XLS</span>
          </button>

          <button
            type="button"
            className="fuel-btn fuel-btn-secondary"
            onClick={() => exportFuelRecordsToExcel(records)}
            id="btn-baixar-excel-atualizado"
          >
            <FileDown size={15} />
            <span>Baixar Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* 2. Seletor de Sub-Abas da Central */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.25rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        paddingBottom: '0.5rem',
        flexWrap: 'wrap'
      }}>
        <button
          type="button"
          className={`fuel-mode-tab-btn ${activeSubTab === 'matrix' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('matrix')}
          style={{ fontSize: '0.84rem', padding: '0.45rem 1rem' }}
        >
          <Table size={16} />
          <span>Matriz de Custo Frota Mensal (DCX 2026)</span>
        </button>

        <button
          type="button"
          className={`fuel-mode-tab-btn ${activeSubTab === 'grid' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('grid')}
          style={{ fontSize: '0.84rem', padding: '0.45rem 1rem' }}
        >
          <Layers size={16} />
          <span>Grade de Lançamentos de Tickets ({gridData.length})</span>
        </button>

        <button
          type="button"
          className={`fuel-mode-tab-btn ${activeSubTab === 'sync' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('sync')}
          style={{ fontSize: '0.84rem', padding: '0.45rem 1rem' }}
        >
          <Zap size={16} />
          <span>Sincronização em Nuvem (Google Sheets)</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* SUB-ABA 1: MATRIZ DE CUSTO FROTA MENSAL 2026 (IDÊNTICA À FOTO)        */}
      {/* ===================================================================== */}
      {activeSubTab === 'matrix' && (
        <div className="animate-fade-in">
          {/* Seletor de Conjuntos / Abas de Veículos (Como na foto do Excel) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 700, marginRight: '4px' }}>CONJUNTO / CATEGORIA:</span>
              {VEHICLE_FAMILIES.map(family => (
                <button
                  key={family}
                  type="button"
                  onClick={() => setSelectedFleetTab(family)}
                  style={{
                    fontSize: '0.75rem',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: selectedFleetTab === family ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.08)',
                    background: selectedFleetTab === family ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.03)',
                    color: selectedFleetTab === family ? '#34d399' : '#94a3b8',
                    cursor: 'pointer',
                    fontWeight: selectedFleetTab === family ? 700 : 500
                  }}
                >
                  {family}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="fuel-btn fuel-btn-secondary"
                  onClick={handleAddMatrixRow}
                  disabled={matrixLoading || matrixSaving}
                  style={{ fontSize: '0.78rem' }}
                >
                  <Plus size={14} />
                  <span>Adicionar item</span>
                </button>
              <button
                type="button"
                className="fuel-btn fuel-btn-primary"
                onClick={handleSaveMatrix}
                  disabled={matrixLoading || matrixSaving || !hasUnsavedChanges}
                style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
              >
                <Save size={14} />
                  <span>{matrixSaving ? 'Salvando…' : 'Salvar alterações'}</span>
              </button>
            </div>
          </div>

          {/* Tabela Idêntica ao Relatório do Excel da Foto */}
          <div style={{
            background: 'var(--card-bg, #0d1523)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '14px',
            padding: '1.25rem',
            overflow: 'hidden'
          }}>
            {/* Cabeçalho Visual Ambipar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem 1rem',
              background: '#0a101d',
              borderBottom: '2px solid #10b981',
              borderRadius: '8px 8px 0 0',
              marginBottom: '0.75rem'
            }}>
              <div>
                <strong style={{ fontSize: '1.1rem', color: '#ffffff', letterSpacing: '-0.01em' }}>
                  ambipar® RELATÓRIO DE CUSTO FROTA MENSAL
                </strong>
                <div style={{ fontSize: '0.74rem', color: '#34d399', fontWeight: 700 }}>
                  CUSTOS MENSAIS · 2026 • {selectedFleetTab}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Total Acumulado (Jan - Jul):</span>
                <div style={{ fontSize: '1.15rem', color: '#10b981', fontWeight: 800 }}>
                  R$ {Number(matrixMonthTotals.grandTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Tabela em Grade da Matriz */}
            <div style={{ overflowX: 'auto', maxHeight: '560px' }}>
              <table className="fuel-records-table spreadsheet-live-grid" style={{ width: '100%', minWidth: '1200px', fontSize: '0.76rem' }}>
                <thead>
                  <tr style={{ background: '#74c044', color: '#000000' }}>
                    <th style={{ width: '70px', color: '#000000' }}>UNIDADE</th>
                    <th style={{ width: '120px', color: '#000000' }}>TIPO</th>
                    <th style={{ width: '220px', color: '#000000' }}>CUSTOS COM FROTA</th>
                    {MATRIX_MONTHS.map(m => (
                      <th key={m.key} style={{ textAlign: 'right', color: '#000000', width: '95px' }}>
                        {m.label.toUpperCase()}
                      </th>
                    ))}
                    <th style={{ textAlign: 'right', color: '#000000', width: '110px' }}>TOTAL (R$)</th>
                    <th style={{ color: '#000000', width: '56px' }}>AÇÕES</th>
                  </tr>
                </thead>
                <tbody>
                  {matrixLoading && <tr><td colSpan={MATRIX_MONTHS.length + 5} role="status">Carregando matriz salva da empresa…</td></tr>}
                  {!matrixLoading && matrixError && <tr><td colSpan={MATRIX_MONTHS.length + 5} role="alert">{matrixError}</td></tr>}
                  {!matrixLoading && !matrixError && fleetMatrix.length === 0 && <tr><td colSpan={MATRIX_MONTHS.length + 5}>Nenhum item cadastrado. Importe uma matriz ou adicione um item de custo.</td></tr>}
                  {fleetMatrix.map((row, idx) => {
                    const isFuel = String(row.categoria || '').toLowerCase().includes('combustivel');
                    let rowSum = 0;
                    MATRIX_MONTHS.forEach(m => { rowSum += Number(row.meses?.[m.key] || 0); });

                    return (
                      <tr 
                        key={idx}
                        style={{
                          background: isFuel ? 'rgba(16, 185, 129, 0.12)' : undefined,
                          fontWeight: isFuel ? 700 : 400
                        }}
                      >
                        <td style={{ textAlign: 'center', fontWeight: 600, color: '#94a3b8' }}>
                          <input aria-label={`Unidade do item ${idx + 1}`} value={row.unidade || ''} onChange={e => handleMatrixTextChange(idx, 'unidade', e.target.value)} />
                        </td>
                        <td style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                          <input aria-label={`Tipo do item ${idx + 1}`} value={row.tipo || ''} onChange={e => handleMatrixTextChange(idx, 'tipo', e.target.value)} />
                        </td>
                        <td>
                          <input aria-label={`Descrição do custo ${idx + 1}`} required value={row.categoria || ''} onChange={e => handleMatrixTextChange(idx, 'categoria', e.target.value)} />
                        </td>

                        {/* Colunas dos 12 Meses */}
                        {MATRIX_MONTHS.map(m => {
                          const val = row.meses?.[m.key] || 0;
                          return (
                            <td key={m.key} style={{ padding: '2px 4px', textAlign: 'right' }}>
                              <input
                                type="number"
                                step="0.01"
                                className="styled-native-input"
                                style={{
                                  width: '100%',
                                  textAlign: 'right',
                                  fontSize: '0.74rem',
                                  padding: '2px 4px',
                                  background: 'transparent',
                                  color: val > 0 ? (isFuel ? '#34d399' : '#ffffff') : '#64748b'
                                }}
                                value={val === 0 ? '' : val}
                                placeholder="0,00"
                                onChange={(e) => handleMatrixCellChange(idx, m.key, e.target.value)}
                              />
                            </td>
                          );
                        })}

                        {/* Total Anual da Linha */}
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#10b981' }}>
                          R$ {Number(rowSum).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td><button type="button" aria-label={`Remover item ${idx + 1}`} onClick={() => { setFleetMatrix(rows => rows.filter((_, rowIndex) => rowIndex !== idx)); setHasUnsavedChanges(true); }}><Trash2 size={14} /></button></td>
                      </tr>
                    );
                  })}

                  {/* Linha 20 do Excel: TOTAL (R$) */}
                  <tr style={{ background: 'rgba(116, 192, 68, 0.25)', fontWeight: 800, borderTop: '2px solid #74c044' }}>
                    <td style={{ textAlign: 'center', color: '#ffffff' }}>—</td>
                    <td style={{ color: '#ffffff' }}>—</td>
                    <td style={{ color: '#ffffff', fontSize: '0.82rem' }}>TOTAL (R$)</td>
                    {MATRIX_MONTHS.map(m => (
                      <td key={m.key} style={{ textAlign: 'right', color: '#ffffff', fontSize: '0.78rem' }}>
                        R$ {Number(matrixMonthTotals.totals[m.key] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    ))}
                    <td style={{ textAlign: 'right', color: '#10b981', fontSize: '0.85rem' }}>
                      R$ {Number(matrixMonthTotals.grandTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.76rem', color: '#94a3b8' }}>
              <div>
                * Dica: Você pode digitar valores em qualquer mês. O total anual e o consolidado são atualizados instantaneamente.
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="fuel-btn fuel-btn-primary"
                  onClick={handleSaveMatrix}
                  disabled={matrixLoading || matrixSaving || !hasUnsavedChanges}
                  style={{ fontSize: '0.78rem' }}
                >
                  <Save size={13} />
                  <span>{matrixSaving ? 'Salvando…' : 'Salvar Matriz'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-ABA 2: GRADE DETALHADA DE ABASTECIMENTOS POR TICKET               */}
      {/* ===================================================================== */}
      {activeSubTab === 'grid' && (
        <div className="animate-fade-in">
          {/* Área de Colar do Excel */}
          {showPasteBox && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(6, 182, 212, 0.35)',
              borderRadius: '14px',
              padding: '1.25rem',
              marginBottom: '1rem'
            }} className="animate-scale-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <strong style={{ color: '#ffffff', fontSize: '0.92rem' }}>
                  Colar Células Diretamente do Excel (Ctrl+C no Excel ➔ Ctrl+V Aqui)
                </strong>
                <button
                  type="button"
                  className="fuel-btn fuel-btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                  onClick={() => setShowPasteBox(false)}
                >
                  Fechar
                </button>
              </div>

              <textarea
                className="styled-native-input"
                rows={4}
                style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.78rem', padding: '0.65rem', marginBottom: '0.75rem' }}
                placeholder="Cole aqui os dados copiados do Excel..."
                value={pasteBoxText}
                onChange={(e) => setPasteBoxText(e.target.value)}
              ></textarea>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="fuel-btn fuel-btn-primary"
                  onClick={handleProcessPastedData}
                  disabled={!pasteBoxText.trim()}
                  style={{ fontSize: '0.8rem' }}
                >
                  <Plus size={14} />
                  <span>Processar e Adicionar</span>
                </button>
              </div>
            </div>
          )}

          {/* Grade de Tickets */}
          <div style={{
            background: 'var(--card-bg, #0d1523)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <strong style={{ color: '#ffffff', fontSize: '0.95rem' }}>
                  Lançamentos Individuais de Combustível ({gridData.length})
                </strong>
                {hasUnsavedChanges && (
                  <span style={{ fontSize: '0.72rem', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    ● Alterações Pendentes
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  className="styled-native-input"
                  style={{ width: '180px', fontSize: '0.78rem', height: '32px' }}
                  placeholder="Filtrar por placa, motorista..."
                  value={gridSearch}
                  onChange={(e) => setGridSearch(e.target.value)}
                />

                <button
                  type="button"
                  className="fuel-btn fuel-btn-secondary"
                  onClick={() => setShowPasteBox(!showPasteBox)}
                  style={{ fontSize: '0.78rem', height: '32px' }}
                >
                  <Copy size={13} />
                  <span>Colar do Excel</span>
                </button>

                <button
                  type="button"
                  className="fuel-btn fuel-btn-secondary"
                  onClick={handleAddBlankRow}
                  style={{ fontSize: '0.78rem', height: '32px' }}
                >
                  <Plus size={13} />
                  <span>+ Nova Linha</span>
                </button>

                {hasUnsavedChanges && (
                  <button
                    type="button"
                    className="fuel-btn fuel-btn-primary"
                    onClick={handleSaveGridChanges}
                    style={{ fontSize: '0.78rem', height: '32px' }}
                  >
                    <Save size={13} />
                    <span>Salvar Tudo</span>
                  </button>
                )}
              </div>
            </div>

            <div style={{ overflowX: 'auto', maxHeight: '500px' }}>
              <table className="fuel-records-table spreadsheet-live-grid" style={{ width: '100%', minWidth: '1300px', fontSize: '0.76rem' }}>
                <thead>
                  <tr style={{ background: '#0f172a' }}>
                    <th style={{ width: '35px', textAlign: 'center' }}>#</th>
                    <th style={{ width: '110px' }}>Data</th>
                    <th style={{ width: '95px' }}>Placa</th>
                    <th style={{ width: '130px' }}>Modelo</th>
                    <th style={{ width: '130px' }}>Motorista</th>
                    <th style={{ width: '110px' }}>Combustível</th>
                    <th style={{ width: '85px' }}>Litros</th>
                    <th style={{ width: '85px' }}>Preço/L</th>
                    <th style={{ width: '95px' }}>Total R$</th>
                    <th style={{ width: '85px' }}>KM Ant.</th>
                    <th style={{ width: '85px' }}>KM Atual</th>
                    <th style={{ width: '80px' }}>Dist. KM</th>
                    <th style={{ width: '80px' }}>KM/L</th>
                    <th style={{ width: '80px' }}>CPK</th>
                    <th style={{ width: '140px' }}>Posto</th>
                    <th style={{ width: '85px' }}>NF</th>
                    <th style={{ width: '40px', textAlign: 'center' }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGridData.length === 0 ? (
                    <tr>
                      <td colSpan={17} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        Nenhum registro encontrado. Use "+ Nova Linha" ou "+ Anexar Planilha XLS".
                      </td>
                    </tr>
                  ) : (
                    filteredGridData.map((row, index) => (
                      <tr key={row.id || index}>
                        <td style={{ textAlign: 'center', color: '#64748b' }}>{index + 1}</td>
                        <td>
                          <input
                            type="date"
                            className="styled-native-input"
                            style={{ width: '100%', fontSize: '0.74rem', padding: '2px 4px', background: 'transparent' }}
                            value={row.data_abastecimento || ''}
                            onChange={(e) => handleCellChange(index, 'data_abastecimento', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="styled-native-input"
                            style={{ width: '100%', fontSize: '0.74rem', padding: '2px 4px', fontWeight: 700, textTransform: 'uppercase', background: 'transparent' }}
                            value={row.placa || ''}
                            placeholder="ABC1D23"
                            onChange={(e) => handleCellChange(index, 'placa', e.target.value.toUpperCase())}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="styled-native-input"
                            style={{ width: '100%', fontSize: '0.74rem', padding: '2px 4px', background: 'transparent' }}
                            value={row.modelo_veiculo || ''}
                            placeholder="Caminhão..."
                            onChange={(e) => handleCellChange(index, 'modelo_veiculo', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="styled-native-input"
                            style={{ width: '100%', fontSize: '0.74rem', padding: '2px 4px', background: 'transparent' }}
                            value={row.motorista || ''}
                            placeholder="Motorista..."
                            onChange={(e) => handleCellChange(index, 'motorista', e.target.value)}
                          />
                        </td>
                        <td>
                          <select
                            className="styled-native-select"
                            style={{ width: '100%', fontSize: '0.72rem', padding: '2px', background: 'transparent' }}
                            value={row.tipo_combustivel || 'Diesel S10'}
                            onChange={(e) => handleCellChange(index, 'tipo_combustivel', e.target.value)}
                          >
                            <option value="Diesel S10">Diesel S10</option>
                            <option value="Diesel S500">Diesel S500</option>
                            <option value="Diesel Renovável HVO / R5">Diesel HVO</option>
                            <option value="ARLA 32">ARLA 32</option>
                            <option value="Gasolina Comum / Aditivada">Gasolina</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.1"
                            className="styled-native-input"
                            style={{ width: '100%', fontSize: '0.74rem', padding: '2px 4px', color: '#38bdf8', fontWeight: 700, background: 'transparent' }}
                            value={row.litros || ''}
                            onChange={(e) => handleCellChange(index, 'litros', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            className="styled-native-input"
                            style={{ width: '100%', fontSize: '0.74rem', padding: '2px 4px', background: 'transparent' }}
                            value={row.preco_litro || ''}
                            onChange={(e) => handleCellChange(index, 'preco_litro', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            className="styled-native-input"
                            style={{ width: '100%', fontSize: '0.74rem', padding: '2px 4px', color: '#10b981', fontWeight: 700, background: 'transparent' }}
                            value={row.valor_total || ''}
                            onChange={(e) => handleCellChange(index, 'valor_total', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="styled-native-input"
                            style={{ width: '100%', fontSize: '0.74rem', padding: '2px 4px', background: 'transparent' }}
                            value={row.hodometro_anterior || ''}
                            onChange={(e) => handleCellChange(index, 'hodometro_anterior', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="styled-native-input"
                            style={{ width: '100%', fontSize: '0.74rem', padding: '2px 4px', background: 'transparent' }}
                            value={row.hodometro_atual || ''}
                            onChange={(e) => handleCellChange(index, 'hodometro_atual', e.target.value)}
                          />
                        </td>
                        <td style={{ textAlign: 'center', color: '#94a3b8' }}>
                          {row.distancia_percorrida_km ? `${row.distancia_percorrida_km} km` : '—'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {row.km_por_litro ? (
                            <strong style={{ color: row.km_por_litro >= 2.3 ? '#34d399' : '#f43f5e' }}>
                              {row.km_por_litro}
                            </strong>
                          ) : '—'}
                        </td>
                        <td style={{ textAlign: 'center', color: '#fbbf24' }}>
                          {row.custo_por_km ? `R$ ${row.custo_por_km}` : '—'}
                        </td>
                        <td>
                          <input
                            type="text"
                            className="styled-native-input"
                            style={{ width: '100%', fontSize: '0.74rem', padding: '2px 4px', background: 'transparent' }}
                            value={row.posto_nome || ''}
                            placeholder="Posto..."
                            onChange={(e) => handleCellChange(index, 'posto_nome', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="styled-native-input"
                            style={{ width: '100%', fontSize: '0.74rem', padding: '2px 4px', background: 'transparent' }}
                            value={row.nota_fiscal || ''}
                            placeholder="NF-e"
                            onChange={(e) => handleCellChange(index, 'nota_fiscal', e.target.value)}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(index)}
                            style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer' }}
                            title="Excluir"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-ABA 3: SINCRONIZAÇÃO EM NUVEM (GOOGLE SHEETS)                     */}
      {/* ===================================================================== */}
      {activeSubTab === 'sync' && (
        <div className="animate-fade-in" style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: webhookUrl ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                border: `1px solid ${webhookUrl ? '#10b981' : '#f59e0b'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: webhookUrl ? '#10b981' : '#f59e0b'
              }}>
                <Zap size={22} />
              </div>
              <div>
                <strong style={{ color: '#ffffff', fontSize: '1.05rem', display: 'block' }}>
                  Conector em Tempo Real: Sistema Ambipar ➔ Google Sheets / Excel 365
                </strong>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                  Preencha no site e veja cair na sua planilha automaticamente sem duplicar digitação.
                </span>
              </div>
            </div>

            <button
              type="button"
              className="fuel-btn fuel-btn-secondary"
              onClick={() => setShowScriptModal(true)}
              style={{ fontSize: '0.82rem' }}
            >
              <HelpCircle size={15} />
              <span>Ver Passo a Passo & Código do Script</span>
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto auto',
            gap: '0.75rem',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div>
              <label style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                URL do Webhook do Google Apps Script (App da Web terminando em /exec):
              </label>
              <input
                type="url"
                className="styled-native-input"
                style={{ width: '100%', fontSize: '0.82rem', padding: '0.5rem 0.75rem' }}
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
            </div>

            <div style={{ alignSelf: 'flex-end' }}>
              <button
                type="button"
                className="fuel-btn fuel-btn-secondary"
                onClick={handleTestWebhook}
                disabled={!webhookUrl}
                style={{ fontSize: '0.82rem', padding: '0.55rem 0.95rem' }}
              >
                Validar URL
              </button>
            </div>

            <div style={{ alignSelf: 'flex-end' }}>
              <button
                type="button"
                className="fuel-btn fuel-btn-primary"
                onClick={() => handleSaveWebhookSettings(webhookUrl, true)}
                style={{ fontSize: '0.82rem', padding: '0.55rem 1rem' }}
              >
                <Save size={14} />
                <span>Salvar Conexão</span>
              </button>
            </div>
          </div>

          {webhookTestResult && (
            <div style={{
              marginTop: '1rem',
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              background: webhookTestResult.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
              border: `1px solid ${webhookTestResult.success ? '#10b981' : '#f43f5e'}`,
              color: '#ffffff',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem'
            }}>
              {webhookTestResult.success ? <CheckCircle2 size={16} color="#10b981" /> : <AlertTriangle size={16} color="#f43f5e" />}
              <span>{webhookTestResult.message}</span>
            </div>
          )}
        </div>
      )}

      {/* Modal do Script */}
      {showScriptModal && (
        <div className="fuel-modal-backdrop animate-fade-in" style={{ zIndex: 10000 }}>
          <div className="fuel-modal-dialog fuel-modal-wide animate-scale-in" style={{ maxWidth: '850px' }}>
            <div className="fuel-modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Zap size={22} color="#10b981" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#ffffff' }}>
                  Como Conectar o Sistema com o Google Sheets em 3 Minutos
                </h3>
              </div>
              <button type="button" className="fuel-modal-close-btn" onClick={() => setShowScriptModal(false)}>
                &times;
              </button>
            </div>

            <div style={{ padding: '1.25rem 0' }}>
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '1.25rem',
                fontSize: '0.84rem',
                color: '#cbd5e1',
                lineHeight: 1.5
              }}>
                <strong style={{ color: '#ffffff', display: 'block', marginBottom: '0.35rem' }}>
                  Passo a Passo Rápido:
                </strong>
                <ol style={{ margin: 0, paddingLeft: '1.25rem' }}>
                  <li>Abra sua planilha no Google Sheets (ou crie uma nova em branco).</li>
                  <li>No menu superior, clique em <strong>Extensões ➔ Apps Script</strong>.</li>
                  <li>Apague o código existente e cole o script abaixo (clique no botão <strong>Copiar Código</strong>).</li>
                  <li>Clique em <strong>Implantar ➔ Nova Implantação ➔ App da Web</strong> (Acesso: <em>Qualquer pessoa</em>).</li>
                  <li>Copie a <strong>URL do app da Web</strong> (termina com <code>/exec</code>) e cole no sistema!</li>
                </ol>
              </div>

              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>
                    Código Pronto do Google Apps Script:
                  </span>
                  <button
                    type="button"
                    className="fuel-btn fuel-btn-primary"
                    onClick={handleCopyScript}
                    style={{ fontSize: '0.76rem', padding: '0.3rem 0.75rem' }}
                  >
                    {scriptCopied ? <Check size={13} /> : <Copy size={13} />}
                    <span>{scriptCopied ? 'Copiado!' : 'Copiar Código'}</span>
                  </button>
                </div>

                <pre style={{
                  background: '#090d16',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  padding: '1rem',
                  fontSize: '0.74rem',
                  color: '#34d399',
                  maxHeight: '240px',
                  overflowY: 'auto',
                  fontFamily: 'Consolas, monospace',
                  whiteSpace: 'pre-wrap'
                }}>
                  {GOOGLE_APPS_SCRIPT_TEMPLATE}
                </pre>
              </div>
            </div>

            <div className="fuel-modal-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.85rem' }}>
              <button
                type="button"
                className="fuel-btn fuel-btn-secondary"
                onClick={() => setShowScriptModal(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
