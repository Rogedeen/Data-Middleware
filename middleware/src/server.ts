import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';
import { ITCPChunkAdapter, ILogProcessor } from '../../shared/interfaces';
import { IRawLogData, IProcessedLogData, UserRole } from '../../shared/types';
import { TCPChunkAdapter } from './adapter/chunkAdapter';
import { initializeFormatterFactory } from './factory/formatterFactory';

/** Pipeline factory tipi: her bağlantı için senderId ile yeni bir zincir oluşturur. */
type PipelineFactory = (senderId: string) => ILogProcessor<IRawLogData, IProcessedLogData>;

export class LogTCPServer {
  private server: net.Server;
  private port: number;
  private pipelineFactory: PipelineFactory;

  constructor(port: number, pipelineFactory: PipelineFactory) {
    this.port = port;
    this.pipelineFactory = pipelineFactory;
    this.server = net.createServer((socket) => this.handleConnection(socket));
  }

  public start(): void {
    this.server.listen(this.port, () => {
      console.log(`[Middleware] TCP Server running on port ${this.port}`);
    });
  }

  private handleConnection(socket: net.Socket): void {
    // Her bağlantı için gerçek kaynak adresi senderId olarak kullanılır
    const senderId = `${socket.remoteAddress}:${socket.remotePort}`;
    const pipeline = this.pipelineFactory(senderId);
    const handler = new TCPConnectionHandler(socket, pipeline, senderId);
    handler.initialize();
  }
}

export class TCPConnectionHandler {
  private socket: net.Socket;
  private adapter: ITCPChunkAdapter;
  private pipeline: ILogProcessor<IRawLogData, IProcessedLogData>;
  private senderId: string;
  private queue: IRawLogData[] = [];
  private isPaused: boolean = false;
  private isWorking: boolean = false;

  // Watermark Limit Değerleri (Backpressure için)
  private readonly HIGH_WATERMARK = 10000;
  private readonly LOW_WATERMARK = 2000;
  private readonly BATCH_SIZE = 1000;

  private formatterFactory = initializeFormatterFactory();
  private outputDir: string;

  // Tüm bağlantı boyunca biriken işlenmiş loglar (HTML ve JSON için)
  private allProcessedLogs: IProcessedLogData[] = [];

  // Performans takibi için değişkenler
  private totalProcessed: number = 0;
  private processedInWindow: number = 0;
  private lastMetricTime: number = Date.now();
  private totalLatencyMs: number = 0;
  private batchesInWindow: number = 0;

