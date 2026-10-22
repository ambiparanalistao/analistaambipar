import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturou uma falha na renderização:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2.5rem 1.5rem',
          color: '#ffffff',
          textAlign: 'center',
          background: 'radial-gradient(circle at 50% 30%, rgba(244, 63, 94, 0.08) 0%, transparent 60%)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid #f43f5e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f43f5e',
            marginBottom: '1.25rem',
            boxShadow: '0 0 30px rgba(244, 63, 94, 0.25)'
          }}>
            <AlertTriangle size={32} />
          </div>

          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem', color: '#ffffff' }}>
            Recuperação Automática da Interface
          </h3>

          <p style={{ color: '#94a3b8', maxWidth: '520px', fontSize: '0.88rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            O sistema evitou que a tela ficasse preta e protegeu seus dados. Nenhum registro foi perdido.
            {this.state.error && (
              <span style={{
                display: 'block',
                marginTop: '0.65rem',
                padding: '0.5rem 0.85rem',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: '0.76rem',
                fontFamily: 'Consolas, monospace',
                wordBreak: 'break-word'
              }}>
                {String(this.state.error?.message || this.state.error)}
              </span>
            )}
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              className="fuel-btn fuel-btn-primary"
              onClick={this.handleReset}
              style={{ fontSize: '0.84rem', padding: '0.55rem 1.15rem' }}
            >
              <RefreshCw size={15} />
              <span>Tentar Novamente</span>
            </button>

            <button
              type="button"
              className="fuel-btn fuel-btn-secondary"
              onClick={this.handleReload}
              style={{ fontSize: '0.84rem', padding: '0.55rem 1.15rem' }}
            >
              <RefreshCw size={15} />
              <span>Recarregar Página</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
