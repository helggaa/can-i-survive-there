// src/components/SubmitFactModal.tsx
// Crowdsourcing Modal per 03-ux-screens.md (Section 7)

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

    setIsSubmitting(true);
    try {
      const result = await db.submitUserFact({
        area_id: areaData.area.id,
        metric_key: metricKey,
        value: numericAmount,
        note: note.trim() || undefined,
        evidence_url: evidenceUrl.trim() || undefined,
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Submit a Fact</h3>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '0.2rem' }}>
              For <strong>{areaData.area.name}</strong>, {areaData.city.name}
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {submittedSuccess ? (
          <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <CheckCircle size={28} />
            </div>
            <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Thank You for Contributing!</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 380, margin: '0 auto' }}>
              Your observation has been recorded. It is blended in with other reports during data recomputation to keep estimates accurate.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: 'var(--radius-sm)' }}>
                <ShieldCheck size={18} color="var(--accent-secondary)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Wikipedia facts, not direct edits:</strong> Your submission helps refine this area's numbers. It is blended into the algorithm, not shown instantly on its own.
                </div>
              </div>

              {errorMessage && (
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', color: '#fca5a5', fontSize: '0.8125rem' }}>
                  {errorMessage}
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="fact-metric">
                  Metric you are reporting
                </label>
                <select
                  id="fact-metric"
                  className="form-select"
                  value={metricKey}
                  onChange={(e) => setMetricKey(e.target.value)}
                >
                  <option value="rent_or_kost_monthly">Kost / Dorm Monthly Rent</option>
                  <option value="food_meal_avg">Food Cost per Meal (Sit-down meals only)</option>
                  <option value="transport_monthly">Monthly Transport Pass / Commute</option>
                  <option value="grocery_basket">Weekly Grocery Basket for 1 Person</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="fact-amount">
                  Observed Amount ({currency})
                </label>
                <input
                  id="fact-amount"
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder={`e.g. ${currency === 'IDR' ? '1800000' : '850'}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                <span className="form-help-text">
                  Enter the price in local currency ({currency}).
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="fact-note">
                  Context / Note (Optional)
                </label>
                <textarea
                  id="fact-note"
                  rows={2}
                  className="form-textarea"
                  placeholder="e.g. Studio kost with private bathroom and AC included."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="fact-evidence">
                  Source / Listing URL (Optional)
                </label>
                <input
                  id="fact-evidence"
                  type="url"
                  className="form-input"
                  placeholder="https://..."
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
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
