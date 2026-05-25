import { LogProcessor } from './logProcessor';
import { IRawLogData, IProcessedLogData } from '../../../shared/types';
import { ILogBuilder } from '../../../shared/interfaces';
import * as crypto from 'crypto';

export class EnrichProcessor extends LogProcessor<IRawLogData, IProcessedLogData> {
  private builder: ILogBuilder;
  private senderId: string;

  constructor(builder: ILogBuilder, senderId: string) {
    super();
    this.builder = builder;
    this.senderId = senderId;
  }

  public async process(logs: IRawLogData[]): Promise<IProcessedLogData[]> {
    const enriched = logs.map((log) => {
      // UUID olarak benzersiz işlem numarası oluşturulur
      const transactionNo = crypto.randomUUID();

      return this.builder
        .reset(log)
        .setSenderId(this.senderId)
        .setTransactionNo(transactionNo)
        .build();
    });

    return this.next(enriched);
  }
}
