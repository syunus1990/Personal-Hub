# Personal Hub - QR Sync & Sync Gate Add-on

This add-on brings offline-first peer-to-peer data synchronization from your Mobile app to your PC browser over a local Wi-Fi connection without cloud storage.

---

## 📁 New Files Included

| File | Purpose |
|---|---|
| `public/sync.js` | WebSocket client, chunked streaming, SHA-256 checksums, and ACK/NACK protocol |
| `public/qr.js` | QR Code generator for PC & QR camera scanner for Mobile |
| `public/gate.js` | Mandatory PC Sync Gate state machine (`LOCKED` ➔ `WAITING_FOR_MOBILE` ➔ `SYNCING` ➔ `VERIFYING` ➔ `UNLOCKED`) with blocking prompts and button locking |
| `public/sw.js` | Service Worker caching HTML, CSS, JS, and icons for offline PWA |
| `public/manifest.json` | Web App Manifest for installing the app on desktop and mobile |
| `server.js` | Minimal Node.js local HTTP & WebSocket relay server |

---

## 🛠️ Step 1: HTML Integration (Lines to add to your HTML)

Add the following tags inside the `<head>` of your `index.html`:

```html
<!-- PWA Web App Manifest -->
<link rel="manifest" href="/manifest.json" />

<!-- PWA Theme Color -->
<meta name="theme-color" content="#0f172a" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

<!-- Service Worker Registration -->
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('ServiceWorker registered:', reg.scope))
        .catch(err => console.error('ServiceWorker registration failed:', err));
    });
  }
</script>
```

---

## 🖥️ Step 2: PC Side Integration (Sync Gate & QR Display)

Add a "Connect Mobile" button to your PC navbar or header:

```html
<!-- In your PC header / navbar -->
<button id="btn-connect-mobile" class="btn-connect">
  📱 Connect Mobile
</button>

<!-- Container for QR Code Modal -->
<div id="qr-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:9999; display:flex; align-items:center; justify-content:center;">
  <div style="background:#1e293b; padding:24px; border-radius:16px; text-align:center; color:white;">
    <h3>Scan with Mobile App</h3>
    <p style="font-size:12px; color:#94a3b8;">Expires in 60 seconds</p>
    <canvas id="qr-canvas" style="margin:16px auto;"></canvas>
    <div id="sync-progress" style="font-size:12px; margin-top:8px;"></div>
    <button id="qr-close-btn" style="margin-top:12px; padding:6px 16px; border-radius:8px;">Close</button>
  </div>
</div>
```

Attach the gate and sync logic in your PC script:

```javascript
import { SyncGate, GateState } from '/gate.js';
import { SyncEngine } from '/sync.js';
import { generateQRPayload, renderQRCodeOnCanvas } from '/qr.js';

// >>> HOOK INTO YOUR EXISTING CODE HERE <<<
// 1. Initialize Sync Gate on page load (starts in LOCKED state)
const gate = new SyncGate({
  onStateChange: (state, payload) => {
    console.log('Gate state changed:', state);
  }
});

let syncEngine = null;

// 2. Attach click event to "Connect Mobile" button
document.getElementById('btn-connect-mobile').addEventListener('click', async () => {
  gate.transitionTo(GateState.WAITING_FOR_MOBILE);

  const pcIp = window.location.hostname || '192.168.1.100'; // PC's local Wi-Fi IP
  const wsPort = 8080;
  const token = Math.random().toString(36).substring(2, 15);

  const payload = generateQRPayload({ ip: pcIp, port: wsPort, token });
  const canvas = document.getElementById('qr-canvas');
  renderQRCodeOnCanvas(canvas, payload);
  document.getElementById('qr-modal').style.display = 'flex';

  // 3. Connect PC WebSocket as Receiver
  syncEngine = new SyncEngine({
    url: `ws://${pcIp}:${wsPort}`,
    token,
    role: 'pc',
    onProgress: (percent, current, total) => {
      gate.transitionTo(GateState.SYNCING);
      document.getElementById('sync-progress').innerText = `Receiving data: ${percent}% (${current}/${total} chunks)`;
    },
    onComplete: async ({ data, dataVersion }) => {
      gate.transitionTo(GateState.VERIFYING);

      // >>> HOOK INTO YOUR EXISTING CODE HERE <<<
      // Save data into IndexedDB / localStorage and store dataVersion
      localStorage.setItem('dataVersion', dataVersion);
      // e.g., applyImportData(data, 'replace');

      // Checksums verified, unlock PC UI
      gate.transitionTo(GateState.UNLOCKED, { versionHash: dataVersion });
      document.getElementById('qr-modal').style.display = 'none';
      alert(`Sync Complete! Version: ${dataVersion.slice(0, 10)}`);
    },
    onError: (err) => {
      alert(`Sync Error: ${err}`);
      gate.transitionTo(GateState.WAITING_FOR_MOBILE);
    }
  });

  await syncEngine.connect();
});
```

---

## 📱 Step 3: Mobile Side Integration (Scan PC & Push Data)

Add a "Scan PC" button to your mobile view:

```html
<button id="btn-scan-pc">📷 Scan PC</button>

