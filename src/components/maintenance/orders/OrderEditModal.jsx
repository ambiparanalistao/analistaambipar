import React, { useState } from 'react';
import { ORDER_STATUS, ORDER_TYPES, PRIORITIES, getOrderTipos, toLocalInput } from '../../../utils/orderValidation';

export default function OrderEditModal({ order, vehicle, options, busy, error, onSave, onClose }) {
  const currentTipos = getOrderTipos(order);

  const [form, setForm] = useState({
    descricao_problema: order?.descricao_problema || '',
    diagnostico: order?.diagnostico || '',
    servicos_executados: order?.servicos_executados || '',
    prioridade: order?.prioridade || 'media',
    tipos: currentTipos.length ? currentTipos : [order?.tipo || 'corretiva'],
    km_abertura: order?.km_abertura != null ? String(order.km_abertura) : '',
    partner_id: order?.partner_id || '',
    driver_id: order?.driver_id || '',
    prazo_entrega_dias: order?.prazo_entrega_dias != null ? String(order.prazo_entrega_dias) : '',
    previsao_entrega: toLocalInput(order?.previsao_entrega),
    observacao_edicao: ''
  });

  const [localError, setLocalError] = useState('');

  const minKm = Math.max(0, Number(vehicle?.km_atual || 0));

  function handleToggleTipo(tipoKey) {
    setForm(prev => {
      const exists = prev.tipos.includes(tipoKey);
      if (exists) {
        if (prev.tipos.length === 1) {
          setLocalError('Mantenha pelo menos 1 tipo de manutenção selecionado.');
          return prev;
        }
        setLocalError('');
        return { ...prev, tipos: prev.tipos.filter(t => t !== tipoKey) };
      } else {
        if (prev.tipos.length >= 3) {
          setLocalError('É permitido marcar no máximo 3 tipos de manutenção.');
          return prev;
        }
        setLocalError('');
        return { ...prev, tipos: [...prev.tipos, tipoKey] };
      }
    });
  }

  function handleAddWorkshopNote() {
    const now = new Date();
    const stamp = `\n\n[Oficina - ${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR').slice(0, 5)}]: `;
    setForm(prev => ({
      ...prev,
      descricao_problema: (prev.descricao_problema || '').trim() + stamp
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setLocalError('');

    if (!form.descricao_problema.trim()) {
      setLocalError('O relato de problemas/defeitos não pode ficar vazio.');
      return;
    }

    if (form.km_abertura !== '') {
      const kmNum = Number(form.km_abertura);
      if (!Number.isInteger(kmNum) || kmNum < 0) {
        setLocalError('Informe um valor inteiro válido para o KM.');
        return;
      }
    }

    if (!form.tipos.length) {
      setLocalError('Selecione ao menos 1 tipo de manutenção.');
      return;
    }

    // Preserva as tags de tipos na descrição para consistência com o motor de persistência
    let finalDescricao = form.descricao_problema.trim();
    finalDescricao = finalDescricao.replace(/\s*\[Tipos(?:\s+de\s+manutenção)?:\s*[^\]]+\]/gi, '').trim();
    if (form.tipos.length > 0) {
      finalDescricao = `${finalDescricao}\n\n[Tipos: ${form.tipos.join(', ')}]`;
    }

    const payload = {
      descricao_problema: finalDescricao,
      diagnostico: form.diagnostico.trim(),
      servicos_executados: form.servicos_executados.trim(),
      prioridade: form.prioridade,
      tipo: form.tipos[0] || 'corretiva',
      tipos: form.tipos,
      partner_id: form.partner_id || null,
      driver_id: form.driver_id || null,
      km_abertura: form.km_abertura !== '' ? Number(form.km_abertura) : null,
      prazo_entrega_dias: form.prazo_entrega_dias ? Number(form.prazo_entrega_dias) : null,
      previsao_entrega: form.previsao_entrega ? new Date(form.previsao_entrega).toISOString() : null,
      observacao_edicao: form.observacao_edicao.trim() || 'S.D.O editada com ocorrências constatadas na oficina'
    };

    onSave(payload);
  }

  return (
    <div className="os-edit-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Editar S.D.O">
      <div className="os-edit-modal-container" onClick={e => e.stopPropagation()}>
        <header className="os-edit-modal-header">
          <div>
            <h3>✏️ Editar S.D.O · {order?.numero}</h3>
            <span className="os-edit-modal-sub">
              Veículo: <strong>{vehicle?.placa || 'Sem placa'}</strong> ({vehicle?.marca_modelo || 'Não especificado'}) · Status atual: <strong>{ORDER_STATUS[order?.status] || order?.status}</strong>
            </span>
          </div>
          <button type="button" className="os-btn-close" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </header>

        {(error || localError) && (
          <div className="os-edit-error-banner" role="alert">
            ⚠️ {localError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="os-edit-form">
          <div className="os-edit-form-body">
            {/* Bloco 1: Ocorrências e Defeitos da Oficina */}
            <div className="os-edit-field-group">
              <div className="os-edit-label-row">
                <label htmlFor="edit_descricao_problema">
                  <strong>⚠️ Problemas & Defeitos Informados (Relato do Motorista / Oficina) *</strong>
                </label>
                <button
                  type="button"
                  className="os-btn-append-note"
                  onClick={handleAddWorkshopNote}
                  title="Insere um cabeçalho com data/hora para apontar novos defeitos detectados na oficina"
                >
                  ➕ Adicionar Ocorrência da Oficina
                </button>
              </div>
              <textarea
                id="edit_descricao_problema"
                rows={5}
                value={form.descricao_problema}
                onChange={e => setForm(f => ({ ...f, descricao_problema: e.target.value }))}
                placeholder="Descreva detalhadamente os problemas apresentados e quaisquer ocorrências constatadas posteriormente na oficina..."
                required
              />
              <span className="os-edit-hint">
                💡 Caso o veículo já esteja na oficina e novos itens/defeitos tenham sido identificados, registre-os aqui para atualizar a S.D.O.
              </span>
            </div>

            {/* Bloco 2: Classificação da Manutenção (até 3 tipos) */}
            <div className="os-edit-field-group">
              <div className="os-edit-label-row">
                <label>
                  <strong>🔧 Classificação da Manutenção (Marque até 3 tipos) *</strong>
                </label>
                <span className="os-edit-count-badge">
                  {form.tipos.length}/3 selecionados
                </span>
              </div>
              <div className="os-types-pill-grid">
                {Object.entries(ORDER_TYPES).map(([k, label]) => {
                  const active = form.tipos.includes(k);
                  return (
                    <button
                      type="button"
                      key={k}
                      className={`os-type-pill ${active ? 'active' : ''}`}
                      onClick={() => handleToggleTipo(k)}
                    >
                      <span className="os-type-check">{active ? '✓' : '+'}</span> {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bloco 3: Grid com Prioridade, KM, Oficina e Motorista */}
            <div className="os-edit-grid-2">
              <label className="os-edit-field">
                <span>⚡ Grau de Urgência / Prioridade *</span>
                <select
                  value={form.prioridade}
                  onChange={e => setForm(f => ({ ...f, prioridade: e.target.value }))}
                >
                  {Object.entries(PRIORITIES).map(([k, label]) => (
                    <option key={k} value={k}>{label}</option>
                  ))}
                </select>
              </label>

              <label className="os-edit-field">
                <span>📍 KM Odômetro na Abertura / Entrada</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.km_abertura}
                  onChange={e => setForm(f => ({ ...f, km_abertura: e.target.value }))}
                  placeholder={`Mínimo: ${minKm} km`}
                />
              </label>

              <label className="os-edit-field">
                <span>🏢 Oficina Mecânica Responsável</span>
                <select
                  value={form.partner_id}
                  onChange={e => setForm(f => ({ ...f, partner_id: e.target.value }))}
                >
                  <option value="">A Definir / Cotação Avulsa</option>
                  {(options?.partners || [])
                    .filter(p => p.status === 'ativo' && !p.deleted_at)
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nome_fantasia || p.razao_social} {p.cidade ? `(${p.cidade})` : ''}
                      </option>
                    ))}
                </select>
              </label>

              <label className="os-edit-field">
                <span>👤 Motorista Relator / Condutor</span>
                <select
                  value={form.driver_id}
                  onChange={e => setForm(f => ({ ...f, driver_id: e.target.value }))}
                >
                  <option value="">Não informado / Sem motorista cadastrado</option>
                  {(options?.drivers || []).map(d => (
                    <option key={d.id} value={d.id}>
                      {d.nome} {d.telefone ? `(${d.telefone})` : ''}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Bloco 4: Diagnóstico Técnico e Serviços Executados */}
            <div className="os-edit-grid-2">
              <label className="os-edit-field">
                <span>🔬 Diagnóstico Técnico da Oficina / Mecânica</span>
                <textarea
                  rows={3}
                  value={form.diagnostico}
                  onChange={e => setForm(f => ({ ...f, diagnostico: e.target.value }))}
                  placeholder="Apontamentos do mecânico, testes realizados, causa-raiz..."
                />
              </label>

              <label className="os-edit-field">
                <span>🛠️ Serviços Executados / em Execução</span>
                <textarea
                  rows={3}
                  value={form.servicos_executados}
                  onChange={e => setForm(f => ({ ...f, servicos_executados: e.target.value }))}
                  placeholder="Mão de obra realizada, reparos executados..."
                />
              </label>
            </div>

            {/* Bloco 5: Prazos e Observação de Auditoria */}
            <div className="os-edit-grid-2">
              <label className="os-edit-field">
                <span>⏱️ Prazo Informado pela Oficina (dias corridos após aprovação)</span>
                <input
                  type="number"
                  min={1}
                  max={3650}
                  step={1}
                  value={form.prazo_entrega_dias}
                  onChange={e => setForm(f => ({ ...f, prazo_entrega_dias: e.target.value }))}
                  placeholder="Ex: 3 dias corridos"
                />
              </label>

              <label className="os-edit-field">
                <span>📅 Previsão de Entrega</span>
                <input
                  type="datetime-local"
                  value={form.previsao_entrega}
                  onChange={e => setForm(f => ({ ...f, previsao_entrega: e.target.value }))}
                />
              </label>
            </div>

            <div className="os-edit-field-group">
              <label htmlFor="edit_obs">
                <strong>📝 Justificativa / Motivo da Edição (Registro para Linha do Tempo)</strong>
              </label>
              <input
                id="edit_obs"
                type="text"
                value={form.observacao_edicao}
                onChange={e => setForm(f => ({ ...f, observacao_edicao: e.target.value }))}
                placeholder="Ex: Novos defeitos identificados pela oficina mecânica após desmonte"
              />
            </div>
          </div>

          <footer className="os-edit-modal-footer">
            <button type="button" className="os-btn-cancel" onClick={onClose} disabled={busy}>
              Cancelar
            </button>
            <button type="submit" className="os-btn-save-edit" disabled={busy}>
              {busy ? 'Salvando Alterações…' : '💾 Salvar Alterações na S.D.O'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
