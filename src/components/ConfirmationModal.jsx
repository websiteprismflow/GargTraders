import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmationModal({
  isOpen,
  title = 'Confirm Action',
  message,
  warning,
  confirmLabel = 'Confirm Delete',
  cancelLabel = 'Cancel',
  isDanger = true,
  loading = false,
  onConfirm,
  onClose
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: isDanger ? 'var(--danger-light)' : 'var(--brass-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDanger ? 'var(--danger)' : 'var(--brass-primary)'
            }}>
              <AlertTriangle size={18} />
            </div>
            <h3 style={{ fontSize: '1.2rem' }}>{title}</h3>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)' }} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ marginBottom: warning ? '1rem' : 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {message}
          </p>
          {warning && (
            <div style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--danger-light)',
              color: 'var(--danger)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              lineHeight: 1.5,
              fontWeight: 500
            }}>
              {warning}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          {!warning && (
            <button
              type="button"
              className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? 'Processing...' : confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
