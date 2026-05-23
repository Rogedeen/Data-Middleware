import { LogProcessor } from './logProcessor';
import { IRawLogData, LogLevel } from '../../../shared/types';

export class FilterProcessor extends LogProcessor<IRawLogData, IRawLogData> {
  public async process(logs: IRawLogData[]): Promise<IRawLogData[]> {
    const filtered = logs.filter(
      (log) => log.level !== LogLevel.INFO && log.level !== LogLevel.WARNING
    );

    const droppedCount = logs.length - filtered.length;
    if (droppedCount > 0) {
      console.log(`[FilterProcessor] Filtered out ${droppedCount} logs (LogLevel: INFO/WARNING dropped).`);
    }

    return this.next(filtered);
  }
}
