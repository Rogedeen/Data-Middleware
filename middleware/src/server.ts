import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';
import { ITCPChunkAdapter, ILogProcessor } from '../../shared/interfaces';
import { IRawLogData, IProcessedLogData, UserRole } from '../../shared/types';
import { TCPChunkAdapter } from './adapter/chunkAdapter';
import { initializeFormatterFactory } from './factory/formatterFactory';

export class LogTCPServer {
  private server: net.Server;
  private port: number;
  private pipeline: ILogProcessor<IRawLogData, IProcessedLogData>;

  constructor(port: number, pipeline: ILogProcessor<IRawLogData, IProcessedLogData>) {
    this.port = port;
    this.pipeline = pipeline;
    this.server = net.createServer((socket) => this.handleConnection(socket));
  }

  public start(): void {
    this.server.listen(this.port, () => {
      console.log(`[Middleware] TCP Server running on port ${this.port}`);
    });
  }

  private handleConnection(socket: net.Socket): void {
    const handler = new TCPConnectionHandler(socket, this.pipeline);
    handler.initialize();
  }
}

export class TCPConnectionHandler {
  private socket: net.Socket;
  private adapter: ITCPChunkAdapter;
  private pipeline: ILogProcessor<IRawLogData, IProcessedLogData>;
  private queue: IRawLogData[] = [];
  private isPaused: boolean = false;
  private isWorking: boolean = false;

  // Watermark Limit Değerleri (Backpressure için)
  private readonly HIGH_WATERMARK = 10000;
  private readonly LOW_WATERMARK = 2000;
  private readonly BATCH_SIZE = 1000;
  
  private formatterFactory = initializeFormatterFactory();
  private outputDir: string;

  constructor(socket: net.Socket, pipeline: ILogProcessor<IRawLogData, IProcessedLogData>) {
    this.socket = socket;
    this.pipeline = pipeline;
    this.adapter = new TCPChunkAdapter();
    
    // Kök dizinde veya konteynerde output klasörü belirle
    this.outputDir = path.join(process.cwd(), 'output');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  public initialize(): void {
    const clientId = `${this.socket.remoteAddress}:${this.socket.remotePort}`;
    console.log(`[Middleware] Client connected: ${clientId}`);

    // TCP Akış verisi dinlenir
    this.socket.on('data', (chunk: Buffer) => {
      // Soket verileri adaptör ile ayrıştırılır
      this.adapter.pushChunk(chunk, (parsedLogs) => {
        this.enqueue(parsedLogs);
      });
    });

    this.socket.on('close', () => {
      console.log(`[Middleware] Client connection closed: ${clientId}`);
      this.flushRemaining();
    });

    this.socket.on('error', (err) => {
      console.error(`[Middleware] Socket error on client ${clientId}: ${err.message}`);
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
        
        // CoR Zincirini tetikle (Filtrele -> Maskele -> Zenginleştir)
        const processedBatch = await this.pipeline.process(batch);
        
        // İşlenmiş verileri rollere göre formatla ve diske yaz
        this.exportProcessedLogs(processedBatch);
        
        // İşlenenleri kuyruktan temizle
        this.queue.splice(0, batch.length);

        // Low Watermark altına inilirse soketi yeniden başlat (Backpressure deaktif)
        if (this.isPaused && this.queue.length <= this.LOW_WATERMARK) {
          this.socket.resume();
          this.isPaused = false;
          console.log(`[Backpressure] Log queue size (${this.queue.length}) <= Low Watermark (${this.LOW_WATERMARK}). Resuming TCP socket stream.`);
        }
      }
    } catch (error: any) {
      console.error(`[Middleware] Queue processing worker encountered an error: ${error.message}`);
    } finally {
      this.isWorking = false;
    }
  }

  /**
   * İşlenmiş verileri formatlayarak dosyalara yazar.
   */
  private exportProcessedLogs(logs: IProcessedLogData[]): void {
    if (logs.length === 0) return;

    try {
      // 1. SYSTEM_ADMIN (HTML Formatı)
      const adminFormatter = this.formatterFactory.createFormatter(UserRole.SYSTEM_ADMIN);
      const adminOutput = adminFormatter.format(logs);
      fs.writeFileSync(path.join(this.outputDir, 'system_admin.html'), adminOutput, 'utf-8');

      // 2. CYBERSEC (CSV Formatı)
      const secFormatter = this.formatterFactory.createFormatter(UserRole.CYBERSEC);
      const secOutput = secFormatter.format(logs);
      // CSV dosyasına ekleme (append) yapar
      fs.appendFileSync(path.join(this.outputDir, 'cybersec.csv'), secOutput + '\n', 'utf-8');

      // 3. WEB_DEV (JSON Formatı)
      const devFormatter = this.formatterFactory.createFormatter(UserRole.WEB_DEV);
      const devOutput = devFormatter.format(logs);
      fs.writeFileSync(path.join(this.outputDir, 'web_dev.json'), devOutput, 'utf-8');

      console.log(`[Middleware] Exported ${logs.length} processed logs to output files.`);
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
