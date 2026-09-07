// src/components/FeedbackModal.tsx
// Community Feedback & City/Area Research Request Modal per UI/UX Pro Max

import React, { useState } from 'react';
import { X, Send, CheckCircle2, MessageSquarePlus, Sparkles } from 'lucide-react';
import { db } from '../services/database';
import type { FeedbackType } from '../types/database.types';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCity?: string;
  initialCityName?: string;
  defaultAreaId?: string;
  defaultAreaName?: string;
  initialAreaName?: string;
  cityId?: string;
  areaId?: string;
  onFeedbackSubmitted?: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = (props) => {
  if (!props.isOpen) return null;
  const key = `${props.initialCityName || props.defaultCity || ''}_${props.areaId || props.defaultAreaId || ''}`;
  return <FeedbackModalDialog key={key} {...props} />;
};

const FeedbackModalDialog: React.FC<FeedbackModalProps> = ({
  onClose,
  defaultCity = '',
  initialCityName,
  defaultAreaId,
  defaultAreaName,
  initialAreaName,
  cityId,
  areaId,
  onFeedbackSubmitted,
}) => {
  const effectiveCity = initialCityName || defaultCity || '';
  const effectiveAreaId = areaId || defaultAreaId || null;
  const effectiveAreaName = initialAreaName || defaultAreaName || null;

  const [feedbackType, setFeedbackType] = useState<FeedbackType>(
    effectiveAreaName ? 'cost_correction' : 'new_city_request'
  );
  const [cityName, setCityName] = useState(effectiveCity);
  const [message, setMessage] = useState('');
  const [suggestedValue, setSuggestedValue] = useState<string>('');
  const [currencyCode, setCurrencyCode] = useState<string>('');
  const [evidenceUrl, setEvidenceUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Close on Escape key press
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityName.trim()) {
      setErrorMsg('Please specify the city name.');
      return;
    }
    if (!message.trim()) {
      setErrorMsg('Please describe your suggestion or research request.');
      return;
    }

    let sanitizedEvidenceUrl: string | null = null;
    if (evidenceUrl.trim()) {
      const raw = evidenceUrl.trim();
      if (raw.startsWith('http://') || raw.startsWith('https://')) {
        sanitizedEvidenceUrl = raw;
      } else if (!raw.includes('://')) {
        sanitizedEvidenceUrl = `https://${raw}`;
      } else {
        setErrorMsg('Invalid evidence URL. Only http:// and https:// links are supported.');
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await db.submitFeedback({
        city_id: cityId || null,
        city_name: cityName.trim(),
        area_id: effectiveAreaId,
        feedback_type: feedbackType,
        message: message.trim(),
        suggested_value: suggestedValue ? parseFloat(suggestedValue) : null,
        currency_code: currencyCode.trim() || null,
        evidence_url: sanitizedEvidenceUrl,
      });

      if (res.success) {
        setIsSuccess(true);
        onFeedbackSubmitted?.();
        setTimeout(() => {
          setIsSuccess(false);
          onClose();
          setMessage('');
          setSuggestedValue('');
          setEvidenceUrl('');
        }, 2000);
      } else {
        setErrorMsg(res.reason || 'Failed to submit feedback.');
      }
    } catch {
      setErrorMsg('Network error. Feedback recorded in local session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(6, 182, 212, 0.12)',
                color: 'var(--accent-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(6, 182, 212, 0.25)',
              }}
            >
              <MessageSquarePlus size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Community Feedback &amp; Research
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Help calibrate data or request automated agent research.
              </p>
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

        {isSuccess ? (
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
              <CheckCircle2 size={28} />
            </div>
            <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Thank You for Contributing!
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: 380, margin: '0 auto', lineHeight: 1.5 }}>
              Your feedback has been queued. Our automated research engine and validators will inspect this location.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {errorMsg && (
                <div className="form-error-alert">
                  {errorMsg}
                </div>
              )}

              {/* Request Type Switcher */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                  Type of Request
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <button
                    type="button"
                    onClick={() => setFeedbackType('cost_correction')}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${feedbackType === 'cost_correction' ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                      background: feedbackType === 'cost_correction' ? 'var(--brand-primary-light)' : 'var(--bg-surface-alt)',
                      color: feedbackType === 'cost_correction' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Price Correction</div>
                    <div style={{ fontSize: '0.6875rem', opacity: 0.8, marginTop: 2 }}>Rent, food, or transit correction</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeedbackType('new_city_request')}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${feedbackType === 'new_city_request' ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                      background: feedbackType === 'new_city_request' ? 'var(--brand-primary-light)' : 'var(--bg-surface-alt)',
                      color: feedbackType === 'new_city_request' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>Request Research</span> <Sparkles size={12} />
                    </div>
                    <div style={{ fontSize: '0.6875rem', opacity: 0.8, marginTop: 2 }}>New city or unmapped area</div>
                  </button>
                </div>
              </div>

              {/* City and Neighborhood Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                    City Name *
                  </label>
                  <input
                    type="text"
                    value={cityName}
                    onChange={(e) => setCityName(e.target.value)}
                    placeholder="e.g. Da Nang, Bandung"
                    className="modal-input"
                    maxLength={100}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                    Neighborhood
                  </label>
                  <input
                    type="text"
                    value={defaultAreaName || ''}
                    readOnly={!!defaultAreaName}
                    placeholder="e.g. Downtown, Coblong"
                    className="modal-input"
                    maxLength={100}
                  />
                </div>
              </div>

              {/* Message / Details */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                  Details / Correction Notes *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Explain what is missing or what local expenses actually look like for students or workers..."
                  rows={3}
                  className="modal-textarea"
                  style={{ resize: 'none' }}
                  maxLength={1000}
                  required
                />
              </div>

              {/* Suggested Value if Cost Correction */}
              {feedbackType === 'cost_correction' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                      Suggested Cost
                    </label>
                    <input
                      type="number"
                      value={suggestedValue}
                      onChange={(e) => setSuggestedValue(e.target.value)}
                      placeholder="e.g. 1500000"
                      className="modal-input"
                      maxLength={15}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                      Currency Code
                    </label>
                    <input
                      type="text"
                      value={currencyCode}
                      onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())}
                      placeholder="e.g. IDR, USD"
                      className="modal-input"
                      style={{ textTransform: 'uppercase' }}
                      maxLength={10}
                    />
                  </div>
                </div>
              )}

              {/* Source URL */}
              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                  Evidence or Source URL (Optional)
                </label>
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://..."
                  className="modal-input"
                  maxLength={250}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Send size={14} />
                <span>{isSubmitting ? 'Submitting…' : 'Submit to Research Queue'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
