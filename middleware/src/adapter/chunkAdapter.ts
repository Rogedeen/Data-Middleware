import { ITCPChunkAdapter } from '../../../shared/interfaces';
import { IRawLogData } from '../../../shared/types';

export class TCPChunkAdapter implements ITCPChunkAdapter {
  private buffer: string = '';

  public pushChunk(chunk: Buffer, callback: (logs: IRawLogData[]) => void): void {
    // Ham veriyi utf-8 string olarak ekle
    this.buffer += chunk.toString('utf-8');

    // NDJSON satır ayracı (\n) ile parçala
    const parts = this.buffer.split('\n');

    // Son eleman tam bir satır olmayabilir (paket bölünmesi), tamponda tutulur
    this.buffer = parts.pop() || '';

    const logs: IRawLogData[] = [];
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed === '') continue;

      try {
        // Her geçerli NDJSON satırı, bir IRawLogData dizisidir (chunk)
        const parsedLogs: IRawLogData[] = JSON.parse(trimmed);
        if (Array.isArray(parsedLogs)) {
          logs.push(...parsedLogs);
        } else {
          logs.push(parsedLogs);
        }
      } catch (err: any) {
        console.error(`[TCPChunkAdapter] Failed to parse JSON frame: ${trimmed.slice(0, 100)}... Error: ${err.message}`);
      }
    }

    if (logs.length > 0) {
      callback(logs);
    }
  }
}
