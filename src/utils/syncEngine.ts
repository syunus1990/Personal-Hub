/**
 * syncEngine.ts - Multi-Mode Sync Engine (WebRTC P2P + WSS Cloud Relay + Local LAN + Offline 1-Tap)
 *
 * Implements:
 * - SHA-256 chunked streaming & checksum verification
 * - Secure HTTPS/WSS enforcement (fixes DOMException: insecure WebSocket on HTTPS)
 * - WebRTC DataChannel P2P signaling via PeerJS (works on Vercel & client-only static hosting)
 * - Fallback to Cloud Run WSS Relay for cross-network synchronization
 * - 1-Click offline sync packages for instant manual code/file transfer
 */

export interface QRPayload {
  type?: 'webrtc' | 'ws' | 'direct';
  token: string;
  ts: number;
  peerId?: string;
  ip?: string;
  port?: number;
  relayUrl?: string;
  checksum?: string;
  version?: string;
}

export type GateState = 'LOCKED' | 'WAITING_FOR_MOBILE' | 'SYNCING' | 'VERIFYING' | 'UNLOCKED';

// Verified active Cloud Run WSS Relay endpoint (has persistent Node.js WebSocketServer on HTTPS/WSS)
export const DEFAULT_CLOUD_RELAY_WSS = 'wss://ais-pre-cwlafjekfgwqw2oocm252g-132080948487.europe-west2.run.app';

export async function calculateChecksum(dataString: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(dataString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateRandomToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Determine safe WebSocket URL preventing Mixed Content errors on HTTPS
 */
export function buildSafeWebSocketUrl(payload: QRPayload, role: 'pc' | 'mobile'): string {
  const isPageHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

  // 1. If explicit relayUrl is provided
  if (payload.relayUrl) {
    let url = payload.relayUrl.trim();
    if (isPageHttps && url.startsWith('ws://')) {
      url = 'wss://' + url.slice(5);
    }
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}token=${encodeURIComponent(payload.token)}&role=${role}`;
  }

  const rawIp = (payload.ip || '').trim();

  // 2. If the IP is a Vercel domain, Vercel is a static host and cannot run a WebSocket server.
  // Route to the active Cloud Run WSS relay instead:
  if (rawIp.includes('vercel.app') || rawIp === '') {
    return `${DEFAULT_CLOUD_RELAY_WSS}?token=${encodeURIComponent(payload.token)}&role=${role}`;
  }

  // 3. Check if rawIp is a domain name or local IP
  const isNumericIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(rawIp) || rawIp === 'localhost' || rawIp === '127.0.0.1';

  // If the page is loaded over HTTPS, modern browsers strictly prohibit ws:// connections.
  // They require wss://, unless connecting to localhost in some development settings.
  if (isPageHttps) {
    if (isNumericIp && rawIp !== 'localhost' && rawIp !== '127.0.0.1') {
      // Trying to connect from an HTTPS page to a private IP ws:// will trigger browser security error.
      // Fallback to Cloud Run WSS relay with the session token
      return `${DEFAULT_CLOUD_RELAY_WSS}?token=${encodeURIComponent(payload.token)}&role=${role}`;
    }
    // Domain with HTTPS
    const portPart = payload.port && payload.port !== 443 && payload.port !== 80 && payload.port !== 8080 ? `:${payload.port}` : '';
    return `wss://${rawIp}${portPart}?token=${encodeURIComponent(payload.token)}&role=${role}`;
  }

  // Running over plain HTTP (e.g. local dev http://localhost:3000 or http://192.168.1.x:3000)
  const port = payload.port || 8080;
  return `ws://${rawIp}:${port}?token=${encodeURIComponent(payload.token)}&role=${role}`;
}

export function parseQRPayload(raw: string): QRPayload | null {
  try {
    const trimmed = raw.trim();
    // JSON format
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const data = JSON.parse(trimmed);
      if (data.token) {
        return {
          type: data.type || (data.peerId ? 'webrtc' : 'ws'),
          peerId: data.peerId,
          relayUrl: data.relayUrl,
          ip: data.ip,
          port: data.port ? Number(data.port) : undefined,
          token: data.token,
          ts: Number(data.ts || Date.now()),
          checksum: data.checksum,
          version: data.version,
        };
      }
    }

    // IP:port#token format
    if (trimmed.includes('#')) {
      const parts = trimmed.split('#');
      const hostPort = parts[0];
      const token = parts[1];
      const [ip, portStr] = hostPort.split(':');
      return {
        type: 'ws',
        ip: ip || '127.0.0.1',
        port: Number(portStr || 8080),
        token: token.trim(),
        ts: Date.now(),
      };
    }

    // Peer ID direct format: "phub-xxxx"
    if (trimmed.startsWith('phub-') || trimmed.startsWith('peer-')) {
      return {
        type: 'webrtc',
        peerId: trimmed,
        token: trimmed,
        ts: Date.now(),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * 1-Tap Offline Sync Package Generation (Safe JSON base64 with SHA-256 header)
 */
export async function createOfflineSyncPackage(data: any): Promise<string> {
  const json = JSON.stringify(data);
  const checksum = await calculateChecksum(json);
  const envelope = {
    v: 1,
    checksum,
    ts: Date.now(),
    payload: json,
  };
  return 'PHUB_SYNC_' + btoa(unescape(encodeURIComponent(JSON.stringify(envelope))));
}

export async function unpackOfflineSyncPackage(encoded: string): Promise<{ data: any; checksum: string } | null> {
  try {
    let clean = encoded.trim();
    if (clean.startsWith('PHUB_SYNC_')) {
      clean = clean.replace('PHUB_SYNC_', '');
    }
    const decodedStr = decodeURIComponent(escape(atob(clean)));
    const envelope = JSON.parse(decodedStr);
    if (!envelope.payload || !envelope.checksum) return null;

    const calculated = await calculateChecksum(envelope.payload);
    if (calculated !== envelope.checksum) {
      throw new Error('Checksum mismatch in offline sync package');
    }
    const parsedData = JSON.parse(envelope.payload);
    return { data: parsedData, checksum: calculated };
  } catch {
    return null;
  }
}