  constructor(
    socket: net.Socket,
    pipeline: ILogProcessor<IRawLogData, IProcessedLogData>,
    senderId: string
  ) {
    this.socket = socket;
    this.pipeline = pipeline;
    this.senderId = senderId;
    this.adapter = new TCPChunkAdapter();

    // Kök dizinde veya konteynerde output klasörü belirle
    this.outputDir = process.env.OUTPUT_DIR || path.join(process.cwd(), 'output');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  public initialize(): void {
    console.log(`[Middleware] Client connected: ${this.senderId}`);

    // TCP Akış verisi dinlenir
    this.socket.on('data', (chunk: Buffer) => {
      // Soket verileri adaptör ile ayrıştırılır
      this.adapter.pushChunk(chunk, (parsedLogs) => {
        this.enqueue(parsedLogs);
      });
    });

    this.socket.on('close', () => {
      console.log(`[Middleware] Client connection closed: ${this.senderId}`);
      this.flushRemaining();
    });

    this.socket.on('error', (err) => {
      console.error(`[Middleware] Socket error on client ${this.senderId}: ${err.message}`);
    });
  }

  /**
   * Ayrıştırılmış logları sıraya ekler ve gerekirse backpressure tetikler.
   */
  private enqueue(logs: IRawLogData[]): void {
    this.queue.push(...logs);

    // High Watermark eşiği aşılırsa soketi duraklat (Backpressure aktif)
    if (this.queue.length >= this.HIGH_WATERMARK && !this.isPaused) {
      this.socket.pause();
      this.isPaused = true;
      console.warn(`[Backpressure] Log queue size (${this.queue.length}) >= High Watermark (${this.HIGH_WATERMARK}). Pausing TCP socket stream...`);
    }

    this.triggerWorker();
  }

  /**
   * Kuyruktaki logları paketler (batch) halinde asenkron işleyen döngü.
   */
  private async triggerWorker(): Promise<void> {
    if (this.isWorking) return;
    this.isWorking = true;

    try {
      while (this.queue.length > 0) {
        // Belirlenen batch boyutunda logu kuyruktan çek
        const batch = this.queue.slice(0, this.BATCH_SIZE);

        // Zaman ölçümünü başlat
        const startHr = process.hrtime();

        // CoR Zincirini tetikle (Filtrele -> Maskele -> Zenginleştir)
        const processedBatch = await this.pipeline.process(batch);

        // Zaman ölçümünü bitir
        const diffHr = process.hrtime(startHr);
        const latencyMs = (diffHr[0] * 1e9 + diffHr[1]) / 1e6; // ms cinsinden

        // İşlenmiş verileri rollere göre formatla ve diske yaz
        this.exportProcessedLogs(processedBatch);

        // İşlenenleri kuyruktan temizle
        this.queue.splice(0, batch.length);

        // Performans metriklerini güncelle
        this.totalProcessed += batch.length;
        this.processedInWindow += batch.length;
        this.totalLatencyMs += latencyMs;
        this.batchesInWindow += 1;

        // Her 1 saniyede bir metrikleri konsola yazdır
        const now = Date.now();
        const elapsed = now - this.lastMetricTime;
        if (elapsed >= 1000) {
          const logsPerSec = (this.processedInWindow / elapsed) * 1000;
          const avgLatency = this.batchesInWindow > 0 ? (this.totalLatencyMs / this.batchesInWindow) : 0;
          const ramMb = process.memoryUsage().heapUsed / 1024 / 1024;

          console.log(`[Performance Metrics] Total Processed: ${this.totalProcessed} logs | Speed: ${logsPerSec.toFixed(2)} logs/sec | Avg Batch Latency: ${avgLatency.toFixed(2)}ms | RAM Heap: ${ramMb.toFixed(2)} MB | Queue Size: ${this.queue.length}`);

          // Pencere metriklerini sıfırla
          this.processedInWindow = 0;
          this.totalLatencyMs = 0;
          this.batchesInWindow = 0;
          this.lastMetricTime = now;
        }

        // Low Watermark altına inilirse soketi yeniden başlat (Backpressure deaktif)
        if (this.isPaused && this.queue.length <= this.LOW_WATERMARK) {
          this.socket.resume();
          this.isPaused = false;
          console.log(`[Backpressure] Log queue size (${this.queue.length}) <= Low Watermark (${this.LOW_WATERMARK}). Resuming TCP socket stream.`);
        }
      }

      if (this.queue.length === 0 && this.totalProcessed > 0) {
        const ramMb = process.memoryUsage().heapUsed / 1024 / 1024;
        if (this.socket.destroyed) {
          console.log(`[Performance Metrics] SESSION COMPLETED | Total Logs Processed: ${this.totalProcessed} | Final RAM Heap: ${ramMb.toFixed(2)} MB`);
        } else {
          console.log(`[Performance Metrics] Queue Drained | Total Processed: ${this.totalProcessed} logs | RAM Heap: ${ramMb.toFixed(2)} MB`);
        }
      }
    } catch (error: any) {
      console.error(`[Middleware] Queue processing worker encountered an error: ${error.message}`);
    } finally {
      this.isWorking = false;
    }
  }

  /**
   * İşlenmiş verileri biriktirir (akümüle eder) ve formatlanmış dosyalara yazar.
   * HTML ve JSON: tüm oturum boyunca biriken loglar üzerinden üretilir (overwrite sorunu düzeltildi).
   * CSV: sadece yeni batch eklenir (append).
   */
  private exportProcessedLogs(logs: IProcessedLogData[]): void {
    if (logs.length === 0) return;

    // Yeni logları birikimli diziye ekle (HTML/JSON için)
    this.allProcessedLogs.push(...logs);

    try {
      // 1. SYSTEM_ADMIN (HTML Formatı) — birikimli tüm loglar üzerinden üretilir
      const adminFormatter = this.formatterFactory.createFormatter(UserRole.SYSTEM_ADMIN);
      const adminOutput = adminFormatter.format(this.allProcessedLogs);
      fs.writeFileSync(path.join(this.outputDir, 'system_admin.html'), adminOutput, 'utf-8');
      console.log(`[Middleware] Updated ${adminFormatter.getFormatType()} output (${this.allProcessedLogs.length} total logs).`);

      // 2. CYBERSEC (CSV Formatı) — sadece yeni batch'i ekler (append)
      const csvPath = path.join(this.outputDir, 'cybersec.csv');
      const fileExists = fs.existsSync(csvPath);

      const secFormatter = this.formatterFactory.createFormatter(UserRole.CYBERSEC);
      const secOutput = secFormatter.format(logs);

      if (!fileExists) {
        const headers = ['Timestamp', 'Level', 'FullName', 'TCNo', 'CreditCard', 'Email', 'Message', 'SenderId', 'TransactionNo', 'Debug'].join(';');
        fs.writeFileSync(csvPath, headers + '\n' + secOutput + '\n', 'utf-8');
      } else {
        fs.appendFileSync(csvPath, secOutput + '\n', 'utf-8');
      }
      console.log(`[Middleware] Appended ${logs.length} rows to ${secFormatter.getFormatType()} output.`);

      // 3. WEB_DEV (JSON Formatı) — birikimli tüm loglar üzerinden üretilir
      const devFormatter = this.formatterFactory.createFormatter(UserRole.WEB_DEV);
      const devOutput = devFormatter.format(this.allProcessedLogs);
      fs.writeFileSync(path.join(this.outputDir, 'web_dev.json'), devOutput, 'utf-8');
      console.log(`[Middleware] Updated ${devFormatter.getFormatType()} output (${this.allProcessedLogs.length} total logs).`);

    } catch (err: any) {
      console.error(`[Middleware] Failed to export processed logs: ${err.message}`);
    }
  }

  /**
   * Bağlantı kapandığında kuyrukta kalan son verileri işler.
   */
  private flushRemaining(): void {
    if (this.queue.length > 0) {
      console.log(`[Middleware] Flushing remaining ${this.queue.length} logs in queue...`);
      this.triggerWorker();
    }
  }
}
