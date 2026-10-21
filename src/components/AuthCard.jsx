import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Shield,
  Layers
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export default function AuthCard({ onOpenConfig }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const translateError = (errorMsg) => {
    if (!errorMsg) return 'Ocorreu um erro ao processar sua solicitação.';
    if (errorMsg.includes('Invalid login credentials')) {
      return 'E-mail ou senha incorretos. Verifique suas credenciais.';
    }
    if (errorMsg.includes('User already registered')) {
      return 'Este e-mail já está cadastrado no sistema. Tente fazer login.';
    }
    if (errorMsg.includes('Password should be at least')) {
      return 'A senha deve conter no mínimo 6 caracteres.';
    }
    if (errorMsg.includes('Email not confirmed')) {
      return 'Por favor, confirme seu e-mail antes de entrar.';
    }
    if (errorMsg.includes('rate limit')) {
      return 'Muitas tentativas em pouco tempo. Aguarde alguns instantes.';
    }
    return errorMsg;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (!isSupabaseConfigured || !supabase) {
      setMessage({
        text: 'O Supabase ainda não foi configurado com suas chaves. Clique em "Configurar Chaves".',
        type: 'error'
      });
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;
        setMessage({ text: 'Login realizado com sucesso! Carregando...', type: 'success' });
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          setMessage({ text: 'Conta criada com sucesso e autenticada!', type: 'success' });
        } else {
          setMessage({ 
            text: 'Conta criada! Se a confirmação por e-mail estiver ativa no seu Supabase, verifique sua caixa de entrada.', 
            type: 'success' 
          });
        }
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin,
        });

        if (error) throw error;
        setMessage({ 
          text: 'E-mail de recuperação enviado! Verifique sua caixa de entrada.', 
          type: 'success' 
        });
      }
    } catch (err) {
      console.error('Erro na autenticação:', err);
      setMessage({ text: translateError(err.message), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card-wrapper animate-fade-in" id="auth-card-section">
      <div className="auth-card" id="auth-main-card">
        {/* Banner de status do Supabase */}
        {!isSupabaseConfigured && (
          <div className="config-alert-badge" id="supabase-status-alert">
            <div className="alert-badge-content">
              <span className="pulsing-dot yellow"></span>
              <span>Aguardando chaves do Supabase</span>
            </div>
            <button 
              type="button" 
              className="btn-badge-action" 
              onClick={onOpenConfig}
              id="open-config-from-badge-btn"
            >
              Configurar Chaves
            </button>
          </div>
        )}

        {/* Cabeçalho do Card */}
        <div className="auth-header">
          <div className="brand-badge">
            <Shield size={16} className="text-emerald" />
            <span>Ambipar Security & Auth</span>
          </div>

          <h2 className="auth-title" id="auth-card-title">
            {mode === 'login' && 'Acesso à Plataforma'}
            {mode === 'signup' && 'Criar Nova Conta'}
            {mode === 'forgot' && 'Recuperar Acesso'}
          </h2>

          <p className="auth-subtitle">
            {mode === 'login' && 'Entre com suas credenciais para acessar o painel Analista Ambipar.'}
            {mode === 'signup' && 'Cadastre-se para gerenciar laudos, inteligência e monitoramento.'}
            {mode === 'forgot' && 'Informe seu e-mail cadastrado para receber o link de redefinição.'}
          </p>

          {/* Abas Alternadoras */}
          {mode !== 'forgot' && (
            <div className="auth-tabs" id="auth-mode-tabs">
              <button
                type="button"
                className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
                onClick={() => { setMode('login'); setMessage({ text: '', type: '' }); }}
                id="tab-login-btn"
              >
                Entrar
              </button>
              <button
                type="button"
                className={`tab-btn ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => { setMode('signup'); setMessage({ text: '', type: '' }); }}
                id="tab-signup-btn"
              >
                Cadastrar
              </button>
            </div>
          )}
        </div>

        {/* Mensagens de Sucesso ou Erro */}
        {message.text && (
          <div 
            className={`alert alert-${message.type} animate-fade-in`} 
            id={`auth-alert-${message.type}`}
          >
            {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="auth-form" id="auth-form">
          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="auth-fullname-input">Nome Completo</label>
              <div className="input-icon-wrapper">
                <User size={18} className="input-icon" />
                <input
                  id="auth-fullname-input"
                  type="text"
                  placeholder="Ex: Carlos Silva"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email-input">E-mail Corporativo</label>
            <div className="input-icon-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                id="auth-email-input"
                type="email"
                placeholder="seu.email@ambipar.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div className="form-group">
              <div className="label-with-link">
                <label htmlFor="auth-password-input">Senha</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => { setMode('forgot'); setMessage({ text: '', type: '' }); }}
                    id="forgot-password-link"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="auth-password-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  id="password-visibility-toggle"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary btn-block submit-btn"
            disabled={loading}
            id="auth-submit-btn"
          >
            {loading ? (
              <span className="btn-loading-content">
                <span className="spinner"></span>
                <span>Processando...</span>
              </span>
            ) : (
              <span className="btn-content">
                <span>
                  {mode === 'login' && 'Entrar na Plataforma'}
                  {mode === 'signup' && 'Criar Conta no Supabase'}
                  {mode === 'forgot' && 'Enviar E-mail de Recuperação'}
                </span>
                <ArrowRight size={18} />
              </span>
            )}
          </button>
        </form>

        {/* Rodapé do Card */}
        <div className="auth-card-footer">
          {mode === 'forgot' ? (
            <button
              type="button"
              className="link-back-btn"
              onClick={() => { setMode('login'); setMessage({ text: '', type: '' }); }}
              id="back-to-login-btn"
            >
              ← Voltar para o Login
            </button>
          ) : (
            <p className="footer-note">
              Autenticação protegida por criptografia de ponta a ponta via Supabase Auth & JWT.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
