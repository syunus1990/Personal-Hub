/**
 * gate.js - Mandatory PC Sync Gate State Machine
 *
 * State Machine Lifecycle:
 * LOCKED -> WAITING_FOR_MOBILE -> SYNCING -> VERIFYING -> UNLOCKED
 * (If ANY step fails, returns immediately to WAITING_FOR_MOBILE)
 *
 * Features:
 * - On page load, PC starts in LOCKED state.
 * - While NOT in UNLOCKED state:
 *   * Disables every update/edit/save button on PC UI
 *   * Displays red banner: "Updates disabled until sync completes"
 *   * Shows blocking modal: "Sync required. Please sync data from your mobile device before making any updates."
 * - When UNLOCKED:
 *   * Enables all action buttons
 *   * Displays green banner: "Synced - version: {hash}"
 */

export const GateState = {
  LOCKED: 'LOCKED',
  WAITING_FOR_MOBILE: 'WAITING_FOR_MOBILE',
  SYNCING: 'SYNCING',
  VERIFYING: 'VERIFYING',
  UNLOCKED: 'UNLOCKED',
};

export class SyncGate {
  constructor(options = {}) {
    this.state = GateState.LOCKED;
    this.versionHash = null;
    this.modalText =
      options.modalText ||
      'Sync required. Please sync data from your mobile device before making any updates.';
    this.onStateChange = options.onStateChange || (() => {});
    this.initDOM();
  }

  initDOM() {
    // Create Banner Element
    let banner = document.getElementById('sync-gate-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'sync-gate-banner';
      banner.style.position = 'sticky';
      banner.style.top = '0';
      banner.style.left = '0';
      banner.style.right = '0';
      banner.style.zIndex = '9998';
      banner.style.padding = '8px 16px';
      banner.style.fontSize = '12px';
      banner.style.fontWeight = '600';
      banner.style.textAlign = 'center';
      banner.style.display = 'none';
      document.body.prepend(banner);
    }
    this.bannerEl = banner;

    // Create Blocking Modal Element
    let modal = document.getElementById('sync-gate-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'sync-gate-modal';
      modal.style.position = 'fixed';
      modal.style.inset = '0';
      modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      modal.style.backdropFilter = 'blur(4px)';
      modal.style.zIndex = '9999';
      modal.style.display = 'none';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.padding = '20px';

      modal.innerHTML = `
        <div style="background: #1e293b; color: #f8fafc; border-radius: 16px; padding: 24px; max-width: 440px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); border: 1px solid #334155; text-align: center;">
          <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(239, 68, 68, 0.15); color: #ef4444; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px;">
            🔒
          </div>
          <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">Mandatory Sync Required</h3>
          <p id="sync-gate-modal-msg" style="font-size: 13px; color: #94a3b8; line-height: 1.5; margin-bottom: 20px;">
            ${this.modalText}
          </p>
          <div style="display: flex; gap: 8px; justify-content: center;">
            <button id="sync-gate-open-qr-btn" style="background: #6366f1; color: white; border: none; padding: 10px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer;">
              Connect Mobile (Show QR)
            </button>
            <button id="sync-gate-dismiss-btn" style="background: #334155; color: #cbd5e1; border: none; padding: 10px 14px; border-radius: 10px; font-size: 13px; cursor: pointer;">
              View in Read-Only
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      document.getElementById('sync-gate-dismiss-btn')?.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }
    this.modalEl = modal;

    // Apply initial LOCKED state
    this.transitionTo(GateState.LOCKED);
  }

  transitionTo(newState, payload = {}) {
    this.state = newState;
    if (payload.versionHash) {
      this.versionHash = payload.versionHash;
    }

    this.renderUI();
    this.enforceButtonState();
    this.onStateChange(this.state, payload);
  }

  renderUI() {
    if (!this.bannerEl) return;

    if (this.state === GateState.UNLOCKED) {
      // UNLOCKED: Green Banner, hide modal
      this.bannerEl.style.display = 'block';
      this.bannerEl.style.backgroundColor = '#059669';
      this.bannerEl.style.color = '#ffffff';
      this.bannerEl.innerHTML = `✓ Synced - version: <span style="font-family: monospace; font-weight: bold;">${
        this.versionHash ? this.versionHash.slice(0, 12) : 'active'
      }</span>`;
      if (this.modalEl) this.modalEl.style.display = 'none';
    } else {
      // NOT UNLOCKED: Red banner and show modal if locked
      this.bannerEl.style.display = 'block';
      this.bannerEl.style.backgroundColor = '#dc2626';
      this.bannerEl.style.color = '#ffffff';
      this.bannerEl.innerHTML = `⚠️ Updates disabled until sync completes (${this.state})`;

      if (this.state === GateState.LOCKED && this.modalEl) {
        this.modalEl.style.display = 'flex';
      }
    }
  }

  enforceButtonState() {
    // >>> HOOK INTO YOUR EXISTING CODE HERE <<<
    // Disable/Enable every update/edit/save/delete button on the PC UI
    const isUnlocked = this.state === GateState.UNLOCKED;

    // Selector targeting mutation and save buttons
    const actionButtons = document.querySelectorAll(
      'button[data-action="mutate"], .btn-save, .btn-update, .btn-delete, button[type="submit"]'
    );

    actionButtons.forEach((btn) => {
      if (btn.id === 'sync-gate-open-qr-btn' || btn.id === 'sync-gate-dismiss-btn') return;
      btn.disabled = !isUnlocked;
      if (!isUnlocked) {
        btn.setAttribute('data-disabled-by-gate', 'true');
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
      } else {
        btn.removeAttribute('data-disabled-by-gate');
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
      }
    });
  }

  isUnlocked() {
    return this.state === GateState.UNLOCKED;
  }
}
