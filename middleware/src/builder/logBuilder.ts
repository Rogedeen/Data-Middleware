import { ILogBuilder } from '../../../shared/interfaces';
import { IRawLogData, IProcessedLogData } from '../../../shared/types';

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
      debug: rawLog.debug,
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

  public build(): IProcessedLogData {
    if (!this.log) {
      throw new Error('[LogBuilder] build() called before reset(). You must call reset(rawLog) first.');
    }
    if (
      !this.log.timestamp ||
      !this.log.level ||
      !this.log.fullName ||
      !this.log.tcNo ||
      !this.log.creditCard ||
      !this.log.email ||
      !this.log.message
    ) {
      throw new Error('[LogBuilder] Validation error: Missing required base fields for logging.');
    }
    
    return {
      timestamp: this.log.timestamp,
      level: this.log.level,
      fullName: this.log.fullName,
      tcNo: this.log.tcNo,
      creditCard: this.log.creditCard,
      email: this.log.email,
      message: this.log.message,
      senderId: this.log.senderId,
      transactionNo: this.log.transactionNo,
      debug: this.log.debug || ''
    };
  }
}
