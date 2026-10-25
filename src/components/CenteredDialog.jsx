import React, { useEffect, useRef, useId } from "react";
import { createPortal } from "react-dom";
import "./CenteredDialog.css";
export default function CenteredDialog({
  title,
  children,
  onClose,
  busy = false,
  error = "",
  className = "",
  theme = "dark",
  themeAttribute = "data-ca-theme",
}) {
  const ref = useRef(null),
    titleId = useId();
  useEffect(() => {
    const dialog = ref.current,
      previous = document.activeElement,
      overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    dialog
      .querySelector(
        "input:not([disabled]),select:not([disabled]),textarea:not([disabled])",
      )
      ?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return createPortal(
    <dialog
      ref={ref}
      className={className + " central-dialog"}
      {...{ [themeAttribute]: theme }}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <header className="central-dialog-header">
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          aria-label="Fechar edição"
          disabled={busy}
          onClick={onClose}
        >
          ×
        </button>
      </header>
      {error && (
        <p role="alert" className="ca-error">
          {error}
        </p>
      )}
      {children}
    </dialog>,
    document.body,
  );
}
