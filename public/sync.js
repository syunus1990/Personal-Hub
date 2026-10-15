/**
 * sync.js - WebSocket Client + Chunked Data Push + SHA-256 Checksum + ACK Relay
 *
 * >>> HOOK INTO YOUR EXISTING CODE HERE <<<
 * Mobile: When connected via QR token, mobile slices its local dataset into chunks
 * and streams to PC over WebSocket.
 * PC: Listens for incoming chunks, verifies SHA-256 checksums, sends ACK, and writes to store.
 */

// Simple SHA-256 hex digest helper using Web Crypto API
export async function calculateChecksum(dataString) {
  const encoder = new TextEncoder();
  const data = encoder.encode(dataString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export class SyncEngine {
  constructor(options = {}) {
    this.url = options.url || null;
    this.token = options.token || null;
    this.role = options.role || 'pc'; // 'pc' or 'mobile'
    this.ws = null;
    this.chunkSize = options.chunkSize || 1024 * 16; // 16KB per chunk
    this.onProgress = options.onProgress || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.onError = options.onError || (() => {});
    this.onStateChange = options.onStateChange || (() => {});
    this.receivedChunks = [];
    this.expectedTotalChunks = 0;
  }

  connect(url, token) {
    this.url = url || this.url;
    this.token = token || this.token;

    return new Promise((resolve, reject) => {
      try {
        const fullUrl = `${this.url}?token=${encodeURIComponent(this.token)}&role=${this.role}`;
        this.ws = new WebSocket(fullUrl);

        this.ws.onopen = () => {
          this.onStateChange('CONNECTED');
          resolve(true);
        };

        this.ws.onerror = (err) => {
          this.onError('WebSocket connection error', err);
          reject(err);
        };

        this.ws.onclose = () => {
          this.onStateChange('DISCONNECTED');
        };

        this.ws.onmessage = async (event) => {
          await this.handleMessage(event.data);
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  async handleMessage(rawMessage) {
    let msg;
    try {
      msg = JSON.parse(rawMessage);
    } catch {
      return;
    }

    // Handshake Authentication
    if (msg.type === 'AUTH_CHALLENGE') {
      this.send({ type: 'AUTH_RESPONSE', token: this.token, role: this.role });
      return;
    }

    // PC Receiver: Handle incoming data chunk
    if (msg.type === 'DATA_CHUNK') {
      const { chunkIndex, totalChunks, chunkData, checksum } = msg;

      // Verify SHA-256 checksum
      const computedHash = await calculateChecksum(chunkData);
      if (computedHash !== checksum) {
        // Checksum mismatch -> Request resend
        this.send({ type: 'NACK', chunkIndex });
        return;
      }

      // Checksum valid -> Store chunk and send ACK
      this.receivedChunks[chunkIndex] = chunkData;
      this.expectedTotalChunks = totalChunks;

      const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
      this.onProgress(progress, chunkIndex + 1, totalChunks);

      this.send({ type: 'ACK', chunkIndex });

      // Check if all chunks received
      if (this.receivedChunks.filter(Boolean).length === totalChunks) {
        const fullSerializedData = this.receivedChunks.join('');
        const totalVersionHash = await calculateChecksum(fullSerializedData);
        let parsedData = null;
        try {
          parsedData = JSON.parse(fullSerializedData);
        } catch (e) {
          this.onError('Corrupted payload structure', e);
          return;
        }

        this.onComplete({
          data: parsedData,
          dataVersion: totalVersionHash,
        });
      }
    }

    // Mobile Sender: Handle ACK/NACK responses
    if (msg.type === 'ACK') {
      if (this.pendingAckResolve) {
        this.pendingAckResolve(true);
      }
    }

    if (msg.type === 'NACK') {
      if (this.pendingAckReject) {
        this.pendingAckReject(new Error(`Chunk ${msg.chunkIndex} corrupted, resending`));
      }
    }
  }

  send(obj) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }

  /**
   * Mobile Master: pushes payload in chunked stream with SHA-256 verification
   */
  async pushData(fullData) {
    // >>> HOOK INTO YOUR EXISTING CODE HERE <<<
    // Preserve existing data model; attaches dataVersion hash
    const serialized = JSON.stringify(fullData);
    const dataVersionHash = await calculateChecksum(serialized);

    const totalChunks = Math.ceil(serialized.length / this.chunkSize);
    this.onStateChange('PUSHING');

    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.chunkSize;
      const end = Math.min(start + this.chunkSize, serialized.length);
      const chunkData = serialized.slice(start, end);
      const checksum = await calculateChecksum(chunkData);

      let acknowledged = false;
      let retries = 0;

      while (!acknowledged && retries < 5) {
        const ackPromise = new Promise((resolve, reject) => {
          this.pendingAckResolve = resolve;
          this.pendingAckReject = reject;
        });

        this.send({
          type: 'DATA_CHUNK',
          chunkIndex: i,
          totalChunks,
          chunkData,
          checksum,
          dataVersion: dataVersionHash,
        });

        try {
          await ackPromise;
          acknowledged = true;
        } catch {
          retries++;
        }
      }

      if (!acknowledged) {
        throw new Error(`Failed to transmit chunk ${i} after 5 retries`);
      }

      const progress = Math.round(((i + 1) / totalChunks) * 100);
      this.onProgress(progress, i + 1, totalChunks);
    }

    this.onStateChange('PUSH_COMPLETE');
    return dataVersionHash;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
