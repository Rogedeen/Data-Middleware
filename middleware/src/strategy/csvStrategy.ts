import { IFormatStrategy } from '../../../shared/interfaces';
import { IProcessedLogData, OutputFormat } from '../../../shared/types';

export class CsvStrategy implements IFormatStrategy {
  public getFormatType(): OutputFormat {
    return OutputFormat.CSV;
  }

  public format(logs: IProcessedLogData[]): string {
    const csvRows: string[] = [];

    for (const log of logs) {
      const row = [
        log.timestamp,
        log.level,
        this.escapeCsv(log.fullName),
        log.tcNo,
        log.creditCard,
        log.email,
        this.escapeCsv(log.message),
        log.senderId || '',
        log.transactionNo || '',
        log.isCritical ? 'true' : 'false',
      ];
      csvRows.push(row.join(';'));
    }

    return csvRows.join('\n');
  }

  private escapeCsv(field: string): string {
    const stringified = String(field);
    if (stringified.includes(';') || stringified.includes('"') || stringified.includes('\n')) {
      return `"${stringified.replace(/"/g, '""')}"`;
    }
    return stringified;
  }
}
