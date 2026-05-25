import { LogTCPServer } from './server';
import { FilterProcessor } from './pipeline/filterProcessor';
import { MaskProcessor } from './pipeline/maskProcessor';
import { EnrichProcessor } from './pipeline/enrichProcessor';
import { LogBuilder } from './builder/logBuilder';
import { IRawLogData, IProcessedLogData } from '../../shared/types';
import { ILogProcessor } from '../../shared/interfaces';

const port = parseInt(process.env.PORT || '3000', 10);

console.log(`[Middleware] Booting up Log Processing Middleware...`);

/**
 * Her yeni TCP bağlantısı için bağımsız bir CoR pipeline örneği üretir.
 * senderId, bağlantının gerçek kaynak adresini (IP:port) taşır.
 * Bu sayede farklı producer bağlantıları birbirinden ayırt edilebilir.
 */
function createPipeline(senderId: string): ILogProcessor<IRawLogData, IProcessedLogData> {
  const filterStep = new FilterProcessor();
  const maskStep = new MaskProcessor();
  const builderInstance = new LogBuilder();
  const enrichStep = new EnrichProcessor(builderInstance, senderId);

  // Adımları birbirine bağla: Filter -> Mask -> Enrich
  filterStep.setNext(maskStep).setNext(enrichStep);

  return filterStep;
}

// TCP Sunucusunu pipeline factory ile başlat
const server = new LogTCPServer(port, createPipeline);
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
