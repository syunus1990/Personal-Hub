import React, { useState, useRef } from 'react';
import {
  X,
  Sun,
  Moon,
  Laptop,
  ArrowRightLeft,
  Download,
  Upload,
  FileSpreadsheet,
  RotateCcw,
  AlertTriangle,
  Smartphone,
  Check,
  Sparkles,
  Info,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  FileCode,
  Tag,
  ClipboardPaste,
  FileText,
  Camera,
  Wifi,
  ScanLine,
  QrCode,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { triggerHaptic } from '../../utils/haptics';
import { parseExcelFile, ImportResult } from '../../utils/excel';
import { CURRENCY_LIST, getCurrencyConfig } from '../../utils/currency';
import { Currency } from '../../types';

export const SettingsModal: React.FC = () => {
  const {
    settings,
    updateSettings,
    isSettingsOpen,
    setIsSettingsOpen,
    toggleCurrency,
    setExchangeRate,
    toggleFullscreen,
    exportDataToExcel,
    exportDataToJson,
    downloadTemplate,
    applyImportData,
    importJsonBackup,
    resetAllData,
    setIsPwaGuideOpen,
    openSyncModal,
    gateState,
    dataVersion,
    isGateEnforced,
    setIsGateEnforced,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rateInput, setRateInput] = useState<string>(settings.exchangeRateSARtoINR.toString());
  const [brandingInput, setBrandingInput] = useState<string>(settings.brandingLabel || 'Prime Edition');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<ImportResult | null>(null);
  const [jsonBackupPreview, setJsonBackupPreview] = useState<any | null>(null);
  const [showPasteJson, setShowPasteJson] = useState(false);
  const [pastedJsonText, setPastedJsonText] = useState('');

  if (!isSettingsOpen) return null;

  const handleRateSave = () => {
    const parsed = parseFloat(rateInput);
    if (!isNaN(parsed) && parsed > 0) {
      setExchangeRate(parsed);
      triggerHaptic('success', settings.enableHaptics);
      setImportStatus(`Exchange rate updated to 1 SAR = ₹${parsed} INR`);
      setTimeout(() => setImportStatus(null), 3000);
    }
  };

  const handleBrandingSave = (label: string) => {
    updateSettings({ brandingLabel: label });
    setBrandingInput(label);
    triggerHaptic('success', settings.enableHaptics);
    setImportStatus(`Branding label updated to "${label}"`);
    setTimeout(() => setImportStatus(null), 3000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.name.endsWith('.json')) {
        const text = await file.text();
        const json = JSON.parse(text);
        setJsonBackupPreview(json);
        setImportStatus(`Loaded JSON file: ${file.name}`);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const result = await parseExcelFile(file);
        setImportPreview(result);
        setImportStatus(`Read ${file.name}: Ready to import.`);
      } else {
        alert('Please choose a .json or .xlsx file.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error parsing file: ' + err.message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLoadAttachedBackup = async () => {
    try {
      const res = await fetch(`/Personal_Hub_Backup.json?t=${Date.now()}`);
      if (!res.ok) throw new Error('Backup file not found');
      const json = await res.json();
      importJsonBackup(json, 'replace');
      const tasksCount = json.dataCollections?.tasks?.length || 0;
      const txCount = json.dataCollections?.transactions?.length || 0;
      const accCount = json.dataCollections?.accounts?.length || 0;
      const noteCount = json.dataCollections?.notes?.length || 0;
      const loanCount = json.dataCollections?.loans?.length || 0;
      setImportStatus(`Successfully updated live app with latest backup (${accCount} accounts, ${txCount} transactions, ${tasksCount} tasks, ${noteCount} notes, ${loanCount} loans)!`);
      setTimeout(() => setImportStatus(null), 5000);
    } catch (e: any) {
      alert('Failed to load backup file: ' + e.message);
    }
  };

  const handlePasteJsonSubmit = () => {
    try {
      if (!pastedJsonText.trim()) return;
      const json = JSON.parse(pastedJsonText.trim());
      setJsonBackupPreview(json);
      setShowPasteJson(false);
      setPastedJsonText('');
      setImportStatus('JSON parsed successfully. Choose Restore or Merge below.');
    } catch (e: any) {
      alert('Invalid JSON: ' + e.message);
    }
  };

  const confirmImport = (mode: 'merge' | 'replace') => {
    if (jsonBackupPreview) {
      importJsonBackup(jsonBackupPreview, mode);
      setJsonBackupPreview(null);
      setImportStatus(`JSON backup successfully imported (${mode})!`);
    } else if (importPreview) {
      applyImportData(importPreview, mode);
      setImportPreview(null);
      setImportStatus(`Excel data successfully applied (${mode})!`);
    }
    setTimeout(() => setImportStatus(null), 4000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md glass-panel rounded-3xl p-5 shadow-2xl border border-white/60 dark:border-white/10 max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800/80 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Hub Settings & Data
              </h2>
              <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                Personal Hub · {settings.brandingLabel || 'Prime Edition'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {importStatus && (
          <div className="mb-4 p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 text-xs flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-indigo-500" />
            <span>{importStatus}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* 1. App Name & Branding Customization */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                App Name / Branding Label
              </label>
              <Tag className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <p className="text-[11px] text-slate-400">
              Customize the subtitle branding label shown under the header title.
            </p>

            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {['Prime Edition', 'Executive Suite', 'Personal Suite', 'Nexus Edition'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleBrandingSave(preset)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all ${
                    settings.brandingLabel === preset
                      ? 'bg-purple-600 text-white font-semibold shadow-2xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-purple-300'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={brandingInput}
                onChange={(e) => setBrandingInput(e.target.value)}
                placeholder="Custom label..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => handleBrandingSave(brandingInput)}
                className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>

          {/* 2. Theme Configuration */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
              Appearance & Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => updateSettings({ theme: 'light' })}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                  settings.theme === 'light'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white/50'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light</span>
              </button>
              <button
                onClick={() => updateSettings({ theme: 'dark' })}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                  settings.theme === 'dark'
                    ? 'bg-slate-900 text-white shadow-sm border border-slate-700 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Dark</span>
              </button>
              <button
                onClick={() => updateSettings({ theme: 'system' })}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                  settings.theme === 'system'
                    ? 'bg-white dark:bg-slate-800 text-purple-600 font-semibold shadow-sm border'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white/50'
                }`}
              >
                <Laptop className="w-3.5 h-3.5 text-slate-400" />
                <span>Auto</span>
              </button>
            </div>
          </div>

          {/* 3. Currency Options & Exchange Rate Toggle */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                  Exchange Rate & Primary Currency
                </label>
                <p className="text-[11px] text-slate-400">
                  Select your display currency across GCC, Asia, and Global markets.
                </p>
              </div>

              {/* Exchange Rate Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  const nextVal = !(settings.enableExchangeRate !== false);
                  updateSettings({ enableExchangeRate: nextVal });
                  triggerHaptic('medium', settings.enableHaptics);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                  settings.enableExchangeRate !== false
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <span>{settings.enableExchangeRate !== false ? 'Rates Active' : 'Rates Disabled'}</span>
              </button>
            </div>

            {/* Exchange Rate Status banner */}
            {settings.enableExchangeRate === false && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300">
                ⚡ <strong>Exchange rates disabled:</strong> All monetary values will be calculated and displayed strictly in primary Saudi Riyals (SAR ﷼) without foreign currency conversion.
              </div>
            )}

            {/* Currency Selection Grid (GCC & Asian) */}
            <div>
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Primary Display Currency
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto p-1 bg-white/60 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                {CURRENCY_LIST.map((c) => {
                  const isSelected = settings.displayCurrency === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        updateSettings({ displayCurrency: c.code as Currency });
                        triggerHaptic('light', settings.enableHaptics);
                      }}
                      className={`p-1.5 rounded-lg text-left transition-all ${
                        isSelected
                          ? 'bg-purple-600 text-white font-semibold shadow-2xs'
                          : 'hover:bg-purple-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold">{c.code}</span>
                        <span className="text-[10px] opacity-80">{c.creativeSymbol}</span>
                      </div>
                      <div className="text-[10px] truncate opacity-75">{c.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SAR to INR Custom Conversion Rate */}
            {settings.enableExchangeRate !== false && (
              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    Custom SAR ➔ INR Rate:
                  </span>
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                    1 SAR = ₹{settings.exchangeRateSARtoINR}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">1 SAR = ₹</span>
                    <input
                      type="number"
                      step="any"
                      value={rateInput}
                      onChange={(e) => setRateInput(e.target.value)}
                      placeholder="25.7"
                      className="w-full pl-18 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-purple-400"
                    />
                  </div>
                  <button
                    onClick={handleRateSave}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
                  >
                    Save Rate
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. Toggles: Fullscreen & Haptics */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                  Full-screen Mode
                </span>
                <span className="text-[11px] text-slate-400">
                  Hides the mobile status bar inside app
                </span>
              </div>
              <button
                onClick={toggleFullscreen}
                className={`p-2 rounded-xl border text-xs font-medium transition-colors ${
                  settings.isFullscreen
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {settings.isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
              <div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                  Tactile Haptic Feedback
                </span>
                <span className="text-[11px] text-slate-400">
                  Subtle mobile vibration on touch
                </span>
              </div>
              <button
                onClick={() => {
                  const next = !settings.enableHaptics;
                  updateSettings({ enableHaptics: next });
                  triggerHaptic('medium', next);
                }}
                className={`p-2 rounded-xl border text-xs font-medium transition-colors ${
                  settings.enableHaptics
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
              >
                {settings.enableHaptics ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 5. Peer-to-Peer Wi-Fi QR Sync & Scanner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-pink-500/10 border border-purple-200/80 dark:border-purple-800/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Wifi className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                    Local Wi-Fi QR Sync & Scanner
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Peer-to-peer sync between Mobile & PC without cloud
                  </p>
                </div>
              </div>

              {dataVersion && (
                <span className="text-[10px] font-mono bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-semibold">
                  v:{dataVersion.slice(0, 8)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  triggerHaptic('light', settings.enableHaptics);
                  setIsSettingsOpen(false);
                  openSyncModal('scanner');
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>📷 Scan PC (Mobile)</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light', settings.enableHaptics);
                  setIsSettingsOpen(false);
                  openSyncModal('pc');
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>💻 Show QR (PC)</span>
              </button>
            </div>
          </div>

          {/* 6. Excel & JSON Import & Export */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2.5">
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                Data Backup & Migration
              </span>
              <p className="text-[11px] text-slate-400">
                Support for Personal Hub JSON backups and Excel spreadsheets (.xlsx)
              </p>
            </div>

            {/* One-tap Load Attached Backup Button */}
            <button
              onClick={handleLoadAttachedBackup}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 text-xs font-semibold transition-colors"
            >
              <FileCode className="w-4 h-4 text-purple-500" />
              <span>Restore from Attached Backup (Personal_Hub_Backup.json)</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={exportDataToExcel}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={exportDataToJson}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={downloadTemplate}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                <span>Excel Template</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-white dark:hover:bg-slate-900 transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-purple-500" />
                <span>Import File</span>
              </button>
            </div>

            {/* Paste JSON directly button */}
            <button
              onClick={() => setShowPasteJson((prev) => !prev)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-colors"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>{showPasteJson ? 'Hide JSON Paste Box' : 'Paste Raw JSON Backup Directly'}</span>
            </button>

            {showPasteJson && (
              <div className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 space-y-2">
                <label className="text-[11px] font-semibold text-indigo-900 dark:text-indigo-200 block">
                  Paste Personal Hub JSON Backup:
                </label>
                <textarea
                  value={pastedJsonText}
                  onChange={(e) => setPastedJsonText(e.target.value)}
                  placeholder='Paste {"backupVersion": 1, "dataCollections": {...}} here'
                  rows={4}
                  className="w-full p-2 text-xs font-mono rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handlePasteJsonSubmit}
                    disabled={!pastedJsonText.trim()}
                    className="flex-1 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors"
                  >
                    Parse & Review JSON
                  </button>
                  <button
                    onClick={() => {
                      setShowPasteJson(false);
                      setPastedJsonText('');
                    }}
                    className="py-1.5 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .json"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Import Preview Modal for JSON */}
            {jsonBackupPreview && (
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs space-y-2">
                <span className="font-bold text-indigo-900 dark:text-indigo-200 block">
                  Personal Hub JSON Backup Detected:
                </span>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-indigo-800 dark:text-indigo-300">
                  <span>· {jsonBackupPreview.dataCollections?.accounts?.length || 0} Accounts</span>
                  <span>· {jsonBackupPreview.dataCollections?.transactions?.length || 0} Transactions</span>
                  <span>· {jsonBackupPreview.dataCollections?.tasks?.length || 0} Tasks / Follow-ups</span>
                  <span>· {jsonBackupPreview.dataCollections?.notes?.length || 0} Notes</span>
                  <span>· {jsonBackupPreview.dataCollections?.loans?.length || 0} Loans</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => confirmImport('replace')}
                    className="flex-1 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold text-[11px]"
                  >
                    Restore (Replace)
                  </button>
                  <button
                    onClick={() => confirmImport('merge')}
                    className="flex-1 py-1.5 rounded-lg bg-purple-600 text-white font-semibold text-[11px]"
                  >
                    Merge
                  </button>
                  <button
                    onClick={() => setJsonBackupPreview(null)}
                    className="px-2 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Import Preview for Excel */}
            {importPreview && (
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs space-y-2">
                <span className="font-bold text-purple-900 dark:text-purple-200 block">
                  Excel File Detected:
                </span>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-purple-800 dark:text-purple-300">
                  <span>· {importPreview.counts.accounts} Accounts</span>
                  <span>· {importPreview.counts.transactions} Transactions</span>
                  <span>· {importPreview.counts.followups} Follow-ups</span>
                  <span>· {importPreview.counts.notes} Notes</span>
                  <span>· {importPreview.counts.loans} Loans</span>
                  <span>· {importPreview.counts.wishlists} Wishlists</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => confirmImport('merge')}
                    className="flex-1 py-1.5 rounded-lg bg-purple-600 text-white font-semibold text-[11px]"
                  >
                    Merge Data
                  </button>
                  <button
                    onClick={() => confirmImport('replace')}
                    className="flex-1 py-1.5 rounded-lg bg-slate-700 text-white font-semibold text-[11px]"
                  >
                    Replace All
                  </button>
                  <button
                    onClick={() => setImportPreview(null)}
                    className="px-2 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 6. Mobile APK / PWA Guide */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-indigo-950 dark:text-indigo-200 block">
                Android APK & PWA Guide
              </span>
              <span className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">
                Install as standalone app or build APK
              </span>
            </div>
            <button
              onClick={() => {
                setIsSettingsOpen(false);
                setIsPwaGuideOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              Open Guide
            </button>
          </div>

          {/* 7. Reset Option */}
          <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 space-y-2">
            <div>
              <span className="text-xs font-semibold text-rose-900 dark:text-rose-200 block">
                Reset & Clear Data
              </span>
              <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80">
                Clear all storage or restore default backup data
              </p>
            </div>

            {!showResetConfirm ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  Reset Options...
                </button>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 space-y-2">
                <p className="text-[11px] text-rose-700 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Are you sure? This will wipe current records!
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      resetAllData('empty');
                      setShowResetConfirm(false);
                      setIsSettingsOpen(false);
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-rose-600 text-white text-[11px] font-semibold"
                  >
                    Clear All (Wipe)
                  </button>
                  <button
                    onClick={() => {
                      resetAllData('demo');
                      setShowResetConfirm(false);
                      setIsSettingsOpen(false);
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-indigo-600 text-white text-[11px] font-semibold"
                  >
                    Restore Backup
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-2 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-[11px]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 8. About Personal Hub */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-2">
            <div className="flex items-center gap-3">
              <img
                src="/apple-touch-icon.png"
                alt="Personal Hub Luxury Icon"
                className="w-10 h-10 rounded-xl shadow-md ring-1 ring-amber-500/30 object-cover shrink-0"
              />
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-200 block text-xs">
                  Personal Hub ({settings.brandingLabel || 'Prime Edition'}) v2.5
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                  Premium Luxury Emblem (Android APK & iOS)
                </span>
              </div>
            </div>
            <p>
              An all-in-one personal manager combining Money & Accounts, Loan ledger, Notes, Follow-up tasks, and Wishlist funding goals.
            </p>
            <p className="text-[10px] text-slate-400 pt-0.5">
              Supports SAR ⇄ INR live currency conversion, Excel import/export, and offline storage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
