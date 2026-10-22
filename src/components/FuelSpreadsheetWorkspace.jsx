import React, { useState, useMemo } from 'react';
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
  Database
} from 'lucide-react';
import {
  exportFuelRecordsToExcel,
  generateBlankTemplateExcel,
  parseClipboardTable,
  convertRowsToFuelRecords,
  GOOGLE_APPS_SCRIPT_TEMPLATE
} from '../utils/excelFuelIntegration';

export default function FuelSpreadsheetWorkspace({
  records = [],
  onUpdateRecords,
  onOpenImportModal,
  availablePlates = [],
  availableDrivers = []
}) {
  // Estado da Sincronização em Nuvem (Google Sheets / Excel 365)
  const [webhookUrl, setWebhookUrl] = useState(() => {
    return localStorage.getItem('ambipar_sheet_webhook_url') || '';
  });
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
    return localStorage.getItem('ambipar_sheet_auto_sync') === 'true';
  });
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState(null);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);

  // Estado da Grade Interativa (Spreadsheet Grid)
  const [gridData, setGridData] = useState(() => [...records]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [gridSearch, setGridSearch] = useState('');
  const [pasteBoxText, setPasteBoxText] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Sincroniza gridData quando records externos mudam (apenas se não houver edições pendentes)
  React.useEffect(() => {
    if (!hasUnsavedChanges) {
      setGridData([...records]);
    }
  }, [records, hasUnsavedChanges]);

  // Salvar URL do Webhook
  const handleSaveWebhookSettings = (url, autoSync) => {
    setWebhookUrl(url);
    setAutoSyncEnabled(autoSync);
    localStorage.setItem('ambipar_sheet_webhook_url', url);
    localStorage.setItem('ambipar_sheet_auto_sync', autoSync ? 'true' : 'false');
    showNotification('Configurações de sincronização com Google Sheets salvas!');
  };

  const showNotification = (text, type = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Testar conexão com o Webhook do Google Sheets
  const handleTestWebhook = async () => {
    if (!webhookUrl || !webhookUrl.trim().startsWith('http')) {
      alert('Por favor informe uma URL válida de Webhook do Google Apps Script (iniciando com https://).');
      return;
    }

    setIsTestingWebhook(true);
    setWebhookTestResult(null);

    const testPayload = {
      action: 'UPSERT',
      record: {
        id: 'test_cco_' + Date.now(),
        data_abastecimento: new Date().toISOString().split('T')[0],
        hora_abastecimento: '12:00',
        placa: 'TESTE-99',
        modelo_veiculo: 'Caminhão Teste Ambipar CCO',
        motorista: 'Operador Teste Webhook',
        tipo_combustivel: 'Diesel S10',
        litros: 100,
        preco_litro: 6.19,
        valor_total: 619.00,
        hodometro_anterior: 10000,
        hodometro_atual: 10250,
        distancia_percorrida_km: 250,
        km_por_litro: 2.5,
        custo_por_km: 2.47,
        posto_nome: 'Posto Teste Integração',
        cidade: 'Paulínia',
        uf: 'SP',
        nota_fiscal: 'TEST-01',
        forma_pagamento: 'Cartão Frota - Ticket Log'
      }
    };

    try {
      const startTime = Date.now();
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors', // Apps Script web app requer no-cors para chamadas diretas sem preflight
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });
      const duration = Date.now() - startTime;

      setWebhookTestResult({
        success: true,
        message: `Disparo realizado com sucesso (${duration}ms)! Verifique se a linha "TESTE-99" apareceu na sua planilha do Google Sheets.`
      });
    } catch (err) {
      setWebhookTestResult({
        success: false,
        message: 'Falha ao conectar com o Webhook: ' + err.message
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  // Copiar código do script
  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setScriptCopied(true);
    setTimeout(() => setScriptCopied(false), 3000);
  };

  // Manipulação de Célula na Grade Interativa
  const handleCellChange = (index, field, value) => {
    setGridData(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      // Recalcula derivados em tempo real
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

  // Adicionar Linha Vazia na Grade
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

  // Remover Linha da Grade
  const handleRemoveRow = (index) => {
    if (confirm('Tem certeza que deseja remover esta linha da planilha?')) {
      setGridData(prev => prev.filter((_, i) => i !== index));
      setHasUnsavedChanges(true);
    }
  };

  // Salvar Alterações da Grade no Sistema
  const handleSaveGridChanges = () => {
    // Valida se linhas têm placa e litros
    const validRows = gridData.filter(r => r.placa && r.placa.trim() && Number(r.litros) > 0);
    onUpdateRecords(validRows);
    setHasUnsavedChanges(false);
    showNotification(`Planilha salva com sucesso! ${validRows.length} abastecimentos consolidados.`);
  };

  // Processar Colar do Excel (Ctrl+V)
  const handleProcessPastedData = () => {
    if (!pasteBoxText.trim()) return;

    const rawRows = parseClipboardTable(pasteBoxText);
    if (rawRows.length === 0) return;

    // Detecta se a primeira linha é cabeçalho
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
      const data = cols[1] || new Date().toISOString().split('T')[0];
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
          hora_abastecimento: '12:00',
          placa,
          modelo_veiculo: 'Frota CCO',
          motorista,
          tipo_combustivel: 'Diesel S10',
          litros,
          preco_litro: preco > 0 ? preco.toFixed(3) : '6.15',
          valor_total: total > 0 ? total.toFixed(2) : (litros * 6.15).toFixed(2),
          hodometro_anterior: kmAnterior || '',
          hodometro_atual: kmAtual || '',
          distancia_percorrida_km: dist,
          km_por_litro: kmL,
          custo_por_km: cpk,
          posto_nome: posto,
          cidade: 'Paulínia',
          uf: 'SP',
          nota_fiscal: '',
          forma_pagamento: 'Cartão Frota - Ticket Log'
        });
      }
    }

    if (newRows.length > 0) {
      setGridData(prev => [...newRows, ...prev]);
      setHasUnsavedChanges(true);
      setPasteBoxText('');
      setShowPasteBox(false);
      showNotification(`${newRows.length} linhas coladas do Excel com sucesso! Clique em "Salvar Alterações".`);
    } else {
      alert('Nenhuma linha válida reconhecida. Certifique-se de que copiou colunas válidas (Placa, Data, Litros...).');
    }
  };

  // Filtragem da Grade
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
        padding: '1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(6, 182, 212, 0.15) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981'
          }}>
            <FileSpreadsheet size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
                Central de Planilhas & Sincronização Automática
              </h3>
              <span className="fuel-header-tag" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', borderColor: 'rgba(6, 182, 212, 0.4)' }}>
                Zero Retrabalho
              </span>
            </div>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.86rem', color: '#94a3b8', maxWidth: '750px', lineHeight: 1.4 }}>
              Anexe planilhas gigantescas (.xlsx/.csv), edite em grade como no Excel ou conecte sua planilha do <strong>Google Sheets / Excel 365</strong> para que cada lançamento no site atualize sua planilha em tempo real.
            </p>
          </div>
        </div>

        {/* Ações Rápidas no Topo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="fuel-btn fuel-btn-primary"
            onClick={onOpenImportModal}
            id="btn-anexar-planilha-xls"
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
            <span>Baixar Excel Atualizado (.xlsx)</span>
          </button>

          <button
            type="button"
            className="fuel-btn fuel-btn-secondary"
            onClick={generateBlankTemplateExcel}
            title="Baixar planilha modelo padrão da Ambipar"
          >
            <FileSpreadsheet size={15} />
            <span>Modelo Padrão</span>
          </button>
        </div>
      </div>

      {/* 2. Painel de Sincronização em Tempo Real (Google Sheets / Excel 365) */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.65)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: webhookUrl ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              border: `1px solid ${webhookUrl ? '#10b981' : '#f59e0b'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: webhookUrl ? '#10b981' : '#f59e0b'
            }}>
              <Zap size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong style={{ color: '#ffffff', fontSize: '0.98rem' }}>
                  Sincronização Automática em Nuvem (Google Sheets / Excel 365)
                </strong>
                <span style={{
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  background: webhookUrl ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: webhookUrl ? '#34d399' : '#fbbf24',
                  border: `1px solid ${webhookUrl ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`
                }}>
                  {webhookUrl ? '● CONECTADO & ATIVO' : '○ NÃO CONFIGURADO'}
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Preencha no site e a sua planilha do Google Sheets é atualizada automaticamente no mesmo segundo!
              </span>
            </div>
          </div>

          <button
            type="button"
            className="fuel-btn fuel-btn-secondary"
            onClick={() => setShowScriptModal(true)}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
          >
            <HelpCircle size={14} />
            <span>Ver Passo a Passo & Código do Script</span>
          </button>
        </div>

        {/* Inputs de Configuração do Webhook */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto auto',
          gap: '0.75rem',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)',
          padding: '0.85rem 1rem',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div>
            <label style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              URL do Webhook do Google Apps Script (App da Web):
            </label>
            <input
              type="url"
              className="styled-native-input"
              style={{ width: '100%', fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
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
              disabled={isTestingWebhook || !webhookUrl}
              style={{ fontSize: '0.82rem', padding: '0.5rem 0.95rem' }}
            >
              {isTestingWebhook ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Testando...</span>
                </>
              ) : (
                <>
                  <Zap size={14} color="#f59e0b" />
                  <span>Testar Conexão</span>
                </>
              )}
            </button>
          </div>

          <div style={{ alignSelf: 'flex-end' }}>
            <button
              type="button"
              className="fuel-btn fuel-btn-primary"
              onClick={() => handleSaveWebhookSettings(webhookUrl, true)}
              style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
            >
              <Save size={14} />
              <span>Salvar Conexão</span>
            </button>
          </div>
        </div>

        {webhookTestResult && (
          <div style={{
            marginTop: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: webhookTestResult.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
            border: `1px solid ${webhookTestResult.success ? '#10b981' : '#f43f5e'}`,
            color: '#ffffff',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}>
            {webhookTestResult.success ? <CheckCircle2 size={16} color="#10b981" /> : <AlertTriangle size={16} color="#f43f5e" />}
            <span>{webhookTestResult.message}</span>
          </div>
        )}
      </div>

      {/* 3. Área de Colar Direto do Excel (Ctrl+V) */}
      {showPasteBox && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(6, 182, 212, 0.35)',
          borderRadius: '16px',
          padding: '1.25rem',
          marginBottom: '1.5rem'
        }} className="animate-scale-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Copy size={18} color="#06b6d4" />
              <strong style={{ color: '#ffffff', fontSize: '0.92rem' }}>
                Colar Células Diretamente do Excel (Ctrl+C no Excel ➔ Ctrl+V Aqui)
              </strong>
            </div>
            <button
              type="button"
              className="fuel-btn fuel-btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
              onClick={() => setShowPasteBox(false)}
            >
              Fechar
            </button>
          </div>

          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 0.75rem 0' }}>
            Selecione qualquer bloco de linhas na sua planilha do Excel (com colunas como Placa, Data, Litros, Valor, KM...), copie com <strong>Ctrl+C</strong> e cole no campo abaixo com <strong>Ctrl+V</strong>:
          </p>

          <textarea
            className="styled-native-input"
            rows={5}
            style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.78rem', padding: '0.65rem', marginBottom: '0.75rem' }}
            placeholder="Cole aqui os dados copiados do Excel (separados por tabulação)..."
            value={pasteBoxText}
            onChange={(e) => setPasteBoxText(e.target.value)}
          ></textarea>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              className="fuel-btn fuel-btn-secondary"
              onClick={() => setPasteBoxText('')}
              style={{ fontSize: '0.8rem' }}
            >
              Limpar
            </button>
            <button
              type="button"
              className="fuel-btn fuel-btn-primary"
              onClick={handleProcessPastedData}
              disabled={!pasteBoxText.trim()}
              style={{ fontSize: '0.8rem' }}
            >
              <Plus size={14} />
              <span>Processar e Adicionar à Planilha</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Grade de Planilha Interativa ao Vivo (Live Grid) */}
      <div style={{
        background: 'var(--card-bg, #111827)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '1.25rem',
        overflow: 'hidden'
      }}>
        {/* Barra Superior da Grade */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <strong style={{ color: '#ffffff', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Layers size={18} color="#10b981" />
              <span>Modo Grade de Planilha ao Vivo</span>
            </strong>
            <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
              {gridData.length} linha(s) • Edição célula a célula em tempo real
            </span>
            {hasUnsavedChanges && (
              <span style={{
                fontSize: '0.72rem',
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontWeight: 700
              }}>
                ● Alterações Não Salvas
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="styled-native-input"
                style={{ paddingLeft: '32px', width: '180px', fontSize: '0.78rem', height: '32px' }}
                placeholder="Filtrar na planilha..."
                value={gridSearch}
                onChange={(e) => setGridSearch(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="fuel-btn fuel-btn-secondary"
              onClick={() => setShowPasteBox(!showPasteBox)}
              style={{ fontSize: '0.78rem', height: '32px', padding: '0 0.75rem' }}
              title="Copie células do Excel e cole direto aqui"
            >
              <Copy size={13} />
              <span>Colar do Excel (Ctrl+V)</span>
            </button>

            <button
              type="button"
              className="fuel-btn fuel-btn-secondary"
              onClick={handleAddBlankRow}
              style={{ fontSize: '0.78rem', height: '32px', padding: '0 0.75rem' }}
            >
              <Plus size={13} />
              <span>+ Nova Linha</span>
            </button>

            {hasUnsavedChanges && (
              <button
                type="button"
                className="fuel-btn fuel-btn-primary"
                onClick={handleSaveGridChanges}
                style={{ fontSize: '0.78rem', height: '32px', padding: '0 0.85rem' }}
              >
                <Save size={13} />
                <span>Salvar Alterações</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabela Editável Estilo Excel */}
        <div style={{ overflowX: 'auto', maxHeight: '520px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <table className="fuel-records-table spreadsheet-live-grid" style={{ width: '100%', minWidth: '1350px', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                <th style={{ width: '110px' }}>Data</th>
                <th style={{ width: '100px' }}>Placa</th>
                <th style={{ width: '140px' }}>Modelo</th>
                <th style={{ width: '140px' }}>Motorista</th>
                <th style={{ width: '120px' }}>Combustível</th>
                <th style={{ width: '90px' }}>Litros</th>
                <th style={{ width: '90px' }}>Preço/L (R$)</th>
                <th style={{ width: '100px' }}>Total (R$)</th>
                <th style={{ width: '90px' }}>KM Ant.</th>
                <th style={{ width: '90px' }}>KM Atual</th>
                <th style={{ width: '90px' }}>Dist. KM</th>
                <th style={{ width: '90px' }}>KM/L</th>
                <th style={{ width: '90px' }}>CPK</th>
                <th style={{ width: '150px' }}>Posto</th>
                <th style={{ width: '90px' }}>NF</th>
                <th style={{ width: '50px', textAlign: 'center' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {filteredGridData.length === 0 ? (
                <tr>
                  <td colSpan={17} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                    Nenhum registro encontrado na planilha. Clique em "+ Nova Linha" ou "+ Anexar Planilha XLS".
                  </td>
                </tr>
              ) : (
                filteredGridData.map((row, index) => (
                  <tr key={row.id || index}>
                    <td style={{ textAlign: 'center', color: '#64748b', fontSize: '0.72rem' }}>
                      {index + 1}
                    </td>

                    {/* Data */}
                    <td>
                      <input
                        type="date"
                        className="styled-native-input"
                        style={{ width: '100%', fontSize: '0.75rem', padding: '3px 6px', background: 'transparent' }}
                        value={row.data_abastecimento || ''}
                        onChange={(e) => handleCellChange(index, 'data_abastecimento', e.target.value)}
                      />
                    </td>

                    {/* Placa */}
                    <td>
                      <input
                        type="text"
                        className="styled-native-input"
                        style={{ width: '100%', fontSize: '0.75rem', padding: '3px 6px', fontWeight: 700, textTransform: 'uppercase', background: 'transparent' }}
                        value={row.placa || ''}
                        placeholder="ABC1D23"
                        onChange={(e) => handleCellChange(index, 'placa', e.target.value.toUpperCase())}
                      />
                    </td>

                    {/* Modelo */}
                    <td>
                      <input
                        type="text"
                        className="styled-native-input"
                        style={{ width: '100%', fontSize: '0.75rem', padding: '3px 6px', background: 'transparent' }}
                        value={row.modelo_veiculo || ''}
                        placeholder="Volvo FH..."
                        onChange={(e) => handleCellChange(index, 'modelo_veiculo', e.target.value)}
                      />
                    </td>

                    {/* Motorista */}
                    <td>
                      <input
                        type="text"
                        className="styled-native-input"
                        style={{ width: '100%', fontSize: '0.75rem', padding: '3px 6px', background: 'transparent' }}
                        value={row.motorista || ''}
                        placeholder="Condutor..."
                        onChange={(e) => handleCellChange(index, 'motorista', e.target.value)}
                      />
                    </td>

                    {/* Combustível */}
                    <td>
                      <select
                        className="styled-native-select"
                        style={{ width: '100%', fontSize: '0.72rem', padding: '3px 4px', background: 'transparent' }}
                        value={row.tipo_combustivel || 'Diesel S10'}
                        onChange={(e) => handleCellChange(index, 'tipo_combustivel', e.target.value)}
                      >
                        <option value="Diesel S10">Diesel S10</option>
                        <option value="Diesel S500">Diesel S500</option>
                        <option value="Diesel Renovável HVO / R5">Diesel Verde HVO</option>
                        <option value="ARLA 32">ARLA 32</option>
                        <option value="Gasolina Comum / Aditivada">Gasolina</option>
                        <option value="Etanol Hidratado">Etanol</option>
                      </select>
                    </td>

                    {/* Litros */}
                    <td>
                      <input
                        type="number"
                        step="0.1"
                        className="styled-native-input"
                        style={{ width: '100%', fontSize: '0.75rem', padding: '3px 6px', fontWeight: 700, color: '#38bdf8', background: 'transparent' }}
                        value={row.litros || ''}
                        onChange={(e) => handleCellChange(index, 'litros', e.target.value)}
                      />
                    </td>

                    {/* Preço/L */}
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        className="styled-native-input"
                        style={{ width: '100%', fontSize: '0.75rem', padding: '3px 6px', background: 'transparent' }}
                        value={row.preco_litro || ''}
                        onChange={(e) => handleCellChange(index, 'preco_litro', e.target.value)}
                      />
                    </td>

                    {/* Total R$ (Calculado ou editável) */}
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        className="styled-native-input"
                        style={{ width: '100%', fontSize: '0.75rem', padding: '3px 6px', fontWeight: 700, color: '#10b981', background: 'transparent' }}
                        value={row.valor_total || ''}
                        onChange={(e) => handleCellChange(index, 'valor_total', e.target.value)}
                      />
                    </td>

                    {/* KM Anterior */}
                    <td>
                      <input
                        type="number"
                        className="styled-native-input"
                        style={{ width: '100%', fontSize: '0.75rem', padding: '3px 6px', background: 'transparent' }}
                        value={row.hodometro_anterior || ''}
                        onChange={(e) => handleCellChange(index, 'hodometro_anterior', e.target.value)}
                      />
                    </td>

                    {/* KM Atual */}
                    <td>
                      <input
                        type="number"
                        className="styled-native-input"
                        style={{ width: '100%', fontSize: '0.75rem', padding: '3px 6px', background: 'transparent' }}
                        value={row.hodometro_atual || ''}
                        onChange={(e) => handleCellChange(index, 'hodometro_atual', e.target.value)}
                      />
                    </td>

                    {/* Distância KM (Automático) */}
                    <td style={{ textAlign: 'center', color: '#94a3b8' }}>
                      {row.distancia_percorrida_km ? `${row.distancia_percorrida_km} km` : '—'}
                    </td>

                    {/* KM/L (Automático) */}
                    <td style={{ textAlign: 'center' }}>
                      {row.km_por_litro ? (
                        <strong style={{ color: row.km_por_litro >= 2.3 ? '#34d399' : '#f43f5e' }}>
                          {row.km_por_litro}
                        </strong>
                      ) : (
                        <span style={{ color: '#64748b' }}>—</span>
                      )}
                    </td>

                    {/* CPK */}
                    <td style={{ textAlign: 'center', color: '#fbbf24' }}>
                      {row.custo_por_km ? `R$ ${row.custo_por_km}` : '—'}
                    </td>

                    {/* Posto */}
                    <td>
                      <input
                        type="text"
                        className="styled-native-input"
                        style={{ width: '100%', fontSize: '0.75rem', padding: '3px 6px', background: 'transparent' }}
                        value={row.posto_nome || ''}
                        placeholder="Nome do Posto"
                        onChange={(e) => handleCellChange(index, 'posto_nome', e.target.value)}
                      />
                    </td>

                    {/* NF */}
                    <td>
                      <input
                        type="text"
                        className="styled-native-input"
                        style={{ width: '100%', fontSize: '0.75rem', padding: '3px 6px', background: 'transparent' }}
                        value={row.nota_fiscal || ''}
                        placeholder="NF-e"
                        onChange={(e) => handleCellChange(index, 'nota_fiscal', e.target.value)}
                      />
                    </td>

                    {/* Ação */}
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(index)}
                        style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '4px' }}
                        title="Excluir Linha"
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

        {/* Rodapé da Grade */}
        <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
            Dica: você pode alterar qualquer valor direto na célula. O sistema calcula a autonomia, consumo médio (km/l) e CPK na hora!
          </div>

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button
              type="button"
              className="fuel-btn fuel-btn-secondary"
              onClick={handleAddBlankRow}
              style={{ fontSize: '0.78rem' }}
            >
              <Plus size={13} />
              <span>Adicionar Linha</span>
            </button>

            {hasUnsavedChanges && (
              <button
                type="button"
                className="fuel-btn fuel-btn-primary"
                onClick={handleSaveGridChanges}
                style={{ fontSize: '0.78rem' }}
              >
                <Save size={13} />
                <span>Salvar Tudo na Base</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: CÓDIGO E INSTRUÇÕES DO GOOGLE APPS SCRIPT */}
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
                  <li>Apague o código que estiver lá e cole o script abaixo (clique no botão <strong>Copiar Código</strong>).</li>
                  <li>Clique no botão azul <strong>Implantar ➔ Nova Implantação</strong>.</li>
                  <li>Selecione o tipo <strong>App da Web</strong>, configure acesso como <strong>Qualquer pessoa</strong> e clique em <strong>Implantar</strong>.</li>
                  <li>Copie a <strong>URL do app da Web</strong> (termina com <code>/exec</code>) e cole no campo de Webhook nesta tela!</li>
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
                    <span>{scriptCopied ? 'Copiado para Área de Transferência!' : 'Copiar Código'}</span>
                  </button>
                </div>

                <pre style={{
                  background: '#090d16',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  padding: '1rem',
                  fontSize: '0.74rem',
                  color: '#34d399',
                  maxHeight: '260px',
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
                Entendi e Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
