import { LogProducer } from './client';

// Çevre değişkenlerini oku (varsayılan değerlerle)
const host = process.env.MIDDLEWARE_HOST || 'localhost';
const port = parseInt(process.env.MIDDLEWARE_PORT || '3000', 10);
const chunkSize = parseInt(process.env.CHUNK_SIZE || '500', 10);
const intervalMs = parseInt(process.env.GENERATION_INTERVAL_MS || '100', 10);

console.log(`[Producer] Starting Data Generator with configurations:`);
console.log(`- Middleware: ${host}:${port}`);
console.log(`- Chunk Size: ${chunkSize} logs`);
console.log(`- Interval: ${intervalMs} ms`);

const producer = new LogProducer(host, port, chunkSize, intervalMs);
producer.connect();

// Uygulama sonlanırken soket bağlantısını kapat
process.on('SIGINT', () => {
  console.log('[Producer] Gracefully shutting down...');
  producer.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[Producer] Gracefully shutting down...');
  producer.stop();
  process.exit(0);
});
