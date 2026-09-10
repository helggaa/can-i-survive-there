// src/components/FeedbackModal.tsx
// Survive Atlas — Community Feedback & Research Request Modal (glassmorphic premium)

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, CheckCircle2, MessageSquarePlus, Sparkles } from 'lucide-react';
import { db } from '../services/database';
import type { FeedbackType } from '../types/database.types';
import { sanitizeTextInput, sanitizeExternalLink } from '../utils/security';

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
  const effectiveCity     = initialCityName || defaultCity || '';
  const effectiveAreaId   = areaId || defaultAreaId || null;
  const effectiveAreaName = initialAreaName || defaultAreaName || null;

  const [feedbackType, setFeedbackType] = useState<FeedbackType>(
    effectiveAreaName ? 'cost_correction' : 'new_city_request'
  );
  const [cityName, setCityName]           = useState(effectiveCity);
  const [message, setMessage]             = useState('');
  const [suggestedValue, setSuggestedValue] = useState<string>('');
  const [currencyCode, setCurrencyCode]   = useState<string>('');
  const [evidenceUrl, setEvidenceUrl]     = useState<string>('');
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [isSuccess, setIsSuccess]         = useState(false);
  const [errorMsg, setErrorMsg]           = useState<string | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  React.useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = orig; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCity    = sanitizeTextInput(cityName, 100);
    const cleanMessage = sanitizeTextInput(message, 1000);
    const cleanCurrency = sanitizeTextInput(currencyCode, 10).toUpperCase();
    if (!cleanCity)    { setErrorMsg('Please specify the city name.'); return; }
    if (!cleanMessage) { setErrorMsg('Please describe your suggestion.'); return; }
    let sanitizedEvidenceUrl: string | null = null;
    if (evidenceUrl.trim()) {
      sanitizedEvidenceUrl = sanitizeExternalLink(evidenceUrl.trim());
      if (!sanitizedEvidenceUrl) { setErrorMsg('Invalid evidence URL. Only http:// and https:// links are supported.'); return; }
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await db.submitFeedback({
        city_id: cityId || null, city_name: cleanCity,
        area_id: effectiveAreaId, feedback_type: feedbackType,
        message: cleanMessage,
        suggested_value: suggestedValue ? parseFloat(suggestedValue) : null,
        currency_code: cleanCurrency || null,
        evidence_url: sanitizedEvidenceUrl,
      });
      if (res.success) {
        setIsSuccess(true);
        onFeedbackSubmitted?.();
        setTimeout(() => { setIsSuccess(false); onClose(); setMessage(''); setSuggestedValue(''); setEvidenceUrl(''); }, 2000);
      } else {
        setErrorMsg(res.reason || 'Failed to submit feedback.');
      }
    } catch {
      setErrorMsg('Network error. Feedback recorded in local session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--brand-primary-light)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(59,130,246,0.25)' }}>
              <MessageSquarePlus size={19} />
            </div>
            <div>
              <h3 className="modal-title">Community Feedback &amp; Research</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Help calibrate data or request automated agent research.
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={17} />
          </button>
        </div>

        {/* Content */}
        {isSuccess ? (
          <div className="modal-success-state">
            <div className="modal-success-icon">
              <CheckCircle2 size={26} />
            </div>
            <p className="modal-success-title">Thank You for Contributing!</p>
            <p className="modal-success-desc">
              Your feedback has been queued. Our automated research engine will inspect this location.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {errorMsg && (
                <div className="modal-error-banner">
                  {errorMsg}
                </div>
              )}

              {/* Request type tabs */}
              <div className="modal-input-group">
                <label className="modal-label">Type of Request</label>
                <div className="feedback-type-tabs">
                  <button
                    type="button"
                    className={`feedback-type-tab ${feedbackType === 'cost_correction' ? 'active' : ''}`}
                    onClick={() => setFeedbackType('cost_correction')}
                  >
                    Price Correction
                  </button>
                  <button
                    type="button"
                    className={`feedback-type-tab ${feedbackType === 'new_city_request' ? 'active' : ''}`}
                    onClick={() => setFeedbackType('new_city_request')}
                  >
                    <Sparkles size={11} style={{ display: 'inline', marginRight: 4 }} />
                    Request Research
                  </button>
                  <button
                    type="button"
                    className={`feedback-type-tab ${feedbackType === 'new_area_request' ? 'active' : ''}`}
                    onClick={() => setFeedbackType('new_area_request')}
                  >
                    New Area Request
                  </button>
                  <button
                    type="button"
                    className={`feedback-type-tab ${feedbackType === 'general_feedback' ? 'active' : ''}`}
                    onClick={() => setFeedbackType('general_feedback')}
                  >
                    General Feedback
                  </button>
                </div>
              </div>

              {/* City / Neighborhood */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="modal-input-group">
                  <label className="modal-label" htmlFor="fb-city">City Name *</label>
                  <input
                    id="fb-city"
                    type="text"
                    value={cityName}
                    onChange={(e) => setCityName(e.target.value)}
                    placeholder="e.g. Da Nang, Bandung"
                    className="modal-input"
                    maxLength={100}
                    required
                  />
                </div>
                <div className="modal-input-group">
                  <label className="modal-label" htmlFor="fb-area">Neighborhood</label>
                  <input
                    id="fb-area"
                    type="text"
                    value={effectiveAreaName || ''}
                    readOnly={!!effectiveAreaName}
                    placeholder="e.g. Downtown, Coblong"
                    className="modal-input"
                    maxLength={100}
                  />
                </div>
              </div>

              {/* Message */}
              <div className="modal-input-group">
                <label className="modal-label" htmlFor="fb-message">Details / Correction Notes *</label>
                <textarea
                  id="fb-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Explain what is missing or what local expenses actually look like for students or workers..."
                  className="modal-input modal-textarea"
                  maxLength={1000}
                  required
                />
              </div>

              {/* Suggested value if cost correction */}
              {feedbackType === 'cost_correction' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="modal-input-group">
                    <label className="modal-label" htmlFor="fb-value">Suggested Cost</label>
                    <input
                      id="fb-value"
                      type="number"
                      value={suggestedValue}
                      onChange={(e) => setSuggestedValue(e.target.value)}
                      placeholder="e.g. 1500000"
                      className="modal-input"
                      maxLength={15}
                    />
                  </div>
                  <div className="modal-input-group">
                    <label className="modal-label" htmlFor="fb-currency">Currency Code</label>
                    <input
                      id="fb-currency"
                      type="text"
                      value={currencyCode}
                      onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())}
                      placeholder="IDR, USD…"
                      className="modal-input"
                      style={{ textTransform: 'uppercase' }}
                      maxLength={10}
                    />
                  </div>
                </div>
              )}

              {/* Evidence URL */}
              <div className="modal-input-group">
                <label className="modal-label" htmlFor="fb-url">Evidence or Source URL (Optional)</label>
                <input
                  id="fb-url"
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
              <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                <Send size={14} />
                {isSubmitting ? 'Submitting…' : 'Submit to Research Queue'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

export default FeedbackModal;
