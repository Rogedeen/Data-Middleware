import { LogTCPServer } from './server';
import { FilterProcessor } from './pipeline/filterProcessor';
import { MaskProcessor } from './pipeline/maskProcessor';
import { EnrichProcessor } from './pipeline/enrichProcessor';
import { LogBuilder } from './builder/logBuilder';

const port = parseInt(process.env.PORT || '3000', 10);
const senderId = process.env.SENDER_ID || 'CENG302-MIDDLEWARE';

console.log(`[Middleware] Booting up Log Processing Middleware...`);

// 1. Chain of Responsibility (CoR) Zincirini İnşa Et
const filterStep = new FilterProcessor();
const maskStep = new MaskProcessor();
const builderInstance = new LogBuilder();
const enrichStep = new EnrichProcessor(builderInstance, senderId);

// Adımları birbirine bağla: Filter -> Mask -> Enrich
filterStep.setNext(maskStep).setNext(enrichStep);

// 2. TCP Sunucusunu Pipeline ile Başlat
const server = new LogTCPServer(port, filterStep);
server.start();

// Uygulama sonlanırken düzgün kapatma işlemleri
process.on('SIGINT', () => {
  console.log('[Middleware] Shutting down TCP Server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[Middleware] Shutting down TCP Server...');
  process.exit(0);
});
