// shared/types.ts

/**
 * Log seviyelerini temsil eden enum
 */
export enum LogLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

/**
 * Sistem yöneticisi, siber güvenlik ve web geliştirici rolleri
 */
export enum UserRole {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  CYBERSEC = 'CYBERSEC',
  WEB_DEV = 'WEB_DEV'
}

/**
 * Desteklenen çıktı formatları
 */
export enum OutputFormat {
  HTML = 'HTML',
  CSV = 'CSV',
  JSON = 'JSON'
}

/**
 * Producer tarafından üretilen ham log veri modeli
 */
export interface IRawLogData {
  timestamp: string;
  level: LogLevel;
  fullName: string;
  tcNo: string;
  creditCard: string;
  email: string;
  message: string;
  details: string;
}

/**
 * Middleware tarafından işlenmiş, maskelenmiş ve zenginleştirilmiş log veri modeli
 */
export interface IProcessedLogData {
  timestamp: string;
  level: LogLevel;
  fullName: string;         // Orijinal veya maskelenmiş olabilir
  tcNo: string;             // Maskelenmiş
  creditCard: string;       // Maskelenmiş
  email: string;            // Maskelenmiş
  message: string;
  details: string;
  // Zenginleştirme (Builder) ile eklenen alanlar
  senderId?: string;
  transactionNo?: string;
  isCritical?: boolean;
}
