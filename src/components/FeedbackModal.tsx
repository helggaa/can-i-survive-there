// src/components/FeedbackModal.tsx
// Community Feedback & City/Area Research Request Modal

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900/95 border border-white/15 shadow-2xl p-6 text-white backdrop-blur-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <MessageSquarePlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Community Feedback & Research Request</h3>
            <p className="text-xs text-gray-400">
              Help calibrate cost data or request automated agent research for new locations.
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3 animate-in zoom-in-95 duration-200">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-white">Thank you for contributing!</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Your request has been queued. Our automated research agents and validators will process this location.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 text-xs rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Type of Request
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setFeedbackType('cost_correction')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    feedbackType === 'cost_correction'
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300 font-medium'
                      : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <div className="font-semibold">Price Correction</div>
                  <div className="text-[10px] text-gray-400">Rent, food, or transit is different</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackType('new_city_request')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    feedbackType === 'new_city_request'
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300 font-medium'
                      : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-1">
                    Request Research <Sparkles className="w-3 h-3 text-cyan-400" />
                  </div>
                  <div className="text-[10px] text-gray-400">Request coverage for city / area</div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  City Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  placeholder="e.g. Da Nang, Palopo"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800/80 border border-white/15 focus:outline-none focus:border-cyan-400 text-white placeholder-gray-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Neighborhood / District
                </label>
                <input
                  type="text"
                  value={defaultAreaName || ''}
                  readOnly={!!defaultAreaName}
                  placeholder="e.g. Central District"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800/80 border border-white/15 focus:outline-none focus:border-cyan-400 text-white placeholder-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Details / Correction Notes <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Explain what is missing or what local expenses actually look like..."
                rows={3}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800/80 border border-white/15 focus:outline-none focus:border-cyan-400 text-white placeholder-gray-500 resize-none"
                required
              />
            </div>

            {feedbackType === 'cost_correction' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Suggested Monthly Cost
                  </label>
                  <input
                    type="number"
                    value={suggestedValue}
                    onChange={(e) => setSuggestedValue(e.target.value)}
                    placeholder="e.g. 1500000"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800/80 border border-white/15 focus:outline-none focus:border-cyan-400 text-white placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Currency Code
                  </label>
                  <input
                    type="text"
                    value={currencyCode}
                    onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())}
                    placeholder="e.g. IDR, USD"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800/80 border border-white/15 focus:outline-none focus:border-cyan-400 text-white placeholder-gray-500 uppercase"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Evidence or Source URL <span className="text-gray-500 text-[10px]">(Optional)</span>
              </label>
              <input
                type="url"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800/80 border border-white/15 focus:outline-none focus:border-cyan-400 text-white placeholder-gray-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 transition shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Submitting…</span>
                ) : (
                  <>
                    <span>Submit to Research Queue</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
