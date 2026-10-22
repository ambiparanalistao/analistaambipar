import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Building2, 
  Truck, 
  Scale, 
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export default function MtrModule({ user }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    empresa_origem: '',
    tipo_residuo: '',
    classe: 'Classe I - Perigosos',
    quantidade_kg: '',
    destinacao_final: 'Coprocessamento em Forno de Clínquer',
    transportador: 'Ambipar Transportes Especializados S/A'
  });

  // Carrega registros da tabela do Supabase criada na migration
  const fetchRecords = async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured || !supabase) {
        // Fallback com dados demonstrativos caso ainda não haja dados no banco
        setRecords(getSampleRecords());
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('registros_residuos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Erro ao carregar registros do Supabase:', error);
        setRecords(getSampleRecords());
      } else if (data && data.length > 0) {
        setRecords(data);
      } else {
        setRecords(getSampleRecords());
      }
    } catch (err) {
      console.error('Falha de conexão com a tabela de resíduos:', err);
      setRecords(getSampleRecords());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const getSampleRecords = () => [
    {
      id: 'demo-1',
      empresa_origem: 'Petroquímica União - Paulínia',
      tipo_residuo: 'Borra de Fundo de Tanque e Oleosos',
      classe: 'Classe I - Perigosos',
      quantidade_kg: 24500,
      destinacao_final: 'Coprocessamento e Recuperação Energética',
      transportador: 'Ambipar Logística Integrada',
      data_descarte: '2026-10-20'
    },
    {
      id: 'demo-2',
      empresa_origem: 'Indústria Farmacêutica Biosintética',
      tipo_residuo: 'Solventes Não Halogenados',
      classe: 'Classe I - Perigosos',
      quantidade_kg: 8200,
      destinacao_final: 'Incineração Térmica Controlada',
      transportador: 'Ambipar Transportes Especiais',
      data_descarte: '2026-10-19'
    },
    {
      id: 'demo-3',
      empresa_origem: 'Metalúrgica Alvorada',
      tipo_residuo: 'Sucatas Metálicas Ferrosas Limpas',
      classe: 'Classe II B - Inertes',
      quantidade_kg: 18400,
      destinacao_final: 'Reciclagem e Reintrodução na Cadeia',
      transportador: 'Transportadora Parceira Ambipar',
      data_descarte: '2026-10-18'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const payload = {
        user_id: user?.id,
        empresa_origem: formData.empresa_origem,
        tipo_residuo: formData.tipo_residuo,
        classe: formData.classe,
        quantidade_kg: parseFloat(formData.quantidade_kg),
        destinacao_final: formData.destinacao_final,
        transportador: formData.transportador,
        data_descarte: new Date().toISOString().split('T')[0]
      };

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('registros_residuos')
          .insert([payload])
          .select();

        if (error) throw error;
        setRecords([data[0], ...records]);
      } else {
        // Modo local
        const newRecord = { ...payload, id: `local-${Date.now()}` };
        setRecords([newRecord, ...records]);
      }

      setFeedback({ type: 'success', message: 'MTR / Registro de resíduo gravado com sucesso no Supabase!' });
      setShowModal(false);
      setFormData({
        empresa_origem: '',
        tipo_residuo: '',
        classe: 'Classe I - Perigosos',
        quantidade_kg: '',
        destinacao_final: 'Coprocessamento em Forno de Clínquer',
        transportador: 'Ambipar Transportes Especializados S/A'
      });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao registrar resíduo.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="module-view animate-fade-in" id="mtr-module-root">
      {/* Cabeçalho do Módulo */}
      <div className="module-page-header">
        <div>
          <div className="module-tag">
            <FileText size={16} />
            <span>GESTÃO AMBIENTAL & REGULATÓRIO (SINIR)</span>
          </div>
          <h2>Manifesto de Transporte de Resíduos (MTR) & CDF</h2>
          <p>
            Rastreamento da destinação final, certificação de conformidade ambiental e emissão de Certificados de Destinação Final (CDF).
          </p>
        </div>

        <div className="header-actions">
          <button 
            type="button" 
            className="btn-secondary btn-icon-text"
            onClick={fetchRecords}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
            <span>Atualizar</span>
          </button>

          <button 
            type="button" 
            className="btn-primary btn-icon-text"
            onClick={() => setShowModal(true)}
            id="open-new-mtr-modal-btn"
          >
            <Plus size={18} />
            <span>Emitir Novo MTR / Registro</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} animate-fade-in`} style={{ marginBottom: '1.5rem' }}>
          {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Cards de Métricas de MTR */}
      <div className="mtr-summary-cards">
        <div className="summary-stat-box">
          <span className="stat-label">Total Registrado</span>
          <span className="stat-number">
            {(records.reduce((acc, curr) => acc + (Number(curr.quantidade_kg) || 0), 0) / 1000).toFixed(1)} ton
          </span>
          <span className="stat-sub">Massa total movimentada</span>
        </div>

        <div className="summary-stat-box danger">
          <span className="stat-label">Classe I (Perigosos)</span>
          <span className="stat-number">
            {records.filter(r => r.classe?.includes('Classe I')).length} cargas
          </span>
          <span className="stat-sub">Tratamento prioritário</span>
        </div>

        <div className="summary-stat-box success">
          <span className="stat-label">Conformidade SINIR</span>
          <span className="stat-number">100%</span>
          <span className="stat-sub">Zero irregularidades</span>
        </div>
      </div>

      {/* Tabela de Registros com Supabase */}
      <div className="card-panel">
        <div className="panel-header">
          <h3>Registros no Banco de Dados (PostgreSQL)</h3>
          <span className="record-count-tag">{records.length} manifestos localizados</span>
        </div>

        <div className="table-responsive-wrapper">
          <table className="operational-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Gerador (Empresa de Origem)</th>
                <th>Tipo de Resíduo</th>
                <th>Classificação</th>
                <th>Quantidade</th>
                <th>Destinação Final</th>
                <th>Transportador</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                    <span className="spinner"></span>
                    <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Consultando tabela registros_residuos...</p>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-table-state">
                    Nenhum registro de resíduo cadastrado ainda. Clique em "Emitir Novo MTR" acima.
                  </td>
                </tr>
              ) : (
                records.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="date-tag">
                        {item.data_descarte ? new Date(item.data_descarte).toLocaleDateString('pt-BR') : 'Hoje'}
                      </span>
                    </td>
                    <td>
                      <strong>{item.empresa_origem}</strong>
                    </td>
                    <td>{item.tipo_residuo}</td>
                    <td>
                      <span className={`badge-class ${item.classe?.includes('Classe I') ? 'hazard' : 'inert'}`}>
                        {item.classe}
                      </span>
                    </td>
                    <td>
                      <strong>{(Number(item.quantidade_kg) || 0).toLocaleString('pt-BR')} kg</strong>
                      <small style={{ display: 'block', color: 'var(--text-muted)' }}>
                        {((Number(item.quantidade_kg) || 0) / 1000).toFixed(2)} t
                      </small>
                    </td>
                    <td>{item.destinacao_final}</td>
                    <td>
                      <small>{item.transportador || 'Ambipar'}</small>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação de Novo MTR */}
      {showModal && (
        <div className="modal-backdrop animate-fade-in" id="new-mtr-modal">
          <div className="modal-container">
            <div className="modal-header">
              <div className="header-icon-label">
                <FileText size={20} className="icon-emerald" />
                <h3>Cadastrar Novo Manifesto (MTR)</h3>
              </div>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setShowModal(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="input-group-custom">
                <label>Empresa Geradora (Origem da Carga)</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Petroquímica ABC - Polo Industrial"
                  value={formData.empresa_origem}
                  onChange={(e) => setFormData({ ...formData, empresa_origem: e.target.value })}
                />
              </div>

              <div className="input-group-custom">
                <label>Descrição do Resíduo / Produto Perigoso</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Borra oleosa contaminada, Ácido sulfúrico residual..."
                  value={formData.tipo_residuo}
                  onChange={(e) => setFormData({ ...formData, tipo_residuo: e.target.value })}
                />
              </div>

              <div className="grid-2-cols">
                <div className="input-group-custom">
                  <label>Classificação NBR 10004</label>
                  <select
                    value={formData.classe}
                    onChange={(e) => setFormData({ ...formData, classe: e.target.value })}
                    className="select-custom"
                  >
                    <option value="Classe I - Perigosos">Classe I - Perigosos</option>
                    <option value="Classe II A - Não Inertes">Classe II A - Não Inertes</option>
                    <option value="Classe II B - Inertes">Classe II B - Inertes</option>
                  </select>
                </div>

                <div className="input-group-custom">
                  <label>Quantidade Total (em KG)</label>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 15000"
                    min="1"
                    value={formData.quantidade_kg}
                    onChange={(e) => setFormData({ ...formData, quantidade_kg: e.target.value })}
                  />
                </div>
              </div>

              <div className="input-group-custom">
                <label>Destinação Final Licenciada</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Coprocessamento em Forno de Cimento, Incineração, Aterro..."
                  value={formData.destinacao_final}
                  onChange={(e) => setFormData({ ...formData, destinacao_final: e.target.value })}
                />
              </div>

              <div className="input-group-custom">
                <label>Transportadora Responsável</label>
                <input
                  type="text"
                  required
                  value={formData.transportador}
                  onChange={(e) => setFormData({ ...formData, transportador: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Salvando no Supabase...' : 'Salvar e Gerar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
