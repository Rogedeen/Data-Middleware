import { ILogBuilder } from '../../../shared/interfaces';
import { IRawLogData, IProcessedLogData, LogLevel } from '../../../shared/types';

export class LogBuilder implements ILogBuilder {
  private log!: Partial<IProcessedLogData>;

  public reset(rawLog: IRawLogData): ILogBuilder {
    this.log = {
      timestamp: rawLog.timestamp,
      level: rawLog.level,
      fullName: rawLog.fullName,
      tcNo: rawLog.tcNo,
      creditCard: rawLog.creditCard,
      email: rawLog.email,
      message: rawLog.message,
      details: rawLog.details,
    };
    return this;
  }

  public setSenderId(senderId: string): ILogBuilder {
    this.log.senderId = senderId;
    return this;
  }

  public setTransactionNo(transactionNo: string): ILogBuilder {
    this.log.transactionNo = transactionNo;
    return this;
  }

  public setIsCritical(level: LogLevel): ILogBuilder {
    // ERROR ve CRITICAL log seviyeleri 'critical' olarak işaretlenir
    this.log.isCritical = level === LogLevel.CRITICAL || level === LogLevel.ERROR;
    return this;
  }

  public build(): IProcessedLogData {
    if (
      !this.log.timestamp ||
      !this.log.level ||
      !this.log.fullName ||
      !this.log.tcNo ||
      !this.log.creditCard ||
      !this.log.email
    ) {
      throw new Error('[LogBuilder] Validation error: Missing required base fields for logging.');
    }
    
    return this.log as IProcessedLogData;
  }
}
