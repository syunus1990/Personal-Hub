import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Lock,
  Unlock,
  Fingerprint,
  Clock,
  Check,
  AlertCircle,
  Key,
} from 'lucide-react';
import { SecuritySettings, AutoLockTimeout } from '../../types';
import { generateSalt, hashPin } from '../../utils/cryptoUtils';
import { isBiometricsAvailable, registerBiometrics } from '../../utils/biometrics';

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  securitySettings: SecuritySettings;
  onUpdateSecuritySettings: (newSettings: SecuritySettings) => void;
  onLockNow: () => void;
}

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({
  isOpen,
  onClose,
  securitySettings,
  onUpdateSecuritySettings,
  onLockNow,
}) => {
  const [isPinEnabled, setIsPinEnabled] = useState(securitySettings.isPinEnabled);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(
    securitySettings.isBiometricEnabled
  );
  const [autoLockTimeout, setAutoLockTimeout] = useState<AutoLockTimeout>(
    securitySettings.autoLockTimeout || '5m'
  );
  const [biometricsSupported, setBiometricsSupported] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  useEffect(() => {
    setIsPinEnabled(securitySettings.isPinEnabled);
    setIsBiometricEnabled(securitySettings.isBiometricEnabled);
    setAutoLockTimeout(securitySettings.autoLockTimeout || '5m');
    setNewPin('');
    setConfirmPin('');
    setFeedback(null);

    isBiometricsAvailable().then((supported) => {
      setBiometricsSupported(supported);
    });
  }, [securitySettings, isOpen]);

  if (!isOpen) return null;

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4 || newPin.length > 6) {
      setFeedback({ type: 'error', message: 'PIN must be between 4 and 6 digits' });
      return;
    }
    if (newPin !== confirmPin) {
      setFeedback({ type: 'error', message: 'PINs do not match' });
      return;
    }

    const salt = generateSalt(16);
    const pinHash = await hashPin(newPin, salt);

    const updated: SecuritySettings = {
      ...securitySettings,
      isPinEnabled: true,
      pinHash,
      pinSalt: salt,
      autoLockTimeout,
    };

    onUpdateSecuritySettings(updated);
    setIsPinEnabled(true);
    setNewPin('');
    setConfirmPin('');
    setFeedback({ type: 'success', message: 'PIN Lock enabled successfully.' });
  };

  const handleDisablePin = () => {
    const updated: SecuritySettings = {
      ...securitySettings,
      isPinEnabled: false,
      pinHash: undefined,
      pinSalt: undefined,
      isBiometricEnabled: false,
    };
    onUpdateSecuritySettings(updated);
    setIsPinEnabled(false);
    setIsBiometricEnabled(false);
    setFeedback({ type: 'success', message: 'PIN Lock has been disabled.' });
  };

  const handleToggleBiometrics = async () => {
    if (!isPinEnabled) {
      setFeedback({ type: 'error', message: 'Please enable a PIN before enabling Biometrics.' });
      return;
    }

    if (!isBiometricEnabled) {
      // Register biometrics
      const registered = await registerBiometrics();
      if (registered || biometricsSupported) {
        const updated: SecuritySettings = {
          ...securitySettings,
          isBiometricEnabled: true,
        };
        onUpdateSecuritySettings(updated);
        setIsBiometricEnabled(true);
        setFeedback({ type: 'success', message: 'Biometric Unlock enabled.' });
      } else {
        setFeedback({
          type: 'error',
          message: 'Could not register biometrics on this device.',
        });
      }
    } else {
      const updated: SecuritySettings = {
        ...securitySettings,
        isBiometricEnabled: false,
      };
      onUpdateSecuritySettings(updated);
      setIsBiometricEnabled(false);
      setFeedback({ type: 'success', message: 'Biometric Unlock disabled.' });
    }
  };

  const handleChangeTimeout = (timeout: AutoLockTimeout) => {
    setAutoLockTimeout(timeout);
    const updated: SecuritySettings = {
      ...securitySettings,
      autoLockTimeout: timeout,
    };
    onUpdateSecuritySettings(updated);
  };

  return (
    <div
      id="security-settings-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="security-settings-modal"
        className="w-full max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/40 dark:border-slate-800/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Privacy & Security
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Protect sensitive financial & personal data with PIN & Biometrics
              </p>
            </div>
          </div>
          <button
            id="close-security-modal-btn"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl border text-xs font-medium flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* PIN Lock Toggle Section */}
          <div className="p-4 rounded-3xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  {isPinEnabled ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    App PIN Lock
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isPinEnabled ? 'PIN lock is active' : 'Lock your hub with a secure 4-6 digit PIN'}
                  </p>
                </div>
              </div>

              {isPinEnabled && (
                <button
                  id="disable-pin-btn"
                  type="button"
                  onClick={handleDisablePin}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-300 text-xs font-bold transition-colors"
                >
                  Disable PIN
                </button>
              )}
            </div>

            {/* Set or Change PIN Form */}
            <form onSubmit={handleSavePin} className="space-y-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                {isPinEnabled ? 'Change PIN' : 'Set New PIN (4-6 digits)'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  id="new-pin-input"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="New PIN (e.g. 1234)"
                  className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
                <input
                  id="confirm-pin-input"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Confirm PIN"
                  className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div className="flex justify-end">
                <button
                  id="save-pin-btn"
                  type="submit"
                  disabled={!newPin || !confirmPin}
                  className="px-5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-sm"
                >
                  {isPinEnabled ? 'Update PIN' : 'Enable PIN Lock'}
                </button>
              </div>
            </form>
          </div>

          {/* Biometrics Toggle */}
          <div className="p-4 rounded-3xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Fingerprint className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Biometric Unlock
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {biometricsSupported
                    ? 'Use Fingerprint / Face ID to unlock instantly'
                    : 'Device WebAuthn & biometric hardware support'}
                </p>
              </div>
            </div>

            <button
              id="toggle-biometrics-btn"
              type="button"
              onClick={handleToggleBiometrics}
              disabled={!isPinEnabled}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                isBiometricEnabled && isPinEnabled
                  ? 'bg-indigo-600'
                  : 'bg-slate-300 dark:bg-slate-700'
              } ${!isPinEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform transform absolute top-0.5 ${
                  isBiometricEnabled && isPinEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Auto Lock Timeout */}
          {isPinEnabled && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Auto-Lock Hub</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'immediately', label: 'Immediately' },
                  { id: '1m', label: '1 Minute' },
                  { id: '5m', label: '5 Minutes' },
                  { id: '15m', label: '15 Minutes' },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleChangeTimeout(option.id as AutoLockTimeout)}
                    className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all ${
                      autoLockTimeout === option.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-100/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lock App Now Button */}
          {isPinEnabled && (
            <div className="pt-2">
              <button
                id="lock-app-now-btn"
                type="button"
                onClick={() => {
                  onClose();
                  onLockNow();
                }}
                className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <Lock className="w-4 h-4" />
                <span>Lock Hub Now</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
