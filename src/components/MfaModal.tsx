import React, { useState } from 'react';
import { X, ShieldCheck, Key, Check, AlertCircle } from 'lucide-react';

interface MfaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mfaEnabled: boolean;
  onToggleMfa: (enabled: boolean) => void;
}

export default function MfaModal({ isOpen, onClose, mfaEnabled, onToggleMfa }: MfaModalProps) {
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.length < 6) {
      setError('Please enter a 6-digit TOTP verification code.');
      return;
    }
    setError('');
    setSuccess(true);
    setTimeout(() => {
      onToggleMfa(!mfaEnabled);
      setSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-100">Multi-Factor Authentication (2FA)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs text-slate-300 space-y-3">
          <p>
            Protect administrative operations across the 256-node neural mesh by enforcing Time-Based One-Time Passwords (TOTP).
          </p>

          {/* Mock QR box */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center gap-2">
            <div className="w-28 h-28 bg-white p-2 rounded-lg flex items-center justify-center shadow">
              <div className="grid grid-cols-6 gap-1 w-full h-full">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div
                    key={i}
                    className={`${(i * 7) % 3 === 0 ? 'bg-black' : 'bg-transparent'} rounded-[1px]`}
                  />
                ))}
              </div>
            </div>
            <span className="font-mono text-[10px] text-slate-400">Secret: MESH-AUTH-7X99-CORTEX</span>
          </div>

          <form onSubmit={handleVerify} className="space-y-3">
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Enter 6-Digit Authenticator Code</label>
              <input
                id="mfa-code-input"
                type="text"
                maxLength={6}
                placeholder="123456"
                value={totpCode}
                onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 font-mono text-center text-base tracking-widest text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {error && (
              <div className="p-2 bg-rose-950/40 border border-rose-800 rounded text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-2 bg-emerald-950/40 border border-emerald-800 rounded text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>Verification Successful! Updating security policy...</span>
              </div>
            )}

            <button
              id="confirm-mfa-btn"
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-md transition-all"
            >
              {mfaEnabled ? 'Disable 2FA' : 'Verify & Enable 2FA'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
