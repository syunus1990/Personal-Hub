import React, { useState, useRef } from 'react';
import {
  X,
  HardDrive,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  ArrowRight,
  ShieldAlert,
  FileSpreadsheet,
  HelpCircle,
} from 'lucide-react';
import {
  collectCurrentAppState,
  createStructuredBackup,
  applyRestoredAppState,
  loadSafetyBackup,
  StructuredBackupFile,
  AppStateData,
} from '../../utils/storage';
import {
  downloadExcelBackup,
  downloadEmptyExcelTemplate,
  parseExcelImport,
} from '../../utils/excelExporter';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  onDataRestored,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(() => {
    return localStorage.getItem('hub_last_backup_date_v1');
  });

  // Restore states
  const [restoreFile, setRestoreFile] = useState<StructuredBackupFile | null>(null);
  const [restoreError, setRestoreError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Backup downloaded successfully!');
  const [showConfirmWarning, setShowConfirmWarning] = useState(false);
  const [hasSafetyBackup, setHasSafetyBackup] = useState(() => !!loadSafetyBackup());

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadBackup = () => {
    setIsExporting(true);
    try {
      const data = collectCurrentAppState();
      const backup = createStructuredBackup(data);

      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Format date for filename: YYYY-MM-DD_HH-MM
      const now = new Date();
      const datePart = now.toISOString().slice(0, 10);
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      a.download = `PersonalHub_Backup_${datePart}_${hours}-${mins}.json`;
      a.click();
      URL.revokeObjectURL(url);

      const nowIso = now.toISOString();
      setLastBackupDate(nowIso);
      localStorage.setItem('hub_last_backup_date_v1', nowIso);
      setSuccessMessage('JSON Backup file saved! Ready for reinstall.');
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 4000);
    } catch (err: any) {
      console.error('Backup export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = () => {
    try {
      const data = collectCurrentAppState();
      downloadExcelBackup(data);
      setSuccessMessage('Excel file (.xlsx) exported with Money, Loans, Tasks & Notes sheets!');
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 4000);
    } catch (err) {
      console.error('Excel export failed:', err);
      alert('Could not generate Excel file.');
    }
  };

  const handleDownloadTemplate = () => {
    try {
      downloadEmptyExcelTemplate();
      setSuccessMessage('Empty Excel Template downloaded with pre-formatted sheets!');
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 4000);
    } catch (err) {
      console.error('Template download failed:', err);
      alert('Could not download Excel template.');
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestoreError('');
    setRestoreFile(null);
    setShowConfirmWarning(false);

    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      // Process Excel file
      try {
        const currentData = collectCurrentAppState();
        const importedData = await parseExcelImport(file, currentData);
        const structured: StructuredBackupFile = {
          backupVersion: 1,
          appVersion: '1.0',
          createdAt: new Date().toISOString(),
          dataCollections: importedData,
        };
        setRestoreFile(structured);
      } catch (err: any) {
        console.error('Failed to parse Excel file:', err);
        setRestoreError('Failed to parse Excel file. Please ensure it follows the Personal Hub format.');
      }
      return;
    }

    // Process JSON file
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Validate structure
        if (parsed && (parsed.backupVersion || parsed.version || parsed.dataCollections || parsed.tasks)) {
          // Normalize to structured format
          let normalized: StructuredBackupFile;
          if (parsed.dataCollections) {
            normalized = parsed as StructuredBackupFile;
          } else {
            // Legacy flat structure
            normalized = {
              backupVersion: 1,
              appVersion: parsed.version || '1.0',
              createdAt: parsed.exportedAt || parsed.backupDate || new Date().toISOString(),
              dataCollections: {
                tasks: parsed.tasks || [],
                accounts: parsed.accounts || [],
                categories: parsed.categories || [],
                transactions: parsed.transactions || [],
                notes: parsed.notes || [],
                loans: parsed.loans || [],
                loanPayments: parsed.loanPayments || [],
                contributors: parsed.contributors || [],
                exchangeRate: parsed.exchangeRate || {
                  rateInrToSar: 0.045,
                  rateSarToInr: 22.22,
                  lastUpdated: new Date().toISOString(),
                },
              },
            };
          }
          setRestoreFile(normalized);
        } else {
          setRestoreError('Unrecognized backup file format. Please choose a valid Personal Hub backup JSON or Excel file.');
        }
      } catch (err: any) {
        setRestoreError('Failed to parse backup JSON file. Make sure the file is intact.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmApplyRestore = () => {
    if (!restoreFile) return;
    applyRestoredAppState(restoreFile.dataCollections as AppStateData);
    setHasSafetyBackup(true);
    onDataRestored();
    onClose();
  };

  const handleRollbackSafetyBackup = () => {
    const safety = loadSafetyBackup();
    if (!safety) return;
    if (window.confirm('Rollback to the safety backup saved before the last restore?')) {
      applyRestoredAppState(safety);
      onDataRestored();
      onClose();
    }
  };

  const tasksCount = restoreFile?.dataCollections.tasks?.length || 0;
  const accountsCount = restoreFile?.dataCollections.accounts?.length || 0;
  const txCount = restoreFile?.dataCollections.transactions?.length || 0;
  const loansCount = restoreFile?.dataCollections.loans?.length || 0;
  const paymentsCount = restoreFile?.dataCollections.loanPayments?.length || 0;
  const notesCount = restoreFile?.dataCollections.notes?.length || 0;

  return (
    <div
      id="backup-restore-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="backup-restore-modal"
        className="w-full max-w-lg bg-[#13151c]/95 text-slate-200 backdrop-blur-2xl border border-white/20 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-violet-600/30 text-violet-300 border border-violet-500/30 flex items-center justify-center shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white tracking-tight truncate">
                Backup & Data Migration
              </h2>
              <p className="text-xs text-slate-400 truncate">
                Export to JSON or Excel • Restore anytime
              </p>
            </div>
          </div>

          <button
            id="close-backup-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content area */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* Reinstall Instructions Banner */}
          <div className="p-4 rounded-2xl bg-violet-500/15 border border-violet-500/30 text-violet-200 text-xs space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-white">
              <HelpCircle className="w-4 h-4 text-violet-400" />
              <span>How to Reinstall Without Losing Data:</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              1. Tap <strong>&quot;Download JSON Backup&quot;</strong> below to save your data file.<br />
              2. Reinstall or update the app.<br />
              3. Open this screen and tap <strong>&quot;Select Backup File&quot;</strong> to restore all tasks, expenses, loans and notes immediately!
            </p>
          </div>

          {/* Alert feedback message */}
          {isSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Last backup info */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                {lastBackupDate
                  ? `Last backup: ${new Date(lastBackupDate).toLocaleDateString()} at ${new Date(lastBackupDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'No backup generated yet this session'}
              </span>
            </div>
            {hasSafetyBackup && (
              <button
                type="button"
                onClick={handleRollbackSafetyBackup}
                className="text-xs font-semibold text-violet-400 hover:underline self-start sm:self-auto cursor-pointer"
              >
                Restore Previous Snapshot
              </button>
            )}
          </div>

          {/* SECTION 1: EXCEL FORMAT (Requirement 9) */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white/5 border border-white/15 space-y-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Excel (.xlsx) Multi-Sheet Export
                </h3>
                <p className="text-[11px] text-slate-400">
                  Money & Accounts Ledger, Loans, Tasks & Notes sheets
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Export all your data into an Excel spreadsheet with dedicated sheets for Money (accounts & formula balance), Loans (INR & SAR), Follow Up, and Notes.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleExportExcel}
                className="py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer min-h-[44px]"
              >
                <Download className="w-4 h-4" />
                <span>Export Data to Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[44px]"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Download Empty Template</span>
              </button>
            </div>
          </div>

          {/* SECTION 2: JSON RESTORE-READY ARCHIVE */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white/5 border border-white/15 space-y-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center justify-center shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Complete JSON Backup (Recommended for Reinstall)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Full 1-click restore file with all settings
                </p>
              </div>
            </div>

            <button
              id="export-backup-btn"
              type="button"
              disabled={isExporting}
              onClick={handleDownloadBackup}
              className="w-full py-3 px-4 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-violet-600/30 cursor-pointer min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Creating Backup...' : 'Download JSON Backup'}</span>
            </button>
          </div>

          {/* SECTION 3: RESTORE BACKUP */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white/5 border border-white/15 space-y-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-center shrink-0">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Restore From Backup File
                </h3>
                <p className="text-[11px] text-slate-400">
                  Select a JSON or Excel (.xlsx) file to restore
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json, .xlsx, .xls"
              onChange={handleFileSelected}
              className="hidden"
            />

            {!restoreFile ? (
              <button
                id="select-backup-file-btn"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-6 px-4 rounded-2xl border-2 border-dashed border-white/20 hover:border-violet-400 text-slate-300 text-xs font-semibold flex flex-col items-center justify-center gap-2 transition-all bg-white/5 hover:bg-white/10 cursor-pointer min-h-[90px]"
              >
                <FileText className="w-6 h-6 text-violet-400" />
                <span>Select Personal Hub Backup File (.json or .xlsx)</span>
              </button>
            ) : (
              <div className="space-y-3 p-4 rounded-2xl bg-black/40 border border-white/15">
                <div className="flex flex-wrap items-center justify-between text-xs font-bold text-white gap-2">
                  <span className="flex items-center gap-1.5 truncate">
                    <FileText className="w-4 h-4 text-violet-400 shrink-0" />
                    <span>Archive Date: {new Date(restoreFile.createdAt).toLocaleDateString()}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setRestoreFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-slate-400 hover:text-white text-xs underline cursor-pointer"
                  >
                    Change file
                  </button>
                </div>

                {/* Counts breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-2 text-xs">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-slate-400 block font-semibold">Tasks</span>
                    <span className="text-sm font-bold text-violet-300">{tasksCount}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-slate-400 block font-semibold">Accounts</span>
                    <span className="text-sm font-bold text-emerald-300">{accountsCount}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-slate-400 block font-semibold">Transactions</span>
                    <span className="text-sm font-bold text-cyan-300">{txCount}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-slate-400 block font-semibold">Loans</span>
                    <span className="text-sm font-bold text-amber-300">{loansCount}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-slate-400 block font-semibold">Payments</span>
                    <span className="text-sm font-bold text-indigo-300">{paymentsCount}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-slate-400 block font-semibold">Notes</span>
                    <span className="text-sm font-bold text-blue-300">{notesCount}</span>
                  </div>
                </div>

                {showConfirmWarning ? (
                  <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs space-y-2">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Overwrite Current App Data?</span>
                    </div>
                    <p className="text-[11px] text-rose-200/90 leading-relaxed">
                      This will replace existing local data with the contents of this archive. A safety snapshot will be preserved automatically.
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowConfirmWarning(false)}
                        className="flex-1 py-1.5 rounded-xl border border-white/20 text-slate-300 hover:bg-white/10 font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmApplyRestore}
                        className="flex-1 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md cursor-pointer"
                      >
                        Confirm Restore
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmWarning(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-600/30 cursor-pointer transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Apply & Restore Data</span>
                  </button>
                )}
              </div>
            )}

            {restoreError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{restoreError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
