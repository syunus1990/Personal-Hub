/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { BottomTabBar } from './components/common/BottomTabBar';
import { FAB } from './components/common/FAB';
import { DashboardView } from './components/dashboard/DashboardView';
import { MoneyView } from './components/money/MoneyView';
import { NotesView } from './components/notes/NotesView';
import { FollowUpsView } from './components/followups/FollowUpsView';
import { WishlistsView } from './components/wishlists/WishlistsView';
import { LoansView } from './components/loans/LoansView';
import { EditItemModal } from './components/modals/EditItemModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { PWAInstallModal } from './components/common/PWAInstallModal';
import { QRSyncModal } from './components/sync/QRSyncModal';
import { AIBulkExpensesModal } from './components/ai/AIBulkExpensesModal';
import { AIItemAssistModal } from './components/ai/AIItemAssistModal';
import { AIAutoDetectModal } from './components/ai/AIAutoDetectModal';

const AppContent: React.FC = () => {
  const {
    activeTab,
    isSyncModalOpen,
    setIsSyncModalOpen,
    syncModalInitialTab,
    openSyncModal,
    isGateEnforced,
    gateState,
    dataVersion,
    isAIBulkExpensesOpen,
    setIsAIBulkExpensesOpen,
    aiItemModal,
    closeAIItemModal,
    isAIAutoDetectOpen,
    setIsAIAutoDetectOpen,
  } = useApp();

  const [isOffline, setIsOffline] = useState(typeof navigator !== "undefined" ? !navigator.onLine : false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Offline Mode Indicator */}
      {isOffline && (
        <div className="sticky top-0 z-50 w-full px-3 py-1.5 bg-amber-500 text-slate-950 text-xs font-semibold text-center flex items-center justify-center gap-2 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-slate-950 animate-pulse" />
          <span>Offline Mode Active • All data and features are stored safely on your device</span>
        </div>
      )}

      {/* Mandatory PC Sync Gate Top Banner */}
      {isGateEnforced && gateState !== 'UNLOCKED' && (
        <div
          id="sync-gate-banner"
          className="sticky top-0 z-40 w-full px-4 py-2 bg-red-600 text-white text-xs font-semibold text-center flex items-center justify-between shadow-md"
        >
          <span className="truncate">
            ⚠️ Updates disabled until sync completes ({gateState})
          </span>
          <button
            onClick={() => openSyncModal('pc')}
            className="px-2.5 py-1 rounded bg-white text-red-700 font-bold hover:bg-red-50 text-[11px] shrink-0 ml-2"
          >
            Connect Mobile
          </button>
        </div>
      )}

      {isGateEnforced && gateState === 'UNLOCKED' && (
        <div
          id="sync-gate-banner"
          className="sticky top-0 z-40 w-full px-4 py-1.5 bg-emerald-600 text-white text-xs font-semibold text-center shadow-sm flex items-center justify-center gap-1.5"
        >
          <span>✓ Synced - version:</span>
          <span className="font-mono font-bold">
            {dataVersion ? dataVersion.slice(0, 10) : 'verified'}
          </span>
        </div>
      )}

      {/* Top Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-3">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'money' && <MoneyView />}
        {activeTab === 'notes' && <NotesView />}
        {activeTab === 'followups' && <FollowUpsView />}
        {activeTab === 'wishlists' && <WishlistsView />}
        {activeTab === 'loans' && <LoansView />}
      </main>

      {/* Floating Action Button */}
      <FAB />

      {/* Fixed Bottom Tab Bar */}
      <BottomTabBar />

      {/* Instant Zero-Scroll Edit / Create Modal */}
      <EditItemModal />

      {/* Settings & Excel Modal */}
      <SettingsModal />

      {/* APK & PWA Guide Modal */}
      <PWAInstallModal />

      {/* QR Peer-to-Peer Sync & Mobile Scanner Modal */}
      <QRSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        initialTab={syncModalInitialTab}
      />

      {/* AI Bulk Expenses Modal */}
      <AIBulkExpensesModal
        isOpen={isAIBulkExpensesOpen}
        onClose={() => setIsAIBulkExpensesOpen(false)}
      />

      {/* AI Item Assist Modal (for Follow-ups, Wishlists, Notes) */}
      <AIItemAssistModal
        isOpen={aiItemModal.isOpen}
        onClose={closeAIItemModal}
        type={aiItemModal.type}
        existingItem={aiItemModal.existingItem}
      />

      {/* AI Universal Auto-Detect Modal (from "+" button) */}
      <AIAutoDetectModal
        isOpen={isAIAutoDetectOpen}
        onClose={() => setIsAIAutoDetectOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
