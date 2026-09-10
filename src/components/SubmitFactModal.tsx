// src/components/SubmitFactModal.tsx
// Crowdsourcing Modal per UI/UX Pro Max cyber-fintech specification

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, CheckCircle, ShieldCheck } from 'lucide-react';
import type { AreaExpenseBreakdown } from '../types/database.types';
import { db } from '../services/database';
import { isSafeUrl, sanitizeTextInput } from '../utils/security';

interface SubmitFactModalProps {
  areaData: AreaExpenseBreakdown | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

export const SubmitFactModal: React.FC<SubmitFactModalProps> = ({
  areaData,
  isOpen,
  onClose,
  onSubmitted,
}) => {
  const [metricKey, setMetricKey] = useState<string>('rent_or_kost_monthly');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [evidenceUrl, setEvidenceUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Close on Escape key press
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background body scroll while modal is open, allowing only the modal form to scroll
  React.useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
    };
  }, [isOpen]);

  if (!isOpen || !areaData) return null;

  const currency = areaData.country?.currency_code || 'IDR';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const numericAmount = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage('Please enter a valid positive amount.');
      return;
    }

    const sanitizedNote = sanitizeTextInput(note, 500);
    const trimmedEvidence = evidenceUrl.trim();
    if (trimmedEvidence) {
      if (!isSafeUrl(trimmedEvidence)) {
        setErrorMessage('Invalid source link. Only valid http:// and https:// URLs are supported.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const result = await db.submitUserFact({
        area_id: areaData.area.id,
        metric_key: metricKey,
        value: numericAmount,
        note: sanitizedNote || undefined,
        evidence_url: trimmedEvidence.slice(0, 500) || undefined,
      });

      if (result.success) {
        setSubmittedSuccess(true);
        await db.recomputeAreaMetrics(areaData.area.id);
        setTimeout(() => {
          setIsSubmitting(false);
          setSubmittedSuccess(false);
          setAmount('');
          setNote('');
          setEvidenceUrl('');
          onSubmitted();
          onClose();
        }, 1800);
      } else {
        setIsSubmitting(false);
        setErrorMessage(result.reason || 'Failed to record submission. Please check your input.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'An unexpected error occurred.');
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Submit Neighborhood Fact</h3>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 2 }}>
              For <strong style={{ color: 'var(--text-primary)' }}>{areaData.area.name}</strong>, {areaData.city.name}
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={17} />
          </button>
        </div>

        {submittedSuccess ? (
          <div className="modal-success-state">
            <div className="modal-success-icon">
              <CheckCircle size={26} />
            </div>
            <p className="modal-success-title">Thank You for Contributing!</p>
            <p className="modal-success-desc">
              Your observation has been recorded and factored into subsequent metric recomputations.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '0.65rem', padding: '0.75rem 1rem', background: 'var(--brand-primary-light)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                <ShieldCheck size={17} style={{ color: 'var(--brand-primary)', flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Evidence-backed submissions</strong> are reviewed and aggregated into metric samples.
                </div>
              </div>

              {errorMessage && (
                <div className="modal-error-banner">{errorMessage}</div>
              )}

              <div className="modal-input-group">
                <label className="modal-label" htmlFor="fact-metric">Metric you are reporting</label>
                <select id="fact-metric" className="modal-select" value={metricKey} onChange={(e) => setMetricKey(e.target.value)}>
                  <option value="rent_or_kost_monthly">Kost / Student Room Monthly Rent</option>
                  <option value="food_meal_avg">Food Cost per Meal (Sit-down / warung meal)</option>
                  <option value="transport_monthly">Monthly Transit Pass / Daily Commute</option>
                  <option value="grocery_basket">Weekly Grocery Basket for 1 Person</option>
                </select>
              </div>

              <div className="modal-input-group">
                <label className="modal-label" htmlFor="fact-amount">Observed Amount ({currency})</label>
                <input
                  id="fact-amount" type="number" step="any"
                  className="modal-input"
                  placeholder={`e.g. ${currency === 'IDR' ? '1800000' : '850'}`}
                  value={amount} onChange={(e) => setAmount(e.target.value)}
                  maxLength={15} required
                />
              </div>

              <div className="modal-input-group">
                <label className="modal-label" htmlFor="fact-note">Context / Note (Optional)</label>
                <textarea
                  id="fact-note" rows={2}
                  className="modal-input modal-textarea"
                  placeholder="e.g. Single student room kost with AC and private bathroom."
                  value={note} maxLength={500} onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div className="modal-input-group">
                <label className="modal-label" htmlFor="fact-evidence">Source / Listing Link (Optional)</label>
                <input
                  id="fact-evidence" type="url" className="modal-input"
                  placeholder="https://..."
                  value={evidenceUrl} maxLength={250} onChange={(e) => setEvidenceUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                <Send size={14} />
                {isSubmitting ? 'Submitting…' : 'Submit Fact'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

export default SubmitFactModal;
