import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  FileCheck,
  RefreshCw,
  X,
  Layers,
  HelpCircle,
  FileDown,
  Info
} from 'lucide-react';
import {
  FIELD_DEFINITIONS,
  readSpreadsheetFile,
  convertRowsToFuelRecords,
  generateBlankTemplateExcel
} from '../utils/excelFuelIntegration';

export default function FuelExcelImportModal({ isOpen, onClose, existingRecords = [], onImportComplete }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sheetData, setSheetData] = useState(null);
  const [mapping, setMapping] = useState({});
  const [importMode, setImportMode] = useState('append'); // 'append' | 'replace'
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPct, setProgressPct] = useState(0);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    await processSelectedFile(selected);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    await processSelectedFile(droppedFile);
  };

  const processSelectedFile = async (fileObj) => {
    try {
      setLoading(true);
      setError(null);
      setFile(fileObj);

      const parsed = await readSpreadsheetFile(fileObj);
      setSheetData(parsed);
      setMapping(parsed.detectedMapping);
    } catch (err) {
      setError(err.message || 'Erro ao ler arquivo da planilha.');
      setFile(null);
      setSheetData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (fieldKey, selectedHeader) => {
    setMapping(prev => ({
      ...prev,
      [fieldKey]: selectedHeader
    }));
  };

  // Pré-visualização dinâmica dos 5 primeiros registros gerados
  const previewData = useMemo(() => {
    if (!sheetData || !sheetData.parsedRows) return [];
    const sampleRows = sheetData.parsedRows.slice(0, 5);
    const { records } = convertRowsToFuelRecords(sampleRows, mapping, [], { skipDuplicates: false });
    return records;
  }, [sheetData, mapping]);

  // Contagem de campos obrigatórios mapeados
  const requiredFieldsCheck = useMemo(() => {
    const required = FIELD_DEFINITIONS.filter(f => f.required);
    const missing = required.filter(f => !mapping[f.key]);
    return {
      isValid: missing.length === 0,
      missing
    };
  }, [mapping]);

  // Execução da Importação
  const handleExecuteImport = () => {
    if (!sheetData || !sheetData.parsedRows) return;
    if (!requiredFieldsCheck.isValid) {
      alert(`Por favor mapeie as colunas obrigatórias: ${requiredFieldsCheck.missing.map(m => m.label).join(', ')}`);
      return;
    }

    setIsProcessing(true);
    setProgressPct(10);

    setTimeout(() => {
      setProgressPct(50);
      try {
        const { records, skippedDuplicates, invalidRows, totalImported } = convertRowsToFuelRecords(
          sheetData.parsedRows,
          mapping,
          importMode === 'replace' ? [] : existingRecords,
          { skipDuplicates }
        );

        setProgressPct(100);

        setTimeout(() => {
          onImportComplete({
            records,
            mode: importMode,
            stats: {
              totalImported,
              skippedDuplicates,
              invalidRows,
              totalInFile: sheetData.totalRows
            }
          });
          setIsProcessing(false);
          onClose();
        }, 400);

      } catch (err) {
        setIsProcessing(false);
        setError('Ocorreu um erro ao processar os dados da planilha: ' + err.message);
      }
    }, 200);
  };

  return (
    <div className="fuel-modal-backdrop animate-fade-in" style={{ zIndex: 9999 }}>
      <div 
        className="fuel-modal-dialog fuel-modal-wide animate-scale-in" 
        style={{ maxWidth: '980px', maxHeight: '92vh', overflowY: 'auto' }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {/* Header do Modal */}
        <div className="fuel-modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981'
            }}>
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#ffffff', fontWeight: 800 }}>
                Importador Inteligente de Planilhas XLS / XLSX / CSV
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                Alimente o sistema com planilhas gigantescas de abastecimento com detecção automática de colunas e cálculos de km/l
              </p>
            </div>
          </div>

          <button 
            type="button" 
            className="fuel-modal-close-btn"
            onClick={onClose}
            disabled={isProcessing}
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div style={{ padding: '1.5rem 0' }}>
          {/* Se nenhum arquivo foi selecionado ou se quer trocar */}
          {!sheetData ? (
            <div>
              <div 
                className="fuel-dropzone-box"
                style={{
                  border: '2px dashed rgba(16, 185, 129, 0.4)',
                  borderRadius: '16px',
                  padding: '3rem 2rem',
                  textAlign: 'center',
                  background: 'rgba(15, 23, 42, 0.6)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onClick={() => document.getElementById('fuel-file-input').click()}
              >
                <input 
                  id="fuel-file-input"
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  style={{ display: 'none' }} 
                  onChange={handleFileChange}
                />
                
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  margin: '0 auto 1.25rem auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981'
                }}>
                  {loading ? <RefreshCw className="animate-spin" size={32} /> : <UploadCloud size={32} />}
                </div>

                <h4 style={{ margin: '0 0 0.5rem 0', color: '#ffffff', fontSize: '1.1rem', fontWeight: 700 }}>
                  {loading ? 'Lendo e Analisando Planilha...' : 'Clique ou Arraste sua Planilha Aqui'}
                </h4>
                <p style={{ margin: '0 auto', maxWidth: '480px', color: '#94a3b8', fontSize: '0.86rem', lineHeight: 1.5 }}>
                  Compatível com <strong>.XLSX, .XLS e .CSV</strong>. Suporta planilhas gigantescas com milhares de abastecimentos sem travar o navegador.
                </p>

                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', color: '#cbd5e1' }}>
                    Auto-reconhece: Placa, Data, Litros, Valor, KM, Motorista, Posto
                  </span>
                  <span style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', color: '#cbd5e1' }}>
                    Calcula automaticamente KM/L e Custo por KM
                  </span>
                </div>
              </div>

              {/* Botão de Download do Modelo Padrão */}
              <div style={{
                marginTop: '1.25rem',
                padding: '1rem 1.25rem',
                borderRadius: '12px',
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FileDown size={22} color="#06b6d4" />
                  <div>
                    <strong style={{ color: '#ffffff', fontSize: '0.88rem', display: 'block' }}>
                      Não tem certeza do formato da planilha?
                    </strong>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                      Baixe o modelo oficial da Ambipar em Excel pré-formatado com exemplos e regras.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="fuel-btn fuel-btn-secondary"
                  onClick={generateBlankTemplateExcel}
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}
                >
                  <FileDown size={14} />
                  <span>Baixar Modelo Padrão (.xlsx)</span>
                </button>
              </div>

              {error && (
                <div style={{
                  marginTop: '1.25rem',
                  padding: '1rem',
                  borderRadius: '10px',
                  background: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid #f43f5e',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.86rem'
                }}>
                  <AlertTriangle size={20} color="#f43f5e" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          ) : (
            /* SE O ARQUIVO FOI CARREGADO COM SUCESSO: REVISÃO & MAPEAMENTO */
            <div className="animate-fade-in">
              {/* Card de Resumo do Arquivo */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.25rem',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FileCheck size={26} color="#10b981" />
                  <div>
                    <strong style={{ color: '#ffffff', fontSize: '0.95rem', display: 'block' }}>
                      {sheetData.fileName}
                    </strong>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                      Aba: <strong>{sheetData.activeSheet}</strong> • <strong>{sheetData.totalRows.toLocaleString('pt-BR')}</strong> linhas de abastecimento detectadas
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="fuel-btn fuel-btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                  onClick={() => {
                    setSheetData(null);
                    setFile(null);
                    setMapping({});
                  }}
                >
                  <RefreshCw size={13} />
                  <span>Trocar Arquivo</span>
                </button>
              </div>

              {/* Seção 1: Mapeamento de Colunas Inteligente */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Layers size={18} color="#06b6d4" />
                    <h4 style={{ margin: 0, color: '#ffffff', fontSize: '0.95rem', fontWeight: 700 }}>
                      Mapeamento das Colunas da sua Planilha
                    </h4>
                  </div>
                  <span style={{ fontSize: '0.76rem', color: requiredFieldsCheck.isValid ? '#34d399' : '#f59e0b', fontWeight: 600 }}>
                    {requiredFieldsCheck.isValid 
                      ? '✓ Colunas obrigatórias mapeadas com sucesso' 
                      : `⚠ Faltam colunas obrigatórias: ${requiredFieldsCheck.missing.map(m => m.label).join(', ')}`}
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '0.75rem',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  padding: '0.75rem',
                  background: 'rgba(15, 23, 42, 0.4)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}>
                  {FIELD_DEFINITIONS.map(field => {
                    const isMapped = !!mapping[field.key];
                    return (
                      <div 
                        key={field.key}
                        style={{
                          padding: '0.65rem 0.85rem',
                          background: isMapped ? 'rgba(255,255,255,0.03)' : 'rgba(244, 63, 94, 0.05)',
                          borderRadius: '8px',
                          border: `1px solid ${isMapped ? 'rgba(255,255,255,0.08)' : 'rgba(244, 63, 94, 0.2)'}`
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: field.required ? '#ffffff' : '#94a3b8' }}>
                            {field.label} {field.required && <strong style={{ color: '#f43f5e' }}>*</strong>}
                          </span>
                          {isMapped && <span style={{ color: '#10b981', fontSize: '0.7rem' }}>✓ Reconhecido</span>}
                        </div>

                        <select
                          className="styled-native-select"
                          style={{
                            width: '100%',
                            fontSize: '0.76rem',
                            padding: '0.35rem 0.5rem',
                            background: '#0f172a',
                            border: `1px solid ${isMapped ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255,255,255,0.15)'}`,
                            color: isMapped ? '#ffffff' : '#64748b'
                          }}
                          value={mapping[field.key] || ''}
                          onChange={(e) => handleMappingChange(field.key, e.target.value)}
                        >
                          <option value="">— Não mapeado / Deixar padrão —</option>
                          {sheetData.rawHeaders.map(header => (
                            <option key={header} value={header}>
                              Coluna: {header}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Seção 2: Pré-visualização dos Primeiros Registros Calculados */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0, color: '#ffffff', fontSize: '0.88rem', fontWeight: 700 }}>
                    Pré-visualização do Cálculo (Primeiras {previewData.length} Linhas):
                  </h4>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                    O sistema calcula a autonomia e valida as placas em tempo real
                  </span>
                </div>

                <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <table className="fuel-records-table" style={{ fontSize: '0.76rem' }}>
                    <thead>
                      <tr>
                        <th>Placa</th>
                        <th>Data</th>
                        <th>Litros</th>
                        <th>Total R$</th>
                        <th>KM Percorrido</th>
                        <th>Média KM/L</th>
                        <th>Motorista</th>
                        <th>Posto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((rec, i) => (
                        <tr key={i}>
                          <td><span className="fuel-plate-badge" style={{ fontSize: '0.72rem' }}>{rec.placa}</span></td>
                          <td>{rec.data_abastecimento}</td>
                          <td><strong>{rec.litros} L</strong></td>
                          <td><span style={{ color: '#10b981', fontWeight: 600 }}>R$ {rec.valor_total}</span></td>
                          <td>{rec.distancia_percorrida_km ? `${rec.distancia_percorrida_km} km` : '—'}</td>
                          <td>
                            {rec.km_por_litro ? (
                              <strong style={{ color: rec.km_por_litro >= 2.3 ? '#34d399' : '#f59e0b' }}>
                                {rec.km_por_litro} km/l
                              </strong>
                            ) : (
                              <span style={{ color: '#64748b' }}>—</span>
                            )}
                          </td>
                          <td>{rec.motorista}</td>
                          <td>{rec.posto_nome}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Seção 3: Opções de Importação */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff', display: 'block', marginBottom: '0.5rem' }}>
                    Modo de Integração com o Banco de Dados:
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#cbd5e1', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="importMode" 
                        value="append" 
                        checked={importMode === 'append'} 
                        onChange={() => setImportMode('append')}
                      />
                      <span><strong>Acrescentar (Recomendado):</strong> adiciona novos abastecimentos sem apagar os que já existem.</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#cbd5e1', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="importMode" 
                        value="replace" 
                        checked={importMode === 'replace'} 
                        onChange={() => setImportMode('replace')}
                      />
                      <span><strong>Substituir Tudo:</strong> apaga todos os registros atuais e deixa apenas os desta planilha.</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff', display: 'block', marginBottom: '0.5rem' }}>
                    Prevenção de Duplicatas:
                  </label>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.78rem', color: '#cbd5e1', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={skipDuplicates} 
                      onChange={(e) => setSkipDuplicates(e.target.checked)}
                      style={{ marginTop: '2px' }}
                    />
                    <span>
                      <strong>Pular registros duplicados:</strong> se já existir um abastecimento para o mesmo veículo na mesma data com mesmo volume ou nota fiscal, ignora para não somar duas vezes.
                    </span>
                  </label>
                </div>
              </div>

              {/* Barra de Progresso de Importação em Massa */}
              {isProcessing && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#ffffff', marginBottom: '4px' }}>
                    <span>Processando e Validando {sheetData.totalRows} registros...</span>
                    <span>{progressPct}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${progressPct}%`, height: '100%', background: '#10b981', transition: 'width 0.2s ease' }}></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer do Modal */}
        <div className="fuel-modal-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
          <button
            type="button"
            className="fuel-btn fuel-btn-secondary"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancelar
          </button>

          {sheetData && (
            <button
              type="button"
              className="fuel-btn fuel-btn-primary"
              disabled={!requiredFieldsCheck.isValid || isProcessing}
              onClick={handleExecuteImport}
              style={{
                background: !requiredFieldsCheck.isValid ? '#64748b' : undefined,
                cursor: !requiredFieldsCheck.isValid ? 'not-allowed' : 'pointer'
              }}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Importando em Lote...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Confirmar e Importar {sheetData.totalRows.toLocaleString('pt-BR')} Registros</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
