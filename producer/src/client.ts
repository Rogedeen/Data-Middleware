import * as net from 'net';
import { generateRawLog } from './generator';
import { IRawLogData } from '../../shared/types';

export class LogProducer {
  private socket: net.Socket | null = null;
  private isPaused: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  
  private host: string;
  private port: number;
  private chunkSize: number;
  private intervalMs: number;
  private isConnecting: boolean = false;

  constructor(host: string, port: number, chunkSize: number = 500, intervalMs: number = 100) {
    this.host = host;
    this.port = port;
    this.chunkSize = chunkSize;
    this.intervalMs = intervalMs;
  }

  /**
   * TCP Soket sunucusuna bağlanır.
   */
  public connect(): void {
    if (this.isConnecting) return;
    this.isConnecting = true;

    console.log(`[Producer] Connecting to Middleware at ${this.host}:${this.port}...`);
    this.socket = new net.Socket();

    this.socket.connect(this.port, this.host, () => {
      console.log(`[Producer] Connected to Middleware successfully.`);
      this.isConnecting = false;
      this.isPaused = false;
      this.startLoop();
    });

    this.socket.on('drain', () => {
      if (this.isPaused) {
        console.log('[Producer] TCP Socket buffer drained. Resuming log generation (Backpressure relieved).');
        this.isPaused = false;
        this.resumeLoop();
      }
    });

    this.socket.on('close', () => {
      console.warn(`[Producer] Connection closed. Attempting reconnect in 5 seconds...`);
      this.isConnecting = false;
      this.stop();
      setTimeout(() => this.connect(), 5000);
    });

    this.socket.on('error', (err) => {
      console.error(`[Producer] Socket error: ${err.message}`);
      // 'close' event will handle reconnection
    });
  }

  /**
   * Log üretim döngüsünü başlatır.
   */
  private startLoop(): void {
    this.resumeLoop();
  }

  /**
   * Döngüyü sürdürür.
   */
  private resumeLoop(): void {
    if (this.intervalId || !this.socket) return;

    const run = () => {
      if (this.isPaused || !this.socket) {
        this.intervalId = null;
        return;
      }

      // 1. Belirlenen chunk boyutunda log üret
      const logs: IRawLogData[] = [];
      for (let i = 0; i < this.chunkSize; i++) {
        logs.push(generateRawLog());
      }

      // 2. NDJSON formatında serialize et (JSON array + \n)
      const payload = JSON.stringify(logs) + '\n';

      // 3. TCP üzerinden gönder ve buffer durumunu kontrol et
      const canWrite = this.socket.write(payload, 'utf8');

      if (!canWrite) {
        console.warn(`[Producer] TCP Buffer full! Pausing log generation (Backpressure triggered). Queue size in kernel is backing up.`);
        this.isPaused = true;
        this.intervalId = null;
      } else {
        // Bir sonraki adımı planla
        this.intervalId = setTimeout(run, this.intervalMs);
      }
    };

    run();
  }

  /**
   * Log üreticini durdurur.
   */
  public stop(): void {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
  }
}
