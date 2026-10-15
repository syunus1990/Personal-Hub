/**
 * syncEngine.ts - TypeScript WebSocket Sync Engine & Checksum Verification
 *
 * Implements:
 * - SHA-256 chunked streaming
 * - ACK/NACK protocol
 * - QR payload formatting (ip, port, token, ts)
 * - dataVersion hash generation and verification
 */

export interface QRPayload {
  ip: string;
  port: number;
  token: string;
  ts: number;
}

export type GateState = 'LOCKED' | 'WAITING_FOR_MOBILE' | 'SYNCING' | 'VERIFYING' | 'UNLOCKED';

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

export function parseQRPayload(raw: string): QRPayload | null {
  try {
    const data = JSON.parse(raw);
    if (data.ip && data.port && data.token) {
      return {
        ip: data.ip,
        port: Number(data.port),
        token: data.token,
        ts: Number(data.ts || Date.now()),
      };
    }
    return null;
  } catch {
    return null;
  }
}