<div id="scanner-modal" style="display:none; position:fixed; inset:0; background:black; z-index:9999;">
  <video id="scanner-video" style="width:100%; height:100%; object-fit:cover;"></video>
  <button id="scanner-cancel" style="position:absolute; top:20px; right:20px; color:white;">✕</button>
  <div id="mobile-sync-progress" style="position:absolute; bottom:40px; left:20px; right:20px; background:rgba(0,0,0,0.8); padding:12px; border-radius:12px; color:white; text-align:center; display:none;"></div>
</div>
```

Attach the scanner & chunk push engine in your mobile script:

```javascript
import { QRScanner } from '/qr.js';
import { SyncEngine } from '/sync.js';

const videoEl = document.getElementById('scanner-video');

document.getElementById('btn-scan-pc').addEventListener('click', () => {
  document.getElementById('scanner-modal').style.display = 'block';

  const scanner = new QRScanner(
    videoEl,
    async (decodedText) => {
      scanner.stop();
      document.getElementById('scanner-modal').style.display = 'none';

      const payload = JSON.parse(decodedText);
      const wsUrl = `ws://${payload.ip}:${payload.port}`;

      const mobileSync = new SyncEngine({
        url: wsUrl,
        token: payload.token,
        role: 'mobile',
        onProgress: (percent) => {
          const progEl = document.getElementById('mobile-sync-progress');
          progEl.style.display = 'block';
          progEl.innerText = `Pushing data to PC: ${percent}%`;
        }
      });

      await mobileSync.connect();

      // >>> HOOK INTO YOUR EXISTING CODE HERE <<<
      // Retrieve current mobile records from IndexedDB / SQLite
      const mobileDataset = {
        accounts: JSON.parse(localStorage.getItem('phub_accounts_v5') || '[]'),
        transactions: JSON.parse(localStorage.getItem('phub_transactions_v5') || '[]'),
        followups: JSON.parse(localStorage.getItem('phub_followups_v5') || '[]'),
        notes: JSON.parse(localStorage.getItem('phub_notes_v5') || '[]'),
        loans: JSON.parse(localStorage.getItem('phub_loans_v5') || '[]'),
        wishlists: JSON.parse(localStorage.getItem('phub_wishlists_v5') || '[]'),
      };

      // Push all data in SHA-256 chunks to PC
      const versionHash = await mobileSync.pushData(mobileDataset);

      // Save version hash on mobile
      localStorage.setItem('dataVersion', versionHash);
      alert(`Pushed successfully! Shared version: ${versionHash.slice(0, 10)}`);
      mobileSync.disconnect();
    },
    (err) => console.error('Scan error:', err)
  );

  scanner.start();
});
```

---

## 📶 Step 4: How to Test on the Same Wi-Fi

1. **Find your PC's local IP address**:
   - On Windows: Run `ipconfig` (look for `IPv4 Address`, e.g. `192.168.1.100`)
   - On Mac/Linux: Run `ifconfig` or `ip a`

2. **Start the local server on your PC**:
   ```bash
   node server.js
   ```

3. **Open the website on your PC**:
   - Navigate to `http://localhost:8080` (or `http://<YOUR_PC_IP>:8080`)
   - The page opens in **LOCKED** state with red banner: *"Updates disabled until sync completes"*.
   - All update/edit buttons are disabled.
   - Click **Connect Mobile**. A QR code appears.

4. **Open the app on your Phone** (connected to the same Wi-Fi):
   - Navigate to `http://<YOUR_PC_IP>:8080`
   - Tap **Scan PC** and point your phone camera at the PC screen.

5. **Watch the live peer-to-peer sync**:
   - Both phone and PC display the synchronized progress bar as chunks stream over WebSocket.
   - PC verifies SHA-256 checksums and returns ACKs.
   - Upon 100%, PC transitions to **VERIFYING** then **UNLOCKED**.
   - The green banner appears on PC displaying:
     `✓ Synced - version: {hash}`
   - All editing, updates, and creation buttons are now fully enabled!
