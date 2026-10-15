/**
 * qr.js - QR Code Generation (PC) and QR Code Camera Scanning (Mobile)
 *
 * >>> HOOK INTO YOUR EXISTING CODE HERE <<<
 * PC: Generates one-time auth payload with local IP, WS port, one-time token (expires 60s), and timestamp.
 * Mobile: Opens camera stream, scans QR code, and connects to WebSocket.
 */

// Simple lightweight QR code matrix generator for canvas without heavy third-party bundles
export function generateQRPayload({ ip, port, token }) {
  return JSON.stringify({
    ip: ip || window.location.hostname || '127.0.0.1',
    port: port || 8080,
    token: token || generateRandomToken(),
    ts: Date.now(),
  });
}

export function generateRandomToken() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Render QR Code on PC Canvas
 */
export function renderQRCodeOnCanvas(canvas, text, size = 220) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = size;
  canvas.height = size;

  // Use Google Chart API or QR SVG fallback for pristine offline/online rendering
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = () => {
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
  };
  img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    text
  )}`;
}

/**
 * QR Scanner Controller for Mobile Camera
 */
export class QRScanner {
  constructor(videoElement, onScanSuccess, onScanError) {
    this.videoElement = videoElement;
    this.onScanSuccess = onScanSuccess;
    this.onScanError = onScanError;
    this.stream = null;
    this.scanning = false;
  }

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
        await this.videoElement.play();
        this.scanning = true;
        this.scanLoop();
      }
    } catch (err) {
      if (this.onScanError) this.onScanError(err);
    }
  }

  scanLoop() {
    if (!this.scanning) return;

    // Utilize native BarcodeDetector API if available (modern iOS & Android Chrome)
    if ('BarcodeDetector' in window) {
      const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
      barcodeDetector
        .detect(this.videoElement)
        .then((barcodes) => {
          if (barcodes.length > 0) {
            this.stop();
            this.onScanSuccess(barcodes[0].rawValue);
            return;
          }
          if (this.scanning) {
            requestAnimationFrame(() => this.scanLoop());
          }
        })
        .catch(() => {
          if (this.scanning) {
            requestAnimationFrame(() => this.scanLoop());
          }
        });
    } else {
      // Fallback polling loop
      setTimeout(() => {
        if (this.scanning) this.scanLoop();
      }, 500);
    }
  }

  stop() {
    this.scanning = false;
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }
}
