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
  Info,
  Calendar,
  DollarSign,
  TrendingUp,
  Table
} from 'lucide-react';
import {
  FIELD_DEFINITIONS,
  readSpreadsheetWorkbook,
  convertRowsToFuelRecords,
  generateBlankTemplateExcel,
  MATRIX_MONTHS
} from '../utils/excelFuelIntegration';

export default function FuelExcelImportModal({ isOpen, onClose, existingRecords = [], onImportComplete }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sheetData, setSheetData] = useState(null);
  const [selectedSheetName, setSelectedSheetName] = useState('');
  const [mapping, setMapping] = useState({});
  const [importMode, setImportMode] = useState('append'); // 'append' | 'replace'
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPct, setProgressPct] = useState(0);


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

  const processSelectedFile = async (fileObj, targetSheet = null) => {
    try {
      setLoading(true);
      setError(null);
      setFile(fileObj);

      const parsed = await readSpreadsheetWorkbook(fileObj, targetSheet);
      setSheetData(parsed);
      setSelectedSheetName(parsed.activeSheet);
      setMapping(parsed.detectedMapping || {});
    } catch (err) {
      console.error('Falha na leitura da planilha:', err);
      setError(err.message || 'Erro ao processar o arquivo. Se a planilha estiver aberta no Excel, salve e feche-a antes de importar.');
      setFile(null);
      setSheetData(null);
    } finally {
      setLoading(false);
    }
  };

  // Troca de Aba dentro da mesma planilha (ex: CUSTO FROTA GERAL -> BAÚ 3-4 -> HIDROVÁCUO)
  const handleSwitchSheet = async (newSheet) => {
    if (!file || newSheet === selectedSheetName) return;
    await processSelectedFile(file, newSheet);
  };

  const handleMappingChange = (fieldKey, selectedHeader) => {
    setMapping(prev => ({
      ...prev,
      [fieldKey]: selectedHeader
    }));
  };

  // Pré-visualização dinâmica dos primeiros registros
  const previewData = useMemo(() => {
    if (!sheetData) return [];
    
    // Se for a Matriz Mensal (como a foto)
    if (sheetData.sheetFormat === 'MATRIZ_CUSTOS_MENSAL' && sheetData.matrixResult) {
      return sheetData.matrixResult.matrixData.slice(0, 7);
    }

    // Se for tabela de abastecimentos padrão
    if (!sheetData.parsedRows) return [];
    const sampleRows = sheetData.parsedRows.slice(0, 5);
    const { records } = convertRowsToFuelRecords(sampleRows, mapping, [], { skipDuplicates: false });
    return records;
  }, [sheetData, mapping]);

  // Contagem de campos obrigatórios mapeados (apenas se for tabela normal)
  const requiredFieldsCheck = useMemo(() => {
    if (!sheetData) return { isValid: false, missing: [] };
    if (sheetData.sheetFormat === 'MATRIZ_CUSTOS_MENSAL') {
      return { isValid: true, missing: [] };
    }
    const required = FIELD_DEFINITIONS.filter(f => f.required);
    const missing = required.filter(f => !mapping[f.key]);
    return {
      isValid: missing.length === 0,
      missing
    };
  }, [sheetData, mapping]);

  // Execução da Importação
  const handleExecuteImport = () => {
    if (!sheetData) return;

    setIsProcessing(true);
    setProgressPct(20);

    setTimeout(() => {
      setProgressPct(60);
      try {
        let generatedRecords = [];
        let totalImported = 0;
        let skippedDuplicates = 0;
        let invalidRows = 0;

        // Caso 1: Matriz de Custos da Frota (Como a foto)
        if (sheetData.sheetFormat === 'MATRIZ_CUSTOS_MENSAL' && sheetData.matrixResult) {
          generatedRecords = [];
          totalImported = sheetData.matrixResult.matrixData.length;
        } else {
          // Caso 2: Tabela de abastecimentos individuais
          const res = convertRowsToFuelRecords(
            sheetData.parsedRows,
            mapping,
            importMode === 'replace' ? [] : (existingRecords || []),
            { skipDuplicates }
          );
          generatedRecords = res.records;
          totalImported = res.totalImported;
          skippedDuplicates = res.skippedDuplicates;
          invalidRows = res.invalidRows;
        }

        setProgressPct(100);

        setTimeout(() => {
          onImportComplete({
            records: generatedRecords,
            mode: importMode,
            sheetFormat: sheetData.sheetFormat,
            matrixData: sheetData.matrixResult?.matrixData || null,
            stats: {
              totalImported,
              skippedDuplicates,
              invalidRows,
              totalInFile: sheetData.totalRows || generatedRecords.length
            }
          });
          setIsProcessing(false);
          onClose();
        }, 400);

      } catch (err) {
        setIsProcessing(false);
        setError('Ocorreu um erro ao processar os dados da planilha: ' + err.message);
      }
    }, 250);
  };

  // Keep all hooks unconditional when the modal opens or closes.
  if (!isOpen) return null;

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
                Compatível com planilhas de abastecimento e com a <strong>Matriz de Custos da Frota Ambipar (DCX 2026)</strong>
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
                <p style={{ margin: '0 auto', maxWidth: '520px', color: '#94a3b8', fontSize: '0.86rem', lineHeight: 1.5 }}>
                  Compatível com <strong>CUSTOS FROTA 2026 (Matrix)</strong>, planilhas com múltiplas abas (`BAÚ 3-4`, `HIDROVÁCUO`, `ROLLON`) ou listagens diretas de abastecimentos.
                </p>

                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', color: '#34d399', fontWeight: 600 }}>
                    ✓ Reconhece Matriz Mensal Ambipar (Janeiro a Dezembro)
                  </span>
                  <span style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '6px', color: '#38bdf8', fontWeight: 600 }}>
                    ✓ Suporte a múltiplas abas de conjuntos/veículos
                  </span>
                </div>
              </div>

              {/* Dica para arquivos abertos no Excel */}
              <div style={{
                marginTop: '1.25rem',
                padding: '0.85rem 1.25rem',
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <Info size={20} color="#fbbf24" style={{ flexShrink: 0 }} />
                <span style={{ color: '#cbd5e1', fontSize: '0.82rem' }}>
                  <strong>Importante:</strong> Se a sua planilha estiver aberta no Microsoft Excel, certifique-se de salvá-la para que as alterações mais recentes sejam lidas pelo sistema.
                </span>
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
              {/* Card de Resumo do Arquivo e Seletor de Aba */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.25rem',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                marginBottom: '1.25rem',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FileCheck size={28} color="#10b981" />
                  <div>
                    <strong style={{ color: '#ffffff', fontSize: '0.98rem', display: 'block' }}>
                      {sheetData.fileName}
                    </strong>
                    <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                      Formato detectado: <strong style={{ color: sheetData.sheetFormat === 'MATRIZ_CUSTOS_MENSAL' ? '#38bdf8' : '#34d399' }}>
                        {sheetData.sheetFormat === 'MATRIZ_CUSTOS_MENSAL' 
                          ? 'Matriz de Custos da Frota (Ambipar DCX)' 
                          : 'Tabela de Abastecimentos por Veículo'}
                      </strong>
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {/* Seletor de Aba se houver múltiplas abas */}
                  {sheetData.sheetNames && sheetData.sheetNames.length > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Aba Ativa:</span>
                      <select
                        className="styled-native-select"
                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem', background: '#0f172a', borderColor: '#10b981', color: '#ffffff' }}
                        value={selectedSheetName}
                        onChange={(e) => handleSwitchSheet(e.target.value)}
                      >
                        {sheetData.sheetNames.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                  )}

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
              </div>

              {/* CENÁRIO 1: A PLANILHA É A MATRIZ DE CUSTOS DA FROTA (COMO A FOTO DO USUÁRIO) */}
              {sheetData.sheetFormat === 'MATRIZ_CUSTOS_MENSAL' && sheetData.matrixResult ? (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{
                    padding: '1rem 1.25rem',
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    borderRadius: '12px',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                      <Table size={18} color="#06b6d4" />
                      <strong style={{ color: '#ffffff', fontSize: '0.95rem' }}>
                        Matriz Ambipar Reconhecida: {selectedSheetName}
                      </strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                      Identificamos uma matriz mensal de custos. Ela será copiada para revisão, sem converter totais estimados em abastecimentos ou alterar lançamentos existentes.
                    </p>
                  </div>

                  {/* Pré-visualização da Matriz de Custos da Frota */}
                  <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '320px' }}>
                    <table className="fuel-records-table" style={{ fontSize: '0.74rem', width: '100%', minWidth: '900px' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '220px' }}>Custos com Frota</th>
                          {MATRIX_MONTHS.slice(0, 7).map(m => (
                            <th key={m.key} style={{ textAlign: 'right' }}>{m.label.toUpperCase()}</th>
                          ))}
                          <th style={{ textAlign: 'right', color: '#10b981' }}>TOTAL ANO</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sheetData.matrixResult.matrixData.map((item, i) => {
                          const isFuel = item.categoria.toLowerCase().includes('combustivel');
                          const isTotal = item.categoria.toLowerCase().includes('total');
                          return (
                            <tr 
                              key={i}
                              style={{
                                background: isFuel 
                                  ? 'rgba(16, 185, 129, 0.15)' 
                                  : isTotal ? 'rgba(255, 255, 255, 0.05)' : undefined,
                                fontWeight: isFuel || isTotal ? 700 : 400
                              }}
                            >
                              <td>
                                <span style={{ color: isFuel ? '#34d399' : '#ffffff' }}>
                                  {item.categoria}
                                </span>
                              </td>
                              {MATRIX_MONTHS.slice(0, 7).map(m => (
                                <td key={m.key} style={{ textAlign: 'right' }}>
                                  {item.meses[m.key] > 0 ? (
                                    <span style={{ color: isFuel ? '#34d399' : '#cbd5e1' }}>
                                      R$ {Number(item.meses[m.key]).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                  ) : (
                                    <span style={{ color: '#64748b' }}>R$ 0,00</span>
                                  )}
                                </td>
                              ))}
                              <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 700 }}>
                                R$ {Number(item.totalAno).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginTop: '0.65rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                    * Mostrando colunas de Janeiro a Julho 2026 conforme dados apurados na planilha.
                  </div>
                </div>
              ) : (
                /* CENÁRIO 2: TABELA DE ABASTECIMENTOS INDIVIDUAIS (POR PLACA / TICKET) */
                <>
                  {/* Seção de Mapeamento de Colunas */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Layers size={18} color="#06b6d4" />
                        <h4 style={{ margin: 0, color: '#ffffff', fontSize: '0.95rem', fontWeight: 700 }}>
                          Mapeamento das Colunas da Planilha
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
                              {(sheetData.rawHeaders || []).map(header => (
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

                  {/* Pré-visualização da Tabela */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <h4 style={{ margin: 0, color: '#ffffff', fontSize: '0.88rem', fontWeight: 700 }}>
                        Pré-visualização do Cálculo (Primeiras {previewData.length} Linhas):
                      </h4>
                      <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                        Validação de autonomia e consumo em tempo real
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
                          {previewData.length === 0 ? (
                            <tr>
                              <td colSpan={8} style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                                Nenhuma linha reconhecida com o mapeamento atual. Mapeie as colunas de Placa, Data e Litros acima.
                              </td>
                            </tr>
                          ) : (
                            previewData.map((rec, i) => (
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
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* Opções de Importação */}
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
                    Modo de Processamento de Dados:
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
                      <span><strong>Acrescentar (Recomendado):</strong> integra novos lançamentos sem apagar os existentes.</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#cbd5e1', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="importMode" 
                        value="replace" 
                        checked={importMode === 'replace'} 
                        onChange={() => setImportMode('replace')}
                      />
                      <span><strong>Reprocessar planilha:</strong> mantém os lançamentos existentes e envia cópia para revisão.</span>
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
                      <strong>Pular registros duplicados:</strong> evita somar duas vezes lançamentos já existentes na base.
                    </span>
                  </label>
                </div>
              </div>

              {/* Barra de Progresso */}
              {isProcessing && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#ffffff', marginBottom: '4px' }}>
                    <span>Processando e consolidando dados da planilha...</span>
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
                  <span>Consolidando Dados...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>
                    {sheetData.sheetFormat === 'MATRIZ_CUSTOS_MENSAL' 
                      ? 'Copiar matriz para revisão' 
                      : `Copiar ${(sheetData.totalRows || 0).toLocaleString('pt-BR')} registros para revisão`}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
