// src/components/SubmitFactModal.tsx
// Crowdsourcing Modal per UI/UX Pro Max cyber-fintech specification

import React, { useState } from 'react';
import { X, Send, CheckCircle, ShieldCheck } from 'lucide-react';
import type { AreaExpenseBreakdown } from '../types/database.types';
import { db } from '../services/database';

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

    const trimmedEvidence = evidenceUrl.trim();
    if (trimmedEvidence) {
      if (!trimmedEvidence.startsWith('http://') && !trimmedEvidence.startsWith('https://')) {
        setErrorMessage('Invalid source link. Evidence URLs must start with http:// or https://');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const result = await db.submitUserFact({
        area_id: areaData.area.id,
        metric_key: metricKey,
        value: numericAmount,
        note: note.trim().slice(0, 500) || undefined,
        evidence_url: trimmedEvidence.slice(0, 250) || undefined,
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

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Submit Neighborhood Fact
            </h3>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '0.2rem' }}>
              For <strong>{areaData.area.name}</strong>, {areaData.city.name}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'var(--bg-surface-alt)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xs)',
              color: 'var(--text-secondary)',
              padding: '0.4rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {submittedSuccess ? (
          <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <CheckCircle size={28} />
            </div>
            <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Thank You for Contributing!
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: 380, margin: '0 auto', lineHeight: 1.5 }}>
              Your observation has been verified and recorded. It is blended in during data recomputation to keep estimates accurate.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  background: 'rgba(6, 182, 212, 0.08)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1.25rem',
                }}
              >
                <ShieldCheck size={18} color="var(--accent-secondary)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Wikipedia facts, not direct edits:</strong> Submissions are verified and blended into the algorithm, preventing bad-faith price manipulations.
                </div>
              </div>

              {errorMessage && (
                <div className="form-error-alert">
                  {errorMessage}
                </div>
              )}

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.45rem' }} htmlFor="fact-metric">
                  Metric you are reporting
                </label>
                <select
                  id="fact-metric"
                  className="modal-select"
                  value={metricKey}
                  onChange={(e) => setMetricKey(e.target.value)}
                >
                  <option value="rent_or_kost_monthly">Kost / Student Room Monthly Rent</option>
                  <option value="food_meal_avg">Food Cost per Meal (Sit-down / warung meal)</option>
                  <option value="transport_monthly">Monthly Transit Pass / Daily Commute</option>
                  <option value="grocery_basket">Weekly Grocery Basket for 1 Person</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.45rem' }} htmlFor="fact-amount">
                  Observed Amount ({currency})
                </label>
                <input
                  id="fact-amount"
                  type="number"
                  step="any"
                  className="modal-input"
                  placeholder={`e.g. ${currency === 'IDR' ? '1800000' : '850'}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  maxLength={15}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.45rem' }} htmlFor="fact-note">
                  Context / Note (Optional)
                </label>
                <textarea
                  id="fact-note"
                  rows={2}
                  className="modal-textarea"
                  style={{ resize: 'none' }}
                  placeholder="e.g. Single student room kost with AC and private bathroom."
                  value={note}
                  maxLength={500}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.45rem' }} htmlFor="fact-evidence">
                  Source / Listing Link (Optional)
                </label>
                <input
                  id="fact-evidence"
                  type="url"
                  className="modal-input"
                  placeholder="https://..."
                  value={evidenceUrl}
                  maxLength={250}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Send size={14} />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Fact'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SubmitFactModal;
