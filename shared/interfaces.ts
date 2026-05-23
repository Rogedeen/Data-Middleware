// shared/interfaces.ts

import { 
  IRawLogData, 
  IProcessedLogData, 
  UserRole, 
  IFormatStrategy as IFormatStrategyType, // avoid naming circular references if any
  OutputFormat,
  LogLevel
} from './types';

/**
 * 1. ADAPTER PATTERN
 * TCP socket üzerinden gelen ham Buffer yığınlarını (chunks)
 * işlenebilir IRawLogData dizilerine dönüştüren adaptör arayüzü.
 */
export interface ITCPChunkAdapter {
  /**
   * Soketten gelen ham veri yığınını biriktirir ve geçerli JSON paketlerini (dizilerini) ayrıştırır.
   * @param chunk Gelen raw TCP verisi
   * @param callback Tamamlanan log dizilerini ileten callback fonksiyonu
   */
  pushChunk(chunk: Buffer, callback: (logs: IRawLogData[]) => void): void;
}

/**
 * 2. CHAIN OF RESPONSIBILITY PATTERN
 * Log işleme adımlarını (Filtreleme -> Maskeleme -> Zenginleştirme)
 * birbirine bağlayan ve sırayla çalıştıran zincir halkası arayüzü.
 */
export interface ILogProcessor<TIn = any, TOut = any> {
  /**
   * Zincirdeki bir sonraki halkayı belirler.
   * @param next Bir sonraki işlemci
   */
  setNext(next: ILogProcessor<any, any>): ILogProcessor<any, any>;

  /**
   * Log verilerini işler ve varsa bir sonraki halkaya iletir.
   * @param logs İşlenecek log dizisi
   */
  process(logs: TIn[]): Promise<TOut[]>;
}

/**
 * 3. BUILDER PATTERN
 * Log zenginleştirme (enrichment) aşamasında, karmaşık log nesnelerini
 * adım adım inşa etmek için kullanılan arayüz.
 */
export interface ILogBuilder {
  /**
   * Builder'ı yeni bir ham log ile sıfırlar.
   * @param rawLog Temel alınacak log verisi
   */
  reset(rawLog: IRawLogData): ILogBuilder;

  /**
   * Gönderici ID bilgisini ekler.
   */
  setSenderId(senderId: string): ILogBuilder;

  /**
   * Benzersiz işlem numarası (transaction no) ekler.
   */
  setTransactionNo(transactionNo: string): ILogBuilder;

  /**
   * Log seviyesine göre kritiklik durumunu belirler.
   * @param level Log seviyesi
   */
  setIsCritical(level: LogLevel): ILogBuilder;

  /**
   * Son halini almış IProcessedLogData nesnesini döner.
   */
  build(): IProcessedLogData;
}

/**
 * 4. STRATEGY PATTERN
 * Son kullanıcı rollerine göre farklı formatlarda (HTML, CSV, JSON)
 * çıktı üreten biçimlendirme stratejileri için ortak arayüz.
 */
export interface IFormatStrategy {
  /**
   * İşlenmiş log verilerini ilgili formata çevirir.
   * @param logs Biçimlendirilecek log dizisi
   */
  format(logs: IProcessedLogData[]): string;

  /**
   * Stratejinin desteklediği çıktı formatını döner.
   */
  getFormatType(): OutputFormat;
}

/**
 * 5. FACTORY METHOD PATTERN
 * Kullanıcının rolüne (System Admin, Cybersec, Web Dev) göre 
 * doğru formatlama stratejisini üreten fabrika sınıfı arayüzü.
 */
export interface IFormatterFactory {
  /**
   * Kullanıcı rolüne göre doğru formatlayıcıyı (Strategy) döner.
   * @param role Kullanıcı rolü
   */
  createFormatter(role: UserRole): IFormatStrategy;
}
