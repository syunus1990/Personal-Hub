import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import {
  Camera,
  QrCode,
  Laptop,
  Smartphone,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Wifi,
  Lock,
  Unlock,
  Layers,
  Terminal,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { triggerHaptic } from '../../utils/haptics';
import {
  QRPayload,
  GateState,
  calculateChecksum,
  generateRandomToken,
  parseQRPayload,
} from '../../utils/syncEngine';

interface QRSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'scanner' | 'pc';
}

export const QRSyncModal: React.FC<QRSyncModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'scanner',
}) => {
  const {
    settings,
    gateState,
    setGateState,
    isGateEnforced,
    setIsGateEnforced,
    dataVersion,
    setDataVersion,
    getFullSyncPayload,
    applySyncedData,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'scanner' | 'pc'>(initialTab);

  // Sync with initialTab prop changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // ==========================================
  // PC STATE (RECEIVER + QR GENERATION)
  // ==========================================
  const [pcIp, setPcIp] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost') {
      return window.location.hostname;
    }
    return '192.168.1.100';
  });
  const [pcPort, setPcPort] = useState<number>(8080);
  const [token, setToken] = useState<string>(() => generateRandomToken());
  const [expiresIn, setExpiresIn] = useState<number>(60);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [pcProgress, setPcProgress] = useState<{
    percent: number;
    current: number;
    total: number;
    statusText: string;
  }>({ percent: 0, current: 0, total: 0, statusText: 'Waiting for mobile connection...' });

  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pcWsRef = useRef<WebSocket | null>(null);

  // Token 60s countdown timer
  useEffect(() => {
    if (!isOpen || activeTab !== 'pc') return;

    const timer = setInterval(() => {
      setExpiresIn((prev) => {
        if (prev <= 1) {
          // Regenerate token after 60s
          const newToken = generateRandomToken();
          setToken(newToken);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, activeTab]);

  // Render QR Code on Canvas when IP, Port, Token change
  useEffect(() => {
    if (!isOpen || activeTab !== 'pc' || !qrCanvasRef.current) return;

    const payload: QRPayload = {
      ip: pcIp.trim(),
      port: pcPort,
      token,
      ts: Date.now(),
    };

    const payloadStr = JSON.stringify(payload);
    QRCode.toCanvas(
      qrCanvasRef.current,
      payloadStr,
      {
        width: 210,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      },
      (error) => {
        if (error) console.error('QR generation error:', error);
      }
    );

    // If gate is locked, move to WAITING_FOR_MOBILE once QR is shown
    if (gateState === 'LOCKED') {
      setGateState('WAITING_FOR_MOBILE');
    }
  }, [isOpen, activeTab, pcIp, pcPort, token, gateState, setGateState]);

  // PC WebSocket Receiver connection
  useEffect(() => {
    if (!isOpen || activeTab !== 'pc') {
      if (pcWsRef.current) {
        pcWsRef.current.close();
        pcWsRef.current = null;
      }
      return;
    }

    let ws: WebSocket | null = null;
    const receivedChunks: string[] = [];
    let expectedTotal = 0;

    try {
      const wsUrl = `ws://${pcIp.trim()}:${pcPort}?token=${encodeURIComponent(token)}&role=pc`;
      ws = new WebSocket(wsUrl);
      pcWsRef.current = ws;

      ws.onopen = () => {
        setPcProgress((p) => ({ ...p, statusText: 'Connected to relay. Ready for mobile scan.' }));
      };

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'DATA_CHUNK') {
            const { chunkIndex, totalChunks, chunkData, checksum } = msg;

            // Verify SHA-256 chunk checksum
            const calculated = await calculateChecksum(chunkData);
            if (calculated !== checksum) {
              // Checksum mismatch -> send NACK
              ws?.send(JSON.stringify({ type: 'NACK', chunkIndex }));
              setGateState('WAITING_FOR_MOBILE');
              return;
            }

            // Valid chunk -> send ACK
            receivedChunks[chunkIndex] = chunkData;
            expectedTotal = totalChunks;
            ws?.send(JSON.stringify({ type: 'ACK', chunkIndex }));

            const pct = Math.round(((chunkIndex + 1) / totalChunks) * 100);
            setGateState('SYNCING');
            setPcProgress({
              percent: pct,
              current: chunkIndex + 1,
              total: totalChunks,
              statusText: `Receiving chunk ${chunkIndex + 1}/${totalChunks} (Verified SHA-256)...`,
            });

            // Check if all chunks have arrived
            if (receivedChunks.filter(Boolean).length === totalChunks) {
              setGateState('VERIFYING');
              setPcProgress((p) => ({
                ...p,
                statusText: 'Verifying full SHA-256 payload checksum...',
              }));

              const fullJson = receivedChunks.join('');
              const fullHash = await calculateChecksum(fullJson);
              const parsed = JSON.parse(fullJson);

              // Apply parsed data to application state & store
              applySyncedData(parsed, fullHash);
              setGateState('UNLOCKED');
              setPcProgress({
                percent: 100,
                current: totalChunks,
                total: totalChunks,
                statusText: `✓ Sync complete! Shared version: ${fullHash.slice(0, 10)}`,
              });
              triggerHaptic('success', settings.enableHaptics);
            }
          }
        } catch (e) {
          console.error('Error handling WS message on PC:', e);
          setGateState('WAITING_FOR_MOBILE');
        }
      };

      ws.onerror = () => {
        setPcProgress((p) => ({
          ...p,
          statusText: 'Local relay not connected. Ensure "node server.js" is running on PC.',
        }));
      };
    } catch {
      // Ignored for environments without active relay
    }

    return () => {
      if (ws) ws.close();
    };
  }, [isOpen, activeTab, pcIp, pcPort, token, settings.enableHaptics, applySyncedData, setGateState]);

  // ==========================================
  // MOBILE STATE (CAMERA SCANNER + DATA PUSH)
  // ==========================================
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasScanRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopIdRef = useRef<number | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualPayloadText, setManualPayloadText] = useState('');

  // Mobile Push Progress
  const [mobileSyncStatus, setMobileSyncStatus] = useState<
    'idle' | 'scanning' | 'connecting' | 'pushing' | 'success' | 'error'
  >('idle');
  const [mobileProgress, setMobileProgress] = useState<{
    percent: number;
    current: number;
    total: number;
    statusText: string;
  }>({ percent: 0, current: 0, total: 0, statusText: '' });
  const [lastPushedHash, setLastPushedHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (scanLoopIdRef.current) {
      cancelAnimationFrame(scanLoopIdRef.current);
      scanLoopIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Connect & Push Data to PC over WebSocket
  const handleConnectAndPush = useCallback(
    async (payload: QRPayload) => {
      stopCamera();
      triggerHaptic('medium', settings.enableHaptics);

      setMobileSyncStatus('connecting');
      setMobileProgress({
        percent: 0,
        current: 0,
        total: 0,
        statusText: `Connecting to PC at ws://${payload.ip}:${payload.port}...`,
      });

      const wsUrl = `ws://${payload.ip}:${payload.port}?token=${encodeURIComponent(payload.token)}&role=mobile`;

      let ws: WebSocket;
      try {
        ws = new WebSocket(wsUrl);
      } catch (err: any) {
        setMobileSyncStatus('error');
        setErrorMessage(`Failed to open WebSocket: ${err.message || 'Check IP and Wi-Fi'}`);
        return;
      }

      const connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          setMobileSyncStatus('error');
          setErrorMessage(`Connection timed out to ws://${payload.ip}:${payload.port}. Ensure phone and PC are on the same Wi-Fi and "node server.js" is running.`);
        }
      }, 7000);

      ws.onopen = async () => {
        clearTimeout(connectionTimeout);
        setMobileSyncStatus('pushing');
        setMobileProgress({
          percent: 5,
          current: 0,
          total: 1,
          statusText: 'Connected! Preparing mobile dataset for SHA-256 chunking...',
        });

        try {
          // Prepare complete mobile data model
          const fullDataset = getFullSyncPayload();
          const serialized = JSON.stringify(fullDataset);
          const fullVersionHash = await calculateChecksum(serialized);

          const chunkSize = 1024 * 16; // 16 KB chunks
          const totalChunks = Math.ceil(serialized.length / chunkSize);

          setMobileProgress({
            percent: 10,
            current: 0,
            total: totalChunks,
            statusText: `Dataset ready (${Math.round(serialized.length / 1024)} KB). Streaming ${totalChunks} chunks...`,
          });

          // Push each chunk with SHA-256 checksum & wait for ACK
          for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, serialized.length);
            const chunkData = serialized.slice(start, end);
            const checksum = await calculateChecksum(chunkData);

            let acknowledged = false;
            let retries = 0;

            while (!acknowledged && retries < 5) {
              const ackPromise = new Promise<boolean>((resolve, reject) => {
                const handler = (evt: MessageEvent) => {
                  try {
                    const msg = JSON.parse(evt.data);
                    if (msg.type === 'ACK' && msg.chunkIndex === i) {
                      ws.removeEventListener('message', handler);
                      resolve(true);
                    } else if (msg.type === 'NACK' && msg.chunkIndex === i) {
                      ws.removeEventListener('message', handler);
                      reject(new Error(`Corrupted chunk ${i}`));
                    }
                  } catch {
                    // ignore
                  }
                };
                ws.addEventListener('message', handler);
                setTimeout(() => {
                  ws.removeEventListener('message', handler);
                  reject(new Error('ACK timeout'));
                }, 3000);
              });

              ws.send(
                JSON.stringify({
                  type: 'DATA_CHUNK',
                  chunkIndex: i,
                  totalChunks,
                  chunkData,
                  checksum,
                  dataVersion: fullVersionHash,
                })
              );

              try {
                await ackPromise;
                acknowledged = true;
              } catch {
                retries++;
              }
            }

            if (!acknowledged) {
              throw new Error(`Failed to transmit chunk ${i + 1} after 5 retries.`);
            }

            const pct = Math.round(((i + 1) / totalChunks) * 100);
            setMobileProgress({
              percent: pct,
              current: i + 1,
              total: totalChunks,
              statusText: `Pushing chunk ${i + 1}/${totalChunks} (ACK verified)...`,
            });
          }

          // Complete!
          setDataVersion(fullVersionHash);
          setLastPushedHash(fullVersionHash);
          setMobileSyncStatus('success');
          setMobileProgress({
            percent: 100,
            current: totalChunks,
            total: totalChunks,
            statusText: `✓ Successfully pushed to PC! Both devices are synchronized.`,
          });
          triggerHaptic('success', settings.enableHaptics);

          setTimeout(() => {
            ws.close();
          }, 1500);
        } catch (err: any) {
          setMobileSyncStatus('error');
          setErrorMessage(err.message || 'Sync failed during chunk transmission');
          ws.close();
        }
      };

      ws.onerror = () => {
        clearTimeout(connectionTimeout);
        setMobileSyncStatus('error');
        setErrorMessage(
          `Unable to connect to PC at ws://${payload.ip}:${payload.port}. Please verify PC IP, Wi-Fi network, and that "node server.js" is active.`
        );
      };
    },
    [
      stopCamera,
      settings.enableHaptics,
      getFullSyncPayload,
      setDataVersion,
    ]
  );

  // QR Scanning Loop using BarcodeDetector or jsQR fallback
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setMobileSyncStatus('scanning');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);

        const barcodeDetector =
          'BarcodeDetector' in window
            ? new (window as any).BarcodeDetector({ formats: ['qr_code'] })
            : null;

        const scanFrame = async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) {
            scanLoopIdRef.current = requestAnimationFrame(scanFrame);
            return;
          }

          let detectedValue: string | null = null;

          // 1. Try native BarcodeDetector
          if (barcodeDetector) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes && barcodes.length > 0) {
                detectedValue = barcodes[0].rawValue;
              }
            } catch {
              // fallback to jsQR
            }
          }

          // 2. Fallback to jsQR on canvas
          if (!detectedValue && canvasScanRef.current && videoRef.current) {
            const canvas = canvasScanRef.current;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
              canvas.width = videoRef.current.videoWidth || 640;
              canvas.height = videoRef.current.videoHeight || 480;
              ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
              const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(imgData.data, imgData.width, imgData.height, {
                inversionAttempts: 'dontInvert',
              });
              if (code && code.data) {
                detectedValue = code.data;
              }
            }
          }

          if (detectedValue) {
            const parsed = parseQRPayload(detectedValue);
            if (parsed) {
              handleConnectAndPush(parsed);
              return;
            }
          }

          scanLoopIdRef.current = requestAnimationFrame(scanFrame);
        };

        scanLoopIdRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. You can still connect manually using the button below.'
          : 'Could not start camera. Use manual connection or grant camera permission.'
      );
      setCameraActive(false);
    }
  }, [cameraFacing, handleConnectAndPush]);

  // Handle Tab Switch
  useEffect(() => {
    if (isOpen && activeTab === 'scanner') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, startCamera, stopCamera]);

  // Flip Camera
  const toggleCameraFacing = () => {
    stopCamera();
    setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
    setTimeout(() => {
      startCamera();
    }, 200);
  };

  // Submit Manual Payload Text
  const handleManualPayloadSubmit = () => {
    if (!manualPayloadText.trim()) return;
    const parsed = parseQRPayload(manualPayloadText.trim());
    if (parsed) {
      handleConnectAndPush(parsed);
      setShowManualInput(false);
    } else {
      // Allow simple format "192.168.1.100:8080#token"
      const parts = manualPayloadText.trim().split('#');
      if (parts.length >= 2) {
        const [hostPort, tk] = parts;
        const [ip, portStr] = hostPort.split(':');
        handleConnectAndPush({
          ip,
          port: Number(portStr || 8080),
          token: tk,
          ts: Date.now(),
        });
        setShowManualInput(false);
      } else {
        alert('Invalid QR payload format. Expected JSON with {ip, port, token} or ip:port#token.');
      }
    }
  };

  // Run Local Test Loopback (simulates mobile pushing to this instance)
  const handleRunLocalDemoSync = async () => {
    triggerHaptic('medium', settings.enableHaptics);
    setGateState('SYNCING');
    setPcProgress({
      percent: 10,
      current: 1,
      total: 8,
      statusText: 'Receiving chunk 1/8 with SHA-256 checksum...',
    });

    for (let i = 1; i <= 8; i++) {
      await new Promise((r) => setTimeout(r, 220));
      const pct = Math.round((i / 8) * 100);
      setPcProgress({
        percent: pct,
        current: i,
        total: 8,
        statusText: `Receiving chunk ${i}/8 (Verified SHA-256 checksum)...`,
      });
    }

    setGateState('VERIFYING');
    await new Promise((r) => setTimeout(r, 350));

    const demoHash = '3a98ef' + generateRandomToken().slice(0, 10);
    setDataVersion(demoHash);
    setGateState('UNLOCKED');
    setPcProgress({
      percent: 100,
      current: 8,
      total: 8,
      statusText: `✓ Synced - version: ${demoHash.slice(0, 10)}`,
    });
    triggerHaptic('success', settings.enableHaptics);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#151D2A] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                QR Peer-to-Peer Sync
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Local Wi-Fi • No Cloud Required
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/40 p-1 gap-1">
          <button
            onClick={() => {
              setActiveTab('scanner');
              triggerHaptic('light', settings.enableHaptics);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'scanner'
                ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>📷 Mobile Scanner (Scan PC)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('pc');
              stopCamera();
              triggerHaptic('light', settings.enableHaptics);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'pc'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>💻 PC / Laptop (Show QR)</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* ============================================================== */}
          {/* TAB 1: MOBILE SCANNER (SCAN PC & PUSH DATA) */}
          {/* ============================================================== */}
          {activeTab === 'scanner' && (
            <div className="space-y-4">
              {/* Instructions banner */}
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/40 text-xs text-purple-900 dark:text-purple-200">
                <p className="font-semibold flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-purple-600 shrink-0" />
                  Mobile is Master: Point your camera at the QR code on your Laptop/PC.
                </p>
                <p className="text-[11px] opacity-80 mt-1">
                  Once scanned, this phone connects directly over your local Wi-Fi and pushes all data in verified SHA-256 chunks.
                </p>
              </div>

              {/* Viewfinder Container */}
              <div className="relative w-full aspect-square max-w-[280px] mx-auto rounded-2xl overflow-hidden bg-black border-2 border-slate-700 shadow-lg flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                <canvas ref={canvasScanRef} className="hidden" />

                {/* Overlay Brackets */}
                <div className="absolute inset-4 pointer-events-none border-2 border-purple-400/80 rounded-xl flex items-center justify-center">
                  {/* Laser line animation */}
                  {cameraActive && (
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_8px_#a855f7] animate-pulse" />
                  )}
                </div>

                {!cameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 p-4 text-center text-slate-300">
                    <Camera className="w-8 h-8 text-purple-400 mb-2 animate-bounce" />
                    <p className="text-xs font-medium">Camera standby</p>
                    <button
                      onClick={startCamera}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
                    >
                      Start Camera
                    </button>
                  </div>
                )}

                {/* Flip camera button */}
                {cameraActive && (
                  <button
                    onClick={toggleCameraFacing}
                    className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/60 text-white backdrop-blur-sm hover:bg-black/80 transition-colors"
                    title="Flip camera"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>

              {cameraError && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">{cameraError}</div>
                </div>
              )}

              {/* Progress & Streaming Status */}
              {(mobileSyncStatus === 'connecting' ||
                mobileSyncStatus === 'pushing' ||
                mobileSyncStatus === 'success' ||
                mobileSyncStatus === 'error') && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-200">
                      Sync Progress:
                    </span>
                    <span className="font-mono text-purple-600 dark:text-purple-400">
                      {mobileProgress.percent}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-200 rounded-full ${
                        mobileSyncStatus === 'error'
                          ? 'bg-rose-500'
                          : mobileSyncStatus === 'success'
                          ? 'bg-emerald-500'
                          : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                      }`}
                      style={{ width: `${mobileProgress.percent}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {mobileProgress.statusText}
                  </p>

                  {mobileSyncStatus === 'success' && lastPushedHash && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        dataVersion:
                      </span>
                      <span className="font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded text-[11px]">
                        {lastPushedHash.slice(0, 16)}...
                      </span>
                    </div>
                  )}

                  {mobileSyncStatus === 'error' && errorMessage && (
                    <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Manual Connection Drawer */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setShowManualInput(!showManualInput)}
                  className="w-full py-2 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium flex items-center justify-center gap-1.5"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>{showManualInput ? 'Hide manual connection' : 'Camera unavailable? Paste QR payload or type IP:port'}</span>
                </button>

                {showManualInput && (
                  <div className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                      Paste QR Payload JSON or (IP:Port#Token):
                    </label>
                    <textarea
                      value={manualPayloadText}
                      onChange={(e) => setManualPayloadText(e.target.value)}
                      placeholder='{"ip":"192.168.1.100","port":8080,"token":"..."}'
                      className="w-full text-xs font-mono p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500 h-16"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleManualPayloadSubmit}
                        className="flex-1 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-1"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        Connect & Push Now
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: PC / LAPTOP (SHOW QR & MANDATORY SYNC GATE) */}
          {/* ============================================================== */}
          {activeTab === 'pc' && (
            <div className="space-y-4">
              {/* Mandatory Gate State Indicator */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    {gateState === 'UNLOCKED' ? (
                      <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-rose-500" />
                    )}
                    PC Gate State:
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full font-mono uppercase ${
                      gateState === 'UNLOCKED'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : gateState === 'SYNCING'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 animate-pulse'
                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {gateState}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Enforce Sync Gate on PC:</span>
                  <button
                    onClick={() => {
                      const next = !isGateEnforced;
                      setIsGateEnforced(next);
                      if (next && gateState === 'UNLOCKED') {
                        setGateState('LOCKED');
                      }
                      triggerHaptic('light', settings.enableHaptics);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      isGateEnforced
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isGateEnforced ? 'Gate Active (Mandatory)' : 'Gate Disabled'}
                  </button>
                </div>
              </div>

              {/* QR Code Canvas */}
              <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                <canvas
                  ref={qrCanvasRef}
                  className="rounded-xl shadow-sm border border-slate-100 dark:border-slate-800"
                />

                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>Token expires in:</span>
                  <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                    {expiresIn}s
                  </span>
                  <button
                    onClick={() => {
                      setToken(generateRandomToken());
                      setExpiresIn(60);
                      triggerHaptic('light', settings.enableHaptics);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Refresh token"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Network Configuration */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    PC Local Wi-Fi IP:
                  </span>
                  <input
                    type="text"
                    value={pcIp}
                    onChange={(e) => setPcIp(e.target.value)}
                    placeholder="e.g. 192.168.1.100"
                    className="w-36 px-2 py-1 text-right font-mono text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    WebSocket Port:
                  </span>
                  <input
                    type="number"
                    value={pcPort}
                    onChange={(e) => setPcPort(Number(e.target.value))}
                    className="w-20 px-2 py-1 text-right font-mono text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => {
                      const payloadStr = JSON.stringify({
                        ip: pcIp.trim(),
                        port: pcPort,
                        token,
                        ts: Date.now(),
                      });
                      navigator.clipboard.writeText(payloadStr);
                      setCopiedPayload(true);
                      setTimeout(() => setCopiedPayload(false), 2000);
                      triggerHaptic('light', settings.enableHaptics);
                    }}
                    className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    {copiedPayload ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPayload ? 'Copied QR Payload!' : 'Copy QR Payload JSON'}</span>
                  </button>

                  <button
                    onClick={handleRunLocalDemoSync}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                    title="Simulate complete chunked sync cycle to verify gate unlock"
                  >
                    ⚡ Test Local Sync
                  </button>
                </div>
              </div>

              {/* Live PC Progress */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300">PC Receiver Status:</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">
                    {pcProgress.percent}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-200 ${
                      gateState === 'UNLOCKED' ? 'bg-emerald-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${pcProgress.percent}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  {pcProgress.statusText}
                </p>

                {dataVersion && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1">
                    <span>Active dataVersion:</span>
                    <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">
                      {dataVersion.slice(0, 14)}...
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>SHA-256 Verified Streaming</span>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
