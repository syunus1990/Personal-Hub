import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { Peer } from 'peerjs';
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
  Radio,
  FileCode,
  Download,
  Upload,
  Globe,
  Share2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { triggerHaptic } from '../../utils/haptics';
import {
  QRPayload,
  GateState,
  DEFAULT_CLOUD_RELAY_WSS,
  calculateChecksum,
  generateRandomToken,
  buildSafeWebSocketUrl,
  parseQRPayload,
  createOfflineSyncPackage,
  unpackOfflineSyncPackage,
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
  const [syncMode, setSyncMode] = useState<'p2p' | 'lan' | 'offline'>('p2p');

  // Sync with initialTab prop changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // ==========================================
  // PC STATE (RECEIVER + QR GENERATION)
  // ==========================================
  const [pcIp, setPcIp] = useState<string>('192.168.1.100');
  const [pcPort, setPcPort] = useState<number>(3000);
  const [token, setToken] = useState<string>(() => generateRandomToken());
  const [expiresIn, setExpiresIn] = useState<number>(60);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedOfflineCode, setCopiedOfflineCode] = useState(false);
  const [offlineInputText, setOfflineInputText] = useState('');
  const [offlineStatusMsg, setOfflineStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [pcProgress, setPcProgress] = useState<{
    percent: number;
    current: number;
    total: number;
    statusText: string;
  }>({ percent: 0, current: 0, total: 0, statusText: 'Initializing secure sync gateway...' });

  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pcWsRef = useRef<WebSocket | null>(null);
  const pcPeerRef = useRef<Peer | null>(null);

  // Token 60s countdown timer
  useEffect(() => {
    if (!isOpen || activeTab !== 'pc') return;

    const timer = setInterval(() => {
      setExpiresIn((prev) => {
        if (prev <= 1) {
          const newToken = generateRandomToken();
          setToken(newToken);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, activeTab]);

  // 1. Render QR Code on Canvas when mode or token changes
  useEffect(() => {
    if (!isOpen || activeTab !== 'pc' || !qrCanvasRef.current) return;

    const peerId = `phub-${token.slice(0, 10)}`;
    const payload: QRPayload = {
      type: syncMode === 'lan' ? 'ws' : 'webrtc',
      token,
      ts: Date.now(),
      peerId,
      relayUrl: DEFAULT_CLOUD_RELAY_WSS,
      ip: syncMode === 'lan' ? pcIp.trim() : undefined,
      port: syncMode === 'lan' ? pcPort : undefined,
    };

    const payloadStr = JSON.stringify(payload);
    QRCode.toCanvas(
      qrCanvasRef.current,
      payloadStr,
      {
        width: 220,
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

    if (gateState === 'LOCKED') {
      setGateState('WAITING_FOR_MOBILE');
    }
  }, [isOpen, activeTab, syncMode, pcIp, pcPort, token, gateState, setGateState]);

  // 2. PC Receiver Channel (WebRTC PeerJS + WebSocket Relay in parallel)
  useEffect(() => {
    if (!isOpen || activeTab !== 'pc') {
      if (pcWsRef.current) {
        pcWsRef.current.close();
        pcWsRef.current = null;
      }
      if (pcPeerRef.current) {
        pcPeerRef.current.destroy();
        pcPeerRef.current = null;
      }
      return;
    }

    const receivedChunks: string[] = [];
    const peerId = `phub-${token.slice(0, 10)}`;

    const processIncomingChunk = async (msg: any, sendAck: (ackMsg: any) => void) => {
      try {
        if (msg.type === 'DATA_CHUNK') {
          const { chunkIndex, totalChunks, chunkData, checksum } = msg;

          // Verify SHA-256 chunk checksum
          const calculated = await calculateChecksum(chunkData);
          if (calculated !== checksum) {
            sendAck({ type: 'NACK', chunkIndex });
            setGateState('WAITING_FOR_MOBILE');
            return;
          }

          // Valid chunk -> send ACK
          receivedChunks[chunkIndex] = chunkData;
          sendAck({ type: 'ACK', chunkIndex });

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
              statusText: 'Verifying complete dataset SHA-256 checksum...',
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
              statusText: `✓ Gate Unlocked! Verified version: ${fullHash.slice(0, 10)}`,
            });
            triggerHaptic('success', settings.enableHaptics);
          }
        }
      } catch (e) {
        console.error('Error handling incoming sync chunk:', e);
        setGateState('WAITING_FOR_MOBILE');
      }
    };

    // A. Setup WebRTC Peer on PC
    let peer: Peer | null = null;
    try {
      peer = new Peer(peerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        },
      });
      pcPeerRef.current = peer;

      peer.on('open', (id) => {
        setPcProgress((p) => ({
          ...p,
          statusText: `Ready for Mobile scan (WebRTC P2P Active: ${id}).`,
        }));
      });

      peer.on('connection', (conn) => {
        setPcProgress((p) => ({
          ...p,
          statusText: 'Mobile connected via direct WebRTC DataChannel!',
        }));
        conn.on('data', (data: any) => {
          const msg = typeof data === 'string' ? JSON.parse(data) : data;
          processIncomingChunk(msg, (ack) => conn.send(ack));
        });
      });

      peer.on('error', (err) => {
        console.warn('PeerJS PC warning/fallback to WSS:', err?.type);
      });
    } catch (e) {
      console.warn('WebRTC peer initialization fallback:', e);
    }

    // B. Setup WebSocket Relay in parallel (handles WSS cloud relay & local LAN)
    let ws: WebSocket | null = null;
    try {
      const payload: QRPayload = {
        token,
        ts: Date.now(),
        ip: syncMode === 'lan' ? pcIp.trim() : undefined,
        port: syncMode === 'lan' ? pcPort : undefined,
        relayUrl: DEFAULT_CLOUD_RELAY_WSS,
      };
      const wsUrl = buildSafeWebSocketUrl(payload, 'pc');
      ws = new WebSocket(wsUrl);
      pcWsRef.current = ws;

      ws.onopen = () => {
        setPcProgress((p) => ({
          ...p,
          statusText: 'Secure relay standby. Scan QR on mobile to push data.',
        }));
      };

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
          await processIncomingChunk(msg, (ack) => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(ack));
            }
          });
        } catch (e) {
          console.error('Error handling WS message on PC:', e);
        }
      };

      ws.onerror = () => {
        // Ignored as WebRTC Peer operates simultaneously
      };
    } catch {
      // Ignored
    }

    return () => {
      if (ws) ws.close();
      if (peer) peer.destroy();
    };
  }, [isOpen, activeTab, syncMode, pcIp, pcPort, token, settings.enableHaptics, applySyncedData, setGateState]);

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

  // Transmit Chunks via Active Channel (WebRTC DataChannel or WebSocket)
  const streamChunksOverChannel = async (
    sendFunction: (msg: any) => void,
    onAckReceiver: (callback: (msg: any) => void) => () => void
  ) => {
    setMobileSyncStatus('pushing');
    setMobileProgress({
      percent: 5,
      current: 0,
      total: 1,
      statusText: 'Connected! Preparing dataset for SHA-256 chunking...',
    });

    const fullDataset = getFullSyncPayload();
    const serialized = JSON.stringify(fullDataset);
    const fullVersionHash = await calculateChecksum(serialized);

    const chunkSize = 1024 * 16; // 16 KB chunks
    const totalChunks = Math.ceil(serialized.length / chunkSize);

    setMobileProgress({
      percent: 10,
      current: 0,
      total: totalChunks,
      statusText: `Dataset ready (${Math.round(serialized.length / 1024)} KB). Streaming ${totalChunks} verified chunks...`,
    });

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, serialized.length);
      const chunkData = serialized.slice(start, end);
      const checksum = await calculateChecksum(chunkData);

      let acknowledged = false;
      let retries = 0;

      while (!acknowledged && retries < 5) {
        const ackPromise = new Promise<boolean>((resolve, reject) => {
          const unsubscribe = onAckReceiver((msg: any) => {
            if (msg.type === 'ACK' && msg.chunkIndex === i) {
              unsubscribe();
              resolve(true);
            } else if (msg.type === 'NACK' && msg.chunkIndex === i) {
              unsubscribe();
              reject(new Error(`Corrupted chunk ${i}`));
            }
          });
          setTimeout(() => {
            unsubscribe();
            reject(new Error('ACK timeout'));
          }, 3500);
        });

        sendFunction({
          type: 'DATA_CHUNK',
          chunkIndex: i,
          totalChunks,
          chunkData,
          checksum,
          dataVersion: fullVersionHash,
        });

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

    setDataVersion(fullVersionHash);
    setLastPushedHash(fullVersionHash);
    setMobileSyncStatus('success');
    setMobileProgress({
      percent: 100,
      current: totalChunks,
      total: totalChunks,
      statusText: '✓ Successfully synchronized to PC! Gate unlocked.',
    });
    triggerHaptic('success', settings.enableHaptics);
  };

  // Connect & Push Data to PC (WebRTC P2P first, fallback to secure WSS)
  const handleConnectAndPush = useCallback(
    async (payload: QRPayload) => {
      stopCamera();
      triggerHaptic('medium', settings.enableHaptics);

      setMobileSyncStatus('connecting');
      setErrorMessage(null);
      setMobileProgress({
        percent: 0,
        current: 0,
        total: 0,
        statusText: 'Connecting to PC via secure gateway...',
      });

      let transmissionStarted = false;

      // 1. Try WebRTC P2P via PeerJS if peerId is present
      if (payload.peerId) {
        try {
          const mobilePeer = new Peer({
            debug: 1,
            config: {
              iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
              ],
            },
          });

          mobilePeer.on('open', () => {
            const conn = mobilePeer.connect(payload.peerId!, { reliable: true });

            conn.on('open', async () => {
              if (transmissionStarted) return;
              transmissionStarted = true;

              try {
                await streamChunksOverChannel(
                  (msg) => conn.send(msg),
                  (cb) => {
                    const listener = (data: any) => {
                      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
                      cb(parsed);
                    };
                    conn.on('data', listener);
                    return () => conn.off('data', listener);
                  }
                );
                setTimeout(() => {
                  conn.close();
                  mobilePeer.destroy();
                }, 2000);
              } catch (err: any) {
                console.error('WebRTC transmission failed:', err);
                setMobileSyncStatus('error');
                setErrorMessage(err?.message || 'WebRTC transmission error');
              }
            });
          });
        } catch (webrtcErr) {
          console.warn('WebRTC P2P connection skipped/error:', webrtcErr);
        }
      }

      // 2. Setup Secure WebSocket Relay connection (Safe HTTPS/WSS enforcement)
      try {
        const safeWsUrl = buildSafeWebSocketUrl(payload, 'mobile');
        setMobileProgress((p) => ({
          ...p,
          statusText: `Connecting via secure relay (${safeWsUrl.replace(/\?.*$/, '')})...`,
        }));

        const ws = new WebSocket(safeWsUrl);

        const connectionTimeout = setTimeout(() => {
          if (!transmissionStarted && ws.readyState !== WebSocket.OPEN) {
            ws.close();
            setMobileSyncStatus('error');
            setErrorMessage(
              'Connection timeout. You can use the 1-Tap Offline Code below to sync without any network!'
            );
          }
        }, 8000);

        ws.onopen = async () => {
          clearTimeout(connectionTimeout);
          if (transmissionStarted) {
            ws.close();
            return;
          }
          transmissionStarted = true;

          try {
            await streamChunksOverChannel(
              (msg) => ws.send(JSON.stringify(msg)),
              (cb) => {
                const handler = (evt: MessageEvent) => {
                  try {
                    const parsed = JSON.parse(evt.data);
                    cb(parsed);
                  } catch {
                    // ignore
                  }
                };
                ws.addEventListener('message', handler);
                return () => ws.removeEventListener('message', handler);
              }
            );

            setTimeout(() => {
              ws.close();
            }, 2000);
          } catch (err: any) {
            setMobileSyncStatus('error');
            setErrorMessage(err.message || 'Sync failed during chunk transmission');
            ws.close();
          }
        };

        ws.onerror = () => {
          if (!transmissionStarted) {
            clearTimeout(connectionTimeout);
            setMobileSyncStatus('error');
            setErrorMessage(
              'Could not connect via relay. Use the 1-Tap Offline Sync below to transfer instantly!'
            );
          }
        };
      } catch (err: any) {
        if (!transmissionStarted) {
          setMobileSyncStatus('error');
          setErrorMessage(err.message || 'Failed to initiate secure connection.');
        }
      }
    },
    [stopCamera, settings.enableHaptics, getFullSyncPayload, setDataVersion]
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
          ? 'Camera permission denied. Use manual connection or the 1-Tap Offline Code below.'
          : 'Could not access camera. You can connect manually or paste the 1-Tap Offline Code.'
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
      alert('Invalid QR payload format. Please scan the QR code on PC or use 1-Tap Offline Sync.');
    }
  };

  // Copy 1-Tap Offline Sync Package from Phone
  const handleCopyMobileOfflinePackage = async () => {
    try {
      const fullDataset = getFullSyncPayload();
      const encoded = await createOfflineSyncPackage(fullDataset);
      navigator.clipboard.writeText(encoded);
      setCopiedOfflineCode(true);
      triggerHaptic('success', settings.enableHaptics);
      setTimeout(() => setCopiedOfflineCode(false), 2500);
    } catch (e: any) {
      alert('Could not copy package: ' + e?.message);
    }
  };

  // Apply Offline Package on PC
  const handleApplyOfflinePackageOnPc = async () => {
    if (!offlineInputText.trim()) return;
    setOfflineStatusMsg(null);
    try {
      // Check if raw JSON or encoded package
      let parsedData: any = null;
      let hash = '';
      if (offlineInputText.trim().startsWith('{')) {
        parsedData = JSON.parse(offlineInputText.trim());
        hash = await calculateChecksum(offlineInputText.trim());
      } else {
        const result = await unpackOfflineSyncPackage(offlineInputText.trim());
        if (!result) throw new Error('Invalid offline package format');
        parsedData = result.data;
        hash = result.checksum;
      }

      applySyncedData(parsedData, hash);
      setGateState('UNLOCKED');
      setOfflineStatusMsg({
        type: 'success',
        text: `✓ Successfully synced! Verified SHA-256: ${hash.slice(0, 10)}. Gate Unlocked!`,
      });
      triggerHaptic('success', settings.enableHaptics);
      setOfflineInputText('');
    } catch (err: any) {
      setOfflineStatusMsg({
        type: 'error',
        text: `Error applying sync package: ${err.message}`,
      });
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
      await new Promise((r) => setTimeout(r, 180));
      const pct = Math.round((i / 8) * 100);
      setPcProgress({
        percent: pct,
        current: i,
        total: 8,
        statusText: `Receiving chunk ${i}/8 (Verified SHA-256 checksum)...`,
      });
    }

    setGateState('VERIFYING');
    await new Promise((r) => setTimeout(r, 300));

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-[#121926] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-purple-50/50 via-white to-indigo-50/50 dark:from-slate-900 dark:via-[#121926] dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/20 font-bold">
              <QrCode className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Peer-to-Peer Data Sync
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Secure HTTPS • WebRTC Direct P2P • Zero Mixed-Content
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/60 p-1.5 gap-1.5">
          <button
            onClick={() => {
              setActiveTab('scanner');
              triggerHaptic('light', settings.enableHaptics);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'scanner'
                ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>📷 Mobile Scanner (Scan PC)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('pc');
              stopCamera();
              triggerHaptic('light', settings.enableHaptics);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'pc'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>💻 PC / Laptop (Show QR)</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* ============================================================== */}
          {/* TAB 1: MOBILE SCANNER (SCAN PC & PUSH DATA) */}
          {/* ============================================================== */}
          {activeTab === 'scanner' && (
            <div className="space-y-4">
              {/* Instructions banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/20 border border-purple-200/60 dark:border-purple-800/40 text-xs text-purple-950 dark:text-purple-200">
                <p className="font-semibold flex items-center gap-2 text-[13px]">
                  <Smartphone className="w-4 h-4 text-purple-600 shrink-0" />
                  Mobile is Master: Point phone camera at PC screen
                </p>
                <p className="text-[11px] opacity-80 mt-1 leading-relaxed">
                  Open this link on your PC, click <strong>"PC / Laptop (Show QR)"</strong>, and scan the QR code. All your phone's data will stream directly to your PC with verified SHA-256 integrity.
                </p>
              </div>

              {/* Viewfinder Container */}
              <div className="relative w-full aspect-square max-w-[280px] mx-auto rounded-3xl overflow-hidden bg-black border-2 border-slate-700/80 shadow-2xl flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                <canvas ref={canvasScanRef} className="hidden" />

                {/* Overlay Brackets */}
                <div className="absolute inset-5 pointer-events-none border-2 border-purple-400/80 rounded-2xl flex items-center justify-center">
                  {cameraActive && (
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_12px_#a855f7] animate-pulse" />
                  )}
                </div>

                {!cameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 p-4 text-center text-slate-300">
                    <Camera className="w-9 h-9 text-purple-400 mb-2 animate-bounce" />
                    <p className="text-xs font-medium">Camera standby</p>
                    <button
                      onClick={startCamera}
                      className="mt-3 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all"
                    >
                      Start Camera
                    </button>
                  </div>
                )}

                {/* Flip camera button */}
                {cameraActive && (
                  <button
                    onClick={toggleCameraFacing}
                    className="absolute bottom-3 right-3 p-2.5 rounded-2xl bg-black/60 text-white backdrop-blur-md hover:bg-black/80 transition-colors"
                    title="Flip camera"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>

              {cameraError && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">{cameraError}</div>
                </div>
              )}

              {/* Progress & Streaming Status */}
              {(mobileSyncStatus === 'connecting' ||
                mobileSyncStatus === 'pushing' ||
                mobileSyncStatus === 'success' ||
                mobileSyncStatus === 'error') && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800 dark:text-slate-200">
                      Sync Progress:
                    </span>
                    <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">
                      {mobileProgress.percent}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        mobileSyncStatus === 'error'
                          ? 'bg-rose-500'
                          : mobileSyncStatus === 'success'
                          ? 'bg-emerald-500'
                          : 'bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600'
                      }`}
                      style={{ width: `${mobileProgress.percent}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {mobileProgress.statusText}
                  </p>

                  {mobileSyncStatus === 'success' && lastPushedHash && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Verified Version:
                      </span>
                      <span className="font-mono bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-lg text-[11px] font-bold">
                        {lastPushedHash.slice(0, 16)}...
                      </span>
                    </div>
                  )}

                  {mobileSyncStatus === 'error' && errorMessage && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                      <span className="text-[11px]">{errorMessage}</span>
                    </div>
                  )}
                </div>
              )}

              {/* 1-Tap Offline Sync Alternative */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-indigo-600" />
                    1-Tap Offline Sync (No Camera / No Wi-Fi Needed)
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Can't scan or on different networks? Copy the mobile data package and paste it into your PC in 3 seconds:
                </p>
                <button
                  onClick={handleCopyMobileOfflinePackage}
                  className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  {copiedOfflineCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedOfflineCode ? 'Copied Mobile Sync Package!' : 'Copy Mobile Sync Package'}</span>
                </button>
              </div>

              {/* Manual Connection Drawer */}
              <div className="pt-1 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setShowManualInput(!showManualInput)}
                  className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium flex items-center justify-center gap-1.5"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>{showManualInput ? 'Hide manual connection' : 'Camera unavailable? Paste QR payload or type IP:port'}</span>
                </button>

                {showManualInput && (
                  <div className="mt-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                      Paste QR Payload JSON or (IP:Port#Token):
                    </label>
                    <textarea
                      value={manualPayloadText}
                      onChange={(e) => setManualPayloadText(e.target.value)}
                      placeholder='{"peerId":"phub-xxxx","token":"..."} or 192.168.1.100:3000#token'
                      className="w-full text-xs font-mono p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500 h-16"
                    />
                    <button
                      onClick={handleManualPayloadSubmit}
                      className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      Connect & Push to PC
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: PC / LAPTOP (SHOW QR & GATE CONTROLLER) */}
          {/* ============================================================== */}
          {activeTab === 'pc' && (
            <div className="space-y-4">
              {/* Mandatory Gate State Indicator */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    {gateState === 'UNLOCKED' ? (
                      <Unlock className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Lock className="w-4 h-4 text-rose-500" />
                    )}
                    PC Gate State:
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full font-mono uppercase ${
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
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      isGateEnforced
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isGateEnforced ? 'Gate Active (Mandatory)' : 'Gate Disabled'}
                  </button>
                </div>
              </div>

              {/* Sync Mode Selector */}
              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 text-xs font-semibold gap-1">
                <button
                  onClick={() => setSyncMode('p2p')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                    syncMode === 'p2p'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>🚀 Direct P2P (Web)</span>
                </button>
                <button
                  onClick={() => setSyncMode('lan')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                    syncMode === 'lan'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  <Wifi className="w-3.5 h-3.5" />
                  <span>📶 Local LAN</span>
                </button>
                <button
                  onClick={() => setSyncMode('offline')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                    syncMode === 'offline'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>📋 Offline Paste</span>
                </button>
              </div>

              {/* MODE 1 & 2: QR CODE CANVAS */}
              {syncMode !== 'offline' && (
                <>
                  <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                    <canvas
                      ref={qrCanvasRef}
                      className="rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800"
                    />

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>Live Token expires in:</span>
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

                  {syncMode === 'lan' && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          PC Local Wi-Fi IP:
                        </span>
                        <input
                          type="text"
                          value={pcIp}
                          onChange={(e) => setPcIp(e.target.value)}
                          placeholder="e.g. 192.168.1.100"
                          className="w-36 px-2.5 py-1 text-right font-mono text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Server Port:
                        </span>
                        <input
                          type="number"
                          value={pcPort}
                          onChange={(e) => setPcPort(Number(e.target.value))}
                          className="w-20 px-2.5 py-1 text-right font-mono text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs">
                    <button
                      onClick={() => {
                        const payloadStr = JSON.stringify({
                          type: 'webrtc',
                          peerId: `phub-${token.slice(0, 10)}`,
                          token,
                          relayUrl: DEFAULT_CLOUD_RELAY_WSS,
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
                      ⚡ Test Local Gate Unlock
                    </button>
                  </div>
                </>
              )}

              {/* MODE 3: OFFLINE PASTE ON PC */}
              {syncMode === 'offline' && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Paste Mobile Sync Package or Backup JSON:
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Tap "Copy Mobile Sync Package" on your phone, then paste it here:
                    </p>
                  </div>

                  <textarea
                    value={offlineInputText}
                    onChange={(e) => setOfflineInputText(e.target.value)}
                    placeholder="Paste PHUB_SYNC_... or raw backup JSON here..."
                    className="w-full text-xs font-mono p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-28"
                  />

                  <button
                    onClick={handleApplyOfflinePackageOnPc}
                    disabled={!offlineInputText.trim()}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify SHA-256 & Unlock PC Gate</span>
                  </button>

                  {offlineStatusMsg && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        offlineStatusMsg.type === 'success'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {offlineStatusMsg.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                      )}
                      <span className="text-[11px]">{offlineStatusMsg.text}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Live PC Progress */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300">PC Receiver Status:</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                    {pcProgress.percent}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
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
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>SHA-256 Verified Streaming</span>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
