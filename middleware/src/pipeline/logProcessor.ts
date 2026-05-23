import { ILogProcessor } from '../../../shared/interfaces';

export abstract class LogProcessor<TIn, TOut> implements ILogProcessor<TIn, TOut> {
  protected nextProcessor?: ILogProcessor<TOut, any>;

  public setNext<TNextOut>(next: ILogProcessor<TOut, TNextOut>): ILogProcessor<TOut, TNextOut> {
    this.nextProcessor = next;
    return next;
  }

  public abstract process(logs: TIn[]): Promise<TOut[]>;

  protected async next(logs: TOut[]): Promise<any[]> {
    if (this.nextProcessor) {
      return this.nextProcessor.process(logs);
    }
    return logs;
  }
}
