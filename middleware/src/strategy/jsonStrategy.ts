import { IFormatStrategy } from '../../../shared/interfaces';
import { IProcessedLogData, OutputFormat } from '../../../shared/types';

export class JsonStrategy implements IFormatStrategy {
  public getFormatType(): OutputFormat {
    return OutputFormat.JSON;
  }

  public format(logs: IProcessedLogData[]): string {
    return JSON.stringify(logs, null, 2);
  }
}
