import React, { useState } from 'react';
import {
  X,
  Palette,
  Sun,
  Moon,
  Laptop,
  ArrowRightLeft,
  Tag,
  Wallet,
  RefreshCw,
  Download,
  FileSpreadsheet,
  Upload,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  Camera,
  QrCode,
  Copy,
  Info,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { triggerHaptic } from '../../utils/haptics';
import { formatCurrency } from '../../utils/currency';
import { parseExcelImport } from '../../utils/excel';

export const SettingsModal: React.FC = () => {
  const {
    settings,
    updateSettings,
    isSettingsOpen,
    setIsSettingsOpen,
    categories,
    addCategory,
    addSubCategory,
    accounts,
    openEditModal,
    openSyncModal,
    getFullSyncPayload,
    importJsonBackup,
    dataVersion,
    downloadTemplate,
    exportDataToExcel,
    applyImportData,
    transactions,
    followups,
    notes,
    loans,
    wishlists,
  } = useApp();

  const [activeSection, setActiveSection] = useState<string>('sync');
  const [copiedPayload, setCopiedPayload] = useState(false);

  // New Category & Subcategory inline states
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#8b5cf6');

  const [expandedCatId, setExpandedCatId] = useState<string | null>(null);
  const [isAddingSubForCat, setIsAddingSubForCat] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState('');

  if (!isSettingsOpen) return null;

  const toggleSection = (sectionId: string) => {
    triggerHaptic('light', settings.enableHaptics);
    setActiveSection((prev) => (prev === sectionId ? '' : sectionId));
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory(newCatName.trim(), newCatColor);
    setNewCatName('');
    setIsAddingCat(false);
  };

  const handleCreateSubCategory = (catId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    addSubCategory(catId, newSubName.trim());
    setNewSubName('');
    setIsAddingSubForCat(null);
  };

  const handleCopySyncPayload = () => {
    try {
      const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        dataCollections: {
          accounts,
          transactions,
          categories,
          tasks: followups,
          notes,
          loans,
          wishlists,
        },
      };
      navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2500);
    } catch {
      // fallback
    }
  };


  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await parseExcelImport(file);
      applyImportData(result, "merge");
      const total =
        result.counts.transactions +
        result.counts.accounts +
        result.counts.followups +
        result.counts.notes +
        result.counts.loans +
        result.counts.wishlists;
      alert(
        `Excel imported successfully!\n\n• ${result.counts.transactions} Transactions\n• ${result.counts.accounts} Accounts\n• ${result.counts.followups} Follow-ups\n• ${result.counts.notes} Notes\n• ${result.counts.loans} Loans\n• ${result.counts.wishlists} Wishlists\n\nTotal: ${total} items added/merged.`
      );
    } catch (err: any) {
      alert(`Excel import error: ${err.message || "Could not parse Excel file."}`);
    }
    e.target.value = "";
  };

  const handleExportJson = () => {
    try {
      const dataToExport = {
        backupVersion: 1,
        appVersion: "2.6",
        createdAt: new Date().toISOString(),
        dataCollections: {
          accounts,
          transactions,
          categories,
          tasks: followups,
          notes,
          loans,
          wishlists,
          exchangeRate: {
            rateSarToInr: settings.exchangeRateSARtoINR,
            rateInrToSar: 1 / settings.exchangeRateSARtoINR,
            lastUpdated: new Date().toISOString(),
          },
        },
      };
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const now = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `Personal_Hub_Backup_${now}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export JSON:', err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg glass-panel rounded-3xl shadow-2xl border border-white/60 dark:border-white/10 flex flex-col max-h-[92vh] overflow-hidden bg-white dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Settings & Tools
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Configure app, sync devices, and manage categories
            </p>
          </div>

          <button
            onClick={() => setIsSettingsOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Accordion Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1">
          {/* SECTION 1: PC–Mobile Sync & Local QR (Moved to top for effortless access) */}
          <div className="rounded-2xl border border-purple-200/90 dark:border-purple-800/60 overflow-hidden bg-purple-50/30 dark:bg-purple-950/20">
            <button
              onClick={() => toggleSection('sync')}
              className="w-full p-3.5 flex items-center justify-between text-left font-bold text-xs text-purple-900 dark:text-purple-200 hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-white">
                    PC–Mobile Connection & QR Sync
                  </span>
                  <span className="block text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                    Pair PC & Phone · Step-by-Step Guide
                  </span>
                </div>
              </div>
              {activeSection === 'sync' ? <ChevronUp className="w-4 h-4 text-purple-600" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {activeSection === 'sync' && (
              <div className="p-4 pt-2 border-t border-purple-200/70 dark:border-purple-800/40 space-y-3.5 bg-white dark:bg-slate-900">
                {/* Direct Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      openSyncModal('pc');
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Show QR on PC</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      openSyncModal('scanner');
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Scan from Mobile</span>
                  </button>
                </div>

                {/* Step-by-Step Verification Guide */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Step-by-Step Sync Verification Guide</span>
                  </h4>
                  <ol className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5 pl-4 list-decimal">
                    <li>
                      <strong>On your PC/Laptop:</strong> Open the app in your browser, open Settings, and tap <span className="text-purple-600 font-bold">"Show QR on PC"</span>.
                    </li>
                    <li>
                      <strong>On your Phone:</strong> Open the app, go to Settings, and tap <span className="text-indigo-600 font-bold">"Scan from Mobile"</span>.
                    </li>
                    <li>
                      Point your phone's camera at the PC screen.
                    </li>
                    <li>
                      <strong>Verify connection:</strong> The modal immediately shows <span className="text-emerald-600 font-bold">"Connected & Synced"</span> with green checkmark!
                    </li>
                    <li>
                      <strong>Offline fallback:</strong> You can also tap "Export Backup JSON" below and tap "Import" on the other device.
                    </li>
                  </ol>
                </div>

                {/* Copy Sync Payload / JSON backup buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleCopySyncPayload}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedPayload ? 'Copied to Clipboard!' : 'Copy Sync Payload'}</span>
                  </button>

                  <button
                    onClick={handleExportJson}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Download JSON Backup</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: Appearance & Theme */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
            <button
              onClick={() => toggleSection('appearance')}
              className="w-full p-3.5 flex items-center justify-between text-left font-bold text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Palette className="w-4 h-4" />
                </div>
                <span>Theme & Appearance</span>
              </div>
              {activeSection === 'appearance' ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {activeSection === 'appearance' && (
              <div className="p-4 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                  Select Theme Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => updateSettings({ theme: 'light' })}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-medium transition-all ${
                      settings.theme === 'light'
                        ? 'bg-purple-600 text-white font-bold shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Light</span>
                  </button>
                  <button
                    onClick={() => updateSettings({ theme: 'dark' })}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-medium transition-all ${
                      settings.theme === 'dark'
                        ? 'bg-purple-600 text-white font-bold shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Dark</span>
                  </button>
                  <button
                    onClick={() => updateSettings({ theme: 'system' })}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-medium transition-all ${
                      settings.theme === 'system'
                        ? 'bg-purple-600 text-white font-bold shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5 text-slate-400" />
                    <span>Auto</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: Currency & Exchange Rate */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
            <button
              onClick={() => toggleSection('currency')}
              className="w-full p-3.5 flex items-center justify-between text-left font-bold text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <span>Currency & Conversion Rate</span>
              </div>
              {activeSection === 'currency' ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {activeSection === 'currency' && (
              <div className="p-4 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Active Currency: {settings.displayCurrency}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Toggle primary display between SAR (﷼) and INR (₹)
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateSettings({ displayCurrency: 'SAR' })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        settings.displayCurrency === 'SAR'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      SAR ﷼
                    </button>
                    <button
                      onClick={() => updateSettings({ displayCurrency: 'INR' })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        settings.displayCurrency === 'INR'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      INR ₹
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Conversion Rate:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    1 SAR = {settings.exchangeRateSARtoINR || 25.7} INR
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: Categories & Sub-categories Management (Request 1) */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
            <button
              onClick={() => toggleSection('categories')}
              className="w-full p-3.5 flex items-center justify-between text-left font-bold text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-white">
                    Categories & Sub-categories
                  </span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {categories.length} Main Categories · Add & Edit
                  </span>
                </div>
              </div>
              {activeSection === 'categories' ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {activeSection === 'categories' && (
              <div className="p-4 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                {/* Add Main Category Bar */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    All Main Categories
                  </span>
                  <button
                    onClick={() => setIsAddingCat(!isAddingCat)}
                    className="flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Main Category</span>
                  </button>
                </div>

                {/* Inline New Category Form */}
                {isAddingCat && (
                  <form onSubmit={handleCreateCategory} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-purple-200 dark:border-purple-800 space-y-2">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                      New Main Category Name
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        autoFocus
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="e.g. Health, Education, Travel..."
                        className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                      <input
                        type="color"
                        value={newCatColor}
                        onChange={(e) => setNewCatColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                        title="Pick color"
                      />
                      <button
                        type="submit"
                        disabled={!newCatName.trim()}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold disabled:opacity-40"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                )}

                {/* List of Main Categories with Subcategories */}
                <div className="space-y-2">
                  {categories.map((cat) => {
                    const isExpanded = expandedCatId === cat.id;
                    const subCount = cat.subCategories?.length || 0;

                    return (
                      <div
                        key={cat.id}
                        className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                      >
                        <div
                          onClick={() => setExpandedCatId(isExpanded ? null : cat.id)}
                          className="flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: cat.color || '#8b5cf6' }}
                            />
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {cat.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              ({subCount} sub-categories)
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
                            <span>{isExpanded ? 'Hide' : 'Manage'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </div>
                        </div>

                        {/* Expanded Sub-categories list */}
                        {isExpanded && (
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                                Sub-categories for {cat.name}:
                              </span>
                              <button
                                type="button"
                                onClick={() => setIsAddingSubForCat(cat.id)}
                                className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ Add Sub-category</span>
                              </button>
                            </div>

                            {/* Inline Add Sub-category form */}
                            {isAddingSubForCat === cat.id && (
                              <form
                                onSubmit={(e) => handleCreateSubCategory(cat.id, e)}
                                className="flex items-center gap-1.5 pt-1"
                              >
                                <input
                                  type="text"
                                  autoFocus
                                  value={newSubName}
                                  onChange={(e) => setNewSubName(e.target.value)}
                                  placeholder={`New sub-category for ${cat.name}...`}
                                  className="flex-1 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 text-xs text-slate-900 dark:text-white"
                                />
                                <button
                                  type="submit"
                                  disabled={!newSubName.trim()}
                                  className="px-2.5 py-1 rounded-xl bg-purple-600 text-white text-xs font-semibold"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setIsAddingSubForCat(null)}
                                  className="p-1 text-slate-400 hover:text-slate-600"
                                >
                                  ✕
                                </button>
                              </form>
                            )}

                            {/* Sub-category tags */}
                            <div className="flex items-center gap-1.5 flex-wrap pt-1">
                              {cat.subCategories && cat.subCategories.length > 0 ? (
                                cat.subCategories.map((sub) => (
                                  <span
                                    key={sub.id}
                                    className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300"
                                  >
                                    {sub.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">
                                  No sub-categories yet. Tap "+ Add Sub-category" to create one!
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 5: Accounts & Balances */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
            <button
              onClick={() => toggleSection('accounts')}
              className="w-full p-3.5 flex items-center justify-between text-left font-bold text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-white">
                    Accounts Management
                  </span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {accounts.length} Configured Accounts
                  </span>
                </div>
              </div>
              {activeSection === 'accounts' ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {activeSection === 'accounts' && (
              <div className="p-4 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Accounts List
                  </span>
                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      openEditModal('account');
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ New Account</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: acc.color || '#8b5cf6' }}
                        />
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {acc.name}
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize">
                          ({acc.type})
                        </span>
                      </div>
                      <span className="font-bold tabular-nums text-slate-800 dark:text-slate-200">
                        {formatCurrency(acc.currentBalanceSAR, settings.displayCurrency, settings.exchangeRateSARtoINR)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 6: Backup, Excel & Restore */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
            <button
              onClick={() => toggleSection('backup')}
              className="w-full p-3.5 flex items-center justify-between text-left font-bold text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div>Backup, Excel & Restore</div>
                  <div className="text-[10px] font-normal text-slate-500">Excel spreadsheets, sample templates, and JSON backup</div>
                </div>
              </div>
              {activeSection === 'backup' ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {activeSection === 'backup' && (
              <div className="p-4 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-4">
                {/* Subsection A: Excel Spreadsheets & Template */}
                <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Excel Sheets & Template (.xlsx)</span>
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                      Standard Excel
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Download sample pre-formatted template with headers, export all your live data to an Excel workbook, or import transactions and accounts directly from any Excel file.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={downloadTemplate}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800/60 transition-colors"
                      title="Download sample template with Money, Transactions, Notes, and Follow-ups"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Sample Template</span>
                    </button>
                    <button
                      type="button"
                      onClick={exportDataToExcel}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                      title="Export all data sheets to Personal_Hub_Export.xlsx"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Export Excel</span>
                    </button>
                    <label className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-600 cursor-pointer transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>Import Excel</span>
                      <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleExcelImport}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Subsection B: JSON Full System Backup */}
                <div className="p-3 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span>Full System Backup (.json)</span>
                    </span>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800">
                      Complete Sync
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Save your exact local state file to transfer between devices or restore later.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleExportJson}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export JSON Backup</span>
                    </button>
                    <label className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-purple-200 dark:border-purple-800 cursor-pointer transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>Import JSON Backup</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              try {
                                const json = JSON.parse(evt.target?.result as string);
                                importJsonBackup(json, "replace");
                                alert("JSON Backup restored successfully!");
                              } catch {
                                alert("Invalid JSON file format.");
                              }
                            };
                            reader.readAsText(file);
                          }
                          e.target.value = "";
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 7: About Personal Hub */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
            <button
              onClick={() => toggleSection('about')}
              className="w-full p-3.5 flex items-center justify-between text-left font-bold text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-slate-600 text-white flex items-center justify-center shadow-xs">
                  <Info className="w-4 h-4" />
                </div>
                <span>About Personal Hub</span>
              </div>
              {activeSection === 'about' ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {activeSection === 'about' && (
              <div className="p-4 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <p className="font-bold text-slate-900 dark:text-white">
                  Personal Hub v2.6
                </p>
                <p>
                  Offline-First Progressive Web Application for financial tracking, tasks, wishlist goals, and notes. No remote servers store your private data.
                </p>
                <p className="text-[10px] text-slate-400 pt-1">
                  Database version: {dataVersion ? dataVersion.slice(0, 16) : 'Active'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
