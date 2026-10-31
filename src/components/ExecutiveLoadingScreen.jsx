import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cpu, Database, Radio, CheckCircle2 } from 'lucide-react';

export default function ExecutiveLoadingScreen({ message = 'Conectando aos serviços da Ambipar...' }) {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    'Autenticando credenciais de analista...',
    'Conectando à Central de Gestão (Bases Vale & DCX)...',
    'Sincronizando telemetria e conformidade da frota...',
    'Preparando estação de trabalho do analista...'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 700);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="executive-preloader" id="app-loading-state" role="status" aria-label="Carregando plataforma">
      {/* Luzes de fundo atmosféricas */}
      <div className="preloader-ambient-glow glow-emerald"></div>
      <div className="preloader-ambient-glow glow-cyan"></div>

      <div className="preloader-card">
        {/* Emblema Tecnológico Ambipar */}
        <div className="preloader-emblem">
          <div className="emblem-outer-ring"></div>
          <div className="emblem-pulse-ring"></div>
          <div className="emblem-core">
            <svg viewBox="0 0 40 40" className="ambipar-vector-logo" fill="none">
              <path
                d="M20 4L32 10.5V23.5L20 30L8 23.5V10.5L20 4Z"
                stroke="url(#preloader-grad-cyan)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 10L28 14.5V23.5L20 28L12 23.5V14.5L20 10Z"
                fill="url(#preloader-grad-emerald)"
                fillOpacity="0.25"
                stroke="#10b981"
                strokeWidth="1.8"
              />
              <circle cx="20" cy="19" r="3.5" fill="#34d399" />
              <defs>
                <linearGradient id="preloader-grad-cyan" x1="8" y1="4" x2="32" y2="30" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#06b6d4" />
                  <stop offset="1" stopColor="#10b981" />
                </linearGradient>
                <linearGradient id="preloader-grad-emerald" x1="12" y1="10" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#10b981" />
                  <stop offset="1" stopColor="#059669" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Título e Subtítulo Executivos */}
        <div className="preloader-text-group">
          <div className="preloader-badge">
            <Radio size={12} className="preloader-beacon" />
            <span>SISTEMA OPERACIONAL AMBIPAR</span>
          </div>
          <h1 className="preloader-title">
            Ambipar <span className="text-gradient-cyan">Logistics</span>
          </h1>
          <p className="preloader-subtitle">Central de Gestão de Frota, Logística & Conformidade</p>
        </div>

        {/* Barra de Progresso Cyberpunk/Executiva */}
        <div className="preloader-progress-track">
          <div className="preloader-progress-bar">
            <div className="progress-shimmer"></div>
          </div>
        </div>

        {/* Micro-mensagens de Status em Tempo Real */}
        <div className="preloader-status-row">
          <span className="status-dot"></span>
          <span className="status-current-step">{steps[stepIndex] || message}</span>
        </div>

        {/* Rodapé Tecnológico com Indicadores */}
        <div className="preloader-security-footer">
          <div className="sec-item">
            <ShieldCheck size={13} />
            <span>Sessão Blindada</span>
          </div>
          <div className="sec-divider"></div>
          <div className="sec-item">
            <Database size={13} />
            <span>Bases Vale & DCX</span>
          </div>
          <div className="sec-divider"></div>
          <div className="sec-item">
            <Cpu size={13} />
            <span>Telemetria Ativa</span>
          </div>
        </div>
      </div>
    </div>
  );
}

