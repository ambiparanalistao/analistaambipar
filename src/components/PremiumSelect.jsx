import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * PremiumSelect - Componente de Dropdown Moderno, Glassmórfico e Elegante
 * Substitui os <select> nativos do navegador por uma experiência rica com
 * animações, ícones, subtítulos, badges de status e fechamento inteligente.
 */
export default function PremiumSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Selecione uma opção...',
  icon: LeadingIcon,
  size = 'default', // 'default' | 'sm' | 'inline'
  className = '',
  disabled = false,
  id
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Fecha ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (optValue) => {
    onChange(optValue);
    setIsOpen(false);
  };

  return (
    <div 
      className={`premium-select-container ${size} ${className} ${isOpen ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''}`}
      ref={containerRef}
      id={id}
      style={{ zIndex: isOpen ? 9999 : 'auto', position: 'relative' }}
    >
      {/* Botão Gatilho (Trigger) */}
      <button
        type="button"
        className="premium-select-trigger"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
      >
        <div className="premium-select-trigger-content">
          {LeadingIcon && (
            <span className="premium-select-leading-icon">
              <LeadingIcon size={16} />
            </span>
          )}

          {selectedOption?.color && (
            <span 
              className="premium-select-dot" 
              style={{ backgroundColor: selectedOption.color, boxShadow: `0 0 8px ${selectedOption.color}` }}
            />
          )}

          {selectedOption?.icon && (
            <span className="premium-select-custom-icon">{selectedOption.icon}</span>
          )}

          <div className="premium-select-label-wrap">
            <span className="premium-select-main-label">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            {selectedOption?.sublabel && size !== 'inline' && size !== 'sm' && (
              <span className="premium-select-sublabel-preview">
                {selectedOption.sublabel}
              </span>
            )}
          </div>
        </div>

        <ChevronDown 
          size={16} 
          className={`premium-select-arrow ${isOpen ? 'rotated' : ''}`} 
        />
      </button>

      {/* Menu Flutuante (Dropdown List) */}
      {isOpen && (
        <div className="premium-select-dropdown animate-scale-dropdown" role="listbox">
          <div className="premium-select-options-list">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  className={`premium-select-option ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => handleSelect(opt.value)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="premium-select-option-left">
                    {opt.color && (
                      <span 
                        className="premium-select-dot" 
                        style={{ backgroundColor: opt.color, boxShadow: `0 0 8px ${opt.color}` }} 
                      />
                    )}
                    {opt.icon && (
                      <span className="premium-select-custom-icon">{opt.icon}</span>
                    )}
                    <div className="premium-select-option-text">
                      <span className="premium-select-option-label">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="premium-select-option-sublabel">{opt.sublabel}</span>
                      )}
                    </div>
                  </div>

                  <div className="premium-select-option-right">
                    {opt.badge && (
                      <span className={`premium-select-badge ${opt.badgeType || 'default'}`}>
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && (
                      <Check size={16} className="premium-select-check-icon" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
