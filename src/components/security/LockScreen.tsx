import React, { useState, useEffect, useRef } from 'react';
import { Lock, Fingerprint, Delete, Shield, Check } from 'lucide-react';
import { SecuritySettings } from '../../types';
import { verifyPin } from '../../utils/cryptoUtils';
import { authenticateWithBiometrics, isBiometricsAvailable } from '../../utils/biometrics';

interface LockScreenProps {
  securitySettings: SecuritySettings;
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  securitySettings,
  onUnlock,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    isBiometricsAvailable().then((available) => {
      setHasBiometrics(available && securitySettings.isBiometricEnabled);
      // If biometrics enabled, automatically prompt once on mount
      if (available && securitySettings.isBiometricEnabled) {
        handleBiometricAuth();
      }
    });

    // Auto-focus physical input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [securitySettings]);

  const handleBiometricAuth = async () => {
    setIsVerifying(true);
    const success = await authenticateWithBiometrics();
    setIsVerifying(false);
    if (success) {
      onUnlock();
    }
  };

  const handleKeypadPress = async (digit: string) => {
    if (pin.length >= 6) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError('');

    // Check if entered PIN matches (support 4 or 6 digit PINs)
    if (newPin.length >= 4 && securitySettings.pinHash && securitySettings.pinSalt) {
      const isValid = await verifyPin(
        newPin,
        securitySettings.pinHash,
        securitySettings.pinSalt
      );
      if (isValid) {
        onUnlock();
      } else if (newPin.length === 6) {
        setError('Incorrect PIN. Please try again.');
        setPin('');
      }
    }
  };

  const handleDeleteDigit = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleManualSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin) return;

    if (securitySettings.pinHash && securitySettings.pinSalt) {
      const isValid = await verifyPin(
        pin,
        securitySettings.pinHash,
        securitySettings.pinSalt
      );
      if (isValid) {
        onUnlock();
      } else {
        setError('Incorrect PIN');
        setPin('');
      }
    }
  };

  return (
    <div
      id="app-lock-screen"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-slate-950/85 backdrop-blur-2xl text-white select-none animate-fade-in"
    >
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6">
        {/* Hub Logo & Lock Icon */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-xl shadow-indigo-500/20 border border-white/20">
            <Lock className="w-9 h-9 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-slate-950 text-white">
            <Shield className="w-4 h-4" />
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Personal Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Private data is locked. Enter PIN or authenticate to continue.
          </p>
        </div>

        {/* PIN Dots Indicator */}
        <div className="flex items-center justify-center gap-3.5 py-2">
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const isFilled = index < pin.length;
            return (
              <div
                key={index}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-indigo-400 scale-110 shadow-sm shadow-indigo-400'
                    : 'bg-slate-700/80 border border-slate-600'
                }`}
              />
            );
          })}
        </div>

        {/* Hidden native input for keyboard users */}
        <form onSubmit={handleManualSubmit} className="sr-only">
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setPin(val);
            }}
          />
        </form>

        {/* Error message */}
        {error && (
          <div className="px-4 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold animate-shake">
            {error}
          </div>
        )}

        {/* Numeric Touch Keypad */}
        <div className="grid grid-cols-3 gap-3.5 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              id={`pin-keypad-${digit}`}
              type="button"
              onClick={() => handleKeypadPress(digit)}
              className="h-16 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/10 text-xl font-bold text-white transition-all flex items-center justify-center backdrop-blur-md"
            >
              {digit}
            </button>
          ))}

          {/* Biometrics or Clear */}
          {hasBiometrics ? (
            <button
              id="biometric-unlock-btn"
              type="button"
              onClick={handleBiometricAuth}
              disabled={isVerifying}
              className="h-16 rounded-2xl bg-indigo-600/30 hover:bg-indigo-600/50 active:scale-95 border border-indigo-500/30 text-indigo-300 transition-all flex flex-col items-center justify-center"
              title="Use Fingerprint / Face ID"
            >
              <Fingerprint className="w-6 h-6" />
              <span className="text-[10px] font-medium mt-0.5">Biometric</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleClear}
              className="h-16 rounded-2xl bg-white/5 hover:bg-white/15 active:scale-95 text-xs font-bold text-slate-400 transition-all flex items-center justify-center"
            >
              Clear
            </button>
          )}

          {/* Zero digit */}
          <button
            id="pin-keypad-0"
            type="button"
            onClick={() => handleKeypadPress('0')}
            className="h-16 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/10 text-xl font-bold text-white transition-all flex items-center justify-center backdrop-blur-md"
          >
            0
          </button>

          {/* Delete backspace button */}
          <button
            id="pin-keypad-delete"
            type="button"
            onClick={handleDeleteDigit}
            className="h-16 rounded-2xl bg-white/5 hover:bg-white/15 active:scale-95 text-slate-300 transition-all flex items-center justify-center"
            title="Delete"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        {/* Unlock Button if 4+ digits */}
        {pin.length >= 4 && (
          <button
            id="submit-unlock-btn"
            type="button"
            onClick={() => handleManualSubmit()}
            className="w-full max-w-[280px] py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Unlock Personal Hub</span>
          </button>
        )}
      </div>
    </div>
  );
};
