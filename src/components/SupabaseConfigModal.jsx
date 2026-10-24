import React, { useState } from 'react';
import { 
  Key, 
  Globe, 
  CheckCircle2, 
  HelpCircle, 
  X, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';
import { 
  supabaseUrl, 
  supabaseAnonKey, 
  setDynamicSupabaseCredentials 
} from '../lib/supabaseClient';

export default function SupabaseConfigModal({ isOpen, onClose }) {
  const [url, setUrl] = useState(supabaseUrl || '');
  const [anonKey, setAnonKey] = useState(supabaseAnonKey || '');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Por favor, informe a URL do projeto Supabase.');
      return;
    }
    if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
      setError('A URL deve ter o formato: https://[seu-id].supabase.co');
      return;
    }
    if (!anonKey.trim()) {
      setError('Por favor, informe a Anon Key pública.');
      return;
    }

    setError('');
    setDynamicSupabaseCredentials(url.trim(), anonKey.trim());
  };

  return (
    <div className="modal-backdrop" id="supabase-config-modal-backdrop">
      <div className="modal-container animate-fade-in" id="supabase-config-modal">
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="icon-badge emerald">
              <Key size={20} />
            </div>
            <div>
              <h3>Conexão da Plataforma em Nuvem</h3>
              <p className="subtitle">Gerencie o endereço e a chave de acesso do servidor corporativo</p>
            </div>
          </div>
          <button 
            type="button" 
            className="btn-icon" 
            onClick={onClose}
            id="close-config-modal-btn"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && (
            <div className="alert alert-error animate-fade-in" id="config-error-message">
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="supabase-url-input">
              <Globe size={15} /> Endereço do Servidor Corporativo (URL)
            </label>
            <input
              id="supabase-url-input"
              type="text"
              placeholder="https://xyzcompany.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="supabase-key-input">
              <Key size={15} /> Chave de Acesso Corporativa (API Key)
            </label>
            <input
              id="supabase-key-input"
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              required
            />
          </div>

          <div className="info-box">
            <ShieldCheck size={18} className="info-icon" />
            <div>
              <strong>Segurança e Privacidade:</strong>
              <p>Conexão corporativa criptografada de ponta a ponta para controle e auditoria das operações Ambipar.</p>
            </div>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onClose}
              id="cancel-config-btn"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              id="save-config-btn"
            >
              <CheckCircle2 size={18} /> Salvar e Conectar
            </button>
          </div>
        </form>

        <div className="modal-footer">
          <a 
            href="https://supabase.com/dashboard" 
            target="_blank" 
            rel="noopener noreferrer"
            className="external-link"
          >
            Abrir Painel do Supabase <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
